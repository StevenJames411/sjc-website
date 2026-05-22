import CostComparisonChart from "./CostComparisonChart";

const ADVANTAGES = [
  "No salary, benefits, or PTO",
  "No training — just a position contract",
  "No quitting, no sick days, no drift",
  "Runs 24/7 inside the tools you already use",
];

export default function Solution() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-5xl px-6 py-20 md:py-24">
        <p className="text-sm font-bold uppercase tracking-wide text-[color:var(--color-sjc-blue)]">
          The Solution
        </p>
        <h2 className="mt-3 text-3xl font-bold leading-tight tracking-tight text-[color:var(--color-sjc-ink)] md:text-4xl">
          We solved Michael Gerber&apos;s execution problem.
        </h2>

        <div className="mt-8 space-y-6 text-lg leading-relaxed text-[color:var(--color-sjc-ink)]">
          <p>
            Michael prescribed the cure 40 years ago. He told every solo entrepreneur:{" "}
            <strong>
              build the org chart. Document every role. Fill every seat with a person who follows
              the system.
            </strong>{" "}
            Build a business that runs without you.
          </p>
          <p>
            Most entrepreneurs read the book. Nodded. Underlined the good parts. And then went back to
            wearing all the hats &mdash; because Michael&apos;s prescription required something they
            didn&apos;t have: time and the willingness to hire and train a full team.
          </p>
          <p className="text-xl font-bold text-[color:var(--color-sjc-ink)] md:text-2xl">
            Until now.
          </p>
          <p>
            In 2026, every seat in Michael&apos;s org chart can be filled by an AI employee. The
            legendary work he prescribed &mdash; the franchise prototype, the systems-built business,
            the org chart that runs without you &mdash; is finally available to the solo operator who
            could never afford to build it the old way.
          </p>
        </div>

        <ul className="mt-8 space-y-3">
          {ADVANTAGES.map((a) => (
            <li key={a} className="flex items-start gap-3 text-lg text-[color:var(--color-sjc-ink)]">
              <span className="mt-2 inline-block h-2 w-2 flex-shrink-0 rounded-full bg-[color:var(--color-sjc-blue)]" />
              <span>{a}</span>
            </li>
          ))}
        </ul>

        <div className="mt-10 space-y-4 text-lg leading-relaxed text-[color:var(--color-sjc-ink)]">
          <p>
            We install the org chart your business should already have, and put an AI employee behind
            every seat. <strong>Your role becomes managing the org chart &mdash; not doing the work.</strong>
          </p>
          <p>And it gets sharper every week it runs.</p>
        </div>

        <div className="mt-12">
          <CostComparisonChart />
        </div>

        <div className="mt-12 rounded-2xl border border-[color:var(--color-sjc-blue)] bg-[color:var(--color-sjc-blue)] px-8 py-8 text-center text-white md:px-10">
          <p className="text-xl font-bold leading-snug md:text-2xl">
            This is the AI version of Michael Gerber&apos;s life&apos;s work.
          </p>
          <p className="mt-3 text-base leading-relaxed opacity-90 md:text-lg">
            Now you can finally do what he told you to do 40 years ago.
          </p>
        </div>

        <div className="mx-auto mt-8 max-w-2xl text-base leading-relaxed text-[color:var(--color-sjc-ink)] md:text-lg">
          <p>
            Michael wasn&apos;t alone. Every successful franchise on the planet &mdash; McDonald&apos;s,
            every chain you could name &mdash; is a testament to that system. They&apos;ve been running
            it for 20 or 30 years. Now you can finally afford to build it for yourself.
          </p>
        </div>
      </div>
    </section>
  );
}
