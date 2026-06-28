import { Render } from "@measured/puck";
import { config } from "@/components/puck/config";
import { readPuckPublished } from "@/lib/puckContent";
import { seedFor } from "@/components/puck/seeds";

export const dynamic = "force-dynamic";

// For Agencies — a STANDALONE funnel: no site nav / footer (no escape routes), single CTA.
// Renders through Puck like every other page; edit at /edit/for-agencies → Publish.
export default async function ForAgencies() {
  const puck = await readPuckPublished("for-agencies");
  const data = puck || seedFor("for-agencies", "For Agencies");
  return (
    <main>
      <Render config={config} data={data} />
    </main>
  );
}
