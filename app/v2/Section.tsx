// ⛔ EVERY SECTION CARRIES ITS OWN PADDING, MAX-WIDTH AND TONE.
//
// Two rules live here, both of which are expensive to fix later:
//
// ① A section that depends on a parent wrapper for its layout breaks the moment it is lifted
//    out and placed on its own — which is exactly what the design studio does to it.
//
// ② ⛔ TONE IS A PROPERTY OF THE SECTION, NOT OF THE PAGE. One ground the whole way down reads
//    flat. But a light section is not just a different background — the type has to invert with
//    it. So each tone declares a full set of local tokens (background, panel, three text
//    weights, border tint) and everything inside reads from those. Change a section's tone and
//    the type follows automatically; hardcode a white anywhere and it will be invisible the
//    first time that section goes light.

type Tone = "ink" | "raised" | "light";

const TONES: Record<Tone, React.CSSProperties> = {
  // the base ground — whatever the palette's ink is
  ink: {
    ["--bg" as string]: "var(--ink)",
    ["--panel" as string]: "var(--surface)",
    ["--text" as string]: "#fff",
    ["--text-2" as string]: "rgba(255,255,255,.72)",
    ["--text-3" as string]: "rgba(255,255,255,.5)",
    ["--edge" as string]: "var(--line)",
  },
  // one step up — reads as a different room without leaving the dark
  raised: {
    ["--bg" as string]: "var(--surface)",
    ["--panel" as string]: "var(--surface-2)",
    ["--text" as string]: "#fff",
    ["--text-2" as string]: "rgba(255,255,255,.72)",
    ["--text-3" as string]: "rgba(255,255,255,.5)",
    ["--edge" as string]: "var(--line)",
  },
  // the inversion — dark type on near-white, for the sections that should feel like a document.
  //
  // ⛔ IT ALSO SWAPS THE ACCENT. Every palette accent is tuned to glow on near-black; on
  // near-white the same colour reads at ~2.6:1 and the eyebrows vanish. Redefining --accent
  // locally means every child that already says var(--accent) darkens on its own — no child
  // component needs to know which ground it landed on.
  //
  // ⚠️ Fallbacks are deliberate: the palette switcher is demo-only and gets deleted, so these
  // tokens must still resolve to something sane when nothing is defining them.
  light: {
    ["--bg" as string]: "var(--light-bg, #f3f2ef)",
    ["--panel" as string]: "var(--light-panel, #fffefc)",
    ["--text" as string]: "#14161a",
    ["--text-2" as string]: "rgba(20,22,26,.75)",
    ["--text-3" as string]: "rgba(20,22,26,.55)",
    ["--edge" as string]: "20,22,26",
    ["--accent" as string]: "var(--accent-deep, #8a6d10)",
    ["--accent-rgb" as string]: "var(--accent-deep-rgb, 138,109,16)",
    ["--accent-soft" as string]: "var(--accent-deep, #8a6d10)",
  },
};

export function Section({
  id, children, tight = false, tone = "ink",
}: { id?: string; children: React.ReactNode; tight?: boolean; tone?: Tone }) {
  return (
    <section id={id} style={{
      ...TONES[tone],
      padding: tight
        ? "clamp(46px,6vw,84px) clamp(20px,5vw,60px)"
        : "clamp(64px,9vw,130px) clamp(20px,5vw,60px)",
      background: "var(--bg)",
      color: "var(--text)",
      scrollMarginTop: 90,   // clears the fixed header
    }}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>{children}</div>
    </section>
  );
}

// ⚠️ The rule sat on its own ground and left a seam between two differently-toned sections.
// It now inherits whatever it is placed on.
export function Rule({ tone = "ink" }: { tone?: Tone }) {
  return (
    <div style={{ ...TONES[tone], background: "var(--bg)" }}>
      <div style={{ height: 1, background: "rgba(var(--edge),.1)", maxWidth: 1280, margin: "0 auto" }} />
    </div>
  );
}

export function Eyebrow({ children, left = false }: { children: React.ReactNode; left?: boolean }) {
  return (
    <div style={{
      fontSize: "clamp(15px,1.35vw,19px)", letterSpacing: ".3em", textTransform: "uppercase",
      color: "var(--accent)", textAlign: left ? "left" : "center", fontWeight: 500,
    }}>{children}</div>
  );
}

export function H2({ children, left = false }: { children: React.ReactNode; left?: boolean }) {
  return (
    <h2 style={{
      fontFamily: "Georgia, serif", fontWeight: 300, fontSize: "clamp(27px,3.8vw,52px)",
      textAlign: left ? "left" : "center", margin: "24px 0 0", lineHeight: 1.15, color: "var(--text)",
    }}>{children}</h2>
  );
}

export function Lede({ children, left = false }: { children: React.ReactNode; left?: boolean }) {
  return (
    <p style={{
      maxWidth: "min(86ch,1180px)", margin: left ? "26px 0 0" : "26px auto 0",
      textAlign: left ? "left" : "center", color: "var(--text-2)",
      fontWeight: 300, lineHeight: 1.78, fontSize: "clamp(15px,1.32vw,21px)",
    }}>{children}</p>
  );
}
