import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import SitePage from "@/components/edit/SitePage";
import { readPublished } from "@/lib/siteContent";

export const dynamic = "force-dynamic";

// HOME IS A CODE-TRUTH PAGE. It renders straight from the section registry + the committed
// section defaults (HeroReel, Playbook, TheCeiling, …) — deliberately NOT through the Puck
// published snapshot. A stale builder publish (`sjc-puck-home-pub`) was shadowing every code
// edit on the live page; removing the PublishedOrFallback wrapper makes the code the single
// source of truth for home. Edit home copy in the section components, not the builder.
export default async function Home() {
  const published = await readPublished("home");
  return (
    <>
      <Nav />
      <main>
        <SitePage pageKey="home" published={published} />
      </main>
      <Footer />
    </>
  );
}
