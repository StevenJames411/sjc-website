import { findSite } from "./sites";
import { SJC } from "./siteKeys";

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
  /**
   * Did SJC's central intake get written? null = not owed, because this website has its own
   * sheet — which Steven owns, so it already IS his copy. One business, one sheet.
   */
  toRecord: boolean | null;
  /** Did the row reach the CLIENT'S OWN sheet? null = they have no sheet yet. */
  toSheet: boolean | null;
  /** Did it reach their GoHighLevel inbox? null = no webhook set, so none was owed. */
  toGhl: boolean | null;
  problems: string[];
};

const RESEND = "https://api.resend.com/emails";

/**
 * The no-destination alarm's send. Throws rather than returning a flag, so a rejection can never
 * be mistaken for a send.
 *
 * ⚠️ THE OWNER'S COPY DELIBERATELY DOES NOT USE THIS. It has its own inline call further down,
 * because that path is the one verified working end-to-end and it was not worth re-plumbing on
 * the afternoon before real prospects start filling these forms in. Two call sites, one of which
 * is proven. Consolidate when there's a reason to touch it anyway.
 */
// Exported since 2026-08-12 for the magic-link sign-in, which needs to send one email and has no
// business owning a second copy of the Resend call — one sender, one place a failure is handled.
/**
 * WHO SJC's MAIL COMES FROM. One constant, because it was written out by hand in four places and
 * three of them were the wrong brand.
 *
 * ⛔ CONSULTING, NOT DESIGNS (changed 2026-08-12). The brands merged and the domain moved to
 * stevenjamesconsulting.com on 08-11; the sender did not follow, so Consulting enquiries arrived
 * from a Designs address — and worse than off-brand, it did not AUTHENTICATE:
 *
 *   send.stevenjamesdesigns.com     DKIM only. No SPF. No DMARC on it or on its root.
 *   send.stevenjamesconsulting.com  DKIM, under a root `p=quarantine; adkim=r` — so DKIM ALIGNS
 *                                   and the mail actually passes DMARC rather than merely being
 *                                   signed by somebody.
 *
 * How it surfaced: a lead alert arrived fine and a magic-link email vanished — not spam, gone —
 * from the SAME sender. A "new enquiry" from a weakly-authenticated domain squeaks by on
 * reputation; "Your sign-in link" with a login button is the most phishing-shaped mail there is
 * and Gmail refused it. Auth-link email is where a missing SPF record stops being cosmetic.
 *
 * ⚠️ STILL NOT FINISHED. SPF and the SES bounce MX are missing on the consulting subdomain too;
 * this makes the mail align, it does not make it fully authenticated. See _CHECKPOINT.
 */
export const DEFAULT_LEAD_FROM =
  process.env.LEAD_FROM || "leads@send.stevenjamesdesigns.com";

// ⛔ STILL DESIGNS, AND NOT BY CHOICE — REVERTED 2026-08-12, MINUTES AFTER THE SWITCH ABOVE.
//
// Pointing this at Consulting broke every outgoing email instantly:
//
//   resend 403 — "The send.stevenjamesconsulting.com domain is not verified."
//
// THE TWO SETUPS ARE FIGHTING EACH OTHER, exactly as Steven guessed. `resend._domainkey.send.
// stevenjamesconsulting.com` RESOLVES — the DKIM record is published and looks healthy from the
// outside — but the domain is NOT registered in Resend. It was deleted there (see the note above
// about the consulting domain being removed the same day) and the DNS record was left behind. So
// DNS says verified and Resend says unknown, and only Resend gets a vote.
//
// ⚠️ DIAGNOSING THIS FROM `dig` ALONE WOULD HAVE CONFIRMED THE WRONG THING. Every record you can
// see from outside said the consulting subdomain was the better sender. The authority is the
// Resend domains list, not the zone.
//
// Sequence to finish it, in this order and no other:
//   1. Add send.stevenjamesconsulting.com in Resend; take the records IT gives (DKIM, SPF, and the
//      region-specific SES bounce MX — do not guess the region).
//   2. Publish them; wait for Resend to show Verified.
//   3. THEN flip this constant back to consulting.
// Flipping first is what this comment exists to stop somebody doing twice.

export async function sendAlert(opts: {
  to: string;
  from: string;
  fromName: string;
  subject: string;
  html: string;
  replyTo?: string;
}): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY not set");
  const res = await fetch(RESEND, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: `${opts.fromName} <${opts.from}>`,
      to: [opts.to],
      subject: opts.subject,
      html: opts.html,
      ...(opts.replyTo ? { reply_to: opts.replyTo } : {}),
    }),
  });
  if (!res.ok) throw new Error(`resend ${res.status} ${await res.text()}`);
}

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

/** A submitted value is a stranger's text going into an HTML email. Escape it. */
const esc = (s: string) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/**
 * WHO THIS LEAD IS, for the subject line.
 *
 * ⚠️ EVERY LEAD USED TO SHARE ONE SUBJECT — "New enquiry from your website" — from one sender, so
 * Gmail threaded them ALL into a single conversation. Verified live on 2026-08-06: a Steven James
 * Designs enquiry and a Consulting application landed in the same thread, minutes apart. At five
 * clients that is every business's leads stacked in one place with the newest hidden behind "show
 * trimmed content". The business name separates the clients; the person's name separates the
 * leads within a client.
 */
function leadName(answers: Answer[]): string {
  const byKey = answers.find((a) => a.key === "name" && a.value.trim());
  if (byKey) return byKey.value.trim();
  const byLabel = answers.find((a) => /(^|\b)(your |first |full )?name\b/i.test(a.label) && a.value.trim());
  if (byLabel) return byLabel.value.trim();
  const firstReal = answers.find((a) => a.key !== "source" && a.value.trim());
  return firstReal?.value.trim() || "";
}

function asHtml(businessName: string, answers: Answer[]): string {
  const rows = answers
    .filter((a) => a.value && a.key !== "source")
    .map(
      (a) =>
        `<tr><td style="padding:6px 14px 6px 0;color:#6b7280;white-space:nowrap">${esc(a.label)}</td>` +
        `<td style="padding:6px 0;font-weight:600">${esc(a.value)}</td></tr>`
    )
    .join("");
  return (
    `<div style="font-family:-apple-system,Segoe UI,sans-serif;font-size:15px;color:#111827">` +
    `<p style="margin:0 0 14px">New enquiry from your website.</p>` +
    `<table style="border-collapse:collapse">${rows}</table>` +
    // ⚠️ ONLY PROMISED WHEN IT'S TRUE. reply_to is set from a recognisable email field; a
    // phone-only form, or an imported design whose email input has just a placeholder, doesn't
    // get one — and the from-address is a SEND-ONLY domain, so hitting reply there goes nowhere.
    // Telling an owner "reply and it reaches them" when it doesn't is worse than saying nothing.
    (guessReplyTo(answers)
      ? `<p style="margin:18px 0 0;color:#6b7280;font-size:13px">Reply to this email and it goes straight to them.</p>`
      : `<p style="margin:18px 0 0;color:#6b7280;font-size:13px">Their details are above — call or text them back.</p>`) +
    `<p style="margin:4px 0 0;color:#9ca3af;font-size:12px">${esc(businessName)}</p></div>`
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

  // ── THE SITE LOOKUP FAILED, AND THAT IS NOT THE SAME AS "no destinations set" ────────────────
  //
  // ⚠️ THE WORST BUG IN THIS FILE, AND IT WAS SILENT. `findSite` swallows a storage error and
  // returns undefined (lib/kvStateStore.ts catches and returns null). A transient database blip,
  // a cold client, or a site sitting in the 30-day bin all produce the same `undefined` — and the
  // code below then read that as "a site with no email, no sheet and no webhook" and posted the
  // lead into SJC'S OWN INTAKE. A client's enquiry, in Steven's pile, reported as a clean success
  // with an empty `problems` array and a green thank-you on screen.
  //
  // That is precisely the failure the note at the top of this file says the whole module exists
  // to prevent, arrived at through the back door.
  //
  // A named site that cannot be resolved is an INCIDENT, not a configuration. It still gets
  // written somewhere — losing the lead would be worse — but it is loudly flagged, so the row is
  // findable and re-deliverable instead of quietly filed under the wrong business.
  if (siteId && siteId !== SJC && !site) {
    problems.push(
      `UNKNOWN SITE '${siteId}' — could not read the website registry. This lead was filed in ` +
        `SJC's intake because there was nowhere else to put it. It has NOT reached the client.`
    );
    console.error(`[lead] UNRESOLVED SITE '${siteId}' — lead filed to SJC intake as a last resort`);
  }

  // ── 1. SJC's intake — ONLY for websites that have no sheet of their own ────────────────────
  //
  // ⚠️ THIS USED TO RUN FOR EVERY LEAD, AND THAT WAS THE DUPLICATION.
  //
  // The old rule was "SJC's record ALWAYS gets a copy", on the theory that Steven needs proof of
  // delivery when a client says "I never got that lead". But the client's sheet is a spreadsheet
  // STEVEN OWNS and shares with them — so that sheet already IS his copy, and writing a second
  // row into a central sheet bought nothing except two records of every enquiry to keep in step.
  //
  // The rule now: one business, one sheet. A site with its own `sheetId` writes only there. A
  // site WITHOUT one — a demo, or SJC's own /apply and podcast forms — still falls back to the
  // intake sheet, so a lead is never dropped just because nobody has wired a spreadsheet up yet.
  //
  // Note this is also what stops the deleted "Website Offer" tab reappearing: the routing would
  // happily recreate a tab the moment another lead arrived for it.
  let toRecord: boolean | null = false;
  const ownSheet = (site?.sheetId || "").trim();
  const webhook = process.env.APPLY_WEBHOOK_URL;
  if (ownSheet) {
    toRecord = null; // not owed — leg 2 writes this business's own sheet below
  } else if (!webhook) {
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
          // ⚠️ THE ANSWERS GO FIRST. Spread last, a question keyed `source` overwrote ours — and
          // every LeadForm sends exactly that as its first answer, so `source: "website"` was
          // ALWAYS clobbered by the human label. A GHL workflow filtering on it never fired.
          ...Object.fromEntries(answers.map((a) => [a.key, a.value])),
          submittedAt,
          source: "website",
          site: site?.name || siteId || "",
          siteId: siteId || "",
          // Flattened alongside the raw array: an inbound webhook maps fields by NAME, and every
          // form in the library mints a stable fieldId for exactly this reason (see FormField in
          // lib/formsShared.ts — never re-derive it from the label or the mapping breaks silently
          // the first time a question is reworded).
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
  //
  // ⚠️ A LEAD THAT NOTIFIES NOBODY IS THE ONE THAT ENDS A RETAINER, and until now it was the
  // QUIET path: no leadEmail meant `toOwner: null`, no problem raised, row filed, everyone moves
  // on. Verified live on 2026-08-06 — a Marbleford enquiry landed in the sheet and not one person
  // was told. No bug required; that was the designed behaviour of a blank field.
  //
  // It matters most in the exact window where it's most likely: a site just sold, `leadEmail` not
  // filled in yet (and app/api/admin/onboard-client can report success without saving it). Her
  // customers' enquiries pile up invisibly while she waits for a callback.
  //
  // So: if nothing else would have told a human — no owner address AND no GHL inbox — the alert
  // goes to SJC instead, clearly marked. Steven is not the intended recipient; he's the smoke
  // alarm. GHL counts as notified, because for a $97 client that inbox IS the notification.
  const notifiedSomeone = Boolean(owner) || toGhl === true;
  if (!notifiedSomeone) {
    const business = site?.business?.name || site?.name || siteId || "an unknown website";
    problems.push(
      `NOBODY WAS NOTIFIED — '${business}' has no lead email and no GoHighLevel inbox. ` +
        `The lead is stored, but no alert was owed to anyone.`
    );
    console.error(`[lead] NO DESTINATION for '${siteId}' — alerting SJC as a fallback`);
    const fallbackTo = (await findSite(SJC))?.leadEmail?.trim();
    if (fallbackTo) {
      await sendAlert({
        to: fallbackTo,
        from: DEFAULT_LEAD_FROM,
        fromName: "SJC lead alarm",
        subject: `⚠ Lead with nowhere to go — ${business}`,
        html:
          `<div style="font-family:-apple-system,Segoe UI,sans-serif;font-size:15px;color:#111827">` +
          `<p style="margin:0 0 14px"><strong>${esc(business)}</strong> received an enquiry and has ` +
          `no lead email and no GoHighLevel inbox set, so nobody was told.</p>` +
          `<p style="margin:0 0 14px">Set the lead destination on that website\u2019s settings, then ` +
          `forward this on.</p>` +
          `<table style="border-collapse:collapse">` +
          answers
            .filter((a) => a.value && a.key !== "source")
            .map(
              (a) =>
                `<tr><td style="padding:6px 14px 6px 0;color:#6b7280;white-space:nowrap">${esc(a.label)}</td>` +
                `<td style="padding:6px 0;font-weight:600">${esc(a.value)}</td></tr>`
            )
            .join("") +
          `</table></div>`,
        replyTo: guessReplyTo(answers),
      }).catch((e) => problems.push(`fallback alarm failed: ${(e as Error).message}`));
    }
  }

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
  const from = (site?.leadFrom || "").trim() || DEFAULT_LEAD_FROM;
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
        // ⚠️ THE BUSINESS AND THE PERSON, BOTH. One shared subject threaded every client's leads
        // into a single Gmail conversation — see leadName() above for the live proof.
        subject: [
          "New enquiry",
          site?.business?.name || site?.name || "",
          leadName(answers),
        ]
          .filter(Boolean)
          .join(" — "),
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
