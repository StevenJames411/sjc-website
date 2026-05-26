export default function Offer() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-4xl px-6 py-20 md:py-24">
        <p className="text-sm font-bold uppercase tracking-wide text-[color:var(--color-sjc-blue)]">
          The Offer
        </p>
        <h2 className="mt-3 text-3xl font-bold leading-tight tracking-tight text-[color:var(--color-sjc-ink)] md:text-4xl">
          One year of an executive assistant&apos;s salary buys you an entire org chart.
        </h2>

        <div className="mt-8 space-y-6 text-lg leading-relaxed text-[color:var(--color-sjc-ink)]">
          <p>
            We audit your business seat by seat. Then we install the AI employees that fill each one
            &mdash; trained on your voice, your process, your standards. You walk away with an org chart
            that runs without you.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-7 md:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[color:var(--color-sjc-blue)]">
              The Install
            </p>
            <p className="mt-4 text-3xl font-bold text-[color:var(--color-sjc-ink)] md:text-4xl">
              $40&ndash;70K
            </p>
            <p className="mt-3 text-base leading-relaxed text-[color:var(--color-sjc-ink)] md:text-lg">
              One-time build. We audit every seat, write the position contracts, build the AI employees,
              integrate them into your existing tools, and hand you a working org chart. Typical timeline:
              4&ndash;8 weeks.
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-7 md:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[color:var(--color-sjc-blue)]">
              The Retainer
            </p>
            <p className="mt-4 text-3xl font-bold text-[color:var(--color-sjc-ink)] md:text-4xl">
              $3&ndash;5K/mo
            </p>
            <p className="mt-3 text-base leading-relaxed text-[color:var(--color-sjc-ink)] md:text-lg">
              Ongoing maintenance. Your fractional Chief Technology Officer &mdash; keeping the system
              sharp, swapping tools when better ones emerge, and making sure the org chart keeps getting
              smarter every month. Utility costs (the platforms your AI employees run on) are passed
              through at cost.
            </p>
          </div>
        </div>

        <div className="mt-10 rounded-2xl border-l-4 border-[color:var(--color-sjc-blue)] bg-blue-50/50 px-6 py-7 md:px-8 md:py-8">
          <p className="text-lg font-bold leading-snug text-[color:var(--color-sjc-ink)] md:text-xl">
            Put it in perspective.
          </p>
          <p className="mt-3 text-base leading-relaxed text-[color:var(--color-sjc-ink)] md:text-lg">
            Hiring one mid-level employee costs $45&ndash;65K a year in salary alone &mdash; before
            benefits, training, turnover, and the management overhead you never wanted. That one
            salary fills one seat. The same investment installs an entire org chart of AI employees
            that runs 24/7, never quits, and gets sharper every month.
          </p>
        </div>
      </div>
    </section>
  );
}
