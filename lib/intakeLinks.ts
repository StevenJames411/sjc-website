// Short, human-looking intake links. SERVER ONLY.
//
//   https://stevenjamesconsulting.com/start/lucky-dog/7k2m9x4p
//
// WHY NOT A SIGNED TOKEN. The first version put a signed payload in the query string, which was
// stateless and correct and looked like this:
//
//   /start/lucky-dog-wash-house?k=eyJzIjoibHVja3ktZG9nLXdhc2gtaG91c2UiLCJlIjoxNzg4…
//
// A groomer receives that in a text message and does not tap it. It reads like phishing, and the
// business it's supposedly from looks like it doesn't know what it's doing. The security was fine
// and the link was unusable, which makes the security irrelevant.
//
// A stored code is eight characters, and it buys something signing can't: REVOCATION. A signed
// token is valid until it expires no matter who ends up holding it; a code can be killed the
// moment a link goes to the wrong person.
//
// UNGUESSABILITY: 8 chars from a 32-symbol alphabet is ~10^12 combinations, drawn from a CSPRNG.
// Guessing one is not the attack to worry about here.

import crypto from "crypto";
import { createKvStore } from "./kvStateStore";
import { getClient } from "./store";

/** No 0/O/1/I/L — these get read aloud on the phone and typed in by hand. */
const ALPHABET = "23456789abcdefghjkmnpqrstuvwxyz";
const CODE_LEN = 8;
const LINKS_KEY = "sjc-intake-links";

type Link = { site: string; expires: number; createdAt: string; revoked?: boolean };
type LinksBlob = { links?: Record<string, Link> };

const store = () => createKvStore(getClient(), LINKS_KEY);

function newCode(): string {
  const bytes = crypto.randomBytes(CODE_LEN);
  let out = "";
  for (let i = 0; i < CODE_LEN; i++) out += ALPHABET[bytes[i] % ALPHABET.length];
  return out;
}

async function readAll(): Promise<Record<string, Link>> {
  return ((await store().read<LinksBlob>()) || {}).links || {};
}

/** Create a link code for one site. */
export async function mintIntakeCode(
  siteId: string,
  days = 45
): Promise<{ ok: boolean; code?: string; expires?: string; reason?: string }> {
  const links = await readAll();
  let code = newCode();
  while (links[code]) code = newCode();

  const expires = Date.now() + days * 86400_000;
  links[code] = { site: siteId, expires, createdAt: new Date().toISOString() };

  const res = await store().writeResult({ links });
  if (!res.ok) return { ok: false, reason: res.reason };
  return { ok: true, code, expires: new Date(expires).toISOString() };
}

export type CodeCheck =
  | { ok: true; siteId: string }
  | { ok: false; reason: "missing" | "unknown" | "expired" | "revoked" };

/** Which site — if any — this code is allowed to touch. The ONLY source of that answer. */
export async function resolveIntakeCode(code: string | null | undefined): Promise<CodeCheck> {
  const c = String(code || "").trim().toLowerCase();
  if (!c) return { ok: false, reason: "missing" };
  const link = (await readAll())[c];
  if (!link) return { ok: false, reason: "unknown" };
  if (link.revoked) return { ok: false, reason: "revoked" };
  if (Date.now() > link.expires) return { ok: false, reason: "expired" };
  return { ok: true, siteId: link.site };
}

/** Kill a link without deleting the record of it having existed. */
export async function revokeIntakeCode(code: string): Promise<boolean> {
  const links = await readAll();
  const c = code.trim().toLowerCase();
  if (!links[c]) return false;
  links[c] = { ...links[c], revoked: true };
  return (await store().writeResult({ links })).ok;
}

/** Every link ever issued for a site, newest first — so Steven can see what's out there. */
export async function linksForSite(siteId: string) {
  const links = await readAll();
  return Object.entries(links)
    .filter(([, l]) => l.site === siteId)
    .map(([code, l]) => ({ code, ...l, expired: Date.now() > l.expires }))
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

/** What the person sees. Never which part was wrong. */
export const CODE_MESSAGE: Record<Exclude<CodeCheck, { ok: true }>["reason"], string> = {
  missing: "This link is incomplete. Use the full link Steven sent you.",
  unknown: "This link doesn't look right. Use the full link Steven sent you.",
  expired: "This link has expired. Text Steven and he'll send you a fresh one.",
  revoked: "This link has been replaced. Text Steven for the current one.",
};
