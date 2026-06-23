"use client";
import Editable from "./edit/Editable";
import CostComparisonChart from "./CostComparisonChart";

export default function OfferSection() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-5xl px-6 py-20 md:py-24">
        <Editable
          tid="home.expansion.eyebrow"
          as="p"
          className="text-sm font-bold uppercase tracking-wide text-[color:var(--color-sjc-blue)]"
        >
          The Expansion
        </Editable>
        <Editable
          tid="home.expansion.h2"
          as="h2"
          className="mt-3 text-3xl font-bold leading-tight tracking-tight text-[color:var(--color-sjc-ink)] md:text-4xl"
        >
          Start with one seat. Grow the whole org chart on your timeline.
        </Editable>

        <div className="mt-8 space-y-6 text-lg leading-relaxed text-[color:var(--color-sjc-ink)]">
          <Editable tid="home.expansion.p1" as="p">
            Most owners start with speed to lead — one AI employee answering every lead the second it lands. Once that&apos;s running and you can see it work, the same setup extends to the rest of the seats: follow-up, intake, scheduling, the admin that eats your week. You add seats when you&apos;re ready, not before.
          </Editable>
          {/* p2 has two inline <strong> phrases — split into spans to preserve bold rendering */}
          <p>
            <strong><Editable tid="home.expansion.p2.bold1" as="span">The build</Editable></strong>
            {" "}<Editable tid="home.expansion.p2.mid" as="span">is a one-time install.</Editable>{" "}
            <strong><Editable tid="home.expansion.p2.bold2" as="span">A flat monthly</Editable></strong>
            {" "}<Editable tid="home.expansion.p2.end" as="span">keeps it running, monitored, and improving — the same way you already pay for the software you run on. Standard, and simple. You see the full number before anything gets built.</Editable>
          </p>
        </div>

        <div className="mt-12">
          <CostComparisonChart />
        </div>
      </div>
    </section>
  );
}
