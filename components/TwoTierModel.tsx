const SUPERHUMAN_ROLES = ["Sales Agent", "Customer Intake", "Objection Handling"];
const UTILITY_ROLES = ["Scheduling", "Follow-up", "Admin", "Reminders"];

export default function TwoTierModel() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-5xl px-6 py-20 md:py-24">
        <p className="text-sm font-bold uppercase tracking-wide text-[color:var(--color-sjc-blue)]">
          The Model
        </p>
        <h2 className="mt-3 text-3xl font-bold leading-tight tracking-tight text-[color:var(--color-sjc-ink)] md:text-4xl">
          Some of your employees will sound exactly like you. Others handle the busywork.
        </h2>

        <div className="mt-8 space-y-6 text-lg leading-relaxed text-[color:var(--color-sjc-ink)]">
          <p>Every install has two tiers:</p>
          <p>
            <strong>Superhuman seats (2-3 per client).</strong> These are custom-cloned from your
            actual talent. We pull your call transcripts, your sales recordings, your customer
            interactions &mdash; the raw material of how you actually do business. Then we build
            employees that carry your judgment, your cadence, your instincts. Sales. Customer
            intake. The high-stakes conversations where a generic tool falls flat. Nobody else
            can replicate these because nobody else has your recordings.
          </p>
          <p>
            <strong>Utility seats (3-4 per client).</strong> These handle the work that needs to
            happen but doesn&apos;t need your brain. Admin. Scheduling. Follow-up sequences.
            Appointment reminders. Report generation. Same engine, different config. Reliable,
            consistent, invisible.
          </p>
          <p>
            The result: 5-6 AI employees paired with your human team. Every human seat has a
            counterpart. The humans do the work that requires judgment, creativity, and
            relationships. The AI employees do everything else &mdash; and never call in sick.
          </p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-2">
          <div className="rounded-2xl border border-[color:var(--color-sjc-blue)] bg-blue-50/50 p-7">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[color:var(--color-sjc-blue)]">
              Superhuman Seats
            </p>
            <p className="mt-2 text-sm text-[color:var(--color-sjc-mute)]">
              Cloned from your actual calls and instincts
            </p>
            <ul className="mt-5 space-y-3">
              {SUPERHUMAN_ROLES.map((r) => (
                <li key={r} className="flex items-start gap-3 text-base text-[color:var(--color-sjc-ink)]">
                  <span className="mt-2 inline-block h-2 w-2 flex-shrink-0 rounded-full bg-[color:var(--color-sjc-blue)]" />
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-7">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[color:var(--color-sjc-mute)]">
              Utility Seats
            </p>
            <p className="mt-2 text-sm text-[color:var(--color-sjc-mute)]">
              Handles the busywork so your team doesn&apos;t have to
            </p>
            <ul className="mt-5 space-y-3">
              {UTILITY_ROLES.map((r) => (
                <li key={r} className="flex items-start gap-3 text-base text-[color:var(--color-sjc-ink)]">
                  <span className="mt-2 inline-block h-2 w-2 flex-shrink-0 rounded-full bg-gray-400" />
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm">
          <p className="text-lg font-bold text-[color:var(--color-sjc-ink)]">
            Result: 5-6 AI employees + your human team = an org chart that actually works
          </p>
        </div>
      </div>
    </section>
  );
}
