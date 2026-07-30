import { notFound } from "next/navigation";
import { Render } from "@measured/puck";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { config } from "@/components/puck/config";
import { readPuckPublished } from "@/lib/puckContent";
import { findPageMeta } from "@/lib/pageRegistry";

// Public renderer for owner-CREATED pages. Every hardcoded route (app/about, app/podcast,
// app/websites, …) takes precedence over this single-segment catch-all, so it only ever serves
// brand-new pages made in the builder. Renders the PUBLISHED Puck content; a page that isn't in
// the registry, or hasn't been published yet, 404s — which is also what retires a deleted page:
// drop it from PUCK_PAGES and this route stops serving it even if its old data is still in Redis.
export const dynamic = "force-dynamic";

// ── WHAT COUNTS AS A CLIENT DEMO ──────────────────────────────────────────────────────────────
// A page carrying its OWN SiteHeader is, by definition, not an SJC page — it's a demo built for
// somebody else. That single fact drives two things:
//
//   1. no SJC nav/footer wrapped around it (see below), and
//   2. noindex — because it carries a REAL business's name, phone and address on the SJC domain,
//      and robots.txt deliberately says allow-everything to every AI crawler. A leaked URL is all
//      it takes: a shared link, a referrer header, a browser reporting it.
//
// This started as a hardcoded list holding just "lab". That was a trap — demo #2 would have been
// published with nothing protecting it. A rule can't be forgotten; a list can.
//
// (The site's own hardcoded routes — /about, /websites, /apply … — never reach this file, so
// nothing real can be caught by it.)
function hasBlock(data: unknown, type: string): boolean {
  const content = (data as { content?: { type?: string }[] } | null)?.content;
  return Array.isArray(content) && content.some((b) => b?.type === type);
}

// Find the first block of a given type anywhere in the tree and hand back one of its props.
function propOf(node: unknown, type: string, prop: string): string | null {
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

// The first photo on the page, used as the link-preview image when none was chosen explicitly.
// Walks nested slots because a hero usually sits inside a Section or a Column.
function firstImage(node: unknown): string | null {
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
    // relative path resolves against nothing and the card silently comes back blank.
    if (typeof src === "string" && /^https?:\/\//.test(src)) return src;
    for (const value of Object.values(props)) {
      const hit = firstImage(value);
      if (hit) return hit;
    }
  }
  const content = (node as { content?: unknown }).content;
  return content ? firstImage(content) : null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const meta = await findPageMeta(slug);
  const data = meta ? await readPuckPublished(slug) : null;

  // ── EVERY VALUE HERE COMES FROM THE BUILDER'S PAGE SETTINGS PANEL ───────────────────────────
  // Nothing below is hardcoded, on purpose. These used to be four literals in a file, which meant
  // a wrong link preview was a developer ticket instead of a ten-second edit. The fields are
  // defined in components/puck/config.tsx under `root`.
  const root = ((data as { root?: { props?: Record<string, unknown> } } | null)?.root?.props ??
    {}) as Record<string, unknown>;
  const str = (k: string) => (typeof root[k] === "string" ? (root[k] as string).trim() : "");
  const shareImage = str("shareImage");

  // A page carrying its own SiteHeader belongs to another business (see the note above).
  const isDemo = hasBlock(data, "SiteHeader");

  // Blank fields must never fall through to SJC's name on someone else's page, so a demo backstops
  // to the name it was created under ("Lucky Dog Wash House"). Every other route on this site is a
  // real SJC page, where inheriting the SJC default is the correct behaviour — hence the split.
  // The page name is an INTERNAL label — it's what shows in the builder's dropdown, so it carries
  // notes to self like "(demo)" or "(v2)". Those must never reach the client's preview card, and
  // relying on remembering to clear them by hand fails on the seventh demo. Stripped here so the
  // fallback is safe by construction; anything typed into Business name still wins outright.
  const pageName = (meta?.title ?? "").replace(/\s*\((demo|draft|v\d+|wip|copy|old|test)\)\s*$/i, "").trim();
  const title = str("title") || (isDemo ? pageName : "");
  const businessName = str("businessName") || (isDemo ? pageName : "");

  // Description has no safe generic backstop the way a name does, and leaving it blank is what let
  // SJC's "native AI operating system" pitch show up under a groomer's name. So on a demo we fall
  // back to the business's OWN words already on the page — the header tagline, then the first
  // headline — and past that to an explicit empty string, which blocks the inheritance outright.
  // An empty preview line is a cosmetic problem; the wrong company's sales pitch is a lost client.
  const description =
    str("description") ||
    (isDemo
      ? propOf(data, "SiteHeader", "tagline") || propOf(data, "Heading", "text") || ""
      : "");

  // ⚠️ THE INHERITANCE TRAP. Next.js merges metadata down from app/layout.tsx, and og:* is all or
  // nothing: setting `title` alone does NOT set og:title. A demo with no openGraph block of its
  // own therefore previews, when texted, as "Steven James Consulting — AI employees for your
  // business" over the SJC card image — the client taps a link to her own site and gets ours.
  // So a demo always emits a COMPLETE openGraph block, even where that means repeating a value.
  const ogImage = shareImage || (isDemo ? firstImage(data) : null);

  // On a demo every field is emitted unconditionally — an empty string still counts as "set" and
  // is what stops Next from reaching up to the SJC defaults. On SJC's own pages the opposite is
  // right: omit what isn't filled in and let the site-wide values apply.
  const openGraph = isDemo
    ? {
        title: title || businessName,
        description,
        siteName: businessName || title,
        url: `/${slug}`,
        type: "website" as const,
        // An explicit value overrides the file-based card in app/opengraph-image.tsx. `[]` is the
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
    // `absolute` so the site-wide title template doesn't append "| Steven James Consulting"
    // onto a client's page.
    ...(title ? { title: { absolute: title } } : {}),
    ...(isDemo || description ? { description } : {}),
    openGraph,
    twitter: {
      card: ogImage ? ("summary_large_image" as const) : ("summary" as const),
      ...(title ? { title } : {}),
      ...(isDemo || description ? { description } : {}),
      ...(ogImage ? { images: [ogImage] } : {}),
    },
    ...(isDemo ? { robots: { index: false, follow: false, nocache: true } } : {}),
  };
}

// Wrapping a demo in SJC's navy chrome would put TWO headers on the page and brand someone
// else's site as ours — so a page that brought its own gets left alone. Checked one level deep,
// which is where page chrome belongs; nested inside a Section it isn't chrome anyway.
export default async function DynamicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const meta = await findPageMeta(slug);
  const data = meta ? await readPuckPublished(slug) : null;
  if (!data) notFound();

  const ownHeader = hasBlock(data, "SiteHeader");
  const ownFooter = hasBlock(data, "SiteFooter");

  return (
    <>
      {ownHeader ? null : <Nav />}
      <main>
        <Render config={config} data={data} />
      </main>
      {ownFooter ? null : <Footer />}
    </>
  );
}
