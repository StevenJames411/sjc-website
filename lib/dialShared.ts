// THE DIAL BOARD — the PURE half. Types, header matching, and the two links that do the work.
//
// ⚠️ NO STORAGE IN THIS FILE. components/edit/DialBoard.tsx needs all of this in the BROWSER, and
// ./dial imports lib/store → ioredis → node:dns. One client import of the wrong file and the build
// dies on `Can't resolve 'dns'`. Same split, same reason, as editNav / editNavShared.
//
// ── WHAT THIS SURFACE IS ──────────────────────────────────────────────────────────────────────
// Steven cold-calls off a scraped Google Sheet with his iPhone. The sheet stays the database — it
// is the thing he sorts, filters and lives in, and if this page vanished tomorrow every note would
// still be in it. This is a steering wheel, not a vault.
//
// ⛔ IT IS NOT A CRM, AND THE LINE IS NOT "it holds a list". The boundary that keeps the builder
// from becoming a CRM is about holding a CUSTOMER'S leads and their state. These are Steven's own
// prospects on Steven's own desk. Nothing here may ever read a client's leads back.

/** The outcomes, in the order they appear under the card. */
export const OUTCOMES = [
  { key: "no-answer", label: "No answer", tone: "none" },
  { key: "voicemail", label: "Left voicemail", tone: "none" },
  { key: "callback", label: "Callback", tone: "warn" },
  { key: "conversation", label: "Conversation", tone: "info" },
  { key: "not-interested", label: "Not interested", tone: "bad" },
  { key: "sold", label: "SOLD", tone: "ok" },
] as const;

export type OutcomeKey = (typeof OUTCOMES)[number]["key"];

export const OUTCOME_LABELS: Record<string, string> = Object.fromEntries(
  OUTCOMES.map((o) => [o.key, o.label])
);

/** Outcomes that mean "done with this one" — used to decide what is left to call. */
const CLOSED_OUTCOMES = new Set<string>(["not-interested", "sold"]);

/** A call sheet Steven has pointed the board at. */
export type CallList = {
  id: string;
  /** What he calls it — "Austin pet groomers". Decoration; `id` is identity. */
  name: string;
  spreadsheetId: string;
  /** Empty = the first tab, whatever it is called. */
  tab?: string;
  addedAt?: string;
};

export type DialDoc = { lists: CallList[] };

export const EMPTY_DIAL_DOC: DialDoc = { lists: [] };

/** One business, as the board sees it. */
export type Prospect = {
  /** The sheet's own row number. NOT identity — see logCall_ in scripts/sjc-sheets.gs. */
  row: number;
  name: string;
  phone: string;
  website: string;
  reviews: string;
  rating: string;
  claimed: string;
  category: string;
  address: string;
  notes: string;
  status: string;
  lastCalled: string;
  /** Everything the sheet had that we have no field for, in sheet order. Shown on the card. */
  extra: { label: string; value: string }[];
};

/**
 * ⛔ SCRAPED SHEETS ARE FULL OF THE LITERAL WORD "null".
 *
 * Steven's groomer pull wrote it into every Hours cell — it is visible in his screenshot. Rendered
 * straight onto the card it reads as a fact about the business, and on a surface whose whole job is
 * telling him who he is about to talk to, a confident lie is worse than a blank. Same list as the
 * one already in scripts/call-sheet.gs, for the same reason.
 */
const JUNK = /^(null|undefined|n\/a|na|none|-|—|\s*)$/i;

export function clean(v: unknown): string {
  const s = String(v ?? "").trim();
  return JUNK.test(s) ? "" : s;
}

/**
 * Which column means what.
 *
 * ⚠️ MATCHED BY HEADER NAME, NEVER BY POSITION. Steven's call sheets already disagree with each
 * other — the groomer sheet and the deck-builder sheet have different columns, and both will grow.
 * Anything unrecognised still reaches the card via `extra`, so a column added next month shows up
 * on screen without a code change instead of being silently dropped.
 */
const FIELDS: Record<keyof Omit<Prospect, "row" | "extra">, string[]> = {
  name: ["name", "business", "business name", "company"],
  phone: ["phone", "phone number", "telephone", "tel", "mobile"],
  website: ["website", "site", "url", "web"],
  reviews: ["reviews", "review count", "# reviews", "num reviews"],
  rating: ["rating", "stars", "score"],
  claimed: ["claimed", "verified"],
  category: ["category", "type", "industry", "niche"],
  address: ["address", "location", "street"],
  notes: ["notes", "note"],
  status: ["status", "outcome", "result", "disposition"],
  lastCalled: ["last called", "called", "last call", "called at"],
};

export function toProspects(
  headers: string[],
  rows: { row: number; cells: string[] }[]
): Prospect[] {
  const lower = headers.map((h) => h.trim().toLowerCase());
  const at: Partial<Record<keyof typeof FIELDS, number>> = {};
  const claimed = new Set<number>();

  for (const field of Object.keys(FIELDS) as (keyof typeof FIELDS)[]) {
    const i = lower.findIndex((h, idx) => !claimed.has(idx) && FIELDS[field].includes(h));
    if (i >= 0) {
      at[field] = i;
      claimed.add(i);
    }
  }

  const pick = (cells: string[], f: keyof typeof FIELDS) => {
    const i = at[f];
    return i === undefined ? "" : clean(cells[i]);
  };

  return rows.map(({ row, cells }) => ({
    row,
    name: pick(cells, "name"),
    phone: pick(cells, "phone"),
    website: pick(cells, "website"),
    reviews: pick(cells, "reviews"),
    rating: pick(cells, "rating"),
    claimed: pick(cells, "claimed"),
    category: pick(cells, "category"),
    address: pick(cells, "address"),
    notes: pick(cells, "notes"),
    status: pick(cells, "status"),
    lastCalled: pick(cells, "lastCalled"),
    extra: headers
      .map((label, i) => ({ label: label.trim(), value: clean(cells[i]) }))
      .filter((x, i) => !claimed.has(i) && x.label && x.value),
  }));
}

/** Has this one been dealt with? Drives the "still to call" queue and the counters. */
export function isDone(p: Prospect): boolean {
  return CLOSED_OUTCOMES.has(p.status.trim().toLowerCase().replace(/\s+/g, "-"));
}

export function isUntouched(p: Prospect): boolean {
  return !p.status.trim() && !p.lastCalled.trim();
}

/**
 * A number the Phone app will accept.
 *
 * ⚠️ KEEP THE LEADING +, DROP EVERYTHING ELSE. macOS hands a `tel:` URL straight to the Phone app,
 * which is forgiving about spaces and dashes but not about the parentheses in "(512) 846-4044"
 * arriving percent-encoded. A US 10-digit number with no country code gets a +1 so Continuity does
 * not have to guess.
 */
export function telHref(phone: string): string {
  const raw = clean(phone);
  if (!raw) return "";
  const plus = raw.trimStart().startsWith("+");
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  if (plus) return `tel:+${digits}`;
  if (digits.length === 10) return `tel:+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `tel:+${digits}`;
  return `tel:${digits}`;
}

/** What to show on the card — the sheet's own formatting, which is what he is used to reading. */
export function prettyPhone(phone: string): string {
  return clean(phone);
}

/**
 * A Google Calendar event, prefilled, opened in a new tab for him to hit Save on.
 *
 * ── WHY A LINK AND NOT THE CALENDAR API ───────────────────────────────────────────────────────
 * The API needs an OAuth app, a consent screen, a stored refresh token and a renewal path — real
 * infrastructure, and a token that expires silently three months from now while he is mid-session.
 * A template URL needs nothing, cannot expire, and costs one click. If that click ever annoys him,
 * the API is a swap behind this same function.
 *
 * ⚠️ `dates` MUST be UTC basic-format with the Z. Google reads a local-looking string in the
 * calendar's own timezone, so a callback booked for 10am lands at 10am UTC — 5am his time, and he
 * finds out by missing it.
 */
export function calendarHref(opts: {
  name: string;
  phone: string;
  when: string;
  note?: string;
  minutes?: number;
}): string {
  const start = new Date(opts.when);
  if (isNaN(start.getTime())) return "";
  const end = new Date(start.getTime() + (opts.minutes || 15) * 60_000);
  const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

  const details = [
    opts.phone ? `Call ${opts.phone}` : "",
    opts.note ? `\n${opts.note}` : "",
  ]
    .filter(Boolean)
    .join("");

  const q = new URLSearchParams({
    action: "TEMPLATE",
    text: `Call back: ${opts.name}`,
    dates: `${stamp(start)}/${stamp(end)}`,
    details,
  });
  return `https://calendar.google.com/calendar/render?${q.toString()}`;
}

/** "Tue 12 Aug, 10:00 AM" — what goes in the sheet's Callback cell, for him not for a machine. */
export function prettyWhen(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleString("en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** A website cell that may or may not carry a scheme. Blank stays blank. */
export function siteHref(website: string): string {
  const s = clean(website);
  if (!s) return "";
  return /^https?:\/\//i.test(s) ? s : `https://${s}`;
}
