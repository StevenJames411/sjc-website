import { readPuckPublished } from "@/lib/puckContent";
import { SJC } from "@/lib/siteKeys";

// ── WHERE A PAGE'S LINK-PREVIEW TEXT COMES FROM ───────────────────────────────────────────────
// One rule for the whole site: the Page Settings panel in the builder wins, and what's in this
// file is only the fallback for a field left blank.
//
// It used to be the other way round — every title and description was a literal in a route file,
// so changing the sentence that shows when the site gets texted meant editing code. That made a
// ten-second change into a developer task, and when the model was unreachable the owner couldn't
// touch his own site at all. The fields are defined in components/puck/config.tsx under `root`
// and are edited at /edit/<page> with no block selected.
//
// The fallbacks below are the values these pages already shipped with, kept verbatim so wiring
// this up changed nothing on screen until somebody deliberately types into the panel.

export const SITE_NAME = "Steven James Consulting";

// The site-wide defaults, also imported by app/layout.tsx so the inherited values and the
// fallbacks here can never drift into disagreeing with each other.
export const SITE_DEFAULTS = {
  title: "Turn Your Attention Into Dollars | Steven James Consulting",
  description:
    "A modern day talent agency for coaches, authors and influencers. We turn what you know into a premium product and build the fifteen-stage system that sells it. We turn your attention into dollars.",
  ogTitle: "Steven James Consulting: A Modern Day Talent Agency",
  ogDescription:
    "For coaches, authors and influencers. We turn what you know into a premium product and build the fifteen-stage system that sells it. We turn your attention into dollars.",
  twitterDescription:
    "A modern day talent agency for coaches, authors and influencers. We turn your attention into dollars.",
};

export type PageMetaFallback = {
  /** Path this page lives at, e.g. "/websites". Used for canonical + og:url. */
  path: string;
  title?: string;
  description?: string;
  /** Only when the social card should read differently from the browser tab. */
  ogTitle?: string;
  ogDescription?: string;
};

/**
 * Build a page's metadata from its Page Settings, falling back to what the route shipped with.
 *
 * A store read can fail (network, cold Postgres). If it does we fall back rather than throw —
 * a page that renders with last-known-good preview text beats a 500 on the whole route.
 */
export async function pageMetadata(slug: string, fb: PageMetaFallback) {
  let root: Record<string, unknown> = {};
  try {
    const data = await readPuckPublished(slug, SJC);
    root = ((data as { root?: { props?: Record<string, unknown> } } | null)?.root?.props ??
      {}) as Record<string, unknown>;
  } catch {
    root = {};
  }

  const str = (k: string) => (typeof root[k] === "string" ? (root[k] as string).trim() : "");
  const set = str("title");
  const setDesc = str("description");
  const shareImage = str("shareImage");

  const title = set || fb.title || SITE_DEFAULTS.title;
  const description = setDesc || fb.description || SITE_DEFAULTS.description;

  // A value typed into the panel is meant for BOTH the tab and the social card — the owner
  // shouldn't have to know those are different tags. The separate og* fallbacks only apply while
  // the panel is empty, so the pages that historically differed keep the wording they had.
  const ogTitle = set || fb.ogTitle || fb.title || SITE_DEFAULTS.ogTitle;
  const ogDescription = setDesc || fb.ogDescription || fb.description || SITE_DEFAULTS.ogDescription;
  const siteName = str("businessName") || SITE_NAME;
  const card = shareImage || (slug === "websites" ? "" : "/opengraph-image");

  return {
    title: { absolute: title },
    description,
    alternates: { canonical: fb.path },
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      url: fb.path,
      siteName,
      type: "website" as const,
      // ⛔ Set by default. Declaring `openGraph` here REPLACES the inherited block, file-based
      // image included — leaving `images` unset shipped pages with no picture (09-27). The
      // fallback IS the generated card from app/opengraph-image.tsx, named explicitly.
      // The studio's own page ("websites") is not SJC's AI card, so it keeps no fallback.
      ...(card ? { images: [card] } : {}),
    },
    twitter: {
      card: "summary_large_image" as const,
      title: ogTitle,
      description: ogDescription,
      ...(card ? { images: [card] } : {}),
    },
  };
}
