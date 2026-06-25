"use client";
import Editable from "../edit/Editable";
import CostComparisonChart from "../CostComparisonChart";

export default function MedSpaPricing() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-5xl px-6 py-20 md:py-24">
        <Editable
          tid="med-spa.pricing.eyebrow"
          as="p"
          className="text-sm font-bold uppercase tracking-wide text-[color:var(--color-sjc-blue)]"
        >
          The Expansion
        </Editable>
        <Editable
          tid="med-spa.pricing.h2"
          as="h2"
          className="mt-3 text-3xl font-bold leading-tight tracking-tight text-[color:var(--color-sjc-ink)] md:text-4xl"
        >
          Start with one. Build out the rest of your team on your timeline.
        </Editable>

        <div className="mt-8 space-y-6 text-lg leading-relaxed text-[color:var(--color-sjc-ink)]">
          <Editable tid="med-spa.pricing.p1" as="p">
            Most owners start with speed to lead — one AI employee answering every lead the second it lands. Once that&apos;s running and you can see it work, the same setup covers the rest of the jobs you&apos;re doing yourself: follow-up, intake, scheduling, the paperwork that eats your week. You add more when you&apos;re ready, not before.
          </Editable>
          <p>
            <strong><Editable tid="med-spa.pricing.p2.bold1" as="span">The build</Editable></strong>
            {" "}<Editable tid="med-spa.pricing.p2.mid" as="span">is a one-time install.</Editable>{" "}
            <strong><Editable tid="med-spa.pricing.p2.bold2" as="span">A flat monthly</Editable></strong>
            {" "}<Editable tid="med-spa.pricing.p2.end" as="span">keeps it running, monitored, and improving — the same way you already pay for the software you run on. Standard, and simple. You see the full number before anything gets built.</Editable>
          </p>
        </div>

        <div className="mt-12">
          <CostComparisonChart />
        </div>
      </div>
    </section>
  );
}
