// THE BOARD — the roster.
//
// Fifteen vendors sit under one client and every one of their dashboards sees exactly one vendor.
// Nothing anywhere answers "is this customer's machine healthy," so this does. Design and the full
// list of joints: ~/SJC/CEO/_ops/JOINT-MONITORING-DESIGN.md
//
// ⛔ EVERY TILE SAYS WHEN IT LAST LOOKED, in its primary text and never in a tooltip. A board that
// claims "all good" without saying "as of when" is the placebo this whole thing exists to refuse —
// green here is a positive claim with a timestamp, not the absence of an alarm.
//
// This page is deliberately ONE SCREEN whatever the client count: the four counts, then one line
// per owner. The tiles moved to ./[owner] — see the note at the top of ./shared.tsx for why.
//
// Owner-only: /edit/* is gated in middleware.ts.
import Link from "next/link";
import { ageText, type Colour } from "@/lib/checksShared";
import { readBoardView, summarise } from "./groups";
import { Dot, FOOTNOTE, SWATCH } from "./shared";

export const dynamic = "force-dynamic";

export default async function BoardPage() {
  const view = await readBoardView();

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px 80px" }}>
      {/* "← All websites" lived here until the rail took over global navigation. */}
      <h1 style={{ fontSize: 34, fontWeight: 800, margin: "0 0 6px" }}>The board</h1>
      <p style={{ color: "#4b5563", margin: "0 0 4px", maxWidth: 720 }}>
        Every joint between the fifteen systems that carry a client. No vendor watches a joint —
        each end reports success on its own side — so this is the only place they meet.
      </p>
      <p style={{ color: "#6b7280", fontSize: 13, margin: "0 0 22px" }}>
        Green means <strong>verified recently</strong>, not &ldquo;nothing alarmed.&rdquo; If a
        check stops running, its tile goes yellow and then red on its own.
      </p>

      {/* The header count, across everybody. This is the glance the whole board exists for, so it
          stays on the roster — one page per customer would mean opening ten to learn nothing's
          wrong. Grey is surfaced beside the rest deliberately: an unmonitored joint is worse than
          a broken one, because it looks like nothing at all. */}
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
            <Dot colour={c} size={9} />
            {view.tally(c)} {SWATCH[c].label.toLowerCase()}
          </span>
        ))}
      </div>

      <p style={{ color: "#6b7280", fontSize: 13, margin: "0 0 26px" }}>
        {view.totalChecks} checks across {view.clientCount} client site(s) · last sweep{" "}
        {ageText(view.sweptAt)} · <a href="/api/cron/checks" style={{ color: "#2563eb" }}>run one now</a>
      </p>

      {/* One row per owner, worst first. Open a row for that owner's own board. */}
      <div style={{ display: "grid", gap: 10 }}>
        {view.groups.map((g) => {
          const sw = SWATCH[g.colour];
          return (
            <Link
              key={g.key}
              href={`/edit/board/${g.key}`}
              style={{
                display: "flex", alignItems: "center", gap: 14, textDecoration: "none",
                color: "inherit", background: sw.bg, border: `1px solid ${sw.border}`,
                borderRadius: 12, padding: "14px 16px",
              }}
            >
              <Dot colour={g.colour} size={12} />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#111827", overflowWrap: "anywhere" }}>
                  {g.title}
                </div>
                <div style={{ fontSize: 12.5, color: "#6b7280", marginTop: 2 }}>{g.subtitle}</div>
                <div style={{ fontSize: 13, color: "#374151", marginTop: 6 }}>{summarise(g)}</div>
              </div>
              <span style={{ fontSize: 20, color: "#9ca3af", flex: "0 0 auto" }} aria-hidden>
                ›
              </span>
            </Link>
          );
        })}
      </div>

      {FOOTNOTE}
    </div>
  );
}
