import type { MetadataRoute } from "next";
import { resolveHost, publicUrlFor } from "@/lib/host";
import { readPages } from "@/lib/pageRegistry";
import { readPuckPublished } from "@/lib/puckContent";
import { SJC_HOST } from "@/lib/hostShared";

// /sitemap.xml — the map crawlers (and AI indexers) use to find every page worth reading.
// Referenced from robots.ts.
//
// ⚠️ IT ANSWERS ON WHATEVER DOMAIN ASKS, so it has to know which one that is. It used to be a
// hardcoded list of SJC's paths under a hardcoded SJC hostname — which meant a crawler fetching
// stevenjamesdesigns.com/sitemap.xml was told this site's pages all live on
// stevenjamesconsulting.com. That's an instruction to index the wrong domain.
//
// Three cases, same rule as everywhere else: SJC keeps its curated list, any other site publishes
// its own pages, and a site with no domain publishes NOTHING — a demo is noindex, and listing it
// in a sitemap contradicts that.
export const dynamic = "force-dynamic";

const SJC_BASE = `https://www.${SJC_HOST}`;

const SJC_PAGES: { path: string; priority: number }[] = [
  { path: "/", priority: 1 },
  { path: "/about", priority: 0.8 },
  { path: "/podcast", priority: 0.7 },
  { path: "/faqs", priority: 0.7 },
  // /websites is deliberately absent: the studio moved to its own domain and that address only
  // forwards. A sitemap listing a redirect tells Google to index the redirect.
  { path: "/apply", priority: 0.6 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date();
  const h = await resolveHost();

  if (h.kind === "client") {
    // No domain means demo means noindex — nothing to publish. Same when the site is on its
    // real domain but deliberately held back until launch.
    if (!h.site.domain || h.site.holdIndexing) return [];
    const pages = await readPages(h.site.id);
    const origin = publicUrlFor(h.site);

    // ⚠️ PUBLISHED ONLY. Listing every page in the registry put an unpublished duplicate
    // ("home-2", left behind by a re-import) into the sitemap — inviting Google to index an
    // address that serves nothing. A page exists in the builder long before it's meant to be
    // found, and the sitemap is a list of what IS findable.
    const published = await Promise.all(
      pages.map(async (p) => ((await readPuckPublished(p.slug, h.site.id)) ? p : null))
    );

    return published
      .filter((p): p is NonNullable<typeof p> => Boolean(p))
      .map((p, i) => ({
        // The FIRST page is the site's front door and lives at the bare address, whatever it's
        // called — same rule the public router uses. See resolvePage's homeFallback.
        url: i === 0 ? origin : `${origin}/${p.slug}`,
        lastModified,
        changeFrequency: "monthly" as const,
        priority: i === 0 ? 1 : 0.7,
      }));
  }

  // The studio before a site claims its domain, and SJC itself.
  return SJC_PAGES.map(({ path, priority }) => ({
    url: `${SJC_BASE}${path}`,
    lastModified,
    changeFrequency: "monthly" as const,
    priority,
  }));
}
