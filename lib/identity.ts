// WHO IS THIS? — the one place a caller becomes a named person with a list of websites.
//
// ── WHY THIS EXISTS ───────────────────────────────────────────────────────────────────────────
// Until now the whole security model was one shared password. The cookie it set was
// `base64(user:password)` — the same bytes for every browser that ever logged in, carrying no
// identity at all. That is fine while Steven is the only login and catastrophic the moment a
// client gets one: `sjc_site_auth` says "somebody knew the password", so a contractor editing his
// own deck-building site is indistinguishable from Steven, and `PUT /api/puck {"site":"someone-
// else"}` overwrites a stranger's home page.
//
// lib/siteAccess.ts has had the seam for this since the day it was written — "an identity carrying
// a set of site ids, compared against site.id, returning 403". This is that identity.
//
// ── THE SHAPE, AND WHY IT IS A HEADER ─────────────────────────────────────────────────────────
// Middleware is the ONLY authenticator. It strips X_IDENTITY from every inbound request, then
// stamps it after proving who the caller is — exactly the pattern OWNER_HEADER and PREVIEW_HEADER
// already use. Routes then read one header instead of each re-implementing cookie parsing, and
// there is no path where a request arrives carrying its own answer to "who am I".
//
// ⚠️ WEB CRYPTO, NOT node:crypto. This module is imported by middleware, which runs on the edge
// runtime where `node:crypto` does not exist. `crypto.subtle` exists in both runtimes; everything
// here is async because of it.

/** Set by middleware only. Stripped from every inbound request before routing — see middleware(). */
export const IDENTITY_HEADER = "x-sjc-identity";

/** The magic-link session. Distinct from `sjc_site_auth`, which stays as Steven's password login. */
export const SESSION_COOKIE = "sjc_id";

export type Identity = {
  /** Lower-cased. The person, not the website. */
  email: string;
  /**
   * Which websites this person may touch. `"*"` is the owner — Steven, and machine credentials.
   *
   * ⛔ AN EMPTY ARRAY IS A REAL AND CORRECT STATE, never an error: a signed-in person who owns no
   * website yet. It must deny everything rather than fall back to "*", which is the failure mode
   * that makes an allowlist worthless.
   */
  sites: "*" | string[];
  /** How they proved it, for the audit line and for deciding what UI to show. */
  via: "password" | "magic" | "bearer";
  /** Seconds since epoch. Checked on every request, not just at sign-in. */
  exp: number;
};

const enc = new TextEncoder();

function secret(): string {
  // SESSION_SECRET is the right knob. Falling back to SITE_EDIT_PASSWORD means this works the
  // moment it deploys rather than after an env var round-trip — and rotating the password
  // invalidating every session is correct behaviour, not a side effect to apologise for.
  return process.env.SESSION_SECRET || process.env.SITE_EDIT_PASSWORD || "";
}

const b64url = (b: ArrayBuffer | Uint8Array): string =>
  Buffer.from(b instanceof Uint8Array ? b : new Uint8Array(b))
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

const fromB64url = (s: string): Buffer =>
  Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/"), "base64");

async function hmac(data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  return b64url(await crypto.subtle.sign("HMAC", key, enc.encode(data)));
}

/** `<payload>.<signature>` — a minimal JWT with no algorithm field, because there is no negotiation. */
export async function signIdentity(id: Identity): Promise<string> {
  if (!secret()) throw new Error("no SESSION_SECRET / SITE_EDIT_PASSWORD — refusing to sign");
  const payload = b64url(enc.encode(JSON.stringify(id)));
  return `${payload}.${await hmac(payload)}`;
}

/**
 * Verify and decode. Returns null for anything that is not a valid, unexpired, correctly-signed
 * identity — a caller must never be able to tell WHY it failed.
 *
 * ⚠️ CONSTANT-TIME COMPARE. `===` on a signature leaks length and matching prefix through timing,
 * which is enough to forge one a byte at a time. Buffer.compare is not constant-time and
 * node:crypto.timingSafeEqual does not exist on the edge, so it is done by hand below.
 */
export async function verifyIdentity(token: string | undefined | null): Promise<Identity | null> {
  if (!token || !secret()) return null;
  const dot = token.lastIndexOf(".");
  if (dot < 1) return null;

  const payload = token.slice(0, dot);
  const given = token.slice(dot + 1);
  const want = await hmac(payload);

  if (given.length !== want.length) return null;
  let diff = 0;
  for (let i = 0; i < want.length; i++) diff |= given.charCodeAt(i) ^ want.charCodeAt(i);
  if (diff !== 0) return null;

  try {
    const id = JSON.parse(fromB64url(payload).toString("utf8")) as Identity;
    if (!id?.email || typeof id.exp !== "number") return null;
    if (id.exp * 1000 < Date.now()) return null;
    if (id.sites !== "*" && !Array.isArray(id.sites)) return null;
    return id;
  } catch {
    return null;
  }
}

/** The owner identity — full access, no site list. Used by the password login and bearer tokens. */
export const ownerIdentity = (email: string, via: Identity["via"]): Identity => ({
  email: email.toLowerCase(),
  sites: "*",
  via,
  exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30,
});

/**
 * May this identity touch this website?
 *
 * ⛔ THE ONLY PLACE THIS COMPARISON HAPPENS. Every site-scoped route reaches it through
 * assertSiteAccess. Adding a second copy anywhere is how the two drift and one of them starts
 * saying yes.
 */
export const identityMayTouch = (id: Identity | null, siteId: string): boolean => {
  if (!id) return false;
  if (id.sites === "*") return true;
  return id.sites.includes(siteId);
};
