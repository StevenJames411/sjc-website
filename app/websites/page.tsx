import { Render } from "@measured/puck";
import { config } from "@/components/puck/config";
import { seedFor } from "@/components/puck/seeds";
import { readPuckPublished } from "@/lib/puckContent";
import { WebsitesHeader, WebsitesFooter } from "@/components/websites/WebsitesChrome";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "A real website for your business — live in three days | Steven James Consulting",
  description:
    "$795 to build it, $25/month to keep it running. Your work, your reviews, your phone number — and a contact form that texts you the second someone fills it out. You never touch any of it.",
  alternates: { canonical: "/websites" },
};

// The bottom rung of the ladder: a plain, real website for a very small business. NOT the
// AI/Chloe offer and NOT a middle tier — no CRM, no automation, no tiers, no upgrade path shown.
// Ascension to the bigger offers happens on a phone call with Steven, never on this page.
//
// Every word here lives in the BUILDER, not in this file: edit at /edit/websites (and the header
// and footer at /edit/websites-nav and /edit/websites-footer). This route just renders whatever
// is published; before anything is published it renders the same seed the builder opens to, so
// the live page and the editor can never drift apart.
export default async function WebsitesPage() {
  const published = await readPuckPublished("websites");
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
