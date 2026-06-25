"use client";
import Editable from "./edit/Editable";
import { INDUSTRIES, industryHref } from "@/lib/industries";

// HOME §2 — "Find your field." Sits directly under the hero so the drill-down is one obvious
// click, no nav-decoding. Reads the central INDUSTRIES list, so it grows as fields are added.
// Reused on the /industries hub.
export default function IndustriesStrip() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-5xl px-6 py-16 md:py-20">
        <Editable
          tid="home.fields.eyebrow"
          as="p"
          className="text-center text-sm font-bold uppercase tracking-[0.18em] text-[color:var(--color-sjc-blue)]"
        >
          Find your field
        </Editable>
        <Editable
          tid="home.fields.h2"
          as="h2"
          className="mt-3 text-center text-3xl font-bold leading-tight tracking-tight text-[color:var(--color-sjc-ink)] md:text-4xl"
        >
          Which one is yours?
        </Editable>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {INDUSTRIES.map((i) => (
            <a
              key={i.slug}
              href={industryHref(i)}
              className="group rounded-xl border border-black/10 bg-[#f3f4f6] p-5 transition hover:border-[color:var(--color-sjc-blue)] hover:shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold text-[color:var(--color-sjc-ink)]">
                  {i.name}
                </span>
                {i.status === "live" && (
                  <span className="rounded-full bg-[color:var(--color-sjc-green)] px-2 py-0.5 text-xs font-semibold text-white">
                    Live
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm leading-relaxed text-[color:var(--color-sjc-mute)]">
                {i.blurb}
              </p>
            </a>
          ))}
          <a
            href="/industries"
            className="group flex flex-col justify-center rounded-xl border border-dashed border-black/20 bg-white p-5 transition hover:border-[color:var(--color-sjc-blue)]"
          >
            <span className="text-lg font-semibold text-[color:var(--color-sjc-blue)]">
              More fields &rarr;
            </span>
            <p className="mt-2 text-sm leading-relaxed text-[color:var(--color-sjc-mute)]">
              The list keeps growing. Don&apos;t see yours yet? It&apos;s next.
            </p>
          </a>
        </div>
      </div>
    </section>
  );
}
