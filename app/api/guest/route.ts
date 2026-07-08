import { NextResponse } from "next/server";

// Podcast-GUEST intake handler — mirrors /api/apply. Forwards the dynamic {key,label,value} answers
// to a Google Apps Script webhook. Uses GUEST_WEBHOOK_URL if set (a dedicated guest sheet); otherwise
// falls back to APPLY_WEBHOOK_URL so it works immediately, with a "Form Type = Podcast Guest" answer
// prepended so guests are cleanly distinguishable from client leads in the shared sheet. The keyed
// Apps Script turns that into its own column automatically — no script change needed.

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

  // Tag every guest submission so it's distinguishable even in the shared fallback sheet.
  const tagged: Answer[] = [{ key: "__formtype__", label: "Form Type", value: "Podcast Guest" }, ...answers];

  const payload = {
    submittedAt: typeof body.submittedAt === "string" ? body.submittedAt : new Date().toISOString(),
    formType: "Podcast Guest",
    answers: tagged,
  };

  const webhook = process.env.GUEST_WEBHOOK_URL || process.env.APPLY_WEBHOOK_URL;
  if (!webhook) {
    console.warn("[guest] no webhook set — guest intake not persisted:", answers[0]?.value);
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
    console.error("[guest] webhook forward failed:", err);
    return NextResponse.json({ ok: false, error: "forward failed" }, { status: 502 });
  }
}
