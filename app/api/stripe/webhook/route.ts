// Stripe -> the Payments tab of Steven's operations sheet.
//
//   POST /api/stripe/webhook
//
// ── SETUP, ONCE ──────────────────────────────────────────────────────────────────────────────
//   Stripe dashboard -> Developers -> Webhooks -> Add endpoint
//     URL     https://stevenjamesdesigns.com/api/stripe/webhook
//     Events  checkout.session.completed, invoice.paid, invoice.payment_failed,
//             customer.subscription.deleted
//   Copy the signing secret (whsec_…) into STRIPE_WEBHOOK_SECRET on Vercel.
//   And set PAYMENTS_SHEET_ID to the spreadsheet id of SJC's own operations sheet — the long
//   string in its URL between /d/ and /edit. Two env vars, one trip.
//
// ⚠️ PAYMENTS_SHEET_ID IS DELIBERATELY NOT THE SJC SITE'S `sheetId`. That field is what LEAD
// routing reads, and setting it would silently move the live /apply funnel onto a different tab.
// See the long note in lib/payments.ts.
//
// ⚠️ PUBLIC BY NECESSITY — Stripe has to reach it, so it cannot sit behind the owner login. The
// signature IS the authentication. It is checked before the body is looked at, and an unset
// secret refuses everything rather than waving requests through: a webhook that accepts anything
// while unconfigured is worse than one that doesn't exist, because it looks like it's working.
//
// ⚠️ NOTHING HERE IS A REBUILD OF STRIPE. Stripe still sends every email, runs the subscription
// and chases the failed card. The only thing missing was that none of it reached the sheet where
// the rest of the business is written down.
import { verifyStripeSignature } from "@/lib/stripeSignature";
import { rowFor, recordPayment } from "@/lib/payments";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  // ⚠️ THE RAW TEXT, AND IT MUST BE READ FIRST. req.json() consumes the body, and the signature
  // covers the exact bytes sent — re-stringifying parsed JSON changes key order and whitespace
  // and can never match again.
  const raw = await req.text();

  const check = await verifyStripeSignature(
    raw,
    req.headers.get("stripe-signature"),
    process.env.STRIPE_WEBHOOK_SECRET || ""
  );
  if (!check.ok) {
    console.error(`[stripe] refused: ${check.reason}`);
    return Response.json({ ok: false, error: check.reason }, { status: 400 });
  }

  let event: unknown;
  try {
    event = JSON.parse(raw);
  } catch {
    return Response.json({ ok: false, error: "bad json" }, { status: 400 });
  }

  const row = rowFor(event);
  if (!row) {
    // ⚠️ 200, NOT AN ERROR. A Stripe endpoint receives far more event types than were subscribed
    // to, and repeated non-2xx answers get the endpoint marked failing and eventually disabled —
    // which would take the three events that matter down with it.
    return Response.json({ ok: true, ignored: true });
  }

  const at = new Date(
    Number((event as { created?: number })?.created || 0) * 1000 || Date.now()
  ).toISOString();

  const wrote = await recordPayment(row, at);
  if (!wrote.ok) {
    // ⚠️ NON-2XX ON PURPOSE. Stripe retries a failed webhook for days; answering 200 here would
    // throw away a payment that never reached the sheet and nobody would ever know it was missing.
    console.error(`[stripe] ${row.event} for ${row.who || "unknown"} did NOT reach the sheet: ${wrote.reason}`);
    return Response.json({ ok: false, error: wrote.reason }, { status: 500 });
  }

  return Response.json({ ok: true, recorded: row.event });
}
