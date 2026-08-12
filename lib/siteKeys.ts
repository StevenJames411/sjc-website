// Every storage key belonging to a website is built HERE and nowhere else.
//
// This file is the isolation guarantee. One client's pages, content and brand cannot reach
// another's, not because anyone remembered to namespace a key, but because there is only one place
// a key can come from. Anything that concatenates its own key string is a bug.
//
// ── WHY SJC'S KEYS LOOK DIFFERENT ─────────────────────────────────────────────────────────────
// The SJC site is live and selling, and its content already sits under `sjc-pages`,
// `sjc-puck-<page>` and `sjc-brand`. Renaming those would mean migrating a running site for
// cosmetic tidiness. So site `sjc` deliberately returns its LEGACY keys byte-for-byte, and every
// other site gets a `site-<id>-` namespace. Nothing about SJC's storage moves, and the risk of
// this whole change drops to the new sites only.
//
// The ugliness is contained to the four lines below — no caller ever knows.

export const SJC = "sjc";

const safe = (s: string) => String(s || "").replace(/[^a-z0-9-]/gi, "").toLowerCase();

/**
 * Key infixes a SITE ID must never contain, because keys are `site-<id>-<what>` joined with a
 * hyphen and site ids and page slugs share the charset `[a-z0-9-]`.
 *
 * ⚠️ THE AMBIGUITY IS STRUCTURAL, NOT HYPOTHETICAL. A site called "Fox Puck Home" slugifies to
 * `fox-puck-home`, whose page-registry key is `site-fox-puck-home-pages` — byte-identical to site
 * `fox`'s page `home-pages`. One tenant's registry would silently be another tenant's page.
 *
 * The obvious fix is a separator that can't appear in either namespace (`site:{id}:puck:{page}`),
 * but that changes the format of every key already in the store and buys a migration to close a
 * collision that only a contrived name reaches. Forbidding the infix at CREATION closes the same
 * hole at zero cost, and it is a fork rather than a bouncer: the ambiguous name never exists.
 */
export const KEY_INFIXES = ["puck", "pages", "brand", "intake", "leads", "designcss", "designsrc"];

/**
 * The storage keys for one website.
 *
 * ⚠️ AN INVALID ID THROWS — IT DOES NOT QUIETLY BECOME SJC (2026-08-12). This used to read
 * `safe(siteId) || SJC`, so any id that sanitised away to nothing returned the FLAGSHIP SITE'S
 * legacy, unnamespaced keys. `siteKeys("!!!")`, `siteKeys("...")` and `siteKeys("···")` all handed
 * back `sjc-pages` / `sjc-puck-home` / `sjc-brand`. Since almost every route takes the site as a
 * free string from a query or body, that was a live path to writing into the flagship site by
 * sending punctuation — a lead stored into `sjc-leads`, or the apex's brand repainted.
 *
 * An EMPTY id still means "the default site", because plenty of internal callers legitimately mean
 * that. A non-empty id that isn't a valid slug is a caller bug or an attack, and either way must be
 * loud rather than silently redirected at SJC.
 */
export function siteKeys(siteId: string) {
  const raw = String(siteId ?? "").trim();
  // Empty means "the default site" and is a legitimate internal call. Anything else has to BE a
  // valid id already — sanitising it here is what let punctuation resolve to the flagship's keys.
  if (raw && !/^[a-z0-9-]+$/i.test(raw)) {
    throw new Error(
      `siteKeys: '${raw}' is not a valid website id. Resolve the site through the registry first — ` +
        `an unknown id must 404, never fall back to the flagship site's keys.`
    );
  }
  const id = safe(raw) || SJC;
  const legacy = id === SJC;
  const ns = legacy ? "sjc" : `site-${id}`;

  return {
    id,
    /** The page registry for this site (which pages exist, renames, tombstones). */
    pages: legacy ? "sjc-pages" : `${ns}-pages`,
    /** A page's Puck content. `pub` = the published snapshot the public site reads. */
    puck: (page: string, pub = false) =>
      `${ns}-puck-${safe(page) || "home"}` + (pub ? "-pub" : ""),
    /** This site's fonts + colours. */
    brand: (pub = false) => `${ns}-brand` + (pub ? "-pub" : ""),
    /**
     * ⛔ LEGACY — NOTHING WRITES THIS ANY MORE (superseded 2026-08-12 by `designSheet` below).
     *
     * The compiled stylesheet used to be keyed `(site, page, published)`. Keeping it out of the
     * page document was right — a 50KB blob riding inside the content makes the store's save-guard
     * diff meaningless. Keying it to a PAGE was wrong: a design is not a property of a page, it is
     * a thing several pages, several sites and a global library all point at. So SEVEN copy paths
     * had to remember to carry a value the data never referenced, and several didn't — "new website
     * from template" among them, which is why building a site from an imported-design template
     * produced raw unstyled markup with `ok:true` on every call.
     *
     * Kept here so `allKeysFor` still purges and renames it, and so the backfill can read it.
     * Delete once no `*-designcss-*` rows remain.
     */
    designCss: (page: string, pub = false) =>
      `${ns}-designcss-${safe(page) || "home"}` + (pub ? "-pub" : ""),
    /**
     * The design's ORIGINAL markup, exactly as handed to the importer.
     *
     * ⚠️ ADDED 2026-08-05, AFTER IT WAS FIRST NEEDED AND WASN'T THERE. The importer kept the
     * finished page and the compiled stylesheet and threw the source away. Then the splitter and
     * the nav pairing both improved — and there was no way to re-run them on anything already
     * imported, because "re-import" needs a file nobody had kept. Four live pages, and the only
     * remedy on offer was asking Steven to go find the originals again.
     *
     * Every future improvement to the import pipeline is worth nothing on existing sites without
     * this. It is a few KB of text against a step that otherwise cannot be repeated.
     *
     * No `-pub` twin: this is never rendered, only re-read.
     */
    designSrc: (page: string) => `${ns}-designsrc-${safe(page) || "home"}`,
    /**
     * What the business owner filled in on her intake link, and the photos she sent.
     * Built here like every other key, so one client's answers can never land in another's
     * record — the isolation is structural, not something the intake route has to remember.
     */
    intake: `${ns}-intake`,
    /**
     * EVERY LEAD THIS WEBSITE HAS RECEIVED, written BEFORE anyone tries to deliver it.
     *
     * ⚠️ ADDED 2026-08-06, AND ITS ABSENCE WAS THE STRUCTURAL HOLE. A lead used to be
     * delivery-only: the answers existed in the visitor's browser, went out to an inbox, a sheet
     * and a webhook, and were held nowhere. When every leg failed she saw "that didn't go
     * through" and the enquiry existed nowhere on earth. Onboarding answers had always been
     * stored-then-copied; leads — the thing the client actually pays for — had not.
     *
     * Storing first turns the whole class of delivery failures from LOST into UNDELIVERED, which
     * is a support ticket instead of a lost retainer.
     *
     * ⚠️ THIS IS NOT A CRM, AND MUST NOT BECOME ONE. It is written and never read back by any
     * customer-facing path — no inbox, no list, no reply, no status. GHL and the client's own
     * sheet stay the truth. The single permitted reader is Steven, looking for a lead he can see
     * failed. The moment anything here drives a workflow, the boundary is gone.
     */
    leads: `${ns}-leads`,
  };
}

/**
 * EVERY key this website owns. The one list — deleting, renaming and sweeping all read it.
 *
 * ── WHY ───────────────────────────────────────────────────────────────────────────────────────
 * Three places used to hand-list a site's keys: `purgeSiteForever`, `admin/rename-site` and
 * `admin/purge-orphans`. All three were written before `designSrc` and `leads` existed, and all
 * three still are. So:
 *
 *   • "Permanently deleted" left `<ns>-leads` behind — up to 500 of the CLIENT'S OWN CUSTOMERS,
 *     names, phones and emails — under a site that no longer exists. `purgeSiteForever`'s docblock
 *     promises "everything this site owns is emptied". It was not true.
 *   • Renaming a site stranded that same leads key, plus `designSrc`, under the OLD id, where
 *     nothing will ever read them and the orphan sweeper cannot even see them to report them.
 *   • `admin/rename-site`'s own header claims it "enumerates the keys from lib/siteKeys instead of
 *     hand-listing them, so a key added there later comes along by default." It hand-listed them.
 *
 * ⚠️ THE ASSERTION AT THE BOTTOM IS THE POINT OF THIS FUNCTION. Enumerating keys correctly once is
 * easy; the failure mode is a key added to `siteKeys` MONTHS later by someone who never reads this
 * file. So this compares what it handled against what `siteKeys` actually returned and THROWS on a
 * mismatch. Add a key above and forget it here and the next delete/rename fails loudly and
 * immediately, instead of quietly leaving a client's data behind. A comment asking the next person
 * to remember is what produced the three stale lists in the first place.
 *
 * `pageSlugs` must be every slug the site has EVER had, tombstones included — see
 * `allSlugsEver()` in ./pageRegistry. Live pages alone would skip a deleted page's stylesheet.
 */
export function allKeysFor(siteId: string, pageSlugs: string[]): string[] {
  const k = siteKeys(siteId);
  const out: string[] = [];
  // `id` is the site's own identifier, not a storage key.
  const handled = new Set<string>(["id"]);
  const take = (name: keyof ReturnType<typeof siteKeys>, ...keys: string[]) => {
    handled.add(name as string);
    out.push(...keys);
  };

  // A site with no registry entry still has a home page's keys.
  const pages = pageSlugs.length ? pageSlugs : ["home"];

  take("pages", k.pages);
  take("intake", k.intake);
  take("leads", k.leads);
  take("brand", k.brand(false), k.brand(true));
  take("puck", ...pages.flatMap((p) => [k.puck(p, false), k.puck(p, true)]));
  take("designCss", ...pages.flatMap((p) => [k.designCss(p, false), k.designCss(p, true)]));
  take("designSrc", ...pages.map((p) => k.designSrc(p)));

  const missed = Object.keys(k).filter((n) => !handled.has(n));
  if (missed.length) {
    throw new Error(
      `allKeysFor is out of date: siteKeys() returns ${missed.join(", ")} and this function does ` +
        `not enumerate ${missed.length === 1 ? "it" : "them"}. Add ${missed.length === 1 ? "it" : "them"} ` +
        `to lib/siteKeys.ts:allKeysFor — until you do, deleting or renaming a website leaves that ` +
        `data behind.`
    );
  }
  return [...new Set(out)];
}

/**
 * A DESIGN'S COMPILED STYLESHEET. Global, immutable, and named by its own contents.
 *
 * ── WHY IT IS NOT PER-SITE-PER-PAGE ───────────────────────────────────────────────────────────
 * It used to be `site-<id>-designcss-<page>[-pub]`, and that key named a place the design does not
 * live. A design belongs to no single page: several pages share it, `clone-page` moves it between
 * sites, and the section and page libraries are global by design. So every code path that copied
 * content had to ALSO remember to copy a value nothing in the content pointed at — and forgetting
 * was silent, produced `ok: true`, and only surfaced when somebody looked at the page. That is the
 * shape of every stylesheet bug this codebase has had: `make-template` shipping unstyled
 * templates, `copySiteContent` dropping the sheet so no template could ever be used, `split-page`
 * losing it and then deleting the source, the section library stranding it.
 *
 * Now the BLOCK carries the id (`DesignSection.props.sheet`) and this key holds the sheet. Every
 * copy path already copies block props verbatim — that is all any of them do — so the stylesheet
 * travels by construction. There is no line left to omit.
 *
 * ⚠️ CONTENT-ADDRESSED, SO IMMUTABLE. The id is a hash of the source markup, which means a given
 * id always names the same bytes: nothing can overwrite a sheet another page is using, two imports
 * of the same design dedupe for free, and there is NO draft/published split — an immutable sheet
 * has nothing to promote, so content and stylesheet can never disagree. Recompiling is an ordinary
 * edit: compile → new id → rewrite `props.sheet` in the DRAFT → it goes live when the page is
 * published, through the guard, with a revision, like every other change.
 *
 * The tradeoff taken knowingly: unreferenced sheets accumulate. That is a cleanup job visible to a
 * refcount scan, against a previous failure mode of a site going live unstyled with a green receipt.
 */
export const designSheet = (sheetId: string) => `design-sheet-${safe(sheetId)}`;

/**
 * The design's ORIGINAL markup, keyed by the same id as its sheet.
 *
 * Was `site-<id>-designsrc-<page>`, written in exactly one place, read in exactly one, and copied
 * by NONE — so every cloned, duplicated, templated or split page was permanently un-recompilable,
 * which is the entire thing the archive was added to prevent. Same id as the sheet means it now
 * travels wherever the block travels, and identical imports share one copy.
 */
export const designSource = (sheetId: string) => `design-src-${safe(sheetId)}`;

/**
 * THE PAGE LIBRARY — a whole page, saved once, droppable onto any website.
 *
 * ⚠️ ONE KEY PER ENTRY, PLUS A SMALL INDEX. The section library keeps every saved band in ONE
 * array (`sjc-section-library`), which means the picker reads megabytes to render a list of names,
 * and the store's save-guard stringifies the whole thing twice on every write. A page is far
 * bigger than a band — an imported one carries markup for a dozen sections — so the same shape
 * would be the 50KB-blob mistake `designSheet` above exists to avoid, one level up.
 *
 * The index holds names and provenance only. The entry is fetched at the moment it is inserted.
 */
export const pageLibraryEntry = (id: string) => `page-lib-${safe(id)}`;
export const PAGE_LIBRARY_INDEX = "sjc-page-library";

/** The registry of all websites. One key, not per-site. */
export const SITES_KEY = "sjc-sites";

/**
 * The form library. One key, not per-site — and that is only safe because a form carries no
 * destination and no business facts (see lib/formsShared.ts). A global library of QUESTIONS
 * cannot leak one client into another; a global library of anything with an email or a
 * spreadsheet id on it could.
 */
export const FORMS_KEY = "sjc-forms";

/**
 * The invoice book, and your own business details.
 *
 * One key, not per-site — and unlike the form library, that is NOT because the contents are
 * neutral. An invoice names a customer and an amount. It is global because these are Steven's own
 * business records, belonging to the person doing the billing rather than to any website, exactly
 * like the brand or the login. No public page ever reads this key.
 */
export const INVOICES_KEY = "sjc-invoices";

/**
 * The dial board's list of call sheets — a name, a spreadsheet id and a tab, per list.
 *
 * ⚠️ WHAT MAKES THIS KEY SAFE IS HOW LITTLE IS IN IT. No prospect, no note, no call history: all of
 * that lives in the Google Sheet and is read live on every load. Steven's own prospecting lists on
 * his own desk — never a client's leads. See the boundary note at the top of lib/dial.ts.
 */
export const DIAL_KEY = "sjc-dial";
