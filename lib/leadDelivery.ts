import { findSite } from "./sites";

// Deliver a lead to whoever owns the website it came from.
//
// ⚠️ THE FAILURE THIS EXISTS TO PREVENT. Every lead form on every site posted to one endpoint that
// fed SJC's own intake sheet, with the business name riding along as a text label somebody typed.
// Sell a website with that still true and the owner's enquiries land in Steven's pile — they find
// out when a customer asks why nobody called back, and that ends the retainer and the referral
// behind it. The destination now comes from the SITE, which comes from the URL.
//
// Two rules that matter more than the delivery itself:
//   1. SJC's intake ALWAYS gets a copy. It is the proof-of-delivery record at renewal and the
//      answer to "I never got that lead".
//   2. A lead is never silently dropped. If the client's copy can't be sent, that is reported,
//      not swallowed — a form that says "thanks!" over a lost enquiry is the worst outcome here.

export type Answer = { key: string; label: string; value: string };

export type Delivery = {
  /** Did the OWNER get their copy? null = they have no address set, so none was owed. */
  toOwner: boolean | null;
  /** Did SJC's record get written? */
  toRecord: boolean;
  problems: string[];
};

const RESEND = "https://api.resend.com/emails";

/** The reply-to is the LEAD, so hitting reply on a phone goes straight back to the customer. */
function guessReplyTo(answers: Answer[]): string | undefined {
  const hit = answers.find((a) => /email/i.test(a.label) && /@/.test(a.value));
  return hit?.value.trim();
}

function asHtml(businessName: string, answers: Answer[]): string {
  const rows = answers
    .filter((a) => a.value && a.key !== "source")
    .map(
      (a) =>
        `<tr><td style="padding:6px 14px 6px 0;color:#6b7280;white-space:nowrap">${a.label}</td>` +
        `<td style="padding:6px 0;font-weight:600">${a.value}</td></tr>`
    )
    .join("");
  return (
    `<div style="font-family:-apple-system,Segoe UI,sans-serif;font-size:15px;color:#111827">` +
    `<p style="margin:0 0 14px">New enquiry from your website.</p>` +
    `<table style="border-collapse:collapse">${rows}</table>` +
    `<p style="margin:18px 0 0;color:#6b7280;font-size:13px">Reply to this email and it goes straight to them.</p>` +
    `<p style="margin:4px 0 0;color:#9ca3af;font-size:12px">${businessName}</p></div>`
  );
}

export async function deliverLead(
  siteId: string,
  answers: Answer[],
  submittedAt: string
): Promise<Delivery> {
  const problems: string[] = [];
  const site = siteId ? await findSite(siteId) : undefined;
  const owner = (site?.leadEmail || "").trim();

  // ── 1. SJC's record, always ────────────────────────────────────────────────────────────────
  let toRecord = false;
  const webhook = process.env.APPLY_WEBHOOK_URL;
  if (!webhook) {
    problems.push("APPLY_WEBHOOK_URL not set — no record written");
  } else {
    try {
      const res = await fetch(webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submittedAt,
          // Stamped server-side from the site, so the record can't disagree with where it went.
          answers: [
            { key: "site", label: "Website", value: site?.name || siteId || "(unknown)" },
            ...answers,
          ],
        }),
      });
      if (!res.ok) throw new Error(`webhook ${res.status}`);
      toRecord = true;
    } catch (e) {
      problems.push(`record failed: ${(e as Error).message}`);
    }
  }

  // ── 2. the owner's copy, when the site has an address ──────────────────────────────────────
  if (!owner) return { toOwner: null, toRecord, problems };

  const key = process.env.RESEND_API_KEY;
  const from = process.env.LEAD_FROM || "leads@send.stevenjamesconsulting.com";
  if (!key) {
    problems.push("RESEND_API_KEY not set — the owner's copy could NOT be sent");
    return { toOwner: false, toRecord, problems };
  }

  try {
    const res = await fetch(RESEND, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: `${site?.business?.name || site?.name || "Your website"} <${from}>`,
        to: [owner],
        subject: `New enquiry from your website`,
        html: asHtml(site?.business?.name || site?.name || "", answers),
        ...(guessReplyTo(answers) ? { reply_to: guessReplyTo(answers) } : {}),
      }),
    });
    if (!res.ok) throw new Error(`resend ${res.status} ${await res.text()}`);
    return { toOwner: true, toRecord, problems };
  } catch (e) {
    problems.push(`owner copy failed: ${(e as Error).message}`);
    return { toOwner: false, toRecord, problems };
  }
}
