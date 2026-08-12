// Recompile imported stylesheets from the source the importer archived, and move pages onto them.
//
// ── WHY THIS EXISTS ───────────────────────────────────────────────────────────────────────────
// A design's stylesheet is compiled ONCE, at import, and stored. So every compiler bug is frozen
// into every site imported before the fix, and fixing the compiler heals nothing already in the
// database. Re-importing would heal it and throw away every page built out since.
//
// The bug that forced this: a comment on the line above an @media block hid the at-rule from
// scopeCss, so the rules inside came out unscoped — one class — while the desktop rules outside
// got two. A media query adds no specificity, so on a phone the desktop rule won and NOTHING
// STACKED. Worse, the stray scope left sitting before the at-rule made it invalid, so the browser
// discarded the whole media block: sjc-2026's parsed stylesheet contained exactly one `.split`
// rule, the desktop one.
//
// ⚠️ RECOMPILE, DON'T PATCH. The first attempt edited the stored compiled CSS to imitate what a
// fixed compiler would have produced. It was correct on run one and then rewrote itself on every
// run after, forever — a hand-rolled walk over a large compiled sheet keeps shifting its own block
// boundaries. Two other shapes failed differently. Running the fixed compiler over the archived
// source is not an imitation of the right answer; it IS the right answer, and it picks up every
// future compiler fix for free.
//
// ── WHAT CHANGED 2026-08-12 ───────────────────────────────────────────────────────────────────
// Sheets are content-addressed and IMMUTABLE, so this no longer overwrites a stylesheet in place.
// It compiles, gets a NEW id, writes that sheet, and rewrites `props.sheet` in the DRAFT content of
// every page pointing at the old one. A recompile is therefore an ordinary edit: it goes live when
// the page is published, through the write guard, with a revision — instead of silently restyling
// live pages the moment it ran.
//
// It also works per SHEET rather than per page, which is what the sheet actually is: one design
// shared by many pages used to be recompiled once per page, redundantly, and could half-succeed.
//
// ⚠️ THE ID ONLY MOVES IF SOMETHING REAL CHANGED. It is a hash of (source + Tailwind version +
// DESIGN_PIPELINE_REV). Bump DESIGN_PIPELINE_REV in lib/designShared.ts when you fix the compiler,
// or this correctly finds nothing to do.
//
//   POST { site?, dryRun?, publish? } -> { ok, sheets: [...], missing: [...], repointed: [...] }
//
// ⚠️ DEFAULTS TO A DRY RUN.
//
// ⚠️ A sheet with no archived source is REPORTED, never guessed at. Pages imported before the
// archive existed have none, and leaving that sheet exactly as it is beats replacing it with
// something reconstructed.
import { createKvStore } from "@/lib/kvStateStore";
import { getClient } from "@/lib/store";
import { compileCssForDesign, sheetIdFor } from "@/lib/importDesign";
import { readPages } from "@/lib/pageRegistry";
import { readDesignSource, writeDesignSheet, sheetIdsIn, puckKey } from "@/lib/puckContent";
import { SJC } from "@/lib/siteKeys";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/** Rewrite every `props.sheet` matching `from` to `to`. Returns how many were changed. */
function repoint(node: unknown, from: string, to: string, count = { n: 0 }): number {
  if (Array.isArray(node)) node.forEach((n) => repoint(n, from, to, count));
  else if (node && typeof node === "object") {
    const o = node as Record<string, unknown> & { props?: Record<string, unknown> };
    if (o.props && o.props.sheet === from) {
      o.props.sheet = to;
      count.n++;
    }
    if (o.props) Object.values(o.props).forEach((v) => repoint(v, from, to, count));
    for (const k of ["content", "zones"]) if (o[k]) repoint(o[k], from, to, count);
  }
  return count.n;
}

export async function POST(req: Request) {
  let body: { site?: string; dryRun?: boolean; publish?: boolean };
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "bad json" }, { status: 400 });
  }

  const site = String(body?.site || SJC).trim() || SJC;
  const dryRun = body?.dryRun !== false;

  const client = getClient();
  const pages = await readPages(site);

  // Which sheets this site's DRAFTS reference, and which pages reference each. The draft is what a
  // recompile edits; the published copy is reached by publishing, like every other change.
  const drafts = new Map<string, Record<string, unknown>>();
  const users = new Map<string, string[]>();
  for (const page of pages) {
    const store = createKvStore(client, puckKey(page.slug, false, site));
    const data = await store.read<Record<string, unknown>>();
    if (!data) continue;
    drafts.set(page.slug, data);
    for (const id of sheetIdsIn(data)) users.set(id, [...(users.get(id) || []), page.slug]);
  }

  const report: { from: string; to: string; bytes: number; before: number; pages: string[] }[] = [];
  const missing: string[] = [];
  const unchanged: string[] = [];

  for (const [oldId, slugs] of users) {
    const html = await readDesignSource(oldId);
    if (!html) {
      // No archive, so there is nothing to recompile FROM. Reported, never reconstructed.
      missing.push(oldId);
      continue;
    }

    const css = await compileCssForDesign(html);
    if (!css) {
      missing.push(oldId);
      continue;
    }

    const newId = sheetIdFor(html);
    if (newId === oldId) {
      // Same source, same compiler, same output. Nothing to move pages onto — and pretending
      // otherwise would rewrite drafts for no reason. Bump DESIGN_PIPELINE_REV if you expected a
      // change here.
      unchanged.push(oldId);
      continue;
    }

    const before = (await readDesignSource(oldId)).length;
    if (!dryRun) {
      if (!(await writeDesignSheet(newId, css, html))) {
        return Response.json(
          { ok: false, error: `Recompiled ${oldId} but the new sheet couldn't be saved.`, report },
          { status: 500 }
        );
      }
      // Repoint the drafts. The old sheet is deliberately left in place: published pages still
      // reference it until they are published again, and an immutable sheet costs only bytes.
      for (const slug of slugs) {
        const data = drafts.get(slug);
        if (!data) continue;
        if (repoint(data, oldId, newId) > 0) {
          await createKvStore(client, puckKey(slug, false, site)).write(data);
        }
      }
    }
    report.push({ from: oldId, to: newId, bytes: css.length, before, pages: slugs });
  }

  return Response.json({
    ok: true,
    dryRun,
    site,
    sheets: report,
    unchanged,
    missing,
    note: dryRun
      ? "Dry run. Nothing written."
      : "Drafts repointed. Publish each page to take the recompiled stylesheet live.",
  });
}
