import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import PillarTemplate from "@/components/PillarTemplate";

export const metadata = {
  title: "Tech | Steven James Consulting",
  description:
    "The technology partners who plug into the build — the AI layer that powers the playbook.",
};

export default function TechPage() {
  return (
    <>
      <Nav />
      <main>
        <PillarTemplate
          name="Tech"
          eyebrow="The build"
          tagline="The technology partners who plug into the playbook."
          body="The AI employees are built, not bought off a shelf. This is the table for the technology partners who want to plug into that build — the people pushing the same frontier from the other side."
          universe={[
            "AI builders and tooling partners.",
            "Integration partners across the operator's stack.",
            "The people who keep the engine ahead of the field.",
          ]}
          ctaTitle="Partner with us"
          ctaSubtitle="On the tech side of the table."
        />
      </main>
      <Footer />
    </>
  );
}
