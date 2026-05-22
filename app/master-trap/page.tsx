import PainPage from "@/components/PainPage";

export const metadata = {
  title: "The Master Trap — Steven James Consulting",
  description:
    "You were great at the work. Someone told you to open your own business. Now you're trapped in it. Here's the way out.",
};

export default function MasterTrap() {
  return (
    <PainPage
      eyebrow="Lie #5"
      lie="You're great at this. You should open your own business."
      truth="Being the Master doesn't make you a business owner. It makes you a Master with new problems."
      story={[
        "You were the Master. The best mechanic in the shop. The hairstylist with the waiting list. The welder everyone asked for by name. The boss noticed. Customers noticed. And someone, eventually, said the obvious thing: 'You're so good at this — you should be doing it for yourself.'",
        "So you did. And here's the trap nobody warned you about. Being the Master and being the owner are two completely different jobs. Michael Gerber called the Master 'the Technician,' and he called this exact moment the E-Myth — the entrepreneurial myth that being great at the work means you'll be great at the business. It doesn't. It never has.",
        "Now you're still doing the Master work (because no one does it like you) AND wearing every other hat: marketing, sales, ops, finance, intake, follow-up, customer service, scheduling. The Master who became the owner becomes the everything. And the work you opened the business to do? It's the smallest slice of your week.",
      ]}
      litmus={[
        "What percentage of your week is doing the work you're actually great at — versus everything else?",
        "When was the last time you delivered the kind of work that made you good enough to start this business?",
        "Are you still growing as a Master — or have you stopped getting better because you're too busy running the business?",
        "If you could ONLY do the work you opened the business to do, would the business survive?",
      ]}
      solutionHeadline="Go back to being the Master."
      solutionBody={[
        "You didn't open this business to do bookkeeping, sales calls, and follow-up emails. You opened it to do the work you're great at — the work the world thinks you're best at.",
        "Our AI Employee Operating System puts the other eleven roles — executive assistant, marketing, sales, account management, project management, operations, office management, quality control, HR, bookkeeping, and legal — into the hands of AI employees. Gerber's original answer was hire humans. In 2026, the better answer is install AI. You get the team without the HR.",
        "You go back to being the Master. At the top of a system that runs without you.",
      ]}
      closer="The Master who opened the business gets to be the Master again."
      ctaTitle="Stuck being the Master AND the business?"
      ctaSubtitle="Find the seats keeping you in the technician chair. Take the assessment."
    />
  );
}
