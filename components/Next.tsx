"use client";
import CtaButton from "./CtaButton";
import Editable from "./edit/Editable";
import { useEditText } from "./edit/editContext";

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
          The Next Move
        </Editable>
        <Editable
          tid="home.next.h2"
          as="h2"
          className="mt-3 text-3xl font-bold leading-tight tracking-tight text-[color:var(--color-sjc-ink)] md:text-5xl"
        >
          The Next Move
        </Editable>

        <div className="mx-auto mt-8 max-w-2xl space-y-6 text-left text-lg leading-relaxed text-[color:var(--color-sjc-ink)]">
          <Editable tid="home.next.p1" as="p">
            If you're rolling up an industry, you already know the playbook has a ceiling. You're running the same play as everyone in your space, on the same linear tools, exiting at the same category multiple, fighting the same owners for the same buy-in. None of that is news to you. What might be news is that there's a way to add earnings at every location, re-rate the whole platform into a technology company, and turn your hardest adversary — the owner who won't let go — into the reason your deals close faster.
          </Editable>
          <Editable tid="home.next.p2" as="p">
            I'm not going to sell you on a call. Either the math moves your model or it doesn't, and you'll know inside the first ten minutes whether it does. So let's talk principal to principal: bring a live deal or a platform you're already running, and I'll walk you through exactly where the earnings show up, where the re-rate comes from, and how the owners come aboard. One operator to another.
          </Editable>
        </div>

        <div className="mt-10 flex justify-center">
          <CtaButton
            title={getText("home.next.cta.title", "Book the Call")}
            subtitle={getText(
              "home.next.cta.subtitle",
              "See how the playbook changes when the tech is yours."
            )}
          />
        </div>
      </div>
    </section>
  );
}
