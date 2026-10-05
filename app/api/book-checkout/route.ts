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

async function stripe(path: string, body?: URLSearchParams) {
  const res = await fetch(`${STRIPE}${path}`, {
    method: body ? "POST" : "GET",
    headers: { Authorization: `Bearer ${key()}`, ...(body ? { "Content-Type": "application/x-www-form-urlencoded" } : {}) },
    body,
    cache: "no-store",
  });
  const json = (await res.json().catch(() => null)) as Record<string, unknown> | null;
  return { ok: res.ok, json };
}

export async function POST() {
  if (!key()) return Response.json({ error: "Checkout is not set up yet." }, { status: 503 });
  const body = new URLSearchParams({
    ui_mode: "embedded",
    mode: "payment",
    "line_items[0][price]": BOOK_PRICE,
    "line_items[0][quantity]": "1",
    "automatic_tax[enabled]": "true",
    return_url: `${SITE}/book-thank-you?session_id={CHECKOUT_SESSION_ID}`,
  });
  const { ok, json } = await stripe("/checkout/sessions", body);
  if (!ok || !json?.client_secret) {
    const why = (json?.error as { message?: string } | undefined)?.message || "Stripe refused the checkout.";
    console.error("book-checkout:", why);
    return Response.json({ error: "Checkout could not start. Please try again." }, { status: 502 });
  }
  return Response.json({ clientSecret: json.client_secret });
}

export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get("session_id") || "";
  if (!/^cs_[A-Za-z0-9_]+$/.test(id) || !key()) return Response.json({ paid: false });
  const { ok, json } = await stripe(`/checkout/sessions/${id}`);
  return Response.json({ paid: Boolean(ok && json?.payment_status === "paid") });
}
