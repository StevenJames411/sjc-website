import { Render } from "@measured/puck";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { config } from "@/components/puck/config";
import { readPuckPublished } from "@/lib/puckContent";
import { findPageMeta } from "@/lib/pageRegistry";
import { findSite } from "@/lib/sites";
import { SJC } from "@/lib/siteKeys";
import { fillBusinessTokens } from "@/lib/businessTokens";
import { SiteProvider } from "@/components/blocks/SiteContext";
import type { Site } from "@/lib/sitesShared";

// Rendering + metadata for ONE page of ONE website, shared by the two public catch-all routes:
//
//   /<site>          -> that website's home page
//   /<site>/<page>   -> a deeper page of it
//   /<sjc-page>      -> an SJC page made in the builder (what this used to be the only case for)
//
// Kept in one file so a client site and an SJC page can never drift into being rendered by two
// different sets of rules.

/** A page carrying its own SiteHeader belongs to another business, not to SJC. */
export function hasBlock(data: unknown, type: string): boolean {
  const content = (data as { content?: { type?: string }[] } | null)?.content;
  return Array.isArray(content) && content.some((b) => b?.type === type);
}

/** First block of a given type anywhere in the tree, and one of its props. */
export function propOf(node: unknown, type: string, prop: string): string | null {
  if (Array.isArray(node)) {
    for (const child of node) {
      const hit = propOf(child, type, prop);
      if (hit) return hit;
    }
    return null;
  }
  if (!node || typeof node !== "object") return null;
  const n = node as { type?: string; props?: Record<string, unknown>; content?: unknown };
  if (n.type === type) {
    const v = n.props?.[prop];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  if (n.props) {
    for (const value of Object.values(n.props)) {
      const hit = propOf(value, type, prop);
      if (hit) return hit;
    }
  }
  return n.content ? propOf(n.content, type, prop) : null;
}

/** First absolute photo on the page — the link-preview image when none was chosen. */
export function firstImage(node: unknown): string | null {
  if (Array.isArray(node)) {
    for (const child of node) {
      const hit = firstImage(child);
      if (hit) return hit;
    }
    return null;
  }
  if (!node || typeof node !== "object") return null;
  const props = (node as { props?: Record<string, unknown> }).props;
  if (props) {
    const src = props.src;
    // Absolute only — a preview card is fetched by Apple/Google/Meta, not by the browser, so a
    // relative path resolves against nothing and the card comes back blank.
    if (typeof src === "string" && /^https?:\/\//.test(src)) return src;
    for (const value of Object.values(props)) {
      const hit = firstImage(value);
      if (hit) return hit;
    }
  }
  const content = (node as { content?: unknown }).content;
  return content ? firstImage(content) : null;
}

/** Strip an internal note-to-self label — "(demo)", "(v2)" — off a client-facing name. */
export const cleanName = (s: string) =>
  String(s || "").replace(/\s*\((demo|draft|v\d+|wip|copy|old|test)\)\s*$/i, "").trim();

export type Resolved = { site: Site; slug: string; data: unknown } | null;

/**
 * Find the published page behind a public URL, or null if there isn't one.
 *
 * `homeFallback` — a website's front page is whatever page comes FIRST, not necessarily one whose
 * slug happens to be "home". Assuming the literal slug already 404'd a live client site once: its
 * first page was created as "home-2" because of a name collision, and the site went dark at its
 * own address while the page itself was fine. The site is the thing being addressed; it should
 * serve its first page regardless of what that page is called.
 */
export async function resolvePage(
  siteId: string,
  page: string,
  homeFallback = false
): Promise<Resolved> {
  const site = await findSite(siteId);
  if (!site) return null;

  let meta = await findPageMeta(page, siteId);
  if (!meta && homeFallback) {
    const { readPages } = await import("@/lib/pageRegistry");
    meta = (await readPages(siteId))[0];
  }
  if (!meta) return null;

  const raw = await readPuckPublished(meta.slug, siteId);
  if (!raw) return null;

  // Fill {{business.*}} from the website's settings. Public render only — see lib/businessTokens
  // for why the builder deliberately keeps showing the raw token.
  const data = fillBusinessTokens(raw, site.business, site.domain ? `https://${site.domain}` : "");
  return { site, slug: meta.slug, data };
}

/**
 * Link-preview + search metadata for a public page.
 *
 * ⚠️ THE INHERITANCE TRAP. Next.js merges metadata down from app/layout.tsx and og:* is all or
 * nothing — setting `title` alone does NOT set og:title. A client's page with no openGraph block
 * of its own therefore previews, when texted, as "Steven James Consulting — AI employees for your
 * business" over the SJC card. So a non-SJC site always emits a COMPLETE block, even where that
 * means repeating a value or emitting an empty string on purpose.
 */
export function metadataFor(r: NonNullable<Resolved>, path: string) {
  const { site, data } = r;
  const root = ((data as { root?: { props?: Record<string, unknown> } } | null)?.root?.props ??
    {}) as Record<string, unknown>;
  const str = (k: string) => (typeof root[k] === "string" ? (root[k] as string).trim() : "");

  const isClient = site.kind !== "sjc";
  const label = cleanName(site.business?.name || site.name);

  const title = str("title") || (isClient ? label : "");
  const description =
    str("description") ||
    site.seo?.description ||
    (isClient ? propOf(data, "SiteHeader", "tagline") || propOf(data, "Heading", "text") || "" : "");
  const businessName = str("businessName") || site.seo?.businessName || (isClient ? label : "");
  const ogImage = str("shareImage") || site.seo?.shareImage || (isClient ? firstImage(data) : null);

  const openGraph = isClient
    ? {
        title: title || businessName,
        description,
        siteName: businessName || title,
        url: path,
        type: "website" as const,
        // An explicit value overrides the generated card in app/opengraph-image.tsx. `[]` is the
        // deliberate no-image case: a plain text preview is honest, SJC's logo on a groomer's
        // site is not.
        images: ogImage ? [ogImage] : [],
      }
    : {
        ...(title ? { title } : {}),
        ...(description ? { description } : {}),
        ...(ogImage ? { images: [ogImage] } : {}),
      };

  return {
    ...(title ? { title: { absolute: title } } : {}),
    ...(isClient || description ? { description } : {}),
    openGraph,
    twitter: {
      card: ogImage ? ("summary_large_image" as const) : ("summary" as const),
      ...(title ? { title } : {}),
      ...(isClient || description ? { description } : {}),
      ...(ogImage ? { images: [ogImage] } : {}),
    },
    // A client's site lives on the SJC domain until they buy their own, carrying a real business's
    // name, phone and address, while robots.txt welcomes every AI crawler. Until it's on its own
    // domain it stays out of the index.
    ...(isClient && !site.domain
      ? { robots: { index: false, follow: false, nocache: true } }
      : {}),
  };
}

/** The page itself. SJC chrome only when the page didn't bring its own. */
export function SitePageBody({ data, siteId }: { data: unknown; siteId: string }) {
  const ownHeader = hasBlock(data, "SiteHeader");
  const ownFooter = hasBlock(data, "SiteFooter");
  return (
    <>
      {ownHeader ? null : <Nav />}
      <main>
        {/* Blocks read the site from here rather than from an editable field — the lead form's
            destination in particular must never depend on someone typing it correctly. */}
        <SiteProvider siteId={siteId}>
          <Render config={config} data={data as never} />
        </SiteProvider>
      </main>
      {ownFooter ? null : <Footer />}
    </>
  );
}

export { SJC };
