"use client";

import { useEffect, useRef, useState } from "react";

// The hero is the work — but a screenshot used as WALLPAPER fights the page it sits behind.
// The first version put SJC's headline and nav on top of a demo's headline and nav: two of
// each, colliding. A screenshot has to be presented AS a screenshot.
//
// So: type on the left, the work in a browser frame on the right, cycling. It reads as
// "sites we built" in one glance instead of asking the visitor to work out what they are
// looking at — and the copy never fights the image for the same pixels.

const WORK = [
  { img: "/work/landscape.jpg", label: "Landscape Architecture", domain: "mwsla.com", note: "Sixteen years of awards, invisible to search" },
  { img: "/work/detail.jpg", label: "Ceramic Coating", domain: "meridiandetail.com", note: "A $1,500 service that looked like a $150 one" },
  { img: "/work/offgrid.jpg", label: "Off-Grid Architecture", domain: "haldenroe.com", note: "Four houses a year, chosen carefully" },
  { img: "/work/customcar.jpg", label: "Restoration & Restomod", domain: "ardsleycoachworks.com", note: "Nine builds a year, eighteen months each" },
];

const HOLD = 5200;

export default function WorkReel() {
  const [idx, setIdx] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    timer.current = setTimeout(() => setIdx((i) => (i + 1) % WORK.length), HOLD);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [idx]);

  return (
    <section style={{
      position: "relative", minHeight: "100svh", background: "#0b0b0b", overflow: "hidden",
      display: "flex", flexDirection: "column",
    }}>
      <style>{`
        .sol-card{transition:transform .5s cubic-bezier(.2,.7,.3,1),border-color .5s}
        .sol-card:hover{transform:translateY(-8px);border-color:rgba(201,162,39,.5)}
        .wr-grid{position:absolute;inset:0;opacity:.5;pointer-events:none;
          background-image:linear-gradient(rgba(255,255,255,.028) 1px,transparent 1px),
                           linear-gradient(90deg,rgba(255,255,255,.028) 1px,transparent 1px);
          background-size:64px 64px;
          mask-image:radial-gradient(70% 60% at 60% 40%,#000 0%,transparent 100%)}
        .wr-shot{position:absolute;inset:0;background-size:cover;background-position:top center;
          opacity:0;transition:opacity 1s ease-in-out}
        .wr-shot.on{opacity:1}
        .wr-hero{display:grid;grid-template-columns:minmax(0,.92fr) minmax(0,1.08fr);
          gap:clamp(30px,5vw,72px);align-items:center;flex:1;
          padding:clamp(96px,11vw,150px) clamp(20px,5vw,60px) clamp(48px,6vw,84px);
          max-width:1500px;margin:0 auto;width:100%}
        @media (max-width:900px){
          .wr-hero{grid-template-columns:1fr;padding-top:clamp(110px,20vw,150px);text-align:center}
          .wr-copy{margin:0 auto}
          .wr-dots{justify-content:center}
        }
      `}</style>

      <div className="wr-grid" />

      <header style={{
        position: "absolute", top: 0, left: 0, right: 0, zIndex: 10, display: "flex",
        alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 14,
        padding: "clamp(18px,3vw,38px) clamp(20px,4vw,60px)",
      }}>
        <a href="/" style={{ textDecoration: "none", color: "#e8c65a", fontFamily: "Georgia, serif", lineHeight: 1.05 }}>
          <span style={{ display: "block", fontSize: "clamp(18px,2.1vw,30px)", letterSpacing: ".06em", fontWeight: 500 }}>
            S<span style={{ fontSize: ".78em" }}>TEVEN</span> J<span style={{ fontSize: ".78em" }}>AMES</span>
          </span>
          <span style={{ display: "block", fontSize: "clamp(8px,.95vw,12px)", letterSpacing: ".32em", textTransform: "uppercase", marginTop: ".5em", color: "#c9a227" }}>
            Consulting
          </span>
        </a>
        <nav style={{ display: "flex", gap: "clamp(14px,2.2vw,32px)", flexWrap: "wrap", justifyContent: "flex-end" }}>
          {[["Web Design", "/designs"], ["Reviews", "/reviews"], ["AI", "/ai-implementation"], ["Podcast", "/podcast"], ["Careers", "/careers"]].map(([t, h]) => (
            <a key={h} href={h} style={{ color: "#e8c65a", textDecoration: "none", fontSize: 11, letterSpacing: ".22em", textTransform: "uppercase" }}>{t}</a>
          ))}
        </nav>
      </header>

      <div className="wr-hero">
        {/* ---- the argument ---- */}
        <div className="wr-copy" style={{ maxWidth: 620, position: "relative", zIndex: 5 }}>
          <div style={{
            display: "inline-block", padding: "8px 18px", border: "1px solid rgba(201,162,39,.5)",
            color: "rgba(255,255,255,.92)", fontSize: "clamp(8.5px,.85vw,10.5px)", fontWeight: 500,
            letterSpacing: ".26em", textTransform: "uppercase", marginBottom: "clamp(20px,2.6vw,30px)",
          }}>
            For contractors, builders and specialty shops
          </div>
          <h1 style={{
            fontFamily: "Georgia, serif", fontWeight: 300, margin: 0, color: "#fff",
            fontSize: "clamp(34px,4.6vw,68px)", lineHeight: 1.05, letterSpacing: ".005em",
          }}>
            Your work is better<br />than your website.
          </h1>
          <p style={{
            margin: "clamp(20px,2.4vw,30px) 0 0", maxWidth: "52ch", color: "rgba(255,255,255,.7)",
            fontSize: "clamp(15px,1.2vw,18px)", lineHeight: 1.85, fontWeight: 300,
          }}>
            I build the website, the reviews and the follow-up for high-end trades &mdash; so the jobs
            you want stop going to someone with a nicer page and half your skill.
            <br /><br />
            Forty years running my own businesses. You deal with me, not an account manager.
          </p>
          <a href="#diagnosis" style={{
            display: "inline-block", marginTop: "clamp(26px,3vw,38px)", padding: "16px 40px",
            border: "1px solid #c9a227", color: "#e8c65a", textDecoration: "none",
            fontSize: 11, letterSpacing: ".24em", textTransform: "uppercase",
          }}>See where yours stands</a>
        </div>

        {/* ---- the work, framed as work ---- */}
        <div style={{ position: "relative", zIndex: 4 }}>
          <div style={{
            borderRadius: 10, overflow: "hidden", border: "1px solid rgba(255,255,255,.13)",
            boxShadow: "0 50px 120px -30px rgba(0,0,0,.95), 0 0 0 1px rgba(255,255,255,.04)",
            background: "#111",
          }}>
            {/* browser chrome — this is what says "a website" without a caption */}
            <div style={{
              display: "flex", alignItems: "center", gap: 7, padding: "11px 14px",
              background: "#1a1a1a", borderBottom: "1px solid rgba(255,255,255,.07)",
            }}>
              {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
                <span key={c} style={{ width: 10, height: 10, borderRadius: "50%", background: c, opacity: .85 }} />
              ))}
              <span style={{
                marginLeft: 12, flex: 1, height: 20, borderRadius: 5, background: "rgba(255,255,255,.05)",
                display: "flex", alignItems: "center", padding: "0 10px",
                fontSize: 10.5, color: "rgba(255,255,255,.35)", letterSpacing: ".04em",
              }}>
                {WORK[idx].domain}
              </span>
            </div>

            <div style={{ position: "relative", aspectRatio: "16/10", background: "#0d0d0d" }}>
              {WORK.map((w, i) => (
                <div key={w.img} className={"wr-shot" + (i === idx ? " on" : "")}
                     style={{ backgroundImage: `url('${w.img}')` }} />
              ))}
            </div>
          </div>

          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            gap: 18, marginTop: 18, flexWrap: "wrap",
          }} className="wr-dots">
            <div>
              <div style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: "clamp(16px,1.5vw,21px)", color: "#fff" }}>
                {WORK[idx].label}
              </div>
              <div style={{ color: "rgba(255,255,255,.45)", fontSize: 13.5, marginTop: 4 }}>{WORK[idx].note}</div>
            </div>
            <div style={{ display: "flex", gap: 7 }}>
              {WORK.map((w, i) => (
                <button
                  key={w.img}
                  onClick={() => setIdx(i)}
                  aria-label={w.label}
                  style={{
                    width: i === idx ? 26 : 9, height: 9, borderRadius: 20, cursor: "pointer",
                    border: "none", padding: 0, transition: ".4s",
                    background: i === idx ? "#c9a227" : "rgba(255,255,255,.22)",
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
