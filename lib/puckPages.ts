// The site's editable pages, in the order they appear in the builder's page-switcher
// dropdown. Single source of truth: the switcher and the /edit/[page] route both read this.
export type PuckPage = { slug: string; title: string };

// EVERY page on the site — the list is deliberately short. If a page isn't reachable by a
// visitor, it doesn't belong here and it doesn't belong in app/ either. (2026-07-27: ten
// orphaned pages from abandoned directions were deleted outright — med-spa, the industry
// pages, the trap/funnel pages, board-of-directors, raising-capital, tech, for-agencies,
// what-changed. Nothing linked to them and none had ever been advertised.)
export const PUCK_PAGES: PuckPage[] = [
  { slug: "home", title: "Home" },
  { slug: "nav", title: "Navigation (site-wide)" },
  { slug: "footer", title: "Footer (site-wide)" },
  { slug: "about", title: "About" },
  { slug: "podcast", title: "Podcast" },
  // ⛔ REMOVED 2026-08-21: faqs · apply · guest. All three were listed here and 404 to visitors —
  // no draft content, no published content, and nothing on the site linked to them. They sat in
  // the builder's page dropdown looking like real pages. /guest is redundant besides: the podcast
  // page now carries the guest intake form itself, which is where somebody pitching the show
  // already is. Nothing was lost — there was nothing in them to lose.
  // ⚠️ Found by auditing the LIVE site, not this file. The registry had drifted and no read of it
  // would ever have said so.
  { slug: "websites", title: "Websites ($795 offer)" },
  // /websites carries its OWN header + footer, not the site-wide ones — the global nav's DIY
  // link points at the free community that teaches exactly what that page sells.
  { slug: "websites-nav", title: "Websites — Header" },
  { slug: "websites-footer", title: "Websites — Footer" },
  // ⚠️ VESTIGIAL. Steven's original scratch pad from the SiteDrop port, kept as an SJC page slug
  // because its data was carried over rather than rebuilt.
  //
  // A registry site now owns this id, and a registry site always wins, so this entry is
  // unreachable — but it is NOT a template to copy. Demos belong in the registry, where they get
  // their own identity, their own brand and noindex until they have a domain. A demo that is an
  // SJC *page* gets none of that: it inherits SJC's header, footer and metadata, which is exactly
  // why this one looked wrong.
  //
  // The old comment here claimed noindex and SJC chrome were handled automatically "because the
  // page carries its own SiteHeader". That rule was replaced by a site.kind check in
  // lib/publicSitePage.tsx and the claim had been false for some time.
  { slug: "lucky-dog-wash-house", title: "Lucky Dog Wash House (old scratch pad)" },
];

export const findPage = (slug: string) => PUCK_PAGES.find((p) => p.slug === slug);

// ── SITE-WIDE CHROME ─────────────────────────────────────────────────────────────────────────
// The two documents that are NOT pages: they wrap every page of a site. Kept as one exported list
// because three separate files have to agree about them, and they disagree the moment the list is
// retyped:
//   lib/pageRegistry  — grants these two built-ins to a CLIENT site (the rest stay SJC-only)
//   lib/publicSitePage — renders them as chrome, AND refuses to serve them as pages
//   the editor         — reaches them at /edit/<site>/nav via the generic [page] route
//
// ⛔ CHROME IS NOT A PAGE. `findPageMeta` searches built-ins, so a chrome slug in a site's registry
// would otherwise resolve through the public catch-all and serve a bare header at /nav. Anything
// added here must be excluded from public routing in the same commit.
export const CHROME = ["nav", "footer"] as const;
export const isChrome = (slug: string) => (CHROME as readonly string[]).includes(slug);

/**
 * Pages that are PUBLIC but deliberately kept out of search and out of AI assistants.
 *
 * ⛔ /careers IS NOT SECRET — it is linked in the nav and anyone can read it. Steven, 2026-09-01,
 * as indexing went wide: *"I really don't want that indexed. I don't want people blowing me up for
 * a job."* Reachable for someone he sends there, invisible to a stranger searching for work.
 *
 * ⚠️ NOINDEX, NOT A robots.txt DISALLOW. Disallow stops the crawl, which means the noindex tag is
 * never read, and a page linked from the nav can still surface as a bare URL. The meta tag is what
 * actually keeps it out.
 *
 * ⚠️ ONE LIST, TWO CONSUMERS — app/sitemap.ts drops these, and lib/publicSitePage's metadataFor
 * tags them. Two hand-maintained lists would drift, and the failure is silent in both directions.
 */
export const NOINDEX_SLUGS = new Set(["careers"]);
export const isNoindex = (slug: string) => NOINDEX_SLUGS.has(slug);
