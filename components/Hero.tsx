"use client";
import CtaButton from "./CtaButton";
import Editable from "./edit/Editable";
import { useEditText } from "./edit/editContext";

export default function Hero() {
  const { getText } = useEditText();

  return (
    <section style={{ backgroundColor: "#f3f4f6" }} className="w-full">
      <div className="mx-auto max-w-4xl px-6 pt-6 pb-16 md:pt-10 md:pb-24">
        <Editable
          tid="home.hero.eyebrow"
          as="p"
          className="text-sm font-bold uppercase tracking-[0.18em] text-[color:var(--color-sjc-blue)]"
        >
          If you're rolling up an industry
        </Editable>
        <Editable
          tid="home.hero.h1"
          as="h1"
          className="mt-4 text-3xl font-bold leading-tight tracking-tight text-[color:var(--color-sjc-ink)] md:text-5xl"
        >
          You buy good businesses, streamline them, and sell the platform for a bigger multiple. That's the playbook — and it's leaving money on the table.
        </Editable>
        <Editable
          tid="home.hero.lede"
          as="p"
          className="mx-auto mt-5 max-w-3xl text-lg leading-relaxed text-[color:var(--color-sjc-ink)] md:text-xl"
        >
          Everyone in the roll-up game runs the same play. Stitch together five to seven decent operators, squeeze the back office, run them on the same linear tools the last guy used, and exit the platform to private equity. It works. It has worked for thirty years. But because everybody runs the same play, the multiple has a ceiling. Earnings grind up a few points a year. The exit is whatever the category trades at on the day you sell. You did the hard part — sourcing, closing, integrating — and the market hands you back the same number it would hand anyone.
        </Editable>
        <Editable
          tid="home.hero.sub"
          as="p"
          className="mx-auto mt-5 max-w-3xl text-lg leading-relaxed text-[color:var(--color-sjc-ink)] md:text-xl"
        >
          I turn that playbook on its head. I add earnings at every location and re-rate the whole platform into a technology company — a higher multiple on top of bigger earnings, not one or the other. I can do it because I've spent forty years running the kind of businesses you buy, and I build the technology myself. Not a vendor I resell. Not a deck I bought. I build it. That's the partner you've been looking for on the tech side of the table and couldn't find, because the operator who's lived it and the technologist who can build it are almost never the same person.
        </Editable>

        <div className="mt-10 flex justify-center">
          <CtaButton
            title={getText("home.hero.cta.title", "Book the Call")}
            subtitle={getText(
              "home.hero.cta.subtitle",
              "See how the playbook changes when the tech is yours."
            )}
          />
        </div>
      </div>
    </section>
  );
}
