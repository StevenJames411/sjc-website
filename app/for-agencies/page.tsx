import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { Render } from "@measured/puck";
import { config } from "@/components/puck/config";
import { readPuckPublished } from "@/lib/puckContent";
import { seedFor } from "@/components/puck/seeds";

export const dynamic = "force-dynamic";

// For Agencies — the standalone white-label partner funnel (the destination the agency outbound
// points at). Renders through Puck like every other page: the published snapshot if one exists,
// otherwise the committed seed (native editable blocks). Edit at /edit/for-agencies → Publish.
export default async function ForAgencies() {
  const puck = await readPuckPublished("for-agencies");
  const data = puck || seedFor("for-agencies", "For Agencies");
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
