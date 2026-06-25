"use client";
import Editable from "./edit/Editable";

// HOME §4 — "The weapon." The one new lever: an AI employee. Concise at altitude; the deep
// mechanics live on the field pages. (Placeholder/skeleton copy — content pass fills this.)
export default function Weapon() {
  return (
    <section style={{ backgroundColor: "#f3f4f6" }} className="w-full">
      <div className="mx-auto max-w-4xl px-6 py-20 md:py-24">
        <Editable
          tid="home.weapon.eyebrow"
          as="p"
          className="text-sm font-bold uppercase tracking-[0.18em] text-[color:var(--color-sjc-blue)]"
        >
          The new weapon
        </Editable>
        <Editable
          tid="home.weapon.h2"
          as="h2"
          className="mt-3 text-3xl font-bold leading-tight tracking-tight text-[color:var(--color-sjc-ink)] md:text-4xl"
        >
          The lever that didn&apos;t exist a year ago: an AI employee.
        </Editable>
        <div className="mt-8 space-y-6 text-lg leading-relaxed text-[color:var(--color-sjc-ink)]">
          <Editable tid="home.weapon.p1" as="p">
            Not the linear software you already run. Not a chatbot. A worker with a job — it takes
            the training, answers every lead the instant it lands, follows up until it gets an
            answer, books the appointment, and works the dormant list nobody has time to touch.
            It never quits, never has a bad day, never lets a lead sit.
          </Editable>
          <Editable tid="home.weapon.p2" as="p">
            That&apos;s the lever I bring to the playbook you already run. (Deeper, field by field,
            on your industry&apos;s page.)
          </Editable>
        </div>
      </div>
    </section>
  );
}
