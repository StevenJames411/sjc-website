import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import PillarTemplate from "@/components/PillarTemplate";

export const metadata = {
  title: "Board of Directors | Steven James Consulting",
  description:
    "Conversations with company leaders who've done the deal across industries — the top tier of the journey.",
};

export default function BoardOfDirectorsPage() {
  return (
    <>
      <Nav />
      <main>
        <PillarTemplate
          name="Board of Directors"
          eyebrow="The top tier"
          tagline="Company leaders who've already done the deal — across industries."
          body="This is the table for the operators who've been all the way through it — built, rolled up, and exited. These are the conversations that go deepest on the M&A playbook, with the people who've run it at the highest level."
          universe={[
            "Founders who took a single shop to a platform exit.",
            "Roll-up operators who consolidated a fragmented field.",
            "Leaders who've sat on both sides of the acquisition table.",
            "The people who de-risk the next deal by having done the last one.",
          ]}
          ctaTitle="Get in touch"
          ctaSubtitle="Leaders who've done the deal."
        />
      </main>
      <Footer />
    </>
  );
}
