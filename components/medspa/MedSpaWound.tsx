"use client";
import Editable from "../edit/Editable";

const BEATS = [
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
];

export default function MedSpaWound() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-5xl px-6 py-20 md:py-24">
        <Editable
          tid="medspa.wound.eyebrow"
          as="p"
          className="text-sm font-bold uppercase tracking-wide text-[color:var(--color-sjc-blue)]"
        >
          The Employee You Could Never Find
        </Editable>
        <Editable
          tid="medspa.wound.h2"
          as="h2"
          className="mt-3 text-3xl font-bold leading-tight tracking-tight text-[color:var(--color-sjc-ink)] md:text-4xl"
        >
          You&apos;ve spent years trying to find one good employee who could sell like you. You never could.
        </Editable>

        <div className="mt-8 space-y-6 text-lg leading-relaxed text-[color:var(--color-sjc-ink)]">
          <Editable tid="medspa.wound.p1" as="p">
            You hired them. You tried to train them. They wouldn&apos;t take the training, they&apos;d quit on you, or they just weren&apos;t worth the headache — so you ended up doing it all yourself. Nobody answered every lead the second it came in, followed up without being told, and closed the way you would.
          </Editable>
          <Editable tid="medspa.wound.p2" as="p">
            That&apos;s not you being a control freak. The employee you needed never existed.
          </Editable>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {BEATS.map((b, i) => (
            <div
              key={b.title}
              className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
            >
              <Editable
                tid={`medspa.wound.beat${i}.title`}
                as="h3"
                className="text-base font-bold text-[color:var(--color-sjc-blue)]"
              >
                {b.title}
              </Editable>
              <Editable
                tid={`medspa.wound.beat${i}.body`}
                as="p"
                className="mt-2 text-base leading-relaxed text-[color:var(--color-sjc-ink)]"
              >
                {b.body}
              </Editable>
            </div>
          ))}
        </div>

        <div className="mt-10 text-lg leading-relaxed text-[color:var(--color-sjc-ink)]">
          <Editable
            tid="medspa.wound.callout"
            as="p"
            className="text-xl font-bold md:text-2xl"
          >
            Until now. I build you an AI employee and train it myself — one that takes the training, never goes off the rails, never takes a day off, and never quits on you. The employee you could never find or keep, finally real.
          </Editable>
        </div>
      </div>
    </section>
  );
}
