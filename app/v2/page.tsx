import type { Metadata } from "next";
import Buckets from "./Buckets";
import ChainHero from "./ChainHero";   // WorkReel is kept for /designs, where showing the work IS the job
import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";
import PaletteSwitcher from "./PaletteSwitcher";   // DEMO-ONLY — remove before public
import { Section, Eyebrow, H2, Lede } from "./Section";
import { STORY, DIAGNOSIS, SOLUTION, PROOF, WHO, ASK } from "./content";

// The rebuilt SJC home page, at /v2 until approved.
//
// One argument, in this order: he tells his own story → he finds his own problem → the
// solution is the only sequence it could be done in. Every deep-linked page is one link in
// that chain, so landing directly on it still makes sense to someone who arrived from a Loom.
//
// ⛔ BUILT FOR THE IMPORT. Header and footer are global components, every section carries its
// own padding and max-width, every word lives in content.ts, and every colour is a token.
// Porting this into the design studio is then a mapping, not a second build.

export const metadata: Metadata = {
  title: "Steven James Consulting — websites for high-end trades",
  description:
    "Websites, reviews and follow-up for contractors, builders and specialty shops. Forty years running my own businesses — you deal with the people who build it, not an account manager.",
};

export const dynamic = "force-static";

export default function V2() {
  return (
    <main style={{ background: "var(--ink)", color: "var(--text)" }}>
      <PaletteSwitcher />

      <div style={{ position: "relative" }}>
        <SiteHeader />
        <ChainHero />
      </div>

      {/* ---------- his story, not ours ---------- */}
      <Section tone="light">
        <Eyebrow>{STORY.eyebrow}</Eyebrow>
        <H2>{STORY.h2}</H2>
        <div style={{ maxWidth: "68ch", margin: "clamp(30px,4vw,52px) auto 0" }}>
          {STORY.paragraphs.map((p, i) => (
            <p key={i} style={{ color: "var(--text-2)", fontSize: "clamp(16px,1.25vw,19px)", lineHeight: 1.9, margin: "0 0 22px", fontWeight: 300 }}>{p}</p>
          ))}
          <p style={{ color: "var(--text)", fontSize: "clamp(18px,1.5vw,23px)", lineHeight: 1.7, margin: "34px 0 0", fontFamily: "Georgia, serif" }}>
            {STORY.closer}
          </p>
        </div>
      </Section>


      {/* ---------- the diagnosis ---------- */}
      <Section tone="ink">
        <Eyebrow>{DIAGNOSIS.eyebrow}</Eyebrow>
        <H2>{DIAGNOSIS.h2}</H2>
        <Lede>{DIAGNOSIS.lede}</Lede>

        <div style={{ maxWidth: 900, margin: "clamp(38px,5vw,64px) auto 0" }}>
          {DIAGNOSIS.chain.map((c, i) => (
            <div key={c.k} style={{
              display: "grid", gridTemplateColumns: "auto 1fr", gap: "clamp(16px,2vw,28px)",
              padding: "20px 0", alignItems: "baseline",
              borderBottom: i < DIAGNOSIS.chain.length - 1 ? "1px solid rgba(var(--edge),.12)" : "none",
            }}>
              <div style={{ fontFamily: "Georgia, serif", fontSize: "clamp(19px,1.7vw,25px)", whiteSpace: "nowrap", color: i === DIAGNOSIS.chain.length - 1 ? "var(--accent)" : "var(--text)" }}>{c.k}</div>
              <div style={{ color: "var(--text-2)", fontSize: "clamp(15px,1.15vw,17.5px)", lineHeight: 1.8, fontWeight: 300 }}>{c.d}</div>
            </div>
          ))}
        </div>

        <p style={{ maxWidth: "52ch", margin: "clamp(40px,5vw,64px) auto 0", textAlign: "center", fontFamily: "Georgia, serif", fontSize: "clamp(21px,2.2vw,32px)", lineHeight: 1.5, color: "var(--text)" }}>
          {DIAGNOSIS.closer}
        </p>
      </Section>


      {/* ---------- he diagnoses himself — the hinge ---------- */}
      <Buckets />


      {/* ---------- the solution, in the only order it works ---------- */}
      <Section tone="light">
        <Eyebrow>{SOLUTION.eyebrow}</Eyebrow>
        <H2>{SOLUTION.h2}</H2>
        <Lede>{SOLUTION.lede}</Lede>
        <div style={{ display: "grid", gap: 20, maxWidth: 1180, margin: "clamp(40px,5vw,64px) auto 0", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))" }}>
          {SOLUTION.cards.map((s) => (
            <a key={s.n} href={s.href} className="sol-card" style={{
              display: "block", textDecoration: "none", color: "inherit", background: "var(--panel)",
              border: "1px solid rgba(var(--edge),.12)", padding: "32px 30px 34px",
            }}>
              <div style={{ fontFamily: "Georgia, serif", fontSize: 19, color: "var(--accent)", marginBottom: 18 }}>{s.n}</div>
              <h3 style={{ fontFamily: "Georgia, serif", fontWeight: 400, fontSize: "clamp(24px,2vw,29px)", margin: 0 }}>{s.t}</h3>
              <p style={{ margin: "14px 0 0", color: "var(--text-2)", fontSize: "clamp(15px,1.1vw,17px)", lineHeight: 1.8, fontWeight: 300 }}>{s.p}</p>
              <span style={{ display: "inline-block", marginTop: 18, fontSize: 10, letterSpacing: ".24em", textTransform: "uppercase", color: "var(--accent)" }}>Read more &rarr;</span>
            </a>
          ))}
        </div>
      </Section>


      {/* ---------- proof ---------- */}
      <Section id="work" tone="ink">
        <Eyebrow>{PROOF.eyebrow}</Eyebrow>
        <H2>{PROOF.h2}</H2>
        <Lede>{PROOF.lede}</Lede>
        <div style={{ display: "grid", gap: 18, maxWidth: 1180, margin: "clamp(38px,5vw,60px) auto 0", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))" }}>
          {PROOF.items.map((w) => (
            <figure key={w.t} style={{ margin: 0, border: "1px solid rgba(var(--edge),.12)", background: "var(--panel)" }}>
              <div style={{ aspectRatio: "16/10", backgroundImage: `url('${w.img}')`, backgroundSize: "cover", backgroundPosition: "top center" }} />
              <figcaption style={{ padding: "20px 22px 24px" }}>
                <div style={{ fontFamily: "Georgia, serif", fontSize: 21 }}>{w.t}</div>
                <div style={{ color: "var(--text-3)", fontSize: 14, marginTop: 6 }}>{w.s}</div>
              </figcaption>
            </figure>
          ))}
        </div>

        <div style={{ maxWidth: 900, margin: "clamp(48px,6vw,80px) auto 0", border: "1px solid rgba(var(--accent-rgb),.3)", background: "rgba(var(--accent-rgb),.05)", padding: "clamp(28px,3.4vw,44px)" }}>
          <div style={{ fontSize: 10, letterSpacing: ".26em", textTransform: "uppercase", color: "var(--accent)" }}>{PROOF.caseStudy.eyebrow}</div>
          <h3 style={{ fontFamily: "Georgia, serif", fontWeight: 400, fontSize: "clamp(24px,2.4vw,34px)", margin: "14px 0 0" }}>{PROOF.caseStudy.h3}</h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "clamp(24px,4vw,56px)", marginTop: 26 }}>
            {PROOF.caseStudy.stats.map((s) => (
              <div key={s.l}>
                <div style={{ fontFamily: "Georgia, serif", fontSize: "clamp(30px,3.2vw,44px)", color: "var(--text)" }}>{s.n}</div>
                <div style={{ color: "var(--text-3)", fontSize: 13.5, marginTop: 4, maxWidth: "22ch" }}>{s.l}</div>
              </div>
            ))}
          </div>
          <a href={PROOF.caseStudy.link.href} style={{ display: "inline-block", marginTop: 28, fontSize: 10, letterSpacing: ".24em", textTransform: "uppercase", color: "var(--accent)", textDecoration: "none" }}>
            {PROOF.caseStudy.link.label}
          </a>
        </div>
      </Section>


      {/* ---------- who — placed AFTER he already agrees ---------- */}
      <Section id="about" tone="light">
        <Eyebrow>{WHO.eyebrow}</Eyebrow>
        <H2>{WHO.h2}</H2>
        <div style={{ maxWidth: "68ch", margin: "clamp(30px,4vw,50px) auto 0" }}>
          {WHO.paragraphs.map((p, i) => (
            <p key={i} style={{ color: "var(--text-2)", fontSize: "clamp(16px,1.25vw,19px)", lineHeight: 1.9, margin: "0 0 22px", fontWeight: 300 }}>{p}</p>
          ))}
          <div style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 27, marginTop: 30 }}>
            {WHO.signature.name}
            <small style={{ display: "block", fontStyle: "normal", fontSize: 10, letterSpacing: ".26em", textTransform: "uppercase", color: "var(--accent)", marginTop: 10, fontWeight: 400 }}>
              {WHO.signature.role}
            </small>
          </div>
        </div>
      </Section>

      {/* ---------- the ask ---------- */}
      <Section id="contact" tone="raised" tight>
        <div style={{ textAlign: "center" }}>
          <Eyebrow>{ASK.eyebrow}</Eyebrow>
          <H2>{ASK.h2}</H2>
          <Lede>{ASK.lede}</Lede>
          <a href={ASK.cta.href} style={{
            display: "inline-block", marginTop: 36, padding: "17px 46px", border: "1px solid var(--accent)",
            background: "rgba(0,0,0,.34)", color: "var(--accent-soft)", textDecoration: "none",
            fontSize: 11, letterSpacing: ".24em", textTransform: "uppercase",
          }}>{ASK.cta.label}</a>
        </div>
      </Section>

      <SiteFooter />
    </main>
  );
}
