import { NextResponse } from "next/server";

// Discovery-call intake handler. Receives a dynamic ordered list of {label, value} answers
// (whatever questions the /apply page currently has) and forwards them to a Google Apps Script
// webhook (APPLY_WEBHOOK_URL) which appends a row to the SJC Discovery Intake sheet AND emails
// Steven. Google-native, no GHL. The webhook URL is server-side only. Degrades gracefully (200)
// until the webhook is configured, so the form never hard-fails on the prospect.

export const dynamic = "force-dynamic";

type Answer = { key: string; label: string; value: string };

export async function POST(req: Request) {
  let body: { submittedAt?: string; answers?: unknown };
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

  const payload = {
    submittedAt: typeof body.submittedAt === "string" ? body.submittedAt : new Date().toISOString(),
    answers,
  };

  const webhook = process.env.APPLY_WEBHOOK_URL;
  if (!webhook) {
    console.warn("[apply] APPLY_WEBHOOK_URL not set — intake not persisted:", answers[0]?.value);
    return NextResponse.json({ ok: true, note: "webhook not configured" });
  }

  try {
    const res = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`webhook ${res.status}`);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[apply] webhook forward failed:", err);
    return NextResponse.json({ ok: false, error: "forward failed" }, { status: 502 });
  }
}
