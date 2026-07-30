import { NextResponse } from "next/server";
import { deliverLead } from "@/lib/leadDelivery";

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
  const siteId = String(body.siteId || "").trim();

  const d = await deliverLead(siteId, answers, submittedAt);

  // Loud on every problem. A lead that vanishes while the visitor is told "thanks!" is the worst
  // outcome this route has, and it is silent by nature — so it gets shouted into the log.
  for (const p of d.problems) console.error(`[apply] site=${siteId || "-"} ${p}`);

  // The visitor still sees success as long as SOMEBODY has it. Failing the form in front of a
  // real customer because our second copy bounced would lose the lead outright.
  const landed = d.toRecord || d.toOwner === true;
  if (!landed) {
    return NextResponse.json({ ok: false, error: "forward failed" }, { status: 502 });
  }
  return NextResponse.json({ ok: true, toOwner: d.toOwner, toRecord: d.toRecord });
}
