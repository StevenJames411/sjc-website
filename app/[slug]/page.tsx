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

// Pages that must NEVER be indexed even once published. `lab` is the design-port scratch pad: it
// carries a REAL business's name, phone and address, and it lives on the SJC domain. robots.txt
// deliberately says allow-everything to every AI crawler, so nothing else would stop it — a
// leaked URL (a shared link, a referrer header, a browser reporting it) is all it takes.
//
// Belongs here rather than in robots.txt because it must hold whatever the page is called and
// whoever publishes it. Same reasoning as the `demo: true` flag on the static client template.
const NEVER_INDEX = new Set(["lab"]);

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return NEVER_INDEX.has(slug)
    ? { robots: { index: false, follow: false, nocache: true } }
    : {};
}

export default async function DynamicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const meta = await findPageMeta(slug);
  const data = meta ? await readPuckPublished(slug) : null;
  if (!data) notFound();
  return (
    <>
      <Nav />
      <main>
        <Render config={config} data={data} />
      </main>
      <Footer />
    </>
  );
}
