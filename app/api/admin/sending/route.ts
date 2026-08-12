// WHAT RESEND ACTUALLY THINKS — the sending domains, their status, and the records they still want.
//
//   GET  /api/admin/sending          -> every domain Resend knows, with its DNS records + status
//   POST /api/admin/sending {name}   -> register a sending domain, and hand back what to publish
//
// ── WHY THIS EXISTS ───────────────────────────────────────────────────────────────────────────
// 2026-08-12. Every outgoing email was going out from the DESIGNS subdomain, months after the
// brands merged and the domain moved to Consulting. Switching it looked safe — `dig` showed
// `resend._domainkey.send.stevenjamesconsulting.com` published and healthy — and it broke every
// email in production the moment it deployed:
//
//   resend 403 — "The send.stevenjamesconsulting.com domain is not verified."
//
// Steven, before the error came back: *"I believe we set up both Steven James Consulting and
// Steven James design, but they might be fighting each other."* They were. The DKIM record was
// left in DNS when the domain was deleted from Resend, so the zone advertised a sender that Resend
// had never heard of.
//
// ⛔ THE LESSON THIS ROUTE ENCODES: DNS IS NOT THE AUTHORITY ON WHO MAY SEND. Resend is. A record
// you can see from outside proves somebody once set it up, not that it works — and the failure
// mode is silent until an email is refused, which is the worst moment to find out.
//
// Read-only by default. It cannot publish DNS (that lives at the registrar) — it tells you exactly
// what to publish, which is the part that was being guessed.
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const API = "https://api.resend.com/domains";

async function resend(path = "", init?: RequestInit) {
  // A separate, wider key if one is provided; otherwise the send-only key, which will 401 below.
  const key = process.env.RESEND_ADMIN_KEY || process.env.RESEND_API_KEY;
  if (!key) return { ok: false as const, error: "RESEND_API_KEY not set" };
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    // ⚠️ THE 401 YOU WILL ACTUALLY HIT. SJC's key is send-only — correctly, since it sits in a web
    // app's environment and a leak of it should not also hand over the DNS-facing domain list. So
    // this route reads nothing until a full-access key exists, and saying "resend 401" alone would
    // send somebody hunting for a broken key rather than a deliberately narrow one.
    const restricted = res.status === 401 && JSON.stringify(body).includes("restricted");
    return {
      ok: false as const,
      error: restricted
        ? "This Resend key is send-only, so the domain list can't be read here. Either check " +
          "resend.com/domains by hand, or add a full-access key as RESEND_ADMIN_KEY. The send " +
          "key is deliberately narrow — don't widen it."
        : `resend ${res.status} ${JSON.stringify(body)}`,
    };
  }
  return { ok: true as const, body };
}

type ResendRecord = { record?: string; name?: string; type?: string; value?: string; status?: string; priority?: number };
type ResendDomain = { id?: string; name?: string; status?: string; region?: string; records?: ResendRecord[] };

/** One domain, flattened to the three things that decide whether mail authenticates. */
function summarise(d: ResendDomain) {
  const recs = d.records || [];
  const has = (t: string) => recs.some((r) => (r.type || "").toUpperCase() === t);
  return {
    name: d.name,
    id: d.id,
    status: d.status, // "verified" is the only one that sends
    region: d.region,
    // ⚠️ SPF lives in a TXT record, so "has TXT" is not "has SPF" — match the value, not the type.
    spf: recs.some((r) => (r.value || "").toLowerCase().includes("spf1")),
    dkim: recs.some((r) => (r.name || "").includes("_domainkey")),
    // The SES bounce handler. Region-specific, which is exactly why it must never be guessed.
    bounceMx: has("MX"),
    records: recs.map((r) => ({
      type: r.type,
      name: r.name,
      value: r.value,
      priority: r.priority,
      status: r.status,
    })),
  };
}

export async function GET() {
  const res = await resend();
  if (!res.ok) return NextResponse.json({ ok: false, error: res.error }, { status: 502 });

  const list = ((res.body as { data?: ResendDomain[] })?.data || []).map(summarise);
  const verified = list.filter((d) => d.status === "verified").map((d) => d.name);

  return NextResponse.json({
    ok: true,
    domains: list,
    // The one line worth reading first: what may actually send right now.
    canSendFrom: verified,
    note:
      verified.length === 0
        ? "NOTHING can send. Every outgoing email will 403."
        : `Only ${verified.join(", ")} can send. A domain absent from this list is unverified no ` +
          `matter what its DNS says.`,
  });
}

export async function POST(req: Request) {
  let name = "";
  try {
    name = String(((await req.json()) as { name?: string })?.name || "").trim().toLowerCase();
  } catch {
    return NextResponse.json({ ok: false, error: "bad json" }, { status: 400 });
  }
  if (!name) return NextResponse.json({ ok: false, error: "which domain?" }, { status: 400 });

  const res = await resend("", { method: "POST", body: JSON.stringify({ name }) });
  if (!res.ok) return NextResponse.json({ ok: false, error: res.error }, { status: 502 });

  const d = summarise(res.body as ResendDomain);
  return NextResponse.json({
    ok: true,
    domain: d,
    // Publishing is a registrar job and deliberately not automated here — a wrong record on the
    // zone that carries the company's mail is not a thing to do from a POST body.
    next:
      "Publish every record above at the registrar, then re-run GET /api/admin/sending until " +
      "status reads 'verified'. Only then point DEFAULT_LEAD_FROM at this domain.",
  });
}
