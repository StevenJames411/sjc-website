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
  { slug: "faqs", title: "FAQs" },
  { slug: "apply", title: "Apply (intake form)" },
  { slug: "guest", title: "Podcast Guest Intake" },
  { slug: "websites", title: "Websites ($795 offer)" },
  // /websites carries its OWN header + footer, not the site-wide ones — the global nav's DIY
  // link points at the free community that teaches exactly what that page sells.
  { slug: "websites-nav", title: "Websites — Header" },
  { slug: "websites-footer", title: "Websites — Footer" },
];

export const findPage = (slug: string) => PUCK_PAGES.find((p) => p.slug === slug);
