"use client";
import Editable from "./edit/Editable";

// HOME §5 — "Where it leads." The M&A play at altitude: more earnings per location + re-rate
// the platform + the owners finally say yes. Condensed; the full mechanics live on the field
// pages. (Placeholder/skeleton copy — content pass fills this.)
export default function WhereItLeads() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-4xl px-6 py-20 md:py-24">
        <Editable
          tid="home.leads.eyebrow"
          as="p"
          className="text-sm font-bold uppercase tracking-[0.18em] text-[color:var(--color-sjc-blue)]"
        >
          Where it leads
        </Editable>
        <Editable
          tid="home.leads.h2"
          as="h2"
          className="mt-3 text-3xl font-bold leading-tight tracking-tight text-[color:var(--color-sjc-ink)] md:text-4xl"
        >
          The same playbook, maximized — all the way to an exit.
        </Editable>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          <div className="rounded-xl border border-black/10 bg-[#f3f4f6] p-6">
            <Editable tid="home.leads.c1.h" as="h3" className="text-lg font-semibold text-[color:var(--color-sjc-ink)]">
              More earnings
            </Editable>
            <Editable tid="home.leads.c1.p" as="p" className="mt-2 text-base leading-relaxed text-[color:var(--color-sjc-mute)]">
              Plug the leaks every location bleeds — the lead that lands when nobody&apos;s there.
            </Editable>
          </div>
          <div className="rounded-xl border border-black/10 bg-[#f3f4f6] p-6">
            <Editable tid="home.leads.c2.h" as="h3" className="text-lg font-semibold text-[color:var(--color-sjc-ink)]">
              Re-rate the platform
            </Editable>
            <Editable tid="home.leads.c2.p" as="p" className="mt-2 text-base leading-relaxed text-[color:var(--color-sjc-mute)]">
              Own the AI layer and you stop being priced like a services roll-up.
            </Editable>
          </div>
          <div className="rounded-xl border border-black/10 bg-[#f3f4f6] p-6">
            <Editable tid="home.leads.c3.h" as="h3" className="text-lg font-semibold text-[color:var(--color-sjc-ink)]">
              The owners say yes
            </Editable>
            <Editable tid="home.leads.c3.p" as="p" className="mt-2 text-base leading-relaxed text-[color:var(--color-sjc-mute)]">
              Control-preserving AI turns your hardest adversary into your accelerant.
            </Editable>
          </div>
        </div>
      </div>
    </section>
  );
}
