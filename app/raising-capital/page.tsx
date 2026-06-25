import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import PillarTemplate from "@/components/PillarTemplate";

export const metadata = {
  title: "Raising Capital | Steven James Consulting",
  description:
    "The money partners behind the re-rate — the capital side of the playbook.",
};

export default function RaisingCapitalPage() {
  return (
    <>
      <Nav />
      <main>
        <PillarTemplate
          name="Raising Capital"
          eyebrow="The money"
          tagline="The capital partners behind the re-rate."
          body="When you own the AI layer, a services roll-up re-rates toward a technology multiple. That's a capital story as much as an operating one. This is the table for the money partners who fund the playbook and share the upside."
          universe={[
            "Venture and growth capital partners.",
            "Search funds and independent sponsors rolling up a field.",
            "The capital that turns one shop into a platform.",
          ]}
          ctaTitle="Let's talk"
          ctaSubtitle="The capital side of the table."
        />
      </main>
      <Footer />
    </>
  );
}
