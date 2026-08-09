// THE DIAL BOARD — the STORAGE half. SERVER ONLY (pulls in the store).
//
// Read the note at the top of ./dialShared first. Everything pure lives there; this file owns the
// short registry of WHICH sheets Steven calls from, and nothing else.
//
// ── ⛔ WHAT IS DELIBERATELY NOT STORED HERE ───────────────────────────────────────────────────
// Not the prospects. Not their notes, not their status, not who was called when. All of that lives
// in the Google Sheet and is read live on every load.
//
// That is not laziness, it is the whole design. A cached copy of a call sheet is a second source of
// truth: he sorts the sheet, edits a note by hand, deletes a dud row — and the board is confidently
// wrong about a business he is on the phone with. It is also the line that keeps this from becoming
// the CRM the builder is never allowed to be. This file holds three fields per list: a name, a
// spreadsheet id, and a tab.
import { createKvStore } from "./kvStateStore";
import { getClient } from "./store";
import { DIAL_KEY } from "./siteKeys";
import { EMPTY_DIAL_DOC, type CallList, type DialDoc } from "./dialShared";

export * from "./dialShared";

const store = () => createKvStore(getClient(), DIAL_KEY);

/**
 * The spreadsheet id out of anything Steven is likely to paste.
 *
 * He works from the browser, so what is on his clipboard is the whole URL with `/edit?gid=…#gid=…`
 * on the end. Accepting only a bare id would mean asking him to go and dig one out of a URL, which
 * is precisely the kind of chore this page exists to delete. A bare id still works.
 */
export function parseSpreadsheetId(input: string): string {
  const s = String(input || "").trim();
  if (!s) return "";
  const m = s.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (m) return m[1];
  return /^[a-zA-Z0-9-_]{20,}$/.test(s) ? s : "";
}

/** The gid, when a pasted URL carries one — so "the tab he was looking at" is the default. */
export function parseGid(input: string): string {
  const m = String(input || "").match(/[#&?]gid=(\d+)/);
  return m ? m[1] : "";
}

function normalise(raw: unknown): DialDoc {
  const doc = (raw || {}) as Partial<DialDoc>;
  const lists = Array.isArray(doc.lists) ? doc.lists : [];
  return {
    lists: lists
      .filter((l): l is CallList => Boolean(l && typeof l === "object"))
      .map((l) => ({
        id: String(l.id || "").trim(),
        name: String(l.name || "").trim() || "Untitled list",
        spreadsheetId: String(l.spreadsheetId || "").trim(),
        tab: String(l.tab || "").trim() || undefined,
        addedAt: l.addedAt,
      }))
      .filter((l) => l.id && l.spreadsheetId),
  };
}

export async function readLists(): Promise<CallList[]> {
  const raw = await store().read();
  return raw ? normalise(raw).lists : EMPTY_DIAL_DOC.lists;
}

export async function addList(opts: {
  name: string;
  paste: string;
  tab?: string;
}): Promise<{ ok: boolean; id?: string; error?: string }> {
  const spreadsheetId = parseSpreadsheetId(opts.paste);
  if (!spreadsheetId) {
    return { ok: false, error: "That doesn't look like a Google Sheet link or id." };
  }

  const lists = await readLists();
  const tab = String(opts.tab || "").trim();

  // Same sheet AND same tab twice is a mistake, not an intention — two cards over one list means
  // two half-finished queues and no way to tell which one is the real progress.
  const dupe = lists.find((l) => l.spreadsheetId === spreadsheetId && (l.tab || "") === tab);
  if (dupe) return { ok: false, error: `Already on the board as "${dupe.name}".` };

  const id = `list-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const next: CallList = {
    id,
    name: String(opts.name || "").trim() || "Untitled list",
    spreadsheetId,
    tab: tab || undefined,
    addedAt: new Date().toISOString(),
  };

  const ok = await store().write({ lists: [...lists, next] });
  return ok ? { ok: true, id } : { ok: false, error: "Couldn't save — storage refused the write." };
}

export async function updateList(
  id: string,
  patch: Partial<Pick<CallList, "name" | "tab">>
): Promise<{ ok: boolean; error?: string }> {
  const lists = await readLists();
  if (!lists.some((l) => l.id === id)) return { ok: false, error: "No such list." };

  const next = lists.map((l) =>
    l.id !== id
      ? l
      : {
          ...l,
          name: patch.name !== undefined ? String(patch.name).trim() || l.name : l.name,
          // An explicitly empty tab means "the first tab", which is a real choice — so `undefined`
          // has to survive the round trip rather than being read as "no change".
          tab: patch.tab !== undefined ? String(patch.tab).trim() || undefined : l.tab,
        }
  );

  const ok = await store().write({ lists: next });
  return ok ? { ok: true } : { ok: false, error: "Couldn't save." };
}

/**
 * Take a list off the board.
 *
 * ⚠️ THIS DELETES NOTHING BUT A POINTER, and the screen has to say so. The sheet, every note in it
 * and every call logged against it are untouched and still in his Drive — removing a list here is
 * closer to closing a tab than to deleting anything. A confirm dialog that implies otherwise would
 * make him hesitate over a reversible action forever.
 */
export async function removeList(id: string): Promise<{ ok: boolean; error?: string }> {
  const lists = await readLists();
  const next = lists.filter((l) => l.id !== id);
  if (next.length === lists.length) return { ok: false, error: "No such list." };
  const ok = await store().write({ lists: next });
  return ok ? { ok: true } : { ok: false, error: "Couldn't save." };
}
