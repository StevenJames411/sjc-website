"use client";
import Editable from "./edit/Editable";

export default function Flip1() {
  return (
    <section style={{ backgroundColor: "#f3f4f6" }} className="w-full">
      <div className="mx-auto max-w-4xl px-6 py-20 md:py-24">
        <Editable
          tid="home.flip1.eyebrow"
          as="p"
          className="text-sm font-bold uppercase tracking-[0.18em] text-[color:var(--color-sjc-blue)]"
        >
          Flip One — Earnings per Location
        </Editable>
        <Editable
          tid="home.flip1.h2"
          as="h2"
          className="mt-3 text-3xl font-bold leading-tight tracking-tight text-[color:var(--color-sjc-ink)] md:text-4xl"
        >
          Flip One — More Earnings in Every Location
        </Editable>

        <div className="mt-8 space-y-6 text-lg leading-relaxed text-[color:var(--color-sjc-ink)]">
          <Editable tid="home.flip1.p1" as="p">
            Here's the turn. There's a new kind of worker that didn't exist in any usable form even a year ago — not the linear software you already run, not a chatbot, not another dashboard. An AI employee. Not "AI agent" — I mean a worker with a job, that takes the training, does the operating work of the shop, and never quits, never has a bad day, never lets a lead sit.
          </Editable>
          <Editable tid="home.flip1.p2" as="p">
            Start with what it does to earnings, location by location, because that's the part that hits your model first.
          </Editable>
          <Editable tid="home.flip1.p3" as="p">
            Think about where money leaks out of every one of your shops. A lead comes in at 9 p.m. on a Saturday and sits until Monday — by Monday he's booked with the guy down the street who answered. The front desk is slammed and three calls go to voicemail and never get called back. The follow-up sequence in your linear stack fires the same canned text to everybody and converts a fraction of what a sharp human would. Old customers who haven't been back in a year never hear from anyone, because nobody has the time to work that list. Every one of those is real money, and every one of those is happening in all five, six, seven of your locations right now, every day. It's invisible because it's spread thin — a few hundred dollars here, a no-show there — but across the portfolio it's enormous.
          </Editable>
          <Editable tid="home.flip1.p4" as="p">
            An AI employee closes every one of those leaks at the same time. It answers every lead the instant it lands — seconds, not Monday — in a real conversation, day or night, weekend or holiday. It follows up until it gets an answer, not on a dumb timer but reading what the person actually said. It qualifies, it books the appointment, it handles the intake. It works the dormant customer list that nobody's had time to touch. And it does this across every location at once, the same way every time, fully logged, nothing through the cracks. The shop does more with less — more booked appointments off the same ad spend, fewer dropped leads, fewer no-shows, a front desk freed to handle the people standing in front of them.
          </Editable>
          <Editable tid="home.flip1.p5" as="p">
            That's margin at the unit level. More revenue captured off leads you're already paying for, less labor burned on work the machine now does. Roll that across the whole portfolio and you've moved EBITDA — not by cutting another point of G&A you already cut, but by plugging the leaks the linear tools were never built to plug. Bigger earnings base. That's flip one, and on its own it pays for the whole thing. But it's the smallest of the three.
          </Editable>
        </div>
      </div>
    </section>
  );
}
