// LIFT AN IMPORTED DESIGN'S HEADER + FOOTER INTO THE SITE'S ONE GLOBAL CHROME.
//
// ── THE PROBLEM ───────────────────────────────────────────────────────────────────────────────
// lib/importDesign.ts splits a bought design into one DesignSection per top-level element, so the
// design's <header> and <footer> land INSIDE the page like any other band. Import a design and
// every page arrives carrying its own copy — and a page created afterwards gets none at all.
//
// That is the exact thing the global header exists to prevent. Steven, on why it matters: *"the
// whole concept of the header navigation and footer being global is so you don't have to do it
// manually six, seven, eight times."* Right — and on an imported site he was doing exactly that,
// because import never pointed those pages at the global documents.
//
// ⚠️ THE PAGE COUNT IS NOT PART OF THE CONCEPT. Ten is just the number sjc-2026 happened to have.
// A design may bring three, four, or one. Nothing below counts pages or assumes a floor: a
// one-page site still lifts, and that is not a no-op — it is what makes page two wear the header
// the moment it is created.
//
// ── WHAT IT DOES ─────────────────────────────────────────────────────────────────────────────
// Moves the header and footer into `nav` and `footer` — the two documents lib/publicSitePage.tsx
// already renders around EVERY page — and strips the per-page copies so nothing renders twice.
// After it runs: edit the header once and every page follows, and a brand new page wears it with
// no action at all.
//
// ⚠️ THE STYLESHEET NEEDS NO WORK. lib/puckContent readDesignCss() already falls back to a sibling
// page's compiled sheet when a page has none of its own, so a new blank page picks up the design's
// CSS and the lifted header renders styled. That fallback is the whole reason this is a DATA MOVE
// and not a code change — which in turn is why it is safe to run from the app.
//
// ── WHY THIS IS A LIB AND NOT A SCRIPT ───────────────────────────────────────────────────────
// It was `scripts/lift-chrome.mjs`, run by hand against `SITE=sjc-2026` with production
// credentials pulled down to a temp file. That made the global header a thing Steven's site HAD
// and the product did NOT: every future import would land with per-page copies and no way to
// collapse them without a terminal. Same lesson as `admin/recompile-css`, which sat unreachable
// behind a curl while the bug it fixed cost a morning. **A capability behind a terminal is a
// capability the product does not have.**
//
// The script stays as the break-glass path; this is the one the product calls.
import { createKvStore } from "./kvStateStore";
import { getClient } from "./store";
import { puckKey } from "./puckContent";
import { readPages } from "./pageRegistry";
import { CHROME, isChrome } from "./puckPages";

type Block = { type?: string; props?: Record<string, unknown> };
type PuckDoc = { root?: unknown; content?: Block[]; zones?: unknown; _pub?: number };

/** The opening tag name of a DesignSection's raw HTML — `header`, `footer`, `section`, … */
const tagOf = (html: unknown) =>
  (String(html || "").match(/^\s*<\s*([a-z0-9]+)/i) || [, ""])[1].toLowerCase();

// ⚠️ MATCHED ON THE MARKUP'S OWN TAG, NOT ON A CLASS OR AN ORDER. A bought design names things
// however it likes and puts them wherever it likes, but `<header>` and `<footer>` are the two
// elements it cannot rename — which is what makes this work on a design nobody has seen.
const isHeaderBlock = (b: Block) => b?.type === "DesignSection" && tagOf(b?.props?.html) === "header";
const isFooterBlock = (b: Block) => b?.type === "DesignSection" && tagOf(b?.props?.html) === "footer";

// ⛔ THE TAG RULE IS NOT ENOUGH, AND SJC PROVED IT (2026-08-16). A design's MOBILE MENU OVERLAY is
// chrome by every meaning of the word — it holds the nav links, it is hidden until the header's
// button fires, it belongs on every page — but its root element is a `<div>`, so `<header>`/
// `<footer>` matching walked straight past it. sjc-2026 ended up with ten embedded copies of its
// DIVISIONS menu: one label change cost ten edits, and one page quietly disagreed for weeks.
//
// The honest signal is not the tag, it is DUPLICATION. Page content differs between pages by
// definition; a band that is byte-identical on EVERY page was put there by the importer, not by an
// author. Two guards keep that from eating real content:
//   1. it must not be a content band — `<section>`/`<main>/`<article>` are what importDesign emits
//      for the page's own bands, so anything wearing those tags is left alone no matter what;
//   2. the site must have at least two pages, or "identical on every page" is trivially true.
// A one-page site therefore still lifts its header and footer by tag, and simply has no evidence
// yet for anything else — which is correct, not a miss.
const BAND_TAGS = new Set(["section", "main", "article"]);
const couldBeExtraChrome = (b: Block) =>
  b?.type === "DesignSection" &&
  !isHeaderBlock(b) &&
  !isFooterBlock(b) &&
  !BAND_TAGS.has(tagOf(b?.props?.html)) &&
  String(b?.props?.html || "").trim().length > 0;

export type DriftRow = {
  slug: string;
  header: "same" | "differs" | "none";
  footer: "same" | "differs" | "none";
};

export type LiftReport = {
  ok: boolean;
  error?: string;
  /** The page the chrome was taken FROM. */
  source?: string;
  /** Every page examined, in registry order. */
  pages: string[];
  /** Which pages carried chrome that did not match the source. */
  drift: DriftRow[];
  /** True when the site already has hand-built chrome this would have overwritten. */
  existingChrome: ("nav" | "footer")[];
  liftedHeader: boolean;
  liftedFooter: boolean;
  /**
   * Non-header/footer blocks that were identical on every page and therefore chrome — a mobile
   * menu overlay, an announcement bar, a cookie strip. Appended to `nav`, never overwriting it.
   * Each entry is a short human description so a dry run reads as a sentence, not an id.
   */
  liftedExtras: string[];
  /** How many per-page chrome blocks would be / were removed. */
  removed: number;
  /** Pages whose copies were stripped. */
  strippedPages: string[];
  /** Writes the store's guard refused, with its reason. Never silent. */
  refused: { key: string; reason: string }[];
  dryRun: boolean;
};

/**
 * Collapse an imported design's per-page header and footer into the site's global chrome.
 *
 * @param site      the site id, always explicit — this writes across every page of one website
 * @param dryRun    DEFAULT TRUE. Reports exactly what it would do and writes nothing.
 * @param publish   also move the PUBLISHED copies. Off by default: publishing is a separate,
 *                  deliberate act everywhere else in this codebase, and this one changes what the
 *                  public sees on every page at once.
 * @param overwrite replace chrome documents that already have content. Off by default — see below.
 */
export async function liftChrome({
  site,
  dryRun = true,
  publish = false,
  overwrite = false,
}: {
  site: string;
  dryRun?: boolean;
  publish?: boolean;
  overwrite?: boolean;
}): Promise<LiftReport> {
  const client = getClient();
  const refused: { key: string; reason: string }[] = [];

  const report: LiftReport = {
    ok: false,
    pages: [],
    drift: [],
    existingChrome: [],
    liftedHeader: false,
    liftedFooter: false,
    liftedExtras: [],
    removed: 0,
    strippedPages: [],
    refused,
    dryRun,
  };

  // ⚠️ `nav` and `footer` are documents, not pages. They would otherwise be walked as pages and
  // have their own contents stripped out of them.
  const pages = (await readPages(site)).map((p) => p.slug).filter((s) => !isChrome(s));
  report.pages = pages;
  if (!pages.length) return { ...report, error: `No pages found for site '${site}'.` };

  const read = async (slug: string, pub: boolean) =>
    (await createKvStore(client, puckKey(slug, pub, site)).read<PuckDoc>()) || null;

  // ── 1. THE SOURCE ──────────────────────────────────────────────────────────────────────────
  // Drafts, not published copies. The script this replaces read `-pub`, which was right for a site
  // that had been live for days and wrong for the case that matters now: a design imported five
  // minutes ago has nothing published yet, so it would have found no chrome and reported success.
  const drafts = new Map<string, PuckDoc>();
  for (const slug of pages) {
    const d = await read(slug, false);
    if (d) drafts.set(slug, d);
  }

  // Prefer `home`, because that is where the importer puts page one and where Steven expects the
  // canonical copy to live. Fall back to the first page that actually HAS both, so a design whose
  // home page is a bare splash still lifts from a page that carries real chrome.
  const carries = (slug: string) => {
    const c = drafts.get(slug)?.content || [];
    return { header: c.find(isHeaderBlock), footer: c.find(isFooterBlock) };
  };
  const sourceSlug =
    (pages.includes("home") && carries("home").header && carries("home").footer && "home") ||
    pages.find((s) => carries(s).header && carries(s).footer) ||
    pages.find((s) => carries(s).header || carries(s).footer);

  // ── 1b. THE EXTRAS ─────────────────────────────────────────────────────────────────────────
  // Anything that is not a content band and is byte-identical on every page. See the note on
  // `couldBeExtraChrome`. Needs two or more pages before "on every page" means anything.
  //
  // ⚠️ Computed from ALL pages, independently of whether a header was found. sjc-2026 is exactly
  // the case that demands it: its header had already been lifted by an earlier run, so the header
  // search came up empty and the old code returned "nothing to do" while ten menu overlays sat
  // there untouched.
  const extraHtmls = new Map<string, string>(); // html -> short description
  if (pages.length > 1) {
    const first = pages[0];
    for (const blk of (drafts.get(first)?.content || []).filter(couldBeExtraChrome)) {
      const html = String(blk.props?.html || "");
      const onEveryPage = pages.every((s) =>
        (drafts.get(s)?.content || []).some((b) => couldBeExtraChrome(b) && String(b.props?.html || "") === html),
      );
      if (!onEveryPage) continue;
      const cls = (html.match(/class="([^"]{0,40})"/) || [, ""])[1];
      extraHtmls.set(html, `<${tagOf(html)}${cls ? ` class="${cls}"` : ""}> on all ${pages.length} pages`);
    }
  }

  if (!sourceSlug && !extraHtmls.size) {
    // Not an error worth a 500 — it is the normal answer for a site built in the builder rather
    // than imported, and for one this has already run on. Idempotent by construction.
    return {
      ...report,
      ok: true,
      error: undefined,
      source: undefined,
    };
  }
  report.source = sourceSlug;

  const { header: headerBlk, footer: footerBlk } = sourceSlug
    ? carries(sourceSlug)
    : { header: undefined, footer: undefined };

  // ── 2. DOES EVERY PAGE ACTUALLY AGREE? ─────────────────────────────────────────────────────
  // ⚠️ CHECKED OUT LOUD, NEVER ASSUMED. If the copies differ, "global" silently picks a winner and
  // every other page changes appearance. A human reading a terminal caught that before; a button
  // has to hand the same warning back to whoever pressed it.
  for (const slug of pages) {
    const c = drafts.get(slug)?.content || [];
    const h = c.find(isHeaderBlock);
    const f = c.find(isFooterBlock);
    const row: DriftRow = {
      slug,
      header: !h ? "none" : h.props?.html === headerBlk?.props?.html ? "same" : "differs",
      footer: !f ? "none" : f.props?.html === footerBlk?.props?.html ? "same" : "differs",
    };
    if (row.header === "differs" || row.footer === "differs") report.drift.push(row);
  }

  // ── 3. IS THERE ALREADY CHROME WORTH KEEPING? ──────────────────────────────────────────────
  // ⛔ THE GUARD THE SCRIPT DID NOT NEED AND THIS DOES. A one-off against a known site could assume
  // the chrome documents were empty. A product function runs on sites nobody has looked at — and
  // one of them will have a header built by hand in the builder. Overwriting it silently is the
  // kind of loss that has no receipt and no undo the operator knows about.
  const doc = (block?: Block): PuckDoc => ({ root: { props: {} }, content: block ? [block] : [], zones: {} });
  const pending: { slug: (typeof CHROME)[number]; block?: Block }[] = [
    { slug: "nav", block: headerBlk },
    { slug: "footer", block: footerBlk },
  ];

  for (const { slug, block } of pending) {
    if (!block) continue;
    const existing = await read(slug, false);
    if (existing?.content?.length && !overwrite) report.existingChrome.push(slug);
  }
  // ⚠️ THE GUARD STOPS THE OVERWRITE, NOT THE WHOLE RUN. Appending an overlay to `nav` destroys
  // nothing, so hand-built chrome is no reason to leave menu copies duplicated across the site.
  // Before this split, sjc-2026 could never be fixed by the tool: its `nav` already held a header,
  // so the guard fired and the run ended before the overlays were even looked at.
  const doHeaderFooter = !(report.existingChrome.length && !overwrite);
  if (!doHeaderFooter && !extraHtmls.size) {
    return { ...report, ok: true, error: undefined };
  }

  // ── 4. WRITE THE TWO GLOBAL DOCUMENTS ──────────────────────────────────────────────────────
  // The draft carries no `_pub`; the published twin must have it or readPuckPublished ignores it.
  const write = async (key: string, value: unknown) => {
    if (dryRun) return true;
    const { ok, reason } = await createKvStore(client, key).writeResult(value);
    if (!ok) refused.push({ key, reason: reason || "refused" });
    return ok;
  };

  if (doHeaderFooter) {
    for (const { slug, block } of pending) {
      if (!block) continue;
      const okDraft = await write(puckKey(slug, false, site), doc(block));
      const okPub = publish ? await write(puckKey(slug, true, site), { ...doc(block), _pub: 1 }) : true;
      if (okDraft && okPub) {
        if (slug === "nav") report.liftedHeader = true;
        else report.liftedFooter = true;
      }
    }
  }

  // ── 4b. APPEND THE EXTRAS TO `nav` ─────────────────────────────────────────────────────────
  // They ride with the header: an overlay is opened by the header's button and must share its
  // document, or the button and the thing it opens live in different places. Append rather than
  // replace, and de-dupe by html so a second run is a no-op.
  if (extraHtmls.size) {
    const blocksFor = (from?: PuckDoc) =>
      (from?.content || []).filter((b) => extraHtmls.has(String(b.props?.html || "")));
    const source = pages.find((s) => blocksFor(drafts.get(s)).length);
    const extras = blocksFor(drafts.get(source || pages[0]));

    for (const pub of publish ? [false, true] : [false]) {
      const key = puckKey("nav", pub, site);
      const navDoc = (await read("nav", pub)) || { root: { props: {} }, content: [], zones: {} };
      const have = new Set((navDoc.content || []).map((b) => String(b.props?.html || "")));
      const add = extras.filter((b) => !have.has(String(b.props?.html || "")));
      if (!add.length) continue;
      const next = { ...navDoc, content: [...(navDoc.content || []), ...add], ...(pub ? { _pub: 1 } : {}) };
      if (await write(key, next) && !pub) report.liftedExtras = [...extraHtmls.values()];
    }
  }

  // ── 5. REMOVE THE PER-PAGE COPIES ──────────────────────────────────────────────────────────
  // Otherwise the header renders twice: once from the global document wrapped around the page, and
  // once from the band still sitting inside it.
  for (const slug of pages) {
    let touched = false;
    for (const pub of publish ? [false, true] : [false]) {
      const key = puckKey(slug, pub, site);
      const d = pub ? await read(slug, true) : drafts.get(slug) || null;
      if (!Array.isArray(d?.content)) continue;
      // Strip what was actually lifted — never the header/footer when the overwrite guard stopped
      // us from lifting them, or the page loses chrome that now lives nowhere.
      const next = {
        ...d,
        content: d.content.filter(
          (b) =>
            !(doHeaderFooter && (isHeaderBlock(b) || isFooterBlock(b))) &&
            !extraHtmls.has(String(b.props?.html || "")),
        ),
      };
      const removed = d.content.length - next.content.length;
      if (!removed) continue;
      if (await write(key, next)) {
        report.removed += removed;
        touched = true;
      }
    }
    if (touched) report.strippedPages.push(slug);
  }

  report.ok = true;
  return report;
}
