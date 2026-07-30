// The key that makes an intake link safe to text to somebody. SERVER ONLY.
//
// The intake page is public by necessity — a groomer can't log in, and asking her to would end the
// onboarding before it started. But a public write path with no gate is a free file host for
// whoever finds it, and worse, a way to read what other businesses have written about themselves.
//
// So the link carries a signed token instead:  /start/riverbend?k=<payload>.<signature>
//
//   - Signed, not stored. Nothing to look up, nothing to clean out, and a forged token fails
//     because the signature won't verify — not because we remembered to check a table.
//   - Scoped to ONE site id. Client A's link mathematically cannot address client B's record;
//     the id is inside the signed payload, so changing it invalidates the signature.
//   - Expires. A link that works forever is a liability the day it's forwarded or scraped.
//
// The signing key is DERIVED from SITE_EDIT_TOKEN rather than being it. A leaked intake link
// therefore reveals nothing about the credential that can write to every client's site — the
// derivation is one-way. This also means no second environment variable for Steven to set.

import crypto from "crypto";

const LABEL = "sjc-intake-v1";
const DEFAULT_DAYS = 45;

function signingKey(): Buffer | null {
  const root = process.env.SITE_EDIT_TOKEN;
  // Fail closed. No credential configured means no valid link can be minted OR accepted, rather
  // than everything being signed with an empty string and every forgery passing.
  if (!root || root.length < 32) return null;
  return crypto.createHmac("sha256", root).update(LABEL).digest();
}

const b64url = (b: Buffer) => b.toString("base64url");

/** Mint a link token for one site. */
export function mintIntakeToken(siteId: string, days = DEFAULT_DAYS): string | null {
  const key = signingKey();
  if (!key) return null;
  const payload = b64url(
    Buffer.from(JSON.stringify({ s: siteId, e: Date.now() + days * 86400_000 }))
  );
  const sig = b64url(crypto.createHmac("sha256", key).update(payload).digest());
  return `${payload}.${sig}`;
}

export type TokenCheck =
  | { ok: true; siteId: string }
  | { ok: false; reason: "missing" | "malformed" | "bad-signature" | "expired" | "unconfigured" };

/** Verify a token and return the site id it is allowed to touch — and only that one. */
export function readIntakeToken(token: string | null | undefined): TokenCheck {
  if (!token) return { ok: false, reason: "missing" };
  const key = signingKey();
  if (!key) return { ok: false, reason: "unconfigured" };

  const [payload, sig] = String(token).split(".");
  if (!payload || !sig) return { ok: false, reason: "malformed" };

  const expected = b64url(crypto.createHmac("sha256", key).update(payload).digest());
  // Constant-time: a plain === leaks how much of the signature was right, one byte at a time.
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return { ok: false, reason: "bad-signature" };
  }

  try {
    const { s, e } = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (!s) return { ok: false, reason: "malformed" };
    if (typeof e !== "number" || Date.now() > e) return { ok: false, reason: "expired" };
    return { ok: true, siteId: String(s) };
  } catch {
    return { ok: false, reason: "malformed" };
  }
}

/** What the person sees. Never the reason — that only tells an attacker which part to fix. */
export const TOKEN_MESSAGE: Record<Exclude<TokenCheck, { ok: true }>["reason"], string> = {
  missing: "This link is incomplete. Use the full link Steven sent you.",
  malformed: "This link doesn't look right. Use the full link Steven sent you.",
  "bad-signature": "This link doesn't look right. Use the full link Steven sent you.",
  expired: "This link has expired. Text Steven and he'll send a fresh one.",
  unconfigured: "This form isn't available right now. Text Steven and he'll sort it out.",
};
