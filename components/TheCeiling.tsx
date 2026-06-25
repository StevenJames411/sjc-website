"use client";
import Editable from "./edit/Editable";

// HOME §4 — PROBLEM. Where the linear playbook hits its lid: the daily leaks, the ceiling on
// growth, the ceiling on the multiple, and the human bottleneck (the owner who won't let go).
// Sets up the SOLUTION beats that follow (Weapon -> Where It Leads).
export default function TheCeiling() {
  return (
    <section style={{ backgroundColor: "#f3f4f6" }} className="w-full">
      <div className="mx-auto max-w-4xl px-6 py-20 md:py-24">
        <Editable
          tid="home.ceiling.eyebrow"
          as="p"
          className="text-sm font-bold uppercase tracking-[0.18em] text-[color:var(--color-sjc-blue)]"
        >
          The ceiling
        </Editable>
        <Editable
          tid="home.ceiling.h2"
          as="h2"
          className="mt-3 text-3xl font-bold leading-tight tracking-tight text-[color:var(--color-sjc-ink)] md:text-4xl"
        >
          The playbook has a lid — and you can feel it.
        </Editable>

        <div className="mt-8 space-y-6 text-lg leading-relaxed text-[color:var(--color-sjc-ink)]">
          <Editable tid="home.ceiling.p1" as="p">
            Start with where the money leaks, because it&apos;s leaking right now. The lead that
            comes in at 9 p.m. on a Saturday and sits until Monday — booked with the guy down the
            street by then. The calls that hit voicemail when the front desk is slammed. The
            follow-up that fires the same canned text to everybody. The old customers nobody has
            time to call back. A few hundred dollars here, a no-show there — invisible because
            it&apos;s spread thin, enormous once you add it up.
          </Editable>
          <Editable tid="home.ceiling.p2" as="p">
            The linear tools can&apos;t plug those leaks. They were built to move a lead from A to B
            in a straight line, and that&apos;s all they were ever built to do. They don&apos;t
            answer at midnight, they don&apos;t read what the person actually said, and they
            don&apos;t work the list. The conveyor belt has a ceiling, and you&apos;ve been bumping
            your head on it for years.
          </Editable>
          <Editable tid="home.ceiling.p3" as="p">
            And if you&apos;re rolling shops up, there&apos;s a second lid on top of the first: run
            the same tools as every other consolidator and the market prices you like every other
            consolidator — a services business, in a known band, dragged back to the category
            average no matter how well you operate.
          </Editable>
          <Editable tid="home.ceiling.p4" as="p">
            The hardest part isn&apos;t a tool at all — it&apos;s the owner who won&apos;t let go.
            Maybe that&apos;s you; maybe it&apos;s the operator you&apos;re buying. Every time he
            handed something off it got fumbled, so he stopped handing things off and does it all
            himself, and he&apos;s proud of it. That pride is what makes the shop worth having — and
            the exact thing that fights every change you try to make. That&apos;s the lid. Here&apos;s
            the lever.
          </Editable>
        </div>
      </div>
    </section>
  );
}
