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
// ── WHY IT'S DRESSED LIKE THE STUDIO SITE ─────────────────────────────────────────────────────
// The invoice arrives in an inbox a few days after somebody signed off on a design. Landing on a
// bare white page asking for a card is the moment a person wonders whether the email was real.
// So it sits between the same header and footer as stevenjamesdesigns.com — dark, branded, his
// phone number visible — and the invoice itself stays a plain white document in the middle of it,
// because that part has to read as a business record and print like one.
//
// The header/footer are written HERE rather than reused from the studio site: that site is an
// imported design stored as page content, not React components, and there is nothing to import.
// Everything that can be data IS data — the name, phone and email all come off the invoice's own
// issuer snapshot, so this page can never advertise details the document doesn't carry.
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { findInvoiceByPublicId, readIssuer } from "@/lib/invoices";
import { isPayable, money, prettyDate, totals } from "@/lib/invoicesShared";
import InvoiceDoc from "@/components/edit/InvoiceDoc";
import PayButton from "@/components/PayButton";

export const dynamic = "force-dynamic";

// Belt and braces alongside the unguessable token: a customer forwards this to his bookkeeper,
// and a crawler that finds it in a mailbox preview must not index someone's billing address.
export const metadata: Metadata = {
  title: "Invoice",
  robots: { index: false, follow: false, nocache: true },
};

const STUDIO = "https://stevenjamesdesigns.com";

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

  // "Steven James Designs" splits so "Designs" can take the accent, the way it does on the site.
  const brand = issuer.dba || issuer.businessName || "Invoice";
  const words = brand.split(" ");
  const brandTail = words.length > 1 ? words.pop() : "";
  const brandHead = words.join(" ");

  return (
    <>
      <style>{css}</style>

      {/* NOTHING IN THE HEADER IS CLICKABLE, on purpose. This page has one job: get the invoice
          read and paid. A brand mark linking to the studio site, or a phone number sitting above
          the Pay button, is a door out of the page at the exact moment somebody was about to
          settle up. Every way to reach him lives in the footer, past the payment. */}
      <header className="sjd-head">
        <div className="sjd-wrap sjd-head-in">
          <div className="sjd-brand">
            <span className="sjd-mark" aria-hidden>
              &lt;/&gt;
            </span>
            <span className="sjd-brand-txt">
              {brandHead} {brandTail ? <em>{brandTail}</em> : null}
            </span>
          </div>
          <span className="sjd-pill">
            {invoice.number}
            {invoice.dueOn && !paid ? ` · due ${prettyDate(invoice.dueOn)}` : ""}
          </span>
        </div>
      </header>

      <main className="sjd-main">
        <div className="sjd-wrap">
          <div className="sjd-title">
            <h1>{paid ? "Your receipt" : "Your invoice"}</h1>
            <p>
              {paid
                ? `Paid ${prettyDate(invoice.paidOn as string)}. Thank you — keep this for your records.`
                : `Prepared for ${invoice.billTo.name || "you"}. Review it below and pay by card when you're ready.`}
            </p>
          </div>

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
                    Secure checkout by Stripe. Card details are entered on Stripe&rsquo;s page and
                    never touch this one.
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
                // No button on this invoice. Say so plainly rather than showing an empty panel —
                // the other ways to pay are already printed on the document itself.
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
        </div>
      </main>

      <footer className="sjd-foot">
        <div className="sjd-wrap">
          <div className="foot-cols">
            <div>
              <div className="sjd-brand foot-brand">
                <span className="sjd-mark" aria-hidden>
                  &lt;/&gt;
                </span>
                <span className="sjd-brand-txt">
                  {brandHead} {brandTail ? <em>{brandTail}</em> : null}
                </span>
              </div>
              <p className="foot-blurb">
                Building websites that win everywhere — mobile-first, Google-optimized, and ready
                for the AI search era.
              </p>
            </div>

            <div className="foot-contact">
              <div className="foot-h">Get in touch</div>
              {/* A button, not a string of digits — on the phone this invoice is most likely
                  being read on, a tel: link IS the call. */}
              {issuer.phone ? (
                <a className="call-btn" href={`tel:${issuer.phone.replace(/[^\d+]/g, "")}`}>
                  <span aria-hidden>📞</span> Call {issuer.phone}
                </a>
              ) : null}
              {issuer.email ? <a href={`mailto:${issuer.email}`}>{issuer.email}</a> : null}
              <a href={STUDIO}>stevenjamesdesigns.com</a>
            </div>
          </div>

          <div className="foot-base">
            <span>
              © {new Date().getFullYear()} {issuer.businessName || brand}. All rights reserved.
            </span>
            <span>Crafted with precision.</span>
          </div>
        </div>
      </footer>
    </>
  );
}

// A real stylesheet rather than inline styles, because the layout needs media queries and an
// inline style can't hold one. Colours lifted off stevenjamesdesigns.com so the page reads as the
// same company; the invoice sheet itself stays white, because a business document should.
const css = `
:root { color-scheme: dark; }
.sjd-wrap { max-width: 1180px; margin: 0 auto; padding: 0 20px; }

.sjd-head {
  background: #232c3d;
  border-bottom: 1px solid rgba(255,255,255,.07);
  position: sticky; top: 0; z-index: 20;
}
.sjd-head-in { display: flex; align-items: center; justify-content: space-between; gap: 16px; min-height: 68px; flex-wrap: wrap; padding-top: 10px; padding-bottom: 10px; }
.sjd-brand { display: inline-flex; align-items: center; gap: 12px; text-decoration: none; user-select: none; }
.sjd-mark {
  width: 38px; height: 38px; border-radius: 11px; flex: 0 0 auto;
  display: grid; place-items: center;
  font-size: 15px; font-weight: 800; letter-spacing: -.04em; color: #06263a;
  background: linear-gradient(150deg, #7fe3ff 0%, #38c9f5 45%, #2b8fd6 100%);
  box-shadow: 0 6px 18px rgba(56,201,245,.28);
}
.sjd-brand-txt { font-size: 19px; font-weight: 800; color: #fff; letter-spacing: -.01em; }
.sjd-brand-txt em { font-style: normal; color: #4fd2f7; }
.sjd-pill {
  font-size: 12.5px; font-weight: 700; color: #06263a;
  background: #4fd2f7; border-radius: 999px; padding: 7px 14px; white-space: nowrap;
}

.sjd-main {
  background:
    radial-gradient(900px 420px at 78% -6%, rgba(56,201,245,.10), transparent 62%),
    #0a1628;
  padding: 34px 0 56px;
  min-height: 60vh;
}
.sjd-title { margin-bottom: 20px; }
.sjd-title h1 { font-size: 30px; font-weight: 800; color: #fff; letter-spacing: -.025em; margin: 0; }
.sjd-title p { font-size: 14.5px; color: #94a3b8; margin: 7px 0 0; line-height: 1.6; }

.inv-cols { display: grid; gap: 18px; align-items: start; }
.inv-side { min-width: 0; display: grid; gap: 12px; }
.inv-sheet {
  background: #fff; border-radius: 14px; padding: 38px 34px;
  box-shadow: 0 18px 46px rgba(0,0,0,.34);
}
/* 340px is the width Stripe's own button card wants; below ~900 there isn't room for both, so it
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

.sjd-foot { background: #071120; border-top: 1px solid rgba(255,255,255,.07); padding: 40px 0 26px; }
.foot-cols { display: grid; gap: 26px; }
@media (min-width: 760px) { .foot-cols { grid-template-columns: minmax(0,1.6fr) minmax(0,1fr); gap: 40px; } }
.foot-brand { margin-bottom: 12px; }
.foot-blurb { font-size: 14px; color: #8fa3bd; line-height: 1.7; margin: 0; max-width: 470px; }
.foot-h { font-size: 11px; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; color: #64748b; margin-bottom: 12px; }
.foot-contact { display: grid; gap: 11px; align-content: start; justify-items: start; }
.foot-contact a { color: #cbd5e1; text-decoration: none; font-size: 14px; }
.foot-contact a:hover { color: #4fd2f7; }
.call-btn {
  display: inline-flex; align-items: center; gap: 9px;
  background: #4fd2f7; color: #06263a !important;
  font-size: 14.5px; font-weight: 700; letter-spacing: -.01em;
  border-radius: 999px; padding: 11px 20px; margin-bottom: 3px;
  box-shadow: 0 8px 22px rgba(79,210,247,.22);
}
.call-btn:hover { background: #7fe3ff; }
.foot-base {
  display: flex; justify-content: space-between; gap: 14px; flex-wrap: wrap;
  border-top: 1px solid rgba(255,255,255,.07);
  margin-top: 30px; padding-top: 18px; font-size: 12.5px; color: #55657c;
}

/* The invoice is a document. If somebody prints this page, print the document — not the dark
   brand furniture around it, which would come out as a grey slab or vanish entirely. */
@media print {
  .sjd-head, .sjd-foot, .sjd-title, .inv-side { display: none !important; }
  .sjd-main { background: #fff !important; padding: 0 !important; }
  .inv-sheet { box-shadow: none !important; border-radius: 0 !important; padding: 0 !important; }
  .sjd-wrap { max-width: none; padding: 0; }
}
`;
