"use client";
import Editable from "./edit/Editable";

// HOME §3 — STORY. The universal playbook every owner-run business runs, said back to the
// operator at ANY stage (solo -> rolling up -> exited). Names M&A as the maximizer of this
// one play, not a separate avatar. Never opens with "AI".
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
            play five times across five different industries.
          </Editable>
          <Editable tid="home.playbook.p2" as="p">
            It starts with you on your own back. You are the business — you answer the phone, you
            run the schedule, you know every customer by name, and the whole thing lives in your
            head and your calendar. You take the risk nobody else would take, and you grind it up
            one job, one lead, one customer at a time.
          </Editable>
          <Editable tid="home.playbook.p3" as="p">
            Then you run the play to grow: get more leads in the door, answer them faster, follow
            up harder, book more of them, and don&apos;t let a single one slip. The operator who
            takes it further bolts on a second location and a third, strips out the duplicate cost,
            and builds a layer of people so it doesn&apos;t all live on him anymore.
          </Editable>
          <Editable tid="home.playbook.p4" as="p">
            And the operator who runs it all the way bundles those locations into a platform and
            sells it — the same dollars of earnings suddenly worth double or triple, purely because
            of size, story, and how clean it reads to the next buyer. That last move is exactly what
            a mergers-and-acquisitions operator does for a living. He didn&apos;t invent a new play.
            He maximizes this one.
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
