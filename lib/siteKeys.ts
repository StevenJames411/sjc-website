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

/** The storage keys for one website. */
export function siteKeys(siteId: string) {
  const id = safe(siteId) || SJC;
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
     * The compiled stylesheet for a page that came from a bought design.
     *
     * Kept in its OWN key rather than inside the page data on purpose: the save-guard in the store
     * layer refuses writes that drop keys or gut a section, and a 50KB blob of CSS riding inside
     * the content would make every diff it inspects meaningless. Same draft/`-pub` convention as
     * the content, so a design change publishes with the page it belongs to instead of going live
     * the moment it's imported.
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
