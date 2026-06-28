// The site's editable pages, in the order they appear in the builder's page-switcher
// dropdown. Single source of truth: the switcher and the /edit/[page] route both read this.
// (This is also the seed of the future dynamic/clone model — for now it's our own fixed pages.)
export type PuckPage = { slug: string; title: string };

// Every page on the site, in switcher order. Slugs are the Puck data keys (decoupled from the
// public route — e.g. the /industries/hvac page is keyed "industry-hvac").
export const PUCK_PAGES: PuckPage[] = [
  { slug: "home", title: "Home" },
  { slug: "about", title: "About" },
  { slug: "industries", title: "Industries" },
  { slug: "med-spa", title: "Med Spa" },
  { slug: "industry-hvac", title: "Industry — HVAC" },
  { slug: "industry-roofing", title: "Industry — Roofing" },
  { slug: "industry-garage-doors", title: "Industry — Garage Doors" },
  { slug: "faqs", title: "FAQs" },
  { slug: "case-study", title: "Case Study" },
  { slug: "what-changed", title: "What Changed" },
  { slug: "tech", title: "Tech" },
  { slug: "board-of-directors", title: "Board of Directors" },
  { slug: "raising-capital", title: "Raising Capital" },
  { slug: "podcast", title: "Podcast" },
  { slug: "for-agencies", title: "For Agencies" },
];

export const findPage = (slug: string) => PUCK_PAGES.find((p) => p.slug === slug);
