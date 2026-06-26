"use client";
import CtaButton from "./CtaButton";
import Editable from "./edit/Editable";
import { useEditText } from "./edit/editContext";

// HOME §1 — the router + the spine. The constant across forty years wasn't an industry, it was
// the ROLE: Steven was the technology architect in every business he ran. The fifth business is
// that role productized — he installs the technology (an AI workforce) for other operators now.
// Category flag = the AI Employee Operating System. Sizzle-reel video placeholder; never opens with "AI".
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
          Four businesses. Forty years. I was the technology in every one.
        </Editable>
        <Editable
          tid="home.hero.sub"
          as="p"
          className="mx-auto mt-5 max-w-3xl text-lg leading-relaxed text-white/85 md:text-xl"
        >
          Restaurant, mortgage, roofing, trucking — four businesses I ran, and in every one I was
          the architect who built the systems that made it work, because we were too small to
          afford anyone else. That became my fifth business: I do it for other operators now. I
          walk in and install the technology itself — a workforce of AI employees — into a business
          like the ones I built. The trade has a name: the AI Employee Operating System.
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
          It works in any owner-run business — the trades, clinics, services — anywhere the same
          playbook runs.
        </Editable>

        <div className="mt-8 flex justify-center">
          <CtaButton
            title={getText("home.hero.cta.title", "Apply to work with me")}
            subtitle={getText("home.hero.cta.subtitle", "One operator to another.")}
          />
        </div>
      </div>
    </section>
  );
}
