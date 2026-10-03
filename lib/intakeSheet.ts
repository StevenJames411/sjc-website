// SJC's own intake: ONE Google Sheet, THREE tabs (Steven, 2026-10-03).
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
// own form's questions. A new question on a form adds a column at the END of its tab; nothing
// already collected moves.

type Answer = { key?: string; label: string; value: string };

export const INTAKE_TABS = ["Clients", "Careers", "Podcast Guests"] as const;
export type IntakeTab = (typeof INTAKE_TABS)[number];

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

/** Append one submission to its tab. Throws with a readable reason; the caller decides what that costs. */
export async function writeIntakeRow(tab: IntakeTab, answers: Answer[], submittedAt: string): Promise<void> {
  const id = intakeSheetId();
  const token = await accessToken();
  const auth = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
  const range = (a1: string) => encodeURIComponent(`'${tab}'!${a1}`);

  const head = await fetch(`${API}/${id}/values/${range("1:1")}`, { headers: auth, cache: "no-store" });
  if (!head.ok) throw new Error(`could not read the ${tab} tab: http ${head.status}`);
  const headers: string[] = (((await head.json()) as { values?: string[][] }).values?.[0] || []).map(String);
  if (!headers.length) headers.push("Received");

  // "Source" is the form naming itself; it is shown as the page it came from, not as an answer.
  const cells: Record<string, string> = { Received: readable(submittedAt) };
  for (const a of answers) {
    const label = (a.key || "").toLowerCase() === "source" || norm(a.label) === "source" ? "Form" : a.label.trim();
    if (!label) continue;
    cells[label] = cells[label] ? `${cells[label]} | ${a.value}` : a.value;
  }

  const before = headers.length;
  for (const label of Object.keys(cells)) {
    if (!headers.some((h) => norm(h) === norm(label))) headers.push(label);
  }
  if (headers.length !== before) {
    const put = await fetch(`${API}/${id}/values/${range("1:1")}?valueInputOption=RAW`, {
      method: "PUT",
      headers: auth,
      body: JSON.stringify({ values: [headers] }),
    });
    if (!put.ok) throw new Error(`could not add a column to ${tab}: http ${put.status}`);
  }

  const row = headers.map((h) => {
    const key = Object.keys(cells).find((l) => norm(l) === norm(h));
    return key ? cells[key] : "";
  });
  const add = await fetch(
    `${API}/${id}/values/${range("A1")}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
    { method: "POST", headers: auth, body: JSON.stringify({ values: [row] }) }
  );
  if (!add.ok) throw new Error(`could not write the row to ${tab}: http ${add.status}`);
}
