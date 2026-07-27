import type { MetadataRoute } from "next";

// /sitemap.xml — the map crawlers (and AI indexers) use to find every page worth reading.
// Referenced from robots.ts. Keep this to the CURRENT public pages; add a line when a new page
// should be indexed. (Stale/retired pages stay off the list on purpose.)
const BASE = "https://www.stevenjamesconsulting.com";

const PAGES: { path: string; priority: number }[] = [
  { path: "/", priority: 1 },
  { path: "/about", priority: 0.8 },
  { path: "/podcast", priority: 0.7 },
  { path: "/faqs", priority: 0.7 },
  { path: "/websites", priority: 0.7 },
  { path: "/apply", priority: 0.6 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return PAGES.map(({ path, priority }) => ({
    url: `${BASE}${path}`,
    lastModified,
    changeFrequency: "monthly",
    priority,
  }));
}
