"use client";
import Editable from "./edit/Editable";

const CONTROL_DEFAULTS = [
  {
    title: "You own the instance",
    body: "The AI workforce running inside your company is yours — your data, your accounts, your asset on the balance sheet. That's what re-rates the platform. It has to be owned by the company, not rented from me, or the second flywheel never turns.",
  },
  {
    title: "I keep the engine",
    body: "You own the instance running your business. I keep the engine that builds and improves it — the part that lets me install the next vertical, and the one after that. You get a defensible owned asset; I keep the thing that makes me worth partnering with again.",
  },
  {
    title: "Aligned on the exit",
    body: "I'm not buying control of your platform and I'm not a line item on your P&L. I'm a partner whose payday is your payday — a bigger multiple on bigger earnings when you sell.",
  },
];

export default function TwoTierModel() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-5xl px-6 py-20 md:py-24">
        <Editable
          tid="home.control.eyebrow"
          as="p"
          className="text-sm font-bold uppercase tracking-wide text-[color:var(--color-sjc-blue)]"
        >
          The Partnership
        </Editable>
        <Editable
          tid="home.control.h2"
          as="h2"
          className="mt-3 text-3xl font-bold leading-tight tracking-tight text-[color:var(--color-sjc-ink)] md:text-4xl"
        >
          I don&apos;t come in as a vendor. I come in as a partner, on equity — because I only win when the exit is bigger.
        </Editable>

        <div className="mt-8 space-y-6 text-lg leading-relaxed text-[color:var(--color-sjc-ink)]">
          <Editable tid="home.control.p1" as="p">
            A vendor sends an invoice and leaves. That&apos;s not this. I install the AI employees across the portfolio, run the layer, and keep improving it — and I take part of my upside in equity, so my outcome is tied to yours. I make money when the company is worth more, not before. That&apos;s the only arrangement that makes sense for the value being created.
          </Editable>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {CONTROL_DEFAULTS.map((c, i) => (
            <div
              key={i}
              className="rounded-2xl border border-gray-200 bg-white p-7 shadow-sm"
            >
              <Editable
                tid={`home.control.card${i}.title`}
                as="h3"
                className="text-lg font-bold leading-snug text-[color:var(--color-sjc-blue)]"
              >
                {c.title}
              </Editable>
              <Editable
                tid={`home.control.card${i}.body`}
                as="p"
                className="mt-3 text-base leading-relaxed text-[color:var(--color-sjc-ink)]"
              >
                {c.body}
              </Editable>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-2xl border border-[color:var(--color-sjc-blue)] bg-[color:var(--color-sjc-blue)] px-8 py-8 text-center text-white md:px-10">
          <Editable
            tid="home.control.bluebar"
            as="p"
            className="text-xl font-bold leading-snug md:text-2xl"
          >
            You own the asset. I&apos;m on equity. We both get paid when the company is worth more.
          </Editable>
        </div>
      </div>
    </section>
  );
}
