import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import PillarTemplate from "@/components/PillarTemplate";

export const metadata = {
  title: "Podcast | Steven James Consulting",
  description:
    "Operators at every stage of the journey — solo to exit — across every field. The conversations the hero reel is cut from.",
};

export default function PodcastPage() {
  return (
    <>
      <Nav />
      <main>
        <PillarTemplate
          name="The Podcast"
          eyebrow="The content engine"
          tagline="Operators at every stage of the journey — solo to exit — across every field."
          body="This is where the playbook comes alive in other people's words. I sit down with operators from every industry, at every stage of the journey, and the people building the room around them. The clips you saw in the hero are cut from these conversations."
          universe={[
            "Operators still running solo — the ones in the thick of it.",
            "Operators mid-roll-up — buying, integrating, scaling.",
            "Operators who've already exited — and what they'd do again.",
            "The money and tech partners who make it all go.",
          ]}
          ctaTitle="Come on the show"
          ctaSubtitle="Or just listen in."
        />
      </main>
      <Footer />
    </>
  );
}
