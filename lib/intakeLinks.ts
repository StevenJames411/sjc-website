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
};
type AccessBlob = { access?: Record<string, Access> };

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
 * Is this business's form open right now? The ONLY thing standing between a stranger and her
 * record, so it is the one function to be careful about.
 */
export async function checkIntakeOpen(siteId: string): Promise<AccessCheck> {
  const all = await readAll();
  const a = all[siteId];
  // Fail closed. A site nobody has explicitly opened is not open.
  if (!a) return { ok: false, reason: "never-opened" };
  if (a.status !== "open") return { ok: false, reason: "closed" };

  if (Date.now() - Date.parse(a.lastUsedAt) > STALE_DAYS * 86400_000) {
    all[siteId] = { ...a, status: "closed", closedBecause: "no activity", closedAt: now() };
    await writeAll(all);
    return { ok: false, reason: "closed" };
  }

  all[siteId] = { ...a, lastUsedAt: now() };
  await writeAll(all);
  return { ok: true };
}

/** Open it — the deliberate act that starts an onboarding. */
export async function openIntake(siteId: string) {
  const all = await readAll();
  all[siteId] = {
    status: "open",
    openedAt: now(),
    lastUsedAt: now(),
    closedBecause: undefined,
    closedAt: undefined,
  };
  return (await writeAll(all)).ok;
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
