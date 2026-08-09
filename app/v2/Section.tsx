// ⛔ EVERY SECTION CARRIES ITS OWN PADDING AND MAX-WIDTH.
//
// This is the one rule that is expensive to fix later. A section that depends on a parent
// wrapper for its layout breaks the moment it is lifted out and placed on its own — which is
// exactly what the design studio does to it. Self-contained sections can be reordered, dropped
// onto another page, or deleted, and they still look right.

export function Section({
  id, children, tight = false,
}: { id?: string; children: React.ReactNode; tight?: boolean }) {
  return (
    <section id={id} style={{
      padding: tight
        ? "clamp(46px,6vw,84px) clamp(20px,5vw,60px)"
        : "clamp(64px,9vw,130px) clamp(20px,5vw,60px)",
      background: "var(--ink)",
      scrollMarginTop: 20,
    }}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>{children}</div>
    </section>
  );
}

export function Rule() {
  return (
    <div style={{ background: "var(--ink)" }}>
      <div style={{ height: 1, background: "rgba(var(--line),.08)", maxWidth: 1280, margin: "0 auto" }} />
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
      textAlign: left ? "left" : "center", margin: "24px 0 0", lineHeight: 1.15, color: "#fff",
    }}>{children}</h2>
  );
}

export function Lede({ children, left = false }: { children: React.ReactNode; left?: boolean }) {
  return (
    <p style={{
      maxWidth: "min(86ch,1180px)", margin: left ? "26px 0 0" : "26px auto 0",
      textAlign: left ? "left" : "center", color: "rgba(255,255,255,.66)",
      fontWeight: 300, lineHeight: 1.78, fontSize: "clamp(15px,1.32vw,21px)",
    }}>{children}</p>
  );
}
