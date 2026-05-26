import CostComparisonChart from "./CostComparisonChart";

export default function OfferSection() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-5xl px-6 py-20 md:py-24">
        <p className="text-sm font-bold uppercase tracking-wide text-[color:var(--color-sjc-blue)]">
          The Offer
        </p>
        <h2 className="mt-3 text-3xl font-bold leading-tight tracking-tight text-[color:var(--color-sjc-ink)] md:text-4xl">
          One year of an executive assistant&apos;s salary buys you an entire org chart.
        </h2>

        <div className="mt-8 space-y-6 text-lg leading-relaxed text-[color:var(--color-sjc-ink)]">
          <p>
            Here&apos;s the math. A single executive assistant costs $45-55K per year. For that
            same investment, you get an entire operating system installed &mdash; 5-6 AI
            employees covering every seat in your org chart, cloned from your actual talent,
            wired into your existing tools, running 24/7.
          </p>
          <p>
            <strong>The install: $40-70K</strong> (depends on scope &mdash; how many seats, how
            much transcript extraction, how complex your tech stack). This is a one-time build.
            Your AI employees are trained on your business, your voice, your processes.
            They&apos;re wired into your CRM, calendar, email, and pipeline. They actually do
            the work &mdash; book appointments, follow up on leads, handle objections, surface KPIs.
          </p>
          <p>
            <strong>The retainer: $3-5K/month.</strong> We stay on as your fractional Chief
            Technology Officer (CTO). Every AI employee gets monitored, updated, and improved.
            When your business evolves, the system evolves with it. When platforms release new
            capabilities, your employees get upgraded. You never touch the technical layer.
          </p>
          <p>
            This is not a SaaS subscription. It&apos;s not an agency retainer where you&apos;re
            paying for our time. It&apos;s an installed operating system with ongoing
            maintenance &mdash; like owning a building and paying for the property manager.
          </p>
        </div>

        <div className="mt-12">
          <CostComparisonChart />
        </div>

        <div className="mt-12 rounded-2xl border border-gray-200 bg-gray-50 p-8 md:p-10">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[color:var(--color-sjc-blue)]">
            Clone, Not Copy
          </p>
          <p className="mt-4 text-lg leading-relaxed text-[color:var(--color-sjc-ink)]">
            Important: the clone is curated, not copied. We absorb the owner&apos;s best
            qualities and filter out the liability. An owner can be loose on sales calls &mdash;
            play doctor, make promises, go off-script. The AI employee cannot and should not.
            Deep knowledge is defensive, not offensive. The AI knows everything the owner knows,
            but it only says what it should say.
          </p>
        </div>
      </div>
    </section>
  );
}
