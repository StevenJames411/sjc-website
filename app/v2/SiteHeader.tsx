"use client";

import { useState } from "react";
import { BRAND, NAV } from "./content";

// GLOBAL HEADER — a component, never part of a page.
//
// This is the piece that becomes global on import: edited once, applied to every page. It was
// the first thing the SiteDrop import taught us to separate, and it is why the same lesson is
// being applied here before the page is built rather than after.
//
// It carries its own mobile menu. A five-item nav that merely wraps on a phone is not a mobile
// nav — and a burger with nothing behind it is worse than no burger at all.

export default function SiteHeader({ overlay = true }: { overlay?: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <header style={{
        position: overlay ? "absolute" : "relative",
        top: 0, left: 0, right: 0, zIndex: 40,
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14,
        padding: "clamp(18px,3vw,38px) clamp(20px,4vw,60px)",
      }}>
        <a href={BRAND.href} style={{ textDecoration: "none", color: "var(--accent-soft)", fontFamily: "Georgia, serif", lineHeight: 1.05 }}>
          <span style={{ display: "block", fontSize: "clamp(18px,2.1vw,30px)", letterSpacing: ".06em", fontWeight: 500 }}>
            {BRAND.nameTop.split(" ").map((w) => (
              <span key={w}>{w[0]}<span style={{ fontSize: ".78em" }}>{w.slice(1).toUpperCase()}</span>{" "}</span>
            ))}
          </span>
          <span style={{ display: "block", fontSize: "clamp(8px,.95vw,12px)", letterSpacing: ".32em", textTransform: "uppercase", marginTop: ".5em", color: "var(--accent)" }}>
            {BRAND.nameSub}
          </span>
        </a>

        <nav className="v2-desknav" style={{ display: "flex", gap: "clamp(14px,2.2vw,32px)" }}>
          {NAV.map((n) => (
            <a key={n.href} href={n.href} style={{
              color: "var(--accent-soft)", textDecoration: "none", fontSize: 11,
              letterSpacing: ".22em", textTransform: "uppercase",
            }}>{n.label}</a>
          ))}
        </nav>

        <button
          className="v2-burger"
          aria-label="Open menu"
          aria-expanded={open}
          onClick={() => { setOpen(true); document.body.style.overflow = "hidden"; }}
          style={{ display: "none", background: "none", border: 0, color: "var(--accent-soft)", cursor: "pointer", padding: 8 }}
        >
          <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.4">
            <path d="M3 6h18M3 12h18M3 18h18" />
          </svg>
        </button>
      </header>

      <nav style={{
        position: "fixed", inset: 0, zIndex: 80, background: "rgba(var(--inkrgb),.97)",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4,
        opacity: open ? 1 : 0, visibility: open ? "visible" : "hidden",
        transition: "opacity .35s ease, visibility .35s",
      }}>
        <button
          aria-label="Close menu"
          onClick={() => { setOpen(false); document.body.style.overflow = ""; }}
          style={{ position: "absolute", top: 22, right: 22, background: "none", border: 0, color: "var(--accent-soft)", fontSize: 34, lineHeight: 1, cursor: "pointer", padding: 8 }}
        >&times;</button>
        {NAV.map((n) => (
          <a key={n.href} href={n.href}
             onClick={() => { setOpen(false); document.body.style.overflow = ""; }}
             style={{ fontFamily: "Georgia, serif", fontSize: 30, fontWeight: 300, textDecoration: "none", color: "#fff", padding: "14px 20px" }}>
            {n.label}
          </a>
        ))}
      </nav>

      <style>{`
        @media (max-width:900px){
          .v2-desknav{display:none !important}
          .v2-burger{display:block !important}
        }
      `}</style>
    </>
  );
}
