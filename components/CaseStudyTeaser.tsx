"use client";
import Link from "next/link";
import Editable from "./edit/Editable";

const STATS_DEFAULTS = [
  { value: "Instant", label: "Every lead answered the second it lands" },
  { value: "4", label: "Consults booked in the first 90 minutes" },
  { value: "Sunday night", label: "When the location was closed and staff were off" },
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
          Vertical One — The Proof
        </Editable>
        <Editable
          tid="home.proof.h2"
          as="h2"
          className="mt-3 text-3xl font-bold leading-tight tracking-tight text-[color:var(--color-sjc-ink)] md:text-4xl"
        >
          The first vertical is live. The model is proven. The rest fork off the same engine.
        </Editable>

        <div className="mt-8 space-y-6 text-lg leading-relaxed text-[color:var(--color-sjc-ink)]">
          <Editable tid="home.proof.p1" as="p">
            I started where the model could prove itself fastest: med spas. One was getting plenty of leads and losing most of them — forms landing in a CRM, sitting cold until someone got around to calling, by which point the lead was gone. A clean, measurable problem to put the working model against.
          </Editable>
          <Editable tid="home.proof.p2" as="p">
            We trained an AI employee — Chloe — on the operator&apos;s own sales conversations: how he answers questions, how he handles price, how he talks to people. Then we put her to work on top of the business he already ran.
          </Editable>
          <Editable tid="home.proof.p3" as="p">
            She answers every lead the instant it lands, holds a real conversation, handles objections in his own words, and books the consult herself. Her first night live she booked four — on a Sunday, while staff were off the clock. That&apos;s the working model, running in a real P&amp;L.
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
            That&apos;s one AI employee, in one location, in one vertical. Med spa is the beachhead — the warm, fast proof. The same engine forks into health, roofing, HVAC, and the next platform after that.
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
