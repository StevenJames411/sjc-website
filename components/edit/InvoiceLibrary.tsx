"use client";
// The invoice book — every invoice on a card, the way the websites and the forms are.
//
// Newest first, because this list is read from the top: the question is almost always "what did I
// send last?" or "bill this one again". Hence Duplicate on every card — the $25/mo retainers are
// the same invoice every month with two dates moved, and re-typing one is how a wrong amount gets
// onto a document.
//
// There is deliberately no paid/unpaid state here. See the note in lib/invoices.ts: the moment
// this tracks money owed it stops being a document generator and becomes bookkeeping that has to
// be right.
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  fromCents,
  prettyDate,
  totals,
  EMPTY_ISSUER,
  type Invoice,
  type IssuerDetails,
  type PaymentPackage,
} from "@/lib/invoicesShared";
import InvoicePackages from "./InvoicePackages";

export default function InvoiceLibrary({
  invoices,
  issuer,
  packages,
  title,
}: {
  invoices: Invoice[];
  issuer: IssuerDetails;
  packages: PaymentPackage[];
  title: string;
}) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [confirming, setConfirming] = useState("");

  // Closed by default. Your details are editable on the invoice itself now, which is where you
  // actually are when you notice something is wrong with them — this panel only sets what NEW
  // invoices start with. It used to open by itself when empty, and that made this page look like
  // the invoice form with the wrong fields on it.
  const [openDetails, setOpenDetails] = useState(false);
  // Same reasoning: set once when a button is minted, then never touched again for months.
  const [openPackages, setOpenPackages] = useState(false);
  const [d, setD] = useState<IssuerDetails>({ ...EMPTY_ISSUER, ...issuer });
  const [dDirty, setDDirty] = useState(false);
  const [dSaved, setDSaved] = useState(false);

  const shown = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return invoices;
    return invoices.filter((i) =>
      [i.number, i.billTo.name, i.billTo.email, ...i.lines.map((l) => l.description)]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(t)
    );
  }, [invoices, q]);

  async function create(from?: string) {
    setBusy(true);
    setErr("");
    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(from ? { from } : {}),
      });
      const body = await res.json();
      if (!body?.ok) throw new Error(body?.error || "Couldn't create it.");
      router.push(`/edit/invoices/${body.id}`);
    } catch (e) {
      setErr((e as Error).message);
      setBusy(false);
    }
  }

  async function remove(id: string) {
    setBusy(true);
    setErr("");
    try {
      const res = await fetch("/api/invoices", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ id }),
      });
      const body = await res.json();
      if (!body?.ok) throw new Error(body?.error || "Couldn't delete it.");
      setConfirming("");
      router.refresh();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function saveDetails() {
    setBusy(true);
    setErr("");
    try {
      const res = await fetch("/api/invoices", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ issuer: d }),
      });
      const body = await res.json();
      if (!body?.ok) throw new Error(body?.error || "Couldn't save.");
      setDDirty(false);
      setDSaved(true);
      router.refresh();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const setField = (k: keyof IssuerDetails) => (v: string) => {
    setD({ ...d, [k]: v });
    setDDirty(true);
    setDSaved(false);
  };

  return (
    <div style={page}>
      <div style={head}>
        <div>
          {/* "← Websites" lived here until the rail took over global navigation. */}
          <h1 style={h1}>{title}</h1>
          <p style={sub}>Fill one in, print it to PDF, send it.</p>
        </div>
        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          <button type="button" style={navBtn} onClick={() => setOpenPackages((v) => !v)}>
            Packages
          </button>
          <button type="button" style={navBtn} onClick={() => setOpenDetails((v) => !v)}>
            Your details
          </button>
          <button type="button" style={primaryBtn} onClick={() => create()} disabled={busy}>
            + New invoice
          </button>
        </div>
      </div>

      {err ? <p style={errBox}>{err}</p> : null}

      {openPackages ? <InvoicePackages packages={packages} /> : null}

      {openDetails ? (
        <section style={detailsPanel}>
          <div style={panelHeadRow}>
            <div>
              <h2 style={panelH}>Your details</h2>
              <p style={hint}>
                What every <strong>new</strong> invoice starts with. Each invoice keeps its own
                copy, so changing these never rewrites one you already sent.
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={saveState}>{dDirty ? "Unsaved" : dSaved ? "Saved" : ""}</span>
              <button type="button" style={ghostBtn} onClick={saveDetails} disabled={busy || !dDirty}>
                Save
              </button>
            </div>
          </div>

          <div style={row2}>
            <Field label="Business name (the legal entity)">
              <input
                style={input}
                placeholder="Steven James Consulting LLC"
                value={d.businessName}
                onChange={(e) => setField("businessName")(e.target.value)}
              />
            </Field>
            {/* Two fields, not one: the cheque is written to the entity, the customer recognises
                the trading name, and an invoice showing only one of them looks wrong to whoever
                pays it. */}
            <Field label="DBA / trading name">
              <input
                style={input}
                placeholder="Steven James Designs"
                value={d.dba}
                onChange={(e) => setField("dba")(e.target.value)}
              />
            </Field>
          </div>
          <div style={row2}>
            <Field label="Email">
              <input style={input} value={d.email} onChange={(e) => setField("email")(e.target.value)} />
            </Field>
            <Field label="Phone">
              <input style={input} value={d.phone} onChange={(e) => setField("phone")(e.target.value)} />
            </Field>
          </div>
          <Field label="Address">
            <textarea
              style={{ ...input, minHeight: 62, resize: "vertical" }}
              value={d.address}
              onChange={(e) => setField("address")(e.target.value)}
            />
          </Field>
          <div style={row2}>
            <Field label="Default payment terms">
              <input
                style={input}
                placeholder="Payment due within 14 days."
                value={d.terms}
                onChange={(e) => setField("terms")(e.target.value)}
              />
            </Field>
            <Field label="How to pay">
              <textarea
                style={{ ...input, minHeight: 62, resize: "vertical" }}
                placeholder="Zelle to steven@… · cheques payable to Steven James Consulting LLC"
                value={d.payTo}
                onChange={(e) => setField("payTo")(e.target.value)}
              />
            </Field>
          </div>
        </section>
      ) : null}

      {invoices.length ? (
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search invoices…"
          style={search}
        />
      ) : null}

      <div style={grid}>
        {shown.map((inv) => {
          const t = totals(inv);
          return (
            <div key={inv.id} style={card}>
              <div style={cardTop}>
                <div style={badgeRow}>
                  <span style={chip}>{inv.number}</span>
                  <span style={chipMuted}>{prettyDate(inv.issuedOn)}</span>
                </div>
                <h2 style={cardName}>{inv.billTo.name || "No customer yet"}</h2>
                <div style={amount}>${fromCents(t.totalCents)}</div>
                {inv.lines.filter((l) => l.description.trim()).length ? (
                  <p style={cardDesc}>
                    {inv.lines
                      .filter((l) => l.description.trim())
                      .map((l) => l.description)
                      .join(" · ")}
                  </p>
                ) : null}
              </div>

              {confirming === inv.id ? (
                <div style={delPanel}>
                  <p style={delWarn}>
                    Delete <strong>{inv.number}</strong>? This one isn&rsquo;t recoverable.
                  </p>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button type="button" style={{ ...ghostBtn, flex: 1 }} onClick={() => setConfirming("")}>
                      Keep it
                    </button>
                    <button
                      type="button"
                      style={{ ...dangerBtn, flex: 1 }}
                      disabled={busy}
                      onClick={() => remove(inv.id)}
                    >
                      Delete it
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    type="button"
                    style={{ ...primaryBtn, flex: 1 }}
                    onClick={() => router.push(`/edit/invoices/${inv.id}`)}
                  >
                    Open
                  </button>
                  <button
                    type="button"
                    style={iconBtn}
                    title="Bill this again — a new invoice with a fresh number and today's dates"
                    disabled={busy}
                    onClick={() => create(inv.id)}
                  >
                    ⧉
                  </button>
                  <a
                    href={`/edit/invoices/${inv.id}/print`}
                    style={{ ...iconBtn, textDecoration: "none", display: "grid", placeItems: "center" }}
                    title="Print / save as PDF"
                  >
                    ⎙
                  </a>
                  <button
                    type="button"
                    style={trashBtn}
                    title={`Delete ${inv.number}`}
                    onClick={() => setConfirming(inv.id)}
                  >
                    🗑
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!shown.length ? (
        <p style={empty}>
          {q ? "No invoices match that." : "No invoices yet — make the first one."}
        </p>
      ) : null}
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
const page: React.CSSProperties = { maxWidth: 1100, margin: "0 auto", padding: "40px 24px 80px", fontFamily: font };
const head: React.CSSProperties = { display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" };
const back: React.CSSProperties = { fontSize: 13, color: "var(--e-muted)", textDecoration: "none", fontWeight: 600 };
const h1: React.CSSProperties = { fontSize: 32, fontWeight: 800, letterSpacing: "-0.02em", marginTop: 6 };
const sub: React.CSSProperties = { color: "var(--e-muted)", fontSize: 14, marginTop: 4 };
const search: React.CSSProperties = { width: "100%", maxWidth: 340, margin: "24px 0", border: "1px solid var(--e-line)", borderRadius: 8, padding: "9px 12px", fontSize: 14, outline: "none" };
const grid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 16, marginTop: 24 };
const card: React.CSSProperties = { border: "1px solid var(--e-line)", borderRadius: 12, padding: 18, display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 16, minHeight: 180, background: "var(--e-panel)" };
const cardTop: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 6 };
const badgeRow: React.CSSProperties = { display: "flex", gap: 6, flexWrap: "wrap" };
const chip: React.CSSProperties = { fontSize: 11, fontWeight: 700, background: "var(--e-info-bg)", color: "var(--e-info-ink)", borderRadius: 999, padding: "3px 9px" };
const chipMuted: React.CSSProperties = { ...chip, background: "var(--e-line-soft)", color: "var(--e-muted)" };
const cardName: React.CSSProperties = { fontSize: 17, fontWeight: 700, lineHeight: 1.25 };
const amount: React.CSSProperties = { fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums" };
const cardDesc: React.CSSProperties = { fontSize: 12.5, color: "var(--e-muted)", lineHeight: 1.45, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" };
const primaryBtn: React.CSSProperties = { background: "var(--e-ink)", color: "var(--e-panel)", border: "none", borderRadius: 8, padding: "10px 16px", fontSize: 14, fontWeight: 700, cursor: "pointer" };
const navBtn: React.CSSProperties = { background: "var(--e-panel)", color: "var(--e-ink)", border: "1px solid var(--e-line)", borderRadius: 8, padding: "10px 16px", fontSize: 14, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" };
const ghostBtn: React.CSSProperties = { ...navBtn };
const iconBtn: React.CSSProperties = { ...navBtn, padding: "10px 13px", fontSize: 15, lineHeight: 1, color: "var(--e-ink)" };
const trashBtn: React.CSSProperties = { ...iconBtn, color: "var(--e-danger)" };
const dangerBtn: React.CSSProperties = { background: "var(--e-danger)", color: "var(--e-panel)", border: "1px solid var(--e-danger)", borderRadius: 8, padding: "10px 16px", fontSize: 14, fontWeight: 700, cursor: "pointer" };
const detailsPanel: React.CSSProperties = { border: "1px solid var(--e-line)", borderRadius: 12, padding: 20, background: "var(--e-panel)", marginTop: 24 };
const panelHeadRow: React.CSSProperties = { display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 16, flexWrap: "wrap" };
const panelH: React.CSSProperties = { fontSize: 16, fontWeight: 700 };
const row2: React.CSSProperties = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 };
const lbl: React.CSSProperties = { display: "block", fontSize: 12.5, fontWeight: 600, marginBottom: 5, color: "var(--e-ink)" };
const input: React.CSSProperties = { width: "100%", border: "1px solid var(--e-line)", borderRadius: 8, padding: "8px 11px", fontSize: 14, outline: "none", fontFamily: font, background: "var(--e-panel)" };
const hint: React.CSSProperties = { fontSize: 12.5, color: "var(--e-muted)", marginTop: 3 };
const saveState: React.CSSProperties = { fontSize: 12.5, color: "var(--e-muted)", fontWeight: 600 };
const delPanel: React.CSSProperties = { border: "1px solid var(--e-bad-line)", background: "var(--e-bad-bg)", borderRadius: 10, padding: 12, display: "grid", gap: 10 };
const delWarn: React.CSSProperties = { margin: 0, fontSize: 13, lineHeight: 1.45, color: "var(--e-bad-ink)" };
const errBox: React.CSSProperties = { background: "var(--e-bad-bg)", border: "1px solid var(--e-bad-line)", color: "var(--e-danger)", borderRadius: 8, padding: "9px 12px", fontSize: 13, marginTop: 16 };
const empty: React.CSSProperties = { color: "var(--e-muted)", fontSize: 14, marginTop: 24 };
