"use client";

import { useState } from "react";
import { BOOKING_URL } from "./CtaButton";

const LOGO_URL =
  "https://imagedelivery.net/xaKlCos5cTg_1RWzIu_h-A/1afcb97f-5140-41e4-eef9-75003ad28b00/public";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/case-study", label: "Case Study" },
  { href: "/faqs", label: "FAQs" },
];

export default function Nav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-20 w-full" style={{ backgroundColor: "#1e3a6e" }}>
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3 text-white">
        <a href="/" className="flex items-center gap-3" onClick={() => setOpen(false)}>
          <img src={LOGO_URL} alt="SJC logo" className="h-9 w-9 rounded-full" />
          <span className="text-base font-semibold tracking-tight">Steven James Consulting</span>
        </a>

        <nav className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium opacity-90 hover:opacity-100"
            >
              {link.label}
            </a>
          ))}
          <a
            href={BOOKING_URL}
            className="rounded-lg bg-[color:var(--color-sjc-blue)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[color:var(--color-sjc-green)]"
          >
            Book the Call &rarr;
          </a>
        </nav>

        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((prev) => !prev)}
          className="flex h-10 w-10 items-center justify-center rounded-md text-white hover:bg-white/10 md:hidden"
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

      {open && (
        <nav
          className="border-t border-white/10 md:hidden"
          style={{ backgroundColor: "#1e3a6e" }}
        >
          <div className="mx-auto flex max-w-6xl flex-col px-6 pb-5">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="border-b border-white/10 py-4 text-base font-medium text-white"
              >
                {link.label}
              </a>
            ))}
            <a
              href={BOOKING_URL}
              onClick={() => setOpen(false)}
              className="mt-5 rounded-lg bg-[color:var(--color-sjc-blue)] px-4 py-3 text-center text-base font-semibold text-white shadow-sm"
            >
              Book the Call &rarr;
            </a>
          </div>
        </nav>
      )}
    </header>
  );
}
