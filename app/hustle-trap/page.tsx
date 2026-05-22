import PainPage from "@/components/PainPage";

export const metadata = {
  title: "The Hustle Trap — Steven James Consulting",
  description:
    "You can't out-hustle a broken system. The gurus preaching hustle have teams. You don't.",
};

export default function HustleTrap() {
  return (
    <PainPage
      eyebrow="Lie #4"
      lie="Hustle harder and you'll make it"
      truth="You can't out-hustle a broken system."
      story={[
        "Gary Vee made it look easy. So did every other guru screaming 'work harder' into the camera at 5am.",
        "Here's what they don't tell you. Gary Vee hustles 100 hours a week with a team of fifty doing the actual work. He's the talent. He's not also the marketer, the salesperson, the operator, the customer service rep, and the bookkeeper.",
        "You can't outwork the fact that you're wearing all twelve hats. Adding more hours to a broken system doesn't fix the system. It just makes you tired faster.",
        "Michael Gerber named this trap in 1986. He called it Adolescent Survival — the business that survives only because the owner refuses to let it fall. His exact words: 'Finally, your business doesn't explode — you do.' We're solving the trap he diagnosed 40 years ago — with tools he never had.",
      ]}
      litmus={[
        "How many hours did you work last week? Honestly.",
        "What did you produce in those hours that compounds — versus just keeps the lights on?",
        "If you doubled your hours next month, would your business actually grow — or would you just be more tired?",
        "Are you hustling because the work demands it — or because you don't have anyone else to do it?",
      ]}
      solutionHeadline="Don't work harder. Build a team."
      solutionBody={[
        "The people you admire who 'hustle' have something you don't: a team that absorbs the work. Without one, you're not hustling — you're surviving.",
        "Our AI Employee Operating System installs the team. The hustle moves off your plate and onto theirs. You're still the boss. You're just no longer the bottleneck.",
      ]}
      closer="Hustle is what you do when you don't have leverage. We give you leverage."
      ctaTitle="Done out-hustling a broken system?"
      ctaSubtitle="Find the seats that need a system, not more hustle. Take the assessment."
    />
  );
}
