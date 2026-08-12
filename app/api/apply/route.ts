import { NextResponse } from "next/server";
import { deliverLead } from "@/lib/leadDelivery";
import { recordLead, attachDelivery } from "@/lib/leadStore";
import { resolveHost } from "@/lib/host";
import { findSite } from "@/lib/sites";
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
  // ⛔ THE HOST DECIDES, NOT THE BODY (2026-08-12). The note above is true of the BROWSER and was
  // false of the ENDPOINT: the server read `siteId` straight off the JSON and never checked it
  // against anything. So anyone could POST `{"siteId":"<someone>"}` directly — no page visit, no
  // honeypot (that check is client-side only) — and write into that business's Google Sheet, POST
  // a contact into their GHL, and email their owner with `reply_to` set to whatever they supplied.
  //
  // And destructively: `recordLead` trims stored leads to the newest 500, so a few hundred forged
  // posts evict every real one from the safety net that exists for exactly the "I never got that
  // lead" conversation.
  //
  // `resolveHost` already answers "which website is this request for" from the hostname, and that
  // is the only trustworthy source. A body id that disagrees is REFUSED rather than quietly
  // preferred, so a mismatch shows up instead of becoming someone else's lead.
  const host = await resolveHost();
  const claimed = String(body.siteId || "").trim();
  let siteId: string;
  if (host.kind === "client") {
    // The hostname names a real website. That is authoritative, and a body claiming a DIFFERENT
    // site is refused rather than quietly preferred — this is the whole exploit.
    if (claimed && claimed !== host.site.id) {
      return NextResponse.json(
        { ok: false, error: "That form doesn't belong to this website." },
        { status: 400 }
      );
    }
    siteId = host.site.id;
  } else {
    // The host resolves to no particular website — a Vercel preview URL, localhost, or the studio
    // domain. There is nothing to contradict, so a claimed id is accepted, but only after being
    // checked against the registry so an arbitrary string still cannot mint keys.
    const known = claimed ? await findSite(claimed) : null;
    siteId = known?.id || SJC;
  }

  // ── WRITTEN DOWN FIRST, DELIVERED SECOND ────────────────────────────────────────────────────
  //
  // ⚠️ THE ORDER IS THE WHOLE POINT. Until 2026-08-06 a lead was delivery-only: if every leg
  // failed, the answers existed nowhere but the visitor's browser and were gone the moment she
  // closed the tab. Storing before attempting turns that from LOST into UNDELIVERED.
  //
  // A null id means the store itself is down — the delivery below is then the only copy this
  // lead will ever have, which is worth saying out loud at the time rather than discovering later.
  const leadId = await recordLead(siteId, answers, submittedAt);

  const d = await deliverLead(siteId, answers, submittedAt);

  // Loud on every problem. A lead that vanishes while the visitor is told "thanks!" is the worst
  // outcome this route has, and it is silent by nature — so it gets shouted into the log.
  for (const p of d.problems) console.error(`[apply] site=${siteId || "-"} lead=${leadId || "UNSTORED"} ${p}`);

  // Best-effort annotation. The lead is already safe; failing to record what happened to it must
  // never turn a delivered lead into an error the visitor sees.
  if (leadId) await attachDelivery(siteId, leadId, d);

  // ⚠️ `toGhl` COUNTS. It was missing from this list, so a lead that reached GoHighLevel cleanly
  // but missed the sheet and the email answered 502 — the visitor saw "that didn't go through"
  // and resubmitted, giving the client duplicate contacts, or gave up on a lead that had actually
  // arrived. For a $97 client the GHL inbox IS the notification.
  //
  // And a STORED lead is no longer nothing: if it's written down, Steven can still get it out, so
  // failing the form in front of a real customer would throw away a recoverable enquiry.
  const landed =
    d.toRecord || d.toOwner === true || d.toSheet === true || d.toGhl === true || Boolean(leadId);
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
    // Reported so a test submission can read the GHL leg directly instead of inferring it.
    toGhl: d.toGhl,
    stored: Boolean(leadId),
    ...(d.problems.length ? { problems: d.problems } : {}),
  });
}
