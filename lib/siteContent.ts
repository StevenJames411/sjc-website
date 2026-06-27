// Server-only content loaders. Reads the shared Upstash drawer (ioredis) — never import
// this from a client component (it would pull the redis client into the browser bundle).
import { createKvStore } from "./kvStateStore";
import { getClient } from "./kvRedis";
import { keyFor, type SiteDoc } from "./contentShared";

// RETIRED: the old inline-editor override layer (`sjc-site-<page>-pub`) is dead. It was
// painting stale per-tid text over the current committed code on the live pages ("half old,
// half new"). We now ALWAYS return {} so every page renders its current committed code. The
// live Puck-published layer (readPuckPublished / PublishedOrFallback) is unaffected.
export async function readPublished(_page: string): Promise<SiteDoc> {
  return {};
}

// The editor loads the working DRAFT when entering edit mode.
export async function readDraft(page: string): Promise<SiteDoc> {
  const store = createKvStore(getClient(), keyFor(page));
  return (await store.read<SiteDoc>()) || {};
}
