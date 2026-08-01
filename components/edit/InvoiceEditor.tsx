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
  mintLineId,
  toCents,
  toQty,
  totals,
  type Invoice,
  type IssuerDetails,
} from "@/lib/invoicesShared";
import type { Site } from "@/lib/sitesShared";

type EditLine = { id: string; description: string; qtyText: string; rateText: string };

const qtyToText = (n: number) => (Number.isInteger(n) ? String(n) : String(Number(n.toFixed(3))));

export default function InvoiceEditor({
  invoice,
  issuer,
  sites,
}: {
  invoice: Invoice;
  issuer: IssuerDetails;
  sites: Site[];
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
      lines: lines.map((l) => ({
        id: l.id,
        description: l.description,
        qty: toQty(l.qtyText),
        rateCents: toCents(l.rateText),
      })),
    }),
    [invoice, number, issuedOn, dueOn, billTo, terms, notes, discountLabel, discountText, lines]
  );

  const t = totals(draft);

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
        }),
      });
      const body = await res.json();
      // The store's save guard can REFUSE a write and still return 200-shaped JSON, so the flag
      // is what's checked — not res.ok, and never nothing at all.
      if (!body?.ok) throw new Error(body?.error || "Couldn't save.");
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
            <p style={hint}>
              Your business name, DBA and payment details come from{" "}
              <a href="/edit/invoices" style={link}>
                Your details
              </a>{" "}
              and appear on every invoice.
            </p>
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
const back: React.CSSProperties = { fontSize: 13, color: "#6b7280", textDecoration: "none", fontWeight: 600 };
const h1: React.CSSProperties = { fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em", marginTop: 6 };
const sub: React.CSSProperties = { color: "#6b7280", fontSize: 14, marginTop: 4 };
const cols: React.CSSProperties = { display: "grid", gridTemplateColumns: "minmax(360px,1fr) minmax(380px,1fr)", gap: 28, alignItems: "start" };
const formCol: React.CSSProperties = { display: "grid", gap: 16, minWidth: 0 };
const previewCol: React.CSSProperties = { position: "sticky", top: 24, minWidth: 0 };
const previewLabel: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: ".1em",
  textTransform: "uppercase",
  color: "#9ca3af",
  marginBottom: 8,
};
const sheetWrap: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 4,
  padding: "34px 32px",
  boxShadow: "0 1px 3px rgba(0,0,0,.08)",
  maxHeight: "calc(100vh - 100px)",
  overflowY: "auto",
};
const panel: React.CSSProperties = { border: "1px solid #e5e7eb", borderRadius: 12, padding: 18, background: "#fff" };
const panelH: React.CSSProperties = { fontSize: 15, fontWeight: 700, marginBottom: 14 };
const panelHeadRow: React.CSSProperties = { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 14 };
const row2: React.CSSProperties = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 };
const lbl: React.CSSProperties = { display: "block", fontSize: 12.5, fontWeight: 600, marginBottom: 5, color: "#374151" };
const input: React.CSSProperties = { width: "100%", border: "1px solid #d1d5db", borderRadius: 8, padding: "8px 11px", fontSize: 14, outline: "none", fontFamily: font, background: "#fff" };
const lineHead: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 74px 104px 96px 30px",
  gap: 8,
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: ".06em",
  textTransform: "uppercase",
  color: "#9ca3af",
  marginBottom: 6,
};
const lineRow: React.CSSProperties = { display: "grid", gridTemplateColumns: "1fr 74px 104px 96px 30px", gap: 8, alignItems: "center", marginBottom: 8 };
const amountCell: React.CSSProperties = { textAlign: "right", fontSize: 14, fontVariantNumeric: "tabular-nums", color: "#111827", paddingRight: 2 };
const rowX: React.CSSProperties = { background: "none", border: "none", color: "#9ca3af", fontSize: 20, lineHeight: 1, cursor: "pointer", padding: 0 };
const addBtn: React.CSSProperties = { background: "#fff", border: "1px dashed #d1d5db", borderRadius: 8, padding: "8px 12px", fontSize: 13, fontWeight: 600, color: "#374151", cursor: "pointer", width: "100%", marginTop: 2 };
const primaryBtn: React.CSSProperties = { background: "#111827", color: "#fff", border: "none", borderRadius: 8, padding: "10px 16px", fontSize: 14, fontWeight: 700, cursor: "pointer" };
const ghostBtn: React.CSSProperties = { background: "#fff", color: "#111827", border: "1px solid #d1d5db", borderRadius: 8, padding: "10px 16px", fontSize: 14, fontWeight: 600, cursor: "pointer" };
const picker: React.CSSProperties = { border: "1px solid #d1d5db", borderRadius: 8, padding: "6px 9px", fontSize: 12.5, background: "#fff", fontFamily: font };
const saveState: React.CSSProperties = { fontSize: 12.5, color: "#6b7280", fontWeight: 600, minWidth: 96, textAlign: "right" };
const hint: React.CSSProperties = { fontSize: 12.5, color: "#6b7280", marginTop: 2, lineHeight: 1.5 };
const link: React.CSSProperties = { color: "#2563eb", fontWeight: 600 };
const errBox: React.CSSProperties = { background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c", borderRadius: 8, padding: "9px 12px", fontSize: 13, marginBottom: 16 };
