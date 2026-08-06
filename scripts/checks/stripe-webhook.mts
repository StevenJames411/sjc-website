// Does the Stripe webhook actually refuse a request that isn't from Stripe?
//
//   npx tsx scripts/checks/stripe-webhook.mts
//
// ⚠️ THIS ENDPOINT IS PUBLIC BY NECESSITY — Stripe has to reach it, so it cannot sit behind the
// owner login. The signature IS the authentication, and a signature checker nobody tested is a
// guess. The case that matters most is the LAST one: no secret configured must refuse everything,
// because a webhook that accepts anything while unconfigured looks exactly like one that works.
import { verifyStripeSignature, TOLERANCE_SECONDS } from "../../lib/stripeSignature.ts";
import { rowFor } from "../../lib/payments.ts";
import { createHmac } from "node:crypto";

const SECRET = "whsec_test_not_a_real_secret";
const NOW = 1_760_000_000;

const sign = (body: string, t = NOW, secret = SECRET) =>
  `t=${t},v1=${createHmac("sha256", secret).update(`${t}.${body}`).digest("hex")}`;

let failed = 0;
const check = (label: string, pass: boolean, detail = "") => {
  if (!pass) failed++;
  console.log(`${pass ? "ok  " : "FAIL"}  ${label}${detail ? `  — ${detail}` : ""}`);
};

const body = JSON.stringify({ id: "evt_1", type: "invoice.paid", created: NOW });

const v = (b: string, h: string | null, s = SECRET, now = NOW) =>
  verifyStripeSignature(b, h, s, now);

check("a real signature passes", (await v(body, sign(body))).ok);
check("no header is refused", !(await v(body, null)).ok);
check("a junk header is refused", !(await v(body, "nonsense")).ok);
check("a wrong secret is refused", !(await v(body, sign(body, NOW, "whsec_other"))).ok);
check("a tampered body is refused", !(await v(body + " ", sign(body))).ok);
check(
  "a stale timestamp is refused",
  !(await v(body, sign(body, NOW - TOLERANCE_SECONDS - 1))).ok
);
check(
  "a FUTURE timestamp is refused",
  !(await v(body, sign(body, NOW + TOLERANCE_SECONDS + 1))).ok,
  "a one-sided window would make it valid forever"
);
check(
  "one good v1 among several passes",
  (await v(body, `${sign(body)},v1=${"0".repeat(64)}`)).ok,
  "secret rollover sends more than one"
);
// THE ONE THAT MATTERS MOST.
check("no secret configured refuses everything", !(await v(body, sign(body), "")).ok);

// ── The event mapping ────────────────────────────────────────────────────────────────────────
const row = (type: string, object: Record<string, unknown>) =>
  rowFor({ id: "evt_x", type, data: { object } });

check("a one-off payment is 'build paid'", row("checkout.session.completed", { mode: "payment", payment_status: "paid", amount_total: 79500, currency: "usd" })?.event === "build paid");
check(
  "a subscription checkout is NOT a build",
  row("checkout.session.completed", { mode: "subscription", payment_status: "paid" }) === null,
  "or the first month gets logged twice"
);
check("an unpaid session writes nothing", row("checkout.session.completed", { mode: "payment", payment_status: "unpaid" }) === null);
check("invoice.paid is 'hosting active'", row("invoice.paid", { amount_paid: 9700, currency: "usd" })?.event === "hosting active");
check("a failed charge is 'hosting lapsed'", row("invoice.payment_failed", { amount_due: 9700 })?.event === "hosting lapsed");
check("a cancelled subscription is 'hosting lapsed'", row("customer.subscription.deleted", {})?.event === "hosting lapsed");
check(
  "an event nobody asked for is ignored, not an error",
  row("customer.updated", {}) === null,
  "repeated non-2xx gets the endpoint disabled by Stripe"
);
check(
  "money is formatted from integer cents",
  row("invoice.paid", { amount_paid: 9700, currency: "usd" })?.amount === "$97.00",
  row("invoice.paid", { amount_paid: 9700, currency: "usd" })?.amount
);

console.log(failed ? `\n${failed} FAILED` : "\nall good");
process.exit(failed ? 1 : 0);
