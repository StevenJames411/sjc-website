// Whether a business's onboarding form is OPEN. SERVER ONLY.
//
//   https://stevenjamesconsulting.com/lucky-dog-wash-house/onboard
//
// ── THE URL IS THE BUSINESS NAME. THAT'S DELIBERATE ────────────────────────────────────────────
// Two earlier versions put a credential in the link — a signed token, then a word pair. Steven
// rejected both, and the reasoning is sound: a groomer who gets a link with a code in it doesn't
// tap it, and a link she can't read out over the phone is a link she can't use. The address of
// her onboarding form should look like the address of her website, because it is.
//
// So the URL is guessable. It has to be, to be usable.
//
// ── WHICH MEANS THE STATE IS THE GUARD ─────────────────────────────────────────────────────────
// Protection moves from "you can't find the URL" to "the URL only works while it's open". The
// exposure window is the days you're actively onboarding, not forever.
//
// What's behind it during that window: her business hours, the work she wants, and photos she is
// paying to have published. Everything here is destined for a public website. The real risk isn't
// someone reading it, it's someone overwriting it — which is why the store keeps every revision
// (append-only `state_rev`), so a vandalised answer is recoverable rather than lost.
//
// ── NOBODY HAS TO REMEMBER TO CLOSE IT ─────────────────────────────────────────────────────────
// Steven's objection to a manual switch was the right one: anything a person must remember to
// turn off, they eventually don't. So it CLOSES ITSELF the moment she submits — the completion is
// the trigger. Reopening stays manual because it's driven by a want ("I need more photos"), and
// nobody forgets to do the thing they're actively trying to do.
//
// A 60-day inactivity backstop catches the ones she never finished, so an abandoned form doesn't
// sit open for a year.

import { createKvStore } from "./kvStateStore";
import { getClient } from "./store";

const STALE_DAYS = 60;
const ACCESS_KEY = "sjc-intake-access";

export type AccessStatus = "open" | "closed";

type Access = {
  status: AccessStatus;
  openedAt: string;
  /** Touched on every read/write, so the inactivity backstop measures something real. */
  lastUsedAt: string;
  closedBecause?: string;
  closedAt?: string;
  /**
   * The unguessable half of the onboarding URL — /start/<siteId>/<token>.
   *
   * ⚠️ ADDED 2026-08-12 ON STEVEN'S CALL, REVERSING THE HEADER NOTE ABOVE. Two earlier versions put
   * a credential in the link and he rejected both: a link with a code in it doesn't get tapped, and
   * can't be read out over the phone. The second half turned out not to matter — *"nobody needs to
   * manually type it"*. The link is SENT, exactly like an invoice link, so an unguessable address
   * costs her nothing.
   *
   * What it buys: the address used to BE the business name, so the open window was guessable by
   * anyone who knew the business. Inside that window a stranger could read her answers and photos,
   * overwrite them, and — the one with teeth — submit, which writes their text into her business
   * facts, and those render on her live website.
   *
   * Same shape as an invoice's `publicId`: 128 bits, minted when the link is opened. It ROTATES on
   * every open, so a closed-then-reopened link is a new address and the old one stays dead.
   */
  token?: string;
};
type AccessBlob = { access?: Record<string, Access> };

/** 128 bits, hex. Same strength and the same reason as an invoice's publicId. */
function mintToken(): string {
  const b = new Uint8Array(16);
  crypto.getRandomValues(b);
  return Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
}

const store = () => createKvStore(getClient(), ACCESS_KEY);
const now = () => new Date().toISOString();

async function readAll(): Promise<Record<string, Access>> {
  return ((await store().read<AccessBlob>()) || {}).access || {};
}
async function writeAll(access: Record<string, Access>) {
  return store().writeResult({ access });
}

export type AccessCheck = { ok: true } | { ok: false; reason: "never-opened" | "closed" };

/**
 * Constant-time string compare. `===` on a secret leaks its length and prefix through timing, and
 * this is the one comparison standing between a stranger and a business's record. Same reason the
 * bearer-token path in middleware.ts does it this way.
 */
function sameToken(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/**
 * Is this business's form open right now, and does the caller hold its link? The ONLY thing
 * standing between a stranger and her record, so it is the one function to be careful about.
 *
 * ⚠️ THE TOKEN IS REQUIRED WHEN ONE EXISTS, AND ONLY THEN. A link opened before 2026-08-12 has no
 * token stored, and those keep working on the old URL until they are closed and reopened — which
 * mints one. Requiring a token nobody has been given would lock a business out of a form she is
 * mid-way through, and "open" is already a deliberate act with a 60-day backstop.
 *
 * Reported as `closed`, never as "wrong token" — see CLOSED_MESSAGE. A wrong-token message tells a
 * stranger the business exists and that a different URL would work.
 */
export async function checkIntakeOpen(siteId: string, token?: string): Promise<AccessCheck> {
  const all = await readAll();
  const a = all[siteId];
  // Fail closed. A site nobody has explicitly opened is not open.
  if (!a) return { ok: false, reason: "never-opened" };
  if (a.status !== "open") return { ok: false, reason: "closed" };
  if (a.token && !sameToken(a.token, String(token || ""))) return { ok: false, reason: "closed" };

  if (Date.now() - Date.parse(a.lastUsedAt) > STALE_DAYS * 86400_000) {
    all[siteId] = { ...a, status: "closed", closedBecause: "no activity", closedAt: now() };
    await writeAll(all);
    return { ok: false, reason: "closed" };
  }

  all[siteId] = { ...a, lastUsedAt: now() };
  await writeAll(all);
  return { ok: true };
}

/**
 * Open it — the deliberate act that starts an onboarding. Returns the token for the link.
 *
 * ⚠️ A FRESH TOKEN EVERY TIME. Reopening after a close mints a new address, so a link that was
 * shared, forwarded or sat in an old text thread does not come back to life with the form. That is
 * the same reasoning as an invoice's publicId and as the demo URL dying on purchase: the previous
 * address stays dead.
 */
export async function openIntake(siteId: string): Promise<{ ok: boolean; token?: string }> {
  const all = await readAll();
  const token = mintToken();
  all[siteId] = {
    status: "open",
    openedAt: now(),
    lastUsedAt: now(),
    closedBecause: undefined,
    closedAt: undefined,
    token,
  };
  return { ok: (await writeAll(all)).ok, token };
}

/** Close it. Called automatically on submit, and manually when Steven wants it shut. */
export async function closeIntake(siteId: string, because: string) {
  const all = await readAll();
  const a = all[siteId];
  if (!a) return false;
  all[siteId] = { ...a, status: "closed", closedBecause: because, closedAt: now() };
  return (await writeAll(all)).ok;
}

export async function intakeAccess(siteId: string): Promise<Access | null> {
  return (await readAll())[siteId] || null;
}

/** What she sees when it isn't open. Never a hint that a different URL would work. */
export const CLOSED_MESSAGE: Record<Exclude<AccessCheck, { ok: true }>["reason"], string> = {
  "never-opened":
    "This form isn't open yet. Text Steven and he'll switch it on for you.",
  closed:
    "This form is closed — thanks, I've got what I need. If you've got more to send, text me " +
    "and I'll open it back up.",
};
