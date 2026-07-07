import { NextResponse } from "next/server";

// Discovery-call intake handler. Forwards the answers to a Google Apps Script webhook
// (APPLY_WEBHOOK_URL) which appends a row to the SJC Discovery Intake sheet AND emails Steven.
// Google-native, no GHL. The webhook URL is a capability URL — kept server-side only, never
// shipped to the client. Degrades gracefully (still 200) when the webhook isn't configured yet,
// so the form never hard-fails on the prospect.

export const dynamic = "force-dynamic";

const FIELDS = [
  "firstName",
  "lastName",
  "email",
  "phone",
  "industry",
  "growth",
  "revenueNow",
  "revenueGoal",
  "emergency",
] as const;

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad request" }, { status: 400 });
  }

  // minimal validation — the four contact fields are the ones we can't do without
  const firstName = String(body.firstName || "").trim();
  const lastName = String(body.lastName || "").trim();
  const email = String(body.email || "").trim();
  const phone = String(body.phone || "").trim();
  if (!firstName || !lastName || !email || !phone) {
    return NextResponse.json({ ok: false, error: "missing contact fields" }, { status: 400 });
  }

  const payload: Record<string, string> = { submittedAt: new Date().toISOString() };
  for (const f of FIELDS) payload[f] = String(body[f] ?? "").trim();

  const webhook = process.env.APPLY_WEBHOOK_URL;
  if (!webhook) {
    // Not wired yet — accept the lead so the UX still works; log for visibility.
    console.warn("[apply] APPLY_WEBHOOK_URL not set — intake not persisted:", payload.email);
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
