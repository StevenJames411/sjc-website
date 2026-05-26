import PainPage from "@/components/PainPage";

export const metadata = {
  title: "The Financial Freedom Trap — Steven James Consulting",
  description:
    "They sold you financial freedom. You got a glorified self-employed contractor job. Here's the way out.",
};

export default function FinancialTrap() {
  return (
    <PainPage
      eyebrow="Lie #1"
      lie="Financial freedom"
      truth="You're a glorified self-employed contractor."
      story={[
        "They sold you a dream: open your own business and build real wealth. Set your own rates. Keep what you earn. Be the boss.",
        "Then you opened it. And the math turned ugly. Your income is capped by your calendar — every dollar passes through your hours. You don't have leverage. You have a really expensive job.",
        "When was the last time you made money while you weren't actively working? Not last year — last week. If the answer is 'never,' you didn't escape employment. You just changed who signs your paycheck.",
        "Gerber wrote in 1986: 'A systems-dependent business, not a people-dependent business.' Financial freedom isn't passive income — it's owning something that runs without you. Keep it, hand it down, or sell it. The systems make all three possible. He prescribed them. We install them — with AI doing the work he assumed humans would.",
      ]}
      litmus={[
        "What's the most you've ever billed in a month without you personally doing the work?",
        "If you took next week off, what would you actually earn?",
        "How much of your monthly revenue is leveraged — meaning, would it happen with or without you on the calendar?",
      ]}
      solutionHeadline="Replace your hours with a team that runs without you."
      solutionBody={[
        "Financial freedom doesn't come from charging more. It comes from earning while you sleep — and that requires operators in your business who aren't you.",
        "Our AI Employee Operating System installs the seats your business needs — sales, marketing, bookings, operations, office management, all of it — running 24/7 at a fraction of the cost of human hires. Sized to your business. The work doesn't stop when you do. The revenue doesn't either.",
      ]}
      closer="Stop trading hours. Start owning a system."
      ctaTitle="Want real financial freedom?"
      ctaSubtitle="Book an intake call. We'll show you the way out."
    />
  );
}
