// Server-only loader for Puck-built page data.
//
// Every key comes from lib/siteKeys — see that file for why site `sjc` keeps its legacy key names
// while every other website gets its own namespace. Public render reads the PUBLISHED snapshot
// only, and only when it carries the `_pub` marker, so editor drafts stay private until Publish.
import type { Data } from "@measured/puck";
import { createKvStore } from "./kvStateStore";
import { getClient } from "./store";
import { siteKeys, SJC } from "./siteKeys";

/**
 * A page's storage key.
 *
 * `siteId` defaults to SJC so the pre-existing callers that only ever knew about one website keep
 * working untouched. New code should always pass it explicitly.
 */
export const puckKey = (page: string, pub = false, siteId: string = SJC) =>
  siteKeys(siteId).puck(page, pub);

export async function readPuckPublished(page: string, siteId: string = SJC): Promise<Data | null> {
  const store = createKvStore(getClient(), puckKey(page, true, siteId));
  const v = (await store.read<Data & { _pub?: number }>()) || null;
  return v && v._pub ? v : null;
}

/** The working draft — the editor's copy, never served to the public. */
export async function readPuckDraft(page: string, siteId: string = SJC): Promise<Data | null> {
  const store = createKvStore(getClient(), puckKey(page, false, siteId));
  return (await store.read<Data>()) || null;
}
