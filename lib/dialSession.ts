// A CALL SESSION — the clock, and the row it becomes. PURE; no storage, no DOM, no Date.now().
//
// ── WHAT THIS MEASURES AND WHY IT IS NOT DEFENDED ─────────────────────────────────────────────
// Steven wanted a timer he can pause, and a Monday-to-Saturday record of how productive he was.
// I proposed two "safety" behaviours and he killed both, correctly:
//
//   ① The timer must NOT survive a closed tab. *"If the window closes, we should kill the timer…
//      if I forget to end the session and I just close the window, I want it to end the session."*
//      A clock that outlives the page is a clock that runs all night.
//
//   ② There is NO idle auto-pause. *"If somebody spaces out and doesn't use the pause button, I
//      don't really care. If they try to log eight hours a day and only make 20 dials, the dial
//      volume is what I'm going to bust their balls about."*
//
// ⛔ THE SECOND ONE IS THE DESIGN INSIGHT: the time number never gets read alone — it is a
// DENOMINATOR. Padding your hours makes your dials-per-hour worse, so the metric polices itself
// and needs no protecting. That is why `perHour` is on every row and why there is no timeout
// anywhere in this file.
//
// ⚠️ Every function takes `now` as an argument rather than reading the clock. That is what makes
// pause arithmetic testable — see scripts/checks/dial-board.mts.

export type Session = {
  /** Wall-clock ms when Start was pressed. */
  startedAt: number;
  /** Total ms spent paused and already banked. */
  pausedMs: number;
  /** Wall-clock ms when the current pause began, or null when running. */
  pausedAt: number | null;
  /** Last time he did anything — the timestamp a crashed session is closed at. */
  lastActiveAt: number;
  /** Which list he was working. Decoration on the row; sessions are not scoped to a list. */
  list: string;
  dials: number;
  convos: number;
  callbacks: number;
  sold: number;
};

export function startSession(now: number, list: string): Session {
  return {
    startedAt: now,
    pausedMs: 0,
    pausedAt: null,
    lastActiveAt: now,
    list,
    dials: 0,
    convos: 0,
    callbacks: 0,
    sold: 0,
  };
}

export const isPaused = (s: Session) => s.pausedAt !== null;

/** Milliseconds actually worked — wall-clock minus everything banked and any pause in progress. */
export function activeMs(s: Session, now: number): number {
  const paused = s.pausedMs + (s.pausedAt === null ? 0 : Math.max(0, now - s.pausedAt));
  return Math.max(0, now - s.startedAt - paused);
}

export function pause(s: Session, now: number): Session {
  return s.pausedAt === null ? { ...s, pausedAt: now, lastActiveAt: now } : s;
}

export function resume(s: Session, now: number): Session {
  if (s.pausedAt === null) return s;
  // Banked on resume, so a pause that spans a clock change can't produce negative worked time.
  return { ...s, pausedMs: s.pausedMs + Math.max(0, now - s.pausedAt), pausedAt: null, lastActiveAt: now };
}

/** Any activity — a dial, an outcome, a note. Only moves the crash-recovery marker. */
export function touch(s: Session, now: number): Session {
  return { ...s, lastActiveAt: now };
}

export function count(s: Session, outcome: string, now: number): Session {
  const next = touch(s, now);
  if (outcome === "conversation") return { ...next, convos: next.convos + 1 };
  if (outcome === "callback") return { ...next, callbacks: next.callbacks + 1 };
  if (outcome === "sold") return { ...next, sold: next.sold + 1 };
  return next;
}

export function countDial(s: Session, now: number): Session {
  const next = touch(s, now);
  return { ...next, dials: next.dials + 1 };
}

/** "1:24:05" while running. Hours only appear once there are hours. */
export function clock(ms: number): string {
  const t = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const s = t % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

/** The row the sheet gets. `endedAt` is separate from `now` so a crashed session can be closed. */
export function toRow(s: Session, endedAt: number, who = "Steven") {
  const ms = activeMs(s, endedAt);
  const fmt = (t: number) =>
    new Date(t).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return {
    // Local date, not ISO: a session that ends at 11pm belongs to that Monday, not to Tuesday UTC.
    date: new Date(s.startedAt).toLocaleDateString("en-US"),
    who,
    started: fmt(s.startedAt),
    ended: fmt(endedAt),
    activeMins: Math.round(ms / 60000),
    dials: s.dials,
    convos: s.convos,
    callbacks: s.callbacks,
    sold: s.sold,
    list: s.list,
  };
}

export type SessionRow = ReturnType<typeof toRow>;
