// Server-only loader for the Puck-built page data (the /about pilot). Same Upstash drawer as
// the rest of the site, separate namespace `sjc-puck-<page>` (draft) / `-pub` (published) so
// it never collides with the bespoke editor's `sjc-site-<page>` keys. Public render reads the
// PUBLISHED snapshot only, and only when it carries the `_pub` marker — so editor drafts stay
// private until Steven hits Publish. No published Puck page => return null => /about falls back
// to its committed hand-coded layout (zero regression).
import type { Data } from "@measured/puck";
import { createKvStore } from "./kvStateStore";
import { getClient } from "./kvRedis";

const safe = (s: string) => String(s || "").replace(/[^a-z0-9-]/gi, "") || "home";
export const puckKey = (page: string, pub = false) =>
  `sjc-puck-${safe(page)}` + (pub ? "-pub" : "");

export async function readPuckPublished(page: string): Promise<Data | null> {
  const store = createKvStore(getClient(), puckKey(page, true));
  const v = (await store.read<Data & { _pub?: number }>()) || null;
  return v && v._pub ? v : null;
}
