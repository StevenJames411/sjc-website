"use client";
import Editable from "./edit/Editable";

// HOME §7 — PROOF. The receipt: a working AI employee (Chloe) booking real consults in the med
// spa field. One field proven; the same engine points at the next. Journey voice (no references
// to "the sections above" or "every location you own").
export default function Proof() {
  return (
    <section style={{ backgroundColor: "#f3f4f6" }} className="w-full">
      <div className="mx-auto max-w-4xl px-6 py-20 md:py-24">
        <Editable
          tid="home.proof.eyebrow"
          as="p"
          className="text-sm font-bold uppercase tracking-[0.18em] text-[color:var(--color-sjc-blue)]"
        >
          Proof, not theory
        </Editable>
        <Editable
          tid="home.proof.h2"
          as="h2"
          className="mt-3 text-3xl font-bold leading-tight tracking-tight text-[color:var(--color-sjc-ink)] md:text-4xl"
        >
          A working AI employee, live today.
        </Editable>

        <div className="mt-8 space-y-6 text-lg leading-relaxed text-[color:var(--color-sjc-ink)]">
          <Editable tid="home.proof.p1" as="p">
            None of this is a whiteboard theory, and I&apos;m not going to ask you to take a
            forty-year operator&apos;s word for it without a receipt. There&apos;s a working
            prototype running right now, in one field, and it&apos;s the first of many.
          </Editable>
          <Editable tid="home.proof.p2" as="p">
            The field is med spas. The AI employee has a name — Chloe. She&apos;s trained on the
            owner&apos;s own sales conversations: the way he actually talks to a lead, the questions
            he asks, the way he handles &ldquo;let me think about it.&rdquo; She answers every lead
            the instant it lands and books the consult herself, start to finish, no human in the
            loop. Her first night live was a Sunday, staff off — she booked four consults while the
            lights were out and nobody was at the desk. Four appointments that, the week before,
            would have sat in a voicemail box until Monday.
          </Editable>
          <Editable tid="home.proof.p3" as="p">
            One field, proven — an AI employee booking real consults off real leads while the
            humans slept. It&apos;s the same engine, and it points at the next field — whatever
            business runs the same playbook.
          </Editable>
        </div>
      </div>
    </section>
  );
}
