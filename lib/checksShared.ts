// The colour rule, and nothing else. PURE — no storage, no next/headers, safe in the browser.
//
// Split from ./checks for the same reason hostShared is split from host: the board renders in a
// client component and it has to reach the same verdict the runner did. Two copies of this
// arithmetic is how a tile says green while the runner thinks otherwise.

export type CheckStatus = "pass" | "warn" | "fail" | "skipped";
export type Colour = "green" | "yellow" | "red" | "grey";

/** Which of the three layers a check belongs to. Layer decides who is supposed to be watching. */
export type Layer =
  | 1 // the vendor watches itself — billing, expiry, suspension
  | 2 // the JOINT between two vendors — nobody owns this, which is the whole point
  | 3; // did the outcome actually happen — nothing reports it unless we build it

export type CheckDef = {
  id: string;
  label: string;
  layer: Layer;
  /** What this is watching. `site` checks fan out one row per client. */
  scope: "global" | "site";
  /** Human sentence: what has to be true for this to pass. Rendered on the tile. */
  expectation: string;
  /** What to DO when it goes red. Rendered on the tile — a runbook nobody can find is not one. */
  runbook: string;
  /** How often it's SUPPOSED to run, seconds. */
  cadenceSeconds: number;
  /** Newer than this to be GREEN. */
  freshSeconds: number;
  /** No successful verification in this long is RED on its own, whatever else is true. */
  staleSeconds: number;
};

export type CheckRun = {
  checkId: string;
  siteId?: string;
  status: CheckStatus;
  /** The human sentence, already written by the runner. */
  detail: string;
  /**
   * ⚠️ WHAT IT ACTUALLY OBSERVED. A `pass` carrying nothing is a lie the board renders happily,
   * so the runner is required to put the evidence here — an HTTP status, a row number, an expiry
   * date. Same rule as receipt_ok() in the sync scripts: a receipt without the receipt isn't one.
   */
  evidence: Record<string, unknown>;
  at: string; // ISO
  latencyMs?: number;
};

export type CheckState = {
  checkId: string;
  siteId?: string;
  lastRunAt?: string;
  lastPassAt?: string;
  lastStatus?: CheckStatus;
  lastDetail?: string;
  lastEvidence?: Record<string, unknown>;
  consecutiveFails: number;
  /** When the CURRENT status began — so a tile can say "red for 3 days". */
  since?: string;
};

export type Board = {
  updatedAt?: string;
  states: CheckState[];
};

/**
 * THE COLOUR RULE.
 *
 * ⛔ GREEN MEANS "VERIFIED RECENTLY", NOT "NOTHING ALARMED". That is the entire design, and every
 * other property here falls out of it:
 *
 *   1. Green is a POSITIVE claim with a timestamp. It requires a pass AND that pass being inside
 *      freshSeconds. Nothing ever reaches green by simply not failing.
 *   2. Silence DECAYS. No runs at all walks grey -> yellow -> red without anyone reporting
 *      anything, so a dead cron or a dead deployment takes the board red instead of leaving it
 *      falsely green. That is why the runner cannot be the only witness.
 *   3. A pass HEALS its own fail (see recordRun: consecutiveFails resets). The sync-ceo lesson,
 *      written into the arithmetic — a check that can't clear its own FAIL reads red forever and
 *      the whole board becomes noise nobody reads.
 *   4. GREY is not neutral. A check that has never run is an unmonitored joint, which is worse
 *      than a red one because it looks like nothing. The board surfaces the count.
 */
export function colourFor(def: CheckDef, state: CheckState | undefined, now = Date.now()): Colour {
  if (!state?.lastRunAt) return "grey";

  const passAge = state.lastPassAt ? now - Date.parse(state.lastPassAt) : Infinity;
  if (passAge > def.staleSeconds * 1000) return "red";
  if (state.lastStatus === "fail") return "red";
  if (state.lastStatus === "warn" || state.lastStatus === "skipped") return "yellow";
  if (passAge > def.freshSeconds * 1000) return "yellow";
  return state.lastStatus === "pass" ? "green" : "yellow";
}

/** "4 minutes ago" — the primary text on a tile, never a tooltip. The age IS the claim. */
export function ageText(iso?: string, now = Date.now()): string {
  if (!iso) return "never";
  const s = Math.max(0, Math.round((now - Date.parse(iso)) / 1000));
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.round(s / 60)}m ago`;
  if (s < 86400) return `${Math.round(s / 3600)}h ago`;
  return `${Math.round(s / 86400)}d ago`;
}

export const LAYER_LABEL: Record<Layer, string> = {
  1: "The vendor watches itself",
  2: "The joint between two vendors — nobody else is watching this",
  3: "Did the outcome actually happen",
};

export const COLOUR_ORDER: Colour[] = ["red", "yellow", "grey", "green"];

/** Worst-of, for rolling a group up into one tile. */
export function worst(colours: Colour[]): Colour {
  for (const c of COLOUR_ORDER) if (colours.includes(c)) return c;
  return "green";
}
