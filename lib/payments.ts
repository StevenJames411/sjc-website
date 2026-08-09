// Stripe events, as rows in Steven's own operations sheet. SERVER ONLY.
//
// ── WHAT WAS ALREADY DONE, AND WHAT WASN'T ───────────────────────────────────────────────────
// Stripe already does almost all of this and none of it is rebuilt here: the invoice carries the
// buy button, Stripe emails Steven when someone pays, it runs the monthly hosting subscription,
// and it tells him when a charge fails. What it does NOT do is put any of that where the rest of
// the business is written down. So a client's payment history lived in an inbox, and "is she
// still paying?" meant searching email.
//
// Three rows, and only three:
//   build paid          a one-off payment landed
//   hosting active      the monthly subscription started, or renewed
//   hosting lapsed      a charge failed, or the subscription ended
//
// ⚠️ IT WRITES INTO SJC'S OWN SHEET, NEVER A CLIENT'S. Standing rule: one business, one sheet. A
// client's spreadsheet holds her leads and what she told us at onboarding — putting what she pays
// into it means Steven's revenue is visible in a document he shares with customers.
//
// ⚠️ AND NO EMAIL. Stripe already sent one for every event here. A second alert saying the same
// thing is how a board full of alerts stops being read.
import { writeSheetRow } from "./sheets";
import { findSite } from "./sites";
import { SJC } from "./siteKeys";

/* eslint-disable @typescript-eslint/no-explicit-any */

export type PaymentRow = {
  /** "build paid" | "hosting active" | "hosting lapsed" */
  event: string;
  who: string;
  email: string;
  amount: string;
  detail: string;
  /** Stripe's own id for the event, so a row can be traced back. */
  ref: string;
};

const money = (cents: unknown, currency: unknown) => {
  const n = Number(cents);
  if (!Number.isFinite(n)) return "";
  // Integer cents, formatted once, at the edge. The invoice book learned this the hard way:
  // arithmetic on a float dollar amount is how $1.005 becomes 100.4999….
  const sym = String(currency || "usd").toLowerCase() === "usd" ? "$" : "";
  return `${sym}${(n / 100).toFixed(2)}`;
};

const nameFrom = (o: any): string =>
  String(
    o?.customer_details?.name ||
      o?.customer_name ||
      o?.billing_details?.name ||
      o?.customer_details?.email ||
      o?.customer_email ||
      ""
  ).trim();

const emailFrom = (o: any): string =>
  String(o?.customer_details?.email || o?.customer_email || o?.billing_details?.email || "").trim();

/**
 * A Stripe event to the row it deserves, or null for the ones we deliberately ignore.
 *
 * ⚠️ NULL IS THE COMMON CASE AND MUST STAY CHEAP. A Stripe endpoint receives far more event types
 * than anyone subscribes to on purpose, and a webhook that errors on an event it doesn't care
 * about gets marked failing by Stripe and eventually disabled — taking the three that matter with
 * it. Unknown means "200, nothing to do".
 */
export function rowFor(event: any): PaymentRow | null {
  const type = String(event?.type || "");
  const o = event?.data?.object || {};
  const ref = String(event?.id || "");

  switch (type) {
    // A one-off payment — the build fee. `mode` tells a build apart from the first month of a
    // subscription, which arrives as its own invoice event below.
    case "checkout.session.completed":
      if (o?.mode === "subscription") return null;
      if (o?.payment_status !== "paid") return null;
      return {
        event: "build paid",
        who: nameFrom(o),
        email: emailFrom(o),
        amount: money(o?.amount_total, o?.currency),
        detail: "one-off payment",
        ref,
      };

    // The monthly subscription billed successfully — the first time and every time after.
    case "invoice.paid":
      return {
        event: "hosting active",
        who: nameFrom(o),
        email: emailFrom(o),
        amount: money(o?.amount_paid, o?.currency),
        detail:
          o?.billing_reason === "subscription_create" ? "first month" : "monthly renewal",
        ref,
      };

    case "invoice.payment_failed":
      return {
        event: "hosting lapsed",
        who: nameFrom(o),
        email: emailFrom(o),
        amount: money(o?.amount_due, o?.currency),
        detail: "payment failed",
        ref,
      };

    case "customer.subscription.deleted":
      return {
        event: "hosting lapsed",
        who: nameFrom(o),
        email: emailFrom(o),
        amount: "",
        detail: "subscription ended",
        ref,
      };

    default:
      return null;
  }
}

/**
 * Write one row into the Payments tab of SJC's operations sheet.
 *
 * Returns a REASON on failure rather than a boolean, because the caller logs it and Stripe retries
 * on a non-2xx — "it didn't write" without the why is a retry loop nobody can diagnose.
 */
export async function recordPayment(
  row: PaymentRow,
  at: string
): Promise<{ ok: boolean; reason?: string }> {
  // ── WHY THIS IS NOT SJC's `sheetId` ─────────────────────────────────────────────────────────
  //
  // It was, and that was wrong in a way only a live check caught: `sheetId` on a site record is
  // what LEAD ROUTING reads. Setting it on SJC just so payments had somewhere to go would have
  // silently rerouted the live /apply funnel — deliverLead stops posting through the Apps Script
  // webhook the moment a site has its own sheet, and starts writing to a "Leads" tab instead.
  // Steven's consulting applications would have moved tabs, away from the script that formats
  // them, to make an unrelated feature work.
  //
  // Payments and leads are different concerns. This one gets its own setting, filled in at the
  // same moment as STRIPE_WEBHOOK_SECRET — one trip to Vercel, no live funnel touched.
  //
  // The SJC site's own sheetId is still honoured as a fallback, so if that field is ever set for
  // its own reasons this keeps working without a second thing to remember.
  const sjc = await findSite(SJC);
  const spreadsheetId =
    (process.env.PAYMENTS_SHEET_ID || "").trim() || String(sjc?.sheetId || "").trim();
  if (!spreadsheetId) {
    return {
      ok: false,
      reason:
        "PAYMENTS_SHEET_ID is not set — no spreadsheet to write payments to. " +
        "Set it in Vercel to the id of SJC's own operations sheet.",
    };
  }

  const res = await writeSheetRow({
    spreadsheetId,
    tab: "Payments",
    submittedAt: at,
    // Keys are the column identity, same rule as everywhere else: reword a label freely, never a
    // key, or the column starts over and the history is orphaned.
    answers: [
      { key: "event", label: "What happened", value: row.event },
      { key: "who", label: "Who", value: row.who },
      { key: "email", label: "Email", value: row.email },
      { key: "amount", label: "Amount", value: row.amount },
      { key: "detail", label: "Detail", value: row.detail },
      { key: "stripeRef", label: "Stripe ref", value: row.ref },
    ],
  });
  return res.ok ? { ok: true } : { ok: false, reason: res.error };
}
