"use client";
import Editable from "./edit/Editable";

export default function Flip3() {
  return (
    <section style={{ backgroundColor: "#f3f4f6" }} className="w-full">
      <div className="mx-auto max-w-4xl px-6 py-20 md:py-24">
        <Editable
          tid="home.flip3.eyebrow"
          as="p"
          className="text-sm font-bold uppercase tracking-[0.18em] text-[color:var(--color-sjc-blue)]"
        >
          Flip Three — The Owners Say Yes
        </Editable>
        <Editable
          tid="home.flip3.h2"
          as="h2"
          className="mt-3 text-3xl font-bold leading-tight tracking-tight text-[color:var(--color-sjc-ink)] md:text-4xl"
        >
          Flip Three — The Owners Finally Say Yes
        </Editable>

        <div className="mt-8 space-y-6 text-lg leading-relaxed text-[color:var(--color-sjc-ink)]">
          <Editable tid="home.flip3.p1" as="p">
            Now back to your hardest adversary — the owner who won't let go — because this is the flip that turns your worst bottleneck into your accelerant, and it's the keystone that holds the other two up.
          </Editable>
          <Editable tid="home.flip3.p2" as="p">
            Remember why he fights. He's terrified of losing control. Every handoff he ever made got fumbled, so handing things off is the loss he's spent twenty years refusing. Now think about how every other technology gets pitched to a man like that: it replaces him. It takes the calls he used to take, it owns the customers he used to own, it does the job he's proud of doing himself. Of course he fights it. You're asking him to surrender the one thing he'd drown before letting go of.
          </Editable>
          <Editable tid="home.flip3.p3" as="p">
            So I don't position the AI employee as a replacement. I position it as control — because that's exactly what it is for him. A human employee was always a loss of control: forgets, freelances, goes off-script, quits. An AI employee does the opposite. It obeys exactly, every time, fully logged. Every lead tracked. Every conversation on the record. Nothing slips, nothing goes off the rails, nothing lives in some new person's head where he can't see it. For the first time in his life, delegating increases his grip instead of surrendering it. He goes from the guy doing every job to the guy commanding a workforce that does every job his way, every time. That's not the thing he fights. That's the first thing a man like that will actually say yes to — because it gives him the command he's always wanted and never trusted a human to deliver.
          </Editable>
          <Editable tid="home.flip3.p4" as="p">
            Watch what that does to your deal machine. The owner stops dragging on the rope. He gets on the same page faster, because the tool isn't threatening the thing he's protecting — it's handing it to him in a stronger form. Integration goes smoother because he's pulling instead of resisting. He stops half-hiding the business in his head, because the system makes his way the standard way across every location and he's still the one in command. The buy-in problem — the single biggest drag on every deal you do — flips into the thing that closes deals faster. More owners say yes. They say yes quicker. And once they feel the grip get tighter instead of looser, they stop fighting the exit and start chasing it with you, because now they can see it's their bigger payday too. Deal velocity goes up. The grind that used to define your job is the exact grind the AI removes.
          </Editable>
        </div>
      </div>
    </section>
  );
}
