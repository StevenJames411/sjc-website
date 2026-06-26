"use client";
import Editable from "./edit/Editable";

// HOME §4 — PROBLEM. The lid: the daily leaks, the linear tools that can't fill a seat, the
// org chart with one name in every box (the human who won't let go = the Technician who can't
// delegate), and the sting at the exit — nobody buys a business when the owner IS the system.
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
            The linear tools can&apos;t plug those leaks, because they were never built to fill a
            seat — only to move a lead from A to B in a straight line. They don&apos;t answer at
            midnight, they don&apos;t read what the person actually said, and they don&apos;t work
            the list. So the seats on your org chart go unfilled, and the work that should live in
            them falls back onto the one person who&apos;s always caught it: you.
          </Editable>
          <Editable tid="home.ceiling.p3" as="p">
            That&apos;s the real lid — the org chart with one name in every box. Maybe it&apos;s
            you; maybe it&apos;s the operator you&apos;re buying. Every time he handed something off
            it got fumbled, so he stopped handing things off and does it all himself, and he&apos;s
            proud of it. Gerber&apos;s line still bites: if the business depends on you, you
            don&apos;t own a business — you own a job. The owner became the system.
          </Editable>
          <Editable tid="home.ceiling.p4" as="p">
            And here&apos;s where it costs the most — at the finish line. Nobody buys a business
            when the owner IS the system. The lid isn&apos;t just on how much the shop can
            grow; it&apos;s on whether you can ever sell it. That&apos;s the ceiling. Here&apos;s the
            lever.
          </Editable>
        </div>
      </div>
    </section>
  );
}
