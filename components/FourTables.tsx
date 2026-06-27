"use client";
import Editable from "./edit/Editable";
import { PILLARS, pillarHref } from "@/lib/pillars";

// HOME §7 — "It all goes together." The four tables Steven is assembling: operators (podcast),
// the top-tier leaders (board), the build (tech), the money (raising capital). Reads the central
// PILLARS list. The hero is the taste; these are the meal.
export default function FourTables() {
  // PARKED with the PILLARS (boutique trim): no tables → render nothing, so the homepage
  // doesn't show an empty heading shell. Restores automatically when PILLARS is repopulated.
  if (!PILLARS.length) return null;
  return (
    <section style={{ backgroundColor: "#f3f4f6" }} className="w-full">
      <div className="mx-auto max-w-5xl px-6 py-20 md:py-24">
        <Editable
          tid="home.tables.eyebrow"
          as="p"
          className="text-center text-sm font-bold uppercase tracking-[0.18em] text-[color:var(--color-sjc-blue)]"
        >
          It all goes together
        </Editable>
        <Editable
          tid="home.tables.h2"
          as="h2"
          className="mt-3 text-center text-3xl font-bold leading-tight tracking-tight text-[color:var(--color-sjc-ink)] md:text-4xl"
        >
          The room I&apos;m setting — in public.
        </Editable>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PILLARS.map((p) => (
            <a
              key={p.slug}
              href={pillarHref(p)}
              className="group rounded-xl border border-black/10 bg-white p-5 transition hover:border-[color:var(--color-sjc-blue)] hover:shadow-sm"
            >
              <span className="text-lg font-semibold text-[color:var(--color-sjc-ink)]">
                {p.name}
              </span>
              <p className="mt-2 text-sm leading-relaxed text-[color:var(--color-sjc-mute)]">
                {p.blurb}
              </p>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
