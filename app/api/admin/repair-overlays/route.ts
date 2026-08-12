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
import { repairOverlayHides } from "@/lib/designCss";
import { readPages } from "@/lib/pageRegistry";
import { sheetIdsIn, puckKey } from "@/lib/puckContent";
import { designSheet, SJC } from "@/lib/siteKeys";

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

  // ⛔ REPORT ONLY SINCE 2026-08-12 — THIS ROUTE'S MECHANISM IS NO LONGER LEGAL.
  //
  // It healed the bug by REWRITING A STORED STYLESHEET IN PLACE. Sheets are now content-addressed
  // and immutable: the id is a hash of the source markup, so editing the bytes under an existing id
  // would make the id a lie, and would silently restyle every page pointing at it — live, with no
  // publish and no revision. That is precisely the class of surprise the new model removes.
  //
  // The replacement is strictly better and already exists. `repairOverlayHides` runs inside the
  // compiler, so the fix applies at compile time; bumping DESIGN_PIPELINE_REV in lib/designShared.ts
  // gives every affected sheet a new id, and `admin/recompile-css` recompiles from the archived
  // source and repoints each page's DRAFT. The repair then goes live when the page is published,
  // like any other change, through the guard.
  //
  // Kept as a diagnostic so the finding stays observable — it just no longer writes.
  const client = getClient();
  const pages = await readPages(site);
  const report: Row[] = [];
  let total = 0;

  for (const page of pages) {
    const row: Row = { slug: page.slug, draft: 0, published: 0 };
    const data = await createKvStore(client, puckKey(page.slug, false, site)).read<unknown>();
    for (const id of sheetIdsIn(data)) {
      const saved = await createKvStore(client, designSheet(id)).read<{ css?: string }>();
      const css = saved && typeof saved.css === "string" ? saved.css : "";
      if (!css) continue;
      const { repaired } = repairOverlayHides(css);
      row.draft += repaired;
      total += repaired;
    }
    if (row.draft) report.push(row);
  }

  return Response.json({
    ok: true,
    dryRun: true,
    site,
    pages: report,
    total,
    note:
      total > 0
        ? "REPORT ONLY — this route no longer writes. Bump DESIGN_PIPELINE_REV in " +
          "lib/designShared.ts, then POST /api/admin/recompile-css {site, dryRun:false} to " +
          "recompile from source and repoint the drafts. Publish each page to take it live."
        : "Nothing to repair.",
  });
}
