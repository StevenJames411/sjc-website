// Who owns which checks, and how one owner rolls up into a single roster line.
//
// Two kinds of owner, and the distinction matters:
//
//   SJC ITSELF — the global checks. The durable store and the one sending domain are not any
//   customer's; they sit under all of them. Before this split they rendered as bare tiles with no
//   subtitle, so they'd have been read as belonging to whoever happened to be listed first. They
//   get their own pinned row at the top, because if the shared floor is broken every client is
//   broken and no per-client tile will say so.
//
//   A CLIENT — the per-site checks, fanned out one row per client site.
import { CHECKS, readBoard } from "@/lib/checks";
import { colourFor, worst, ageText, type Colour } from "@/lib/checksShared";
import { publicUrlFor } from "@/lib/hostShared";
import { readSites } from "@/lib/sites";
import type { Row } from "./shared";

/** The roster key for the global row. Leading underscore — a slugified site id can never be this. */
export const SJC_KEY = "_sjc";

export type Group = {
  key: string;
  /** THE DOMAIN. This is how Steven identifies a customer at a glance, so it is the headline. */
  title: string;
  subtitle: string;
  rows: Row[];
  colour: Colour;
};

export type BoardView = {
  groups: Group[];
  totalChecks: number;
  clientCount: number;
  sweptAt?: string;
  tally: (c: Colour) => number;
};

/** Bare hostname — no scheme, no trailing slash. The thing he actually reads. */
function hostOf(site: { id: string; domain?: string }): string {
  return publicUrlFor(site).replace(/^https?:\/\//, "").replace(/\/+$/, "");
}

export async function readBoardView(): Promise<BoardView> {
  const [board, sites] = await Promise.all([readBoard(), readSites()]);
  const clients = sites.filter((s) => s.kind === "client" && !s.deletedAt);

  const stateFor = (checkId: string, siteId?: string) =>
    board.states.find((s) => s.checkId === checkId && (s.siteId || "") === (siteId || ""));

  const rowsFor = (scope: "global" | "site", siteId?: string): Row[] =>
    CHECKS.filter((def) => def.scope === scope).map((def) => {
      const st = stateFor(def.id, siteId);
      return { def, st, colour: colourFor(def, st) };
    });

  const globalRows = rowsFor("global");
  const groups: Group[] = [
    {
      key: SJC_KEY,
      title: "SJC itself",
      subtitle: "The store and the sending domain that sit under every client",
      rows: globalRows,
      colour: worst(globalRows.map((r) => r.colour)),
    },
    ...clients.map((s) => {
      const rows = rowsFor("site", s.id);
      return {
        key: s.id,
        title: hostOf(s),
        subtitle: s.business?.name || s.name || s.id,
        rows,
        colour: worst(rows.map((r) => r.colour)),
      };
    }),
  ];

  // Worst-first among the clients so the problem floats to the top of a long list and you never
  // scroll to find it. SJC stays pinned at index 0 whatever colour it is — it's the floor, not a
  // peer, and a row that moves around is a row you have to hunt for.
  const RANK: Colour[] = ["red", "yellow", "grey", "green"];
  const [sjc, ...rest] = groups;
  rest.sort((a, b) => RANK.indexOf(a.colour) - RANK.indexOf(b.colour) || a.title.localeCompare(b.title));

  const all = groups.flatMap((g) => g.rows);
  return {
    groups: [sjc, ...rest],
    totalChecks: all.length,
    clientCount: clients.length,
    sweptAt: board.updatedAt,
    tally: (c: Colour) => all.filter((r) => r.colour === c).length,
  };
}

/**
 * The one line under a roster row.
 *
 * All green says "all N verified <age>" using the OLDEST pass in the group, because that is the
 * only honest reading — everything here was verified at least this recently. Anything else leads
 * with what's wrong and how many, worst first.
 */
export function summarise(group: Group): string {
  const RANK: Colour[] = ["red", "yellow", "grey", "green"];
  const n = group.rows.length;
  if (!n) return "Nothing watched here yet";

  if (group.colour === "green") {
    const oldest = group.rows
      .map((r) => r.st?.lastPassAt)
      .filter(Boolean)
      .sort()[0];
    return `All ${n} verified ${ageText(oldest)}`;
  }

  const parts = RANK.filter((c) => group.rows.some((r) => r.colour === c)).map((c) => {
    const count = group.rows.filter((r) => r.colour === c).length;
    const word =
      c === "red" ? "broken now" : c === "yellow" ? "needs you soon" : c === "grey" ? "nothing proven yet" : "verified";
    return `${count} ${word}`;
  });

  const looked = group.rows
    .map((r) => r.st?.lastRunAt)
    .filter(Boolean)
    .sort()
    .pop();
  return `${parts.join(" · ")} · last looked ${ageText(looked)}`;
}
