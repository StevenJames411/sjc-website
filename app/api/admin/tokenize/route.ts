// Link a page's typed-in business details to the website's settings.
//
// An imported design arrives with the phone number as characters inside seven different blocks.
// Filling in Website settings does nothing for those blocks — they hold digits, not a reference.
// This finds the literal values and swaps them for {{business.*}} tokens, so from then on the
// settings screen drives the page.
//
//   POST { site, slug, dryRun? } -> { ok, replacements: {token: count}, missing }
//
// It only ever replaces values that are ALREADY IN THE SETTINGS. Nothing is guessed: if the phone
// field is blank, no phone is touched. That is what keeps this safe to run on any page — it can't
// invent a match, so the worst case is that it changes nothing.
import { findSite } from "@/lib/sites";
import { findPageMeta } from "@/lib/pageRegistry";
import { createKvStore } from "@/lib/kvStateStore";
import { getClient } from "@/lib/store";
import { puckKey } from "@/lib/puckContent";
import { SJC } from "@/lib/siteKeys";
import type { BusinessFacts } from "@/lib/sitesShared";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Every literal → token swap this site's settings can justify, longest first. */
function rules(b: BusinessFacts): { re: RegExp; token: string; label: string }[] {
  const out: { re: RegExp; token: string; label: string }[] = [];

  // Address and email before anything shorter that might sit inside them.
  if (b.address.trim()) out.push({ re: new RegExp(esc(b.address.trim()), "g"), token: "{{business.address}}", label: "address" });
  if (b.email.trim()) out.push({ re: new RegExp(esc(b.email.trim()), "gi"), token: "{{business.email}}", label: "email" });

  // Phone: match the digits however they're punctuated, so "(210) 474-6252", "210.474.6252",
  // "+12104746252" and "tel:+12104746252" all resolve to one token. The renderer decides which
  // form to print based on whether it's inside a tel: link.
  const digits = (b.phone || b.phoneDisplay).replace(/\D/g, "").slice(-10);
  if (digits.length === 10) {
    const [a, c, d] = [digits.slice(0, 3), digits.slice(3, 6), digits.slice(6)];
    out.push({
      re: new RegExp(`\\+?1?\\s*\\(?${a}\\)?[\\s.\\-]?${c}[\\s.\\-]?${d}`, "g"),
      token: "{{business.phone}}",
      label: "phone",
    });
  }

  if (b.hours.trim()) out.push({ re: new RegExp(esc(b.hours.trim()), "g"), token: "{{business.hours}}", label: "hours" });
  // Business name LAST — it's the most likely to appear inside the strings above.
  if (b.name.trim()) out.push({ re: new RegExp(esc(b.name.trim()), "g"), token: "{{business.name}}", label: "business name" });

  return out;
}

function apply(data: unknown, rs: ReturnType<typeof rules>, counts: Record<string, number>): unknown {
  if (typeof data === "string") {
    let s = data;
    for (const { re, token, label } of rs) {
      re.lastIndex = 0;
      const hits = s.match(re);
      if (hits?.length) {
        counts[label] = (counts[label] || 0) + hits.length;
        s = s.replace(re, token);
      }
    }
    return s;
  }
  if (Array.isArray(data)) return data.map((v) => apply(v, rs, counts));
  if (data && typeof data === "object") {
    const o: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(data as Record<string, unknown>)) o[k] = apply(v, rs, counts);
    return o;
  }
  return data;
}

export async function POST(req: Request) {
  let body: { site?: string; slug?: string; dryRun?: boolean };
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "bad json" }, { status: 400 });
  }

  const siteId = String(body?.site || SJC).trim() || SJC;
  const slug = String(body?.slug || "").trim();
  const site = await findSite(siteId);
  if (!site) return Response.json({ ok: false, error: "No such website." }, { status: 404 });
  if (!slug || !(await findPageMeta(slug, siteId))) {
    return Response.json({ ok: false, error: "No such page." }, { status: 404 });
  }

  const b = site.business;
  const missing = (["name", "phoneDisplay", "email", "address"] as const).filter((k) => !b[k]?.trim());
  const rs = rules(b);
  if (!rs.length) {
    return Response.json(
      { ok: false, error: "Nothing in this website's settings to link to. Fill in the business details first.", missing },
      { status: 400 }
    );
  }

  const client = getClient();
  const draft =
    (await createKvStore(client, puckKey(slug, false, siteId)).read<Record<string, unknown>>()) ||
    (await createKvStore(client, puckKey(slug, true, siteId)).read<Record<string, unknown>>());
  if (!draft) return Response.json({ ok: false, error: "That page has no saved content." }, { status: 404 });

  const counts: Record<string, number> = {};
  const { _pub, ...rest } = draft as { _pub?: number };
  const next = apply(rest, rs, counts) as Record<string, unknown>;
  const total = Object.values(counts).reduce((a, n) => a + n, 0);

  if (body?.dryRun) return Response.json({ ok: true, dryRun: true, replacements: counts, total, missing });

  if (!total) return Response.json({ ok: true, replacements: {}, total: 0, missing, note: "Nothing on this page matched." });

  // DRAFT ONLY. Publish is a separate, deliberate act — same as every other edit in the builder.
  if (!(await createKvStore(client, puckKey(slug, false, siteId)).write(next))) {
    return Response.json({ ok: false, error: "Couldn't save the page." }, { status: 500 });
  }

  return Response.json({ ok: true, replacements: counts, total, missing });
}
