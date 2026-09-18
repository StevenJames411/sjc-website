// Owner-only, for the dial board (gated by middleware, same as /api/invoices):
//
//   GET    /api/dial                              -> { lists }
//   GET    /api/dial?list=<id>                    -> { list, headers, prospects, tabs, truncated }
//   POST   /api/dial { name, paste, tab? }        -> { ok, id }         point it at a call sheet
//   PATCH  /api/dial { id, name?, tab? }          -> { ok }             rename / change tab
//   PATCH  /api/dial { id, row, expectName, ... } -> { ok, row, wrote }  log one call
//   DELETE /api/dial { id }                       -> { ok }             take a list off the board
//
// ⛔ NOTHING PUBLIC READS THIS. A call sheet is Steven's own prospecting, and the only surface that
// touches it is a page behind the app password.
import { readLists, addList, updateList, removeList, toProspects, statusText, setDefaultList, reorderLists } from "@/lib/dial";
import { readSheetRows, logSheetCall, sheetsConfigured } from "@/lib/sheets";
import { getClient } from "@/lib/store";

export const dynamic = "force-dynamic";

// ── THE SNAPSHOT (Steven, 09-13) ──────────────────────────────────────────────────────────────
// "I don't need that data to be accurate every time I reload the page. These businesses move at a
// glacial pace... just a capture, a snapshot of when we pulled it, stick a date there, and when I
// want to refresh it and wait, we do that." The Apps Script webhook measured 9–42 s per read
// (09-13), so a list opens from its last capture in our own store — milliseconds — stamped with
// when it was pulled. `?refresh=1` is the only thing that goes back to the sheet. A logged call
// patches the snapshot too, so the board never shows a prospect as un-worked after he worked him.
type Snapshot = {
  title: string; tab: string; tabs: string[]; headers: string[];
  prospects: ReturnType<typeof toProspects>; truncated: boolean; snapshotAt: string;
};
const snapKey = (listId: string) => `dial:snapshot:${listId}`;
async function readSnapshot(listId: string): Promise<Snapshot | null> {
  try {
    const v = (await getClient()?.get(snapKey(listId))) as Snapshot | null | undefined;
    return v && Array.isArray(v.prospects) ? v : null;
  } catch { return null; }
}
async function writeSnapshot(listId: string, snap: Snapshot): Promise<void> {
  try { await getClient()?.set(snapKey(listId), snap, { force: true }); } catch { /* the sheet still answered; a missed capture only costs the next load */ }
}

export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const listId = sp.get("list") || "";
  const refresh = sp.get("refresh") === "1";
  const lists = await readLists();
  if (!listId) return Response.json({ lists, configured: sheetsConfigured() });

  const list = lists.find((l) => l.id === listId);
  if (!list) return Response.json({ ok: false, error: "No such list." }, { status: 404 });

  // The fast path: the last capture, unless he asked for fresh.
  if (!refresh) {
    const snap = await readSnapshot(listId);
    if (snap) return Response.json({ ok: true, list, ...snap, fromSnapshot: true });
  }

  const res = await readSheetRows({ spreadsheetId: list.spreadsheetId, tab: list.tab });
  if (!res.ok) {
    // ⚠️ The reason travels to the screen verbatim. "sheets webhook returned non-JSON" means the
    // Apps Script deployment is not set to Anyone, and a generic "couldn't load" would send him
    // looking at his sheet instead of at the one setting that is actually wrong.
    return Response.json({ ok: false, error: res.error }, { status: 502 });
  }

  // ⛔ `ok:true` IS NOT PROOF THE ANSWER IS A CALL SHEET.
  //
  // Apps Script replies to a POST with a 302, and the GET that follows it can land on `doGet`
  // rather than the cached POST result — `{ok:true, service:"sjc-sheets", version}`, truthy and
  // header-less. That used to reach `toProspects` and throw, and a thrown route is an HTML 500,
  // which the board could only render as "Couldn't reach the sheet." Name it instead.
  if (!Array.isArray(res.headers) || !Array.isArray(res.rows)) {
    return Response.json(
      { ok: false, error: "sheets webhook answered without a sheet (redirect landed on doGet) — try again" },
      { status: 502 }
    );
  }

  const snap: Snapshot = {
    title: res.title,
    tab: res.tab,
    tabs: res.tabs,
    headers: res.headers,
    prospects: toProspects(res.headers, res.rows),
    truncated: Boolean(res.truncated),
    snapshotAt: new Date().toISOString(),
  };
  await writeSnapshot(listId, snap);
  return Response.json({ ok: true, list, ...snap, fromSnapshot: false });
}

export async function POST(req: Request) {
  let body: { name?: string; paste?: string; tab?: string; group?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "bad json" }, { status: 400 });
  }
  const res = await addList({
    name: String(body?.name || ""),
    paste: String(body?.paste || ""),
    tab: String(body?.tab || ""),
    group: body?.group === undefined ? undefined : String(body.group),
  });
  return Response.json(res, { status: res.ok ? 200 : 400 });
}

export async function PATCH(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "bad json" }, { status: 400 });
  }

  // The lists column's order — PATCH { order: [ids] }.
  if (Array.isArray(body.order)) {
    const res = await reorderLists(body.order.map((x) => String(x)));
    return Response.json(res, { status: res.ok ? 200 : 400 });
  }

  const id = String(body?.id || "");
  if (!id) return Response.json({ ok: false, error: "id required" }, { status: 400 });

  // The highlighted pill is the default — see lib/dial.ts setDefaultList.
  if (body.default === true) {
    const res = await setDefaultList(id);
    return Response.json(res, { status: res.ok ? 200 : 400 });
  }

  // One route, two shapes. A `row` means "log a call"; anything else is editing the list itself.
  if (body.row === undefined) {
    const res = await updateList(id, {
      name: body.name === undefined ? undefined : String(body.name),
      tab: body.tab === undefined ? undefined : String(body.tab),
      group: body.group === undefined ? undefined : String(body.group),
    });
    return Response.json(res, { status: res.ok ? 200 : 400 });
  }

  const lists = await readLists();
  const list = lists.find((l) => l.id === id);
  if (!list) return Response.json({ ok: false, error: "No such list." }, { status: 404 });

  const expectName = String(body.expectName || "").trim();
  if (!expectName) {
    // The same refusal the script makes, made earlier. A write that has to guess which business it
    // is about is the one failure mode this whole surface is designed to make impossible.
    return Response.json({ ok: false, error: "expectName required" }, { status: 400 });
  }

  const res = await logSheetCall({
    spreadsheetId: list.spreadsheetId,
    tab: list.tab,
    row: Number(body.row),
    expectName,
    // ⛔ THE LABEL, NOT THE KEY. Steven reads this column in the sheet; it should say "Left
    // voicemail", not `voicemail`. normaliseStatus reads either back, so nothing downstream cares.
    outcome: body.outcome ? statusText(String(body.outcome)) : undefined,
    note: body.note ? String(body.note) : undefined,
    callbackAt: body.callbackAt ? String(body.callbackAt) : undefined,
    at: new Date().toISOString(),
  });

  // Keep the capture honest: the same change the board makes on screen, made in the snapshot.
  if (res.ok) {
    const snap = await readSnapshot(id);
    const at = (res as { at?: string }).at || new Date().toISOString();
    const rowNo = Number((res as { row?: number }).row ?? body.row);
    if (snap) {
      const outcome = body.outcome ? String(body.outcome) : "";
      const note = body.note ? String(body.note) : "";
      snap.prospects = snap.prospects.map((x) =>
        x.row === rowNo
          ? {
              ...x,
              status: outcome || x.status,
              lastCalled: outcome ? at : x.lastCalled,
              notes: [x.notes, `${at} — ${outcome || "note"}${note ? `: ${note}` : ""}`].filter(Boolean).join("\n"),
            }
          : x
      );
      await writeSnapshot(id, snap);
    }
  }

  return Response.json(res, { status: res.ok ? 200 : 502 });
}

export async function DELETE(req: Request) {
  let body: { id?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "bad json" }, { status: 400 });
  }
  const res = await removeList(String(body?.id || ""));
  return Response.json(res, { status: res.ok ? 200 : 400 });
}
