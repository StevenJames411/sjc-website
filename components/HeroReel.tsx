"use client";
import CtaButton from "./CtaButton";
import Editable from "./edit/Editable";
import { useEditText } from "./edit/editContext";

// HOME §1 — the router. A sizzle-reel video (placeholder for now) of real operators who've
// done the deal across fields, framed as the journey: solo entrepreneur → exit. Names the
// fields out loud so a visitor hears their own world, then the IndustriesStrip below hands
// them the one click. Hero never opens with "AI".
export default function HeroReel() {
  const { getText } = useEditText();

  return (
    <section style={{ backgroundColor: "#0f1f3d" }} className="w-full text-white">
      <div className="mx-auto max-w-5xl px-6 pt-10 pb-16 text-center md:pt-14 md:pb-20">
        <Editable
          tid="home.hero.eyebrow"
          as="p"
          className="text-sm font-bold uppercase tracking-[0.18em] text-[color:var(--color-sjc-green)]"
        >
          From solo entrepreneur to exit
        </Editable>
        <Editable
          tid="home.hero.h1"
          as="h1"
          className="mt-4 text-3xl font-bold leading-tight tracking-tight md:text-5xl"
        >
          Five businesses. Forty years. One playbook.
        </Editable>
        <Editable
          tid="home.hero.sub"
          as="p"
          className="mx-auto mt-5 max-w-3xl text-lg leading-relaxed text-white/85 md:text-xl"
        >
          Restaurant, mortgage, roofing, trucking, now AI — five different industries, the same
          playbook underneath every one. It&apos;s the exact playbook a mergers-and-acquisitions
          operator maximizes. I lived it from the inside five times, and now I bring AI to it.
        </Editable>

        {/* Sizzle-reel placeholder — replace with the 2-minute teaser cut from podcast/board interviews */}
        <div className="mx-auto mt-9 aspect-video max-w-3xl overflow-hidden rounded-2xl border border-white/15 bg-black/40">
          <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-white/70">
            <span className="flex h-16 w-16 items-center justify-center rounded-full border border-white/40 text-2xl">
              &#9654;
            </span>
            <span className="text-sm uppercase tracking-[0.18em]">2-minute teaser — coming</span>
          </div>
        </div>

        <Editable
          tid="home.hero.fields"
          as="p"
          className="mx-auto mt-7 max-w-2xl text-base text-white/70"
        >
          Whether you run a med spa, a roofing company, an HVAC shop, or a garage-door business —
          find your field below.
        </Editable>

        <div className="mt-8 flex justify-center">
          <CtaButton
            title={getText("home.hero.cta.title", "Book the Call")}
            subtitle={getText("home.hero.cta.subtitle", "One operator to another.")}
          />
        </div>
      </div>
    </section>
  );
}
