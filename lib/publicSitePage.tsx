import { Render } from "@measured/puck";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { config } from "@/components/puck/config";
import { readPuckPublished, sheetsFor } from "@/lib/puckContent";
import { applyTypeScale } from "@/lib/typeScale";
import { applyColorMap } from "@/lib/designColors";
import { resolveFormPointers } from "@/lib/formPointer";
import { readForms } from "@/lib/forms";
import { findPageMeta, readPages } from "@/lib/pageRegistry";
import { isChrome } from "@/lib/puckPages";
import { defaultChrome } from "@/lib/siteChrome";
import { findSite } from "@/lib/sites";
import { SJC } from "@/lib/siteKeys";
import { fillBusinessTokens } from "@/lib/businessTokens";
import { SiteProvider } from "@/components/blocks/SiteContext";
import BrandStyle from "@/components/BrandStyle";
import { readBrand } from "@/lib/brand";
import { reachability, type Site } from "@/lib/sitesShared";
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

  // ⛔ AN OLD ADDRESS STILL HAS TO ANSWER. Changing a page's URL records a redirect
  // (lib/pageRegistry.changeSlug), and without this the record was inert — the fix for a typo'd
  // slug would silently break every link already texted, printed on a card or indexed by Google,
  // which is worse than living with the typo. Resolved BEFORE the home fallback so a renamed page
  // lands on itself rather than on the home page, which would look like it worked.
  if (!meta) {
    const { resolveRedirect } = await import("@/lib/pageRegistry");
    const to = await resolveRedirect(page, siteId);
    if (to && to !== page) {
      const moved = await findPageMeta(to, siteId);
      if (moved) meta = moved;
    }
  }

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

  // ⛔ THE FAVICON. Every client site has shipped wearing whatever the platform default is, because
  // there has never been a control — grep for "favicon" across this codebase before today returns
  // nothing. Wix, Squarespace and GoHighLevel all put this in step one of setup; it is the small
  // thing a business owner notices immediately when they open their own site in a tab beside their
  // competitors'.
  //
  // ⚠️ CLIENT SITES ONLY. SJC's own favicon is a file in the repo; overriding it from a site record
  // would let a settings screen change the studio's own identity.
  const favicon = isClient ? String(site.seo?.favicon || "").trim() : "";

  return {
    ...(title ? { title: { absolute: title } } : {}),
    ...(isClient || description ? { description } : {}),
    ...(favicon ? { icons: { icon: favicon, shortcut: favicon, apple: favicon } } : {}),
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
    // ...or while it is deliberately held back on a real domain — see Site.holdIndexing.
    ...(isClient && !reachability(site).indexable
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
/**
 * Analytics and ad pixels, emitted from the ids already stored against this website.
 *
 * ⛔ THE FIELD THAT SAVED AND NEVER FIRED. `metaPixelId` has lived on the Site record since the
 * account list existed — a customer could type their pixel into the studio, see it saved, and
 * nothing was ever emitted onto their website. That is worse than not offering the field at all: a
 * business believes its ad spend is being measured while nothing is measuring it, and there is no
 * symptom until somebody goes looking months later.
 *
 * ⚠️ READ FROM `site.accounts`, NOT A NEW FIELD. Adding a second place to type a pixel id would mean
 * two homes for one fact and a customer guessing which one the website reads — the exact disease
 * this codebase has already paid for with eight entry points to a form. `accounts` is deliberately
 * open, so a Google Analytics id needs no schema change either.
 *
 * ⚠️ IDS ARE VALIDATED, NOT TRUSTED. They are typed by hand into a settings box and land inside a
 * <script>. Anything that is not the shape of a real id is refused rather than escaped — there is
 * no legitimate analytics id containing a quote or an angle bracket.
 *
 * ⚠️ NO CONSENT BANNER, AND SOMEBODY SHOULD DECIDE THAT ON PURPOSE. This fires on load for every
 * visitor, which is what these businesses expect and what every competitor does. A customer selling
 * into the EU would need to revisit it. Flagged, not solved.
 */
function SiteTracking({ accounts }: { accounts?: Record<string, string> }) {
  const ga = String(accounts?.gaId || "").trim();
  const pixel = String(accounts?.metaPixelId || "").trim();
  const safeGa = /^(G|UA|AW|GT)-[A-Z0-9-]{4,20}$/i.test(ga) ? ga : "";
  const safePixel = /^\d{6,20}$/.test(pixel) ? pixel : "";
  if (!safeGa && !safePixel) return null;

  return (
    <>
      {safeGa ? (
        <>
          <script async src={`https://www.googletagmanager.com/gtag/js?id=${safeGa}`} />
          <script
            dangerouslySetInnerHTML={{
              __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${safeGa}');`,
            }}
          />
        </>
      ) : null}
      {safePixel ? (
        <script
          dangerouslySetInnerHTML={{
            __html: `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${safePixel}');fbq('track','PageView');`,
          }}
        />
      ) : null}
    </>
  );
}

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

  const ownHeader = isClientSite || hasBlock(data, "SiteHeader");
  const ownFooter = isClientSite || hasBlock(data, "SiteFooter");
  // SJC's own pages are already branded by the root layout — re-emitting would be identical CSS.
  const brand = siteId && siteId !== SJC ? await readBrand(true, siteId) : null;

  // The stylesheets this page's blocks actually reference, read off the data already loaded above.
  // Each design's rules are scoped under its own `sjc-design-<id>` class, which rides on the
  // DesignSection block itself (lib/designShared) — so this only has to EMIT them, and the builder
  // canvas, rendering the same blocks, styles identically.
  //
  // ⚠️ Passing `data` rather than a page slug IS the fix. The old lookup was per page and fell back
  // to any sibling page's sheet when a page had none, so a band could silently wear a different
  // design's stylesheet. A page now emits exactly what its blocks name, and a page with no design
  // blocks emits nothing at all.

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

  // ── THIS SITE'S OWN SITE-WIDE CHROME ───────────────────────────────────────────────────────
  // The missing third option. There used to be only two: SJC's global chrome, or chrome duplicated
  // into every single page. A client site always got the second, and it drifts the moment a site
  // has two pages — the header gets edited on one and not the other.
  //
  // ⚠️ KEYED BY siteId, ALWAYS. There is deliberately NO path from a missing client document to
  // SJC's chrome. The leak that produced this whole rule was a client page wearing Steven's nav,
  // linking to the free community that teaches what he charges for.
  //
  // ⛔ AND IT EXISTS BY DEFAULT. Steven: "I want a header and footer to be on every website by
  // default. We don't need to add extra steps." A published document wins; with none, the site
  // still renders real chrome GENERATED FROM ITS OWN BUSINESS RECORD (lib/siteChrome) instead of
  // nothing. Falling back to nothing is exactly what left the SJC-2026 card looking stripped — the
  // header had left the page and its new home was still an unpublished draft.
  //
  // ⚠️ AN IMPORTED DESIGN CARRIES ITS HEADER INSIDE ITS MARKUP, so a default above it would show
  // TWO headers. Those pages keep the old behaviour and get no generated chrome.
  //
  // ⚠️ Placed AFTER findSite on purpose: the generated chrome reads site.business, so computing it
  // any earlier is a use-before-declaration on `site`.
  const importedDesign = hasBlock(data, "DesignSection");
  const fallback =
    isClientSite && site && !importedDesign ? defaultChrome(site, await readPages(siteId)) : null;

  // ⛔ A DOCUMENT WITH NO `content` ARRAY IS NOT CHROME — IT IS A 500.
  // `<Render>` walks `data.content`. Hand it a truthy object without one and Puck throws
  // "Cannot use 'in' operator to search for 'props' in undefined" — the whole page, not just the
  // header. The way in is mundane: publishing a page list that includes `nav` and `footer` on a
  // site whose chrome drafts are still empty stamps `{_pub:1}` over nothing, and `{_pub:1}` is
  // truthy. That took ten freshly-imported pages to a blank 500 on 2026-08-11 while the stored
  // page data was perfect, which is the worst possible place to be looking.
  //
  // So presence is decided by CONTENT, not by truthiness — and an empty document now falls
  // through to the generated fallback exactly as a missing one does.
  const usable = (doc: unknown) =>
    Array.isArray((doc as { content?: unknown } | null)?.content) &&
    ((doc as { content: unknown[] }).content.length > 0)
      ? doc
      : null;

  // ⛔ CHROME GETS THE TOKEN PASS TOO — IT DID NOT, AND THAT SHIPPED RAW TOKENS TO THE PUBLIC SITE.
  //
  // The page body is run through fillBusinessTokens up in `pageData`. The header and footer are
  // loaded HERE, separately, and were handed to the renderer untouched. Nobody noticed because
  // chrome held literal phone numbers — until the site was tokenized, at which point every page
  // rendered `{{business.phone}}` raw in a title attribute, an `sms:` href and visible text.
  //
  // ⚠️ IT LOOKED LIKE A PAGE BUG AND WAS NOT. The leak count was IDENTICAL on every page — 14 on
  // the home page, 14 on /about, 14 on /careers — which is the tell: content that does not vary
  // per page is not coming from the page. One shared surface, missed once, wrong everywhere.
  const fillChrome = <T,>(doc: T): T =>
    site ? fillBusinessTokens(doc, site.business, site.domain ? `https://${site.domain}` : "") : doc;

  const chrome = isClientSite
    ? {
        nav: fillChrome(usable(await readPuckPublished("nav", siteId)) || fallback?.nav || null),
        footer: fillChrome(usable(await readPuckPublished("footer", siteId)) || fallback?.footer || null),
      }
    : { nav: null, footer: null };

  // ⛔ THE HEADER AND FOOTER HAVE THEIR OWN STYLESHEETS, AND THIS USED TO EMIT ONLY THE PAGE'S.
  //
  // A page emits exactly what its blocks name — correct, and the reason a band can no longer
  // silently wear a different design's sheet. But the header and footer are not in `data`: they
  // are separate documents (`nav` / `footer`, lifted there on 2026-08-11), read a few lines above
  // and rendered around the page. Their sheet was never gathered.
  //
  // ⚠️ IT WAS HIDDEN BY A COINCIDENCE, WHICH IS WHY IT SURVIVED. Each page's ORIGINAL imported
  // sheet was compiled from markup that still contained the header, so the page's own stylesheet
  // happened to carry the header's rules. Chrome was styled by a sheet that had no idea it was
  // doing it. The moment sheets were recompiled from the archived source, that accident ended and
  // every page except the one whose sheet the nav shares rendered a NAKED header — raw link text
  // and an unstyled hamburger, on the live site:
  //
  //   podcast referenced 894d8686 (its own) and b9433d90 (the nav's); only 894d8686 was emitted.
  //
  // Gathering all three is what the rule always meant: emit exactly what the rendered page names.
  // ⚠️ THE SIZES ARE APPLIED TO THE SHEET ON ITS WAY OUT, never to the stored copy — which is
  // content-addressed, immutable and shared by every page referencing it. Clearing the map restores
  // the design byte-for-byte with nothing to recompile. See lib/typeScale.
  // Sizes then colours, both rewritten on the sheet's way out — the stored copy is immutable and
  // shared, so clearing either map restores the design byte-for-byte. See lib/typeScale.
  const designCss = applyColorMap(
    applyTypeScale(await sheetsFor([data, chrome.nav, chrome.footer].filter(Boolean)), brand?.typeScale),
    brand?.colorMap
  );

  // ── ⛔ THE FOOTER CAN MIRROR THE HEADER'S LINKS ──────────────────────────────────────────────
  // Steven, after rewriting every menu description in the studio and finding the footer unchanged:
  // "the global footer and global header — are they able to be the same thing or not?"
  //
  // The honest answer was that content.ts derives both lists from one source, but only at PORT
  // time — `--chrome` writes two INDEPENDENT documents, and after that editing one does nothing to
  // the other. "Edit once, both update" was true of the code and false of the builder.
  //
  // ⚠️ THIS IS THE ONLY PLACE BOTH DOCUMENTS EXIST. FooterView receives its own block's props and
  // has no way to see the nav document, so the mirror has to happen at this seam.
  //
  // ⚠️ THE BUILDER CANVAS WILL NOT SHOW IT. The editor renders one block in isolation, so the
  // footer's canvas keeps showing its own stored groups. The LIVE page is what mirrors — judge it
  // published, not in the editor.
  //
  // OFF BY DEFAULT, and Steven named why: "maybe for all of our future builds, we leave them
  // separated unless we want them joined." A client footer usually wants to be shorter than the
  // menu.
  if (chrome.nav && chrome.footer) {
    type Blk = { type?: string; props?: Record<string, unknown> };
    const footerBlk = ((chrome.footer as { content?: Blk[] }).content || []).find(
      (b) => b?.type === "SiteFooter"
    );
    if (footerBlk?.props?.mirrorHeaderLinks) {
      const navBlk = ((chrome.nav as { content?: Blk[] }).content || []).find(
        (b) => b?.type === "SiteHeader"
      );
      const navLinks = (navBlk?.props?.links || []) as {
        label?: string; target?: string; note?: string; group?: string;
      }[];
      // Group by the nav link's own `group` field — the same thing that titles the menu's columns,
      // so the footer's headings come out identical without being typed again.
      const grouped: { heading: string; links: { label: string; target: string; note: string }[] }[] = [];
      for (const l of navLinks) {
        if (!l?.label) continue;
        const heading = l.group || "";
        const bucket = grouped.find((g) => g.heading === heading);
        const item = { label: l.label, target: l.target || "#", note: l.note || "" };
        if (bucket) bucket.links.push(item);
        else grouped.push({ heading, links: [item] });
      }
      if (grouped.length) {
        // A copy — never mutate the cached document the store handed back.
        chrome.footer = {
          ...(chrome.footer as object),
          content: ((chrome.footer as { content?: Blk[] }).content || []).map((b) =>
            b === footerBlk ? { ...b, props: { ...b.props, groups: grouped } } : b
          ),
        } as typeof chrome.footer;
      }
    }
  }

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
      {/* Only on a client's own site, and only from an id somebody deliberately stored. Nothing is
          injected onto a page whose owner has not asked for it. */}
      {isClientSite ? <SiteTracking accounts={site?.accounts} /> : null}
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
