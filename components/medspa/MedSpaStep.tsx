export type MedSpaStepProps = {
  eyebrow: string;
  h2: string;
  p1: string;
  p2: string;
  p3: string;
  col1label: string;
  col1sub: string;
  col2label: string;
  col2sub: string;
  step1: { item: string }[];
  step2: { item: string }[];
  callout: string;
};

export const MEDSPA_STEP_DEFAULTS: MedSpaStepProps = {
  eyebrow: "Step One vs. Step Two",
  h2: "You've been sold a fix before. It never touched the real problem.",
  p1: "Somebody sold you a CRM. Somebody sold you an autoresponder. Now somebody's selling you a chatbot. Every one of them promised to take work off your back. You bought it, set it up, and a few months later you were still the one doing the work — because none of it ever did the job. It just sat there.",
  p2: "That's the catch nobody says out loud: those things treat the symptom. They patch one little task and leave the real problem untouched — that there's still no one but you actually doing the work.",
  p3: "Take the chatbot everyone's pushing right now. It sits on your website and waits to be asked a question. It can't go out and work a lead. It can't pick up what you set down. It's one more box you babysit — another piece of software, not a person who handles it. That's the difference between a gadget and an employee, and it's the whole reason the fixes keep letting you down.",
  col1label: "The Surface Fix — Software You Babysit",
  col1sub: "It sits there and waits for you.",
  col2label: "The Real Thing — An Employee That Works",
  col2sub: "It goes out and does the job for you.",
  step1: [
    { item: "A CRM that drips the same emails on a fixed schedule" },
    { item: "An autoresponder that fires one canned message to everyone" },
    { item: "A chatbot that sits on your site and waits to be asked" },
  ],
  step2: [
    { item: "Reaches back out to old leads on its own and restarts the conversation" },
    { item: "Follows up like a person would — until it gets an answer or a no" },
    { item: "Qualifies, handles the questions, and books the appointment" },
  ],
  callout:
    "The fixes failed you because they were never the real thing. A real employee — one that actually does the job — is. And for the first time, you can finally have one.",
};

export default function MedSpaStep({
  eyebrow,
  h2,
  p1,
  p2,
  p3,
  col1label,
  col1sub,
  col2label,
  col2sub,
  step1,
  step2,
  callout,
}: MedSpaStepProps) {
  return (
    <section style={{ backgroundColor: "#f3f4f6" }} className="w-full">
      <div className="mx-auto max-w-5xl px-6 py-20 md:py-24">
        <p className="text-sm font-bold uppercase tracking-wide text-[color:var(--color-sjc-blue)]">
          {eyebrow}
        </p>
        <h2 className="mt-3 text-3xl font-bold leading-tight tracking-tight text-[color:var(--color-sjc-ink)] md:text-4xl">
          {h2}
        </h2>
        <div className="mt-8 space-y-6 text-lg leading-relaxed text-[color:var(--color-sjc-ink)]">
          <p>{p1}</p>
          <p className="font-semibold">{p2}</p>
          <p>{p3}</p>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          <div className="rounded-2xl border border-gray-200 bg-white p-7 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[color:var(--color-sjc-mute)]">
              {col1label}
            </p>
            <p className="mt-2 text-sm text-[color:var(--color-sjc-mute)]">{col1sub}</p>
            <ul className="mt-5 space-y-3">
              {step1.map((s, i) => (
                <li key={i} className="flex items-start gap-3 text-base text-[color:var(--color-sjc-ink)]">
                  <span className="mt-2 inline-block h-2 w-2 flex-shrink-0 rounded-full bg-gray-400" />
                  <span>{s.item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-[color:var(--color-sjc-blue)] bg-blue-50/50 p-7">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[color:var(--color-sjc-blue)]">
              {col2label}
            </p>
            <p className="mt-2 text-sm text-[color:var(--color-sjc-mute)]">{col2sub}</p>
            <ul className="mt-5 space-y-3">
              {step2.map((s, i) => (
                <li key={i} className="flex items-start gap-3 text-base text-[color:var(--color-sjc-ink)]">
                  <span className="mt-2 inline-block h-2 w-2 flex-shrink-0 rounded-full bg-[color:var(--color-sjc-blue)]" />
                  <span>{s.item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-10 text-lg leading-relaxed text-[color:var(--color-sjc-ink)]">
          <p className="text-xl font-bold md:text-2xl">{callout}</p>
        </div>
      </div>
    </section>
  );
}
