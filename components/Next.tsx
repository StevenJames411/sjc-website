"use client";
import CtaButton from "./CtaButton";
import Editable from "./edit/Editable";
import { useEditText } from "./edit/editContext";

// HOME §10 — the close. Journey voice: speaks to the operator at any stage, not just the M&A
// reader. One operator to another.
export default function Next() {
  const { getText } = useEditText();

  return (
    <section style={{ backgroundColor: "#f3f4f6" }} className="w-full">
      <div className="mx-auto max-w-3xl px-6 py-20 text-center md:py-24">
        <Editable
          tid="home.next.eyebrow"
          as="p"
          className="text-sm font-bold uppercase tracking-[0.18em] text-[color:var(--color-sjc-blue)]"
        >
          The next move
        </Editable>
        <Editable
          tid="home.next.h2"
          as="h2"
          className="mt-3 text-3xl font-bold leading-tight tracking-tight text-[color:var(--color-sjc-ink)] md:text-5xl"
        >
          The next move
        </Editable>

        <div className="mx-auto mt-8 max-w-2xl space-y-6 text-left text-lg leading-relaxed text-[color:var(--color-sjc-ink)]">
          <Editable tid="home.next.p1" as="p">
            Wherever you are on the journey, you already know the playbook has a lid. Same play as
            everyone, same linear tools, the same leads slipping through. What&apos;s new is the
            lever that lifts it: an AI employee that plugs the leaks — answers every lead, follows
            up, books — so the org-chart seats you could never afford to fill finally fill themselves.
          </Editable>
          <Editable tid="home.next.p2" as="p">
            I&apos;m not going to sell you on a call. Either it moves your numbers or it
            doesn&apos;t, and you&apos;ll know inside the first ten minutes. So let&apos;s talk one
            operator to another: tell me how you run today, and I&apos;ll show you exactly where it
            plugs in — starting with the leads you&apos;re already paying for.
          </Editable>
        </div>

        <div className="mt-10 flex justify-center">
          <CtaButton
            title={getText("home.next.cta.title", "Apply to work with me")}
            subtitle={getText("home.next.cta.subtitle", "One operator to another.")}
          />
        </div>
      </div>
    </section>
  );
}
