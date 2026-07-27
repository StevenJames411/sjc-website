import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { Render } from "@measured/puck";
import { config } from "@/components/puck/config";
import { readPuckPublished } from "@/lib/puckContent";
import { seedFor } from "@/components/puck/seeds";

export const dynamic = "force-dynamic";

// Every word lives in the builder — edit at /edit/faqs. This route holds NO copy of its own:
// it renders the published version, falling back to the same seed the editor opens to, so the
// live page and the editor can't drift apart.
export default async function FAQs() {
  const data = (await readPuckPublished("faqs")) || seedFor("faqs", "FAQs");
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
