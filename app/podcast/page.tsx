import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { Render } from "@measured/puck";
import { config } from "@/components/puck/config";
import { readPuckPublished } from "@/lib/puckContent";
import { seedFor } from "@/components/puck/seeds";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Podcast | Steven James Consulting",
  description:
    "Operators at every stage of the journey — solo to exit — across every field. The conversations the hero reel is cut from.",
};

// Every word lives in the builder — edit at /edit/podcast. This route holds NO copy of its own:
// it renders the published version, falling back to the same seed the editor opens to, so the
// live page and the editor can't drift apart.
export default async function PodcastPage() {
  const data = (await readPuckPublished("podcast")) || seedFor("podcast", "Podcast");
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
