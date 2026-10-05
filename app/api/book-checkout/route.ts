// THE BOOK'S CHECKOUT, ON OUR OWN PAGE (Steven, 2026-10-04). Stripe's hosted payment page could only take
// two colours and a logo drawn too small to read; his rule for the book is "own the page, rent only the
// payment pipe". So the card form is embedded in /get-the-book and Stripe handles nothing but the card.
//   POST /api/book-checkout                -> { clientSecret }   a new embedded Checkout Session
//   GET  /api/book-checkout?session_id=... -> { paid }            did this session finish paying
// PUBLIC on purpose (listed in middleware PUBLIC_API): a buyer has no login. It can only ever sell ONE
// thing, the book's own price, so there is nothing for a stranger to choose or change.
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
const testKey = () => (process.env.STRIPE_TEST_SECRET_KEY || "").trim();

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
const FILES = "https://ddhmhtqvn5lepkpr.public.blob.vercel-storage.com/sites/sjc-website/book/atd-7c41f09be2d6/";
export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get("session_id") || "";
  if (!/^cs_[A-Za-z0-9_]+$/.test(id)) return Response.json({ paid: false });
  const k = id.startsWith("cs_test_") ? testKey() : key(); // a test order is checked with the test key
  if (!k) return Response.json({ paid: false });
  const { ok, json } = await stripe(`/checkout/sessions/${id}`, undefined, k);
  const paid = Boolean(ok && json?.status === "complete" && (json?.payment_status === "paid" || json?.payment_status === "no_payment_required"));
  if (!paid) return Response.json({ paid: false });
  return Response.json({ paid: true, apple: FILES + "Attention-To-Dollars-Apple-Books.epub", kindle: FILES + "Attention-To-Dollars-Kindle.epub" });
}
