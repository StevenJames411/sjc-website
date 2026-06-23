import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import SitePage from "@/components/edit/SitePage";
import { readPublished } from "@/lib/siteContent";

// Read the published snapshot fresh on each request so publishing shows up immediately
// (no redeploy needed). Falls back to committed defaults when nothing is published.
export const dynamic = "force-dynamic";

// Home renders its sections through SitePage, which stacks them in the saved order and
// (only for the signed-in editor) turns on inline editing + the Sections reorder panel.
// Public visitors get the published snapshot, falling back to the committed defaults.
// Nav (top navigation = the page switcher) and Footer stay as the fixed frame.
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
