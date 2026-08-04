// The registry, the probes, and the state read/write.
//
// ── WHY THIS EXISTS ───────────────────────────────────────────────────────────────────────────
// Fifteen vendors sit under one client. Every one of their dashboards sees exactly one vendor, so
// nothing anywhere answers "is this customer's machine healthy" — and the failures that matter are
// the ones where BOTH ends report success on their own side. Design + the full 31 joints:
// ~/SJC/CEO/_ops/JOINT-MONITORING-DESIGN.md
//
// ── WHAT THIS FIRST PASS DELIBERATELY IS ──────────────────────────────────────────────────────
// Only checks that need NO new credentials. Everything here runs today with what is already in the
// environment. A vendor whose key isn't set records `skipped` (yellow), never `pass` — an
// unconfigured probe must never be able to look like a healthy one.
//
// ── WHERE THE STATE LIVES, AND THE ONE TRADE ──────────────────────────────────────────────────
// One document under `sjc-checks-board` through lib/store, which means Postgres with the write
// guard, and — because every write appends a row to state_rev — free history. So "append-only run
// log" is already true underneath us without a new table.
// ⚠️ The trade: state_rev holds whole SNAPSHOTS, not per-run rows, so you can see what the board
// looked like at any past moment but cannot cheaply query "every failure of check X". When the
// real check_runs table lands, this file is the only thing that changes.
import { getClient } from "./store";
import { readSites } from "./sites";
import { publicUrlFor } from "./hostShared";
import type { Site } from "./sitesShared";
import type { Board, CheckDef, CheckRun, CheckState } from "./checksShared";

const KEY = "sjc-checks-board";

const MIN = 60;
const HOUR = 3600;
const DAY = 86400;

/**
 * WHAT IS WATCHED.
 *
 * Every entry carries its own runbook, because a board that tells you something is broken and not
 * what to do about it just relocates the problem.
 */
export const CHECKS: CheckDef[] = [
  {
    id: "store.durable",
    label: "The durable store is answering",
    layer: 1,
    scope: "global",
    expectation: "Postgres is the engine (not the cache fallback) and a read round-trips.",
    runbook:
      "Running on the cache means no save history and no write guard — the pre-migration state. " +
      "Check DATABASE_URL in Vercel, then re-read /api/health.",
    cadenceSeconds: 15 * MIN,
    freshSeconds: 45 * MIN,
    staleSeconds: 3 * HOUR,
  },
  {
    id: "resend.domain",
    label: "The lead-alert sending domain is verified",
    layer: 1,
    scope: "global",
    expectation: "Every domain on the Resend account reports status `verified`.",
    runbook:
      "ONE sending domain sends for every client, so a lapse silences every lead alert at once — " +
      "and the send API keeps returning success while it does. Re-add the DKIM/SPF records at " +
      "whatever DNS host holds the zone now, then Verify. Replay missed alerts from the sheets. " +
      "⚠️ GREY here means the opposite of a problem: the key is sending-scoped and simply cannot " +
      "read the domain list. To turn this tile green rather than grey, the board needs a key with " +
      "domain read access — which is a real privilege increase for a read, so leaving it grey is a " +
      "legitimate choice. Grey is honest; it is not an alarm.",
    cadenceSeconds: 6 * HOUR,
    freshSeconds: 12 * HOUR,
    staleSeconds: 2 * DAY,
  },
  {
    id: "site.reachable",
    // ⛔ NEVER "her"/"his" ANYWHERE A BUSINESS IS MEANT. We do not know who owns the company — a
    // man, a woman, a veteran — and guessing wrong in a tile Steven reads every morning trains the
    // wrong habit into the copy that eventually faces the customer. The business is THEY.
    label: "Their website answers, and it is THEIRS",
    layer: 2,
    scope: "site",
    expectation:
      "Fetching their public address returns 200 AND the HTML contains their business name.",
    runbook:
      "An unknown host resolves to SJC by design — that is what stops a new hostname taking the " +
      "selling site down. The cost is that a domain typo or a missing Vercel attachment sends " +
      "their customers to Steven's site with no error anywhere. Attach the domain in Vercel or fix the " +
      "A record. Every visitor in the window is lost, so this is red on the first failure.",
    cadenceSeconds: HOUR,
    freshSeconds: 3 * HOUR,
    staleSeconds: 12 * HOUR,
  },
  {
    id: "site.domain_expiry",
    label: "Their domain registration is not about to lapse",
    layer: 1,
    scope: "site",
    expectation: "The registry says the domain expires more than 45 days from now.",
    runbook:
      "Yellow at 45 days, red at 10. Renewing is minutes; past the ~18-day grace it is redemption " +
      "at roughly $80-100 plus the renewal. ⚠️ The real annual dependency is the CARD behind " +
      "auto-renew, not the domain — check both, and re-check DNS after any restore because a " +
      "restored zone can come back parked.",
    cadenceSeconds: 12 * HOUR,
    freshSeconds: DAY,
    staleSeconds: 4 * DAY,
  },
  {
    id: "site.lead_destination",
    label: "Their leads have somewhere to go",
    layer: 2,
    scope: "site",
    expectation:
      "A client site has a lead email, a sheet, and a CRM webhook — and shares none of them " +
      "with another client.",
    runbook:
      "⛔ Two live sites sharing a lead email or a GHL webhook is client A's enquiries landing in " +
      "client B's inbox. That ends the retainer and the referral behind it, so it is red on the " +
      "first sighting, never yellow. Fix in Website settings. A missing destination is yellow — " +
      "they are paying for a lead record they do not have.",
    cadenceSeconds: 6 * HOUR,
    freshSeconds: 12 * HOUR,
    staleSeconds: 2 * DAY,
  },
];

export const CHECK_BY_ID = new Map(CHECKS.map((c) => [c.id, c]));

// ── state ──────────────────────────────────────────────────────────────────────────────────────

export async function readBoard(): Promise<Board> {
  try {
    const kv = getClient();
    const raw = kv ? await kv.get(KEY) : null;
    if (!raw) return { states: [] };
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    return { updatedAt: parsed?.updatedAt, states: Array.isArray(parsed?.states) ? parsed.states : [] };
  } catch {
    // A board that can't be read must not take the page down with it.
    return { states: [] };
  }
}

const keyOf = (checkId: string, siteId?: string) => `${checkId}::${siteId || ""}`;

/**
 * Fold a batch of runs into the stored state.
 *
 * ⚠️ `consecutiveFails` resets to 0 on any pass, and `lastPassAt` only ever moves forward on a
 * pass. That is what lets a fixed joint clear itself without anyone acknowledging anything — the
 * sync-ceo.sh lesson, where a light could never clear its own FAIL and so stayed red forever after
 * the underlying problem was gone.
 *
 * ⚠️ `skipped` deliberately does NOT refresh lastPassAt. An unconfigured or un-evaluatable check
 * ages out of green on its own rather than masquerading as health.
 */
export async function recordRuns(runs: CheckRun[]): Promise<void> {
  const kv = getClient();
  if (!kv) return;

  const board = await readBoard();
  const byKey = new Map(board.states.map((s) => [keyOf(s.checkId, s.siteId), s]));

  for (const run of runs) {
    const k = keyOf(run.checkId, run.siteId);
    const prev = byKey.get(k);
    const failed = run.status === "fail";
    byKey.set(k, {
      checkId: run.checkId,
      siteId: run.siteId,
      lastRunAt: run.at,
      lastPassAt: run.status === "pass" ? run.at : prev?.lastPassAt,
      lastStatus: run.status,
      lastDetail: run.detail,
      lastEvidence: run.evidence,
      consecutiveFails: failed ? (prev?.consecutiveFails || 0) + 1 : 0,
      since: prev?.lastStatus === run.status ? prev.since || run.at : run.at,
    });
  }

  await kv.set(KEY, JSON.stringify({ updatedAt: new Date().toISOString(), states: [...byKey.values()] }));
}

// ── the probes ─────────────────────────────────────────────────────────────────────────────────

const now = () => new Date().toISOString();

/** Never let one dead vendor stop the sweep — the second failure would look like a regression. */
async function safely(id: string, siteId: string | undefined, fn: () => Promise<CheckRun>): Promise<CheckRun> {
  const started = Date.now();
  try {
    const r = await fn();
    return { ...r, latencyMs: Date.now() - started };
  } catch (e) {
    return {
      checkId: id,
      siteId,
      status: "fail",
      detail: `the check itself threw: ${(e as Error)?.message || e}`,
      evidence: { threw: true },
      at: now(),
      latencyMs: Date.now() - started,
    };
  }
}

async function checkStore(): Promise<CheckRun> {
  const { backend } = await import("./store");
  const engine = backend();
  const kv = getClient();
  let readOk = false;
  if (kv) {
    await kv.get("sjc-puck-home-pub");
    readOk = true;
  }
  const durable = engine === "postgres";
  return {
    checkId: "store.durable",
    status: durable && readOk ? "pass" : "fail",
    detail: durable
      ? readOk
        ? "Postgres answered a read."
        : "Postgres is configured but the read did not complete."
      : `RUNNING ON ${engine} — no save history, no write guard.`,
    evidence: { engine, readOk },
    at: now(),
  };
}

async function checkResendDomain(): Promise<CheckRun> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    // ⚠️ skipped, never pass. An unset key must not render as a healthy sending domain.
    return {
      checkId: "resend.domain",
      status: "skipped",
      detail: "RESEND_API_KEY is not set, so nothing verified the sending domain.",
      evidence: { configured: false },
      at: now(),
    };
  }
  const res = await fetch("https://api.resend.com/domains", {
    headers: { Authorization: `Bearer ${key}` },
  });

  // ⚠️ "I AM NOT ALLOWED TO LOOK" IS NOT "THE THING IS BROKEN."
  //
  // A Resend key is scoped either `Sending access` or `Full access`, and SJC's is sending-only —
  // correct for what it does, and unable to read /domains, which answers 401. The first version
  // reported that as "the lead-alert sending domain is verified: FAIL", i.e. the loudest red on the
  // board, for an account where nothing whatsoever was wrong. That is the failure mode that gets a
  // board closed and never reopened, so it is worth more care than the outage it was watching for.
  //
  // Grey, not red, and the tile says which it is. The distinction the board has to preserve:
  // a thing that is broken, versus a thing nobody has been able to check.
  if (res.status === 401 || res.status === 403) {
    return {
      checkId: "resend.domain",
      status: "skipped",
      detail:
        `The Resend key is scoped for sending only, so it cannot read the domain list (${res.status}). ` +
        `Email is unaffected — nothing here says the domain is bad, only that this key can't confirm it.`,
      evidence: { http: res.status, reason: "key lacks domain read scope" },
      at: now(),
    };
  }

  const body = await res.json().catch(() => null);
  const domains: { name?: string; status?: string }[] = body?.data || [];
  const bad = domains.filter((d) => d.status !== "verified");
  return {
    checkId: "resend.domain",
    status: !res.ok ? "fail" : bad.length ? "fail" : domains.length ? "pass" : "warn",
    detail: !res.ok
      ? `Resend replied ${res.status}.`
      : bad.length
        ? `not verified: ${bad.map((d) => `${d.name} (${d.status})`).join(", ")}`
        : domains.length
          ? `${domains.length} domain(s) verified: ${domains.map((d) => d.name).join(", ")}`
          : "the Resend account has no sending domains at all.",
    evidence: { http: res.status, domains: domains.map((d) => ({ name: d.name, status: d.status })) },
    at: now(),
  };
}

async function checkSiteReachable(site: Site): Promise<CheckRun> {
  const url = publicUrlFor(site);
  const res = await fetch(url, { redirect: "follow", headers: { "user-agent": "sjc-checks/1" } });
  const html = await res.text();
  const name = (site.business?.name || site.name || "").trim();

  // ⚠️ A 200 IS NOT THE ASSERTION. lib/host.ts resolves an unknown host to SJC, so a misconfigured
  // domain answers 200 all day while serving Steven's consulting site to their customers. The name
  // appearing in the HTML is the only thing that proves the page is THEIRS.
  const isHers = name ? html.toLowerCase().includes(name.toLowerCase()) : res.ok;
  return {
    checkId: "site.reachable",
    siteId: site.id,
    status: res.ok && isHers ? "pass" : "fail",
    detail: !res.ok
      ? `${url} replied ${res.status}.`
      : isHers
        ? `${url} answered 200 and the page names ${name || "the business"}.`
        : `${url} answered 200 but the page never mentions "${name}" — it is probably serving SJC.`,
    evidence: { url, http: res.status, nameFound: isHers, bytes: html.length },
    at: now(),
  };
}

async function checkDomainExpiry(site: Site): Promise<CheckRun> {
  const domain = (site.domain || "").replace(/^www\./, "").trim();
  if (!domain) {
    return {
      checkId: "site.domain_expiry",
      siteId: site.id,
      status: "skipped",
      detail: "No domain yet — they are on the demo address, so there is nothing to expire.",
      evidence: { domain: null },
      at: now(),
    };
  }

  // RDAP, not the registrar's own API: no auth, no plan gate, and identical for whichever
  // registrar a client happens to already use. The registrar API would need a key per registrar.
  const res = await fetch(`https://rdap.org/domain/${encodeURIComponent(domain)}`, {
    headers: { accept: "application/rdap+json" },
  });
  if (!res.ok) {
    return {
      checkId: "site.domain_expiry",
      siteId: site.id,
      status: "warn",
      detail: `RDAP replied ${res.status} for ${domain} — expiry unknown, so treat it as unverified.`,
      evidence: { domain, http: res.status },
      at: now(),
    };
  }
  const body = await res.json();
  const events: { eventAction?: string; eventDate?: string }[] = body?.events || [];
  const exp = events.find((e) => e.eventAction === "expiration")?.eventDate;
  const statuses: string[] = body?.status || [];
  const bad = statuses.filter((s) => /hold|redemption|pendingDelete/i.test(s));

  if (!exp) {
    return {
      checkId: "site.domain_expiry",
      siteId: site.id,
      status: "warn",
      detail: `RDAP answered for ${domain} but gave no expiry date.`,
      evidence: { domain, statuses },
      at: now(),
    };
  }

  const days = Math.round((Date.parse(exp) - Date.now()) / 86400000);
  const status = bad.length || days <= 10 ? "fail" : days <= 45 ? "warn" : "pass";
  return {
    checkId: "site.domain_expiry",
    siteId: site.id,
    status,
    detail: bad.length
      ? `${domain} is in ${bad.join(", ")} — it is already past due.`
      : `${domain} expires in ${days} days (${exp.slice(0, 10)}).`,
    evidence: { domain, expires: exp, days, statuses },
    at: now(),
  };
}

/**
 * Pure config audit — no vendor is called, so this one can never be wrong about the outside world.
 * It answers the question nothing else does: is there a destination at all, and is it theirs alone.
 */
function checkLeadDestinations(site: Site, all: Site[]): CheckRun {
  const email = (site.leadEmail || "").trim().toLowerCase();
  const ghl = (site.ghlWebhookUrl || "").trim();
  const missing: string[] = [];
  if (!email) missing.push("no lead email");
  if (!site.sheetId) missing.push("no sheet");
  if (!ghl) missing.push("no CRM webhook");

  const others = all.filter((s) => s.id !== site.id && s.kind === "client" && !s.deletedAt);
  // Ternaries rather than `email && find(...)`: `&&` on an empty string yields "" rather than
  // undefined, and a collision variable that can be a string is a collision variable that lies.
  const sharedEmail = email
    ? others.find((s) => (s.leadEmail || "").trim().toLowerCase() === email)
    : undefined;
  const sharedGhl = ghl ? others.find((s) => (s.ghlWebhookUrl || "").trim() === ghl) : undefined;
  const sharedSheet = site.sheetId
    ? others.find((s) => s.sheetId === site.sheetId)
    : undefined;

  const collision: Site | undefined = sharedEmail || sharedGhl || sharedSheet;
  return {
    checkId: "site.lead_destination",
    siteId: site.id,
    // ⛔ A collision is RED on sight. Missing is yellow — they are owed something they haven't got.
    // Shared is a different animal: their customer's enquiry arrives in someone else's inbox.
    status: collision ? "fail" : missing.length ? "warn" : "pass",
    detail: collision
      ? `SHARES A DESTINATION with ${collision.name} — leads can land in that inbox instead.`
      : missing.length
        ? `${missing.join(", ")}.`
        : "email, sheet and CRM webhook all set, and none shared with another client.",
    evidence: {
      hasEmail: Boolean(email),
      hasSheet: Boolean(site.sheetId),
      hasGhl: Boolean(ghl),
      collidesWith: collision ? collision.id : null,
    },
    at: now(),
  };
}

/** Run everything. Never throws — a sweep that dies halfway leaves a board that lies. */
export async function runAllChecks(): Promise<CheckRun[]> {
  const runs: CheckRun[] = [];
  runs.push(await safely("store.durable", undefined, checkStore));
  runs.push(await safely("resend.domain", undefined, checkResendDomain));

  const all = await readSites();
  const clients = all.filter((s) => s.kind === "client" && !s.deletedAt);

  for (const site of clients) {
    runs.push(await safely("site.reachable", site.id, () => checkSiteReachable(site)));
    runs.push(await safely("site.domain_expiry", site.id, () => checkDomainExpiry(site)));
    runs.push(await safely("site.lead_destination", site.id, async () => checkLeadDestinations(site, all)));
  }

  return runs;
}
