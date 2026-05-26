import PainPage from "@/components/PainPage";

export const metadata = {
  title: "The Rock Star Trap — Steven James Consulting",
  description:
    "Hire the rock star and they'll fix it. The dominant advice in business-coach world. And it's wrong. Here's why.",
};

export default function RockStarTrap() {
  return (
    <PainPage
      eyebrow="Lie #6"
      lie="Just hire the rock star and they'll fix it."
      truth="The rock star becomes the new bottleneck — because rock stars are prima donnas. All the pay, all the problems."
      story={[
        "Every business guru on the planet sells you the same fix: 'Just hire the right person.' The A-player. The rock star who can finally run it all. The one hire that takes the weight off you for good.",
        "Michael Gerber dedicated chunks of his book to this exact trap. His warning: don't hire extraordinary people to fix ordinary problems. The rock star you bring in to save a broken business won't save it — they'll either burn out trying, or start running it their way, which becomes a different problem entirely.",
        "Here's what actually happens. You find your rock star. They want senior-level pay (because they ARE senior). They want autonomy (because they ARE good). And within six months, they're running the business their way — not yours. The rock star becomes the new bottleneck. When they quit, get poached, or have a bad quarter, the business stops the same way it stopped when you took a vacation. You replaced one single point of failure with another — and you're paying $150K-plus for the privilege.",
      ]}
      litmus={[
        "If your most senior person quit next month, how much of the business would walk out the door with them?",
        "How many of your current people could be replaced tomorrow without the business missing a beat?",
        "Have you ever had a 'rock star' hire turn into a bigger problem than the one you hired them to solve?",
        "What did the last person who promised to 'run it for you' actually deliver?",
      ]}
      solutionHeadline="Don't hire a rock star. Build one."
      solutionBody={[
        "Gerber's actual prescription — the one every coach skips — was the opposite of the rock-star advice: hire ordinary people and build extraordinary systems. The system carries the work. The role is reproducible. When someone leaves, the business doesn't.",
        "Our AI Employee Operating System is the 2026 version of that prescription. The employees are infinitely reproducible. They don't get poached. They don't ask for a raise. They don't start running the business their way. They run the system you set up — every day, every week, on every customer.",
        "I didn't hire a rock star. I built one in software. Now I install yours.",
      ]}
      closer="You don't need a rock star. You need a system that doesn't require one."
      ctaTitle="Done hiring rock stars who become bottlenecks?"
      ctaSubtitle="Book an intake call. We'll show you the way out."
    />
  );
}
