"use client";
import CtaButton from "./CtaButton";
import Editable from "./edit/Editable";
import { useEditText } from "./edit/editContext";

export default function Flywheel() {
  const { getText } = useEditText();

  return (
    <section className="bg-white">
      <div className="mx-auto max-w-4xl px-6 py-20 md:py-24">
        <Editable
          tid="home.flywheel.eyebrow"
          as="p"
          className="text-sm font-bold uppercase tracking-[0.18em] text-[color:var(--color-sjc-blue)]"
        >
          Why It Compounds
        </Editable>
        <Editable
          tid="home.flywheel.h2"
          as="h2"
          className="mt-3 text-3xl font-bold leading-tight tracking-tight text-[color:var(--color-sjc-ink)] md:text-4xl"
        >
          Why It Compounds — The Flywheel
        </Editable>

        <div className="mt-8 space-y-6 text-lg leading-relaxed text-[color:var(--color-sjc-ink)]">
          <Editable tid="home.flywheel.p1" as="p">
            Put the three flips together and you don't have three features. You have a loop that feeds itself, and that's the whole point.
          </Editable>
          <Editable tid="home.flywheel.p2" as="p">
            More earnings per location grows the earnings base. Owned AI re-rates the platform toward a technology multiple. Control-preserving AI gets difficult owners to say yes, which lifts deal velocity. Now watch them turn the wheel: more owners saying yes means more deals close, which means more locations, which means a bigger earnings base and a bigger, more defensible technology story — more proof the platform's AI layer works at scale. Bigger earnings times a bigger multiple means a bigger exit. A bigger exit and a longer track record means more capital and more credibility, which means more owners want in — they've seen what happened to the last operator who said yes, and they want their version of that payday. More owners in feeds the top of the loop again, and it turns faster every cycle.
          </Editable>
          <Editable tid="home.flywheel.p3" as="p">
            And here's why nobody in the loop fights it: it's positive-sum. Everybody wins, which almost nothing in a roll-up can honestly claim. You win — more deals, smoother integration, bigger earnings, a technology multiple, a bigger exit. The owners win — their shops grow, they keep control instead of losing it, and they get a bigger payday of their own, so the man who used to fight you turns into the man who chases the exit with you. And I win, because I'm building across a whole stable of these partnerships and every one makes the next one easier to stand up.
          </Editable>
          <Editable tid="home.flywheel.p4" as="p">
            The part that used to grind everyone down — the owner who wouldn't let go — is the exact part this removes. That's not a feature you bolt on. That's the bottleneck of the entire industry, flipped into the accelerant. That's why it compounds, and that's why, once it's turning, it's very hard for anyone running the old linear playbook to catch you.
          </Editable>
        </div>

        <div className="mt-10 flex justify-center">
          <CtaButton
            title={getText("home.flywheel.cta.title", "Book the Call")}
            subtitle={getText(
              "home.flywheel.cta.subtitle",
              "See how the playbook changes when the tech is yours."
            )}
          />
        </div>
      </div>
    </section>
  );
}
