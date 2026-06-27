import CtaButton from "./CtaButton";

export type HeroReelProps = {
  eyebrow: string;
  h1: string;
  sub: string;
  fieldsLine: string;
  ctaTitle: string;
  ctaSubtitle: string;
};

export const HERO_REEL_DEFAULTS: HeroReelProps = {
  eyebrow: "You were bold enough to start.",
  h1: "You built the whole thing yourself — and the one thing standing between you and real growth was always the people.",
  sub: "Every hat in the business, you've worn it. You wanted to grow, but growing meant hiring — and the people you needed never stuck, never cared, never did it the way you do it. So you went back to carrying the whole thing alone. For the first time, that's actually changed: there's a worker you train once, that does the job exactly your way every time, never quits, and leaves you more in control than you are today — not less. Here's the two-minute version:",
  fieldsLine: "Any business built and run by the person who started it — whatever the industry, whatever software you already use.",
  ctaTitle: "Apply to work with me",
  ctaSubtitle: "One solo entrepreneur to another.",
};

export default function HeroReel(props: Partial<HeroReelProps> = {}) {
  const { eyebrow, h1, sub, fieldsLine, ctaTitle, ctaSubtitle } = { ...HERO_REEL_DEFAULTS, ...props };

  return (
    <section style={{ backgroundColor: "#0f1f3d" }} className="w-full text-white">
      <div className="mx-auto max-w-5xl px-6 pt-10 pb-16 text-center md:pt-14 md:pb-20">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-[color:var(--color-sjc-green)]">
          {eyebrow}
        </p>
        <h1 className="mt-4 text-3xl font-bold leading-tight tracking-tight md:text-5xl">
          {h1}
        </h1>
        <p className="mx-auto mt-5 max-w-3xl text-lg leading-relaxed text-white/85 md:text-xl">
          {sub}
        </p>

        {/* Sizzle-reel placeholder — replace with the 2-minute teaser cut from interviews */}
        <div className="mx-auto mt-9 aspect-video max-w-3xl overflow-hidden rounded-2xl border border-white/15 bg-black/40">
          <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-white/70">
            <span className="flex h-16 w-16 items-center justify-center rounded-full border border-white/40 text-2xl">
              &#9654;
            </span>
            <span className="text-sm uppercase tracking-[0.18em]">2-minute teaser — coming</span>
          </div>
        </div>

        <p className="mx-auto mt-7 max-w-2xl text-base text-white/70">
          {fieldsLine}
        </p>

        <div className="mt-8 flex justify-center">
          <CtaButton title={ctaTitle} subtitle={ctaSubtitle} />
        </div>
      </div>
    </section>
  );
}
