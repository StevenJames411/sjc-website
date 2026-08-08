// POST /api/dial/session — one finished calling session, into SJC's own operations sheet.
//
// Owner-only: middleware gates everything under /api/dial, so this inherits that with no extra
// line. ⛔ It writes to SJC's OWN ops sheet (PAYMENTS_SHEET_ID), never a prospect list and never a
// client's — a day's calling can span two metro sheets, and a per-list tab would fragment exactly
// the Monday-to-Saturday view the feature exists to give.
//
// ⚠️ ACCEPTS A BEACON. The board ends a session on tab close via navigator.sendBeacon, which sends
// a Blob with no custom headers and cannot be awaited. So this must not require a JSON
// content-type, must never redirect, and must answer fast — everything here is one sheet call.
import { findSite } from "@/lib/sites";
import { SJC } from "@/lib/siteKeys";
import { logSheetSession } from "@/lib/sheets";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: { session?: Record<string, unknown> };
  try {
    // .text() then parse, because a beacon arrives as a Blob with no content-type.
    body = JSON.parse(await req.text());
  } catch {
    return Response.json({ ok: false, error: "bad json" }, { status: 400 });
  }

  const s = body?.session;
  if (!s || typeof s !== "object") {
    return Response.json({ ok: false, error: "session required" }, { status: 400 });
  }

  // Same resolution as lib/payments.ts, and the same warning applies: ⛔ SJC's own `sheetId` is
  // LEAD ROUTING. Setting it to make this work would silently move the live /apply funnel.
  const sjc = await findSite(SJC);
  const spreadsheetId =
    (process.env.PAYMENTS_SHEET_ID || "").trim() || String(sjc?.sheetId || "").trim();
  if (!spreadsheetId) {
    return Response.json(
      { ok: false, error: "PAYMENTS_SHEET_ID is not set — no operations sheet to log sessions to." },
      { status: 400 }
    );
  }

  const n = (v: unknown) => Math.max(0, Math.round(Number(v) || 0));
  const res = await logSheetSession({
    spreadsheetId,
    session: {
      date: String(s.date || ""),
      who: String(s.who || "Steven"),
      started: String(s.started || ""),
      ended: String(s.ended || ""),
      activeMins: n(s.activeMins),
      dials: n(s.dials),
      convos: n(s.convos),
      callbacks: n(s.callbacks),
      sold: n(s.sold),
      list: String(s.list || ""),
    },
  });

  return Response.json(res, { status: res.ok ? 200 : 502 });
}
