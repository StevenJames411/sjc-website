import CostComparisonChart from "./CostComparisonChart";

export default function OfferSection() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-5xl px-6 py-20 md:py-24">
        <p className="text-sm font-bold uppercase tracking-wide text-[color:var(--color-sjc-blue)]">
          The Expansion
        </p>
        <h2 className="mt-3 text-3xl font-bold leading-tight tracking-tight text-[color:var(--color-sjc-ink)] md:text-4xl">
          Start with one seat. Grow the whole org chart on your timeline.
        </h2>

        <div className="mt-8 space-y-6 text-lg leading-relaxed text-[color:var(--color-sjc-ink)]">
          <p>
            Most owners start with speed to lead &mdash; one AI employee
            answering every lead the second it lands. Once that&apos;s running
            and you can see it work, the same setup extends to the rest of the
            seats: follow-up, intake, scheduling, the admin that eats your week.
            You add seats when you&apos;re ready, not before.
          </p>
          <p>
            <strong>The build</strong> is a one-time install. <strong>A flat
            monthly</strong> keeps it running, monitored, and improving &mdash;
            the same way you already pay for the software you run on. Standard,
            and simple. You see the full number before anything gets built.
          </p>
        </div>

        <div className="mt-12">
          <CostComparisonChart />
        </div>
      </div>
    </section>
  );
}
