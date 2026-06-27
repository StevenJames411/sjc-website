export type ProofProps = {
  eyebrow: string;
  h2: string;
  p1: string;
  p2: string;
  p3: string;
};

export const PROOF_DEFAULTS: ProofProps = {
  eyebrow: "Proof, not theory",
  h2: "A working AI employee, live today.",
  p1: "None of this is a whiteboard theory, and I'm not going to ask you to take a forty-year business owner's word for it without a receipt. There's a working prototype running right now, in one field, and it's the first of many.",
  p2: "The AI employee has a name — Chloe. She's trained on the owner's own sales conversations: the way he actually talks to a lead, the questions he asks, the way he handles “let me think about it.” She answers every lead the instant it lands and books the consult herself, start to finish, no human in the loop. Her first night live was a Sunday, staff off — she booked four consults while the lights were out and nobody was at the desk. Four appointments that, the week before, would have sat in a voicemail box until Monday.",
  p3: "One field, proven — an AI employee booking real consults off real leads while the humans slept. It's the same engine, and it points at the next field — whatever business runs the same playbook.",
};

export default function Proof(props: Partial<ProofProps> = {}) {
  const { eyebrow, h2, p1, p2, p3 } = { ...PROOF_DEFAULTS, ...props };

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
        </div>
      </div>
    </section>
  );
}
