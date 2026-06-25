import CtaButton from "./CtaButton";

// ONE shared template for the four "tables" (podcast, board of directors, tech, raising capital).
// Each pillar page passes its framing; the arc is hero -> intro -> who's at this table -> CTA.
// Layout skeleton — the content pass fills the real copy and (for podcast/board) the episode grid.
export type PillarProps = {
  name: string;
  eyebrow: string;
  tagline: string;
  body: string;
  universeTitle?: string;
  universe: string[];
  ctaTitle?: string;
  ctaSubtitle?: string;
};

export default function PillarTemplate({
  name,
  eyebrow,
  tagline,
  body,
  universeTitle = "Who's at this table",
  universe,
  ctaTitle = "Get in touch",
  ctaSubtitle = "One operator to another.",
}: PillarProps) {
  return (
    <>
      {/* Hero */}
      <section style={{ backgroundColor: "#0f1f3d" }} className="w-full text-white">
        <div className="mx-auto max-w-4xl px-6 pt-10 pb-16 text-center md:pt-14 md:pb-20">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[color:var(--color-sjc-green)]">
            {eyebrow}
          </p>
          <h1 className="mt-4 text-3xl font-bold leading-tight tracking-tight md:text-5xl">{name}</h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-white/85 md:text-xl">
            {tagline}
          </p>
        </div>
      </section>

      {/* Intro */}
      <section className="bg-white">
        <div className="mx-auto max-w-4xl px-6 py-20 md:py-24">
          <p className="text-lg leading-relaxed text-[color:var(--color-sjc-ink)] md:text-xl">{body}</p>
        </div>
      </section>

      {/* The universe */}
      <section style={{ backgroundColor: "#f3f4f6" }} className="w-full">
        <div className="mx-auto max-w-4xl px-6 py-20 md:py-24">
          <h2 className="text-3xl font-bold leading-tight tracking-tight text-[color:var(--color-sjc-ink)] md:text-4xl">
            {universeTitle}
          </h2>
          <ul className="mt-6 space-y-3">
            {universe.map((u, idx) => (
              <li key={idx} className="flex gap-3 text-lg leading-relaxed text-[color:var(--color-sjc-ink)]">
                <span className="mt-1 text-[color:var(--color-sjc-blue)]">&#9656;</span>
                <span>{u}</span>
              </li>
            ))}
          </ul>
          <p className="mt-8 text-sm uppercase tracking-[0.14em] text-[color:var(--color-sjc-mute)]">
            Episodes / details — coming
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-white">
        <div className="mx-auto max-w-3xl px-6 py-20 text-center md:py-24">
          <div className="flex justify-center">
            <CtaButton title={ctaTitle} subtitle={ctaSubtitle} />
          </div>
        </div>
      </section>
    </>
  );
}
