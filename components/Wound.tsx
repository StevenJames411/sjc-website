"use client";
import Editable from "./edit/Editable";

const BEATS = [
  {
    title: "You tried to hire it",
    body: "You ran the ads, did the interviews, made the offers. The ones who could sell didn't last, and the ones who lasted couldn't sell.",
  },
  {
    title: "You tried to train it",
    body: "You taught them your pitch, your follow-up, the way you handle a tough lead. It never stuck the way it lived in your own head.",
  },
  {
    title: "So you did it yourself",
    body: "Every lead, every follow-up, every close — back on your plate. Not because you wanted the control. Because nobody ever measured up.",
  },
];

export default function Wound() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-5xl px-6 py-20 md:py-24">
        <Editable
          tid="home.wound.eyebrow"
          as="p"
          className="text-sm font-bold uppercase tracking-wide text-[color:var(--color-sjc-blue)]"
        >
          The hire you could never make
        </Editable>
        <Editable
          tid="home.wound.h2"
          as="h2"
          className="mt-3 text-3xl font-bold leading-tight tracking-tight text-[color:var(--color-sjc-ink)] md:text-4xl"
        >
          You spent your whole career looking for a salesperson as good as you. They didn’t exist.
        </Editable>

        <div className="mt-8 space-y-6 text-lg leading-relaxed text-[color:var(--color-sjc-ink)]">
          <Editable tid="home.wound.p1" as="p">
            You tried to hire it. You tried to train it. Nobody answered every lead the second it came in, followed up forever, and closed the way you would — so you did it yourself, because no one ever measured up.
          </Editable>
          <Editable tid="home.wound.p2" as="p">
            That’s not you being a control freak. That’s a unicorn that was never on the market.
          </Editable>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {BEATS.map((b, i) => (
            <div
              key={b.title}
              className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
            >
              <Editable
                tid={`home.wound.beat${i}.title`}
                as="h3"
                className="text-base font-bold text-[color:var(--color-sjc-blue)]"
              >
                {b.title}
              </Editable>
              <Editable
                tid={`home.wound.beat${i}.body`}
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
            tid="home.wound.callout"
            as="p"
            className="text-xl font-bold md:text-2xl"
          >
            Until now.
          </Editable>
        </div>
      </div>
    </section>
  );
}
