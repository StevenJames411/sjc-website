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
  /** Did the row reach the CLIENT'S OWN sheet? null = they have no sheet yet. */
  toSheet: boolean | null;
  /** Did it reach their GoHighLevel inbox? null = no webhook set, so none was owed. */
  toGhl: boolean | null;
  problems: string[];
};

const RESEND = "https://api.resend.com/emails";

/**
 * The reply-to is the LEAD, so hitting reply on a phone goes straight back to the customer.
 *
 * This is the whole reason the alert goes out through Resend rather than through the sheet
 * script's own mailer: Google would send it from Steven's account, so an owner replying to his
 * own customer would reach STEVEN, and he'd be hand-forwarding messages between a groomer and a
 * homeowner forever. Here the owner replies and it goes to the customer; nobody is in the middle.
 *
 * Matched on the field KEY first — forms from the library use `email` — and on the label second,
 * for blocks built before the library that only ever had a label to go on.
 */
function guessReplyTo(answers: Answer[]): string | undefined {
  const looksLikeEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
  const byKey = answers.find((a) => a.key === "email" && looksLikeEmail(a.value));
  if (byKey) return byKey.value.trim();
  const byLabel = answers.find((a) => /e-?mail/i.test(a.label) && looksLikeEmail(a.value));
  return byLabel?.value.trim();
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
          // ⚠️ `answers` STAYS EXACTLY AS THE FORM SENT IT. The receiving Apps Script is not in
          // this repo and may well write its columns positionally, so inserting anything into
          // this array would silently shift every column in the sheet. Site info rides alongside.
          answers,
          site: site?.name || siteId || "",
          siteId: siteId || "",
        }),
      });

      // ⚠️ APPS SCRIPT RETURNS 200 EVEN WHEN IT FAILS. It catches its own exception and replies
      // with the text "error" (or "unauthorized") under a 200, so checking res.ok alone reports
      // success on a lead that never reached the sheet — an email arrives, no row appears, and
      // nothing anywhere says so. The BODY is the real answer.
      const body = (await res.text()).trim();
      // Logged every time. What this script actually replies is undocumented — it lives only in
      // Google Apps Script, not in this repo — so the reply is the only evidence available when a
      // lead emails through but never reaches the sheet.
      console.log(`[apply] sheet replied ${res.status}: ${JSON.stringify(body.slice(0, 300))}`);

      if (!res.ok) throw new Error(`http ${res.status}: ${body.slice(0, 200)}`);
      if (/^(error|unauthorized|forbidden)/i.test(body)) {
        throw new Error(`the sheet script replied "${body.slice(0, 200)}"`);
      }
      // An HTML reply means Google served a sign-in or permission page instead of running the
      // script — the deployment's access setting, not our payload. Silent until now.
      if (/^\s*<(!doctype|html)/i.test(body)) {
        throw new Error("Google returned a sign-in/permission page — the web app's access setting is wrong");
      }
      if (!body) throw new Error("the sheet script replied with nothing");
      toRecord = true;
    } catch (e) {
      problems.push(`record failed: ${(e as Error).message}`);
    }
  }

  // ── 2. THE CLIENT'S OWN SHEET ──────────────────────────────────────────────────────────────
  //
  // This leg did not exist until 2026-08-01. `createClientSheet` had been making every client a
  // spreadsheet with a Leads tab and sharing it with them at onboarding, and NOTHING in the
  // codebase ever wrote a row into it — `writeSheetRow` had exactly one caller, the onboarding
  // questionnaire, on the other tab. So the thing the client is actually paying for, the record
  // of their own enquiries, was an empty sheet with their name on it.
  //
  // ⚠️ notifyEmail is deliberately NOT passed. The Apps Script would send its own alert through
  // MailApp from Steven's Google account — a second email per lead, from the wrong sender, with
  // replies coming back to Steven. Resend owns the alert; see guessReplyTo above.
  let toSheet: boolean | null = null;
  if (site?.sheetId) {
    try {
      const { writeSheetRow } = await import("./sheets");
      const res = await writeSheetRow({
        spreadsheetId: site.sheetId,
        tab: "Leads",
        answers,
        submittedAt,
      });
      if (!res.ok) throw new Error(res.error);
      toSheet = true;
    } catch (e) {
      toSheet = false;
      problems.push(`client sheet failed: ${(e as Error).message}`);
    }
  }

  // ── 3. THEIR GOHIGHLEVEL INBOX ─────────────────────────────────────────────────────────────
  //
  // The $97 offer is "every lead in one place — calls, texts and website forms in a single inbox."
  // Calls and texts arrive in GHL by themselves. Website forms are ours, and until this leg existed
  // the one lead source we actually built was the only one missing from the inbox we sold him.
  //
  // ⚠️ THIS RUNS BEFORE THE `!owner` RETURN BELOW, and that ordering is load-bearing. A client on
  // GHL may have no leadEmail at all — his inbox IS his notification. Put this after the early
  // return and every one of those leads silently skips the CRM.
  //
  // ⚠️ Still not a CRM: this WRITES and forgets. Nothing reads a contact back, so GHL stays the
  // truth and remains swappable for anything else that accepts a webhook.
  //
  // Fire-and-check, never fire-and-forget — a 200 is the only evidence the lead arrived, and a
  // failure here has to surface next to the other three rather than disappear into a log.
  let toGhl: boolean | null = null;
  const ghl = (site?.ghlWebhookUrl || "").trim();
  if (ghl) {
    try {
      const res = await fetch(ghl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submittedAt,
          source: "website",
          site: site?.name || siteId || "",
          siteId: siteId || "",
          // Flattened alongside the raw array: an inbound webhook maps fields by NAME, and every
          // form in the library mints a stable fieldId for exactly this reason (see FormField in
          // lib/formsShared.ts — never re-derive it from the label or the mapping breaks silently
          // the first time a question is reworded).
          ...Object.fromEntries(answers.map((a) => [a.key, a.value])),
          answers,
        }),
      });
      if (!res.ok) throw new Error(`http ${res.status}: ${(await res.text()).slice(0, 200)}`);
      toGhl = true;
    } catch (e) {
      toGhl = false;
      problems.push(`GoHighLevel failed: ${(e as Error).message}`);
    }
  }

  // ── 4. the owner's copy, when the site has an address ──────────────────────────────────────
  if (!owner) return { toOwner: null, toRecord, toSheet, toGhl, problems };

  const key = process.env.RESEND_API_KEY;
  // Per-site first, then the account-wide env, then the one verified sending domain.
  //
  // ⚠️ THE DEFAULT IS LOAD-BEARING — LEAD_FROM is NOT set in Vercel, so this literal is what
  // actually sends. It moved to the DESIGNS domain on 2026-08-05 when the builder became a Steven
  // James Designs product; the consulting domain it named before was deleted from Resend the same
  // day, and an unverified sender doesn't degrade — Resend refuses the send outright.
  //
  // Only the part after the @ is fixed. The name the client reads is his own business (below), so
  // one domain serves everyone. site.leadFrom is the seam for the day a second brand needs its own.
  const from =
    (site?.leadFrom || "").trim() ||
    process.env.LEAD_FROM ||
    "leads@send.stevenjamesdesigns.com";
  if (!key) {
    problems.push("RESEND_API_KEY not set — the owner's copy could NOT be sent");
    return { toOwner: false, toRecord, toSheet, toGhl, problems };
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
    return { toOwner: true, toRecord, toSheet, toGhl, problems };
  } catch (e) {
    problems.push(`owner copy failed: ${(e as Error).message}`);
    return { toOwner: false, toRecord, toSheet, toGhl, problems };
  }
}
