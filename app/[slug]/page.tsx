import { notFound } from "next/navigation";
import { Render } from "@measured/puck";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { config } from "@/components/puck/config";
import { readPuckPublished } from "@/lib/puckContent";
import { findPageMeta } from "@/lib/pageRegistry";

// Public renderer for owner-CREATED pages. Every hardcoded route (app/about, app/podcast, the
// trap pages, industries/*, …) takes precedence over this single-segment catch-all, so it only
// ever serves brand-new pages made in the builder. Renders the PUBLISHED Puck content; a page
// that isn't in the registry, or hasn't been published yet, 404s.
export const dynamic = "force-dynamic";

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
