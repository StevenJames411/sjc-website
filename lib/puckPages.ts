// The site's editable pages, in the order they appear in the builder's page-switcher
// dropdown. Single source of truth: the switcher and the /edit/[page] route both read this.
// (This is also the seed of the future dynamic/clone model — for now it's our own fixed pages.)
export type PuckPage = { slug: string; title: string };

// Only pages that have been converted onto the builder appear in the switcher. The complex,
// interactive pages (home, industries, med-spa) stay on the current editor until they get the
// richer blocks they need (charts, the hero reel, card grids) — so they're intentionally absent.
export const PUCK_PAGES: PuckPage[] = [
  { slug: "about", title: "About" },
  { slug: "faqs", title: "FAQs" },
  { slug: "case-study", title: "Case Study" },
  { slug: "tech", title: "Tech" },
  { slug: "board-of-directors", title: "Board of Directors" },
  { slug: "raising-capital", title: "Raising Capital" },
  { slug: "podcast", title: "Podcast" },
  { slug: "scratch", title: "Scratch (test)" },
];

export const findPage = (slug: string) => PUCK_PAGES.find((p) => p.slug === slug);
