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
  };
}

/** The registry of all websites. One key, not per-site. */
export const SITES_KEY = "sjc-sites";
