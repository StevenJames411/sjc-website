import CostComparisonChart from "./CostComparisonChart";

export default function PerfectStorm() {
  return (
    <section style={{ backgroundColor: "#f3f4f6" }} className="w-full">
      <div className="mx-auto max-w-5xl px-6 py-20 md:py-24">
        <p className="text-sm font-bold uppercase tracking-wide text-[color:var(--color-sjc-blue)]">
          The Perfect Storm
        </p>
        <h2 className="mt-3 text-3xl font-bold leading-tight tracking-tight text-[color:var(--color-sjc-ink)] md:text-4xl">
          For the first time in history, you get all three.
        </h2>

        <div className="mt-8 space-y-6 text-lg leading-relaxed text-[color:var(--color-sjc-ink)]">
          <p>
            This wasn&apos;t possible two years ago. The tools didn&apos;t exist. Now they do &mdash;
            and for the first time, a solo entrepreneur can afford what only corporations could build:
          </p>
        </div>

        {/* The Trifecta */}
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-7 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[color:var(--color-sjc-blue)]">
              One
            </p>
            <h3 className="mt-3 text-xl font-bold leading-snug text-[color:var(--color-sjc-ink)]">
              Rock star talent &mdash; cloned from you.
            </h3>
            <p className="mt-4 text-base leading-relaxed text-[color:var(--color-sjc-ink)]">
              Your voice. Your judgment calls. Your way of handling customers. Captured, trained,
              and deployed &mdash; so your best employees sound exactly like you on your best day.
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-7 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[color:var(--color-sjc-blue)]">
              Two
            </p>
            <h3 className="mt-3 text-xl font-bold leading-snug text-[color:var(--color-sjc-ink)]">
              Unbreakable systems running 24/7.
            </h3>
            <p className="mt-4 text-base leading-relaxed text-[color:var(--color-sjc-ink)]">
              They don&apos;t quit. They don&apos;t get sick. They don&apos;t forget. They follow the
              playbook every single time &mdash; and they compound, getting sharper every week they run.
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-7 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[color:var(--color-sjc-blue)]">
              Three
            </p>
            <h3 className="mt-3 text-xl font-bold leading-snug text-[color:var(--color-sjc-ink)]">
              A cost that makes the whole org chart affordable.
            </h3>
            <p className="mt-4 text-base leading-relaxed text-[color:var(--color-sjc-ink)]">
              One year of an executive assistant&apos;s salary can now buy you an entire team.
              The math that kept you stuck for decades just changed overnight.
            </p>
          </div>
        </div>

        {/* Gerber context — supporting evidence, not the headline */}
        <div className="mt-12 rounded-2xl border border-gray-200 bg-white p-8 md:p-10">
          <div className="space-y-5 text-lg leading-relaxed text-[color:var(--color-sjc-ink)]">
            <p>
              Michael Gerber prescribed exactly this 40 years ago in{" "}
              <em>The E-Myth Revisited</em>. He was right about the prescription &mdash; build
              systems, fill every seat, treat your business like a franchise prototype that runs
              without you.
            </p>
            <p>
              But his only mechanism was hiring humans. That meant the small business owner who
              needed the cure the most was the one who could least afford it.
            </p>
            <p className="font-semibold">
              Now you get both the rock star AND the system &mdash; and the price tag just collapsed
              from half a million dollars a year to a fraction of one employee&apos;s salary.
            </p>
          </div>
        </div>

        {/* Name the mechanism */}
        <div className="mt-12 space-y-5 text-lg leading-relaxed text-[color:var(--color-sjc-ink)]">
          <p>
            We call them <strong>AI employees</strong>. Not chatbots. Not copilots. Not tools you
            have to babysit. Employees that hold a role, follow a position contract, execute the work
            end to end, and report back when it&apos;s done &mdash; the same way a human employee would.
          </p>
          <p>
            We install the org chart your business should already have, and put an AI employee behind
            every seat. <strong>Your role becomes managing the org chart &mdash; not doing the work.</strong>
          </p>
        </div>

        {/* Cost comparison */}
        <div className="mt-12">
          <CostComparisonChart />
        </div>
      </div>
    </section>
  );
}
