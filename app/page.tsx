import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { Render } from "@measured/puck";
import { config } from "@/components/puck/config";
import { readPuckPublished } from "@/lib/puckContent";
import { seedFor } from "@/components/puck/seeds";
import { pageMetadata } from "@/lib/pageMeta";

export const dynamic = "force-dynamic";

// Title / preview text / preview image are edited at /edit/home with no block selected — the
// Page Settings panel. Nothing is passed here, so a blank panel keeps the site-wide defaults.
export async function generateMetadata() {
  return pageMetadata("home", { path: "/" });
}

// Home renders through the Puck builder exactly like every other page: the published snapshot if
// one exists, otherwise the committed seed (native editable blocks). Edit at /edit/home and hit
// Publish to go live. NOTE: if an old wrapped-section snapshot is still published, reset it once
// with /edit/home?reset=1 then Publish to load the new native layout.
export default async function Home() {
  const puck = await readPuckPublished("home");
  const data = puck || seedFor("home", "Home");
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
