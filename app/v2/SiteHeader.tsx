"use client";

import { useState } from "react";
import { BRAND, DIVISIONS, NAV_EXTRA } from "./content";

// GLOBAL HEADER — a component, never part of a page.
//
// ⛔ THE MENU BUTTON RUNS AT EVERY WIDTH, not just on mobile. Fitting links into a horizontal
// bar is a losing game: the breakpoint moved three times in one evening (1000 → 1200 → 1340)
// purely because labels got longer, and two more links were still queued. A bar has a hard
// ceiling; an overlay does not.
//
// What that buys: unlimited links, the full canvas for the photography, and every item shown
// WITH its description rather than hidden behind a hover — which is the thing that actually
// explains four divisions to a stranger.
//
// The top bar keeps exactly three things: who you are, one action, and the way in.

export default function SiteHeader({ overlay = true }: { overlay?: boolean }) {
  const [open, setOpen] = useState(false);
  const close = () => { setOpen(false); document.body.style.overflow = ""; };

  const Wordmark = ({ small = false }: { small?: boolean }) => (
    <a href={BRAND.href} style={{ textDecoration: "none", color: "var(--accent-soft)", fontFamily: "Georgia, serif", lineHeight: 1.05 }}>
      <span style={{ display: "block", fontSize: small ? 21 : "clamp(18px,2.1vw,30px)", letterSpacing: ".06em", fontWeight: 500 }}>
        {BRAND.nameTop.split(" ").map((w) => (
          <span key={w}>{w[0]}<span style={{ fontSize: ".78em" }}>{w.slice(1).toUpperCase()}</span>{" "}</span>
        ))}
      </span>
      <span style={{ display: "block", fontSize: small ? 9 : "clamp(8px,.95vw,12px)", letterSpacing: ".32em", textTransform: "uppercase", marginTop: ".5em", color: "var(--accent)" }}>
        {BRAND.nameSub}
      </span>
    </a>
  );

  const Row = ({ item, big }: { item: { n?: string; name: string; line: string; href: string }; big?: boolean }) => (
    <a href={item.href} onClick={close} style={{
      textDecoration: "none", display: "block", padding: big ? "18px 0" : "14px 0",
      borderTop: "1px solid rgba(var(--line),.1)",
    }}>
      <span style={{
        display: "block", fontFamily: "Georgia, serif", fontWeight: 300,
        fontSize: big ? "clamp(24px,3vw,38px)" : "clamp(18px,2vw,24px)",
        color: big ? "#fff" : "rgba(255,255,255,.82)",
      }}>
        {item.n && <span style={{ fontSize: ".52em", color: "var(--accent)", marginRight: 14 }}>{item.n}</span>}
        {item.name}
      </span>
      <span style={{ display: "block", marginTop: 6, fontSize: big ? 15 : 13.5, color: "rgba(255,255,255,.45)", fontWeight: 300 }}>
        {item.line}
      </span>
    </a>
  );

  return (
    <>
      <header style={{
        position: overlay ? "absolute" : "relative",
        top: 0, left: 0, right: 0, zIndex: 40,
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
        padding: "clamp(18px,3vw,38px) clamp(20px,4vw,60px)",
      }}>
        <Wordmark />

        <div style={{ display: "flex", alignItems: "center", gap: "clamp(12px,2vw,22px)" }}>
          <a href="/apply" className="v2-topcta" style={{
            padding: "12px 26px", border: "1px solid var(--accent)", color: "var(--accent-soft)",
            textDecoration: "none", fontSize: 10.5, letterSpacing: ".22em", textTransform: "uppercase",
          }}>Book a walkthrough</a>

          <button
            aria-label="Open menu"
            aria-expanded={open}
            onClick={() => { setOpen(true); document.body.style.overflow = "hidden"; }}
            style={{
              display: "flex", alignItems: "center", gap: 11, background: "none",
              border: "1px solid rgba(var(--line),.22)", color: "var(--accent-soft)",
              cursor: "pointer", padding: "11px 18px",
              fontSize: 10.5, letterSpacing: ".22em", textTransform: "uppercase", fontFamily: "inherit",
            }}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M3 6h18M3 12h18M3 18h18" />
            </svg>
            <span className="v2-menuword">Menu</span>
          </button>
        </div>
      </header>

      {/* ---- the overlay: everything, with its description visible ---- */}
      <nav style={{
        position: "fixed", inset: 0, zIndex: 80, background: "var(--ink)",   // fully opaque — at .985 the hero ghosted through and the menu read as unfinished
        opacity: open ? 1 : 0, visibility: open ? "visible" : "hidden",
        transition: "opacity .35s ease, visibility .35s", overflowY: "auto",
      }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "clamp(18px,3vw,38px) clamp(20px,5vw,60px)",
        }}>
          <Wordmark small />
          <button aria-label="Close menu" onClick={close} style={{
            background: "none", border: "1px solid rgba(var(--line),.22)", color: "var(--accent-soft)",
            fontSize: 22, lineHeight: 1, cursor: "pointer", padding: "8px 14px",
          }}>&times;</button>
        </div>

        <div className="v2-menugrid" style={{
          maxWidth: 1180, margin: "0 auto", padding: "clamp(10px,2vw,26px) clamp(20px,5vw,60px) 80px",
          display: "grid", gap: "clamp(30px,5vw,70px)", gridTemplateColumns: "minmax(0,1.25fr) minmax(0,.75fr)",
        }}>
          <div>
            <div style={{ fontSize: 10, letterSpacing: ".3em", textTransform: "uppercase", color: "var(--accent)", marginBottom: 18 }}>
              The Divisions
            </div>
            {DIVISIONS.map((d) => <Row key={d.href} item={d} big />)}
          </div>

          <div>
            <div style={{ fontSize: 10, letterSpacing: ".3em", textTransform: "uppercase", color: "var(--accent)", marginBottom: 18 }}>
              The Company
            </div>
            {NAV_EXTRA.map((n) => <Row key={n.href} item={n} />)}
            <a href="/apply" onClick={close} style={{
              display: "inline-block", marginTop: 30, padding: "15px 32px",
              border: "1px solid var(--accent)", color: "var(--accent-soft)", textDecoration: "none",
              fontSize: 10.5, letterSpacing: ".22em", textTransform: "uppercase",
            }}>Book a walkthrough</a>
          </div>
        </div>
      </nav>

      <style>{`
        @media (max-width:820px){
          .v2-topcta{display:none}
          .v2-menugrid{grid-template-columns:1fr !important;gap:34px !important}
        }
        @media (max-width:420px){ .v2-menuword{display:none} }
      `}</style>
    </>
  );
}
