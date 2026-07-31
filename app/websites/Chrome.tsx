"use client";

import { useEffect, useRef, useState } from "react";
import { Code2, Menu, Phone } from "lucide-react";
import styles from "./websites.module.css";

// The two pieces of /websites that need the browser: the mobile menu toggle and the scroll reveal.
// Everything else on the page is static server-rendered markup.
//
// Ported 1:1 from the SiteDrop design. Copy is Steven's to edit.

const NAV = [
  { href: "#services", label: "Services" },
  { href: "#about", label: "About" },
  { href: "#process", label: "Process" },
  { href: "#testimonials", label: "Testimonials" },
  { href: "#stats", label: "Results" },
];

const PHONE_DISPLAY = "(210) 851-4906";
const PHONE_HREF = "tel:+12108514906";

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-[#0A0E27]/80 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 sm:px-8">
        <a href="#hero" className="group flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-linear-to-br from-[#00D9FF] to-[#00D9FF]/40 shadow-lg shadow-[#00D9FF]/20">
            <Code2 className="h-5 w-5 text-[#0A0E27]" />
          </div>
          <span className="text-lg font-bold tracking-tight text-white">
            Steven James <span className="text-[#00D9FF]">Consulting</span>
          </span>
        </a>

        <div className="hidden items-center gap-8 md:flex">
          {NAV.map((n) => (
            <a
              key={n.href}
              href={n.href}
              className="text-sm text-white/70 transition-colors duration-300 hover:text-[#00D9FF]"
            >
              {n.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <a
            href={PHONE_HREF}
            className="flex items-center gap-2 text-sm text-white/80 transition-colors hover:text-[#00D9FF]"
          >
            <Phone className="h-4 w-4" />
            {PHONE_DISPLAY}
          </a>
          <a
            href="#contact"
            className="rounded-full bg-[#00D9FF] px-5 py-2.5 text-sm font-semibold text-[#0A0E27] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#00D9FF]/30"
          >
            Get Free Quote
          </a>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="p-2 text-white md:hidden"
          aria-label="Menu"
          aria-expanded={open}
        >
          <Menu className="h-6 w-6" />
        </button>
      </nav>

      {open ? (
        <div className="border-t border-white/5 bg-[#0A0E27]/95 backdrop-blur-xl md:hidden">
          <div className="flex flex-col gap-4 px-6 py-6">
            {NAV.map((n) => (
              <a
                key={n.href}
                href={n.href}
                onClick={() => setOpen(false)}
                className="text-sm text-white/80 hover:text-[#00D9FF]"
              >
                {n.label}
              </a>
            ))}
            <a href={PHONE_HREF} className="flex items-center gap-2 text-sm text-white/80 hover:text-[#00D9FF]">
              <Phone className="h-4 w-4" /> {PHONE_DISPLAY}
            </a>
            <a
              href="#contact"
              onClick={() => setOpen(false)}
              className="mt-2 rounded-full bg-[#00D9FF] px-5 py-3 text-center text-sm font-semibold text-[#0A0E27]"
            >
              Get Free Quote
            </a>
          </div>
        </div>
      ) : null}
    </header>
  );
}

/** Fades a block in as it scrolls into view. Falls back to visible if the observer never fires. */
export function Reveal({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    // No observer (old browser, or the element is already gone) => show it. Content must never
    // be left invisible because an animation didn't run.
    if (!el || typeof IntersectionObserver === "undefined") {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setShown(true);
            io.disconnect();
          }
        }
      },
      { rootMargin: "0px 0px -80px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className={`${styles.reveal} ${shown ? styles.revealVisible : ""} ${className}`}>
      {children}
    </div>
  );
}
