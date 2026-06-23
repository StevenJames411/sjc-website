"use client";
import Editable from "./edit/Editable";

const POINTS = [
  {
    title: "Answered in seconds",
    body: "A lead fills out your form at 11pm. It gets a real reply before it cools off — not a thank-you page and silence.",
  },
  {
    title: "Nothing slips",
    body: "No lead waits in a queue for you to get to it. Every one gets worked, every time, while you sleep.",
  },
  {
    title: "Booked, not just emailed",
    body: "It doesn't stop at a reply. It qualifies, answers questions, and puts the appointment on your calendar.",
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
          Speed to Lead
        </Editable>
        <Editable
          tid="home.problem.h2"
          as="h2"
          className="mt-3 text-3xl font-bold leading-tight tracking-tight text-[color:var(--color-sjc-ink)] md:text-4xl"
        >
          Every lead answered the instant it lands.
        </Editable>

        <div className="mt-8 space-y-6 text-lg leading-relaxed text-[color:var(--color-sjc-ink)]">
          <Editable tid="home.problem.p1" as="p">
            You spent the money to make the phone ring. Then a lead comes in while you’re on a job, asleep, or three calls deep — and by the time you get to it, they’ve already booked with someone faster.
          </Editable>
          <Editable tid="home.problem.p2" as="p" className="font-semibold">
            That stops on day one.
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
            The lead you already paid for stops being the one that got away.
          </Editable>
        </div>
      </div>
    </section>
  );
}
