"use client";
import Editable from "./edit/Editable";

export default function Partnership() {
  return (
    <section style={{ backgroundColor: "#f3f4f6" }} className="w-full">
      <div className="mx-auto max-w-4xl px-6 py-20 md:py-24">
        <Editable
          tid="home.partnership.eyebrow"
          as="p"
          className="text-sm font-bold uppercase tracking-[0.18em] text-[color:var(--color-sjc-blue)]"
        >
          The Partnership
        </Editable>
        <Editable
          tid="home.partnership.h2"
          as="h2"
          className="mt-3 text-3xl font-bold leading-tight tracking-tight text-[color:var(--color-sjc-ink)] md:text-4xl"
        >
          The Partnership
        </Editable>

        <div className="mt-8 space-y-6 text-lg leading-relaxed text-[color:var(--color-sjc-ink)]">
          <Editable tid="home.partnership.p1" as="p">
            So let me be straight about how I come in, because it matters and it's the opposite of how you've been pitched by every vendor who ever wanted a piece of your roll-up.
          </Editable>
          <Editable tid="home.partnership.p2" as="p">
            I don't come in as a vendor. A vendor sells you a subscription, sends an invoice, and re-rates nothing — we covered why in flip two. I don't come in as an employee, either; I'm not looking for a salary or a seat on your org chart. I come in as a partner, on equity, aligned with you on the exit. The way that works in principle: you own the instance — the AI workforce installed across your platform's locations is yours, your asset, the thing that re-rates your multiple and walks with you in a sale. I keep the engine — the underlying system that lets me build your instance and then go install the next vertical, the next platform, the next partner. You own what makes your platform worth more. I keep what lets me do it again.
          </Editable>
          <Editable tid="home.partnership.p3" as="p">
            That split is what aligns us cleanly. I don't make my money billing you by the hour to keep a service running; I make it when your platform is worth more at exit, the same outcome you're driving toward. We're pulling the same rope toward the same sale. I'm not laying out percentages or dollar terms here — that's a conversation between principals, across a table, once we both know the deal is real. What I'm laying out is the shape: equity, not vendor; you own the instance, I keep the engine; both of us paid when the platform sells for more than it would have. That's a partner's deal, not a purchase order.
          </Editable>
        </div>
      </div>
    </section>
  );
}
