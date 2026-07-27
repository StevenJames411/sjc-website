import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { Render } from "@measured/puck";
import { config } from "@/components/puck/config";
import { readPuckPublished } from "@/lib/puckContent";
import { seedFor } from "@/components/puck/seeds";

export const dynamic = "force-dynamic";

// Every word lives in the builder — edit at /edit/case-study. This route holds NO copy of its
// own: it renders the published version, falling back to the same seed the editor opens to, so
// the live page and the editor can't drift apart.
export default async function CaseStudyPage() {
  const data = (await readPuckPublished("case-study")) || seedFor("case-study", "Case Study");
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
