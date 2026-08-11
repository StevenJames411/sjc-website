// Put back the hide state that an early import stripped off a design's mobile menu.
//
// ── THE FAILURE THIS UNDOES ───────────────────────────────────────────────────────────────────
// lib/designCss.ts un-hides anything parked at zero opacity, because a scroll-reveal whose script
// we stripped would otherwise render every section below the fold blank. A full-screen menu hides
// itself the identical way — `opacity:0; visibility:hidden`, un-hidden by `[data-open="true"]` — so
// it got un-hidden too, and then could never close.
//
// On sjc-2026 that put a fixed, full-viewport navy panel over all ten pages. The header, hero and
// footer were all present underneath it. What it looked like from the outside was "the header and
// footer are missing", in the studio and on the published site alike.
//
// ⚠️ THE STYLESHEET IS COMPILED ONCE, AT IMPORT, AND STORED PER PAGE. Fixing the compiler fixes the
// next import and nothing already in the database. Re-importing would fix it and discard every page
// built out since the import, so the stored sheets get repaired in place — which is all this is.
//
// ── ALSO REPAIRS MOBILE ───────────────────────────────────────────────────────────────────────
// A comment on the line above an @media block hid the at-rule from scopeCss, so the rules INSIDE
// were left unscoped — one class — while the desktop rules outside got two. A media query adds no
// specificity, so on a phone the desktop rule won and nothing stacked: every three-column grid,
// the hero split and the footer columns stayed side by side. Same shape of bug, same fix.
//
//   POST { site?, dryRun?, publish? } -> { ok, dryRun, pages: [{ slug, draft, published }], total }
//
// ⚠️ DEFAULTS TO A DRY RUN, like every other admin route here: the first answer should be a count
// you can read, not a change you have to undo. Pass dryRun:false to write.
//
// Repairs the DRAFT sheet always. The PUBLISHED sheet is what a visitor is looking at right now, so
// reaching it takes publish:true — but on this bug the published sheet is the broken one, so a real
// run normally wants both.
import { createKvStore } from "@/lib/kvStateStore";
import { getClient } from "@/lib/store";
import { repairOverlayHides, repairMediaScope } from "@/lib/designCss";
import { readPages } from "@/lib/pageRegistry";
import { siteKeys, SJC } from "@/lib/siteKeys";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

type Row = { slug: string; draft: number; published: number };

export async function POST(req: Request) {
  let body: { site?: string; dryRun?: boolean; publish?: boolean };
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "bad json" }, { status: 400 });
  }

  const site = String(body?.site || SJC).trim() || SJC;
  const dryRun = body?.dryRun !== false;
  const publish = body?.publish === true;

  const client = getClient();
  const keys = siteKeys(site);
  const pages = await readPages(site);
  const report: Row[] = [];
  let total = 0;

  for (const page of pages) {
    const row: Row = { slug: page.slug, draft: 0, published: 0 };

    for (const pub of [false, true]) {
      if (pub && !publish) continue;
      const store = createKvStore(client, keys.designCss(page.slug, pub));
      const saved = await store.read<{ css?: string }>();
      const css = saved && typeof saved.css === "string" ? saved.css : "";
      if (!css) continue;

      // Two repairs, one pass — both are "the stylesheet was compiled before a fix existed".
      const hides = repairOverlayHides(css);
      const media = repairMediaScope(hides.css);
      const next = media.css;
      const repaired = hides.repaired + media.repaired;
      if (!repaired) continue;

      if (!dryRun) await store.write({ css: next });
      if (pub) row.published = repaired;
      else row.draft = repaired;
      total += repaired;
    }

    if (row.draft || row.published) report.push(row);
  }

  return Response.json({ ok: true, dryRun, publish, site, pages: report, total });
}
