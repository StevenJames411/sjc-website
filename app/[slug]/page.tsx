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

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const meta = await findPageMeta(slug);
  const data = meta ? await readPuckPublished(slug) : null;
  return hasBlock(data, "SiteHeader")
    ? { robots: { index: false, follow: false, nocache: true } }
    : {};
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
