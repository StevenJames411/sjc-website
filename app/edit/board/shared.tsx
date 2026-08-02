// The board's shared parts: the colour swatch, one tile, and the layer sections.
//
// ── WHY THE BOARD IS TWO PAGES ────────────────────────────────────────────────────────────────
// Every check fans out one row per client, so the single-page version repeated the same eight
// headlines for every customer and the ONLY thing telling two tiles apart was a grey subtitle.
// At two clients that's survivable; at ten it's forty tiles reading "Their domain registration is
// not about to lapse" and you scan subtitles to find anybody.
//
// So /edit/board is now a ROSTER — one row per owner, keyed by the DOMAIN, because the domain is
// how Steven identifies a customer — and /edit/board/<id> is that one customer's board carrying
// the tiles below. The header counts stay on the roster: the whole point of the board is the one
// glance that says nothing is on fire, and ten pages you have to open is not a glance.
//
// The layer split (vendor watches itself / the joint nobody watches / did the outcome happen) is
// real INSIDE one customer. Across customers it was noise, which is why it lives here and not on
// the roster.
import { ageText, LAYER_LABEL, type CheckDef, type CheckState, type Colour, type Layer } from "@/lib/checksShared";

export const SWATCH: Record<Colour, { dot: string; bg: string; border: string; label: string }> = {
  green: { dot: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0", label: "Verified" },
  yellow: { dot: "#d97706", bg: "#fffbeb", border: "#fde68a", label: "Needs you soon" },
  red: { dot: "#dc2626", bg: "#fef2f2", border: "#fecaca", label: "Broken now" },
  // Grey covers two things that behave the same way: never run, and nothing to check yet (a demo
  // with no domain). Both are unproven squares rather than problems, and both stay visible in the
  // header count — an unmonitored joint is worse than a broken one, because it looks like nothing.
  grey: { dot: "#9ca3af", bg: "#f9fafb", border: "#e5e7eb", label: "Nothing proven yet" },
};

export type Row = { def: CheckDef; st?: CheckState; colour: Colour };

export function Dot({ colour, size = 10 }: { colour: Colour; size?: number }) {
  return (
    <span
      style={{
        width: size, height: size, borderRadius: 999,
        background: SWATCH[colour].dot, flex: "0 0 auto",
      }}
    />
  );
}

function Tile({ row }: { row: Row }) {
  const sw = SWATCH[row.colour];
  return (
    <div style={{ background: sw.bg, border: `1px solid ${sw.border}`, borderRadius: 12, padding: 16, minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <Dot colour={row.colour} />
        <strong style={{ fontSize: 15 }}>{row.def.label}</strong>
      </div>

      {/* THE AGE IS THE PRIMARY TEXT. Not a tooltip, not a hover. */}
      <div style={{ fontSize: 13, fontWeight: 600, color: "#111827", marginBottom: 8 }}>
        {row.st?.lastPassAt
          ? `Verified ${ageText(row.st.lastPassAt)}`
          : row.st?.lastRunAt
            ? `Last looked ${ageText(row.st.lastRunAt)} — has never passed`
            : "Never checked"}
      </div>

      <div style={{ fontSize: 13, color: "#374151", marginBottom: 10 }}>
        {row.st?.lastDetail || row.def.expectation}
      </div>

      {(row.colour === "red" || row.colour === "yellow") && (
        <details>
          <summary style={{ fontSize: 12, fontWeight: 600, color: "#4b5563", cursor: "pointer" }}>
            What to do
          </summary>
          <p style={{ fontSize: 12.5, color: "#4b5563", margin: "8px 0 0", lineHeight: 1.5 }}>
            {row.def.runbook}
          </p>
        </details>
      )}
    </div>
  );
}

/** One owner's checks, grouped by which layer was supposed to be watching. */
export function LayerSections({ rows }: { rows: Row[] }) {
  const layers: Layer[] = [1, 2, 3];
  return (
    <>
      {layers.map((layer) => {
        const inLayer = rows.filter((r) => r.def.layer === layer);
        if (!inLayer.length) return null;
        return (
          <section key={layer} style={{ marginBottom: 34 }}>
            <h2 style={{ fontSize: 13, fontWeight: 700, letterSpacing: 0.6, textTransform: "uppercase", color: "#6b7280", margin: "0 0 12px" }}>
              Layer {layer} — {LAYER_LABEL[layer]}
            </h2>
            <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))" }}>
              {inLayer.map((r) => (
                <Tile key={r.def.id} row={r} />
              ))}
            </div>
          </section>
        );
      })}
    </>
  );
}

export const FOOTNOTE = (
  <p style={{ color: "#9ca3af", fontSize: 12, marginTop: 30, lineHeight: 1.6 }}>
    This first pass carries only checks that need no new credentials. The rest of the fifteen
    vendors, the thirty-one joints and the end-to-end lead heartbeat are specified in
    <code style={{ margin: "0 4px" }}>~/SJC/CEO/_ops/JOINT-MONITORING-DESIGN.md</code>.
    A vendor whose key is not set records <em>skipped</em>, never <em>passed</em>.
  </p>
);
