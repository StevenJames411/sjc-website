"use client";
import Editable from "./edit/Editable";

// HOME §6 — SOLUTION pt.2 / the payoff. The double flywheel. The M&A operator always strapped
// linear legacy software + human hires onto the org chart — one grinding wheel. Strap on AI
// employees and you spin two that compound: Operations (earnings) and Equity (the re-rate).
export default function WhereItLeads() {
  return (
    <section style={{ backgroundColor: "#f3f4f6" }} className="w-full">
      <div className="mx-auto max-w-5xl px-6 py-20 md:py-24">
        <Editable
          tid="home.leads.eyebrow"
          as="p"
          className="text-sm font-bold uppercase tracking-[0.18em] text-[color:var(--color-sjc-blue)]"
        >
          Where it leads
        </Editable>
        <Editable
          tid="home.leads.h2"
          as="h2"
          className="mt-3 text-3xl font-bold leading-tight tracking-tight text-[color:var(--color-sjc-ink)] md:text-4xl"
        >
          The double flywheel.
        </Editable>
        <Editable
          tid="home.leads.intro"
          as="p"
          className="mt-6 max-w-3xl text-lg leading-relaxed text-[color:var(--color-sjc-ink)]"
        >
          The mergers-and-acquisitions operator has always strapped linear legacy software and
          human hires onto the org chart — and gotten one slow, grinding wheel for it. Strap AI
          employees onto the same chart and you spin two wheels at once. They feed each other.
        </Editable>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-black/10 bg-white p-7">
            <Editable
              tid="home.leads.w1.k"
              as="p"
              className="text-sm font-bold uppercase tracking-[0.16em] text-[color:var(--color-sjc-green)]"
            >
              Wheel 1 — Operations
            </Editable>
            <Editable
              tid="home.leads.w1.h"
              as="h3"
              className="mt-2 text-xl font-bold text-[color:var(--color-sjc-ink)]"
            >
              Fill the seats, plug the leaks.
            </Editable>
            <Editable
              tid="home.leads.w1.p"
              as="p"
              className="mt-3 text-base leading-relaxed text-[color:var(--color-sjc-ink)]"
            >
              AI fills the org-chart seats, so the leads you&apos;re already paying for get answered,
              followed up, and booked. Earnings per location climb — not by cutting another point of
              cost, but by capturing the revenue that used to leak out. That funds the next location.
            </Editable>
          </div>
          <div className="rounded-2xl border border-black/10 bg-white p-7">
            <Editable
              tid="home.leads.w2.k"
              as="p"
              className="text-sm font-bold uppercase tracking-[0.16em] text-[color:var(--color-sjc-green)]"
            >
              Wheel 2 — Equity
            </Editable>
            <Editable
              tid="home.leads.w2.h"
              as="h3"
              className="mt-2 text-xl font-bold text-[color:var(--color-sjc-ink)]"
            >
              Own the layer, re-rate the whole thing.
            </Editable>
            <Editable
              tid="home.leads.w2.p"
              as="p"
              className="mt-3 text-base leading-relaxed text-[color:var(--color-sjc-ink)]"
            >
              When you OWN the AI layer the business runs on, you stop being priced like a
              services shop and start being priced like a technology company — a higher multiple on
              top of bigger earnings. A bigger exit means more capital and more credibility, which
              means more deals.
            </Editable>
          </div>
        </div>

        <Editable
          tid="home.leads.close"
          as="p"
          className="mt-8 max-w-3xl text-lg leading-relaxed text-[color:var(--color-sjc-ink)]"
        >
          Wheel 1 feeds Wheel 2 feeds Wheel 1. And the owner who used to be the lid — once his seats
          are filled and he&apos;s still the one in command — turns into the one thing the old
          playbook could never produce: a business someone will actually buy.
        </Editable>
      </div>
    </section>
  );
}
