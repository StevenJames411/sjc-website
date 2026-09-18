// POST /api/mail/send — a mail relay for other SJC services. The website holds the only readable
// RESEND_API_KEY (sealed as a Vercel Secret; nobody can read it back out), so this is how a
// server that has no Resend key of its own — the booking agent on Render — still sends email.
//
//   { to, subject, text, html?, replyTo?, from? }  ->  { ok: true, id }
//
// ⛔ THE CALLER IS A SERVER, NOT A BROWSER. Gated by Authorization: Bearer MAIL_SEND_TOKEN, checked
// here — same pattern as /api/blueprint's X-Blueprint-Key — and listed PUBLIC in middleware.ts for
// the same reason: public meaning "reachable without the site's owner login," not "reachable by
// anyone with the wrong token."
//
// ⛔ THE ROUTE DECIDES THE DOMAIN. A caller may name a display name; the address it sends from is
// always on send.stevenjamesconsulting.com, the verified sender — a `from` that names a different
// domain is rejected rather than silently corrected, so a misconfigured caller fails loudly.
import { NextRequest } from "next/server";
import { sendAlert } from "@/lib/leadDelivery";

export const dynamic = "force-dynamic";

const SEND_DOMAIN = "send.stevenjamesconsulting.com";
const DEFAULT_FROM_ADDRESS = `notifications@${SEND_DOMAIN}`;
const DEFAULT_FROM_NAME = "Steven James Consulting";
const MAX_RECIPIENTS = 100;

// Same constant-time compare as middleware's SITE_EDIT_TOKEN check and /api/blueprint's
// BLUEPRINT_KEY — a secret compared with `===` leaks its length and prefix through timing.
function authorized(req: NextRequest): boolean {
  const token = process.env.MAIL_SEND_TOKEN || "";
  if (!token || token.length < 32) return false;
  const header = req.headers.get("authorization") || "";
  if (!header.startsWith("Bearer ")) return false;
  const presented = header.slice(7).trim();
  if (presented.length !== token.length) return false;
  let diff = 0;
  for (let i = 0; i < token.length; i++) diff |= presented.charCodeAt(i) ^ token.charCodeAt(i);
  return diff === 0;
}

/**
 * The caller only picks the display name. `"Name <local@send.stevenjamesconsulting.com>"` and a
 * bare `"local@send.stevenjamesconsulting.com"` are honoured because the address is already on
 * the verified domain; anything on another domain is rejected (null). A bare name, or nothing at
 * all, gets the default address on the same domain.
 */
function resolveFrom(caller?: string): { fromName: string; from: string } | null {
  const raw = (caller || "").trim();
  if (!raw) return { fromName: DEFAULT_FROM_NAME, from: DEFAULT_FROM_ADDRESS };
  const angled = raw.match(/^(.*)<([^<>]+)>$/);
  if (angled) {
    const email = angled[2].trim().toLowerCase();
    if (!email.endsWith(`@${SEND_DOMAIN}`)) return null;
    return { fromName: angled[1].trim() || DEFAULT_FROM_NAME, from: email };
  }
  if (raw.includes("@")) {
    const email = raw.toLowerCase();
    if (!email.endsWith(`@${SEND_DOMAIN}`)) return null;
    return { fromName: DEFAULT_FROM_NAME, from: email };
  }
  return { fromName: raw, from: DEFAULT_FROM_ADDRESS };
}

const esc = (s: string) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

type Body = {
  to?: string | string[];
  subject?: string;
  text?: string;
  html?: string;
  replyTo?: string;
  from?: string;
};

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

  const to = Array.isArray(body.to) ? body.to.map((x) => String(x).trim()).filter(Boolean) : body.to ? [String(body.to).trim()] : [];
  const subject = String(body.subject || "").trim();
  const text = String(body.text || "").trim();
  const html = body.html ? String(body.html) : undefined;
  const replyTo = body.replyTo ? String(body.replyTo).trim() : undefined;

  if (to.length === 0 || !subject || (!text && !html)) {
    return Response.json(
      { ok: false, error: "to, subject and text (or html) are required" },
      { status: 400 }
    );
  }
  if (to.length > MAX_RECIPIENTS) {
    return Response.json({ ok: false, error: `too many recipients (max ${MAX_RECIPIENTS})` }, { status: 400 });
  }

  const sender = resolveFrom(body.from);
  if (!sender) {
    return Response.json({ ok: false, error: `from must be on ${SEND_DOMAIN}` }, { status: 400 });
  }

  try {
    const sent = await sendAlert({
      to,
      from: sender.from,
      fromName: sender.fromName,
      subject,
      html: html || `<pre style="font-family:inherit;white-space:pre-wrap">${esc(text)}</pre>`,
      text: text || undefined,
      replyTo,
    });
    return Response.json({ ok: true, id: sent.id });
  } catch (err) {
    return Response.json({ ok: false, error: String((err as Error)?.message || err) }, { status: 502 });
  }
}
