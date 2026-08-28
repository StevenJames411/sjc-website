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
import { readLists, addList, updateList, removeList, toProspects, statusText } from "@/lib/dial";
import { readSheetRows, logSheetCall, sheetsConfigured } from "@/lib/sheets";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const listId = new URL(req.url).searchParams.get("list") || "";
  const lists = await readLists();
  if (!listId) return Response.json({ lists, configured: sheetsConfigured() });

  const list = lists.find((l) => l.id === listId);
  if (!list) return Response.json({ ok: false, error: "No such list." }, { status: 404 });

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

  return Response.json({
    ok: true,
    list,
    title: res.title,
    tab: res.tab,
    tabs: res.tabs,
    headers: res.headers,
    prospects: toProspects(res.headers, res.rows),
    truncated: Boolean(res.truncated),
  });
}

export async function POST(req: Request) {
  let body: { name?: string; paste?: string; tab?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "bad json" }, { status: 400 });
  }
  const res = await addList({
    name: String(body?.name || ""),
    paste: String(body?.paste || ""),
    tab: String(body?.tab || ""),
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

  const id = String(body?.id || "");
  if (!id) return Response.json({ ok: false, error: "id required" }, { status: 400 });

  // One route, two shapes. A `row` means "log a call"; anything else is editing the list itself.
  if (body.row === undefined) {
    const res = await updateList(id, {
      name: body.name === undefined ? undefined : String(body.name),
      tab: body.tab === undefined ? undefined : String(body.tab),
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
