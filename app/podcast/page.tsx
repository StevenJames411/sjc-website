import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { Render } from "@measured/puck";
import { config } from "@/components/puck/config";
import { readPuckPublished } from "@/lib/puckContent";
import { seedFor } from "@/components/puck/seeds";
import { pageMetadata } from "@/lib/pageMeta";
import { SJC } from "@/lib/siteKeys";

export const dynamic = "force-dynamic";

// Preview text too — edited at /edit/podcast with no block selected (the Page Settings panel).
// What's below is only the fallback this page shipped with, used while the panel is empty.
export async function generateMetadata() {
  return pageMetadata("podcast", {
    path: "/podcast",
    title: "Podcast | Steven James Consulting",
    description:
      "Operators at every stage of the journey — solo to exit — across every field. The conversations the hero reel is cut from.",
  });
}

// Every word lives in the builder — edit at /edit/podcast. This route holds NO copy of its own:
// it renders the published version, falling back to the same seed the editor opens to, so the
// live page and the editor can't drift apart.
export default async function PodcastPage() {
  const data = (await readPuckPublished("podcast", SJC)) || seedFor("podcast", "Podcast");
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
