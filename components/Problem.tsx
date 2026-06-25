"use client";
import Editable from "./edit/Editable";

const POINTS = [
  {
    title: "Answered in seconds",
    body: "A lead comes in at 11pm and gets a real reply before it cools — not a thank-you page and silence. Every captured lead gets worked, which is margin the location was already paying for and losing.",
  },
  {
    title: "Around the clock",
    body: "It never gets busy, never forgets, never goes home. Multiply that by every location in a portfolio and you're recovering revenue that used to leak after hours, site by site.",
  },
  {
    title: "Books, doesn't just reply",
    body: "It qualifies, answers questions, and puts the appointment on the calendar. That's the difference between a chatbot and an employee — and it's why this shows up in the numbers, not just the demo.",
  },
];

export default function Problem() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-5xl px-6 py-20 md:py-24">
        <Editable
          tid="home.problem.eyebrow"
          as="p"
          className="text-sm font-bold uppercase tracking-wide text-[color:var(--color-sjc-blue)]"
        >
          The Working Model
        </Editable>
        <Editable
          tid="home.problem.h2"
          as="h2"
          className="mt-3 text-3xl font-bold leading-tight tracking-tight text-[color:var(--color-sjc-ink)] md:text-4xl"
        >
          This isn&apos;t a slide. It&apos;s running right now, in a real business.
        </Editable>

        <div className="mt-8 space-y-6 text-lg leading-relaxed text-[color:var(--color-sjc-ink)]">
          <Editable tid="home.problem.p1" as="p">
            Before we talk about what this does across a portfolio, look at what it already does in one location. The first AI employee I installed answers every lead the second it lands — at 11pm, on a Sunday, while staff are off the clock. It holds a real conversation, qualifies, and books the appointment itself. No one is babysitting it.
          </Editable>
          <Editable tid="home.problem.p2" as="p" className="font-semibold">
            That&apos;s live today — not a pilot, not a demo.
          </Editable>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {POINTS.map((p, i) => (
            <div
              key={p.title}
              className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
            >
              <Editable
                tid={`home.problem.point${i}.title`}
                as="h3"
                className="text-base font-bold text-[color:var(--color-sjc-blue)]"
              >
                {p.title}
              </Editable>
              <Editable
                tid={`home.problem.point${i}.body`}
                as="p"
                className="mt-2 text-base leading-relaxed text-[color:var(--color-sjc-ink)]"
              >
                {p.body}
              </Editable>
            </div>
          ))}
        </div>

        <div className="mt-10 text-lg leading-relaxed text-[color:var(--color-sjc-ink)]">
          <Editable
            tid="home.problem.callout"
            as="p"
            className="text-xl font-bold md:text-2xl"
          >
            One location, running this today, is the proof of concept for the whole roll-up.
          </Editable>
        </div>
      </div>
    </section>
  );
}
