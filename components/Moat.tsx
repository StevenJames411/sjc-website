export type MoatProps = {
  eyebrow: string;
  h2: string;
  p1: string;
  p2: string;
  p3: string;
};

export const MOAT_DEFAULTS: MoatProps = {
  eyebrow: "The Moat — Why Me",
  h2: "The Moat — Why Me",
  p1: "Here's the un-fakeable part, and it's the reason this works with me and is very hard to copy.",
  p2: "This only works if one person is two things at once: someone who has actually run a business like yours, the way you run it, and someone who is genuinely AI-native and builds the technology himself. Those two almost never live in the same person. The twenty-two-year-old AI founder can build the system, but he's never made a payroll, never run a real shop through a slow season — he doesn't understand the business you built or the grind behind it, and you sniff that out in the first sentence. The forty-year business owner understands all of that in his bones, but he can't suddenly become AI-native and build the thing by hand — so he ends up reselling somebody else's software and changes nothing.",
  p3: "I'm both. I opened my first shop in 1986 — a restaurant — then mortgage, then roofing, then twenty years in trucking. Four businesses of my own, and the tech lead in every one, because we were too small to afford anyone else. And now I build the AI myself. Not a deck I bought, not a vendor I white-label. I sit on top of my own AI workforce and I build it by hand. So when I sit across from you, I'm not the tech guy you tolerate — I'm a man who ran shops just like yours for four decades and happens to be the one who can install the machine. You believe me because I've stood where you're standing. That overlap — real business owner and hands-on builder — is the moat. There's no one to send you to bid against, because the two halves almost never come in one person.",
};

export default function Moat(props: Partial<MoatProps> = {}) {
  const { eyebrow, h2, p1, p2, p3 } = { ...MOAT_DEFAULTS, ...props };

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
          <p>{p3}</p>
        </div>
      </div>
    </section>
  );
}
