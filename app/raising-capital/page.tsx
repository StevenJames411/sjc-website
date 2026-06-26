import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import PillarTemplate from "@/components/PillarTemplate";
import EditablePage from "@/components/edit/EditablePage";
import PublishedOrFallback from "@/components/puck/PublishedOrFallback";
import { readPublished } from "@/lib/siteContent";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Raising Capital | Steven James Consulting",
  description:
    "The money partners behind the re-rate — the capital side of the playbook.",
};

export default async function RaisingCapitalPage() {
  const published = await readPublished("raising-capital");
  return (
    <>
      <Nav />
      <main>
       <PublishedOrFallback page="raising-capital">
        <EditablePage pageKey="raising-capital" published={published}>
        <PillarTemplate
          tid="raising-capital"
          name="Raising Capital"
          eyebrow="The money"
          tagline="The capital partners behind the re-rate."
          body="A services roll-up trades at a services multiple. But when you own the AI layer the businesses run on — not a tool you license, the layer you built — that same roll-up starts to re-rate toward a technology multiple. That's the capital story underneath the operating one: buy in fragmented fields, install the AI employees, and the whole platform gets repriced. This is the table for the money partners who fund the playbook and share the upside."
          universeTitle="Who's at this table"
          universe={[
            "Venture and growth capital backing the AI layer itself.",
            "Search funds and independent sponsors rolling up a fragmented field.",
            "Private-equity sponsors who want a technology re-rate on a services book.",
            "The capital that turns one shop into a platform.",
          ]}
          ctaTitle="Let's talk"
          ctaSubtitle="Principal to principal, on the capital side of the table."
        />
        </EditablePage>
       </PublishedOrFallback>
      </main>
      <Footer />
    </>
  );
}
