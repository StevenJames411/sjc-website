"use client";
import Editable from "../edit/Editable";

const STEP_ONE_DEFAULTS = [
  "A CRM that drips the same emails on a fixed schedule",
  "An autoresponder that fires one canned message to everyone",
  "A chatbot that sits on your site and waits to be asked",
];

const STEP_TWO_DEFAULTS = [
  "Reaches back out to old leads on its own and restarts the conversation",
  "Follows up like a person would — until it gets an answer or a no",
  "Qualifies, handles the questions, and books the appointment",
];

export default function MedSpaStep() {
  return (
    <section style={{ backgroundColor: "#f3f4f6" }} className="w-full">
      <div className="mx-auto max-w-5xl px-6 py-20 md:py-24">
        <Editable
          tid="med-spa.step.eyebrow"
          as="p"
          className="text-sm font-bold uppercase tracking-wide text-[color:var(--color-sjc-blue)]"
        >
          Step One vs. Step Two
        </Editable>
        <Editable
          tid="med-spa.step.h2"
          as="h2"
          className="mt-3 text-3xl font-bold leading-tight tracking-tight text-[color:var(--color-sjc-ink)] md:text-4xl"
        >
          You&apos;ve been sold a fix before. It never touched the real problem.
        </Editable>

        <div className="mt-8 space-y-6 text-lg leading-relaxed text-[color:var(--color-sjc-ink)]">
          <Editable tid="med-spa.step.p1" as="p">
            Somebody sold you a CRM. Somebody sold you an autoresponder. Now somebody&apos;s selling you a chatbot. Every one of them promised to take work off your back. You bought it, set it up, and a few months later you were still the one doing the work — because none of it ever did the job. It just sat there.
          </Editable>
          <Editable tid="med-spa.step.p2" as="p" className="font-semibold">
            That&apos;s the catch nobody says out loud: those things treat the symptom. They patch one little task and leave the real problem untouched — that there&apos;s still no one but you actually doing the work.
          </Editable>
          <Editable tid="med-spa.step.p3" as="p">
            Take the chatbot everyone&apos;s pushing right now. It sits on your website and waits to be asked a question. It can&apos;t go out and work a lead. It can&apos;t pick up what you set down. It&apos;s one more box you babysit — another piece of software, not a person who handles it. That&apos;s the difference between a gadget and an employee, and it&apos;s the whole reason the fixes keep letting you down.
          </Editable>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          <div className="rounded-2xl border border-gray-200 bg-white p-7 shadow-sm">
            <Editable
              tid="med-spa.step.col1.label"
              as="p"
              className="text-xs font-bold uppercase tracking-[0.18em] text-[color:var(--color-sjc-mute)]"
            >
              The Surface Fix — Software You Babysit
            </Editable>
            <Editable
              tid="med-spa.step.col1.sub"
              as="p"
              className="mt-2 text-sm text-[color:var(--color-sjc-mute)]"
            >
              It sits there and waits for you.
            </Editable>
            <ul className="mt-5 space-y-3">
              {STEP_ONE_DEFAULTS.map((s, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 text-base text-[color:var(--color-sjc-ink)]"
                >
                  <span className="mt-2 inline-block h-2 w-2 flex-shrink-0 rounded-full bg-gray-400" />
                  <Editable tid={`med-spa.step.one${i}`} as="span">{s}</Editable>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-[color:var(--color-sjc-blue)] bg-blue-50/50 p-7">
            <Editable
              tid="med-spa.step.col2.label"
              as="p"
              className="text-xs font-bold uppercase tracking-[0.18em] text-[color:var(--color-sjc-blue)]"
            >
              The Real Thing — An Employee That Works
            </Editable>
            <Editable
              tid="med-spa.step.col2.sub"
              as="p"
              className="mt-2 text-sm text-[color:var(--color-sjc-mute)]"
            >
              It goes out and does the job for you.
            </Editable>
            <ul className="mt-5 space-y-3">
              {STEP_TWO_DEFAULTS.map((s, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 text-base text-[color:var(--color-sjc-ink)]"
                >
                  <span className="mt-2 inline-block h-2 w-2 flex-shrink-0 rounded-full bg-[color:var(--color-sjc-blue)]" />
                  <Editable tid={`med-spa.step.two${i}`} as="span">{s}</Editable>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 text-lg leading-relaxed text-[color:var(--color-sjc-ink)]">
          <Editable
            tid="med-spa.step.callout"
            as="p"
            className="text-xl font-bold md:text-2xl"
          >
            The fixes failed you because they were never the real thing. A real employee — one that actually does the job — is. And for the first time, you can finally have one.
          </Editable>
        </div>
      </div>
    </section>
  );
}
