const STEP_ONE = [
  "A CRM that drips emails on a fixed schedule",
  "An autoresponder that fires the same message to everyone",
  "A chatbot that sits there and waits to be asked",
];

const STEP_TWO = [
  "Reaches back out to old leads on its own and restarts the conversation",
  "Follows up like a person would — until it gets an answer or a no",
  "Qualifies, handles questions, and books the appointment",
];

export default function GerberTrifecta() {
  return (
    <section style={{ backgroundColor: "#f3f4f6" }} className="w-full">
      <div className="mx-auto max-w-5xl px-6 py-20 md:py-24">
        <p className="text-sm font-bold uppercase tracking-wide text-[color:var(--color-sjc-blue)]">
          Step One vs. Step Two
        </p>
        <h2 className="mt-3 text-3xl font-bold leading-tight tracking-tight text-[color:var(--color-sjc-ink)] md:text-4xl">
          You already tried Step One. It half-worked.
        </h2>

        <div className="mt-8 space-y-6 text-lg leading-relaxed text-[color:var(--color-sjc-ink)]">
          <p>
            Step One was the follow-up software everyone&apos;s been selling for
            years &mdash; the CRM, the autoresponder, the chatbot. It runs in a
            straight line: same message, same order, every time. It waits for
            the lead to act. You bought it, set it up, and it did a little. Then
            it stalled.
          </p>
          <p className="font-semibold">
            Step Two is a dynamic AI employee that goes to work. This wasn&apos;t
            possible last year. Now it is &mdash; and it&apos;s the next rung up.
          </p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          <div className="rounded-2xl border border-gray-200 bg-white p-7 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[color:var(--color-sjc-mute)]">
              Step One &mdash; Legacy Follow-Up
            </p>
            <p className="mt-2 text-sm text-[color:var(--color-sjc-mute)]">
              Linear. It waits.
            </p>
            <ul className="mt-5 space-y-3">
              {STEP_ONE.map((s) => (
                <li
                  key={s}
                  className="flex items-start gap-3 text-base text-[color:var(--color-sjc-ink)]"
                >
                  <span className="mt-2 inline-block h-2 w-2 flex-shrink-0 rounded-full bg-gray-400" />
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-[color:var(--color-sjc-blue)] bg-blue-50/50 p-7">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[color:var(--color-sjc-blue)]">
              Step Two &mdash; A Dynamic AI Employee
            </p>
            <p className="mt-2 text-sm text-[color:var(--color-sjc-mute)]">
              Dynamic. It goes to work.
            </p>
            <ul className="mt-5 space-y-3">
              {STEP_TWO.map((s) => (
                <li
                  key={s}
                  className="flex items-start gap-3 text-base text-[color:var(--color-sjc-ink)]"
                >
                  <span className="mt-2 inline-block h-2 w-2 flex-shrink-0 rounded-full bg-[color:var(--color-sjc-blue)]" />
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 text-lg leading-relaxed text-[color:var(--color-sjc-ink)]">
          <p className="text-xl font-bold md:text-2xl">
            That gap is exactly why you need an implementation partner &mdash;
            not another piece of software to set up yourself.
          </p>
        </div>
      </div>
    </section>
  );
}
