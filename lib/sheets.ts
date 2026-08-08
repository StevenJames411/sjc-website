// Talking to SJC Sheets — the ONE Apps Script that owns every client's spreadsheet. SERVER ONLY.
//
// Before this, each client's sheet had its own bound script, which meant a deployment and a Google
// authorization click per customer, forever. One script that opens any spreadsheet by id removes
// all of that: authorize once, then adding a client is an API call.
//
// Source of the script: scripts/sjc-sheets.gs (the copy of record; it lives in Google).
//
// ⚠️ Two things about Apps Script that will waste an afternoon if you don't know them:
//
//  1. It answers a POST with a 302 to script.googleusercontent.com, and the JSON is at the far
//     end. fetch() follows that correctly. `curl -X POST -L` does NOT — forcing the method makes
//     curl re-POST to the redirect and you get an HTML login page instead of your answer.
//  2. It returns HTTP 200 even when the script throws. Success has to be read from the BODY,
//     never from the status code, or every failure looks like a success.

const url = () => process.env.SHEETS_WEBHOOK_URL || "";
const secret = () => process.env.SHEETS_SECRET || "";

export const sheetsConfigured = () => Boolean(url() && secret());

type Ok<T> = { ok: true } & T;
type Err = { ok: false; error: string };

async function call<T>(action: string, payload: Record<string, unknown>): Promise<Ok<T> | Err> {
  if (!sheetsConfigured()) {
    return { ok: false, error: "SHEETS_WEBHOOK_URL / SHEETS_SECRET are not set" };
  }
  try {
    const res = await fetch(url(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, action, secret: secret() }),
    });
    const text = await res.text();
    let body: unknown;
    try {
      body = JSON.parse(text);
    } catch {
      // Almost always Google's sign-in page, which means the deployment is not set to "Anyone".
      return { ok: false, error: `sheets webhook returned non-JSON (${text.slice(0, 120)})` };
    }
    const b = body as Record<string, unknown>;
    if (!b?.ok) return { ok: false, error: String(b?.error || "sheets webhook refused") };
    return b as Ok<T>;
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "sheets webhook unreachable" };
  }
}

/**
 * Make a client their own spreadsheet — Leads + Onboarding tabs, ready to use.
 *
 * ⚠️ CHECK `sharedWith`, NOT JUST `ok`. Creating the sheet and sharing it are two separate
 * outcomes, and the script deliberately does not throw when the share fails — a typo'd address must
 * not lose a spreadsheet that was built correctly. So `ok: true` with `sharedWith: null` is a real
 * and important state: the sheet exists, we stored its id, and the client cannot open the thing she
 * is paying for. She finds out months later when she goes looking for her leads. `shareError`
 * carries the reason when an address was given and rejected.
 */
export function createClientSheet(businessName: string, shareWith?: string) {
  return call<{
    spreadsheetId: string;
    url: string;
    /** Null when no address was given OR when sharing failed — `shareError` tells them apart. */
    sharedWith: string | null;
    shareError?: string | null;
  }>("createClientSheet", {
    businessName,
    shareWith: shareWith || "",
  });
}

/**
 * Write one row into a sheet.
 *
 * ⚠️ "Payments" IS SJC'S OWN SHEET, NEVER A CLIENT'S. Leads and Onboarding belong in her
 * spreadsheet; what Steven gets paid does not. One business = one sheet is what keeps his revenue
 * out of a document he shares with customers. lib/payments.ts is the only caller that uses it.
 */
/**
 * Read a call sheet back — headers, rows, and the tab names. The dial board's only reader.
 *
 * ⚠️ Values arrive as the sheet DISPLAYS them (see readRows_ in the .gs). A phone number that is
 * stored as a number comes back "+1512-846-4044", which is the dialable form and the one Steven is
 * looking at on screen. Do not "fix" this into typed values.
 */
export function readSheetRows(opts: { spreadsheetId: string; tab?: string }) {
  return call<{
    title: string;
    tab: string;
    tabs: string[];
    headers: string[];
    rows: { row: number; cells: string[] }[];
    truncated?: boolean;
  }>("readRows", opts);
}

/**
 * Write the outcome of one call onto one row.
 *
 * ⚠️ `expectName` IS NOT OPTIONAL AND IS NOT A COURTESY. The script refuses to write without it,
 * and re-finds the business by name if the row has moved under us. A board holding a list read
 * five minutes ago cannot trust a row number — one sort of the sheet and it would file "not
 * interested" against somebody who was never called. See logCall_ in scripts/sjc-sheets.gs.
 */
export function logSheetCall(opts: {
  spreadsheetId: string;
  tab?: string;
  row: number;
  /** The business name the board believes is on that row. The write is verified against it. */
  expectName: string;
  outcome?: string;
  note?: string;
  /** Human-readable, e.g. "Tue 12 Aug, 10:00 AM" — a note to himself, not a machine date. */
  callbackAt?: string;
  at?: string;
}) {
  return call<{ row: number; wrote: string[]; at: string }>("logCall", opts);
}

/**
 * Log a finished call session — appends to `Sessions` and accumulates the `Days` total.
 *
 * ⛔ THE SPREADSHEET IS SJC'S OWN OPERATIONS SHEET, NEVER A CLIENT'S AND NEVER A PROSPECT LIST.
 * A day's calling can span two metro sheets, so a per-list tab would fragment the
 * Monday-to-Saturday view this exists to give. Same sheet payments already write to.
 */
export function logSheetSession(opts: {
  spreadsheetId: string;
  session: {
    date: string;
    who: string;
    started: string;
    ended: string;
    activeMins: number;
    dials: number;
    convos: number;
    callbacks: number;
    sold: number;
    list: string;
  };
}) {
  return call<{ sessionRow: number; dayRow: number }>("logSession", opts);
}

export function writeSheetRow(opts: {
  spreadsheetId: string;
  tab: "Leads" | "Onboarding" | "Payments";
  answers: { key: string; label: string; value: string }[];
  submittedAt?: string;
  /** Who gets the "new enquiry" email. Leads only — onboarding and payments never email. */
  notifyEmail?: string;
}) {
  return call<{ tab: string; row: number }>("write", opts);
}
