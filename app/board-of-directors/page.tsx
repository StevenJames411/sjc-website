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
          tagline="Company leaders who've already run the mergers-and-acquisitions playbook — at the highest level, across industries."
          body="This is the top tier of the table: the leaders who've been all the way through it — built, rolled up, and exited — more than once. These are the deepest conversations on the M&A playbook, the exact playbook I lived from the inside five times, with the people who've run it at scale. Same doctrine as the show: I never pitch on the mic. It's how the most seasoned operators and I get to know each other — principal to principal, on the record."
          universeTitle="Who's at this table"
          universe={[
            "Founders who took a single shop to a platform exit.",
            "Roll-up operators who consolidated a fragmented field into one company.",
            "Leaders who've sat on both sides of the acquisition table.",
            "The people who de-risk the next deal because they've already closed the last one.",
          ]}
          ctaTitle="Get in touch"
          ctaSubtitle="Leaders who've done the deal — no pitch on the mic."
        />
      </main>
      <Footer />
    </>
  );
}
