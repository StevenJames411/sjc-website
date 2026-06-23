"use client";
import Link from "next/link";
import Editable from "./edit/Editable";

const STATS_DEFAULTS = [
  { value: "Instant", label: "Every lead answered the second it lands" },
  { value: "4", label: "Consults booked in the first 90 minutes" },
  { value: "Sunday night", label: "When a human would've been asleep" },
];

export default function CaseStudyTeaser() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-5xl px-6 py-20 md:py-24">
        <Editable
          tid="home.proof.eyebrow"
          as="p"
          className="text-sm font-bold uppercase tracking-wide text-[color:var(--color-sjc-blue)]"
        >
          The proof
        </Editable>
        <Editable
          tid="home.proof.h2"
          as="h2"
          className="mt-3 text-3xl font-bold leading-tight tracking-tight text-[color:var(--color-sjc-ink)] md:text-4xl"
        >
          The machine is the receipt.
        </Editable>

        <div className="mt-8 space-y-6 text-lg leading-relaxed text-[color:var(--color-sjc-ink)]">
          <Editable tid="home.proof.p1" as="p">
            A med spa was getting plenty of leads and losing most of them. They&apos;d fill out the form, land in the CRM, and sit there until somebody got around to calling — by which point the lead was cold, or already booked somewhere else.
          </Editable>
          <Editable tid="home.proof.p2" as="p">
            We trained an AI employee named Chloe on the owner&apos;s own sales conversations — how he answers questions, how he handles the price objection, how he talks to people. Then we put her to work on top of the business he already had.
          </Editable>
          <Editable tid="home.proof.p3" as="p">
            She doesn&apos;t wait. She answers every lead the instant it comes in, holds a real conversation, handles objections in the owner&apos;s own words, and books the consult herself. Her first night live, she booked four — on a Sunday, while a human would&apos;ve been asleep.
          </Editable>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {STATS_DEFAULTS.map((s, i) => (
            <div
              key={i}
              className="rounded-2xl border border-gray-200 bg-gray-50 p-7 text-center shadow-sm"
            >
              <Editable
                tid={`home.proof.stat${i}.value`}
                as="p"
                className="text-2xl font-bold text-[color:var(--color-sjc-blue)] md:text-3xl"
              >
                {s.value}
              </Editable>
              <Editable
                tid={`home.proof.stat${i}.label`}
                as="p"
                className="mt-2 text-sm font-semibold text-[color:var(--color-sjc-ink)]"
              >
                {s.label}
              </Editable>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Editable
            tid="home.proof.summary"
            as="p"
            className="text-lg font-semibold text-[color:var(--color-sjc-ink)]"
          >
            That&apos;s one AI employee, running on top of the business he already had — with the owner holding the keys the whole time.
          </Editable>
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
