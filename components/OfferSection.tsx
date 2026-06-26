"use client";
import Editable from "./edit/Editable";

export default function OfferSection() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-5xl px-6 py-20 md:py-24">
        <Editable
          tid="home.expansion.eyebrow"
          as="p"
          className="text-sm font-bold uppercase tracking-wide text-[color:var(--color-sjc-blue)]"
        >
          The Platform
        </Editable>
        <Editable
          tid="home.expansion.h2"
          as="h2"
          className="mt-3 text-3xl font-bold leading-tight tracking-tight text-[color:var(--color-sjc-ink)] md:text-4xl"
        >
          Start with one location. The same engine scales to the whole portfolio — and the verticals beyond it.
        </Editable>

        <div className="mt-8 space-y-6 text-lg leading-relaxed text-[color:var(--color-sjc-ink)]">
          <Editable tid="home.expansion.p1" as="p">
            We start where it pays back fastest — one AI employee answering leads across your locations. Once it&apos;s running and the numbers are visible, the same engine expands: follow-up, intake, scheduling, the operating work that drives unit economics, location by location. Then it forks into the next vertical. This is a platform above any single industry — med spa is just where it&apos;s proven first.
          </Editable>
          {/* p2 has two inline <strong> phrases — split into spans to preserve bold rendering */}
          <p>
            <strong><Editable tid="home.expansion.p2.bold1" as="span">The install</Editable></strong>
            {" "}<Editable tid="home.expansion.p2.mid" as="span">scales across the portfolio.</Editable>{" "}
            <strong><Editable tid="home.expansion.p2.bold2" as="span">The equity</Editable></strong>
            {" "}<Editable tid="home.expansion.p2.end" as="span">aligns the partnership to the exit. You see the full structure — the economics per location and the thesis for the whole platform — before anything is built. No surprises, principal to principal.</Editable>
          </p>
        </div>
      </div>
    </section>
  );
}
