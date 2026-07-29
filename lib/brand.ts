// Server-side brand storage. Types and constants live in ./brandShared (browser-safe).
import { createKvStore } from "./kvStateStore";
import { getClient } from "./store";
import { BRAND_DEFAULTS, type Brand } from "./brandShared";

export * from "./brandShared";

// Same -pub convention the page content uses (lib/puckContent.ts): edit the draft, publish
// a snapshot. The public site only ever reads the published one.
export const BRAND_KEY = "sjc-brand";
export const brandKey = (pub = false) => BRAND_KEY + (pub ? "-pub" : "");

const store = (pub: boolean) => createKvStore(getClient(), brandKey(pub));

/** Merge over defaults so a half-written brand can never blank the site. */
export function normalize(v: unknown): Brand {
  const b = (v && typeof v === "object" ? v : {}) as Partial<Brand>;
  return { ...BRAND_DEFAULTS, ...b };
}

export async function readBrand(pub = false): Promise<Brand> {
  const v = await store(pub).read<Partial<Brand>>();
  return normalize(v);
}

export async function writeBrand(b: Partial<Brand>, pub = false): Promise<boolean> {
  return store(pub).write(normalize(b));
}
