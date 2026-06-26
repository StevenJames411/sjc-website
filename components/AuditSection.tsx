"use client";
import CtaButton from "./CtaButton";
import Editable from "./edit/Editable";
import { useEditText } from "./edit/editContext";

export default function AuditSection() {
  const { getText } = useEditText();

  return (
    <section style={{ backgroundColor: "#f3f4f6" }} className="w-full">
      <div className="mx-auto max-w-3xl px-6 py-20 text-center md:py-24">
        <Editable
          tid="home.next.eyebrow"
          as="p"
          className="text-sm font-bold uppercase tracking-wide text-[color:var(--color-sjc-blue)]"
        >
          The Next Move
        </Editable>
        <Editable
          tid="home.next.h2"
          as="h2"
          className="mt-3 text-3xl font-bold leading-tight tracking-tight text-[color:var(--color-sjc-ink)] md:text-5xl"
        >
          The working model is live. The thesis is on the table. The next step is a conversation between principals.
        </Editable>

        <div className="mx-auto mt-8 max-w-2xl space-y-5 text-lg leading-relaxed text-[color:var(--color-sjc-ink)] md:text-xl">
          <Editable tid="home.next.p1" as="p">
            Get on a call. Tell me about the platform you&apos;re building, and I&apos;ll show you the working model and exactly how the partnership would be structured against it — earnings and multiple, both flywheels.
          </Editable>
          <Editable tid="home.next.p2" as="p" className="font-semibold">
            I install the layer. You own the asset. We&apos;re aligned on the exit.
          </Editable>
        </div>

        <div className="mt-10 flex justify-center">
          <CtaButton
            title={getText("home.next.cta.title", "Book the Call")}
            subtitle={getText(
              "home.next.cta.subtitle",
              "See the working model, and how the partnership works."
            )}
          />
        </div>
      </div>
    </section>
  );
}
