// Send a blueprint link to a visitor who asked the twin for one — Lane D of the rabbit-hole plan.
//
//   POST /api/blueprint   { email?, phone?, first_name?, slug, url }
//
// ⛔ THE CALLER IS THE BRAIN (agent-sjc on Render), NOT A BROWSER. There is no owner cookie in that
// request, so this route carries its own shared secret (X-Blueprint-Key / env BLUEPRINT_KEY) and
// is listed PUBLIC in middleware.ts — public meaning "reachable without the site's login", not
// "reachable by anyone with the wrong key".
//
// Email rides the same sendAlert() every lead alert already uses — one sender, one proven path.
// Phone has no A2P number live yet (plan: "Twilio text once twilio_from has the A2P number"), so
// it reports honestly instead of pretending to send.
import { NextRequest } from "next/server";
import { sendAlert, DEFAULT_LEAD_FROM } from "@/lib/leadDelivery";

export const dynamic = "force-dynamic";

type Body = { email?: string; phone?: string; first_name?: string; slug?: string; url?: string };

// Same constant-time compare as middleware's SITE_EDIT_TOKEN check — a secret compared with
// `===` leaks its length and prefix through timing.
function authorized(req: NextRequest): boolean {
  const key = process.env.BLUEPRINT_KEY || "";
  if (!key || key.length < 16) return false;
  const presented = req.headers.get("x-blueprint-key") || "";
  if (presented.length !== key.length) return false;
  let diff = 0;
  for (let i = 0; i < key.length; i++) diff |= presented.charCodeAt(i) ^ key.charCodeAt(i);
  return diff === 0;
}

const looksLikeEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

export async function POST(req: NextRequest) {
  if (!authorized(req)) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "bad json" }, { status: 400 });
  }

  const slug = String(body.slug || "").trim();
  const url = String(body.url || "").trim();
  const email = String(body.email || "").trim();
  const phone = String(body.phone || "").trim();
  const firstName = String(body.first_name || "").trim();

  if (!slug || !url) {
    return Response.json({ ok: false, error: "slug and url are required" }, { status: 400 });
  }
  if (!email && !phone) {
    return Response.json({ ok: false, error: "email or phone is required" }, { status: 400 });
  }

  // Phone only, for now: honest about what isn't built yet rather than a silent no-op.
  if (phone && !email) {
    return Response.json({ sent: false, reason: "text not live" }, { status: 202 });
  }

  if (!looksLikeEmail(email)) {
    return Response.json({ ok: false, error: "not a valid email" }, { status: 400 });
  }

  // Two lines, his voice, plain — this is a link changing hands, not a marketing send.
  const greeting = firstName ? `${firstName}, h` : "H";
  const html =
    `<div style="font-family:-apple-system,Segoe UI,sans-serif;font-size:15px;color:#111827">` +
    `<p style="margin:0 0 14px">${greeting}ere's the blueprint we just talked about: <a href="${url}">${url}</a></p>` +
    `<p style="margin:0 0 18px">Take a look, and reply here if anything doesn't fit your business.</p>` +
    `<p style="margin:0;color:#9ca3af;font-size:12px">Steven</p></div>`;

  try {
    await sendAlert({
      to: email,
      from: DEFAULT_LEAD_FROM,
      fromName: "Steven",
      subject: "Your blueprint from Steven",
      html,
      replyTo: "steven@stevenjamesconsulting.com",
    });
  } catch (e) {
    return Response.json({ ok: false, error: (e as Error).message }, { status: 502 });
  }

  return Response.json({
    ok: true,
    email: { sent: true },
    ...(phone ? { sms: { sent: false, reason: "text not live" } } : {}),
  });
}
