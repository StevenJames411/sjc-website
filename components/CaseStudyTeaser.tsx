import Link from "next/link";

const STATS = [
  { value: "4", label: "appointments in 90 minutes" },
  { value: "1.6M", label: "characters of owner transcripts" },
  { value: "~$4,948", label: "potential lifetime value from one Sunday evening" },
];

export default function CaseStudyTeaser() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-5xl px-6 py-20 md:py-24">
        <p className="text-sm font-bold uppercase tracking-wide text-[color:var(--color-sjc-blue)]">
          Proof It Works
        </p>
        <h2 className="mt-3 text-3xl font-bold leading-tight tracking-tight text-[color:var(--color-sjc-ink)] md:text-4xl">
          A med spa owner was losing 71% of his paid leads. They filled out the form and
          disappeared.
        </h2>

        <div className="mt-8 space-y-6 text-lg leading-relaxed text-[color:var(--color-sjc-ink)]">
          <p>
            The owner had been running Facebook ads for two years. Leads would fill out the
            form, land in the CRM, and sit there. Nobody followed up fast enough. By the time a
            human got around to calling, the lead was already cold &mdash; or booked with a
            competitor.
          </p>
          <p>
            We extracted 1.6 million characters of the owner&apos;s actual sales call transcripts
            &mdash; his objection handling, his pricing cadence, the way he educates patients
            without playing doctor. We built an AI employee named Chloe and trained her on all
            of it.
          </p>
          <p>
            Chloe went live on a Sunday evening. Within 90 minutes, she booked 4 appointments.
            She handled price objections using the owner&apos;s own $12/day reframe. She redirected
            medical questions to the consultation &mdash; never crossing into clinical territory.
            She sounded like the owner had personally trained her. Because he had, through his
            recordings.
          </p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {STATS.map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border border-gray-200 bg-gray-50 p-7 text-center shadow-sm"
            >
              <p className="text-3xl font-bold text-[color:var(--color-sjc-blue)]">{s.value}</p>
              <p className="mt-2 text-sm font-semibold text-[color:var(--color-sjc-ink)]">
                {s.label}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <p className="text-lg font-semibold text-[color:var(--color-sjc-ink)]">
            That&apos;s one seat in the org chart. Imagine all twelve filled.
          </p>
          <div className="mt-6">
            <Link
              href="/case-study"
              className="inline-flex items-center gap-2 text-lg font-semibold text-[color:var(--color-sjc-blue)] hover:underline"
            >
              See the full case study
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                <path d="M5 12h14M13 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
