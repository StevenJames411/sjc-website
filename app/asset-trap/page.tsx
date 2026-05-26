import PainPage from "@/components/PainPage";

export const metadata = {
  title: "The Sellable Business Trap — Steven James Consulting",
  description:
    "You think you're building an asset. You're not. Here's why owner-dependent businesses don't sell.",
};

export default function AssetTrap() {
  return (
    <PainPage
      eyebrow="Lie #3"
      lie="You're building something you can sell"
      truth="Nobody buys a business when the owner IS the system."
      story={[
        "Every entrepreneur tells themselves the same story: 'I'm building an asset. One day I'll sell it and be done.'",
        "Here's the brutal truth. A buyer doesn't want your business — they want what your business produces. If the production stops the day you walk away, there's nothing to buy. There's just a logo and a Stripe account.",
        "Owner-dependent businesses don't sell. They liquidate. Equipment and customer lists at fire-sale prices. The exit you imagined doesn't exist.",
      ]}
      litmus={[
        "Could you sell your business tomorrow — or would the buyer just be buying your calendar?",
        "If you got hit by a bus, what's left for a buyer? An LLC and some logins?",
        "Could a new owner step in next month and run it — without retraining the entire business on themselves?",
      ]}
      solutionHeadline="Build an asset, not a job."
      solutionBody={[
        "A sellable business has one thing yours doesn't: a system that runs without the owner. Gerber called it a franchise prototype. We call it an AI Employee Operating System.",
        "When the AI runs the twelve roles, the business has documented processes, predictable output, and an org chart that doesn't say 'You' twelve times. That's what a buyer pays for. That's an asset.",
      ]}
      closer="Build the business you can actually walk away from."
      ctaTitle="Want a business you can actually sell?"
      ctaSubtitle="Book an intake call. We'll show you the way out."
    />
  );
}
