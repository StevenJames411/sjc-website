import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import PillarTemplate from "@/components/PillarTemplate";
import EditablePage from "@/components/edit/EditablePage";
import { readPublished } from "@/lib/siteContent";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Podcast | Steven James Consulting",
  description:
    "Operators at every stage of the journey — solo to exit — across every field. The conversations the hero reel is cut from.",
};

export default async function PodcastPage() {
  const published = await readPublished("podcast");
  return (
    <>
      <Nav />
      <main>
        <EditablePage pageKey="podcast" published={published}>
        <PillarTemplate
          tid="podcast"
          name="The Podcast"
          eyebrow="The content engine"
          tagline="Operators at every stage of the journey — still solo, mid-roll-up, already exited — across every field."
          body="Five businesses, forty years, one playbook. This is where I hear it in other people's words. I sit down with operators from every industry, at every stage of the run, and the money and tech partners who build the room around them — and I never pitch on the mic. The show is the conversation, not a sales channel; the clips in the hero reel are cut from these rooms, and the table never runs dry."
          universeTitle="Who's at this table"
          universe={[
            "Operators still running solo — in the thick of it, doing 90% of it themselves.",
            "Operators mid-roll-up — buying, integrating, scaling a fragmented field.",
            "Operators who've already exited — and what they'd run back the same, or differently.",
            "The money partners and tech partners who make the whole thing go.",
          ]}
          ctaTitle="Come on the show"
          ctaSubtitle="One operator to another — no pitch on the mic."
        />
        </EditablePage>
      </main>
      <Footer />
    </>
  );
}
