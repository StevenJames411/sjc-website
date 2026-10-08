// BOOK BUYERS, BY NAME (Steven, 2026-10-08).
//
// A smart link only counts taps. A book buyer is somebody we already know: Stripe gave us the name and email
// with the order. So for buyers, and only for buyers, the website keeps a record under their name of
//   · the pages they open on this website (their device is remembered from the download page), and
//   · the taps on the links inside THEIR signature copy of the book and study guides, from any device.
// A tap from a device that is not the buyer's own is how a passed-along copy shows itself.
//
// ⛔ NO NEW SMART LINKS PER BUYER. The list would grow by fourteen links with every sale ("it's starting to get
// bloated"). A buyer's copy carries the same fourteen Book Buyers links with the buyer's short code in front:
//   /b/<code>/<slug>   logs the tap here, then hands on to   /go/<slug>   which counts it as it always has.
//
// One record per buyer in the site's own store. Nothing here leaves the website.
import { createHmac, timingSafeEqual } from "node:crypto";
import { createKvStore } from "@/lib/kvStateStore";
import { getClient } from "@/lib/store";

export type BuyerView = { at: string; path: string };
export type BuyerTap = { at: string; link: string; own: boolean; device: string; country: string };
export type BuyerRecord = {
  code: string; order: string; name: string; email: string; bought: string;
  views: BuyerView[]; taps: BuyerTap[];
};
type Index = { buyers: { code: string; order: string; name: string; email: string; bought: string }[] };

const KEEP = 400; // newest views and taps kept per buyer
const secret = () => (process.env.SITE_EDIT_TOKEN || "").trim();
const mac = (s: string, len = 43) => createHmac("sha256", "book-buyer:" + secret()).update(s).digest("base64url").slice(0, len);
// The short code printed inside a buyer's links. It cannot be turned back into the order number.
export const buyerCode = (order: string) => mac("code:" + order, 12);

const INDEX = () => createKvStore(getClient(), "sjc-book-buyers");
const RECORD = (code: string) => createKvStore(getClient(), `sjc-book-buyer-${code}`);
export const readBuyer = (code: string) => (/^[A-Za-z0-9_-]{12}$/.test(code) ? RECORD(code).read<BuyerRecord>() : Promise.resolve(null));

/** Make sure this order has a record. Called when a buyer's download page opens. Returns their code. */
export async function ensureBuyer(order: string, who: { name: string; email: string }, boughtAt?: number): Promise<string> {
  const code = buyerCode(order);
  try {
    const store = RECORD(code);
    if (await store.read()) return code;
    const bought = new Date(boughtAt ? boughtAt * 1000 : Date.now()).toISOString();
    await store.write({ code, order, name: who.name, email: who.email, bought, views: [], taps: [] } satisfies BuyerRecord);
    const idx = INDEX(); const cur = ((await idx.read<Index>()) || { buyers: [] }).buyers || [];
    if (!cur.some((b) => b.code === code)) await idx.write({ buyers: [...cur, { code, order, name: who.name, email: who.email, bought }] });
  } catch (e) {
    console.error("book buyer record NOT made:", e);
  }
  return code;
}

// THE DEVICE MARKER. Two cookies: the signed one the server trusts, and a plain flag so a visitor who never
// bought the book sends nothing at all (the page's script cannot read the signed one).
const COOKIE = "sjc_buyer", FLAG = "sjc_b", YEARS = 2 * 365 * 24 * 3600;
export const buyerCookies = (code: string) => [
  `${COOKIE}=${code}.${mac("cookie:" + code)}; Path=/; Max-Age=${YEARS}; HttpOnly; Secure; SameSite=Lax`,
  `${FLAG}=1; Path=/; Max-Age=${YEARS}; Secure; SameSite=Lax`,
];
export function buyerFromCookie(header: string | null): string {
  const m = (header || "").match(/(?:^|;\s*)sjc_buyer=([A-Za-z0-9_-]{12})\.([A-Za-z0-9_-]+)/);
  if (!m || !secret()) return "";
  const want = mac("cookie:" + m[1]);
  return m[2].length === want.length && timingSafeEqual(Buffer.from(m[2]), Buffer.from(want)) ? m[1] : "";
}

async function add(code: string, change: (r: BuyerRecord) => void) {
  try {
    const store = RECORD(code); const r = await store.read<BuyerRecord>();
    if (!r) return;
    change(r); r.views = r.views.slice(-KEEP); r.taps = r.taps.slice(-KEEP);
    await store.write(r);
  } catch (e) {
    console.error("book buyer activity NOT saved:", e);
  }
}
export const logView = (code: string, path: string) =>
  add(code, (r) => { r.views.push({ at: new Date().toISOString(), path: path.slice(0, 200) }); });
export const logTap = (code: string, tap: Omit<BuyerTap, "at">) =>
  add(code, (r) => { r.taps.push({ at: new Date().toISOString(), ...tap }); });

/** Every buyer with their activity, newest buyer first. For the owner's screens only. */
export async function allBuyers(): Promise<BuyerRecord[]> {
  const idx = ((await INDEX().read<Index>()) || { buyers: [] }).buyers || [];
  const rows = await Promise.all(idx.map((b) => RECORD(b.code).read<BuyerRecord>()));
  return rows.filter((r): r is BuyerRecord => Boolean(r)).sort((a, b) => b.bought.localeCompare(a.bought));
}
