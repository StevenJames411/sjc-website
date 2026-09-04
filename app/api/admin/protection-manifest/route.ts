// WHAT IS ACTUALLY LIVE, AND THEREFORE WHAT IS ACTUALLY WORTH PROTECTING.
//
// ── WHY THIS EXISTS ───────────────────────────────────────────────────────────────────────────
// Steven's loudest complaint, 141 mentions across three months: *"We keep protecting against shit
// that doesn't even matter."* His diagnosis, and it is the right one:
//
//   "Your defaults protect everything. What they need to do is check each customer and basically
//    know where the protections should lie, which takes three seconds to sweep in the background."
//
// An assistant's caution is calibrated for an operator with production traffic and customers to
// lose. He has neither yet, so correct-in-general is absurd here — and it does not stop at the
// account level: on Alamo Slim, a REAL client, protection still got applied to plumbing that clinic
// never touched.
//
// ⛔ THE FIX IS A LOOKUP, NOT A RULE AND NOT A FACT.
//   • A rule ("stop protecting what doesn't matter") is a disposition, and dispositions do not
//     bind — 141 attempts prove it.
//   • A hardcoded fact ("there is no audience yet") is worse: it goes FALSE the day the first real
//     customer lands, and would keep being applied. That is the stale-fact trap.
//   • Computed state is neither. It cannot go stale, and it ARMS ITSELF the moment a site takes a
//     real lead or goes live and indexable.
//
// ── ONE BRAIN, TWO SURFACES ───────────────────────────────────────────────────────────────────
// Every input below is the same function the Design Studio's site cards already call —
// `reachability` and `leadWiring` from lib/sitesShared. That is deliberate: Steven reads the cards,
// Claude reads this, and they can never disagree about whether something is live.
//
//   GET /api/admin/protection-manifest            -> JSON
//   GET /api/admin/protection-manifest?format=md  -> the markdown block loaded at session start
//
// ⛔ READ-ONLY. Nothing here writes, and it must stay that way — it is the thing that decides how
// careful to be, so it can never be the thing that changed something.
//
// ⛔ OWNER-ONLY by middleware (`/api/admin/*`), reachable by the SITE_EDIT_TOKEN bearer for the
// unattended sweep. It reports lead COUNTS, never lead contents.
import { readSites } from "@/lib/sites";
import { readLeads } from "@/lib/leadStore";
import { reachability, leadWiring, type Site } from "@/lib/sitesShared";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type Row = {
  id: string;
  name: string;
  kind: string;
  status: string;
  domain: string;
  onDomain: boolean;
  indexable: boolean;
  /** REAL submissions from REAL people. The strongest protect signal there is. */
  leads: number;
  /** Someone is actually told when a lead arrives (not merely filed to a sheet). */
  notified: boolean;
  surfaces: string[];
  verdict: "PROTECTED" | "FREE";
  why: string;
};

/**
 * IS THIS LEAD ONE OF OURS?
 *
 * ⛔ COUNTING ROWS IS NOT COUNTING CUSTOMERS, AND THE DIFFERENCE COST A WHOLE SESSION (2026-09-04).
 * `sjc-2026` sat PROTECTED on "4 real lead(s) stored — someone's actual contact details live
 * here". All four were ours: three `ZZ-TEST` rows from the apex-wiring, new-sender and careers
 * pipeline checks — two of them labelled "safe to delete" in the form itself — and Steven's own
 * careers application, submitted from his own address while testing that form. The manifest exists
 * to say what is real; a smoke test that arms it is the exact false PROTECTED it was built to end.
 *
 * ⚠️ THE TEST FOR "OURS" IS DELIBERATELY NARROW. Only four signals count, and each one is
 * something no stranger can produce by accident: the ZZ-TEST marker we type on purpose, the
 * reserved `example.com` domain (RFC 2606 — it cannot belong to a real prospect), an address that
 * already owns this site, and the address this site DELIVERS ITS LEADS TO. That last one is the
 * one that caught Steven's careers application: a form submitted by the person who receives that
 * form's own leads is a test by definition — a stranger cannot be their own destination.
 * Anything else is a stranger and still arms protection.
 */
function isOurs(
  lead: { answers?: { label?: string; value?: string }[] },
  ownerEmails: string[],
  leadEmail?: string
): boolean {
  const owners = new Set(
    [...ownerEmails, leadEmail || ""].map((e) => (e || "").trim().toLowerCase()).filter(Boolean)
  );
  for (const a of lead.answers || []) {
    const v = String(a?.value ?? "").trim().toLowerCase();
    if (!v) continue;
    if (v.includes("zz-test")) return true;
    if (/@example\.(com|org|net)$/.test(v)) return true;
    if (owners.has(v)) return true;
  }
  return false;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const wantMd = url.searchParams.get("format") === "md";

  const sites = await readSites();
  const rows: Row[] = [];

  for (const s of sites as Site[]) {
    const reach = reachability(s);
    const wiring = leadWiring(s, sites);

    // ⚠️ Never let a failed read look like "no leads" — an empty result and an unreachable store
    // are opposite answers, and treating them the same is how a real client's site gets marked FREE.
    let leads = -1;
    let ourTests = 0;
    try {
      const stored = await readLeads(s.id);
      const ours = stored.filter((l) => isOurs(l, s.ownerEmails || [], s.leadEmail));
      ourTests = ours.length;
      // Only STRANGERS count. See isOurs() above for why, and for what it refuses to guess at.
      leads = stored.length - ourTests;
    } catch {
      leads = -1;
      ourTests = 0;
    }

    // ⛔ PER-SURFACE, NOT JUST PER-SITE. This is the Alamo Slim correction: name which plumbing is
    // actually carrying something, so unused plumbing stays FREE even on a protected client.
    const surfaces: string[] = [];
    if (reach.onDomain) surfaces.push(`domain:${s.domain}${reach.indexable ? "+indexed" : "+noindex"}`);
    if (reach.onDemo) surfaces.push("demo-url");
    if (leads > 0) surfaces.push(`leads:${leads}`);
    // Named, never hidden. A site whose only rows are ours should SAY so, or the next reader finds
    // four rows in the store, a manifest claiming none, and no way to tell which one is lying.
    if (ourTests > 0) surfaces.push(`our-tests:${ourTests}`);
    if (leads === -1) surfaces.push("leads:UNREADABLE");
    if (wiring.hasSheet) surfaces.push("sheet");
    if (wiring.hasGhl) surfaces.push("ghl");
    if (wiring.hasEmail) surfaces.push("email");
    if (s.chloe?.attached) surfaces.push("chloe");

    // The verdict. Deliberately narrow — the whole point is that MOST things come back FREE.
    //
    // ⚠️ A CLIENT COUNTS AS A CLIENT EVEN IN DRAFT — Steven's call, 2026-08-14. This briefly
    // required a client site to be REACHABLE before protecting it, which flipped
    // `steven-james-designs` to FREE. He overruled it: *"It's okay if it files a customer in a
    // draft state like it's a customer, because I have so few customers… don't get carried away
    // with tightening shit up just yet."*
    //
    // He is right about the asymmetry. At this headcount a false PROTECTED costs one confirmation;
    // a false FREE costs a real client's work. The FREE list is still doing its job — the demo and
    // draft sites, which are the bulk, come back FREE regardless. Revisit only when the client
    // count makes the extra confirmations actually cost something.
    let verdict: Row["verdict"] = "FREE";
    let why = "draft/demo, no real leads — change, rename, delete or rebuild freely";
    if (leads > 0) {
      verdict = "PROTECTED";
      why = `${leads} real lead(s) stored — someone's actual contact details live here`;
    } else if (leads === -1) {
      // Fails to the SAFE side, loudly.
      verdict = "PROTECTED";
      why = "lead store unreadable — cannot prove it is empty, so treat as real";
    } else if (reach.onDomain && reach.indexable) {
      verdict = "PROTECTED";
      why = `live at ${s.domain} and indexable — the public can find it`;
    } else if (s.kind === "client" && (reach.onDomain || wiring.notifiesSomeone)) {
      verdict = "PROTECTED";
      why = reach.onDomain
        ? `a client site reachable at ${s.domain} — it is their business, indexed or not`
        : "a client site with lead delivery wired — a client counts even in draft";
    } else if (reach.onDomain) {
      why = `on ${s.domain} but noindex and zero leads — reachable, but nobody is looking`;
    }

    rows.push({
      id: s.id,
      name: s.name,
      kind: s.kind,
      status: reach.status,
      domain: s.domain || "",
      onDomain: reach.onDomain,
      indexable: reach.indexable,
      leads,
      notified: wiring.notifiesSomeone,
      surfaces,
      verdict,
      why,
    });
  }

  rows.sort((a, b) => (a.verdict === b.verdict ? a.id.localeCompare(b.id) : a.verdict === "PROTECTED" ? -1 : 1));
  const protectedRows = rows.filter((r) => r.verdict === "PROTECTED");
  const generatedAt = new Date().toISOString();

  if (!wantMd) {
    return Response.json({ ok: true, generatedAt, counts: { total: rows.length, protected: protectedRows.length, free: rows.length - protectedRows.length }, rows });
  }

  // ── THE BLOCK THAT GETS LOADED AT SESSION START ─────────────────────────────────────────────
  // Short on purpose. It is paid for at every session start on every model.
  const L: string[] = [];
  L.push(`# PROTECTION MANIFEST — what is actually live (generated ${generatedAt})`);
  L.push("");
  L.push("⛔ **This REPLACES caution-by-default.** Anything marked FREE gets changed, renamed, deleted");
  L.push("or rebuilt with NO confirmation, NO redirect, NO deprecation window, NO migration step, and");
  L.push("no sentence spent protecting it. Only PROTECTED sites — and only the surfaces listed on");
  L.push("them — justify a confirmation.");
  L.push("");
  L.push(`**${protectedRows.length} PROTECTED · ${rows.length - protectedRows.length} FREE**`);
  L.push("");
  if (protectedRows.length) {
    L.push("## PROTECTED — confirm before destructive work on the LISTED surfaces only");
    for (const r of protectedRows) L.push(`- **${r.id}** (${r.name}) — ${r.why}. Live: ${r.surfaces.join(" · ") || "none"}`);
  } else {
    L.push("## PROTECTED — none.");
    L.push("Nothing on this account currently holds a real lead, a paying client's live delivery, or an");
    L.push("indexed public page. **There is nothing to protect. Act accordingly.**");
  }
  L.push("");
  L.push("## FREE — no confirmation, no migration machinery, no caveats");
  for (const r of rows.filter((x) => x.verdict === "FREE")) L.push(`- ${r.id} — ${r.why}`);
  L.push("");
  L.push("⚠️ ALWAYS PROTECTED regardless of this list: money · credentials · deleting the ONLY copy of");
  L.push("something · a paying customer's data · sending anything to a real person.");
  L.push("");

  return new Response(L.join("\n"), { headers: { "Content-Type": "text/markdown; charset=utf-8" } });
}
