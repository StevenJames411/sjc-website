// Whether a business's onboarding form is OPEN, and whether the caller holds its link. SERVER ONLY.
//
//   https://stevenjamesconsulting.com/lucky-dog-wash-house/onboard/<128-bit token>
//
// ── TWO GUARDS: THE STATE, AND THE TOKEN ──────────────────────────────────────────────────────
// The form must be OPEN, and the URL must carry the token minted when it was opened. Both, always.
//
// ⚠️ THE TOKEN WAS ADDED 2026-08-12, REVERSING TWO EARLIER REJECTIONS. Steven had turned down a
// signed token and then a word pair, on the grounds that a groomer who gets a link with a code in
// it doesn't tap it, and a link she can't read out over the phone is a link she can't use.
//
// The second half turned out not to be true of this link: it is SENT, exactly like an invoice
// link, never dictated — *"nobody needs to manually type it"*. So an unguessable address costs her
// nothing, and the first objection never applied to a link she taps rather than types.
//
// What it bought: the address used to BE the business name, so during the open window anyone who
// knew the business could reach her record. Behind it are her hours, the work she wants, and the
// photos she is paying to have published. The real risk was never someone reading it — it was
// someone OVERWRITING it, because a submitted PUT writes into her business facts, and those render
// on her live website. (The store keeps every revision, append-only, so a vandalised answer is
// recoverable rather than lost — but recoverable is not the same as prevented.)
//
// Her business name is still in the path, which is the part that makes the link read as legitimate
// in a text message. Only the unguessable half was added.
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
   * The unguessable half of the onboarding URL — /<siteId>/onboard/<token>.
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
   *
   * Optional only because records written before this existed have none — and those read as CLOSED
   * until reopened. There is no tokenless path.
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
 * ⚠️ THE TOKEN IS ALWAYS REQUIRED. No compatibility path for tokenless links: none were ever sent,
 * so there is nothing to keep working. A record with no token — opened before 2026-08-12 — reads as
 * closed, and reopening it mints one. "Required only when present" would be a hedge that quietly
 * becomes a hole the first time a record loses its token.
 *
 * Reported as `closed`, never as "wrong token" — see CLOSED_MESSAGE. A distinct message would tell
 * a stranger the business exists and that a different URL would work.
 */
export async function checkIntakeOpen(siteId: string, token?: string): Promise<AccessCheck> {
  const all = await readAll();
  const a = all[siteId];
  // Fail closed. A site nobody has explicitly opened is not open.
  if (!a) return { ok: false, reason: "never-opened" };
  if (a.status !== "open") return { ok: false, reason: "closed" };
  if (!a.token || !sameToken(a.token, String(token || ""))) return { ok: false, reason: "closed" };

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
