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
          The Moat
        </Editable>
        <Editable
          tid="home.why.h2"
          as="h2"
          className="mt-3 text-3xl font-bold leading-tight tracking-tight text-[color:var(--color-sjc-ink)] md:text-4xl"
        >
          The whole edge is the overlap. A 40-year operator who also builds the AI by hand. Almost nobody is both.
        </Editable>

        <div className="mt-8 space-y-6 text-lg leading-relaxed text-[color:var(--color-sjc-ink)]">
          {/* p1 has inline connector — split into spans to preserve flow */}
          <p>
            <Editable tid="home.why.p1a" as="span">
              I&apos;ve run my own businesses since 1986 — a restaurant, a mortgage company, a roofing contractor, a trucking company for twenty years, and now this. In every one I was the operator
            </Editable>{" "}
            <Editable tid="home.why.p1b" as="span">
              the one who wired up the systems and kept them running. Forty years of carrying real P&amp;Ls, building the operating layer myself, and knowing where the value actually hides in a business.
            </Editable>
          </p>
          <Editable tid="home.why.p2" as="p">
            When the AI tools finally arrived, I didn&apos;t hire it out. I&apos;m AI-native and I build the employees by hand. So I sit on both sides of a line most people only stand on one side of.
          </Editable>
          <Editable tid="home.why.p2b" as="p">
            That&apos;s the overlap that can&apos;t be faked. A 22-year-old AI founder can&apos;t manufacture forty years of running companies and reading where enterprise value comes from. A 40-year operator can&apos;t suddenly become AI-native and build the thing by hand. I&apos;m the rare seat where both are true — which is exactly the partner a roll-up wants on the AI side of the table.
          </Editable>
          <Editable
            tid="home.why.p3"
            as="p"
            className="text-xl font-bold text-[color:var(--color-sjc-ink)] md:text-2xl"
          >
            My own company runs on this exact system today.
          </Editable>
          <Editable tid="home.why.p4" as="p">
            This isn&apos;t a thesis I read. I run Steven James Consulting on the same AI employees I install, and my first install is already answering leads in seconds and booking around the clock in a live business. I&apos;ve proven it on my own books before bringing it to yours.
          </Editable>
        </div>

        <div className="mt-10 flex justify-center">
          <CtaButton
            title={getText("home.why.cta.title", "Book the Call")}
            subtitle={getText(
              "home.why.cta.subtitle",
              "See the working model — and how the partnership is structured."
            )}
          />
        </div>
      </div>
    </section>
  );
}
