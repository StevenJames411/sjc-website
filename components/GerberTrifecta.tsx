"use client";
import Editable from "./edit/Editable";

const STEP_ONE_DEFAULTS = [
  "A CRM that drips emails on a fixed schedule",
  "An autoresponder that fires the same message to everyone",
  "A chatbot that sits there and waits to be asked",
];

const STEP_TWO_DEFAULTS = [
  "Reaches back out to old leads on its own and restarts the conversation",
  "Follows up like a person would — until it gets an answer or a no",
  "Qualifies, handles questions, and books the appointment",
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
          Step One vs. Step Two
        </Editable>
        <Editable
          tid="home.step.h2"
          as="h2"
          className="mt-3 text-3xl font-bold leading-tight tracking-tight text-[color:var(--color-sjc-ink)] md:text-4xl"
        >
          You already tried Step One. It half-worked.
        </Editable>

        <div className="mt-8 space-y-6 text-lg leading-relaxed text-[color:var(--color-sjc-ink)]">
          <Editable tid="home.step.p1" as="p">
            Step One was the follow-up software everyone&apos;s been selling for years — the CRM, the autoresponder, the chatbot. It runs the same message in the same order every time, and then it waits for the lead to make the next move. You bought it, set it up, and it did a little. Then it stalled.
          </Editable>
          <Editable tid="home.step.p2" as="p" className="font-semibold">
            Step Two is that employee — a real AI employee, built right into the system you already use, that goes out and does the job on its own. This wasn&apos;t possible last year. Now it is, and it&apos;s the next rung up.
          </Editable>
          <Editable tid="home.step.p3" as="p">
            Here&apos;s the part nobody else will tell you: everyone else in this space is selling you a chatbot — a box that sits on your website and waits to be asked a question. A chatbot waits. A real AI employee goes out and works the lead. Building one that actually does the job, right inside the software you already run, is the hard part — and it&apos;s the part I do.
          </Editable>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          <div className="rounded-2xl border border-gray-200 bg-white p-7 shadow-sm">
            <Editable
              tid="home.step.col1.label"
              as="p"
              className="text-xs font-bold uppercase tracking-[0.18em] text-[color:var(--color-sjc-mute)]"
            >
              Step One — The Old Follow-Up
            </Editable>
            <Editable
              tid="home.step.col1.sub"
              as="p"
              className="mt-2 text-sm text-[color:var(--color-sjc-mute)]"
            >
              It sits there and waits.
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
              Step Two — A Real AI Employee
            </Editable>
            <Editable
              tid="home.step.col2.sub"
              as="p"
              className="mt-2 text-sm text-[color:var(--color-sjc-mute)]"
            >
              It goes out and does the job.
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
            That gap is exactly why you need someone to come in and build it for you — not another piece of software to set up yourself.
          </Editable>
        </div>
      </div>
    </section>
  );
}
