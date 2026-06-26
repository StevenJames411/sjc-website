"use client";
import Editable from "./edit/Editable";

export default function Flip2() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-4xl px-6 py-20 md:py-24">
        <Editable
          tid="home.flip2.eyebrow"
          as="p"
          className="text-sm font-bold uppercase tracking-[0.18em] text-[color:var(--color-sjc-blue)]"
        >
          Flip Two — Re-Rate the Platform
        </Editable>
        <Editable
          tid="home.flip2.h2"
          as="h2"
          className="mt-3 text-3xl font-bold leading-tight tracking-tight text-[color:var(--color-sjc-ink)] md:text-4xl"
        >
          Flip Two — Re-Rate the Whole Platform
        </Editable>

        <div className="mt-8 space-y-6 text-lg leading-relaxed text-[color:var(--color-sjc-ink)]">
          <Editable tid="home.flip2.p1" as="p">
            Now the one that actually moves your multiple, which is the one your world cares about most.
          </Editable>
          <Editable tid="home.flip2.p2" as="p">
            When your platform owns its AI layer — when the AI employees running every location are a built, embedded, improving asset that belongs to the platform — you stop being priced like a services roll-up. You start being priced like a technology company. That's not a marketing line. That's how the next buyer's analyst actually models it. A services business trades on its earnings and its category. A technology business that owns a defensible, proprietary, compounding system trades on a different and much higher set of comps. Same earnings, different category, double or triple the multiple. That re-rate sits on top of the bigger earnings from flip one, which is why the two compound instead of just adding.
          </Editable>
          <Editable tid="home.flip2.p3" as="p">
            Ownership is the entire hinge, so let me be precise about it, because this is where most people wave their hands. Rented software re-rates nothing. If you bolt a SaaS subscription onto your shops, the next buyer sees a cost line — a vendor you pay, a contract that can be cancelled or repriced, something every competitor can buy off the same shelf tomorrow. It adds zero to enterprise value because it isn't yours and it isn't defensible. An owned AI workforce is the opposite. It's trained on your platform's own operations, it gets sharper every month it runs on your data, it's embedded across every location, and it walks with the platform in a sale. That's an asset the next buyer underwrites — a real moat, a real reason this platform is worth more than the identical roll-up next door that's still running rented linear tools. You're no longer selling a bigger version of the category. You're selling something the category doesn't have.
          </Editable>
          <Editable tid="home.flip2.p4" as="p">
            That's the difference between exiting at the category's multiple and exiting at a technology multiple. On a platform doing real EBITDA, that re-rate isn't a few points. It's the kind of number that changes what the whole roll-up was worth doing in the first place.
          </Editable>
        </div>
      </div>
    </section>
  );
}
