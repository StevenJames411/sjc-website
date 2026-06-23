// Server-only content loaders. Reads the shared Upstash drawer (ioredis) — never import
// this from a client component (it would pull the redis client into the browser bundle).
import { createKvStore } from "./kvStateStore";
import { getClient } from "./kvRedis";
import { keyFor, type SiteDoc } from "./contentShared";

// PUBLIC render reads the PUBLISHED snapshot only, and only when it carries the _pub
// marker. No published snapshot => return {} so the page renders its committed defaults.
export async function readPublished(page: string): Promise<SiteDoc> {
  const store = createKvStore(getClient(), keyFor(page) + "-pub");
  const state = (await store.read<SiteDoc>()) || {};
  return state && state._pub ? state : {};
}

// The editor loads the working DRAFT when entering edit mode.
export async function readDraft(page: string): Promise<SiteDoc> {
  const store = createKvStore(getClient(), keyFor(page));
  return (await store.read<SiteDoc>()) || {};
}
