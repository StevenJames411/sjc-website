// SJC's own intake: ONE Google Sheet, a tab per reason (Steven, 2026-10-03). Three to start; the book
// download became the fourth the same night - the email list he builds as people take the book.
//
// "My website has three different reasons somebody does an intake. One to become a client, one to
// start working for me, and one to become a podcast guest. So that form on my website should go to
// one Google Sheet with three different tabs." The dashboard he opens every day carries one link to
// that sheet ("Intake Forms", under Inbox).
//
// ⚠️ THIS IS FOR STEVEN JAMES CONSULTING'S WEBSITE ONLY. A client's site still writes to that
// client's own sheet (lib/leadDelivery.ts leg 2). Nothing here ever sees a client's lead.
//
// ⚠️ WRITTEN STRAIGHT TO THE SHEETS API, NOT THROUGH AN APPS SCRIPT. The two scripts
// (apply-webhook.gs, sjc-sheets.gs) each hard-code their tab names, and changing a tab name there
// means pasting and redeploying a script by hand in Google — a manual step, which is the thing he
// has ruled out. This needs no script: a stored Google sign-in (the same one the retainer sheet
// used) writes the row directly, and a tab is a string.
//
// ONE TAB = ONE QUESTION SET. The old rule was "one form, one spreadsheet", because two question
// sets sharing columns is how columns drift. Three tabs keep that promise: each tab has only its
// own form's questions. A new question on a form adds a column at the END of its tab; a reworded
// question renames its own column; nothing already collected moves.

type Answer = { key?: string; label: string; value: string };

export const INTAKE_TABS = ["Clients", "Careers", "Podcast Guests", "Book Downloads"] as const;
export type IntakeTab = (typeof INTAKE_TABS)[number];

// ⛔ A TAB IS FOUND BY ITS ID, NOT ITS NAME. Steven renamed "Clients" to "New Clients" in the sheet the
// same day it was built, which is his sheet to rename. Looking the tab up by name would have sent
// every application to the old intake as "tab missing". The id never changes when a tab is renamed
// or dragged; the name here is only what the tab was called when it was created.
const INTAKE_TAB_IDS: Record<IntakeTab, number> = {
  Clients: 1075829341,
  Careers: 1842264944,
  "Podcast Guests": 1632756491,
  "Book Downloads": 716764380,
};

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const API = "https://sheets.googleapis.com/v4/spreadsheets";

export function intakeSheetId(): string {
  return (process.env.INTAKE_SHEET_ID || "").trim();
}

export function intakeConfigured(): boolean {
  return Boolean(
    intakeSheetId() &&
      process.env.GOOGLE_CLIENT_ID &&
      process.env.GOOGLE_CLIENT_SECRET &&
      process.env.GOOGLE_REFRESH_TOKEN
  );
}

/**
 * Which of the three reasons this submission is.
 *
 * Read from what the FORM says about itself (its source: the block id, e.g. "careers-apply",
 * "podcast-guest-form", "home-application"). Never from a business name. Anything that is not
 * plainly careers or podcast is somebody asking to become a client, which is the safe default: a
 * misfiled row in Clients gets seen the same day.
 */
export function intakeTabFor(answers: Answer[]): IntakeTab {
  const src = (answers.find((a) => (a.key || a.label).toLowerCase() === "source")?.value || "").toLowerCase();
  if (src.includes("career") || src.includes("hiring") || src.includes("job")) return "Careers";
  if (src.includes("podcast") || src.includes("guest")) return "Podcast Guests";
  // The book's own form ("book-download"). ⚠️ Not `includes("book")`: the Paid Ads page's application is
  // "booked-appointments-application", and that is somebody asking to become a client.
  if (src.includes("book-download") || src.includes("get-the-book")) return "Book Downloads";
  return "Clients";
}

async function accessToken(): Promise<string> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID || "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN || "",
      grant_type: "refresh_token",
    }),
    cache: "no-store",
  });
  const body = (await res.json().catch(() => null)) as { access_token?: string; error?: string } | null;
  if (!res.ok || !body?.access_token) throw new Error(`Google sign-in refused: ${body?.error || res.status}`);
  return body.access_token;
}

// "10/3/2026 2:07 PM", Central. Text on purpose: a real date cell needs a number format, and that
// failed silently twice in the Apps Script version (see readableTime_ in sjc-sheets.gs).
function readable(iso: string): string {
  const d = new Date(iso);
  const when = Number.isFinite(d.getTime()) ? d : new Date();
  return when.toLocaleString("en-US", {
    timeZone: "America/Chicago",
    month: "numeric",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).replace(",", "");
}

const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();

// ⛔ A COLUMN BELONGS TO THE QUESTION, NOT TO ITS WORDING (Steven, 2026-10-03): "If I want to rename
// it, the column just gets renamed… I'm going to go through the forms, change the questions, reword
// shit. So I don't want it to be a never-ending growing sheet."
// Every question in the form library has a permanent id (`fieldId`, e.g. q-skill) that survives
// rewording. That id is kept as a NOTE on the column's heading cell. A submission finds its column
// by the note, and if the heading no longer matches the question's current wording, the heading is
// rewritten in place. A new column appears only for a question the sheet has never seen.
const KEY_RECEIVED = "__received";
const KEY_FORM = "__form";

type HeadCell = { text: string; note: string };

/** Append one submission to its tab. Throws with a readable reason; the caller decides what that costs. */
export async function writeIntakeRow(tab: IntakeTab, answers: Answer[], submittedAt: string): Promise<void> {
  const id = intakeSheetId();
  const token = await accessToken();
  const auth = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  const names = await fetch(`${API}/${id}?fields=sheets(properties(sheetId,title))`, { headers: auth, cache: "no-store" });
  if (!names.ok) throw new Error(`could not open the intake sheet: http ${names.status}`);
  const all = ((await names.json()) as { sheets?: { properties: { sheetId: number; title: string } }[] }).sheets || [];
  const mine = all.find((x) => x.properties.sheetId === INTAKE_TAB_IDS[tab]) || all.find((x) => x.properties.title === tab);
  if (!mine) throw new Error(`the ${tab} tab is missing from the intake sheet`);
  const gid = mine.properties.sheetId;
  const title = mine.properties.title.replace(/'/g, "''");     // whatever he calls it today

  const meta = await fetch(
    `${API}/${id}?ranges=${encodeURIComponent(`'${title}'!1:1`)}&fields=sheets(properties(sheetId),data(rowData(values(formattedValue,note))))`,
    { headers: auth, cache: "no-store" }
  );
  if (!meta.ok) throw new Error(`could not read the ${tab} tab: http ${meta.status}`);
  const sheet = ((await meta.json()) as {
    sheets?: { properties: { sheetId: number }; data?: { rowData?: { values?: { formattedValue?: string; note?: string }[] }[] }[] }[];
  }).sheets?.find((x) => x.properties.sheetId === gid);
  if (!sheet) throw new Error(`the ${tab} tab is missing from the intake sheet`);
  const head: HeadCell[] = (sheet.data?.[0]?.rowData?.[0]?.values || []).map((v) => ({
    text: String(v.formattedValue || ""),
    note: String(v.note || "").trim(),
  }));

  // What this submission carries: [permanent id, current wording, value]. "Source" is the form
  // naming itself; it is shown as the Form column, not as an answer.
  const items: { key: string; label: string; value: string }[] = [
    { key: KEY_RECEIVED, label: "Received", value: readable(submittedAt) },
  ];
  for (const a of answers) {
    const isSource = (a.key || "").toLowerCase() === "source" || norm(a.label) === "source";
    const label = isSource ? "Form" : a.label.trim();
    if (!label) continue;
    const key = isSource ? KEY_FORM : (a.key || "").trim() || norm(label);
    const dup = items.find((x) => x.key === key);
    if (dup) dup.value = `${dup.value} | ${a.value}`;
    else items.push({ key, label, value: a.value });
  }

  const changed = new Set<number>();
  const colOf = new Map<string, number>();
  for (const it of items) {
    let c = head.findIndex((h) => h.note === it.key);
    if (c < 0) c = head.findIndex((h, i) => !h.note && norm(h.text) === norm(it.label) && ![...colOf.values()].includes(i));
    if (c < 0) {
      head.push({ text: it.label, note: it.key });
      c = head.length - 1;
      changed.add(c);
    } else if (head[c].note !== it.key || head[c].text !== it.label) {
      head[c] = { text: it.label, note: it.key };
      changed.add(c);
    }
    colOf.set(it.key, c);
  }

  if (changed.size) {
    const put = await fetch(`${API}/${id}:batchUpdate`, {
      method: "POST",
      headers: auth,
      body: JSON.stringify({
        requests: [...changed].map((c) => ({
          updateCells: {
            range: { sheetId: gid, startRowIndex: 0, endRowIndex: 1, startColumnIndex: c, endColumnIndex: c + 1 },
            rows: [{
              values: [{
                userEnteredValue: { stringValue: head[c].text },
                note: head[c].note,
                userEnteredFormat: { textFormat: { bold: true }, wrapStrategy: "WRAP", verticalAlignment: "TOP" },
              }],
            }],
            fields: "userEnteredValue,note,userEnteredFormat(textFormat.bold,wrapStrategy,verticalAlignment)",
          },
        })),
      }),
    });
    if (!put.ok) throw new Error(`could not update a heading on ${tab}: http ${put.status}`);
  }

  const row: string[] = head.map(() => "");
  for (const it of items) row[colOf.get(it.key) as number] = it.value;
  const add = await fetch(
    `${API}/${id}/values/${encodeURIComponent(`'${title}'!A1`)}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
    { method: "POST", headers: auth, body: JSON.stringify({ values: [row] }) }
  );
  if (!add.ok) throw new Error(`could not write the row to ${tab}: http ${add.status}`);
}
