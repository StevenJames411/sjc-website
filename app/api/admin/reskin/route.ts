// Re-skin a whole website by unpinning the colours its blocks froze in.
//
// ── WHY A SITE DOESN'T FOLLOW ITS OWN BRAND SCREEN ────────────────────────────────────────────
// Every colour field can hold either a brand ROLE ("accent", "bandDark") or a literal hex. A role
// follows the brand screen forever; a hex never moves again. SJC was built before the brand screen
// existed, so its pages are full of literal hexes — change the palette and the page ignores you.
//
// Steven hit exactly this: the brand palette went cyan-on-near-black, the bands moved, and every
// green headline stayed green because "#22c55e" was typed onto the block.
//
// This walks a site's saved pages and swaps the OLD palette's hexes for the role each one was
// playing, so the page starts obeying the brand screen. It is the same mechanism make-template
// already uses to stop a template carrying the previous owner's colours — pointed at a live site
// instead of a copy.
//
//   POST { site?, dryRun? } -> { ok, dryRun, pages: [{ slug, replaced }], total }
//
// ⚠️ DEFAULTS TO A DRY RUN. This rewrites saved content on a live website; the first answer should
// always be a count you can read, not a change you have to undo. Pass dryRun:false to write.
//
// ⚠️ DRAFT ONLY. Nothing here publishes. The change is visible on ?preview=1 and reaches the
// public site when you press Publish on the page — which is where that decision belongs.
import { createKvStore } from "@/lib/kvStateStore";
import { getClient } from "@/lib/store";
import { puckKey } from "@/lib/puckContent";
import { readPages } from "@/lib/pageRegistry";
import { SJC } from "@/lib/siteKeys";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

// SJC's original palette, and the role each colour was actually playing. Mapping by ROLE rather
// than to a new hex is the whole point: do it once and every future palette change follows too.
const HEX_TO_ROLE: Record<string, string> = {
  "#2563eb": "accent",     // royal blue — links, labels, badges
  "#1d4fd7": "accentHover",
  "#22c55e": "accent",     // the green headlines and dots. They were the accent, not a third brand
  "#16a34a": "accentHover",// colour — so they become the accent and follow it from now on.
  "#1e3a6e": "bandDark",   // the navy band behind the hero
  "#111827": "ink",
  "#4b5563": "mute",
  "#e5e7eb": "line",
  "#f3f4f6": "bandSoft",
};

function swap(value: unknown, counts: { n: number }): unknown {
  if (typeof value === "string") {
    const role = HEX_TO_ROLE[value.trim().toLowerCase()];
    if (role) {
      counts.n++;
      return role;
    }
    return value;
  }
  if (Array.isArray(value)) return value.map((v) => swap(v, counts));
  if (value && typeof value === "object") {
    const o: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) o[k] = swap(v, counts);
    return o;
  }
  return value;
}

export async function POST(req: Request) {
  let body: { site?: string; dryRun?: boolean };
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "bad json" }, { status: 400 });
  }

  const site = String(body?.site || SJC).trim() || SJC;
  // Opt IN to writing. A missing flag means look, not touch.
  const dryRun = body?.dryRun !== false;

  const client = getClient();
  const pages = await readPages(site);
  const report: { slug: string; replaced: number }[] = [];
  let total = 0;

  for (const page of pages) {
    const key = puckKey(page.slug, false, site);
    const store = createKvStore(client, key);
    const data = await store.read<Record<string, unknown>>();
    if (!data) continue;

    const counts = { n: 0 };
    const next = swap(data, counts) as Record<string, unknown>;
    if (!counts.n) continue;

    total += counts.n;
    report.push({ slug: page.slug, replaced: counts.n });
    // The draft only. Publishing stays a decision someone makes per page, looking at the page.
    if (!dryRun) await store.write(next);
  }

  return Response.json({ ok: true, dryRun, site, pages: report, total });
}
