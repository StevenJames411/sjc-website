"use client";

import { useState } from "react";
import { BRAND, DIVISIONS, NAV_EXTRA } from "./content";

// GLOBAL HEADER — a component, never part of a page. This is the piece that becomes global on
// import: edited once, applied to every page.
//
// ⛔ IT IS ALSO THE PROOF OF THE UMBRELLA. Three companies under one roof cannot be
// communicated by five service words in a row — that reads as a freelancer with a price list.
// The divisions get their real names and a one-line job, revealed on hover, so the depth is
// visible without the page ever claiming to be big.
//
// It carries its own mobile menu, where the divisions are named in full — a phone has room for
// the descriptor that the desktop bar hides.

// One panel, used by the divisions and by Podcast/Careers alike — so every nav item has a
// descriptor slot in the markup, whether or not its wording is final.
function Panel({ d, show }: { d: { name: string; line: string }; show: boolean }) {
  return (
    <span style={{
      position: "absolute", top: "calc(100% + 14px)", left: "50%", transform: "translateX(-50%)",
      minWidth: 250, maxWidth: 300, padding: "16px 20px", textAlign: "left",
      background: "var(--surface)", border: "1px solid rgba(var(--line),.12)",
      boxShadow: "0 24px 60px -20px rgba(0,0,0,.9)",
      opacity: show ? 1 : 0, visibility: show ? "visible" : "hidden",
      transition: "opacity .25s ease, visibility .25s", pointerEvents: "none",
    }}>
      <span style={{ display: "block", fontFamily: "Georgia, serif", fontSize: 19, color: "#fff", whiteSpace: "nowrap" }}>{d.name}</span>
      <span style={{ display: "block", marginTop: 6, fontSize: 13, color: "rgba(255,255,255,.55)", fontWeight: 300, lineHeight: 1.6 }}>{d.line}</span>
    </span>
  );
}

export default function SiteHeader({ overlay = true }: { overlay?: boolean }) {
  const [open, setOpen] = useState(false);
  const [hover, setHover] = useState<string | null>(null);

  const Wordmark = ({ size = 1 }: { size?: number }) => (
    <a href={BRAND.href} style={{ textDecoration: "none", color: "var(--accent-soft)", fontFamily: "Georgia, serif", lineHeight: 1.05 }}>
      <span style={{ display: "block", fontSize: `clamp(${18 * size}px,${2.1 * size}vw,${30 * size}px)`, letterSpacing: ".06em", fontWeight: 500 }}>
        {BRAND.nameTop.split(" ").map((w) => (
          <span key={w}>{w[0]}<span style={{ fontSize: ".78em" }}>{w.slice(1).toUpperCase()}</span>{" "}</span>
        ))}
      </span>
      <span style={{ display: "block", fontSize: `clamp(${8 * size}px,${0.95 * size}vw,${12 * size}px)`, letterSpacing: ".32em", textTransform: "uppercase", marginTop: ".5em", color: "var(--accent)" }}>
        {BRAND.nameSub}
      </span>
    </a>
  );

  return (
    <>
      <header style={{
        position: overlay ? "absolute" : "relative",
        top: 0, left: 0, right: 0, zIndex: 40,
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14,
        padding: "clamp(18px,3vw,38px) clamp(20px,4vw,60px)",
      }}>
        <Wordmark />

        <nav className="v2-desknav" style={{ display: "flex", alignItems: "center", gap: "clamp(14px,2.2vw,30px)" }}>
          {DIVISIONS.map((d) => (
            <span key={d.href} style={{ position: "relative" }}
                  onMouseEnter={() => setHover(d.href)}
                  onMouseLeave={() => setHover(null)}>
              <a href={d.href} style={{
                color: "var(--accent-soft)", textDecoration: "none", fontSize: 11,
                letterSpacing: ".22em", textTransform: "uppercase", paddingBottom: 6,
                borderBottom: hover === d.href ? "1px solid var(--accent)" : "1px solid transparent",
                transition: "border-color .25s",
              }}>
                {/* the numeral is the point — the nav teaches the hierarchy before anyone
                    reads a word of the page */}
                <span style={{ opacity: .65, marginRight: 7, fontSize: 15, fontFamily: "Georgia, serif", letterSpacing: 0 }}>{d.n}</span>{d.short}
              </a>

              <Panel d={d} show={hover === d.href} />
            </span>
          ))}

          <span style={{ width: 1, height: 16, background: "rgba(var(--line),.18)" }} />

          {NAV_EXTRA.map((d) => (
            <span key={d.href} style={{ position: "relative" }}
                  onMouseEnter={() => setHover(d.href)}
                  onMouseLeave={() => setHover(null)}>
              {/* same colour as the divisions — the rule already separates the groups, and two
                  signals for one distinction read as a mistake rather than a hierarchy */}
              <a href={d.href} style={{
                color: "var(--accent-soft)", textDecoration: "none", fontSize: 11,
                letterSpacing: ".22em", textTransform: "uppercase", paddingBottom: 6,
                borderBottom: hover === d.href ? "1px solid var(--accent)" : "1px solid transparent",
                transition: "border-color .25s",
              }}>{d.short}</a>
              <Panel d={d} show={hover === d.href} />
            </span>
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

      {/* ---- mobile: the divisions get their full names and descriptors, there is room ---- */}
      <nav style={{
        position: "fixed", inset: 0, zIndex: 80, background: "rgba(var(--inkrgb),.98)",
        display: "flex", flexDirection: "column", justifyContent: "center",
        padding: "0 clamp(24px,7vw,48px)",
        opacity: open ? 1 : 0, visibility: open ? "visible" : "hidden",
        transition: "opacity .35s ease, visibility .35s", overflowY: "auto",
      }}>
        <button
          aria-label="Close menu"
          onClick={() => { setOpen(false); document.body.style.overflow = ""; }}
          style={{ position: "absolute", top: 22, right: 22, background: "none", border: 0, color: "var(--accent-soft)", fontSize: 34, lineHeight: 1, cursor: "pointer", padding: 8 }}
        >&times;</button>

        <div style={{ fontSize: 10, letterSpacing: ".3em", textTransform: "uppercase", color: "var(--accent)", marginBottom: 22 }}>
          The Divisions
        </div>
        {DIVISIONS.map((d) => (
          <a key={d.href} href={d.href}
             onClick={() => { setOpen(false); document.body.style.overflow = ""; }}
             style={{ textDecoration: "none", display: "block", padding: "16px 0", borderTop: "1px solid rgba(var(--line),.1)" }}>
            <span style={{ display: "block", fontFamily: "Georgia, serif", fontSize: 27, color: "#fff", fontWeight: 300 }}>
              <span style={{ fontSize: 15, color: "var(--accent)", marginRight: 10 }}>{d.n}</span>{d.name}
            </span>
            <span style={{ display: "block", marginTop: 5, fontSize: 14, color: "rgba(255,255,255,.5)", fontWeight: 300 }}>{d.line}</span>
          </a>
        ))}

        <div style={{ marginTop: 26 }}>
          {NAV_EXTRA.map((n) => (
            <a key={n.href} href={n.href}
               onClick={() => { setOpen(false); document.body.style.overflow = ""; }}
               style={{ textDecoration: "none", display: "block", padding: "14px 0", borderTop: "1px solid rgba(var(--line),.1)" }}>
              <span style={{ display: "block", fontFamily: "Georgia, serif", fontSize: 21, color: "rgba(255,255,255,.82)", fontWeight: 300 }}>{n.name}</span>
              <span style={{ display: "block", marginTop: 4, fontSize: 13.5, color: "rgba(255,255,255,.45)", fontWeight: 300 }}>{n.line}</span>
            </a>
          ))}
        </div>
      </nav>

      <style>{`
        /* ⚠️ 1200, not 1000. Spelled-out labels ("1 Custom Websites · 2 Five Star Reviews ·
           3 AI Implementation · 4 Paid Ads") fit on one line down to about 1200px and wrap
           into a double-height bar below it. The burger has to take over BEFORE the wrap,
           not after — a small laptop and a landscape tablet both live in that gap. */
        @media (max-width:1200px){
          .v2-desknav{display:none !important}
          .v2-burger{display:block !important}
        }
      `}</style>
    </>
  );
}
