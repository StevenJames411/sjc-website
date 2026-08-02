// THE BOARD.
//
// Fifteen vendors sit under one client and every one of their dashboards sees exactly one vendor.
// Nothing anywhere answers "is this customer's machine healthy," so this does. Design and the full
// list of joints: ~/SJC/CEO/_ops/JOINT-MONITORING-DESIGN.md
//
// ⛔ EVERY TILE SAYS WHEN IT LAST LOOKED, in its primary text and never in a tooltip. A board that
// claims "all good" without saying "as of when" is the placebo this whole thing exists to refuse —
// green here is a positive claim with a timestamp, not the absence of an alarm.
//
// Owner-only: /edit/* is gated in middleware.ts.
import Link from "next/link";
import { CHECKS, readBoard } from "@/lib/checks";
import { colourFor, ageText, worst, LAYER_LABEL, type Colour, type Layer } from "@/lib/checksShared";
import { readSites } from "@/lib/sites";

export const dynamic = "force-dynamic";

const SWATCH: Record<Colour, { dot: string; bg: string; border: string; label: string }> = {
  green: { dot: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0", label: "Verified" },
  yellow: { dot: "#d97706", bg: "#fffbeb", border: "#fde68a", label: "Needs you soon" },
  red: { dot: "#dc2626", bg: "#fef2f2", border: "#fecaca", label: "Broken now" },
  // Grey covers two things that behave the same way: never run, and nothing to check yet (a demo
  // with no domain). Both are unproven squares rather than problems, and both stay visible in the
  // header count — an unmonitored joint is worse than a broken one, because it looks like nothing.
  grey: { dot: "#9ca3af", bg: "#f9fafb", border: "#e5e7eb", label: "Nothing proven yet" },
};

export default async function BoardPage() {
  const [board, sites] = await Promise.all([readBoard(), readSites()]);
  const nameOf = new Map(sites.map((s) => [s.id, s.business?.name || s.name || s.id]));
  const stateFor = (checkId: string, siteId?: string) =>
    board.states.find((s) => s.checkId === checkId && (s.siteId || "") === (siteId || ""));

  const rows = CHECKS.flatMap((def) => {
    if (def.scope === "global") {
      const st = stateFor(def.id);
      return [{ def, siteId: undefined as string | undefined, st, colour: colourFor(def, st) }];
    }
    return sites
      .filter((s) => s.kind === "client" && !s.deletedAt)
      .map((s) => {
        const st = stateFor(def.id, s.id);
        return { def, siteId: s.id, st, colour: colourFor(def, st) };
      });
  });

  const tally = (c: Colour) => rows.filter((r) => r.colour === c).length;
  const overall = worst(rows.map((r) => r.colour));
  const layers: Layer[] = [1, 2, 3];

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px 80px" }}>
      <Link href="/edit" style={{ fontSize: 14, color: "#4b5563", textDecoration: "none" }}>
        ← All websites
      </Link>

      <h1 style={{ fontSize: 34, fontWeight: 800, margin: "18px 0 6px" }}>The board</h1>
      <p style={{ color: "#4b5563", margin: "0 0 4px", maxWidth: 720 }}>
        Every joint between the fifteen systems that carry a client. No vendor watches a joint —
        each end reports success on its own side — so this is the only place they meet.
      </p>
      <p style={{ color: "#6b7280", fontSize: 13, margin: "0 0 22px" }}>
        Green means <strong>verified recently</strong>, not &ldquo;nothing alarmed.&rdquo; If a
        check stops running, its tile goes yellow and then red on its own.
      </p>

      {/* The header count. Grey is surfaced beside the rest deliberately — an unmonitored joint is
          worse than a broken one, because it looks like nothing at all. */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 8 }}>
        {(["red", "yellow", "grey", "green"] as Colour[]).map((c) => (
          <span
            key={c}
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: SWATCH[c].bg, border: `1px solid ${SWATCH[c].border}`,
              borderRadius: 999, padding: "6px 14px", fontSize: 13, fontWeight: 600,
            }}
          >
            <span style={{ width: 9, height: 9, borderRadius: 999, background: SWATCH[c].dot }} />
            {tally(c)} {SWATCH[c].label.toLowerCase()}
          </span>
        ))}
      </div>

      <p style={{ color: "#6b7280", fontSize: 13, margin: "0 0 26px" }}>
        {rows.length} checks across {sites.filter((s) => s.kind === "client" && !s.deletedAt).length}{" "}
        client site(s) · last sweep {ageText(board.updatedAt)} ·{" "}
        <a href="/api/cron/checks" style={{ color: "#2563eb" }}>run one now</a>
        {overall === "grey" ? " — nothing has run yet, so every tile is honest about knowing nothing." : ""}
      </p>

      {layers.map((layer) => {
        const inLayer = rows.filter((r) => r.def.layer === layer);
        if (!inLayer.length) return null;
        return (
          <section key={layer} style={{ marginBottom: 34 }}>
            <h2 style={{ fontSize: 13, fontWeight: 700, letterSpacing: 0.6, textTransform: "uppercase", color: "#6b7280", margin: "0 0 12px" }}>
              Layer {layer} — {LAYER_LABEL[layer]}
            </h2>
            <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))" }}>
              {inLayer.map((r) => {
                const sw = SWATCH[r.colour];
                return (
                  <div
                    key={`${r.def.id}::${r.siteId || ""}`}
                    style={{
                      background: sw.bg, border: `1px solid ${sw.border}`, borderRadius: 12,
                      padding: 16, minWidth: 0,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <span style={{ width: 10, height: 10, borderRadius: 999, background: sw.dot, flex: "0 0 auto" }} />
                      <strong style={{ fontSize: 15 }}>{r.def.label}</strong>
                    </div>

                    {r.siteId && (
                      <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 6 }}>
                        {nameOf.get(r.siteId) || r.siteId}
                      </div>
                    )}

                    {/* THE AGE IS THE PRIMARY TEXT. Not a tooltip, not a hover. */}
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#111827", marginBottom: 8 }}>
                      {r.st?.lastPassAt
                        ? `Verified ${ageText(r.st.lastPassAt)}`
                        : r.st?.lastRunAt
                          ? `Last looked ${ageText(r.st.lastRunAt)} — has never passed`
                          : "Never checked"}
                    </div>

                    <div style={{ fontSize: 13, color: "#374151", marginBottom: 10 }}>
                      {r.st?.lastDetail || r.def.expectation}
                    </div>

                    {(r.colour === "red" || r.colour === "yellow") && (
                      <details>
                        <summary style={{ fontSize: 12, fontWeight: 600, color: "#4b5563", cursor: "pointer" }}>
                          What to do
                        </summary>
                        <p style={{ fontSize: 12.5, color: "#4b5563", margin: "8px 0 0", lineHeight: 1.5 }}>
                          {r.def.runbook}
                        </p>
                      </details>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}

      <p style={{ color: "#9ca3af", fontSize: 12, marginTop: 30, lineHeight: 1.6 }}>
        This first pass carries only checks that need no new credentials. The rest of the fifteen
        vendors, the thirty-one joints and the end-to-end lead heartbeat are specified in
        <code style={{ margin: "0 4px" }}>~/SJC/CEO/_ops/JOINT-MONITORING-DESIGN.md</code>.
        A vendor whose key is not set records <em>skipped</em>, never <em>passed</em>.
      </p>
    </div>
  );
}
