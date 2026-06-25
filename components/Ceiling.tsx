"use client";
import Editable from "./edit/Editable";

export default function Ceiling() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-4xl px-6 py-20 md:py-24">
        <Editable
          tid="home.ceiling.eyebrow"
          as="p"
          className="text-sm font-bold uppercase tracking-[0.18em] text-[color:var(--color-sjc-blue)]"
        >
          The Ceiling on the Multiple
        </Editable>
        <Editable
          tid="home.ceiling.h2"
          as="h2"
          className="mt-3 text-3xl font-bold leading-tight tracking-tight text-[color:var(--color-sjc-ink)] md:text-4xl"
        >
          The Ceiling on the Multiple
        </Editable>

        <div className="mt-8 space-y-6 text-lg leading-relaxed text-[color:var(--color-sjc-ink)]">
          <Editable tid="home.ceiling.p1" as="p">
            Walk it back to the multiple, because that's where the money you're leaving actually shows up.
          </Editable>
          <Editable tid="home.ceiling.p2" as="p">
            Everybody in your space runs the same play with the same linear tools. That's not an insult — it's the problem. When every consolidator integrates the same way, squeezes the same G&A, runs the same GoHighLevel-class conveyor belt, and tells the same story to the same private equity buyers, the market prices all of you the same way. You're a services roll-up. That's the category. And a services roll-up trades in a band — a known band, a tight band, a band the buyer's analyst can pull off a comp sheet in five minutes. You can be the best operator in the field and you'll still get dragged back toward the category average, because the buyer underwrites the category, not your heroics.
          </Editable>
          <Editable tid="home.ceiling.p3" as="p">
            So where does your upside actually come from? Two places, and both are grinding work. You squeeze earnings — a few points of margin a year, harder to find each year as the easy cuts run out. And you wait for the exit multiple, which isn't yours to control; it's whatever the category trades at the quarter you sell. You did the sourcing, the closing, the integration, the owner-wrangling — the genuinely hard parts — and the reward is capped at the number the category hands everybody. Bigger earnings times a flat multiple. That's the ceiling.
          </Editable>
          <Editable tid="home.ceiling.p4" as="p">
            The money left on the table is the multiple you don't get because you're still priced as a services business. A roll-up of HVAC shops trades like HVAC. A roll-up of med spas trades like med spas. Nobody re-rates you into a different, higher category, because you haven't built anything that belongs in a different category. You've built a bigger, cleaner version of the same thing the last buyer already knows how to price.
          </Editable>
          <Editable tid="home.ceiling.p5" as="p">
            The two levers that would break the lid — meaningfully more earnings per location, and a re-rate into a higher-multiple category — are exactly the two things the linear playbook can't reach. Not because your team isn't good. Because the tools top out. The conveyor belt was built to move leads in a straight line, and it has done that for fifteen years. It was never built to add earnings or to make you worth a different kind of money. That's where I come in, and now I'll tell you how.
          </Editable>
        </div>
      </div>
    </section>
  );
}
