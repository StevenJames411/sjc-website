// THE BOOK'S CHECKOUT, ON OUR OWN PAGE (Steven, 2026-10-04). Stripe's hosted payment page could only take
// two colours and a logo drawn too small to read; his rule for the book is "own the page, rent only the
// payment pipe". So the card form is embedded in /get-the-book and Stripe handles nothing but the card.
//   POST /api/book-checkout                -> { clientSecret }   a new embedded Checkout Session
//   GET  /api/book-checkout?session_id=... -> { paid }            did this session finish paying
//   GET  /api/book-checkout?k=...          -> { paid }            a fresh link from the buyer's inbox
//   PUT  /api/book-checkout { email }      -> { ok }              email that buyer a fresh download link
// PUBLIC on purpose (listed in middleware PUBLIC_API): a buyer has no login. It can only ever sell ONE
// thing, the book's own price, so there is nothing for a stranger to choose or change.
import { ownerOnly } from "@/lib/siteAccess";
import { createKvStore } from "@/lib/kvStateStore";
import { getClient } from "@/lib/store";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { sendAlert } from "@/lib/leadDelivery";
import { signEpub, signPdf, type Buyer, type GuideKey } from "@/lib/signedCopy";
import { buyerCode, buyerCookies, ensureBuyer } from "@/lib/bookBuyers";

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
// (The files used to sit at a fixed public folder, book/atd-f87d15eee4a6, and before that atd-7c41f09be2d6. See VAULT below.)
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

// THE DOWNLOAD PAGE WORKS LIKE A FORGOTTEN PASSWORD (Steven, 2026-10-08). The address a buyer lands on after
// paying opens the page for LINK_HOURS and then goes dead, so a link passed to friends and family stops
// working. To come back, the buyer types the email they bought with; if that email has a paid book order, a
// fresh link goes to THAT inbox and nowhere else. Nobody has to ask Steven for anything.
// A fresh link is a signed note ("this order, good until this time"), so reading one needs no lookup.
const LINK_HOURS = 24;
const signer = () => (process.env.SITE_EDIT_TOKEN || "").trim();
const mac = (body: string) => createHmac("sha256", "book-download:" + signer()).update(body).digest("base64url");
function freshLink(order: string): string {
  const body = Buffer.from(`${order}.${Date.now() + LINK_HOURS * 3600_000}`).toString("base64url");
  return `${SITE}/book-thank-you?k=${body}.${mac(body)}`;
}
// Returns the order the note was written for, or "" when the note is forged or has run out.
function freshLinkOrder(k: string): string {
  const [body, sig] = k.split(".");
  if (!body || !sig || !signer()) return "";
  const want = mac(body);
  if (sig.length !== want.length || !timingSafeEqual(Buffer.from(sig), Buffer.from(want))) return "";
  const parts = Buffer.from(body, "base64url").toString().split(".");
  const until = Number(parts.pop());
  return Number.isFinite(until) && Date.now() < until ? parts.join(".") : "";
}
const OWNER: Buyer = { name: "Steven Barchetti", email: "" };
const SAMPLE: Buyer = { name: "Sample Buyer", email: "sample.buyer@example.com" };
const buyerOf = (json: Record<string, unknown> | null): Buyer => {
  const c = (json?.customer_details || {}) as { name?: string; email?: string };
  return { name: String(c.name || "").trim(), email: String(c.email || "").trim() };
};

// ⛔ NEVER CACHED. An unlocked answer stored at the edge would hand the files to the next stranger asking the same address.
const NO_STORE = { headers: { "Cache-Control": "private, no-store, max-age=0" } };
// THE FILES ARE LOCKED WITH THE SAME KEY AS THE PAGE (Steven, 2026-10-08: "the thank you page is the room that
// gets locked, but then all the files in the room are not locked... how do you tie the room to the product?").
// The five files sit in a storage folder whose address is never sent to a browser. A download button points
// back at THIS route with the buyer's own key (the purchase address, a fresh link, or the owner's sign-in);
// the route checks the key exactly as the page does and only then passes the file through. A copied download
// address therefore dies with the key it carries, 24 hours after it was issued.
const VAULT = "https://ddhmhtqvn5lepkpr.public.blob.vercel-storage.com/sites/sjc-website/book/vault-2921e475e79657ae46332ea6c14fc917e0e6d4d9/";
const SHELF: Record<string, { file: string; type: string }> = {
  apple: { file: "Attention-To-Dollars-Apple-Books.epub", type: "application/epub+zip" },
  kindle: { file: "Attention-To-Dollars-Kindle.epub", type: "application/epub+zip" },
  // The study guide goes with the book: three PDFs, one sized for each screen, because a PDF cannot resize
  // itself the way the two e-reader files do. Sent as a download so the reader SAVES it: ticks made in a
  // browser preview are not kept, ticks made in the saved copy are.
  guidePhone: { file: "Attention-To-Dollars-Study-Guide-Phone.pdf", type: "application/pdf" },
  guideTablet: { file: "Attention-To-Dollars-Study-Guide-Tablet.pdf", type: "application/pdf" },
  guideLaptop: { file: "Attention-To-Dollars-Study-Guide-Laptop.pdf", type: "application/pdf" },
};
export const maxDuration = 300; // a 15 MB book over a slow phone connection

// One check for the page and for every file. `pass` is the key as it travels in an address.
// `who` is the buyer the copy is signed for; it is only looked up when a FILE is asked for.
// `order` is set for a real order (never for the owner's preview); it is what a buyer's record hangs on.
async function access(url: URL): Promise<{ ok: boolean; expired?: boolean; preview?: boolean; pass: string; who?: Buyer; order?: string; created?: number }> {
  // The owner's own look at the page (opened from Smart Links in the design studio): signed in = unlocked.
  if (url.searchParams.get("preview") === "1") return { ok: (await ownerOnly()) === null, preview: true, pass: "preview=1", who: OWNER };
  const k2 = url.searchParams.get("k") || "";
  if (k2) {
    const order = freshLinkOrder(k2);
    if (!order) return { ok: false, expired: true, pass: "" };
    if (!order.startsWith("cs_")) return { ok: true, pass: "k=" + encodeURIComponent(k2), who: OWNER };
    // THE SAMPLE BUYER: a made-up order only the signed-in owner can get a link for (PUT { sample: true }). It
    // behaves exactly like a real buyer (signed copy, own links, device marked, pages logged) so the whole thing
    // can be seen and tested without a sale. Shows in the buyers list as "Sample Buyer".
    if (order.startsWith("cs_demo_")) return { ok: true, pass: "k=" + encodeURIComponent(k2), who: SAMPLE, order, created: Math.floor(Date.now() / 1000) };
    const sk = order.startsWith("cs_test_") ? testKey() : key();
    const found = sk ? (await stripe(`/checkout/sessions/${order}`, undefined, sk)).json : null;
    return { ok: true, pass: "k=" + encodeURIComponent(k2), who: buyerOf(found), order, created: Number(found?.created || 0) };
  }
  const id = url.searchParams.get("session_id") || "";
  if (!/^cs_[A-Za-z0-9_]+$/.test(id)) return { ok: false, pass: "" };
  const k = id.startsWith("cs_test_") ? testKey() : key(); // a test order is checked with the test key
  if (!k) return { ok: false, pass: "" };
  const { ok, json } = await stripe(`/checkout/sessions/${id}`, undefined, k);
  const paid = Boolean(ok && json?.status === "complete" && (json?.payment_status === "paid" || json?.payment_status === "no_payment_required"));
  if (!paid) return { ok: false, pass: "" };
  if (id.startsWith("cs_live_") && json) await recordBuyer(id, json);
  // The address from the day of purchase is good for LINK_HOURS. After that the buyer asks for a fresh one.
  if (Date.now() / 1000 - Number(json?.created || 0) > LINK_HOURS * 3600) return { ok: false, expired: true, pass: "" };
  return { ok: true, pass: "session_id=" + id, who: buyerOf(json), order: id, created: Number(json?.created || 0) };
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const want = url.searchParams.get("file");
  const a = await access(url);
  // A real order gets the buyer's short code: it rides in the links inside their copy and marks their device.
  const code = a.ok && a.order && a.who && (a.who.name || a.who.email) ? buyerCode(a.order) : "";
  if (want) {
    const item = SHELF[want];
    // A key that has run out lands back on the page, which shows the "send me a fresh link" box.
    if (!item || !a.ok) return Response.redirect(`${SITE}/book-thank-you?expired=1`, 302);
    const up = await fetch(VAULT + item.file, { cache: "no-store" });
    if (!up.ok || !up.body) return new Response("The file could not be loaded. Please try again.", { status: 502 });
    // EVERY COPY IS A SIGNATURE EDITION: the stored file is a template and the buyer's name goes in here
    // (lib/signedCopy.ts). If the signing ever fails, the buyer still gets the file; they paid for it.
    let bytes: Uint8Array = new Uint8Array(await up.arrayBuffer());
    try {
      const who = a.who && (a.who.name || a.who.email) ? a.who : null;
      if (who) bytes = item.type === "application/pdf" ? await signPdf(bytes, want as GuideKey, who, code || undefined) : signEpub(bytes, who, code || undefined);
    } catch (e) {
      console.error("book copy NOT signed, sent as it is:", want, e);
    }
    const head: Record<string, string> = {
      "Content-Type": item.type, "Content-Disposition": `attachment; filename="${item.file}"`,
      "Cache-Control": "private, no-store, max-age=0", "X-Robots-Tag": "noindex", "Content-Length": String(bytes.length),
    };
    // Sent in pieces, so a 15 MB book is not held to the size limit on a single reply.
    const PIECE = 256 * 1024; let at = 0;
    const body = new ReadableStream<Uint8Array>({
      pull(c) { if (at >= bytes.length) return c.close(); c.enqueue(bytes.subarray(at, at + PIECE)); at += PIECE; },
    });
    return new Response(body, { headers: head });
  }
  if (!a.ok) return Response.json(a.expired ? { paid: false, expired: true } : { paid: false }, NO_STORE);
  const links = Object.fromEntries(Object.keys(SHELF).map((f) => [f, `/api/book-checkout?file=${f}&${a.pass}`]));
  const headers = new Headers(NO_STORE.headers);
  if (code && a.order && a.who) {
    // The buyer's record is made the first time their page opens, and this phone or laptop is marked as theirs
    // so the pages they read afterwards are logged under their name (lib/bookBuyers.ts).
    await ensureBuyer(a.order, a.who, a.created);
    for (const c of buyerCookies(code)) headers.append("Set-Cookie", c);
  }
  return Response.json({ paid: true, ...(a.preview ? { preview: true } : {}), ...links }, { headers });
}

// "Send me a fresh link." ⛔ ALWAYS ANSWERS THE SAME, whether or not the email bought the book, so the box
// cannot be used to find out who is a customer. One email per address every two minutes.
export async function PUT(req: Request) {
  const done = Response.json({ ok: true }, NO_STORE);
  const b = (await req.json().catch(() => ({}))) as { email?: string; preview?: boolean };
  if ((b as { sample?: boolean }).sample && (await ownerOnly()) === null) return Response.json({ ok: true, link: freshLink("cs_demo_sample") }, NO_STORE);
  const email = String(b.email || "").trim().toLowerCase();
  if (email.length > 200 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return done;
  try {
    const gate = createKvStore(getClient(), `sjc-book-fresh-${createHash("sha256").update(email).digest("hex").slice(0, 32)}`);
    if (Date.now() - Number((await gate.read<{ at?: number }>())?.at || 0) < 120_000) return done;
    await gate.write({ at: Date.now() });
    let order = "";
    // The owner's own test of the email (signed in, from the terminal): no order needed.
    if (b.preview && (await ownerOnly()) === null) order = "owner-preview";
    else if (key()) {
      const { ok, json } = await stripe(`/checkout/sessions?customer_details[email]=${encodeURIComponent(email)}&status=complete&limit=20`);
      const found = ((ok && (json?.data as { id: string; payment_status?: string }[])) || []).filter((s) => s.payment_status === "paid" || s.payment_status === "no_payment_required");
      for (const s of found) {
        // This Stripe account sells other things too. Only an order for the BOOK opens the book's page.
        const items = await stripe(`/checkout/sessions/${s.id}/line_items?limit=10`);
        const prices = ((items.json?.data as { price?: { id?: string } }[]) || []).map((i) => i.price?.id);
        if (prices.includes(BOOK_PRICE)) { order = s.id; break; }
      }
    }
    if (!order) return done;
    const link = freshLink(order);
    await sendAlert({
      to: email,
      from: "notifications@send.stevenjamesconsulting.com",
      fromName: "Steven James Consulting",
      replyTo: "support@stevenjamesconsulting.com",
      subject: "Your fresh download page for Attention To Dollars",
      text: `Here is a fresh link to your download page. It has the book and the three study guides.\n\n${link}\n\nThis link works for ${LINK_HOURS} hours. Need it again after that? Go back to the page, type your email, and a new one is sent to you.\n\nSteven Barchetti\nSteven James Consulting`,
      html: `<p>Here is a fresh link to your download page. It has the book and the three study guides.</p><p><a href="${link}" style="display:inline-block;padding:14px 26px;border-radius:9999px;background:#BF7530;color:#1A0E06;font-weight:700;text-decoration:none">Open My Download Page</a></p><p>This link works for ${LINK_HOURS} hours. Need it again after that? Go back to the page, type your email, and a new one is sent to you.</p><p>Steven Barchetti<br>Steven James Consulting</p>`,
    });
    // Only the signed-in owner testing it is told whether the email really went.
    if (order === "owner-preview") return Response.json({ ok: true, sent: true }, NO_STORE);
  } catch (e) {
    console.error("book fresh link NOT sent:", e);
    if (b.preview && (await ownerOnly()) === null) return Response.json({ ok: true, sent: false, why: String(e) }, NO_STORE);
  }
  return done;
}
