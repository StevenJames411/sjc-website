import { BRAND, FOOTER } from "./content";

// GLOBAL FOOTER — the pair to SiteHeader. Every business needs one, it is identical on every
// page, and it is edited once. Self-contained: its own padding and max-width, so it survives
// being lifted out and placed by the studio rather than inheriting layout from a parent.

export default function SiteFooter() {
  return (
    <footer style={{
      borderTop: "1px solid rgba(var(--line),.08)",
      padding: "clamp(52px,7vw,90px) clamp(20px,5vw,60px) clamp(30px,4vw,44px)",
      background: "var(--ink)",
    }}>
      {/* ⚠️ auto-fit kept three columns alive on a phone and squeezed the first one to one
          word per line. Below 820px it stacks outright. */}
      <style>{`
        .ft-grid{display:grid;gap:clamp(32px,5vw,64px);max-width:1280px;margin:0 auto;
          grid-template-columns:minmax(0,1.4fr) repeat(auto-fit,minmax(180px,1fr))}
        @media (max-width:820px){ .ft-grid{grid-template-columns:1fr;gap:38px} }
        .ft-fine{display:flex;flex-wrap:wrap;gap:14px;justify-content:space-between}
        @media (max-width:820px){ .ft-fine{flex-direction:column;gap:8px} }
      `}</style>
      <div className="ft-grid">
        <div>
          <a href={BRAND.href} style={{ textDecoration: "none", color: "var(--accent-soft)", fontFamily: "Georgia, serif", lineHeight: 1.05 }}>
            <span style={{ display: "block", fontSize: 24, letterSpacing: ".06em", fontWeight: 500 }}>
              {BRAND.nameTop.split(" ").map((w) => (
                <span key={w}>{w[0]}<span style={{ fontSize: ".78em" }}>{w.slice(1).toUpperCase()}</span>{" "}</span>
              ))}
            </span>
            <span style={{ display: "block", fontSize: 9.5, letterSpacing: ".32em", textTransform: "uppercase", marginTop: ".5em", color: "var(--accent)" }}>
              {BRAND.nameSub}
            </span>
          </a>
          <p style={{ margin: "20px 0 0", maxWidth: "38ch", color: "rgba(255,255,255,.5)", fontSize: 14.5, lineHeight: 1.8, fontWeight: 300 }}>
            {FOOTER.closing}
          </p>
        </div>

        {FOOTER.columns.map((col) => (
          <div key={col.title}>
            <div style={{ fontSize: 10, letterSpacing: ".24em", textTransform: "uppercase", color: "var(--accent)", marginBottom: 16 }}>
              {col.title}
            </div>
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 11 }}>
              {col.links.map((l) => (
                <li key={l.href}>
                  <a href={l.href} style={{ color: "rgba(255,255,255,.62)", textDecoration: "none", fontSize: 14.5, display: "block" }}>
                    {l.label}
                    {"line" in l && (l as { line?: string }).line && (
                      <span style={{ display: "block", marginTop: 3, fontSize: 12.5, color: "rgba(255,255,255,.36)", fontWeight: 300, lineHeight: 1.5 }}>
                        {(l as { line?: string }).line}
                      </span>
                    )}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="ft-fine" style={{
        maxWidth: 1280, margin: "clamp(38px,5vw,60px) auto 0", paddingTop: 22,
        borderTop: "1px solid rgba(var(--line),.06)",
        color: "rgba(255,255,255,.32)", fontSize: 12.5, fontWeight: 300,
      }}>
        <span>{FOOTER.legalLeft}</span>
        <span>{FOOTER.legalRight}</span>
      </div>
    </footer>
  );
}
