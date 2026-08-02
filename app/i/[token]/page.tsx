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
// The dark chrome around it is <BrandShell>, shared with the onboarding questionnaire. The invoice
// itself stays a white sheet in the middle, because that part has to read as a business record and
// print like one — the shell's print rules drop the furniture and leave the document.
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { findInvoiceByPublicId, readIssuer } from "@/lib/invoices";
import { isPayable, money, prettyDate, totals } from "@/lib/invoicesShared";
import BrandShell from "@/components/BrandShell";
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
    <BrandShell
      brand="designs"
      // The DBA as it was SNAPSHOTTED on this invoice, not the brand's own name — this page must
      // never advertise details the document itself doesn't carry.
      name={issuer.dba || issuer.businessName || undefined}
      legalName={issuer.businessName || undefined}
      phone={issuer.phone || undefined}
      email={issuer.email || undefined}
      pill={`${invoice.number}${invoice.dueOn && !paid ? ` · due ${prettyDate(invoice.dueOn)}` : ""}`}
      heading={paid ? "Your receipt" : "Your invoice"}
      sub={
        paid
          ? `Paid ${prettyDate(invoice.paidOn as string)}. Thank you — keep this for your records.`
          : `Prepared for ${invoice.billTo.name || "you"}. Review it below and pay by card when you're ready.`
      }
    >
      <style>{css}</style>

      <div className="inv-cols">
        <div className="inv-sheet">
          <InvoiceDoc invoice={invoice} issuer={issuer} />
        </div>

        {/* Sticky, so it stays put while a long invoice scrolls past it. */}
        <aside className="inv-side">
          {canPay ? (
            <section className="pay-card">
              <div className="pay-head">
                <span className="pay-lbl">Pay this invoice</span>
                <span className="pay-amt">{money(t.totalCents)}</span>
              </div>
              <PayButton
                buttonId={(invoice.pay as { buttonId: string }).buttonId}
                publishableKey={(invoice.pay as { publishableKey: string }).publishableKey}
              />
              <p className="pay-note">
                Secure checkout by Stripe. Card details are entered on Stripe&rsquo;s page and never
                touch this one.
              </p>
            </section>
          ) : paid ? (
            <section className="pay-card pay-done">
              <div className="pay-tick" aria-hidden>
                ✓
              </div>
              <div className="pay-lbl">Paid in full</div>
              <p className="pay-note">
                {prettyDate(invoice.paidOn as string)} · {money(t.totalCents)}
              </p>
            </section>
          ) : (
            // No button on this invoice. Say so plainly rather than showing an empty panel — the
            // other ways to pay are already printed on the document itself.
            <section className="pay-card">
              <div className="pay-lbl">How to pay</div>
              <p className="pay-note">
                Use the payment details on the invoice, or reply to
                {issuer.email ? ` ${issuer.email}` : " the email this came from"}.
              </p>
            </section>
          )}
        </aside>
      </div>
    </BrandShell>
  );
}

const css = `
.inv-cols { display: grid; gap: 18px; align-items: start; }
.inv-side { min-width: 0; display: grid; gap: 12px; }
.inv-sheet {
  background: #fff; border-radius: 14px; padding: 38px 34px;
  box-shadow: 0 18px 46px rgba(0,0,0,.34);
}
/* 348px is the width Stripe's own button card wants; below ~900 there isn't room for both, so it
   stacks — document first, then the button, which is the order a phone should read anyway. */
@media (min-width: 900px) {
  .inv-cols { grid-template-columns: minmax(0,1fr) 348px; gap: 22px; }
  .inv-side { position: sticky; top: 92px; }
}

.pay-card {
  background: #fff; border-radius: 14px; padding: 20px 20px 18px;
  box-shadow: 0 18px 46px rgba(0,0,0,.34);
}
.pay-head { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; margin-bottom: 14px; }
.pay-lbl { font-size: 15px; font-weight: 700; color: #0f172a; }
.pay-amt { font-size: 21px; font-weight: 800; color: #0f172a; font-variant-numeric: tabular-nums; letter-spacing: -.02em; }
.pay-note { font-size: 12.5px; color: #64748b; line-height: 1.55; margin: 12px 0 0; }
.pay-done { text-align: center; }
.pay-tick {
  width: 44px; height: 44px; border-radius: 50%; margin: 2px auto 10px;
  display: grid; place-items: center; font-size: 22px; font-weight: 700;
  background: #ecfdf5; color: #047857;
}

/* The Pay column is not part of the document, so it never prints. */
@media print {
  .inv-side { display: none !important; }
  .inv-sheet { box-shadow: none !important; border-radius: 0 !important; padding: 0 !important; }
}
`;
