import CtaButton from "./CtaButton";

// ONE shared deep template for every industry/field page. A field page passes its name (and
// optionally overrides the skeleton copy); the arc is the same everywhere:
//   the field & the playbook in it -> where it leaks -> the AI fix -> the M&A roll-up -> proof/CTA
// Adding a field = a tiny page file that renders <FieldDeepTemplate name="..." />. Content pass
// fills the real per-field copy; this is the layout skeleton.
export type FieldDeepProps = {
  name: string;
  eyebrow?: string;
  live?: boolean;
  intro?: string;
  leaksLede?: string;
  leaks?: string[];
  fix?: string;
  rollup?: string;
};

const SECTION_LIGHT = { backgroundColor: "#f3f4f6" } as const;

export default function FieldDeepTemplate(props: FieldDeepProps) {
  const {
    name,
    eyebrow = `${name} — the playbook in your field`,
    live = false,
    intro = `You run a ${name.toLowerCase()} business the way every good operator does — on your back, every hat your own. Here's the same playbook I've run five times, pointed straight at your world.`,
    leaksLede = "Here's where the money leaks out of a shop like yours, every day:",
    leaks = [
      "The lead that lands at 9 p.m. and sits until Monday — booked elsewhere by then.",
      "The calls that go to voicemail when the front desk is slammed.",
      "The follow-up that fires the same canned text to everybody.",
      "The old customers nobody has time to call back.",
    ],
    fix = "An AI employee closes every one of those leaks at once — answers the instant a lead lands, follows up until it gets an answer, books the appointment, works the dormant list. Across every location, the same way every time, fully logged.",
    rollup = `Plug the leaks at the unit level and you've moved earnings. Own the AI layer across a roll-up of ${name.toLowerCase()} shops and you stop being priced like a services business — you re-rate toward a technology multiple. Same playbook, maximized.`,
  } = props;

  return (
    <>
      {/* Hero */}
      <section style={SECTION_LIGHT} className="w-full">
        <div className="mx-auto max-w-4xl px-6 pt-6 pb-16 text-center md:pt-10 md:pb-20">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[color:var(--color-sjc-blue)]">
            {eyebrow}
            {live && (
              <span className="ml-2 rounded-full bg-[color:var(--color-sjc-green)] px-2 py-0.5 text-xs font-semibold text-white">
                Live
              </span>
            )}
          </p>
          <h1 className="mt-4 text-3xl font-bold leading-tight tracking-tight text-[color:var(--color-sjc-ink)] md:text-5xl">
            {name}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-[color:var(--color-sjc-ink)] md:text-xl">
            {intro}
          </p>
        </div>
      </section>

      {/* Where it leaks */}
      <section className="bg-white">
        <div className="mx-auto max-w-4xl px-6 py-20 md:py-24">
          <h2 className="text-3xl font-bold leading-tight tracking-tight text-[color:var(--color-sjc-ink)] md:text-4xl">
            Where the money leaks
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-[color:var(--color-sjc-ink)]">{leaksLede}</p>
          <ul className="mt-6 space-y-3">
            {leaks.map((l, idx) => (
              <li key={idx} className="flex gap-3 text-lg leading-relaxed text-[color:var(--color-sjc-ink)]">
                <span className="mt-1 text-[color:var(--color-sjc-blue)]">&#9656;</span>
                <span>{l}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* The AI fix */}
      <section style={SECTION_LIGHT} className="w-full">
        <div className="mx-auto max-w-4xl px-6 py-20 md:py-24">
          <h2 className="text-3xl font-bold leading-tight tracking-tight text-[color:var(--color-sjc-ink)] md:text-4xl">
            The fix: an AI employee
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-[color:var(--color-sjc-ink)]">{fix}</p>
        </div>
      </section>

      {/* The M&A roll-up */}
      <section className="bg-white">
        <div className="mx-auto max-w-4xl px-6 py-20 md:py-24">
          <h2 className="text-3xl font-bold leading-tight tracking-tight text-[color:var(--color-sjc-ink)] md:text-4xl">
            Where it leads — the roll-up
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-[color:var(--color-sjc-ink)]">{rollup}</p>
        </div>
      </section>

      {/* CTA */}
      <section style={SECTION_LIGHT} className="w-full">
        <div className="mx-auto max-w-3xl px-6 py-20 text-center md:py-24">
          <h2 className="text-3xl font-bold leading-tight tracking-tight text-[color:var(--color-sjc-ink)] md:text-4xl">
            Let&apos;s talk about your {name.toLowerCase()} shop.
          </h2>
          <div className="mt-10 flex justify-center">
            <CtaButton title="Book the Call" subtitle="One operator to another." />
          </div>
        </div>
      </section>
    </>
  );
}
