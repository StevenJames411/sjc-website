export type PlaybookProps = {
  eyebrow: string;
  h2: string;
  p1: string;
  p2: string;
  p3: string;
  p4: string;
  p5: string;
};

export const PLAYBOOK_DEFAULTS: PlaybookProps = {
  eyebrow: "The playbook you already run",
  h2: "Every business like yours runs the same play.",
  p1: "You know this cold, so I'll just say it back to you the way you'd say it yourself — not to teach you, but so you know I'm not guessing. I've run this play four times, in four different businesses of my own.",
  p2: "Michael Gerber named where it starts: you're the Technician. You got good at the work, you opened your own shop, and now the business is just you — you answer the phone, you run the schedule, you know every customer by name, and the whole thing lives in your head and your calendar. You take the risk nobody else would take, and you grind it up one job, one lead, one customer at a time.",
  p3: "The play to grow is the same one Gerber wrote down back in 1986: stop being the business and start building it. Draw the org chart — sales, follow-up, front desk, operations — and fill the seats, so the system runs the business and the people run the system. You work ON it instead of buried IN it. That's the whole game, whether you've got one location or seven.",
  p4: "And whatever stage you're at, you run the whole thing on the same linear tools everyone else uses — a CRM, the GoHighLevel-class sequences, software that does what software has always done: if this, then that. A lead comes in, fire a text. It's a conveyor belt. It's been the state of the art for fifteen years, and nobody wins on it anymore — you run it so you don't lose on it.",
  p5: "That's the playbook, solo to exit. I'm not here to tell you it's wrong. I'm here because I know it well enough to show you where the lid is — and the new lever that lifts it.",
};

export default function Playbook(props: Partial<PlaybookProps> = {}) {
  const { eyebrow, h2, p1, p2, p3, p4, p5 } = { ...PLAYBOOK_DEFAULTS, ...props };

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
          <p>{p4}</p>
          <p>{p5}</p>
        </div>
      </div>
    </section>
  );
}
