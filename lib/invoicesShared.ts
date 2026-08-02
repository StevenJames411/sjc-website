// Invoice TYPES + MONEY MATH only — no storage, safe to import in the browser.
// Split from ./invoices for the same reason formsShared is split from forms: the editor and the
// print page are client components, and importing the storage module drags the database client
// into the browser bundle.
//
// ── WHY MONEY IS AN INTEGER ───────────────────────────────────────────────────────────────────
// Every amount in this file is a whole number of CENTS. Never a float, anywhere, for any reason.
//
//   0.1 + 0.2            === 0.30000000000000004
//   19.99 * 3            === 59.97000000000001
//   1.005.toFixed(2)     === "1.00"          (not 1.01)
//
// Those are the actual numbers on an actual invoice. A total that is one penny off is the single
// bug a customer always notices, and it makes every other number on the page suspect. So dollars
// exist in exactly two places — the moment a human types one, and the moment one is displayed —
// and in between it is always cents.
//
// The editor and the printed page both compute from THESE functions rather than each doing their
// own arithmetic, so the number on screen and the number on the PDF cannot disagree.

export type InvoiceLine = {
  /** Stable per-line key so React rows don't re-mount while typing. Never shown. */
  id: string;
  description: string;
  /** May be fractional (1.5 hours). Multiplied by the rate and rounded ONCE, per line. */
  qty: number;
  rateCents: number;
};

/** Who the invoice is being sent to. Plain text — this is a document, not a contact record. */
export type BillTo = {
  name: string;
  attn: string;
  address: string;
  email: string;
};

/**
 * A Stripe buy button, reduced to the only two things it actually is.
 *
 * Steven pastes the whole snippet Stripe hands him; what gets STORED is these two ids, never his
 * markup. That is the point — the public invoice page renders a `<stripe-buy-button>` element this
 * file writes itself, so nothing pasted into an admin box can ever become live HTML on a page a
 * customer opens. A bad paste fails at the paste box, where he can see it, instead of silently
 * rendering nothing on an invoice already emailed.
 */
export type BuyButton = {
  /** `buy_btn_…` — identifies the button, and through it the payment link and its prices. */
  buttonId: string;
  /** `pk_live_…`. PUBLISHABLE, not secret: it is designed to sit in a public page. */
  publishableKey: string;
};

export type PackageKey = "bronze" | "silver" | "gold";

/**
 * One of the three packages, as sold.
 *
 * The prices are here so the editor can tell you the invoice and the button disagree BEFORE it
 * goes out — a $1,195 invoice carrying the $795 button is the one mistake in this whole feature
 * that costs real money, and it is invisible on the printed page.
 */
export type PaymentPackage = {
  key: PackageKey;
  label: string;
  buildCents: number;
  hostingCents: number;
  /** What the build line SAYS on the invoice. The customer reads this, so it's his language. */
  buildLabel: string;
  /** What the hosting line says. It appears twice — charged, then credited underneath. */
  hostingLabel: string;
} & Partial<BuyButton>;

/**
 * The ladder, as locked 2026-08-02. Prices live here; the buttons get pasted in once Stripe has them.
 *
 * ── ONE BUILD PRICE, THREE MONTHLIES ──────────────────────────────────────────────────────────
 * The build fee no longer varies — it is $795 whichever monthly he lands on, because the build is
 * the same build. What differs is how much of the machine runs afterwards. That is also why every
 * invoice here totals $795: the monthly line is charged and credited straight back, so one buy
 * button is correct for all three.
 *
 * ⛔ Only BRONZE is sold at the door. Silver and Gold are the internal upsell roadmap, opened at
 * 30–60 days — they live here so a client who buys straight into the top gets one correct invoice,
 * not so three columns ever get shown to a prospect. A confused mind doesn't buy.
 *
 * ⛔ The word "hosting" is gone on purpose. It invites a Wix comparison and it undersells the line:
 * at $97 he is getting the CRM and the app on his phone, not disk space.
 */
export const DEFAULT_PACKAGES: PaymentPackage[] = [
  {
    key: "bronze",
    label: "Website + CRM — $97/mo",
    buildCents: 79500,
    hostingCents: 9700,
    buildLabel: "Custom Coded Lead Capture Website",
    hostingLabel: "Monthly Website & Lead System Management",
  },
  {
    key: "silver",
    label: "We Run It — $297/mo",
    buildCents: 79500,
    hostingCents: 29700,
    buildLabel: "Custom Coded Lead Capture Website",
    hostingLabel: "Monthly Website & Lead System Management",
  },
  {
    key: "gold",
    label: "AI Employee — $597/mo",
    buildCents: 79500,
    hostingCents: 59700,
    buildLabel: "Custom Coded Lead Capture Website",
    hostingLabel: "Monthly Website & Lead System Management",
  },
];

/** What the first-month credit is called on the invoice. */
export const FIRST_MONTH_CREDIT = "First month — credited";

/**
 * The whole invoice a package produces: two lines and the credit.
 *
 * ── WHY THE HOSTING LINE IS CHARGED AND THEN CREDITED ─────────────────────────────────────────
 * Not "hosting: free". The line goes on at its real price and a discount takes it straight back
 * off, because the give is the point — he says "I'm covering your first month" on the phone and
 * the document has to show the number he just gave away. A free line shows nothing.
 *
 * The total lands exactly on the build price, which is also what the buy button charges. That is
 * not a coincidence, it's the design: pick a package and the invoice and the button agree.
 */
export function packageLines(pkg: PaymentPackage): {
  lines: InvoiceLine[];
  discountCents: number;
  discountLabel: string;
} {
  return {
    lines: [
      { id: mintLineId(), description: pkg.buildLabel, qty: 1, rateCents: pkg.buildCents },
      { id: mintLineId(), description: pkg.hostingLabel, qty: 1, rateCents: pkg.hostingCents },
    ],
    discountCents: pkg.hostingCents,
    discountLabel: FIRST_MONTH_CREDIT,
  };
}

/** Does this invoice already say what the package would put on it? Used to offer the re-fill. */
export function matchesPackage(
  inv: Pick<Invoice, "lines" | "discountCents">,
  pkg: PaymentPackage
): boolean {
  const want = packageLines(pkg);
  const has = (inv.lines || []).filter((l) => l.description.trim() || l.rateCents);
  if (has.length !== want.lines.length) return false;
  if ((inv.discountCents || 0) !== want.discountCents) return false;
  return want.lines.every(
    (w, i) => has[i].description === w.description && has[i].rateCents === w.rateCents && has[i].qty === w.qty
  );
}

/** True when nothing has been typed into the items yet, so filling them can't destroy anything. */
export function itemsAreEmpty(lines: InvoiceLine[]): boolean {
  return !(lines || []).some((l) => l.description.trim() || l.rateCents);
}

export const PACKAGE_KEYS: PackageKey[] = ["bronze", "silver", "gold"];

/**
 * Pull the two ids out of whatever Stripe's dialog produced.
 *
 * Tolerant about the markup around them and strict about the values themselves: the ids have to
 * look like Stripe ids or this returns null, because "it saved" on a typo'd key means a Pay button
 * that renders as nothing on the customer's screen with no error anywhere.
 */
export function parseBuyButton(pasted: string): BuyButton | null {
  const src = String(pasted || "");
  const id = src.match(/buy-button-id\s*=\s*["']\s*(buy_btn_[A-Za-z0-9]+)\s*["']/);
  const pk = src.match(/publishable-key\s*=\s*["']\s*(pk_(?:live|test)_[A-Za-z0-9]+)\s*["']/);
  if (!id || !pk) return null;
  return { buttonId: id[1], publishableKey: pk[1] };
}

/** True once a package can actually take money. */
export function isPayable(p?: Partial<BuyButton>): p is BuyButton {
  return Boolean(p?.buttonId && p?.publishableKey);
}

export type Invoice = {
  id: string;
  /** What the customer sees and quotes back at you. Auto-assigned, editable. */
  number: string;
  /** yyyy-mm-dd. Stored as a plain date because an invoice has no time of day. */
  issuedOn: string;
  dueOn: string;
  billTo: BillTo;
  lines: InvoiceLine[];
  /** A discount is stored positive and SUBTRACTED. Kept separate so it prints as its own line. */
  discountCents: number;
  discountLabel: string;
  notes: string;
  /** Payment terms for this invoice, defaulted from your details but editable per invoice. */
  terms: string;
  createdAt: string;
  /**
   * YOUR details, as they were when this invoice was made.
   *
   * A snapshot, not a reference. The alternative — every invoice rendering the one current set of
   * details — means changing your address next year silently rewrites the address on invoices you
   * already sent, and reprinting an old one produces a document that never existed. An invoice is
   * a record of what went out.
   *
   * Copied from the saved template when the invoice is created, and editable right here, which is
   * what makes filling one in a single step. Older invoices written before this existed have no
   * snapshot; those fall back to the current template.
   */
  from?: IssuerDetails;

  /* ── paying it ──────────────────────────────────────────────────────────────────────────── */

  /** Which package was picked, so the editor can compare the total against its price. */
  packageKey?: PackageKey;
  /**
   * The button, SNAPSHOTTED at the moment it was picked — same law as `from`.
   *
   * Re-mint a package's button in Stripe next quarter and every invoice already sent would
   * otherwise start pointing at the new one. An invoice is a record of what went out, including
   * what it asked the customer to pay.
   */
  pay?: BuyButton & { label: string };
  /**
   * The unguessable half of the public URL: /i/<publicId>.
   *
   * Not the invoice id. The id appears in the owner's address bar and is short enough to guess at;
   * this is 32 random hex characters and is the only thing standing between a stranger and a
   * customer's name, address and what he paid. Minted on create, and backfilled on first save for
   * invoices written before this existed.
   */
  publicId?: string;
  /**
   * yyyy-mm-dd, set by hand when he's been paid. A STAMP on the document, not a ledger — it
   * changes what this one page says and nothing else. No aging, no reminders, no balance owed;
   * see the boundary note at the top of lib/invoices.ts.
   */
  paidOn?: string;
};

/**
 * Your own business details — typed once, reused on every invoice.
 *
 * `businessName` and `dba` are two fields on purpose. A DBA is not a nickname: the legal entity
 * is what a cheque must be written to and what the customer's bookkeeper needs, while the trading
 * name is what he recognises. Printing only one of them is what makes an invoice look wrong to
 * whoever pays it.
 */
export type IssuerDetails = {
  businessName: string;
  dba: string;
  address: string;
  email: string;
  phone: string;
  /** Default payment terms copied onto each new invoice. */
  terms: string;
  /** How to actually pay — bank details, Zelle, "cheque to…". Free text on purpose. */
  payTo: string;
};

export const EMPTY_ISSUER: IssuerDetails = {
  businessName: "",
  dba: "",
  address: "",
  email: "",
  phone: "",
  terms: "Payment due within 14 days.",
  payTo: "",
};

export const EMPTY_BILL_TO: BillTo = { name: "", attn: "", address: "", email: "" };

/* ─────────────────────────────── money ─────────────────────────────── */

/**
 * A typed dollar amount -> whole cents.
 *
 * Tolerant on purpose: "1,234.5", "$1234.50", " 1234.5 " and "1234.567" all arrive from a real
 * keyboard. Anything unparseable is 0 rather than NaN — a NaN would propagate into the total and
 * print the word "NaN" on a document going to a customer.
 */
export function toCents(input: string | number): number {
  // Numbers go through their own string form so both paths use the exact decimal parser below.
  // Multiplying by 100 first is NOT safe: 1.005 * 100 === 100.49999999999999, so rounding after
  // the multiply silently gives 1.00. The lossy step is the multiply, so there isn't one.
  const raw = typeof input === "number" ? (Number.isFinite(input) ? String(input) : "") : String(input ?? "");
  const cleaned = raw.replace(/[^0-9.eE+-]/g, "");
  if (!cleaned) return 0;

  // Exponent notation can't be read digit by digit. Vanishingly rare on an invoice, so fall back
  // rather than grow a parser for it.
  if (/[eE]/.test(cleaned)) {
    const n = Number(cleaned);
    return Number.isFinite(n) ? Math.round(n * 100) : 0;
  }

  const m = cleaned.match(/^(-)?(\d*)(?:\.(\d*))?$/);
  if (!m) return 0;
  const [, sign, whole = "", frac = ""] = m;
  if (!whole && !frac) return 0;

  const dollars = whole ? Number(whole) : 0;
  if (!Number.isFinite(dollars)) return 0;

  // Two decimal places, with the third rounded half-up — read off the DIGITS, so "1.005" is 101
  // because the character is a 5, not because a float happened to land above the midpoint.
  const centsDigits = Number((frac + "00").slice(0, 2));
  const third = Number(frac[2] || "0");
  const cents = dollars * 100 + centsDigits + (third >= 5 ? 1 : 0);
  return sign === "-" ? -cents : cents;
}

/** Cents -> "1,234.56". No currency symbol; the document adds it once, where it belongs. */
export function fromCents(cents: number): string {
  const n = Math.round(Number(cents) || 0);
  const neg = n < 0;
  const abs = Math.abs(n);
  const whole = Math.floor(abs / 100).toLocaleString("en-US");
  const frac = String(abs % 100).padStart(2, "0");
  return `${neg ? "-" : ""}${whole}.${frac}`;
}

/** Cents -> "$1,234.56", for anywhere the symbol is wanted inline. */
export const money = (cents: number): string => `$${fromCents(cents)}`;

/** A quantity from a keyboard. Blank means 1 — the common case is a single item. */
export function toQty(input: string | number): number {
  if (typeof input === "number") return Number.isFinite(input) ? input : 1;
  const cleaned = String(input ?? "").replace(/[^0-9.-]/g, "");
  if (!cleaned) return 1;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 1;
}

/**
 * One line's amount. Rounded HERE and only here, so the printed line items always add up to the
 * printed subtotal — rounding at the total instead is what produces an invoice whose column
 * visibly doesn't sum.
 */
export function lineTotalCents(line: Pick<InvoiceLine, "qty" | "rateCents">): number {
  const qty = Number.isFinite(line?.qty) ? line.qty : 0;
  const rate = Math.round(Number(line?.rateCents) || 0);
  return Math.round(qty * rate);
}

export type InvoiceTotals = { subtotalCents: number; discountCents: number; totalCents: number };

/** Every number the document prints, computed once from the same source. */
export function totals(inv: Pick<Invoice, "lines" | "discountCents">): InvoiceTotals {
  const subtotalCents = (inv?.lines || []).reduce((sum, l) => sum + lineTotalCents(l), 0);
  const discountCents = Math.max(0, Math.round(Number(inv?.discountCents) || 0));
  return { subtotalCents, discountCents, totalCents: subtotalCents - discountCents };
}

/* ─────────────────────────────── dates ─────────────────────────────── */

/** Today as yyyy-mm-dd in LOCAL time — `toISOString()` is UTC and dates an evening invoice tomorrow. */
export function today(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** yyyy-mm-dd + n days, staying on the local calendar. */
export function addDays(iso: string, days: number): string {
  const [y, m, d] = String(iso || today()).split("-").map(Number);
  const dt = new Date(y, (m || 1) - 1, d || 1);
  dt.setDate(dt.getDate() + days);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${dt.getFullYear()}-${p(dt.getMonth() + 1)}-${p(dt.getDate())}`;
}

/** yyyy-mm-dd -> "1 August 2026". Parsed as local parts, never `new Date(iso)` (that's UTC). */
export function prettyDate(iso: string): string {
  const parts = String(iso || "").split("-").map(Number);
  if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) return "";
  const [y, m, d] = parts;
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

/** A fresh line, with the key already minted. */
export function blankLine(): InvoiceLine {
  return { id: mintLineId(), description: "", qty: 1, rateCents: 0 };
}

export function mintLineId(): string {
  return `l${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * The next invoice number, following whatever pattern is already in use.
 *
 * Reads the trailing digits of the highest existing number and increments, preserving the prefix
 * and the zero padding — so "SJC-0007" begets "SJC-0008" without a setting to configure. Falls
 * back to INV-0001 for the very first one.
 */
export function nextNumber(existing: string[]): string {
  let best: { prefix: string; width: number; n: number } | null = null;
  for (const raw of existing) {
    const m = String(raw || "").match(/^(.*?)(\d+)\s*$/);
    if (!m) continue;
    const n = Number(m[2]);
    if (!Number.isFinite(n)) continue;
    if (!best || n > best.n) best = { prefix: m[1], width: m[2].length, n };
  }
  if (!best) return "INV-0001";
  return `${best.prefix}${String(best.n + 1).padStart(best.width, "0")}`;
}
