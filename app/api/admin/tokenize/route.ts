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
import { applyTokens, tokenRules } from "@/lib/tokenizePage";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

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
  const rs = tokenRules(b);
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
  const next = applyTokens(rest, rs, counts) as Record<string, unknown>;
  const total = Object.values(counts).reduce((a, n) => a + n, 0);

  if (body?.dryRun) return Response.json({ ok: true, dryRun: true, replacements: counts, total, missing });

  if (!total) return Response.json({ ok: true, replacements: {}, total: 0, missing, note: "Nothing on this page matched." });

  // DRAFT ONLY. Publish is a separate, deliberate act — same as every other edit in the builder.
  if (!(await createKvStore(client, puckKey(slug, false, siteId)).write(next))) {
    return Response.json({ ok: false, error: "Couldn't save the page." }, { status: 500 });
  }

  return Response.json({ ok: true, replacements: counts, total, missing });
}
