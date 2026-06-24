"use client";
import Editable from "./edit/Editable";

const CONTROL_DEFAULTS = [
  {
    title: "It stays your shop",
    body: "Your accounts, your data, your customer list — all stay in your name. Nothing moves into a black box you can't see into.",
  },
  {
    title: "I do the work",
    body: "I build it, run it, and keep it working — you don't lift a finger. On your end it's one button: you turn it on and it goes to work. You never have to touch the tech.",
  },
  {
    title: "The relief, not the boss",
    body: "I don't take over your business — I take the work off your plate. You're still the boss; you just stop running the parts that eat your day.",
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
You Stay The Boss
        </Editable>
        <Editable
          tid="home.control.h2"
          as="h2"
          className="mt-3 text-3xl font-bold leading-tight tracking-tight text-[color:var(--color-sjc-ink)] md:text-4xl"
        >
          You get the AI working for you. You never hand over your business.
        </Editable>

        <div className="mt-8 space-y-6 text-lg leading-relaxed text-[color:var(--color-sjc-ink)]">
          <Editable tid="home.control.p1" as="p">
            You do one thing: turn it on. I build it, install it, and run it on top of the business you already run — you don&apos;t build it, manage it, or babysit it. Your hand stays on every lead and every dollar, and you stay the boss.
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
            You do nothing but pay and use it. You stay the boss of every lead and every dollar.
          </Editable>
        </div>
      </div>
    </section>
  );
}
