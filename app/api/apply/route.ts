import { NextResponse } from "next/server";
import { deliverLead } from "@/lib/leadDelivery";
import { SJC } from "@/lib/siteKeys";

// Discovery-call intake handler. Receives a dynamic ordered list of {label, value} answers
// (whatever questions the /apply page currently has) and forwards them to a Google Apps Script
// webhook (APPLY_WEBHOOK_URL) which appends a row to the SJC Discovery Intake sheet AND emails
// Steven. Google-native, no GHL. The webhook URL is server-side only. Degrades gracefully (200)
// until the webhook is configured, so the form never hard-fails on the prospect.

export const dynamic = "force-dynamic";

type Answer = { key: string; label: string; value: string };

export async function POST(req: Request) {
  let body: { submittedAt?: string; answers?: unknown; siteId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad request" }, { status: 400 });
  }

  const raw = Array.isArray(body.answers) ? body.answers : [];
  const answers: Answer[] = raw
    .map((a) => ({
      key: String((a as Answer)?.key ?? "").trim(),
      label: String((a as Answer)?.label ?? "").trim(),
      value: String((a as Answer)?.value ?? "").trim(),
    }))
    .filter((a) => a.label);

  if (answers.length === 0) {
    return NextResponse.json({ ok: false, error: "no answers" }, { status: 400 });
  }

  const submittedAt =
    typeof body.submittedAt === "string" ? body.submittedAt : new Date().toISOString();
  // Sent by the form from the route it was served under — NOT from an editable field, so a lead
  // can't be routed to the wrong business by a typo. See components/blocks/SiteContext.
  //
  // ⚠️ FALLS BACK TO SJC, AND THAT FIXED A SILENT FAILURE (2026-08-05).
  //
  // The block-based LeadForm reads its site from SiteContext and always sends one. The /apply and
  // /guest WIZARDS (components/ApplyForm) never have — they predate websites being first-class
  // objects and post no siteId at all. So deliverLead("") found no site, saw no owner address,
  // and skipped the owner email entirely. The row still reached the sheet, so nothing looked
  // broken from the outside.
  //
  // That was survivable only while Apps Script sent a duplicate alert. Removing that duplicate
  // today would have left /apply and the podcast form with NO notification whatsoever — a real
  // application arriving with nobody told. Same convention lib/puckContent already uses: a caller
  // that predates multi-site means SJC.
  const siteId = String(body.siteId || "").trim() || SJC;

  const d = await deliverLead(siteId, answers, submittedAt);

  // Loud on every problem. A lead that vanishes while the visitor is told "thanks!" is the worst
  // outcome this route has, and it is silent by nature — so it gets shouted into the log.
  for (const p of d.problems) console.error(`[apply] site=${siteId || "-"} ${p}`);

  // The visitor still sees success as long as SOMEBODY has it. Failing the form in front of a
  // real customer because our second copy bounced would lose the lead outright.
  const landed = d.toRecord || d.toOwner === true || d.toSheet === true;
  if (!landed) {
    return NextResponse.json({ ok: false, error: "forward failed", problems: d.problems }, { status: 502 });
  }
  // `problems` rides along even on success: a lead can reach one destination and miss the other,
  // and that half-failure is exactly what went unnoticed — the email arrived, the sheet row never
  // did, and the form said thank-you. A test submission can now see what actually happened.
  return NextResponse.json({
    ok: true,
    toOwner: d.toOwner,
    toRecord: d.toRecord,
    toSheet: d.toSheet,
    ...(d.problems.length ? { problems: d.problems } : {}),
  });
}
