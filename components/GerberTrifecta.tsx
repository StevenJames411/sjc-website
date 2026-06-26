"use client";
import Editable from "./edit/Editable";

const STEP_ONE_DEFAULTS = [
  "Licensed per seat — you stop paying, it's gone",
  "Lives on the vendor's roadmap, not yours",
  "The next buyer doesn't pay a premium for it",
];

const STEP_TWO_DEFAULTS = [
  "Built into the business — it stays when the vendor doesn't",
  "Improves with every location it runs in",
  "Underwritten as a tech asset at exit",
];

export default function GerberTrifecta() {
  return (
    <section style={{ backgroundColor: "#f3f4f6" }} className="w-full">
      <div className="mx-auto max-w-5xl px-6 py-20 md:py-24">
        <Editable
          tid="home.step.eyebrow"
          as="p"
          className="text-sm font-bold uppercase tracking-wide text-[color:var(--color-sjc-blue)]"
        >
          Why This Re-Rates
        </Editable>
        <Editable
          tid="home.step.h2"
          as="h2"
          className="mt-3 text-3xl font-bold leading-tight tracking-tight text-[color:var(--color-sjc-ink)] md:text-4xl"
        >
          Software you rent never changed what a company was worth. An AI layer you own does.
        </Editable>

        <div className="mt-8 space-y-6 text-lg leading-relaxed text-[color:var(--color-sjc-ink)]">
          <Editable tid="home.step.p1" as="p">
            Portfolio companies have bought software for years — CRMs, schedulers, the rest. None of it changed the multiple. You rent it, you turn it off, and the company is exactly the kind of business it always was. The market prices it accordingly.
          </Editable>
          <Editable tid="home.step.p2" as="p" className="font-semibold">
            The difference isn&apos;t the tool. It&apos;s ownership. When the company owns the AI employees running its operations — built into the business, not licensed from a vendor — that becomes a defensible asset on the platform. That&apos;s what a re-rating is priced on.
          </Editable>
          <Editable tid="home.step.p3" as="p">
            A rented chatbot is a line item. An owned AI workforce, installed across the portfolio and improving over time, is a tech asset the next buyer underwrites. One is a cost. The other moves the multiple. That&apos;s the whole game.
          </Editable>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          <div className="rounded-2xl border border-gray-200 bg-white p-7 shadow-sm">
            <Editable
              tid="home.step.col1.label"
              as="p"
              className="text-xs font-bold uppercase tracking-[0.18em] text-[color:var(--color-sjc-mute)]"
            >
              Rented Software — A Cost Line
            </Editable>
            <Editable
              tid="home.step.col1.sub"
              as="p"
              className="mt-2 text-sm text-[color:var(--color-sjc-mute)]"
            >
              Priced like overhead. Re-rates nothing.
            </Editable>
            <ul className="mt-5 space-y-3">
              {STEP_ONE_DEFAULTS.map((s, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 text-base text-[color:var(--color-sjc-ink)]"
                >
                  <span className="mt-2 inline-block h-2 w-2 flex-shrink-0 rounded-full bg-gray-400" />
                  <Editable tid={`home.step.one${i}`} as="span">{s}</Editable>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-[color:var(--color-sjc-blue)] bg-blue-50/50 p-7">
            <Editable
              tid="home.step.col2.label"
              as="p"
              className="text-xs font-bold uppercase tracking-[0.18em] text-[color:var(--color-sjc-blue)]"
            >
              Owned AI Employees — An Asset
            </Editable>
            <Editable
              tid="home.step.col2.sub"
              as="p"
              className="mt-2 text-sm text-[color:var(--color-sjc-mute)]"
            >
              Built in, owned by the platform, re-rates the whole.
            </Editable>
            <ul className="mt-5 space-y-3">
              {STEP_TWO_DEFAULTS.map((s, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 text-base text-[color:var(--color-sjc-ink)]"
                >
                  <span className="mt-2 inline-block h-2 w-2 flex-shrink-0 rounded-full bg-[color:var(--color-sjc-blue)]" />
                  <Editable tid={`home.step.two${i}`} as="span">{s}</Editable>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 text-lg leading-relaxed text-[color:var(--color-sjc-ink)]">
          <Editable
            tid="home.step.callout"
            as="p"
            className="text-xl font-bold md:text-2xl"
          >
            Renting software keeps you a service business. Owning the AI layer is how a service business becomes a tech company.
          </Editable>
        </div>
      </div>
    </section>
  );
}
