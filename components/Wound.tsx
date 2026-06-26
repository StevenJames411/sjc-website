"use client";
import Editable from "./edit/Editable";

const BEATS = [
  {
    title: "Flywheel one — earnings",
    body: "AI employees run inside every location: answering leads in seconds, following up, booking, handling the work that used to need headcount. Each location does more with less. Margin goes up at the unit level, then again across the whole portfolio.",
  },
  {
    title: "Flywheel two — the multiple",
    body: "A service business that owns its AI layer stops getting priced like a service business. It re-rates toward a tech company. Same earnings, a higher multiple on top of them. That's enterprise value created out of the structure itself.",
  },
  {
    title: "Why they compound",
    body: "Better unit economics make the platform more acquisitive — more tuck-ins at better terms. More locations make the tech story bigger and the re-rating more defensible. Each turn of one flywheel feeds the other.",
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
          The Thesis
        </Editable>
        <Editable
          tid="home.wound.h2"
          as="h2"
          className="mt-3 text-3xl font-bold leading-tight tracking-tight text-[color:var(--color-sjc-ink)] md:text-4xl"
        >
          A roll-up makes money two ways at once. AI moves both — at the same time.
        </Editable>

        <div className="mt-8 space-y-6 text-lg leading-relaxed text-[color:var(--color-sjc-ink)]">
          <Editable tid="home.wound.p1" as="p">
            The value of any roll-up is earnings times a multiple. Most operators spend all their energy on the earnings and leave the multiple to chance. AI employees move both numbers — and that's the part almost nobody is pricing in yet.
          </Editable>
          <Editable tid="home.wound.p2" as="p">
            One flywheel is operational. The other is structural. Together they don't add — they compound.
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
            Most buyers underwrite the first flywheel and ignore the second. The exit is bigger when you own both.
          </Editable>
        </div>
      </div>
    </section>
  );
}
