"use client";
import Editable from "./edit/Editable";

// HOME §3 — STORY. The universal playbook, told through the E-Myth: every owner-run business
// starts as the Technician (the owner IS the business). The play to grow is Gerber's — build the
// org chart, fill the seats so the system runs the business. The M&A operator maximizes that one
// play. Spoken to the operator at any stage. Never opens with "AI".
export default function Playbook() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-4xl px-6 py-20 md:py-24">
        <Editable
          tid="home.playbook.eyebrow"
          as="p"
          className="text-sm font-bold uppercase tracking-[0.18em] text-[color:var(--color-sjc-blue)]"
        >
          The playbook you already run
        </Editable>
        <Editable
          tid="home.playbook.h2"
          as="h2"
          className="mt-3 text-3xl font-bold leading-tight tracking-tight text-[color:var(--color-sjc-ink)] md:text-4xl"
        >
          Every business like yours runs the same play.
        </Editable>

        <div className="mt-8 space-y-6 text-lg leading-relaxed text-[color:var(--color-sjc-ink)]">
          <Editable tid="home.playbook.p1" as="p">
            You know this cold, so I&apos;ll just say it back to you the way you&apos;d say it
            yourself — not to teach you, but so you know I&apos;m not guessing. I&apos;ve run this
            play four times, in four different businesses of my own.
          </Editable>
          <Editable tid="home.playbook.p2" as="p">
            Michael Gerber named where it starts: you&apos;re the Technician. You got good at the
            work, you opened your own shop, and now the business is just you — you answer the phone,
            you run the schedule, you know every customer by name, and the whole thing lives in your
            head and your calendar. You take the risk nobody else would take, and you grind it up
            one job, one lead, one customer at a time.
          </Editable>
          <Editable tid="home.playbook.p3" as="p">
            The play to grow is the same one Gerber wrote down forty years ago: stop being the
            business and start building it. Draw the org chart — sales, follow-up, front desk,
            operations — and fill the seats, so the system runs the business and the people run the
            system. You work ON it instead of buried IN it. That&apos;s the whole
            game, whether you&apos;ve got one location or seven.
          </Editable>
          <Editable tid="home.playbook.p5" as="p">
            And whatever stage you&apos;re at, you run the whole thing on the same linear tools
            everyone else uses — a CRM, the GoHighLevel-class sequences, software that does what
            software has always done: if this, then that. A lead comes in, fire a text. It&apos;s a
            conveyor belt. It&apos;s been the state of the art for fifteen years, and nobody wins on
            it anymore — you run it so you don&apos;t lose on it.
          </Editable>
          <Editable tid="home.playbook.p6" as="p">
            That&apos;s the playbook, solo to exit. I&apos;m not here to tell you it&apos;s wrong.
            I&apos;m here because I know it well enough to show you where the lid is — and the new
            lever that lifts it.
          </Editable>
        </div>
      </div>
    </section>
  );
}
