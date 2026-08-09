"use client";

import { HERO } from "./content";

// THE PARENT-BRAND HERO.
//
// The other two heroes in the kit each have ONE job: Steven James Designs says "we build
// websites", the landscape architect says "look at this work". This page tried to carry the
// whole ascension model and read as muddled — talking to everybody is talking to nobody.
//
// So its one job is narrower than it looks: establish WHO he is and HOW FAR the work reaches.
// It is not selling websites — /designs does that, and website buyers land there.
//
// ⛔ WHICH IS WHY THE VISUAL IS THE CHAIN, NOT A SCREENSHOT. A browser frame says "one
// product". The chain says "I own the whole sequence", which is the only thing this page has
// to communicate. It is also the connective tissue: whichever door someone enters by, they see
// the same shape and where the page they are on sits inside it.

export default function ChainHero() {
  return (
    <section style={{
      position: "relative", minHeight: "100svh", background: "var(--ink)", overflow: "hidden",
      display: "flex", flexDirection: "column", justifyContent: "center",
      padding: "clamp(120px,14vw,180px) clamp(20px,5vw,60px) clamp(60px,7vw,90px)",
    }}>
      <style>{`
        .ch-grid{position:absolute;inset:0;opacity:.55;pointer-events:none;
          background-image:linear-gradient(rgba(255,255,255,.026) 1px,transparent 1px),
                           linear-gradient(90deg,rgba(255,255,255,.026) 1px,transparent 1px);
          background-size:64px 64px;
          mask-image:radial-gradient(78% 70% at 50% 45%,#000 0%,transparent 100%)}
        .ch-chain{display:grid;grid-template-columns:repeat(6,1fr);gap:0;
          max-width:1180px;margin:clamp(46px,6vw,84px) auto 0;width:100%}
        .ch-node{position:relative;text-align:center;padding:0 6px}
        /* the connector between links — drawn on the node, not between them, so a
           six-column grid can wrap to two rows on a phone without leaving orphan lines */
        .ch-node::before{content:"";position:absolute;top:9px;left:-50%;width:100%;height:1px;
          background:rgba(var(--line),.16)}
        .ch-node:first-child::before{display:none}
        .ch-dot{position:relative;z-index:2;width:19px;height:19px;border-radius:50%;margin:0 auto;
          display:grid;place-items:center}
        .ch-k{margin-top:16px;font-family:Georgia,serif;font-size:clamp(14px,1.35vw,19px);line-height:1.2}
        .ch-n{margin-top:6px;font-size:clamp(10px,.85vw,12px);letter-spacing:.1em;
          color:rgba(255,255,255,.4);line-height:1.5}
        @media (max-width:760px){
          .ch-chain{grid-template-columns:repeat(3,1fr);row-gap:34px}
          .ch-node:nth-child(4)::before{display:none}
        }
        .sol-card{transition:transform .5s cubic-bezier(.2,.7,.3,1),border-color .5s}
        .sol-card:hover{transform:translateY(-8px);border-color:rgba(var(--accent-rgb),.5)}
      `}</style>

      <div className="ch-grid" />

      <div style={{ position: "relative", zIndex: 2, maxWidth: 1180, margin: "0 auto", width: "100%", textAlign: "center" }}>
        <div style={{
          display: "inline-block", padding: "8px 20px", border: "1px solid rgba(var(--accent-rgb),.5)",
          color: "rgba(255,255,255,.92)", fontSize: "clamp(8.5px,.85vw,10.5px)", fontWeight: 500,
          letterSpacing: ".26em", textTransform: "uppercase", marginBottom: "clamp(22px,3vw,34px)",
        }}>
          {HERO.badge}
        </div>

        <h1 style={{
          fontFamily: "Georgia, serif", fontWeight: 300, margin: 0, color: "#fff",
          fontSize: "clamp(34px,5.4vw,76px)", lineHeight: 1.05, letterSpacing: ".005em",
        }}>
          {HERO.h1[0]}<br />{HERO.h1[1]}
        </h1>

        <p style={{
          margin: "clamp(22px,2.6vw,32px) auto 0", maxWidth: "62ch", color: "rgba(255,255,255,.7)",
          fontSize: "clamp(15px,1.2vw,19px)", lineHeight: 1.85, fontWeight: 300,
        }}>
          {HERO.body[0]}
        </p>
        <p style={{
          margin: "16px auto 0", maxWidth: "62ch", color: "rgba(255,255,255,.7)",
          fontSize: "clamp(15px,1.2vw,19px)", lineHeight: 1.85, fontWeight: 300,
        }}>
          {HERO.body[1]}
        </p>

        <a href={HERO.cta.href} style={{
          display: "inline-block", marginTop: "clamp(28px,3.2vw,42px)", padding: "16px 42px",
          border: "1px solid var(--accent)", color: "var(--accent-soft)", textDecoration: "none",
          fontSize: 11, letterSpacing: ".24em", textTransform: "uppercase",
        }}>{HERO.cta.label}</a>

        {/* ---- the chain: breadth, in one glance ----
             ⚠️ LABELLED, because the page carries TWO orders and both are correct. This is the
             CUSTOMER's path (Maps first — that is where they start). The divisions run in the
             BUILD order (website first — everything points at it). Unlabelled, side by side,
             they read as a contradiction. */}
        <div style={{
          marginTop: "clamp(44px,5.5vw,76px)", fontSize: 10, letterSpacing: ".3em",
          textTransform: "uppercase", color: "rgba(255,255,255,.4)",
        }}>{HERO.chainLabel}</div>
        <div className="ch-chain" style={{ marginTop: "clamp(22px,2.6vw,34px)" }}>
          {HERO.chain.map((c) => (
            <div className="ch-node" key={c.k}>
              <div className="ch-dot" style={{
                background: c.mine ? "var(--accent)" : "var(--ink)",
                border: c.mine ? "none" : "1px solid rgba(var(--line),.3)",
                boxShadow: c.mine ? "0 0 0 5px rgba(var(--accent-rgb),.14)" : "none",
              }} />
              <div className="ch-k" style={{ color: c.mine ? "#fff" : "rgba(255,255,255,.42)" }}>{c.k}</div>
              <div className="ch-n">{c.note}</div>
            </div>
          ))}
        </div>

        <p style={{
          margin: "clamp(28px,3.4vw,42px) auto 0", maxWidth: "58ch",
          color: "rgba(255,255,255,.45)", fontSize: "clamp(13px,1vw,15px)", lineHeight: 1.8, fontWeight: 300,
        }}>
          {HERO.chainNote}
        </p>
      </div>
    </section>
  );
}
