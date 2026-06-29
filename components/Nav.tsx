"use client";

import { useState } from "react";

const LOGO_URL =
  "https://imagedelivery.net/xaKlCos5cTg_1RWzIu_h-A/1afcb97f-5140-41e4-eef9-75003ad28b00/public";

// Nav (Steven's call): business NAME (links home) on the left, the green positioning tagline
// centered, and ONE "See How It Works" button on the right (scrolls to #at-work). On narrow
// screens the tagline + button collapse into a hamburger so both stay readable on a phone.
const HOW_IT_WORKS_HREF = "/#at-work";
const TAGLINE = "Your Native AI Implementation Partner";
const GREEN = "#22c55e";

export default function Nav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-20 w-full" style={{ backgroundColor: "#1e3a6e" }}>
      <div className="relative mx-auto flex max-w-6xl items-center justify-between px-6 py-3 text-white">
        <a href="/" className="flex items-center gap-3" onClick={() => setOpen(false)}>
          <img src={LOGO_URL} alt="SJC logo" className="h-9 w-9 rounded-full" />
          <span className="text-base font-semibold tracking-tight">Steven James Consulting</span>
        </a>

        {/* Who we are — centered in the empty nav real estate (desktop only). */}
        <span
          className="absolute left-1/2 hidden -translate-x-1/2 whitespace-nowrap text-lg font-semibold tracking-tight lg:block"
          style={{ color: GREEN }}
        >
          {TAGLINE}
        </span>

        {/* Desktop CTA */}
        <a
          href={HOW_IT_WORKS_HREF}
          className="hidden rounded-lg bg-[color:var(--color-sjc-blue)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[color:var(--color-sjc-green)] lg:inline-block"
        >
          See How It Works &rarr;
        </a>

        {/* Mobile hamburger */}
        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((prev) => !prev)}
          className="flex h-10 w-10 items-center justify-center rounded-md text-white hover:bg-white/10 lg:hidden"
        >
          {open ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
              <path d="M6 6l12 12M6 18L18 6" strokeLinecap="round" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
              <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile dropdown — tagline + CTA, both readable */}
      {open && (
        <div className="border-t border-white/10 lg:hidden" style={{ backgroundColor: "#1e3a6e" }}>
          <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-6 pb-6 pt-3">
            <span className="text-center text-lg font-semibold tracking-tight" style={{ color: GREEN }}>
              {TAGLINE}
            </span>
            <a
              href={HOW_IT_WORKS_HREF}
              onClick={() => setOpen(false)}
              className="w-full rounded-lg bg-[color:var(--color-sjc-blue)] px-4 py-3 text-center text-base font-semibold text-white shadow-sm"
            >
              See How It Works &rarr;
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
