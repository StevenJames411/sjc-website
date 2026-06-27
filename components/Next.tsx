import CtaButton from "./CtaButton";

export type NextProps = {
  eyebrow: string;
  h2: string;
  p1: string;
  p2: string;
  ctaTitle: string;
  ctaSubtitle: string;
};

export const NEXT_DEFAULTS: NextProps = {
  eyebrow: "The next move",
  h2: "The next move",
  p1: "Wherever you are on the journey, you already know the playbook has a lid. Same play as everyone, same linear tools, the same leads slipping through. What's new is the lever that lifts it: an AI employee that plugs the leaks — answers every lead, follows up, books — so the org-chart seats you could never afford to fill finally fill themselves.",
  p2: "I'm not going to sell you on a call. Either it moves your numbers or it doesn't, and you'll know inside the first ten minutes. So let's talk one solo entrepreneur to another: tell me how you run today, and I'll show you exactly where it plugs in — starting with the leads you're already paying for.",
  ctaTitle: "Apply to work with me",
  ctaSubtitle: "One solo entrepreneur to another.",
};

export default function Next(props: Partial<NextProps> = {}) {
  const { eyebrow, h2, p1, p2, ctaTitle, ctaSubtitle } = { ...NEXT_DEFAULTS, ...props };

  return (
    <section style={{ backgroundColor: "#f3f4f6" }} className="w-full">
      <div className="mx-auto max-w-3xl px-6 py-20 text-center md:py-24">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-[color:var(--color-sjc-blue)]">
          {eyebrow}
        </p>
        <h2 className="mt-3 text-3xl font-bold leading-tight tracking-tight text-[color:var(--color-sjc-ink)] md:text-5xl">
          {h2}
        </h2>

        <div className="mx-auto mt-8 max-w-2xl space-y-6 text-left text-lg leading-relaxed text-[color:var(--color-sjc-ink)]">
          <p>{p1}</p>
          <p>{p2}</p>
        </div>

        <div className="mt-10 flex justify-center">
          <CtaButton title={ctaTitle} subtitle={ctaSubtitle} />
        </div>
      </div>
    </section>
  );
}
