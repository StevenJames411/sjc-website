import Link from "next/link";

const STATS = [
  { value: "Instant", label: "Every lead answered the second it lands" },
  { value: "4", label: "Consults booked in the first 90 minutes" },
  { value: "Sunday night", label: "When a human would've been asleep" },
];

export default function CaseStudyTeaser() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-5xl px-6 py-20 md:py-24">
        <p className="text-sm font-bold uppercase tracking-wide text-[color:var(--color-sjc-blue)]">
          The proof
        </p>
        <h2 className="mt-3 text-3xl font-bold leading-tight tracking-tight text-[color:var(--color-sjc-ink)] md:text-4xl">
          The machine is the receipt.
        </h2>

        <div className="mt-8 space-y-6 text-lg leading-relaxed text-[color:var(--color-sjc-ink)]">
          <p>
            A med spa was getting plenty of leads and losing most of them. They&apos;d fill out the
            form, land in the CRM, and sit there until somebody got around to calling &mdash; by
            which point the lead was cold, or already booked somewhere else.
          </p>
          <p>
            We trained an AI employee named Chloe on the owner&apos;s own sales conversations &mdash;
            how he answers questions, how he handles the price objection, how he talks to people.
            Then we put her to work on top of the business he already had.
          </p>
          <p>
            She doesn&apos;t wait. She answers every lead the instant it comes in, holds a real
            conversation, handles objections in the owner&apos;s own words, and books the consult
            herself. Her first night live, she booked four &mdash; on a Sunday, while a human
            would&apos;ve been asleep.
          </p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {STATS.map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border border-gray-200 bg-gray-50 p-7 text-center shadow-sm"
            >
              <p className="text-2xl font-bold text-[color:var(--color-sjc-blue)] md:text-3xl">{s.value}</p>
              <p className="mt-2 text-sm font-semibold text-[color:var(--color-sjc-ink)]">
                {s.label}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <p className="text-lg font-semibold text-[color:var(--color-sjc-ink)]">
            That&apos;s one AI employee, running on top of the business he already had &mdash; with
            the owner holding the keys the whole time.
          </p>
          <div className="mt-6">
            <Link
              href="/case-study"
              className="inline-flex items-center gap-2 text-lg font-semibold text-[color:var(--color-sjc-blue)] hover:underline"
            >
              See the full proof
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
