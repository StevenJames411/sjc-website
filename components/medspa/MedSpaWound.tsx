export type MedSpaWoundProps = {
  eyebrow: string;
  h2: string;
  p1: string;
  p2: string;
  beats: { title: string; body: string }[];
  callout: string;
};

export const MEDSPA_WOUND_DEFAULTS: MedSpaWoundProps = {
  eyebrow: "The Employee You Could Never Find",
  h2: "You've spent years trying to find one good employee who could sell like you. You never could.",
  p1: "You hired them. You tried to train them. They wouldn't take the training, they'd quit on you, or they just weren't worth the headache — so you ended up doing it all yourself. Nobody answered every lead the second it came in, followed up without being told, and closed the way you would.",
  p2: "That's not you being a control freak. The employee you needed never existed.",
  beats: [
    {
      title: "You hired them",
      body: "You ran the ads, did the interviews, made the offers. The ones who could sell didn't stick around, and the ones who stuck around couldn't sell.",
    },
    {
      title: "You tried to train them",
      body: "You sat them down and walked them through your pitch, your follow-up, the way you handle a tough lead. They wouldn't take it, or it never stuck the way it lives in your head.",
    },
    {
      title: "So you did it all yourself",
      body: "Every lead, every follow-up, every close — back on your plate. Not because you're a control freak. Because nobody you hired was ever worth the headache.",
    },
  ],
  callout:
    "Until now. I build you an AI employee and train it myself — one that takes the training, never goes off the rails, never takes a day off, and never quits on you. The employee you could never find or keep, finally real.",
};

export default function MedSpaWound({ eyebrow, h2, p1, p2, beats, callout }: MedSpaWoundProps) {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-5xl px-6 py-20 md:py-24">
        <p className="text-sm font-bold uppercase tracking-wide text-[color:var(--color-sjc-blue)]">
          {eyebrow}
        </p>
        <h2 className="mt-3 text-3xl font-bold leading-tight tracking-tight text-[color:var(--color-sjc-ink)] md:text-4xl">
          {h2}
        </h2>
        <div className="mt-8 space-y-6 text-lg leading-relaxed text-[color:var(--color-sjc-ink)]">
          <p>{p1}</p>
          <p>{p2}</p>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {beats.map((b) => (
            <div key={b.title} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="text-base font-bold text-[color:var(--color-sjc-blue)]">{b.title}</h3>
              <p className="mt-2 text-base leading-relaxed text-[color:var(--color-sjc-ink)]">{b.body}</p>
            </div>
          ))}
        </div>
        <div className="mt-10 text-lg leading-relaxed text-[color:var(--color-sjc-ink)]">
          <p className="text-xl font-bold md:text-2xl">{callout}</p>
        </div>
      </div>
    </section>
  );
}
