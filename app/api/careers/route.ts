import { NextResponse } from "next/server";

// Careers applications — sales setters and web builders.
//
// ⚠️ ITS OWN SHEET, DELIBERATELY. Applicants do NOT go into the Discovery Intake sheet with client
// prospects, and never into a client's spreadsheet. Different shape, different columns, different
// audience. /apply's own code warns what happens when two question sets share one sheet: the
// second quietly starts a fresh set of columns and orphans everything collected before it.
//
// Degrades gracefully. If the sheet or the mailer is unreachable the applicant still sees a thank
// you — the failure is logged and the email is the backstop. A careers form that hard-fails in
// front of a good salesperson costs more than a missed row.

export const dynamic = "force-dynamic";

// ⛔ ONE FORM = ONE SHEET. Every intake form gets its own spreadsheet — never a shared sheet
// with a "type" column. Two question sets in one sheet is how columns drift and older rows get
// orphaned, and it means a sheet can never be shared with one person without exposing the rest.
const SHEETS: Record<string, string | undefined> = {
  "Appointment Setter": process.env.CAREERS_SHEET_SETTER,
  "Web Builder": process.env.CAREERS_SHEET_BUILDER,
};
const sheetFor = (role: string) => (SHEETS[role] || "").trim();
// ⚠️ "Onboarding", not "Applications". The shared Apps Script that owns every SJC spreadsheet
// only accepts three tab names (Leads | Onboarding | Payments), and adding a fourth means
// redeploying a Google script by hand. The sheet is dedicated to careers, so the tab name is
// cosmetic — but that is why it reads Onboarding when you open it.
const TAB = "Onboarding" as const;

type Field = { label: string; value: string };

export async function POST(req: Request) {
  let body: { role?: string; answers?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad request" }, { status: 400 });
  }

  const role = String(body.role || "").trim() || "Unspecified";
  const answers: Field[] = (Array.isArray(body.answers) ? body.answers : [])
    .map((a) => ({
      label: String((a as Field)?.label ?? "").trim(),
      value: String((a as Field)?.value ?? "").trim(),
    }))
    .filter((a) => a.label);

  if (!answers.length) {
    return NextResponse.json({ ok: false, error: "no answers" }, { status: 400 });
  }

  const submittedAt = new Date().toISOString();
  // Track WHICH answer fed each fixed column so it isn't written twice. Matching on the label
  // text alone duplicated "Location and time zone" into both Location and its own column.
  const used = new Set<Field>();
  const named = (l: string) => {
    const hit = answers.find((a) => !used.has(a) && a.label.toLowerCase().includes(l));
    if (hit) used.add(hit);
    return hit?.value || "";
  };

  // Fixed leading columns so the sheet never shifts under rows already collected, then the
  // role-specific answers in the order they were asked.
  const lead = [
    { key: "name", label: "Name", value: named("name") },
    { key: "email", label: "Email", value: named("email") },
    { key: "phone", label: "Phone", value: named("phone") },
    { key: "location", label: "Location", value: named("location") },
  ];
  const rows = [
    ...lead,
    ...answers
      .filter((a) => !used.has(a))
      .map((a) => ({ key: a.label.toLowerCase().replace(/[^a-z0-9]+/g, "_").slice(0, 40), label: a.label, value: a.value })),
  ];

  const problems: string[] = [];

  const sheetId = sheetFor(role);
  if (sheetId) {
    try {
      const { writeSheetRow } = await import("@/lib/sheets");
      // notifyEmail is Leads-only in the script, so the Resend mail below is the notification.
      const res = await writeSheetRow({ spreadsheetId: sheetId, tab: TAB, answers: rows, submittedAt });
      if (!res.ok) problems.push(`sheet: ${res.error}`);
    } catch (e) {
      problems.push(`sheet: ${e instanceof Error ? e.message : String(e)}`);
    }
  } else {
    problems.push(`no sheet configured for role "${role}"`);
  }

  // The email is the backstop — if the sheet is down, the application still reaches a human.
  try {
    const key = (process.env.RESEND_API_KEY || "").trim();
    if (key) {
      const lines = rows
        .map((f) => `<tr><td style="padding:6px 14px 6px 0;color:#666;white-space:nowrap">${escapeHtml(f.label)}</td><td style="padding:6px 0">${escapeHtml(f.value) || "—"}</td></tr>`)
        .join("");
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "SJC Careers <careers@send.stevenjamesconsulting.com>",
          to: ["steven@stevenbarchetti.com"],
          reply_to: named("email") || undefined,
          subject: `Application — ${role} — ${named("name") || "no name"}`,
          html: `<div style="font:15px/1.6 -apple-system,system-ui,sans-serif">
                   <h2 style="font-weight:600">New application</h2>
                   <table>${lines}</table>
                 </div>`,
        }),
      });
    } else {
      problems.push("RESEND_API_KEY is not set");
    }
  } catch (e) {
    problems.push(`email: ${e instanceof Error ? e.message : String(e)}`);
  }

  if (problems.length) console.error("[careers] delivery problems:", problems.join(" · "));

  // Never surface plumbing to the applicant.
  return NextResponse.json({ ok: true });
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] as string));
}
