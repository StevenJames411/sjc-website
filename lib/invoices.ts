// The invoice book — every invoice, plus your own business details.
//
// Server-only (pulls in the store). Types and all the money arithmetic live in ./invoicesShared;
// read the note at the top of that file first, particularly the part about cents.
//
// This mirrors lib/forms.ts deliberately: one registry key, a defensive read, one private writer
// for the whole blob, and create/update/delete that return `{ ok, error }` instead of throwing.
// Copying a proven pattern is worth more here than any improvement I could invent.
//
// ── WHAT THIS DELIBERATELY IS NOT ─────────────────────────────────────────────────────────────
// Not accounts receivable. There is no paid/unpaid flag, no aging, no reminders and no ledger,
// because the moment one exists this stops being a document generator and becomes bookkeeping
// that has to be right. It WRITES an invoice and forgets it — the same boundary that keeps the
// website builder from becoming a CRM.
import { createKvStore } from "./kvStateStore";
import { getClient } from "./store";
import { INVOICES_KEY } from "./siteKeys";
import {
  EMPTY_ISSUER,
  EMPTY_BILL_TO,
  DEFAULT_PACKAGES,
  PACKAGE_KEYS,
  blankLine,
  nextNumber,
  today,
  addDays,
  mintLineId,
  parseBuyButton,
  type Invoice,
  type InvoiceLine,
  type IssuerDetails,
  type PaymentPackage,
  type PackageKey,
} from "./invoicesShared";

export * from "./invoicesShared";

type InvoiceBlob = { invoices?: Invoice[]; issuer?: IssuerDetails; packages?: PaymentPackage[] };

/**
 * The unguessable half of a public invoice URL.
 *
 * `crypto.getRandomValues`, not `Math.random`: this is the only thing protecting a customer's name
 * and address on a page with no login, and Math.random is predictable from a handful of prior
 * outputs. 128 bits — the same order as a session token, because that is what it is.
 */
function mintPublicId(): string {
  const bytes = new Uint8Array(16);
  globalThis.crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

const store = () => createKvStore(getClient(), INVOICES_KEY);

/** Newest first — an invoice book is read from the top, not alphabetically. */
const byNewest = (a: Invoice, b: Invoice) =>
  String(b.createdAt || "").localeCompare(String(a.createdAt || ""));

async function readBlob(): Promise<InvoiceBlob> {
  return (await store().read<InvoiceBlob>()) || {};
}

export async function readInvoices(): Promise<Invoice[]> {
  const blob = await readBlob();
  return (blob.invoices || []).filter((i) => i && i.id).map(normalize).sort(byNewest);
}

export async function findInvoice(id: string): Promise<Invoice | undefined> {
  const key = String(id || "").trim();
  return (await readInvoices()).find((i) => i.id === key);
}

/**
 * The lookup behind the public page. Called by an UNAUTHENTICATED request, so it is deliberately
 * the only way in: a blank or short token matches nothing rather than falling through to the first
 * invoice in the book.
 */
export async function findInvoiceByPublicId(token: string): Promise<Invoice | undefined> {
  const key = String(token || "").trim().toLowerCase();
  if (key.length < 24) return undefined;
  return (await readInvoices()).find((i) => i.publicId === key);
}

/**
 * The three packages, with the locked prices underneath whatever has been saved.
 *
 * Merged rather than replaced so a stored record that predates a field — or one saved with only
 * the buttons filled in — still comes back with its price, and so the ladder itself lives in code
 * where it can be read, not in a database row nobody can find.
 */
export async function readPackages(): Promise<PaymentPackage[]> {
  const blob = await readBlob();
  const saved = Array.isArray(blob.packages) ? blob.packages : [];
  return DEFAULT_PACKAGES.map((base) => {
    const hit = saved.find((p) => p?.key === base.key);
    if (!hit) return { ...base };
    return {
      ...base,
      label: String(hit.label || base.label),
      buildCents: Math.max(0, Math.round(Number(hit.buildCents) || base.buildCents)),
      hostingCents: Math.max(0, Math.round(Number(hit.hostingCents) || base.hostingCents)),
      buildLabel: String(hit.buildLabel || base.buildLabel),
      hostingLabel: String(hit.hostingLabel || base.hostingLabel),
      ...(hit.buttonId && hit.publishableKey
        ? { buttonId: String(hit.buttonId), publishableKey: String(hit.publishableKey) }
        : {}),
    };
  });
}

/**
 * Save the packages.
 *
 * `button` arrives as the raw snippet Stripe produced and is parsed HERE as well as in the browser
 * — the browser check is for the human, this one is what actually decides what gets stored, since
 * anything reaching this function has already left the page that validated it.
 */
export async function savePackages(
  incoming: Array<{
    key: string;
    label?: string;
    buildCents?: number;
    hostingCents?: number;
    buildLabel?: string;
    hostingLabel?: string;
    button?: string;
  }>
): Promise<{ ok: boolean; error?: string }> {
  const blob = await readBlob();
  const current = await readPackages();

  const next: PaymentPackage[] = current.map((pkg) => {
    const hit = (incoming || []).find((p) => p?.key === pkg.key);
    if (!hit) return pkg;

    // An empty paste CLEARS the button rather than being ignored — otherwise a button he meant to
    // remove would stay live with no way to take it off short of editing the database.
    const raw = typeof hit.button === "string" ? hit.button.trim() : undefined;
    const parsed = raw === undefined ? undefined : raw ? parseBuyButton(raw) : null;
    if (raw && parsed === null) {
      return pkg; // unparseable: keep what works. The browser already said why.
    }

    const { buttonId: _b, publishableKey: _k, ...bare } = pkg;
    return {
      ...bare,
      label: String(hit.label ?? pkg.label),
      buildCents: Math.max(0, Math.round(Number(hit.buildCents ?? pkg.buildCents) || 0)),
      hostingCents: Math.max(0, Math.round(Number(hit.hostingCents ?? pkg.hostingCents) || 0)),
      buildLabel: String(hit.buildLabel ?? pkg.buildLabel),
      hostingLabel: String(hit.hostingLabel ?? pkg.hostingLabel),
      ...(parsed === undefined
        ? pkg.buttonId && pkg.publishableKey
          ? { buttonId: pkg.buttonId, publishableKey: pkg.publishableKey }
          : {}
        : parsed || {}),
    };
  });

  const res = await writeBlob({ ...blob, packages: next });
  return res.ok ? { ok: true } : { ok: false, error: res.reason || "Couldn't save." };
}

/** Your own details, with the empty defaults underneath so a cold store still renders a form. */
export async function readIssuer(): Promise<IssuerDetails> {
  const blob = await readBlob();
  return { ...EMPTY_ISSUER, ...(blob.issuer || {}) };
}

/**
 * Fill in every field an older or hand-written record might be missing.
 *
 * The print page reads these straight onto a document a customer sees, so a missing `lines` array
 * or an undefined `billTo` must not become "undefined" in the middle of an invoice.
 */
function normalize(i: Invoice): Invoice {
  const lines = (Array.isArray(i.lines) ? i.lines : []).map(
    (l): InvoiceLine => ({
      id: String(l?.id || mintLineId()),
      description: String(l?.description || ""),
      qty: Number.isFinite(l?.qty) ? Number(l.qty) : 1,
      rateCents: Math.round(Number(l?.rateCents) || 0),
    })
  );
  return {
    id: i.id,
    number: String(i.number || ""),
    issuedOn: String(i.issuedOn || today()),
    dueOn: String(i.dueOn || ""),
    billTo: { ...EMPTY_BILL_TO, ...(i.billTo || {}) },
    lines: lines.length ? lines : [blankLine()],
    discountCents: Math.max(0, Math.round(Number(i.discountCents) || 0)),
    discountLabel: String(i.discountLabel || "Discount"),
    notes: String(i.notes || ""),
    terms: String(i.terms || ""),
    createdAt: String(i.createdAt || new Date().toISOString()),
    // Left undefined when absent rather than filled with blanks: `undefined` means "this invoice
    // predates snapshots, fall back to the current template", while an empty object would mean
    // "this invoice was genuinely sent with no business name on it" and print a blank header.
    ...(i.from ? { from: { ...EMPTY_ISSUER, ...i.from } } : {}),
    ...(PACKAGE_KEYS.includes(i.packageKey as PackageKey)
      ? { packageKey: i.packageKey as PackageKey }
      : {}),
    // Both ids or neither. A half-written snapshot would render an empty custom element — a Pay
    // button that is simply absent from the page, with nothing on screen to say so.
    ...(i.pay?.buttonId && i.pay?.publishableKey
      ? {
          pay: {
            label: String(i.pay.label || ""),
            buttonId: String(i.pay.buttonId),
            publishableKey: String(i.pay.publishableKey),
          },
        }
      : {}),
    ...(i.publicId ? { publicId: String(i.publicId).toLowerCase() } : {}),
    ...(i.paidOn ? { paidOn: String(i.paidOn) } : {}),
  };
}

async function writeBlob(next: InvoiceBlob): Promise<{ ok: boolean; reason?: string }> {
  // writeResult, not write: the save guard in lib/pgClient.ts refuses an array that shrinks too
  // far, and deleting a couple of invoices from a short book is exactly that shape. A refused save
  // that reports success is the failure this whole layer exists to prevent, so the reason has to
  // reach the human looking at the save indicator.
  const res = await store().writeResult(next);
  return { ok: res.ok, reason: res.reason };
}

export async function saveIssuer(
  patch: Partial<IssuerDetails>
): Promise<{ ok: boolean; error?: string }> {
  const blob = await readBlob();
  const issuer: IssuerDetails = { ...EMPTY_ISSUER, ...(blob.issuer || {}), ...(patch || {}) };
  const res = await writeBlob({ ...blob, issuer });
  return res.ok ? { ok: true } : { ok: false, error: res.reason || "Couldn't save." };
}

/**
 * Make an invoice, optionally as a copy of an existing one.
 *
 * A copy is the point of keeping a book at all: the $25/mo retainers are the same invoice every
 * month with two dates moved. It carries the bill-to, the lines and the terms, and takes a FRESH
 * number and today's dates — a duplicate that kept the old number would be the one mistake that
 * actually costs money, because two different documents would claim to be INV-0007.
 */
export async function createInvoice(opts: {
  from?: string;
  billTo?: Partial<Invoice["billTo"]>;
}): Promise<{ ok: boolean; id?: string; error?: string }> {
  const blob = await readBlob();
  const all = (blob.invoices || []).filter((i) => i && i.id).map(normalize);

  const source = opts?.from ? all.find((i) => i.id === opts.from) : undefined;
  if (opts?.from && !source) return { ok: false, error: "That invoice no longer exists." };

  const issuer = { ...EMPTY_ISSUER, ...(blob.issuer || {}) };
  const issuedOn = today();
  const id = `inv-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

  const invoice: Invoice = {
    id,
    number: nextNumber(all.map((i) => i.number)),
    issuedOn,
    dueOn: addDays(issuedOn, 14),
    billTo: { ...EMPTY_BILL_TO, ...(source?.billTo || {}), ...(opts?.billTo || {}) },
    // New line ids on a copy, so editing the duplicate can't disturb React rows keyed off the
    // original if both are open.
    lines: source ? source.lines.map((l) => ({ ...l, id: mintLineId() })) : [blankLine()],
    discountCents: source?.discountCents || 0,
    discountLabel: source?.discountLabel || "Discount",
    notes: source?.notes || "",
    terms: source?.terms || issuer.terms,
    createdAt: new Date().toISOString(),
    // The template, copied in. From here it belongs to this invoice — editing it on the invoice
    // changes this document only, unless you explicitly save it back as the default.
    from: { ...issuer },
    // A copy carries the package, and therefore its button — the monthly retainer is the same
    // invoice with two dates moved, and re-picking the package every month is how the wrong one
    // eventually gets picked. It gets its OWN public link: two documents sharing one URL means
    // last month's customer can watch this month's.
    ...(source?.packageKey ? { packageKey: source.packageKey } : {}),
    ...(source?.pay ? { pay: { ...source.pay } } : {}),
    publicId: mintPublicId(),
  };

  const res = await writeBlob({ ...blob, invoices: [...all, invoice] });
  if (!res.ok) return { ok: false, error: res.reason || "Couldn't save — storage is unavailable." };
  return { ok: true, id };
}

export async function updateInvoice(
  id: string,
  patch: Partial<Invoice>
): Promise<{ ok: boolean; error?: string; publicId?: string }> {
  const key = String(id || "").trim();
  if (!key) return { ok: false, error: "Which invoice?" };

  const blob = await readBlob();
  const all = (blob.invoices || []).filter((i) => i && i.id).map(normalize);
  const current = all.find((i) => i.id === key);
  if (!current) return { ok: false, error: "That invoice no longer exists." };

  // `id`, `createdAt` and `publicId` are not patchable: the id is the reference, createdAt is what
  // the book is ordered by, and a public link that changed on save would go dead in the inbox of
  // whoever was already sent it. Invoices written before public links existed get one here, which
  // is why the new value is handed back to the caller.
  const publicId = current.publicId || mintPublicId();
  const next = normalize({
    ...current,
    ...patch,
    id: current.id,
    createdAt: current.createdAt,
    publicId,
  });
  const res = await writeBlob({ ...blob, invoices: all.map((i) => (i.id === key ? next : i)) });
  return res.ok ? { ok: true, publicId } : { ok: false, error: res.reason || "Couldn't save." };
}

export async function deleteInvoice(id: string): Promise<{ ok: boolean; error?: string }> {
  const key = String(id || "").trim();
  const blob = await readBlob();
  const all = (blob.invoices || []).filter((i) => i && i.id).map(normalize);
  if (!all.some((i) => i.id === key)) return { ok: false, error: "That invoice no longer exists." };

  const res = await writeBlob({ ...blob, invoices: all.filter((i) => i.id !== key) });
  return res.ok ? { ok: true } : { ok: false, error: res.reason || "Couldn't save." };
}
