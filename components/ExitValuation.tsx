"use client";
import CtaButton from "./CtaButton";
import Editable from "./edit/Editable";
import { useEditText } from "./edit/editContext";

export default function ExitValuation() {
  const { getText } = useEditText();

  return (
    <section style={{ backgroundColor: "#f3f4f6" }} className="w-full">
      <div className="mx-auto max-w-4xl px-6 py-20 md:py-24">
        <Editable
          tid="home.why.eyebrow"
          as="p"
          className="text-sm font-bold uppercase tracking-wide text-[color:var(--color-sjc-blue)]"
        >
          Why Me
        </Editable>
        <Editable
          tid="home.why.h2"
          as="h2"
          className="mt-3 text-3xl font-bold leading-tight tracking-tight text-[color:var(--color-sjc-ink)] md:text-4xl"
        >
          I&apos;m the right person to build this for you — because I walked your road first.
        </Editable>

        <div className="mt-8 space-y-6 text-lg leading-relaxed text-[color:var(--color-sjc-ink)]">
          {/* p1 has inline <em> — split into spans around it to preserve italic rendering */}
          <p>
            <Editable tid="home.why.p1a" as="span">
              I&apos;ve run my own businesses since 1986 — a restaurant, a mortgage company, a roofing contractor, a trucking company I ran for twenty years, and now this. In every single one, I was the owner
            </Editable>{" "}
            <em>and</em>{" "}
            <Editable tid="home.why.p1b" as="span">
              the tech guy who wired up the systems and kept them running. Same five businesses&apos; worth of hats you wear. Same people who let me down when I tried to hand one off. I&apos;ve been exactly where you are for four decades.
            </Editable>
          </p>
          <Editable tid="home.why.p2" as="p">
            So when the tools finally caught up to what I always needed, I didn&apos;t hand it off to a vendor. I built it for myself first — by hand.
          </Editable>
          <Editable tid="home.why.p2b" as="p">
            That&apos;s the difference. Most of the people selling AI right now will hand you a gadget — a chatbot, another piece of software — and walk away. It treats one symptom and never touches why you&apos;re still doing everything yourself. I build the real thing, by hand, right into the system you already run: an employee that goes out and does the job. I don&apos;t stop at the surface, because I lived the part underneath it.
          </Editable>
          <Editable
            tid="home.why.p3"
            as="p"
            className="text-xl font-bold text-[color:var(--color-sjc-ink)] md:text-2xl"
          >
            Steven James Consulting runs on this exact system today.
          </Editable>
          <Editable tid="home.why.p4" as="p">
            I&apos;m not selling you a theory I read in a book. I run my own company on the same AI employees I install for you. The first client I built this for is already answering leads in seconds and booking appointments around the clock — on top of the business they already ran, with their hand still on every dollar.
          </Editable>
        </div>

        <div className="mt-10 flex justify-center">
          <CtaButton
            title={getText("home.why.cta.title", "Book the Call")}
            subtitle={getText(
              "home.why.cta.subtitle",
              "See the system that runs my own company — and what it'd look like on yours."
            )}
          />
        </div>
      </div>
    </section>
  );
}
