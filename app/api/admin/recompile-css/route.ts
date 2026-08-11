// Recompile an imported site's stylesheet from the source the importer archived.
//
// ── WHY THIS EXISTS ───────────────────────────────────────────────────────────────────────────
// The design stylesheet is compiled ONCE, at import, and stored. So every compiler bug is frozen
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
//   POST { site?, dryRun?, publish? } -> { ok, pages: [{ slug, bytes, before }], missing: [...] }
//
// ⚠️ DEFAULTS TO A DRY RUN.
//
// ⚠️ A page with no archived source is REPORTED, never guessed at. `designSrc` is written
// best-effort at import, and pages imported before it existed have none — leaving that sheet
// exactly as it is beats replacing it with something reconstructed.
import { createKvStore } from "@/lib/kvStateStore";
import { getClient } from "@/lib/store";
import { compileCssForDesign } from "@/lib/importDesign";
import { readPages } from "@/lib/pageRegistry";
import { siteKeys, SJC } from "@/lib/siteKeys";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

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

  const report: { slug: string; bytes: number; before: number }[] = [];
  const missing: string[] = [];

  for (const page of pages) {
    const src = await createKvStore(client, keys.designSrc(page.slug)).read<{ html?: string }>();
    const html = src && typeof src.html === "string" ? src.html : "";
    if (!html) {
      missing.push(page.slug);
      continue;
    }

    // The importer's own function, not a copy of its steps — see compileCssForDesign.
    const css = await compileCssForDesign(html);
    if (!css) {
      missing.push(page.slug);
      continue;
    }

    const beforeStore = createKvStore(client, keys.designCss(page.slug, false));
    const before = ((await beforeStore.read<{ css?: string }>())?.css || "").length;

    if (!dryRun) {
      await beforeStore.write({ css });
      if (publish) await createKvStore(client, keys.designCss(page.slug, true)).write({ css });
    }
    report.push({ slug: page.slug, bytes: css.length, before });
  }

  return Response.json({ ok: true, dryRun, publish, site, pages: report, missing });
}
