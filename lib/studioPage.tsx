// The web studio's sales page, rendered from ONE place.
//
// It is reachable at two addresses on purpose:
//   stevenjamesdesigns.com/            the studio's own domain — the real front door
//   stevenjamesconsulting.com/websites the original address, kept so old links still land
//
// Both render this. Duplicating it into two routes is how the two copies drift, and this is the
// page a prospect reads before they buy.
import { Render } from "@measured/puck";
import { config } from "@/components/puck/config";
import { seedFor } from "@/components/puck/seeds";
import { readPuckPublished } from "@/lib/puckContent";
import { WebsitesHeader, WebsitesFooter } from "@/components/websites/WebsitesChrome";
import { SJC } from "@/lib/siteKeys";

/**
 * The content lives in SJC's builder under the `websites` page key, whichever domain serves it.
 * Storage keys are deliberately independent of public URLs — moving the page to its own domain
 * must not migrate a single stored byte.
 */
export async function StudioBody() {
  const published = await readPuckPublished("websites", SJC);
  const data = published || seedFor("websites", "Websites");

  return (
    <>
      <WebsitesHeader />
      <main>
        <Render config={config} data={data} />
      </main>
      <WebsitesFooter />
    </>
  );
}
