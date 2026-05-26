export default function CaseStudy() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-4xl px-6 py-20 md:py-24">
        <p className="text-sm font-bold uppercase tracking-wide text-[color:var(--color-sjc-blue)]">
          Proof It Works
        </p>
        <h2 className="mt-3 text-3xl font-bold leading-tight tracking-tight text-[color:var(--color-sjc-ink)] md:text-4xl">
          A med spa owner was losing 71% of his paid leads. They filled out the form and disappeared.
        </h2>

        <div className="mt-8 space-y-6 text-lg leading-relaxed text-[color:var(--color-sjc-ink)]">
          <p>
            The owner had been running Facebook ads for two years. Leads would fill out the form,
            land in the CRM, and sit there. Nobody followed up fast enough. By the time a human
            got around to calling, the lead was already cold &mdash; or booked with a competitor.
          </p>
          <p>
            Only 29% of leads were self-booking an appointment. The other 71% were just...
            sitting there. That&apos;s 71 out of every 100 people who raised their hand and said
            &ldquo;I&apos;m interested&rdquo; &mdash; gone.
          </p>
        </div>

        <div className="mt-10 rounded-2xl border border-[color:var(--color-sjc-blue)] bg-[color:var(--color-sjc-blue)] px-8 py-8 text-white md:px-10">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] opacity-80 md:text-sm">
            What We Installed
          </p>
          <p className="mt-4 text-xl font-bold leading-snug md:text-2xl">
            We built an AI employee named Chloe and trained her on the owner&apos;s voice, his pricing,
            his booking process, and his objection handling.
          </p>
          <p className="mt-4 text-base leading-relaxed opacity-90 md:text-lg">
            She responds to every new lead within seconds &mdash; by text, Facebook Messenger,
            Instagram DM, or Google Chat. She sounds like the owner on his best day. She answers
            questions, handles price objections, and books the consultation directly into the calendar.
          </p>
        </div>

        {/* Results */}
        <div className="mt-10">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[color:var(--color-sjc-blue)]">
            First Night Live
          </p>
          <div className="mt-4 grid gap-5 md:grid-cols-3">
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 text-center">
              <p className="text-3xl font-bold text-[color:var(--color-sjc-blue)] md:text-4xl">4</p>
              <p className="mt-2 text-sm font-semibold text-[color:var(--color-sjc-ink)]">
                Appointments booked
              </p>
              <p className="mt-1 text-xs text-gray-600">in 90 minutes</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 text-center">
              <p className="text-3xl font-bold text-[color:var(--color-sjc-blue)] md:text-4xl">~$5K</p>
              <p className="mt-2 text-sm font-semibold text-[color:var(--color-sjc-ink)]">
                Potential lifetime value
              </p>
              <p className="mt-1 text-xs text-gray-600">from one Sunday evening</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 text-center">
              <p className="text-3xl font-bold text-[color:var(--color-sjc-blue)] md:text-4xl">24/7</p>
              <p className="mt-2 text-sm font-semibold text-[color:var(--color-sjc-ink)]">
                Coverage from day one
              </p>
              <p className="mt-1 text-xs text-gray-600">no training ramp, no onboarding</p>
            </div>
          </div>
        </div>

        <div className="mt-10 space-y-5 text-lg leading-relaxed text-[color:var(--color-sjc-ink)]">
          <p>
            Chloe didn&apos;t replace the owner. She filled the seat he could never afford to hire for
            &mdash; the person who responds instantly, follows up relentlessly, and books the appointment
            before the lead goes cold.
          </p>
          <p className="font-semibold">
            That&apos;s one seat in the org chart. Imagine all twelve filled.
          </p>
        </div>
      </div>
    </section>
  );
}
