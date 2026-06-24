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
          From One Solo Entrepreneur to Another
        </Editable>
        <Editable
          tid="home.hero.h1"
          as="h1"
          className="mt-4 text-3xl font-bold leading-tight tracking-tight text-[color:var(--color-sjc-ink)] md:text-5xl"
        >
          You were bold enough to start your own business — and you’ve carried the whole thing on your back ever since.
        </Editable>
        <Editable
          tid="home.hero.lede"
          as="p"
          className="mx-auto mt-5 max-w-2xl text-xl font-semibold text-[color:var(--color-sjc-blue)] md:text-2xl"
        >
          You’ve tried to hire help, more than once, in every corner of the business. It never sticks — you end up with a handful of average people and all the real work still on you. And it’s quietly worn you down.
        </Editable>
        <Editable
          tid="home.hero.sub"
          as="p"
          className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-[color:var(--color-sjc-mute)] md:text-lg"
        >
          The game just changed. As your growth partner, the first thing I install is your first AI employee — a salesperson better than any you could hire, aimed straight at your growth. We start there.
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
                What it looks like when the employee you could never find or keep finally goes to work on top of the business you already run.
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
              "See exactly what we'd install — and what you'd control."
            )}
          />
        </div>
      </div>
    </section>
  );
}
