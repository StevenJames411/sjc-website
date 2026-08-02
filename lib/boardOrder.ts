// THE ORDER STEVEN PUT THE ROSTER IN.
//
// ── WHY IT EXISTS ─────────────────────────────────────────────────────────────────────────────
// The board first shipped sorting itself worst-first. That is the right default and the wrong
// permanent behaviour: when Steven is actively building for two or three clients he wants those
// three at the top and he wants them to STAY there through every sweep, whatever colour they turn.
// A row that relocates itself is a row you have to hunt for — the same reason the mainline is
// pinned rather than sorted.
//
// ── THE RULE, AND WHY IT IS THIS ONE ──────────────────────────────────────────────────────────
//   No stored order yet  → everything sorts worst-first. Useful on day one with zero dragging.
//   A stored order       → it wins completely. Nothing re-sorts, ever.
//   An owner missing from a stored order (a client added since) → appended at the END, worst-first
//   among the other newcomers.
//
// That last line is the one that matters: a new client can never be hidden by a stale order, and
// adding one never scrambles the arrangement Steven made. The alternative — dropping unknown keys —
// would silently stop watching a site the moment it was added, which is the exact failure this
// whole board exists to refuse.
import { getClient } from "./store";

const KEY = "sjc-board-order";

/** The saved order, or [] if he has never dragged anything. */
export async function readBoardOrder(): Promise<string[]> {
  try {
    const kv = getClient();
    const raw = kv ? await kv.get(KEY) : null;
    if (!raw) return [];
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    const order = Array.isArray(parsed?.order) ? parsed.order : null;
    return order ? order.filter((k: unknown) => typeof k === "string") : [];
  } catch {
    // An unreadable order must never take the board down with it — fall back to worst-first.
    return [];
  }
}

export async function writeBoardOrder(order: string[]): Promise<boolean> {
  const kv = getClient();
  if (!kv) return false;
  const clean = order.filter((k) => typeof k === "string" && k.length).slice(0, 500);
  await kv.set(KEY, JSON.stringify({ order: clean, updatedAt: new Date().toISOString() }));
  return true;
}

/**
 * Apply a stored order to whatever owners exist right now.
 *
 * `rank` scores an owner for the worst-first fallback (lower = worse = higher up).
 */
export function applyOrder<T>(
  items: T[],
  keyOf: (t: T) => string,
  order: string[],
  rank: (t: T) => number
): T[] {
  const byWorst = [...items].sort((a, b) => rank(a) - rank(b) || keyOf(a).localeCompare(keyOf(b)));
  if (!order.length) return byWorst;

  const pos = new Map(order.map((k, i) => [k, i]));
  const known = byWorst.filter((t) => pos.has(keyOf(t)));
  const unknown = byWorst.filter((t) => !pos.has(keyOf(t))); // already worst-first
  known.sort((a, b) => (pos.get(keyOf(a)) ?? 0) - (pos.get(keyOf(b)) ?? 0));
  return [...known, ...unknown];
}
