"use client";
import Editable from "./edit/Editable";

// HOME §5 — SOLUTION pt.1 / what changed. AI employees finally FILL the org-chart seats Gerber
// said to draw — the first workers the control-freak Technician will actually trust, because they
// obey exactly and he stays in command. The seat's job stays the same; who fills it is now swappable.
export default function Weapon() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-4xl px-6 py-20 md:py-24">
        <Editable
          tid="home.weapon.eyebrow"
          as="p"
          className="text-sm font-bold uppercase tracking-[0.18em] text-[color:var(--color-sjc-blue)]"
        >
          What changed
        </Editable>
        <Editable
          tid="home.weapon.h2"
          as="h2"
          className="mt-3 text-3xl font-bold leading-tight tracking-tight text-[color:var(--color-sjc-ink)] md:text-4xl"
        >
          Now the seats fill themselves.
        </Editable>
        <div className="mt-8 space-y-6 text-lg leading-relaxed text-[color:var(--color-sjc-ink)]">
          <Editable tid="home.weapon.p1" as="p">
            There&apos;s a new kind of worker that didn&apos;t exist in any usable form even a year
            ago. Not the linear software you already run. Not a chatbot. An AI employee — a worker
            with a job, trained on the way YOU do it, that answers every lead the instant
            it lands, follows up reading what the person actually said, books the appointment, and
            works the dormant list nobody has time to touch. It never quits, never has a bad day,
            never lets a lead sit. The seat&apos;s job stays exactly the same; who sits in it is
            finally something other than you.
          </Editable>
          <Editable tid="home.weapon.p2" as="p">
            And it&apos;s the first hire the control-freak in you will actually trust — because a
            human employee was always a loss of control (forgets, freelances, quits), and this is
            the opposite. It obeys exactly, every time, fully logged. Every lead tracked, every
            conversation on the record, nothing living in some new person&apos;s head where you
            can&apos;t see it. For the first time, delegating increases your grip instead of
            surrendering it. That&apos;s the lever. Here&apos;s what it does to the math.
          </Editable>
        </div>
      </div>
    </section>
  );
}
