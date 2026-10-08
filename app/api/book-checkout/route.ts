// THE BOOK'S CHECKOUT, ON OUR OWN PAGE (Steven, 2026-10-04). Stripe's hosted payment page could only take
// two colours and a logo drawn too small to read; his rule for the book is "own the page, rent only the
// payment pipe". So the card form is embedded in /get-the-book and Stripe handles nothing but the card.
//   POST /api/book-checkout                -> { clientSecret }   a new embedded Checkout Session
//   GET  /api/book-checkout?session_id=... -> { paid }            did this session finish paying
// PUBLIC on purpose (listed in middleware PUBLIC_API): a buyer has no login. It can only ever sell ONE
// thing, the book's own price, so there is nothing for a stranger to choose or change.
import { ownerOnly } from "@/lib/siteAccess";
import { createKvStore } from "@/lib/kvStateStore";
import { getClient } from "@/lib/store";

export const dynamic = "force-dynamic";

const STRIPE = "https://api.stripe.com/v1";
// "Attention To Dollars", one-time. The price is whatever Stripe says it is; change it there, not here.
const BOOK_PRICE = "price_1UMzL3GPJwwUDkyIreUYXQ4G";
const SITE = "https://stevenjamesconsulting.com";

function key(): string {
  return (process.env.STRIPE_SECRET_KEY || "").trim();
}

async function stripe(path: string, body?: URLSearchParams, k: string = key()) {
  const res = await fetch(`${STRIPE}${path}`, {
    method: body ? "POST" : "GET",
    headers: { Authorization: `Bearer ${k}`, ...(body ? { "Content-Type": "application/x-www-form-urlencoded" } : {}) },
    body,
    cache: "no-store",
  });
  const json = (await res.json().catch(() => null)) as Record<string, unknown> | null;
  return { ok: res.ok, json };
}

// STRIPE'S TEST MODE (Steven, 2026-10-04: test it properly, no real charge). /get-the-book?sandbox=1 runs the
// same checkout on Stripe's test keys and a test copy of the book, paid with the fake card 4242 4242 4242 4242.
// No money moves. A test order ends on the same download page a real buyer gets.
const TEST_PRICE = "price_1UN10zGPJwwUDkyIympwXRHE";
// ⛔ CLOSED UNLESS OPENED ON PURPOSE. A test order costs nothing and unlocks the real files, so an open test
// door is a free book for anyone who finds it. Proven end to end by Steven on 2026-10-04 (fake card → download
// page unlocked), then shut. To test again: set BOOK_SANDBOX_OPEN=1 in Vercel, redeploy, test, remove it.
const sandboxOpen = () => process.env.BOOK_SANDBOX_OPEN === "1";
const testKey = () => (sandboxOpen() ? (process.env.STRIPE_TEST_SECRET_KEY || "").trim() : "");

export async function POST(req: Request) {
  const sandbox = Boolean((await req.json().catch(() => ({})) as { sandbox?: boolean }).sandbox);
  const k = sandbox ? testKey() : key();
  if (!k) return Response.json({ error: "Checkout is not set up yet." }, { status: 503 });
  const body = new URLSearchParams({
    ui_mode: "embedded",
    mode: "payment",
    "line_items[0][price]": sandbox ? TEST_PRICE : BOOK_PRICE,
    "line_items[0][quantity]": "1",
    return_url: `${SITE}/book-thank-you?session_id={CHECKOUT_SESSION_ID}`,
  });
  if (!sandbox) body.set("automatic_tax[enabled]", "true");
  const { ok, json } = await stripe("/checkout/sessions", body, k);
  if (!ok || !json?.client_secret) {
    const why = (json?.error as { message?: string } | undefined)?.message || "Stripe refused the checkout.";
    console.error("book-checkout:", why);
    return Response.json({ error: "Checkout could not start. Please try again." }, { status: 502 });
  }
  return Response.json({ clientSecret: json.client_secret });
}

// THE DOWNLOAD IS FOR BUYERS (2026-10-04). /book-thank-you carries no file addresses of its own; it asks here
// with the session id Stripe put on its address, and only a finished order gets the two links back.
// "no_payment_required" is a completed $0 order (the free test run), which counts.
const FILES = "https://ddhmhtqvn5lepkpr.public.blob.vercel-storage.com/sites/sjc-website/book/atd-f87d15eee4a6/";   // third edition (2026-10-06): fifteen stages, 55 pictures. The second edition stays at atd-7c41f09be2d6.
// WHO BOUGHT THE BOOK goes on the "Book Downloads" tab of the SJC intake sheet (Steven, 2026-10-04), once per
// order. The store key is the guard against writing the same buyer again every time they reload the page.
async function recordBuyer(id: string, json: Record<string, unknown>) {
  try {
    const seen = createKvStore(getClient(), `sjc-book-order-${id}`);
    if (await seen.read()) return;
    const c = (json.customer_details || {}) as { email?: string; name?: string; phone?: string };
    const [first, ...rest] = String(c.name || "").trim().split(/\s+/);
    const { intakeConfigured, writeIntakeRow } = await import("@/lib/intakeSheet");
    if (!intakeConfigured()) return;
    await writeIntakeRow("Book Downloads", [
      { key: "source", label: "Source", value: "book-purchase" },
      { key: "q-first-name", label: "First name", value: first || "" },
      { key: "q-last-name", label: "Last name", value: rest.join(" ") },
      { key: "q-email", label: "Email", value: c.email || "" },
      { key: "q-phone", label: "Mobile phone", value: c.phone || "" },
      { key: "paid", label: "Paid", value: "$" + (Number(json.amount_total || 0) / 100).toFixed(2) },
      { key: "order", label: "Stripe order", value: String(json.payment_intent || id) },
    ], new Date().toISOString());
    await seen.write({ at: new Date().toISOString() });
    // One running list of orders (time and amount only, no person) so the owner's KPI screen can count
    // book sales: app/api/kpi-stats. Kept beside, not instead of, the per-order guard above.
    const log = createKvStore(getClient(), "sjc-book-orders");
    const prior = ((await log.read<{ orders?: { id: string; at: string; cents: number }[] }>()) || {}).orders || [];
    if (!prior.some((o) => o.id === id)) {
      await log.write({ orders: [...prior, { id, at: new Date().toISOString(), cents: Number(json.amount_total || 0) }] });
    }
  } catch (e) {
    console.error("book buyer NOT written to the sheet:", e);
  }
}

// ⛔ NEVER CACHED. An unlocked answer stored at the edge would hand the files to the next stranger asking the same address.
const NO_STORE = { headers: { "Cache-Control": "private, no-store, max-age=0" } };
export async function GET(req: Request) {
  const url = new URL(req.url);
  // The study guide goes with the book (Steven, 2026-10-08): three PDFs, one sized for each screen, because a PDF
  // cannot resize itself the way the two e-reader files do. "?download=1" makes the browser SAVE the file rather
  // than preview it: ticks made in a preview are not kept, ticks made in the saved copy are.
  const guide = (size: string) => FILES + `Attention-To-Dollars-Study-Guide-${size}.pdf?download=1`;
  const links = {
    apple: FILES + "Attention-To-Dollars-Apple-Books.epub", kindle: FILES + "Attention-To-Dollars-Kindle.epub",
    guidePhone: guide("iPhone"), guideTablet: guide("Tablet"), guideLaptop: guide("Laptop"),
  };
  // The owner's own look at the page (opened from Smart Links in the design studio): signed in = unlocked.
  if (url.searchParams.get("preview") === "1") {
    return (await ownerOnly()) === null ? Response.json({ paid: true, preview: true, ...links }, NO_STORE) : Response.json({ paid: false }, NO_STORE);
  }
  const id = url.searchParams.get("session_id") || "";
  if (!/^cs_[A-Za-z0-9_]+$/.test(id)) return Response.json({ paid: false }, NO_STORE);
  const k = id.startsWith("cs_test_") ? testKey() : key(); // a test order is checked with the test key
  if (!k) return Response.json({ paid: false }, NO_STORE);
  const { ok, json } = await stripe(`/checkout/sessions/${id}`, undefined, k);
  const paid = Boolean(ok && json?.status === "complete" && (json?.payment_status === "paid" || json?.payment_status === "no_payment_required"));
  if (!paid) return Response.json({ paid: false }, NO_STORE);
  if (id.startsWith("cs_live_") && json) await recordBuyer(id, json);
  return Response.json({ paid: true, ...links }, NO_STORE);
}
