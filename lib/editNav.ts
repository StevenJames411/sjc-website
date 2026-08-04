// The back office's menu — the STORAGE half. Everything pure lives in ./editNavShared, which is
// what the browser is allowed to import; this file pulls in lib/store and must never reach a
// client bundle. See the warning at the top of editNavShared.ts.
import { getClient } from "./store";
import { ENTRIES, mergeNav, DEFAULT_DOC, type NavDoc } from "./editNavShared";

export * from "./editNavShared";

const KEY = "sjc-edit-nav";

export async function navLabel(key: string): Promise<string> {
  const fallback = ENTRIES.find((e) => e.type === "item" && e.key === key)?.label || key;
  try {
    const doc = await readNav();
    const found = doc.entries.find((e) => e.type === "item" && e.key === key);
    return found?.label?.trim() || fallback;
  } catch {
    return fallback;
  }
}

export async function readNav(): Promise<NavDoc> {
  try {
    const kv = getClient();
    const raw = kv ? await kv.get(KEY) : null;
    if (!raw) return DEFAULT_DOC;
    return mergeNav(typeof raw === "string" ? JSON.parse(raw) : raw);
  } catch {
    // A menu that can't be read must never take the back office down — fall back to code.
    return DEFAULT_DOC;
  }
}

export async function writeNav(doc: Partial<NavDoc>): Promise<boolean> {
  const kv = getClient();
  if (!kv) return false;
  // Stored through the merge, so what lands in the store is already normalised: known keys only,
  // hrefs from code. A hand-edited or half-written document cannot poison the next read.
  const clean = mergeNav(doc);
  await kv.set(KEY, JSON.stringify({ ...clean, updatedAt: new Date().toISOString() }));
  return true;
}

// ⛔ THERE IS NO "RESET TO DEFAULTS", DELIBERATELY. Steven, once he had it:
//
//   *"I don't know when I'm ever going to use that, because when I rename everything for the first
//   time, that's kind of the new default. If it saves every update, I don't really need a default
//   setting."*
//
// He is right, and the reason it is SAFE to have no escape hatch is that nothing here can be lost:
// every entry stays visible as a row in edit mode even when its label is empty, so anything typed
// wrong is retyped. A reset button that only ever destroys the user's work is not a safety net.
