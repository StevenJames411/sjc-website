// THE DOCUMENT. One component, rendered in two places: the live preview beside the editor, and
// the print page that becomes the PDF. That is the whole reason it exists as its own file — a
// preview that is "close to" what prints is worse than no preview, because it teaches you to
// trust it and then surprises you on the page a customer reads.
//
// No "use client": it's pure presentation with no state, so the client-side editor and the
// server-rendered print route can both use it.
//
// Deliberately plain. This is a business document, not a web page: black on white, one accent
// weight, real margins, and nothing that depends on a colour printer or a background graphic —
// browsers strip backgrounds when printing unless you fight them, and a design that needs the
// fight is the wrong design.
import {
  fromCents,
  lineTotalCents,
  prettyDate,
  totals,
  type Invoice,
  type IssuerDetails,
} from "@/lib/invoicesShared";

export default function InvoiceDoc({
  invoice,
  issuer,
}: {
  invoice: Invoice;
  issuer: IssuerDetails;
}) {
  const t = totals(invoice);
  // Blank rows are normal while typing; they must not print as empty ruled lines.
  const lines = invoice.lines.filter(
    (l) => l.description.trim() || l.rateCents || lineTotalCents(l)
  );

  return (
    <div style={sheet} className="invoice-sheet">
      <header style={topRow}>
        <div>
          {issuer.businessName ? <div style={bizName}>{issuer.businessName}</div> : null}
          {/* The DBA prints directly under the legal name and is never a substitute for it: the
              cheque has to be made out to the entity, the customer only recognises the trade
              name, and an invoice showing one without the other looks wrong to whoever pays. */}
          {issuer.dba ? <div style={bizDba}>dba {issuer.dba}</div> : null}
          <div style={bizMeta}>
            {issuer.address ? <div style={preLine}>{issuer.address}</div> : null}
            {issuer.email ? <div>{issuer.email}</div> : null}
            {issuer.phone ? <div>{issuer.phone}</div> : null}
          </div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={invWord}>Invoice</div>
          <div style={invNum}>{invoice.number}</div>
          <table style={dateTable}>
            <tbody>
              <tr>
                <td style={dateLbl}>Issued</td>
                <td style={dateVal}>{prettyDate(invoice.issuedOn)}</td>
              </tr>
              {invoice.dueOn ? (
                <tr>
                  <td style={dateLbl}>Due</td>
                  <td style={dateVal}>{prettyDate(invoice.dueOn)}</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </header>

      <section style={billBlock}>
        <div style={billLabel}>Bill to</div>
        <div style={billName}>{invoice.billTo.name || "—"}</div>
        {invoice.billTo.attn ? <div style={billLine}>Attn: {invoice.billTo.attn}</div> : null}
        {invoice.billTo.address ? (
          <div style={{ ...billLine, ...preLine }}>{invoice.billTo.address}</div>
        ) : null}
        {invoice.billTo.email ? <div style={billLine}>{invoice.billTo.email}</div> : null}
      </section>

      <table style={table}>
        <thead>
          <tr>
            <th style={{ ...th, textAlign: "left" }}>Description</th>
            <th style={{ ...th, ...numCol, width: 70 }}>Qty</th>
            <th style={{ ...th, ...numCol, width: 110 }}>Rate</th>
            <th style={{ ...th, ...numCol, width: 120 }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {lines.length ? (
            lines.map((l) => (
              <tr key={l.id}>
                <td style={{ ...td, ...preLine }}>{l.description}</td>
                <td style={{ ...td, ...numCol }}>{formatQty(l.qty)}</td>
                <td style={{ ...td, ...numCol }}>{fromCents(l.rateCents)}</td>
                <td style={{ ...td, ...numCol }}>{fromCents(lineTotalCents(l))}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td style={{ ...td, color: "#9ca3af" }} colSpan={4}>
                No items yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <div style={totalsWrap}>
        <table style={totalsTable}>
          <tbody>
            <tr>
              <td style={totLbl}>Subtotal</td>
              <td style={totVal}>{fromCents(t.subtotalCents)}</td>
            </tr>
            {t.discountCents ? (
              <tr>
                <td style={totLbl}>{invoice.discountLabel || "Discount"}</td>
                <td style={totVal}>−{fromCents(t.discountCents)}</td>
              </tr>
            ) : null}
            <tr>
              <td style={grandLbl}>Total due</td>
              <td style={grandVal}>${fromCents(t.totalCents)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {invoice.terms || issuer.payTo || invoice.notes ? (
        <footer style={foot}>
          {invoice.terms ? <div style={{ ...footLine, fontWeight: 600 }}>{invoice.terms}</div> : null}
          {issuer.payTo ? <div style={{ ...footLine, ...preLine }}>{issuer.payTo}</div> : null}
          {invoice.notes ? <div style={{ ...footNote, ...preLine }}>{invoice.notes}</div> : null}
        </footer>
      ) : null}
    </div>
  );
}

/** 1 stays "1"; 1.5 stays "1.5". Trailing zeros on a quantity read like a units mistake. */
function formatQty(qty: number): string {
  const n = Number.isFinite(qty) ? qty : 0;
  return Number.isInteger(n) ? String(n) : String(Number(n.toFixed(3)));
}

// Serif for the body: an invoice is read as a document, and the whole page is set at a size that
// survives being printed and scanned back.
const font = "'Times New Roman', Times, serif";
const sans = "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif";
const ink = "#111827";
const rule = "#d1d5db";

const sheet: React.CSSProperties = {
  fontFamily: font,
  color: ink,
  background: "#fff",
  fontSize: 14,
  lineHeight: 1.5,
};
const topRow: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 32,
  paddingBottom: 20,
  borderBottom: `2px solid ${ink}`,
};
const bizName: React.CSSProperties = { fontSize: 20, fontWeight: 700, lineHeight: 1.2 };
const bizDba: React.CSSProperties = { fontSize: 14, fontStyle: "italic", marginTop: 1 };
const bizMeta: React.CSSProperties = { fontSize: 12.5, marginTop: 8, color: "#374151" };
const preLine: React.CSSProperties = { whiteSpace: "pre-line" };
const invWord: React.CSSProperties = {
  fontFamily: sans,
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: ".18em",
  textTransform: "uppercase",
  color: "#6b7280",
};
const invNum: React.CSSProperties = { fontSize: 20, fontWeight: 700, marginTop: 2 };
const dateTable: React.CSSProperties = { marginTop: 10, marginLeft: "auto", borderCollapse: "collapse" };
const dateLbl: React.CSSProperties = { fontSize: 12, color: "#6b7280", paddingRight: 10, textAlign: "right" };
const dateVal: React.CSSProperties = { fontSize: 12.5, textAlign: "right", whiteSpace: "nowrap" };

const billBlock: React.CSSProperties = { marginTop: 22 };
const billLabel: React.CSSProperties = {
  fontFamily: sans,
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: ".14em",
  textTransform: "uppercase",
  color: "#6b7280",
  marginBottom: 4,
};
const billName: React.CSSProperties = { fontSize: 15, fontWeight: 700 };
const billLine: React.CSSProperties = { fontSize: 13, color: "#374151" };

const table: React.CSSProperties = { width: "100%", borderCollapse: "collapse", marginTop: 26 };
const th: React.CSSProperties = {
  fontFamily: sans,
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: ".12em",
  textTransform: "uppercase",
  color: "#6b7280",
  padding: "0 0 7px",
  borderBottom: `1px solid ${ink}`,
};
const td: React.CSSProperties = { padding: "9px 0", borderBottom: `1px solid ${rule}`, verticalAlign: "top" };
// Tabular figures so the decimal points line up down the column — without this the amounts
// wander and the arithmetic looks wrong even when it isn't.
const numCol: React.CSSProperties = {
  textAlign: "right",
  fontVariantNumeric: "tabular-nums",
  whiteSpace: "nowrap",
  paddingLeft: 14,
};

const totalsWrap: React.CSSProperties = { display: "flex", justifyContent: "flex-end", marginTop: 14 };
const totalsTable: React.CSSProperties = { borderCollapse: "collapse", minWidth: 260 };
const totLbl: React.CSSProperties = { padding: "4px 16px 4px 0", fontSize: 13, color: "#374151" };
const totVal: React.CSSProperties = {
  padding: "4px 0",
  fontSize: 13,
  textAlign: "right",
  fontVariantNumeric: "tabular-nums",
};
const grandLbl: React.CSSProperties = {
  padding: "10px 16px 0 0",
  fontSize: 15,
  fontWeight: 700,
  borderTop: `2px solid ${ink}`,
};
const grandVal: React.CSSProperties = {
  padding: "10px 0 0",
  fontSize: 17,
  fontWeight: 700,
  textAlign: "right",
  borderTop: `2px solid ${ink}`,
  fontVariantNumeric: "tabular-nums",
};

const foot: React.CSSProperties = { marginTop: 34, paddingTop: 14, borderTop: `1px solid ${rule}`, fontSize: 12.5 };
const footLine: React.CSSProperties = { marginBottom: 4 };
const footNote: React.CSSProperties = { marginTop: 10, color: "#374151" };
