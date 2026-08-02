"use client";
// One invoice: the form on the left, the actual document on the right.
//
// The preview is not a mock-up — it is <InvoiceDoc>, the same component the print page renders,
// so what's on the right is literally what comes out of the printer.
//
// ── WHY AMOUNTS ARE HELD AS TEXT WHILE EDITING ────────────────────────────────────────────────
// A money input can't store a number as you type it. "19." is not a number, "0.0" collapses to 0
// and erases the zero the cursor is sitting behind, and re-formatting mid-keystroke moves the
// caret. So every amount is a STRING in this component and becomes cents only when it's read —
// for the preview, and for the save. The stored record never sees a float. See lib/invoicesShared.
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import InvoiceDoc from "./InvoiceDoc";
import {
  addDays,
  fromCents,
  isPayable,
  itemsAreEmpty,
  matchesPackage,
  mintLineId,
  money,
  packageLines,
  toCents,
  today,
  toQty,
  totals,
  type Invoice,
  type IssuerDetails,
  type PackageKey,
  type PaymentPackage,
} from "@/lib/invoicesShared";
import { invoiceUrlFor } from "@/lib/hostShared";
import type { Site } from "@/lib/sitesShared";

type EditLine = { id: string; description: string; qtyText: string; rateText: string };

const qtyToText = (n: number) => (Number.isInteger(n) ? String(n) : String(Number(n.toFixed(3))));

export default function InvoiceEditor({
  invoice,
  issuer,
  sites,
  packages,
}: {
  invoice: Invoice;
  issuer: IssuerDetails;
  sites: Site[];
  packages: PaymentPackage[];
}) {
  const router = useRouter();

  const [number, setNumber] = useState(invoice.number);
  const [issuedOn, setIssuedOn] = useState(invoice.issuedOn);
  const [dueOn, setDueOn] = useState(invoice.dueOn);
  const [billTo, setBillTo] = useState(invoice.billTo);
  const [terms, setTerms] = useState(invoice.terms);
  const [notes, setNotes] = useState(invoice.notes);
  const [discountText, setDiscountText] = useState(
    invoice.discountCents ? fromCents(invoice.discountCents) : ""
  );
  const [discountLabel, setDiscountLabel] = useState(invoice.discountLabel || "Discount");
  const [lines, setLines] = useState<EditLine[]>(
    invoice.lines.map((l) => ({
      id: l.id,
      description: l.description,
      qtyText: qtyToText(l.qty),
      rateText: l.rateCents ? fromCents(l.rateCents) : "",
    }))
  );

  // YOUR details, on the invoice rather than on another page. They arrive pre-filled from the
  // saved template, so making an invoice is one step: change who you're billing, add the lines,
  // print. Editing here changes THIS invoice; "Save as my default" pushes it back to the template
  // for the next one. Nothing is hard-coded anywhere.
  const [from, setFrom] = useState<IssuerDetails>(invoice.from ?? issuer);
  const [defaultSaved, setDefaultSaved] = useState(false);
  const [openFrom, setOpenFrom] = useState(!(invoice.from ?? issuer).businessName);

  // HOW IT GETS PAID. `pay` is a snapshot taken when the package is picked, not a live reference —
  // same law as the From block. Re-mint a button in Stripe next quarter and this invoice keeps
  // pointing at the one the customer was actually sent.
  const [packageKey, setPackageKey] = useState<PackageKey | "">(invoice.packageKey ?? "");
  const [pay, setPay] = useState(invoice.pay);
  const [paidOn, setPaidOn] = useState(invoice.paidOn || "");
  // Handed back by the save, because invoices written before public links existed get one there.
  const [publicId, setPublicId] = useState(invoice.publicId || "");
  const [copied, setCopied] = useState(false);
  // NOT window.location.origin. Invoices are edited on stevenjamesconsulting.com, and a bill from
  // Steven James Designs arriving at the consulting address makes the person reading it check
  // whether they've been phished — rightly. Both domains serve this deployment, so the link works
  // either way, which is exactly why it has to be the deliberate one.
  const publicUrl = publicId ? invoiceUrlFor(publicId) : "";

  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState("");

  // Every edit funnels through here so nothing can change state without also marking the invoice
  // unsaved — the "editor was lying about saving" bug was exactly this, missed in one handler.
  function edit<T>(setter: (v: T) => void) {
    return (v: T) => {
      setter(v);
      setDirty(true);
      setSaved(false);
      setErr("");
    };
  }

  /** What the document currently says. Derived, never stored — see the note at the top. */
  const draft: Invoice = useMemo(
    () => ({
      ...invoice,
      number,
      issuedOn,
      dueOn,
      billTo,
      terms,
      notes,
      discountLabel,
      discountCents: toCents(discountText),
      from,
      ...(packageKey ? { packageKey } : {}),
      ...(pay ? { pay } : {}),
      ...(paidOn ? { paidOn } : {}),
      lines: lines.map((l) => ({
        id: l.id,
        description: l.description,
        qty: toQty(l.qtyText),
        rateCents: toCents(l.rateText),
      })),
    }),
    [
      invoice,
      number,
      issuedOn,
      dueOn,
      billTo,
      terms,
      notes,
      discountLabel,
      discountText,
      lines,
      from,
      packageKey,
      pay,
      paidOn,
    ]
  );

  const t = totals(draft);

  const picked = packages.find((p) => p.key === packageKey);
  /**
   * THE GUARD. The button's price is fixed in Stripe; the invoice total is typed here. Nothing on
   * the printed page shows the difference, so a $1,195 invoice quietly carrying the $795 button
   * would be discovered by the customer paying $795 and considering it settled.
   */
  const mismatch = Boolean(picked && t.totalCents !== picked.buildCents);
  /** Picked a package, but the items aren't what it sells. Offer to write them. */
  const canFill = Boolean(picked && !matchesPackage(draft, picked));

  /** Write the package's two lines and the first-month credit onto this invoice. */
  function fillFromPackage(pkg: PaymentPackage) {
    const p = packageLines(pkg);
    edit(setLines)(
      p.lines.map((l) => ({
        id: l.id,
        description: l.description,
        qtyText: qtyToText(l.qty),
        rateText: fromCents(l.rateCents),
      }))
    );
    setDiscountText(fromCents(p.discountCents));
    setDiscountLabel(p.discountLabel);
  }

  /**
   * Pick a package: write the invoice, and freeze the button it points at right now.
   *
   * The items are filled automatically only when nothing has been typed into them — which is the
   * normal case, a fresh invoice. If there's already something there it waits to be asked, because
   * silently replacing lines somebody typed is the kind of help that loses work.
   */
  function pickPackage(key: string) {
    const next = packages.find((p) => p.key === key);
    edit(setPackageKey)((next?.key ?? "") as PackageKey | "");
    setPay(
      next && isPayable(next)
        ? { label: next.label, buttonId: next.buttonId, publishableKey: next.publishableKey }
        : undefined
    );
    if (next && itemsAreEmpty(draft.lines)) fillFromPackage(next);
  }

  function setLine(id: string, patch: Partial<EditLine>) {
    edit(setLines)(lines.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  }

  function addLine() {
    edit(setLines)([...lines, { id: mintLineId(), description: "", qtyText: "1", rateText: "" }]);
  }

  function removeLine(id: string) {
    // Never leave zero rows — an empty table with no way back is a dead end.
    const next = lines.filter((l) => l.id !== id);
    edit(setLines)(next.length ? next : [{ id: mintLineId(), description: "", qtyText: "1", rateText: "" }]);
  }

  /** Fill the bill-to from a website's business facts. Still fully editable afterwards. */
  function fillFromSite(siteId: string) {
    const s = sites.find((x) => x.id === siteId);
    if (!s) return;
    edit(setBillTo)({
      name: s.business?.name || s.name || "",
      attn: billTo.attn,
      address: s.business?.address || "",
      email: s.business?.email || "",
    });
  }

  async function save(): Promise<boolean> {
    setSaving(true);
    setErr("");
    try {
      const res = await fetch("/api/invoices", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          id: invoice.id,
          number: draft.number,
          issuedOn: draft.issuedOn,
          dueOn: draft.dueOn,
          billTo: draft.billTo,
          lines: draft.lines,
          discountCents: draft.discountCents,
          discountLabel: draft.discountLabel,
          notes: draft.notes,
          terms: draft.terms,
          from: draft.from,
          // null, NOT undefined: JSON.stringify DROPS undefined values, so an unset package would
          // never reach the server and un-picking one would silently do nothing. null arrives,
          // fails the checks in normalize(), and the field comes back off.
          packageKey: packageKey || null,
          pay: pay || null,
          paidOn: paidOn || null,
        }),
      });
      const body = await res.json();
      // The store's save guard can REFUSE a write and still return 200-shaped JSON, so the flag
      // is what's checked — not res.ok, and never nothing at all.
      if (!body?.ok) throw new Error(body?.error || "Couldn't save.");
      if (body.publicId) setPublicId(String(body.publicId));
      setDirty(false);
      setSaved(true);
      router.refresh();
      return true;
    } catch (e) {
      setErr((e as Error).message);
      return false;
    } finally {
      setSaving(false);
    }
  }

  /** Print always shows SAVED content, so the PDF can never be a version that isn't recorded. */
  async function printIt() {
    if (dirty && !(await save())) return;
    window.location.href = `/edit/invoices/${invoice.id}/print?print=1`;
  }

  /** Push this invoice's From block back to the template, so the next invoice starts with it. */
  async function saveAsDefault() {
    setSaving(true);
    setErr("");
    try {
      const res = await fetch("/api/invoices", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ issuer: from }),
      });
      const body = await res.json();
      if (!body?.ok) throw new Error(body?.error || "Couldn't save.");
      setDefaultSaved(true);
      setTimeout(() => setDefaultSaved(false), 2600);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  const setFromField = (k: keyof IssuerDetails) => (v: string) => {
    edit(setFrom)({ ...from, [k]: v });
  };

  return (
    <div style={page}>
      <div style={head}>
        <div>
          <a href="/edit/invoices" style={back}>
            ← Invoices
          </a>
          <h1 style={h1}>{number || "Invoice"}</h1>
          <p style={sub}>
            {billTo.name ? `For ${billTo.name} · ` : ""}
            {t.totalCents ? `$${fromCents(t.totalCents)} due` : "Nothing on it yet"}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
          <span style={saveState}>
            {saving ? "Saving…" : err ? "" : dirty ? "Unsaved changes" : saved ? "Saved" : ""}
          </span>
          <button type="button" style={ghostBtn} onClick={save} disabled={saving || !dirty}>
            Save
          </button>
          <button type="button" style={primaryBtn} onClick={printIt} disabled={saving}>
            Print / PDF
          </button>
        </div>
      </div>

      {err ? <p style={errBox}>{err}</p> : null}

      <div style={cols}>
        {/* ── the form ───────────────────────────────────────────────────────────── */}
        <div style={formCol}>
          {/* FROM — collapsed to one line once it's filled in, because on all but the first
              invoice it's already correct and only takes up room. Expanded automatically when
              there's no business name yet, which is the one time it needs attention. */}
          <section style={panel}>
            <div style={panelHeadRow}>
              <div style={{ minWidth: 0 }}>
                <h2 style={{ ...panelH, marginBottom: 2 }}>From</h2>
                {!openFrom ? (
                  <p style={fromSummary}>
                    {from.businessName || "No business name yet"}
                    {from.dba ? ` · dba ${from.dba}` : ""}
                  </p>
                ) : (
                  <p style={hint}>These print at the top of this invoice.</p>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                {openFrom ? (
                  <button type="button" style={smallBtn} onClick={saveAsDefault} disabled={saving}>
                    {defaultSaved ? "Saved as default" : "Save as my default"}
                  </button>
                ) : null}
                <button type="button" style={smallBtn} onClick={() => setOpenFrom((v) => !v)}>
                  {openFrom ? "Done" : "Change"}
                </button>
              </div>
            </div>

            {openFrom ? (
              <>
                <div style={row2}>
                  <Field label="Business name (the legal entity)">
                    <input
                      style={input}
                      value={from.businessName}
                      onChange={(e) => setFromField("businessName")(e.target.value)}
                    />
                  </Field>
                  <Field label="DBA / trading name">
                    <input style={input} value={from.dba} onChange={(e) => setFromField("dba")(e.target.value)} />
                  </Field>
                </div>
                <div style={row2}>
                  <Field label="Email">
                    <input style={input} value={from.email} onChange={(e) => setFromField("email")(e.target.value)} />
                  </Field>
                  <Field label="Phone">
                    <input style={input} value={from.phone} onChange={(e) => setFromField("phone")(e.target.value)} />
                  </Field>
                </div>
                <Field label="Address">
                  <textarea
                    style={{ ...input, minHeight: 58, resize: "vertical" }}
                    value={from.address}
                    onChange={(e) => setFromField("address")(e.target.value)}
                  />
                </Field>
                <Field label="How to pay">
                  <textarea
                    style={{ ...input, minHeight: 58, resize: "vertical" }}
                    value={from.payTo}
                    onChange={(e) => setFromField("payTo")(e.target.value)}
                  />
                </Field>
                <p style={hint}>
                  Changes here apply to <strong>this invoice</strong>. Use “Save as my default” to
                  start every future invoice with them.
                </p>
              </>
            ) : null}
          </section>

          <section style={panel}>
            <h2 style={panelH}>Details</h2>
            <div style={row2}>
              <Field label="Invoice number">
                <input style={input} value={number} onChange={(e) => edit(setNumber)(e.target.value)} />
              </Field>
              <div />
            </div>
            <div style={row2}>
              <Field label="Issued">
                <input
                  type="date"
                  style={input}
                  value={issuedOn}
                  onChange={(e) => {
                    // Moving the issue date drags the due date with it only while they're still
                    // the default 14 days apart — once the due date is set by hand, leave it be.
                    const wasDefault = dueOn === addDays(issuedOn, 14);
                    edit(setIssuedOn)(e.target.value);
                    if (wasDefault) setDueOn(addDays(e.target.value, 14));
                  }}
                />
              </Field>
              <Field label="Due">
                <input type="date" style={input} value={dueOn} onChange={(e) => edit(setDueOn)(e.target.value)} />
              </Field>
            </div>
          </section>

          <section style={panel}>
            <div style={panelHeadRow}>
              <h2 style={panelH}>Bill to</h2>
              {sites.length ? (
                <select
                  style={picker}
                  value=""
                  onChange={(e) => {
                    if (e.target.value) fillFromSite(e.target.value);
                  }}
                >
                  <option value="">Copy from a website…</option>
                  {sites.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.business?.name || s.name}
                    </option>
                  ))}
                </select>
              ) : null}
            </div>
            <Field label="Business name">
              <input
                style={input}
                value={billTo.name}
                onChange={(e) => edit(setBillTo)({ ...billTo, name: e.target.value })}
              />
            </Field>
            <div style={row2}>
              <Field label="Attention (optional)">
                <input
                  style={input}
                  value={billTo.attn}
                  onChange={(e) => edit(setBillTo)({ ...billTo, attn: e.target.value })}
                />
              </Field>
              <Field label="Email">
                <input
                  style={input}
                  value={billTo.email}
                  onChange={(e) => edit(setBillTo)({ ...billTo, email: e.target.value })}
                />
              </Field>
            </div>
            <Field label="Address">
              <textarea
                style={{ ...input, minHeight: 62, resize: "vertical" }}
                value={billTo.address}
                onChange={(e) => edit(setBillTo)({ ...billTo, address: e.target.value })}
              />
            </Field>
          </section>

          {/* ── HOW IT GETS PAID ─────────────────────────────────────────────────────────────
              The package picks the button; the link is what you actually email. The printed PDF
              stays exactly as it was — a buy button is a <script> embed, which no email client
              and no PDF will run, so the page is the only place it can live. */}
          <section style={panel}>
            <h2 style={panelH}>Payment</h2>

            <Field label="Package">
              <select
                style={{ ...input, cursor: "pointer" }}
                value={packageKey}
                onChange={(e) => pickPackage(e.target.value)}
              >
                <option value="">No package — this invoice has no Pay button</option>
                {packages.map((p) => (
                  <option key={p.key} value={p.key}>
                    {p.label} — {money(p.buildCents)} build · {money(p.hostingCents)}/mo
                    {isPayable(p) ? "" : "  (no button yet)"}
                  </option>
                ))}
              </select>
            </Field>

            {picked && !pay ? (
              <p style={warnBox}>
                <strong>{picked.label} has no buy button yet.</strong> Mint one in Stripe and paste
                it under Packages on the invoice list — until then this page can&rsquo;t take a card.
              </p>
            ) : null}

            {mismatch && picked ? (
              <p style={warnBox}>
                <strong>This invoice says {money(t.totalCents)}.</strong> The {picked.label} button
                charges {money(picked.buildCents)}. Fix the amount, or pick the package that matches
                — the printed page won&rsquo;t show the difference.
              </p>
            ) : null}

            {picked && canFill ? (
              <button type="button" style={fillBtn} onClick={() => fillFromPackage(picked)}>
                Write the {picked.label} items onto this invoice — {picked.buildLabel}{" "}
                {money(picked.buildCents)}, {picked.hostingLabel} {money(picked.hostingCents)}, less
                the first month
              </button>
            ) : null}

            <div style={{ ...shareBox, marginTop: 14 }}>
              <div style={{ minWidth: 0 }}>
                <div style={lbl}>The customer&rsquo;s link</div>
                {publicId ? (
                  <div style={linkText}>{publicUrl}</div>
                ) : (
                  <div style={hint}>Save this invoice once and its link appears here.</div>
                )}
              </div>
              {publicId ? (
                <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                  <button
                    type="button"
                    style={smallBtn}
                    onClick={async () => {
                      // Save first: the link opens the SAVED invoice, so copying it while there
                      // are unsaved edits hands the customer a document you're not looking at.
                      if (dirty && !(await save())) return;
                      await navigator.clipboard.writeText(publicUrl);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2200);
                    }}
                  >
                    {copied ? "Copied" : "Copy link"}
                  </button>
                  <a
                    href={publicUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{ ...smallBtn, textDecoration: "none", display: "inline-block" }}
                  >
                    Open
                  </a>
                </div>
              ) : null}
            </div>

            {/* A STAMP, not a ledger. It changes what this one document says and nothing else —
                no balance owed, no aging, no reminders. See lib/invoices.ts. */}
            <label style={paidRow}>
              <input
                type="checkbox"
                checked={Boolean(paidOn)}
                onChange={(e) => edit(setPaidOn)(e.target.checked ? today() : "")}
              />
              <span style={{ fontSize: 13.5, fontWeight: 600 }}>Mark as paid</span>
              {paidOn ? (
                <input
                  type="date"
                  style={{ ...input, width: "auto", marginLeft: 6 }}
                  value={paidOn}
                  onChange={(e) => edit(setPaidOn)(e.target.value)}
                />
              ) : null}
            </label>
            {paidOn ? (
              <p style={hint}>
                The document now says paid, and the Pay button is gone from the customer&rsquo;s
                page. Print it and send that as his receipt.
              </p>
            ) : null}
          </section>

          <section style={panel}>
            <h2 style={panelH}>Items</h2>
            <div style={lineHead}>
              <span>Description</span>
              <span style={{ textAlign: "right" }}>Qty</span>
              <span style={{ textAlign: "right" }}>Rate</span>
              <span style={{ textAlign: "right" }}>Amount</span>
              <span />
            </div>
            {lines.map((l) => {
              const amount = Math.round(toQty(l.qtyText) * toCents(l.rateText));
              return (
                <div key={l.id} style={lineRow}>
                  <input
                    style={input}
                    placeholder="Website build — 5 pages"
                    value={l.description}
                    onChange={(e) => setLine(l.id, { description: e.target.value })}
                  />
                  <input
                    style={{ ...input, textAlign: "right" }}
                    inputMode="decimal"
                    value={l.qtyText}
                    onChange={(e) => setLine(l.id, { qtyText: e.target.value })}
                  />
                  <input
                    style={{ ...input, textAlign: "right" }}
                    inputMode="decimal"
                    placeholder="0.00"
                    value={l.rateText}
                    onChange={(e) => setLine(l.id, { rateText: e.target.value })}
                  />
                  <div style={amountCell}>{fromCents(amount)}</div>
                  <button
                    type="button"
                    style={rowX}
                    title="Remove this line"
                    aria-label="Remove this line"
                    onClick={() => removeLine(l.id)}
                  >
                    ×
                  </button>
                </div>
              );
            })}
            <button type="button" style={addBtn} onClick={addLine}>
              + Add a line
            </button>

            <div style={{ ...row2, marginTop: 18 }}>
              <Field label="Discount label">
                <input
                  style={input}
                  value={discountLabel}
                  onChange={(e) => edit(setDiscountLabel)(e.target.value)}
                />
              </Field>
              <Field label="Discount amount">
                <input
                  style={{ ...input, textAlign: "right" }}
                  inputMode="decimal"
                  placeholder="0.00"
                  value={discountText}
                  onChange={(e) => edit(setDiscountText)(e.target.value)}
                />
              </Field>
            </div>
          </section>

          <section style={panel}>
            <h2 style={panelH}>Terms &amp; notes</h2>
            <Field label="Payment terms">
              <input style={input} value={terms} onChange={(e) => edit(setTerms)(e.target.value)} />
            </Field>
            <Field label="Notes (optional)">
              <textarea
                style={{ ...input, minHeight: 72, resize: "vertical" }}
                placeholder="Thanks — it's a pleasure working with you."
                value={notes}
                onChange={(e) => edit(setNotes)(e.target.value)}
              />
            </Field>
          </section>
        </div>

        {/* ── the document ───────────────────────────────────────────────────────── */}
        <div style={previewCol}>
          <div style={previewLabel}>This is exactly what prints</div>
          <div style={sheetWrap}>
            <InvoiceDoc invoice={draft} issuer={issuer} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "block", marginBottom: 12 }}>
      <span style={lbl}>{label}</span>
      {children}
    </label>
  );
}

const font = "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif";
const page: React.CSSProperties = { maxWidth: 1240, margin: "0 auto", padding: "32px 24px 90px", fontFamily: font };
const head: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 16,
  flexWrap: "wrap",
  marginBottom: 20,
};
const back: React.CSSProperties = { fontSize: 13, color: "var(--e-muted)", textDecoration: "none", fontWeight: 600 };
const h1: React.CSSProperties = { fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em", marginTop: 6 };
const sub: React.CSSProperties = { color: "var(--e-muted)", fontSize: 14, marginTop: 4 };
const cols: React.CSSProperties = { display: "grid", gridTemplateColumns: "minmax(360px,1fr) minmax(380px,1fr)", gap: 28, alignItems: "start" };
const formCol: React.CSSProperties = { display: "grid", gap: 16, minWidth: 0 };
const previewCol: React.CSSProperties = { position: "sticky", top: 24, minWidth: 0 };
const previewLabel: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: ".1em",
  textTransform: "uppercase",
  color: "var(--e-muted)",
  marginBottom: 8,
};
const sheetWrap: React.CSSProperties = {
  background: "var(--e-panel)",
  border: "1px solid var(--e-line)",
  borderRadius: 4,
  padding: "34px 32px",
  boxShadow: "0 1px 3px rgba(0,0,0,.08)",
  maxHeight: "calc(100vh - 100px)",
  overflowY: "auto",
};
const panel: React.CSSProperties = { border: "1px solid var(--e-line)", borderRadius: 12, padding: 18, background: "var(--e-panel)" };
const panelH: React.CSSProperties = { fontSize: 15, fontWeight: 700, marginBottom: 14 };
const panelHeadRow: React.CSSProperties = { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 14 };
const row2: React.CSSProperties = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 };
const lbl: React.CSSProperties = { display: "block", fontSize: 12.5, fontWeight: 600, marginBottom: 5, color: "var(--e-ink)" };
const input: React.CSSProperties = { width: "100%", border: "1px solid var(--e-line)", borderRadius: 8, padding: "8px 11px", fontSize: 14, outline: "none", fontFamily: font, background: "var(--e-panel)" };
const lineHead: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 74px 104px 96px 30px",
  gap: 8,
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: ".06em",
  textTransform: "uppercase",
  color: "var(--e-muted)",
  marginBottom: 6,
};
const lineRow: React.CSSProperties = { display: "grid", gridTemplateColumns: "1fr 74px 104px 96px 30px", gap: 8, alignItems: "center", marginBottom: 8 };
const amountCell: React.CSSProperties = { textAlign: "right", fontSize: 14, fontVariantNumeric: "tabular-nums", color: "var(--e-ink)", paddingRight: 2 };
const rowX: React.CSSProperties = { background: "none", border: "none", color: "var(--e-muted)", fontSize: 20, lineHeight: 1, cursor: "pointer", padding: 0 };
const addBtn: React.CSSProperties = { background: "var(--e-panel)", border: "1px dashed var(--e-line)", borderRadius: 8, padding: "8px 12px", fontSize: 13, fontWeight: 600, color: "var(--e-ink)", cursor: "pointer", width: "100%", marginTop: 2 };
const primaryBtn: React.CSSProperties = { background: "var(--e-ink)", color: "var(--e-panel)", border: "none", borderRadius: 8, padding: "10px 16px", fontSize: 14, fontWeight: 700, cursor: "pointer" };
const ghostBtn: React.CSSProperties = { background: "var(--e-panel)", color: "var(--e-ink)", border: "1px solid var(--e-line)", borderRadius: 8, padding: "10px 16px", fontSize: 14, fontWeight: 600, cursor: "pointer" };
const picker: React.CSSProperties = { border: "1px solid var(--e-line)", borderRadius: 8, padding: "6px 9px", fontSize: 12.5, background: "var(--e-panel)", fontFamily: font };
const saveState: React.CSSProperties = { fontSize: 12.5, color: "var(--e-muted)", fontWeight: 600, minWidth: 96, textAlign: "right" };
const hint: React.CSSProperties = { fontSize: 12.5, color: "var(--e-muted)", marginTop: 2, lineHeight: 1.5 };
const fromSummary: React.CSSProperties = { fontSize: 13, color: "var(--e-ink)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" };
const smallBtn: React.CSSProperties = { background: "var(--e-panel)", border: "1px solid var(--e-line)", borderRadius: 7, padding: "6px 11px", fontSize: 12.5, fontWeight: 600, color: "var(--e-ink)", cursor: "pointer", whiteSpace: "nowrap" };
const errBox: React.CSSProperties = { background: "var(--e-bad-bg)", border: "1px solid var(--e-bad-line)", color: "var(--e-danger)", borderRadius: 8, padding: "9px 12px", fontSize: 13, marginBottom: 16 };
// Amber, not red: nothing is broken, but something on this invoice would go out wrong.
const warnBox: React.CSSProperties = { background: "var(--e-warn-bg)", border: "1px solid var(--e-warn-line)", color: "var(--e-warn-ink)", borderRadius: 8, padding: "10px 12px", fontSize: 13, lineHeight: 1.55, marginBottom: 12 };
const shareBox: React.CSSProperties = { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, border: "1px solid var(--e-line)", borderRadius: 10, padding: "12px 14px", background: "var(--e-panel-2)", flexWrap: "wrap" };
const linkText: React.CSSProperties = { fontSize: 12.5, fontFamily: "ui-monospace,SFMono-Regular,Menlo,Consolas,monospace", color: "var(--e-ink)", overflowWrap: "anywhere" };
const paidRow: React.CSSProperties = { display: "flex", alignItems: "center", gap: 9, marginTop: 16, cursor: "pointer", flexWrap: "wrap" };
const fillBtn: React.CSSProperties = { width: "100%", textAlign: "left", background: "var(--e-panel)", border: "1px dashed var(--e-line)", borderRadius: 8, padding: "9px 12px", fontSize: 12.5, fontWeight: 600, color: "var(--e-ink)", cursor: "pointer", lineHeight: 1.5, marginBottom: 12, fontFamily: font };
