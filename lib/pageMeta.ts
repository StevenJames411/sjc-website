import { readPuckPublished } from "@/lib/puckContent";

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
  title: "Steven James Consulting — Your AI Growth Partner",
  description:
    "We install a native AI operating system on top of the software you already run — AI employees that answer every lead in seconds, work your old leads, close and book appointments, cover the phones 24/7, and keep customers coming back. Nothing to switch, nothing new to learn. You get the growth and stay in control of your own system.",
  ogTitle: "Steven James Consulting — AI employees for your business",
  ogDescription:
    "AI employees that answer every lead in seconds, work your old leads, book the appointments, and cover the phones 24/7 — installed on top of the software you already run. Nothing to switch, nothing new to learn.",
  twitterDescription:
    "AI employees that answer every lead in seconds, book the appointments, and cover the phones 24/7 — on top of the software you already run.",
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
    const data = await readPuckPublished(slug);
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
      // Left unset unless a picture was chosen, so the generated card in the nearest
      // opengraph-image.tsx keeps winning — setting `images` here would override it.
      ...(shareImage ? { images: [shareImage] } : {}),
    },
    twitter: {
      card: "summary_large_image" as const,
      title: ogTitle,
      description: ogDescription,
      ...(shareImage ? { images: [shareImage] } : {}),
    },
  };
}
