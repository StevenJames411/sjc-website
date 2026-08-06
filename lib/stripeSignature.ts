// Is this webhook request actually from Stripe? SERVER ONLY.
//
// ── WHY THIS IS HAND-ROLLED AND WHY THAT IS FINE ─────────────────────────────────────────────
// Stripe's scheme is small and completely specified: the `Stripe-Signature` header carries a
// timestamp and one or more HMAC-SHA256 digests of `${timestamp}.${rawBody}`, keyed by the
// endpoint's signing secret. Verifying it needs Web Crypto and nothing else. The alternative is
// pulling the whole `stripe` package in for one function.
//
// ⚠️ THE RAW BODY, BYTE FOR BYTE. Parse the JSON first and re-stringify it and the signature will
// never match again — key order, whitespace and number formatting are all part of what was
// signed. The route reads req.text() and hands that string here untouched.
//
// ⚠️ THIS IS THE ONLY THING STANDING BETWEEN A STRANGER AND A ROW IN STEVEN'S BOOKS. The endpoint
// is public by necessity — Stripe has to be able to reach it — so an unverified request must be
// refused outright, and a MISSING secret must refuse everything rather than wave it through. A
// webhook that accepts anything when unconfigured is worse than one that doesn't exist: it looks
// like it's working.

/** Constant-time compare. A fast `!==` leaks how much of a forged digest was right. */
function sameDigest(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

const hex = (buf: ArrayBuffer) =>
  Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

async function hmac(secret: string, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  return hex(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload)));
}

/** How old a signed request may be. Stripe's own default, and it's the replay guard. */
export const TOLERANCE_SECONDS = 300;

export type VerifyResult = { ok: true } | { ok: false; reason: string };

export async function verifyStripeSignature(
  rawBody: string,
  header: string | null,
  secret: string,
  /** Injectable so the check can test the replay window without waiting five minutes. */
  nowSeconds = Math.floor(Date.now() / 1000)
): Promise<VerifyResult> {
  if (!secret) return { ok: false, reason: "STRIPE_WEBHOOK_SECRET is not set" };
  if (!header) return { ok: false, reason: "no Stripe-Signature header" };

  // "t=1699999999,v1=abc…,v1=def…" — more than one v1 during a secret rollover.
  let t = "";
  const v1: string[] = [];
  for (const part of header.split(",")) {
    const [k, v] = part.split("=", 2);
    if (k?.trim() === "t") t = (v || "").trim();
    if (k?.trim() === "v1") v1.push((v || "").trim());
  }
  if (!t || !v1.length) return { ok: false, reason: "malformed Stripe-Signature header" };

  const age = nowSeconds - Number(t);
  if (!Number.isFinite(age)) return { ok: false, reason: "bad timestamp" };
  // Guards BOTH directions. A far-future timestamp would otherwise sail past a one-sided check
  // and stay valid forever.
  if (Math.abs(age) > TOLERANCE_SECONDS) return { ok: false, reason: `timestamp is ${age}s off` };

  const expected = await hmac(secret, `${t}.${rawBody}`);
  return v1.some((sig) => sameDigest(sig, expected))
    ? { ok: true }
    : { ok: false, reason: "signature does not match" };
}
