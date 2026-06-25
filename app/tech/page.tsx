import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import PillarTemplate from "@/components/PillarTemplate";
import EditablePage from "@/components/edit/EditablePage";
import { readPublished } from "@/lib/siteContent";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Tech | Steven James Consulting",
  description:
    "The technology partners who plug into the build — the AI layer that powers the playbook.",
};

export default async function TechPage() {
  const published = await readPublished("tech");
  return (
    <>
      <Nav />
      <main>
        <EditablePage pageKey="tech" published={published}>
        <PillarTemplate
          tid="tech"
          name="Tech"
          eyebrow="The build"
          tagline="The technology partners who plug into the build behind the playbook."
          body="The AI employees are built, not bought off a shelf — installed on top of the business an operator already runs, then handed back so he stays in command. I'm a non-coder who's been the tech lead in all five of my businesses, so I build it the way an operator needs it to run, not the way a vendor wants to sell it. This is the table for the technology partners pushing the same frontier from the other side. The first one already runs live: Chloe, an AI employee answering and booking inside a working med spa."
          universeTitle="Who's at this table"
          universe={[
            "AI builders and model partners on the frontier of what an AI employee can do.",
            "Tooling and infrastructure partners — the rails the employees run on.",
            "Integration partners across the operator's existing stack.",
            "The people who keep the engine a step ahead of the field.",
          ]}
          ctaTitle="Partner with us"
          ctaSubtitle="Builder to builder, on the tech side of the table."
        />
        </EditablePage>
      </main>
      <Footer />
    </>
  );
}
