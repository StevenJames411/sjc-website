export type TheCeilingProps = {
  eyebrow: string;
  h2: string;
  p1: string;
  p2: string;
  p3: string;
  p4: string;
};

export const CEILING_DEFAULTS: TheCeilingProps = {
  eyebrow: "The ceiling",
  h2: "The playbook has a lid — and you can feel it.",
  p1: "Start with where the money leaks, because it's leaking right now. The lead that comes in at 9 p.m. on a Saturday and sits until Monday — booked with the guy down the street by then. The calls that hit voicemail when the front desk is slammed. The follow-up that fires the same canned text to everybody. The old customers nobody has time to call back. A few hundred dollars here, a no-show there — invisible because it's spread thin, enormous once you add it up.",
  p2: "The linear tools can't plug those leaks, because they were never built to fill a seat — only to move a lead from A to B in a straight line. They don't answer at midnight, they don't read what the person actually said, and they don't work the list. So the seats on your org chart go unfilled, and the work that should live in them falls back onto the one person who's always caught it: you.",
  p3: "That's the real lid — the org chart with one name in every box. Maybe it's you; maybe it's the operator you're buying. Every time he handed something off it got fumbled, so he stopped handing things off and does it all himself, and he's proud of it. Gerber's line still bites: if the business depends on you, you don't own a business — you own a job. The owner became the system.",
  p4: "And here's where it costs the most — at the finish line. Nobody buys a business when the owner IS the system. The lid isn't just on how much the shop can grow; it's on whether you can ever sell it. That's the ceiling. Here's the lever.",
};

export default function TheCeiling(props: Partial<TheCeilingProps> = {}) {
  const { eyebrow, h2, p1, p2, p3, p4 } = { ...CEILING_DEFAULTS, ...props };

  return (
    <section style={{ backgroundColor: "#f3f4f6" }} className="w-full">
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
          <p>{p4}</p>
        </div>
      </div>
    </section>
  );
}
