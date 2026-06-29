"use client";

import { useState } from "react";

const LOGO_URL =
  "https://imagedelivery.net/xaKlCos5cTg_1RWzIu_h-A/1afcb97f-5140-41e4-eef9-75003ad28b00/public";

export type NavLink = { label: string; target: string; fontSize?: number; color?: string };
export type NavViewProps = {
  brandName?: string;
  tagline?: string;
  taglineColor?: string;
  taglineSize?: number;
  links?: NavLink[];
  ctaLabel?: string;
  ctaHref?: string;
};

// The actual site nav, rendered from props. Used BOTH on the live site (via Nav.tsx, which
// reads the published "nav" block) AND in the builder preview (via the SiteHeader Puck block),
// so what Steven edits at /edit/nav is exactly what ships. Desktop = 3-col grid (brand left,
// tagline centered, links+button right, no overlap); narrow screens collapse to a hamburger.
export default function NavView({
  brandName = "Steven James Consulting",
  tagline = "Your Native AI Implementation Partner",
  taglineColor = "#22c55e",
  taglineSize = 18,
  links = [],
  ctaLabel = "See How It Works",
  ctaHref = "/#at-work",
}: NavViewProps) {
  const [open, setOpen] = useState(false);
  const linkEls = (links || []).filter((l) => l && l.label);

  const Brand = (
    <a href="/" className="flex items-center gap-3" onClick={() => setOpen(false)}>
      <img src={LOGO_URL} alt="logo" className="h-9 w-9 rounded-full" />
      <span className="text-base font-semibold tracking-tight">{brandName}</span>
    </a>
  );

  const Tagline = tagline ? (
    <span
      className="whitespace-nowrap font-semibold tracking-tight"
      style={{ color: taglineColor || "#22c55e", fontSize: `${taglineSize || 18}px` }}
    >
      {tagline}
    </span>
  ) : null;

  return (
    <header className="sticky top-0 z-20 w-full" style={{ backgroundColor: "#1e3a6e" }}>
      {/* Desktop: brand left · tagline centered · links + button right */}
      <div className="mx-auto hidden max-w-6xl grid-cols-3 items-center px-6 py-3 text-white lg:grid">
        <div className="justify-self-start">{Brand}</div>
        <div className="justify-self-center text-center">{Tagline}</div>
        <div className="flex items-center gap-5 justify-self-end">
          {linkEls.map((l, i) => (
            <a
              key={i}
              href={l.target || "#"}
              className="font-medium opacity-90 transition hover:opacity-100"
              style={{ fontSize: `${l.fontSize || 14}px`, color: l.color || "#ffffff" }}
            >
              {l.label}
            </a>
          ))}
          {ctaLabel ? (
            <a
              href={ctaHref || "#"}
              className="rounded-lg bg-[color:var(--color-sjc-blue)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[color:var(--color-sjc-green)]"
            >
              {ctaLabel} &rarr;
            </a>
          ) : null}
        </div>
      </div>

      {/* Mobile: brand + hamburger */}
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3 text-white lg:hidden">
        {Brand}
        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((prev) => !prev)}
          className="flex h-10 w-10 items-center justify-center rounded-md text-white hover:bg-white/10"
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

      {/* Mobile dropdown — tagline + links + button, all readable */}
      {open && (
        <div className="border-t border-white/10 lg:hidden" style={{ backgroundColor: "#1e3a6e" }}>
          <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-6 pb-6 pt-3">
            {Tagline}
            {linkEls.map((l, i) => (
              <a
                key={i}
                href={l.target || "#"}
                onClick={() => setOpen(false)}
                className="font-medium text-white"
                style={{ fontSize: `${l.fontSize || 16}px`, color: l.color || "#ffffff" }}
              >
                {l.label}
              </a>
            ))}
            {ctaLabel ? (
              <a
                href={ctaHref || "#"}
                onClick={() => setOpen(false)}
                className="w-full rounded-lg bg-[color:var(--color-sjc-blue)] px-4 py-3 text-center text-base font-semibold text-white shadow-sm"
              >
                {ctaLabel} &rarr;
              </a>
            ) : null}
          </div>
        </div>
      )}
    </header>
  );
}
