// Server-side brand storage. Types and constants live in ./brandShared (browser-safe).
import { createKvStore } from "./kvStateStore";
import { getClient } from "./store";
import { siteKeys, SJC } from "./siteKeys";
import { BRAND_DEFAULTS, type Brand } from "./brandShared";

export * from "./brandShared";

// Same -pub convention the page content uses (lib/puckContent.ts): edit the draft, publish
// a snapshot. The public site only ever reads the published one.
//
// Brand is PER WEBSITE. It used to be one global record — this file's own comment called it "the
// GLOBAL brand for ONE site" — which is why a client demo's colours had to be hardcoded into its
// blocks: there was a single brand slot and SJC owned it. `siteId` defaults to SJC so existing
// callers keep reading the exact same key they always did.
export const BRAND_KEY = "sjc-brand";
export const brandKey = (pub = false, siteId: string) => siteKeys(siteId).brand(pub);

const store = (pub: boolean, siteId: string) => createKvStore(getClient(), brandKey(pub, siteId));

/** Merge over defaults so a half-written brand can never blank the site. */
export function normalize(v: unknown): Brand {
  const b = (v && typeof v === "object" ? v : {}) as Partial<Brand>;
  return { ...BRAND_DEFAULTS, ...b };
}

export async function readBrand(pub = false, siteId: string): Promise<Brand> {
  const v = await store(pub, siteId).read<Partial<Brand>>();
  return normalize(v);
}

export async function writeBrand(
  b: Partial<Brand>,
  pub = false,
  siteId: string
): Promise<boolean> {
  return store(pub, siteId).write(normalize(b));
}
