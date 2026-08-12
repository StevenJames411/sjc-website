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
import { ageText } from "@/lib/checksShared";
import { navLabel } from "@/lib/editNav";
import { readBoardView, summarise, linesOf, SJC_KEY } from "./groups";
import Roster from "./Roster";
import { FOOTNOTE } from "./shared";
import SweepButton from "./SweepButton";

export const dynamic = "force-dynamic";

// Heading and tab both read the name Steven gave this screen in the rail. See lib/editNav.ts.
export async function generateMetadata() {
  return { title: await navLabel("board") };
}

/** "last looked 24m ago" — the oldest look in the row. A board with no timestamp is a placebo. */
function lookedAt(g: { rows: { st?: { lastRunAt?: string; lastPassAt?: string } }[] }): string {
  const times = g.rows.map((r) => r.st?.lastRunAt || r.st?.lastPassAt).filter(Boolean) as string[];
  return times.length ? `last looked ${ageText(times.sort()[0])}` : "";
}

/**
 * ⚠️ THIS DEFAULTS TO LIVE; THE DESIGN LIBRARY DEFAULTS TO ALL. The two screens answer different
 * questions and the defaults follow from that.
 *
 * The library is an INVENTORY — "what have I got" — so hiding six of seven websites by default
 * would be lying about the size of the thing.
 *
 * The board is TRIAGE — "what needs me". A draft site is unreachable by design, so every check on
 * it records `skipped` and its row is grey by definition. Six grey rows above the one amber row is
 * the signal buried in the thing that cannot break.
 */
export default async function BoardPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const tab = (await searchParams)?.view || "live";
  const [view, title] = await Promise.all([readBoardView(), navLabel("board")]);

  // The mainline is never filtered out — it is not a website, and if the shared floor is broken
  // every client is broken whatever you are looking at.
  const isMainline = (g: { key: string }) => g.key === SJC_KEY;
  const liveish = (st?: string) => st === "published" || st === "demo";
  const rows = view.groups.filter((g) => {
    if (isMainline(g)) return true;
    if (tab === "all") return true;
    if (tab === "draft") return !liveish(g.state);
    return liveish(g.state);
  });
  const counts = {
    live: view.groups.filter((g) => !isMainline(g) && liveish(g.state)).length,
    draft: view.groups.filter((g) => !isMainline(g) && !liveish(g.state)).length,
    all: view.groups.filter((g) => !isMainline(g)).length,
  };
  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px 80px" }}>
      {/* "← All websites" lived here until the rail took over global navigation. */}
      <h1 style={{ fontSize: 34, fontWeight: 800, margin: "0 0 6px" }}>{title}</h1>
      {/* ⚠️ NO DESCRIPTION PARAGRAPH. The pills below name what is watched and say what each one
          means, which is the same information the paragraph was carrying in longer form — and it
          sat above the data on every single visit. A screen you read once does not deserve
          permanent real estate. */}
      {/* ⛔ WHAT IS TRACKED, NOT WHAT COLOUR IT IS. This was four colour pills and a paragraph
          explaining them — six lines of prose before any data. Steven: *"this real estate is
          absolutely wasted… the three things we're tracking, that's the only thing that needs to be
          in it."*

          Colour was the wrong axis for a summary. "6 needs you soon" spread across three unrelated
          things is not something anyone can act on; "Lead destinations — 1 set, 6 not" is a job.
          The colours are still here, attached to the thing they describe. */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
        {view.byCheck.map((c) => (
          <span
            key={c.id}
            style={{
              display: "inline-flex",
              alignItems: "baseline",
              gap: 7,
              border: "1px solid var(--e-line)",
              borderRadius: 999,
              padding: "6px 14px",
              fontSize: 12.5,
            }}
          >
            <span style={{ fontWeight: 700 }}>{c.label}</span>
            <span style={{ color: "var(--e-muted)" }}>{c.says}</span>
          </span>
        ))}
      </div>

      <p style={{ color: "var(--e-muted)", fontSize: 12.5, margin: "0 0 26px" }}>
        {view.totalChecks} checks across {view.clientCount} website(s) &middot; last sweep{" "}
        {ageText(view.sweptAt)} &middot; <SweepButton />
      </p>

      {/* One row per owner, in the order Steven dragged them into. */}
      {/* Same shape as the Design Library's canvases, and for the same reason: each is an address
          you can land on, not a toggle held in memory. */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", margin: "0 0 18px" }}>
        {([
          ["live", "Live", counts.live],
          ["draft", "Draft", counts.draft],
          ["all", "All", counts.all],
        ] as const).map(([key, label, n]) => (
          <a
            key={key}
            href={key === "live" ? "/edit/board" : `/edit/board?view=${key}`}
            title={
              key === "live"
                ? "Websites anyone can actually reach — the ones that can break"
                : key === "draft"
                  ? "Draft and archived: nothing to check, so nothing to report"
                  : "Every website"
            }
            style={{
              background: tab === key ? "var(--e-ink)" : "var(--e-panel)",
              color: tab === key ? "var(--e-panel)" : "var(--e-muted)",
              border: `1px solid ${tab === key ? "var(--e-ink)" : "var(--e-line)"}`,
              borderRadius: 999,
              padding: "6px 14px",
              fontSize: 13,
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            {label} <span style={{ opacity: 0.6 }}>{n}</span>
          </a>
        ))}
      </div>

      <Roster
        rows={rows.map((g) => ({
          key: g.key,
          title: g.title,
          subtitle: g.subtitle,
          summary: summarise(g),
          colour: g.colour,
          lines: linesOf(g),
          state: g.state,
          looked: lookedAt(g),
        }))}
      />

      {FOOTNOTE}
    </div>
  );
}
