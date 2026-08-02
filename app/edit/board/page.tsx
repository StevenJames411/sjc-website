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
import { ageText, type Colour } from "@/lib/checksShared";
import { readBoardView, summarise } from "./groups";
import Roster from "./Roster";
import { Dot, FOOTNOTE, SWATCH } from "./shared";

export const dynamic = "force-dynamic";

export default async function BoardPage() {
  const view = await readBoardView();
  // ⛔ THE ROWS NO LONGER RE-SORT THEMSELVES, so the count has to be the thing that finds trouble.
  // Each pill with a non-zero count jumps to the first owner in that state. Steven's arrangement
  // stays put and the broken row is still one click away — instead of the row coming to him and
  // his arrangement being rearranged behind his back.
  const firstIn = (c: Colour) => view.groups.find((g) => g.colour === c)?.key;

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px 80px" }}>
      {/* "← All websites" lived here until the rail took over global navigation. */}
      <h1 style={{ fontSize: 34, fontWeight: 800, margin: "0 0 6px" }}>The board</h1>
      <p style={{ color: "var(--e-muted)", margin: "0 0 4px", maxWidth: 720 }}>
        Every joint between the fifteen systems that carry a client. No vendor watches a joint —
        each end reports success on its own side — so this is the only place they meet.
      </p>
      <p style={{ color: "var(--e-muted)", fontSize: 13, margin: "0 0 22px" }}>
        Green means <strong>verified recently</strong>, not &ldquo;nothing alarmed.&rdquo; If a
        check stops running, its tile goes yellow and then red on its own.
      </p>

      {/* The header count, across everybody. This is the glance the whole board exists for, so it
          stays on the roster — one page per customer would mean opening ten to learn nothing's
          wrong. Grey is surfaced beside the rest deliberately: an unmonitored joint is worse than
          a broken one, because it looks like nothing at all. */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 8 }}>
        {(["red", "yellow", "grey", "green"] as Colour[]).map((c) => {
          const jump = view.tally(c) ? firstIn(c) : undefined;
          const style = {
            display: "inline-flex", alignItems: "center", gap: 8,
            background: SWATCH[c].bg, border: `1px solid ${SWATCH[c].border}`,
            borderRadius: 999, padding: "6px 14px", fontSize: 13, fontWeight: 600,
            color: "inherit", textDecoration: "none",
          } as const;
          const body = (
            <>
              <Dot colour={c} size={9} />
              {view.tally(c)} {SWATCH[c].label.toLowerCase()}
            </>
          );
          return jump ? (
            <a key={c} href={`#row-${jump}`} style={style} title="Jump to the first one">
              {body}
            </a>
          ) : (
            <span key={c} style={style}>{body}</span>
          );
        })}
      </div>

      <p style={{ color: "var(--e-muted)", fontSize: 13, margin: "0 0 26px" }}>
        {view.totalChecks} checks across {view.clientCount} client site(s) · last sweep{" "}
        {ageText(view.sweptAt)} · <a href="/api/cron/checks" style={{ color: "var(--e-accent)" }}>run one now</a>
      </p>

      {/* One row per owner, in the order Steven dragged them into. */}
      <Roster
        rows={view.groups.map((g) => ({
          key: g.key,
          title: g.title,
          subtitle: g.subtitle,
          summary: summarise(g),
          colour: g.colour,
        }))}
      />

      {FOOTNOTE}
    </div>
  );
}
