export type PlatformProps = {
  eyebrow: string;
  h2: string;
  p1: string;
  p2: string;
  p3: string;
};

export const PLATFORM_DEFAULTS: PlatformProps = {
  eyebrow: "The Platform",
  h2: "The Platform — Above Any One Industry",
  p1: "Don't let any one example narrow your thinking. What I'm describing isn't a one-industry business at all — it's an AI-implementation company that sits above every single industry.",
  p2: "The engine — the AI employee that answers, follows up, qualifies, books, and reactivates; the way it's trained on one owner's own playbook; the way it installs on top of the linear software a shop already runs — none of that is tied to any single field. It forks. I proved it in the first field, then the next — roofing, because I ran a roofing company and I know exactly where that money leaks; home services, trades, practices, any field with the same shape: built and run by one person, lead-driven, fragmented, bleeding the same leaks. Same engine, retrained on the new field's playbook, installed in the businesses that run it.",
  p3: "That's what this actually is: not a tool for one industry, but the company that installs an owned AI workforce on top of whatever business you run — whichever industry, whichever software you already use. The platform goes everywhere the playbook goes.",
};

export default function Platform(props: Partial<PlatformProps> = {}) {
  const { eyebrow, h2, p1, p2, p3 } = { ...PLATFORM_DEFAULTS, ...props };

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
