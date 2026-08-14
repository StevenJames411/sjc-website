// Collapse an imported design's per-page header and footer into the site's ONE global chrome.
//
// ── WHY IT HAS A ROUTE ───────────────────────────────────────────────────────────────────────
// The logic was `scripts/lift-chrome.mjs`, run by hand against a named site with production
// credentials pulled to a temp file. So the global header was something sjc-2026 HAD and the
// product did NOT: every future import landed with a copy of the header on every page and no way
// to collapse them without a terminal. See lib/liftChrome.ts for the mechanics.
//
//   POST { site, dryRun?, publish?, overwrite? }
//     -> { ok, source, pages, drift, existingChrome, liftedHeader, liftedFooter,
//          removed, strippedPages, refused, dryRun }
//
// ⚠️ DEFAULTS TO A DRY RUN, like every other sweep in this directory. The caller looks first,
// shows the operator what it found, and only then calls again with dryRun:false.
//
// ⛔ OWNER-ONLY BY MIDDLEWARE. `/api/admin/*` is refused to anyone not signed in as the owner
// (middleware.ts) — "the owner's toolbox, never a client's, whatever site they own." This route
// writes across every page of a website, so it belongs on exactly that side of the line.
import { liftChrome } from "@/lib/liftChrome";
import { SJC } from "@/lib/siteKeys";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(req: Request) {
  let body: { site?: string; dryRun?: boolean; publish?: boolean; overwrite?: boolean };
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "bad json" }, { status: 400 });
  }

  const site = String(body?.site || SJC).trim() || SJC;
  // ⚠️ Same polarity as admin/recompile-css: a dry run unless explicitly told otherwise, so a
  // mistyped call reports instead of writing.
  const dryRun = body?.dryRun !== false;
  const publish = body?.publish === true;
  const overwrite = body?.overwrite === true;

  try {
    const report = await liftChrome({ site, dryRun, publish, overwrite });
    return Response.json(report, { status: report.ok ? 200 : 400 });
  } catch (e) {
    return Response.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}
