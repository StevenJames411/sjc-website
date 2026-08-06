import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { Render } from "@measured/puck";
import { config } from "@/components/puck/config";
import { readPuckPublished } from "@/lib/puckContent";
import { seedFor } from "@/components/puck/seeds";
import { pageMetadata } from "@/lib/pageMeta";
import { SJC } from "@/lib/siteKeys";

export const dynamic = "force-dynamic";

// Preview text too — edited at /edit/about with no block selected (the Page Settings panel).
export async function generateMetadata() {
  return pageMetadata("about", { path: "/about" });
}

// Every word lives in the builder — edit at /edit/about. This route holds NO copy of its own:
// it renders the published version, falling back to the same seed the editor opens to, so the
// live page and the editor can't drift apart.
export default async function About() {
  const data = (await readPuckPublished("about", SJC)) || seedFor("about", "About");
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
