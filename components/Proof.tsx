"use client";
import Editable from "./edit/Editable";

export default function Proof() {
  return (
    <section style={{ backgroundColor: "#f3f4f6" }} className="w-full">
      <div className="mx-auto max-w-4xl px-6 py-20 md:py-24">
        <Editable
          tid="home.proof.eyebrow"
          as="p"
          className="text-sm font-bold uppercase tracking-[0.18em] text-[color:var(--color-sjc-blue)]"
        >
          A Working Prototype
        </Editable>
        <Editable
          tid="home.proof.h2"
          as="h2"
          className="mt-3 text-3xl font-bold leading-tight tracking-tight text-[color:var(--color-sjc-ink)] md:text-4xl"
        >
          A Working Prototype, Live Today
        </Editable>

        <div className="mt-8 space-y-6 text-lg leading-relaxed text-[color:var(--color-sjc-ink)]">
          <Editable tid="home.proof.p1" as="p">
            None of this is a whiteboard theory, and I'm not going to ask you to take a forty-year operator's word for it without a receipt. There's a working prototype running right now, in one vertical, and it's the first of many.
          </Editable>
          <Editable tid="home.proof.p2" as="p">
            The vertical is med spas — small, owner-run clinics, exactly the kind of fragmented, owner-is-the-business shop a consolidator targets. The AI employee has a name: Chloe. She's trained on the operator's own sales conversations — the way that owner actually talks to a lead, the questions he asks, the way he handles "let me think about it." She answers every lead the instant it lands and books the consult herself, start to finish, no human in the loop. Her first night live was a Sunday, with the staff off. She booked four consults while the lights were out and nobody was at the desk. Four appointments that, the week before, would have sat in a voicemail box until Monday and half of them would've booked somewhere else by then.
          </Editable>
          <Editable tid="home.proof.p3" as="p">
            I'm putting this in front of you as one proof point, not as the headline — because the headline isn't a med spa. The headline is everything in the eight sections above it. The med spa is simply where I proved the engine first: one vertical, live, booking real consults off real leads while the humans slept. It's the prototype that shows the machine runs in the real world, on a real business, against the exact leak — the lead that lands when nobody's there to answer — that bleeds every location you own. One vertical proven. The rest is the same engine, pointed at the next industry.
          </Editable>
        </div>
      </div>
    </section>
  );
}
