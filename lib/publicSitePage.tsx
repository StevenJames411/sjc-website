import { Render } from "@measured/puck";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { config } from "@/components/puck/config";
import { readPuckPublished, readDesignCss } from "@/lib/puckContent";
import { resolveFormPointers } from "@/lib/formPointer";
import { readForms } from "@/lib/forms";
import { findPageMeta } from "@/lib/pageRegistry";
import { isChrome } from "@/lib/puckPages";
import { findSite } from "@/lib/sites";
import { SJC } from "@/lib/siteKeys";
import { fillBusinessTokens } from "@/lib/businessTokens";
import { SiteProvider } from "@/components/blocks/SiteContext";
import BrandStyle from "@/components/BrandStyle";
import { readBrand } from "@/lib/brand";
import type { Site } from "@/lib/sitesShared";
import { localBusinessSchema } from "@/lib/siteSchema";
import { publicUrlFor } from "@/lib/hostShared";

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

  // ⛔ CHROME IS NOT A PAGE. `findPageMeta` searches built-ins, so `nav` resolves here and the
  // catch-all would serve a bare header at /nav — a real public URL showing a stranded navbar with
  // no content under it. That was ALREADY true for SJC (`/nav` is not a route folder, so app/[slug]
  // handles it); granting chrome to client sites would have multiplied it across every one of them.
  // Refused for every site, which fixes the existing case at the same time.
  if (isChrome(page)) return null;

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
  // POINTERS BEFORE TOKENS. A library form's questions can themselves contain {{business.*}},
  // so they have to be in the page before the token pass runs or they ship raw to a visitor.
  const withForms = resolveFormPointers(raw, await readForms());
  const data = fillBusinessTokens(withForms, site.business, site.domain ? `https://${site.domain}` : "");
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
export function metadataFor(r: NonNullable<Resolved>, path: string, canonical?: string) {
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
        // ABSOLUTE, from the site's own domain. A relative path resolves against `metadataBase`,
        // which is SJC's — so a client's texted link claimed stevenjamesconsulting.com as its
        // address. The caller passes the canonical it already computed for this exact reason.
        url: canonical || path,
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
    // ⚠️ EVERY CLIENT PAGE USED TO NAME SJC'S HOME PAGE AS ITS CANONICAL.
    //
    // app/layout.tsx sets `alternates: { canonical: "/" }`, and Next merges metadata downward, so
    // a page that declares no `alternates` of its own inherits it. Every client site was therefore
    // telling Google "the real version of this page is stevenjamesconsulting.com" — an instruction
    // to credit SJC for the client's content and drop the client's page from the index. Same
    // inheritance trap as the og: block above, one field over.
    //
    // The caller passes an ABSOLUTE url for a client page, because it is served from THEIR domain
    // once they buy while metadataBase still points at SJC — a path would resolve to the wrong
    // origin. SJC's own pages keep the relative form they've always had.
    alternates: { canonical: canonical || path },
    // A demo lives on the studio's domain carrying a real business's name, phone and address,
    // while robots.txt welcomes every AI crawler. Until it's on its own domain it stays out.
    ...(isClient && !site.domain
      ? { robots: { index: false, follow: false, nocache: true } }
      : {}),
  };
}

/**
 * The page itself. SJC chrome only when the page didn't bring its own.
 *
 * ⚠️ WHY THE BRAND IS APPLIED HERE AND NOT IN THE ROOT LAYOUT. `readBrand(pub, siteId)` has always
 * taken a siteId, and the importer has always WRITTEN a per-site palette — but app/layout.tsx
 * called `readBrand(true)` bare, and it was the only public caller. So every client site rendered
 * in SJC's blue and the palette written for it was dead data. The root layout can't fix this: it
 * has no idea which site the request is for. This function does, and it is already the deliberate
 * can't-drift seam for client-vs-SJC rendering, so it is the right place.
 *
 * The root layout still emits SJC's own brand. This one comes later in document order and both
 * target :root, so the site's own values win on its own pages. SJC's pages never reach here.
 */
export async function SitePageBody({
  data,
  siteId,
  page,
}: {
  data: unknown;
  siteId: string;
  page?: string;
}) {
  // ⚠️ SJC'S CHROME MUST NEVER APPEAR ON A CLIENT'S SITE. The old test was "does this page have a
  // SiteHeader block" — true for a page built in our builder, FALSE for one imported as sealed
  // design, whose header lives inside the markup. So an imported client site rendered SJC's own
  // nav above it: Steven's branding on someone else's business, with a link to the free Skool
  // community that teaches what he charges for.
  //
  // The site's KIND is the real answer. A client site brings its own chrome or has none; it never
  // borrows ours.
  const isClientSite = siteId !== SJC;

  // ── THIS SITE'S OWN SITE-WIDE CHROME ───────────────────────────────────────────────────────
  // The missing third option. Until now there were only two: SJC's global chrome, or chrome
  // duplicated into every single page. The second is what a client site got, and it drifts the
  // moment a site has two pages — the header gets edited on one and not the other.
  //
  // ⚠️ KEYED BY siteId, ALWAYS. There is deliberately no fallback from a missing client document
  // to SJC's chrome; an absent doc falls back to the page's OWN blocks (the old behaviour). That
  // is what keeps the guarantee below intact — the leak that started all of this was a client
  // page wearing Steven's nav, linking to the free community that teaches what he charges for.
  const chrome = isClientSite
    ? {
        nav: await readPuckPublished("nav", siteId),
        footer: await readPuckPublished("footer", siteId),
      }
    : { nav: null, footer: null };

  // ⚠️ SJC'S CHROME MUST NEVER APPEAR ON A CLIENT'S SITE — see the note above. A site-wide document
  // of the site's OWN counts as bringing its own chrome, exactly like an in-page block does.
  const ownHeader = isClientSite || hasBlock(data, "SiteHeader");
  const ownFooter = isClientSite || hasBlock(data, "SiteFooter");
  // SJC's own pages are already branded by the root layout — re-emitting would be identical CSS.
  const brand = siteId && siteId !== SJC ? await readBrand(true, siteId) : null;

  // A page built from a bought design carries its own compiled stylesheet. Every rule in it is
  // scoped under .sjc-design, and that class rides on the DesignSection block itself
  // (lib/designShared) — so this only has to EMIT the stylesheet, and the same rules apply
  // identically in the builder canvas, which renders the same blocks.
  const designCss = page ? await readDesignCss(page, siteId) : "";

  // THIS BUSINESS'S OWN STRUCTURED DATA.
  //
  // The root layout emits SJC's Organization/Service/FAQ blocks on SJC's domain only — a client's
  // page telling Google it was Steven James Consulting is the failure that scoping fixed. But
  // removing it left client sites with nothing at all, which is the wrong end of the trade for a
  // product sold on being found by Google and by AI search.
  //
  // Built entirely from Website settings, so it costs nothing per client: fill in her phone and
  // address at onboarding and the markup writes itself. See lib/siteSchema.
  // ⚠️ FETCHED FOR EVERY SITE NOW, NOT ONLY CLIENTS.
  //
  // It used to be `isClientSite ? … : null`, which was right for the schema below but starved the
  // provider on SJC's OWN pages — so a token in the lead form's thank-you copy had nothing to
  // resolve against and printed raw. The schema still only ships for client sites; that behaviour
  // is unchanged and deliberate (SJC's own Organization markup comes from the root layout).
  const site = await findSite(siteId);
  const schema = site && isClientSite ? localBusinessSchema(site, publicUrlFor(site)) : null;

  const body = (
    <SiteProvider
      siteId={siteId}
      business={site?.business}
      url={site ? publicUrlFor(site) : ""}
    >
      <Render config={config} data={data as never} />
    </SiteProvider>
  );

  return (
    <>
      {schema ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ) : null}
      {brand ? <BrandStyle brand={brand} id="site-brand" /> : null}
      {designCss ? (
        <style id="site-design" dangerouslySetInnerHTML={{ __html: designCss }} />
      ) : null}
      {chrome.nav ? (
        <SiteProvider siteId={siteId} business={site?.business} url={site ? publicUrlFor(site) : ""}>
          <Render config={config} data={chrome.nav as never} />
        </SiteProvider>
      ) : ownHeader ? null : (
        <Nav />
      )}
      <main>
        {/* Blocks read the site from here rather than from an editable field — the lead form's
            destination in particular must never depend on someone typing it correctly. */}
        {body}
      </main>
      {/* Wrapped in its own SiteProvider, same as the body: a footer routinely carries
          {{business.phone}} and an unwrapped Render would ship the raw token to a visitor. */}
      {chrome.footer ? (
        <SiteProvider siteId={siteId} business={site?.business} url={site ? publicUrlFor(site) : ""}>
          <Render config={config} data={chrome.footer as never} />
        </SiteProvider>
      ) : ownFooter ? null : (
        <Footer />
      )}
    </>
  );
}

export { SJC };
