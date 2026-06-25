"use client";
import CtaButton from "./CtaButton";
import Editable from "./edit/Editable";
import { useEditText } from "./edit/editContext";

export default function Hero() {
  const { getText } = useEditText();

  return (
    <section style={{ backgroundColor: "#f3f4f6" }} className="w-full">
      <div className="mx-auto max-w-4xl px-6 pt-6 pb-16 text-center md:pt-10 md:pb-24">
        <Editable
          tid="home.hero.eyebrow"
          as="p"
          className="text-sm font-bold uppercase tracking-[0.18em] text-[color:var(--color-sjc-blue)]"
        >
          The AI Implementation Company
        </Editable>
        <Editable
          tid="home.hero.h1"
          as="h1"
          className="mt-4 text-3xl font-bold leading-tight tracking-tight text-[color:var(--color-sjc-ink)] md:text-5xl"
        >
          AI doesn’t just help a business run. It changes what the business is worth.
        </Editable>
        <Editable
          tid="home.hero.lede"
          as="p"
          className="mx-auto mt-5 max-w-2xl text-xl font-semibold text-[color:var(--color-sjc-blue)] md:text-2xl"
        >
          When I install AI employees into a company, two things happen: every location does more with less — and the company itself re-rates from a service business into a tech company. One lifts the earnings. The other lifts the multiple.
        </Editable>
        <Editable
          tid="home.hero.sub"
          as="p"
          className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-[color:var(--color-sjc-mute)] md:text-lg"
        >
          I've run five businesses across forty years and I build the AI by hand. My own company runs on it. So does my first install — answering leads in seconds, booking around the clock. That's the working model. This page is where you watch it.
        </Editable>

        <div className="mt-10 overflow-hidden rounded-2xl shadow-lg">
          <div className="relative aspect-video w-full bg-gradient-to-br from-[#1e3a6e] to-[#0f1f3d]">
            <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center text-white">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/15 ring-2 ring-white/30 backdrop-blur-sm">
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                  className="ml-1 h-9 w-9 text-white"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
              <Editable
                tid="home.hero.watch"
                as="p"
                className="mt-5 text-sm font-semibold uppercase tracking-[0.2em] text-white/90 md:text-base"
              >
                Watch: 3 Minutes
              </Editable>
              <Editable
                tid="home.hero.watchSub"
                as="p"
                className="mt-2 max-w-md text-xs text-white/70 md:text-sm"
              >
                What the working model looks like running on top of a business that's already operating.
              </Editable>
            </div>
            <div className="absolute right-4 top-4 rounded-full bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white/80 backdrop-blur-sm">
              Placeholder
            </div>
          </div>
        </div>

        <div className="mt-10 flex justify-center">
          <CtaButton
            title={getText("home.hero.cta.title", "Book the Call")}
            subtitle={getText(
              "home.hero.cta.subtitle",
              "See the working model, and how the partnership works."
            )}
          />
        </div>
      </div>
    </section>
  );
}
