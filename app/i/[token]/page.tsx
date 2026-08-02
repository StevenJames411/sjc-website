// THE CUSTOMER'S COPY of an invoice — the one page in this app with no login.
//
// This is what gets emailed. Not a PDF attachment: the whole point is that the Pay button is on
// it, and a buy button is a <script> embed, which every email client strips. So he sends a link.
//
// ── WHAT MAKES IT SAFE TO BE PUBLIC ───────────────────────────────────────────────────────────
// The URL is /i/<publicId>, where publicId is 128 random bits minted per invoice (lib/invoices.ts).
// It is NOT the invoice id, which is short and appears in the owner's address bar. Nothing here
// lists, searches or enumerates: one token in, one document out, and a token that doesn't match
// gets the same 404 as a token that never existed. There is no way to walk from one invoice to
// another, and the page carries `noindex` so a forwarded link can't end up in a search result.
//
// It renders the same <InvoiceDoc> as the editor preview and the print page. Three surfaces, one
// component — a customer's copy that differs from the printed one is a document dispute.
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { findInvoiceByPublicId, readIssuer } from "@/lib/invoices";
import { EMPTY_ISSUER, isPayable, money, prettyDate, totals } from "@/lib/invoicesShared";
import InvoiceDoc from "@/components/edit/InvoiceDoc";
import PayButton from "@/components/PayButton";

export const dynamic = "force-dynamic";

// Belt and braces alongside the unguessable token: a customer forwards this to his bookkeeper,
// and a crawler that finds it in a mailbox preview must not index someone's billing address.
export const metadata: Metadata = {
  title: "Invoice",
  robots: { index: false, follow: false, nocache: true },
};

export default async function PublicInvoicePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const invoice = await findInvoiceByPublicId(token);
  if (!invoice) notFound();

  // The snapshot first: this document must render as it was sent, even if the template changed.
  // Only an invoice written before snapshots existed falls through to the current details.
  const issuer = invoice.from ?? (await readIssuer());
  const t = totals(invoice);
  const paid = Boolean(invoice.paidOn);
  const canPay = !paid && isPayable(invoice.pay);

  return (
    <main style={page}>
      {/* A real stylesheet, not inline styles, because the layout needs a media query and an
          inline style can't hold one. Two columns on a desktop so the Pay button is on screen
          WITHOUT scrolling past the document; one column on a phone, invoice first. */}
      <style>{css}</style>

      <div style={shell}>
        <header style={brandBar}>
          <div style={brandName}>{issuer.dba || issuer.businessName || "Invoice"}</div>
          <div style={brandMeta}>
            {invoice.number}
            {invoice.dueOn && !paid ? ` · due ${prettyDate(invoice.dueOn)}` : ""}
          </div>
        </header>

        {paid ? (
          <div style={paidBanner}>
            <strong>Paid</strong> — {prettyDate(invoice.paidOn as string)}. Thank you.
          </div>
        ) : null}

        <div className="inv-cols">
          <div style={sheetWrap}>
            <InvoiceDoc invoice={invoice} issuer={issuer} />
          </div>

          {/* Sticky, so it stays put while a long invoice scrolls past it. */}
          <aside className="inv-side">
            {canPay ? (
              <section style={payPanel}>
                <div style={payHead}>
                  <div style={payLbl}>Pay this invoice</div>
                  <div style={payAmount}>{money(t.totalCents)}</div>
                </div>
                <PayButton
                  buttonId={(invoice.pay as { buttonId: string }).buttonId}
                  publishableKey={(invoice.pay as { publishableKey: string }).publishableKey}
                />
                <p style={payNote}>
                  Secure checkout by Stripe. Card details are entered on Stripe&rsquo;s page and
                  never touch this one.
                </p>
              </section>
            ) : !paid ? (
              // No button on this invoice. Say so plainly rather than showing an empty panel — the
              // other payment methods are already printed on the document itself.
              <section style={payPanel}>
                <div style={payLbl}>How to pay</div>
                <p style={payNote}>
                  Use the payment details on the invoice, or reply to
                  {issuer.email ? ` ${issuer.email}` : " the email this came from"}.
                </p>
              </section>
            ) : null}
          </aside>
        </div>

        <footer style={foot}>
          {(issuer.businessName || EMPTY_ISSUER.businessName) && (
            <span>{issuer.businessName}</span>
          )}
          {issuer.email ? <span> · {issuer.email}</span> : null}
          {issuer.phone ? <span> · {issuer.phone}</span> : null}
        </footer>
      </div>
    </main>
  );
}

// 340px is the width Stripe's own button card wants; below ~880 there isn't room for both, so it
// stacks — document first, then the button, which is the order a phone should read anyway.
const css = `
.inv-cols { display: grid; gap: 16px; align-items: start; }
.inv-side { min-width: 0; }
@media (min-width: 880px) {
  .inv-cols { grid-template-columns: minmax(0, 1fr) 340px; gap: 20px; }
  .inv-side { position: sticky; top: 24px; }
}
`;

const font = "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif";
const page: React.CSSProperties = {
  minHeight: "100vh",
  background: "#f3f4f6",
  padding: "32px 16px 64px",
  fontFamily: font,
};
// Wide enough for the document plus the Pay column beside it, and no wider — a line of body text
// that runs the full width of a monitor stops being readable.
const shell: React.CSSProperties = { maxWidth: 1120, margin: "0 auto" };
const brandBar: React.CSSProperties = {
  display: "flex",
  alignItems: "baseline",
  justifyContent: "space-between",
  gap: 16,
  flexWrap: "wrap",
  marginBottom: 14,
};
const brandName: React.CSSProperties = { fontSize: 18, fontWeight: 800, letterSpacing: "-0.01em", color: "#111827" };
const brandMeta: React.CSSProperties = { fontSize: 13, color: "#6b7280", fontWeight: 600 };
const paidBanner: React.CSSProperties = {
  background: "#ecfdf5",
  border: "1px solid #a7f3d0",
  color: "#065f46",
  borderRadius: 10,
  padding: "11px 14px",
  fontSize: 14,
  marginBottom: 14,
};
// The document sits on white with real margins, the way it prints. A customer comparing this page
// to the PDF you also sent should not be able to tell them apart.
const sheetWrap: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 10,
  padding: "38px 34px",
  boxShadow: "0 1px 3px rgba(0,0,0,.07)",
};
const payPanel: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 10,
  padding: "20px 22px",
  boxShadow: "0 1px 3px rgba(0,0,0,.07)",
};
const payHead: React.CSSProperties = {
  display: "flex",
  alignItems: "baseline",
  justifyContent: "space-between",
  gap: 12,
  marginBottom: 14,
};
const payLbl: React.CSSProperties = { fontSize: 15, fontWeight: 700, color: "#111827" };
const payAmount: React.CSSProperties = {
  fontSize: 20,
  fontWeight: 800,
  fontVariantNumeric: "tabular-nums",
  letterSpacing: "-0.01em",
};
const payNote: React.CSSProperties = { fontSize: 12.5, color: "#6b7280", marginTop: 12, lineHeight: 1.5 };
const foot: React.CSSProperties = { fontSize: 12, color: "#9ca3af", marginTop: 22, textAlign: "center" };
