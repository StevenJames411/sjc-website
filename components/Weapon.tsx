export type WeaponProps = {
  eyebrow: string;
  h2: string;
  p1: string;
  p2: string;
  teaser: string;
};

export const WEAPON_DEFAULTS: WeaponProps = {
  eyebrow: "What changed",
  h2: "Now the seats fill themselves.",
  p1: "There's a new kind of worker that didn't exist in any usable form even a year ago. Not the linear software you already run. Not a chatbot. An AI employee — a worker with a job, trained on the way YOU do it, that answers every lead the instant it lands, follows up reading what the person actually said, books the appointment, and works the dormant list nobody has time to touch. It never quits, never has a bad day, never lets a lead sit. The seat's job stays exactly the same; who sits in it is finally something other than you.",
  p2: "And it's the first hire the control-freak in you will actually trust — because a human employee was always a loss of control (forgets, freelances, quits), and this is the opposite. It obeys exactly, every time, fully logged. Every lead tracked, every conversation on the record, nothing living in some new person's head where you can't see it. For the first time, delegating increases your grip instead of surrendering it. That's the lever — the biggest shift to hit a business like yours since the org chart was invented.",
  teaser: "For forty years, the one employee you needed most didn't exist. Twenty-four months ago, that changed.",
};

export default function Weapon(props: Partial<WeaponProps> = {}) {
  const { eyebrow, h2, p1, p2, teaser } = { ...WEAPON_DEFAULTS, ...props };

  return (
    <section className="bg-white">
      <div className="mx-auto max-w-4xl px-6 py-20 md:py-24">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-[color:var(--color-sjc-blue)]">
          {eyebrow}
        </p>
        <h2 className="mt-3 text-3xl font-bold leading-tight tracking-tight text-[color:var(--color-sjc-ink)] md:text-4xl">
          {h2}
        </h2>
        <div className="mt-8 space-y-6 text-lg leading-relaxed text-[color:var(--color-sjc-ink)]">
          <p>{p1}</p>
          <p>{p2}</p>
        </div>
        <div className="mt-10">
          <p className="text-lg leading-relaxed text-[color:var(--color-sjc-ink)]">{teaser}</p>
          <a href="/what-changed" className="mt-3 inline-flex items-center gap-1 text-base font-semibold text-[color:var(--color-sjc-blue)] hover:underline">
            See what changed &rarr;
          </a>
        </div>
      </div>
    </section>
  );
}
