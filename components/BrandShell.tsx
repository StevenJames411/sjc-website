// THE WRAPPER for pages a customer lands on that aren't a website — an invoice, an onboarding
// questionnaire, anything sent by link after money or a handshake has changed hands.
//
// ── WHY THIS EXISTS ───────────────────────────────────────────────────────────────────────────
// These pages arrive in an inbox or a text, days after a phone call. A bare white page asking for
// a card, or for a business owner's opening hours and photos, is the moment a person wonders
// whether the message was real. The chrome is the answer to "is this actually him?"
//
// ── NOTHING IN THE HEADER IS CLICKABLE ────────────────────────────────────────────────────────
// Deliberate, and it applies to every page that uses this. A brand mark linking home, or a phone
// number above the button, is a door out of the page at the exact moment somebody was about to
// finish. Every way to reach him lives in the footer, past the thing he wants them to do.
//
// ── ONE BUSINESS, ONE WRAPPER ─────────────────────────────────────────────────────────────────
// `brand` picks which company is speaking. Steven James Designs sells websites; Steven James
// Consulting sells AI employees. Wearing the wrong one is not a cosmetic mistake — a groomer once
// got an onboarding link whose preview read "AI employees for your business", which is SJC's pitch
// arriving in a message from someone she had just started paying for a WEBSITE.
//
// SJC's own site already has real chrome (components/Nav + Footer) and keeps using it. This is for
// the standalone link-only pages, where there is no site navigation to inherit.
import type { ReactNode } from "react";

export type BrandKey = "designs" | "consulting";

type Brand = {
  /** Printed in the header. The last word takes the accent, the way it does on the sites. */
  name: string;
  /** The glyph in the rounded tile. */
  mark: string;
  /** One line under the mark in the footer — what this company does, in its own words. */
  blurb: string;
  site: string;
  siteLabel: string;
  accent: string;
  accentSoft: string;
  markInk: string;
  markGradient: string;
  headerBg: string;
  bodyBg: string;
  footBg: string;
};

const BRANDS: Record<BrandKey, Brand> = {
  designs: {
    name: "Steven James Designs",
    mark: "</>",
    blurb:
      "Building websites that win everywhere — mobile-first, Google-optimized, and ready for the AI search era.",
    site: "https://stevenjamesdesigns.com",
    siteLabel: "stevenjamesdesigns.com",
    accent: "#4fd2f7",
    accentSoft: "#7fe3ff",
    markInk: "#06263a",
    markGradient: "linear-gradient(150deg, #7fe3ff 0%, #38c9f5 45%, #2b8fd6 100%)",
    headerBg: "#232c3d",
    bodyBg: "#0a1628",
    footBg: "#071120",
  },
  consulting: {
    name: "Steven James Consulting",
    mark: "◆",
    blurb:
      "AI employees that work your business the way a great hire would — answering, qualifying and booking, around the clock.",
    site: "https://stevenjamesconsulting.com",
    siteLabel: "stevenjamesconsulting.com",
    accent: "#8b9cff",
    accentSoft: "#b3bdff",
    markInk: "#0d1030",
    markGradient: "linear-gradient(150deg, #b3bdff 0%, #8b9cff 45%, #5b63d6 100%)",
    headerBg: "#262a45",
    bodyBg: "#0e1030",
    footBg: "#0a0c26",
  },
};

export default function BrandShell({
  brand = "designs",
  /** Overrides the brand's own name — an invoice uses the DBA snapshotted on that document. */
  name,
  heading,
  sub,
  /** The badge in the top-right: an invoice number, "Question 3 of 9". Text only, never a link. */
  pill,
  phone,
  email,
  /** Whose copyright line runs along the bottom. Defaults to the brand name. */
  legalName,
  children,
}: {
  brand?: BrandKey;
  name?: string;
  heading?: string;
  sub?: string;
  pill?: string;
  phone?: string;
  email?: string;
  legalName?: string;
  children: ReactNode;
}) {
  const b = BRANDS[brand] ?? BRANDS.designs;
  const shown = (name || b.name).trim();
  const words = shown.split(" ");
  const tail = words.length > 1 ? words.pop() : "";
  const head = words.join(" ");
  const tel = phone ? phone.replace(/[^\d+]/g, "") : "";

  const Mark = (
    <>
      <span className="bs-mark" aria-hidden>
        {b.mark}
      </span>
      <span className="bs-name">
        {head} {tail ? <em>{tail}</em> : null}
      </span>
    </>
  );

  return (
    <>
      <style>{css(b)}</style>

      <header className="bs-head">
        <div className="bs-wrap bs-head-in">
          <div className="bs-brand">{Mark}</div>
          {pill ? <span className="bs-pill">{pill}</span> : null}
        </div>
      </header>

      <main className="bs-main">
        <div className="bs-wrap">
          {heading || sub ? (
            <div className="bs-title">
              {heading ? <h1>{heading}</h1> : null}
              {sub ? <p>{sub}</p> : null}
            </div>
          ) : null}
          {children}
        </div>
      </main>

      <footer className="bs-foot">
        <div className="bs-wrap">
          <div className="bs-foot-cols">
            <div>
              <div className="bs-brand bs-foot-brand">{Mark}</div>
              <p className="bs-blurb">{b.blurb}</p>
            </div>

            <div className="bs-contact">
              <div className="bs-foot-h">Get in touch</div>
              {/* A button, not a string of digits — on the phone this page is most likely being
                  read on, the tel: link IS the call. */}
              {phone ? (
                <a className="bs-call" href={`tel:${tel}`}>
                  <span aria-hidden>📞</span> Call {phone}
                </a>
              ) : null}
              {email ? <a href={`mailto:${email}`}>{email}</a> : null}
              <a href={b.site}>{b.siteLabel}</a>
            </div>
          </div>

          <div className="bs-base">
            <span>
              © {new Date().getFullYear()} {legalName || shown}. All rights reserved.
            </span>
            <span>Crafted with precision.</span>
          </div>
        </div>
      </footer>
    </>
  );
}

// A real stylesheet rather than inline styles, because the layout needs media queries and an
// inline style can't hold one. Colours are lifted off the live sites so these pages read as the
// same company; whatever the page puts inside stays on white, because a document should.
const css = (b: Brand) => `
:root { color-scheme: dark; }
/* CLIP, NOT HIDDEN. Both stop one over-wide element making the whole page scroll sideways, but
   overflow:hidden turns html/body into a scroll container — and a scroll container silently kills
   position:sticky on everything inside it. That is what un-stuck the header and the Pay column.
   overflow-x:clip does the same job without creating one.
   (No backticks in this comment: the whole stylesheet is a template literal.) */
html, body { overflow-x: clip; }
.bs-wrap { max-width: 1180px; margin: 0 auto; padding: 0 20px; }
@media (max-width: 640px) {
  .bs-wrap { padding: 0 14px; }
  .bs-head-in { min-height: 60px; }
  .bs-name { font-size: 17px; }
  .bs-mark { width: 34px; height: 34px; border-radius: 10px; font-size: 14px; }
  .bs-pill { font-size: 11.5px; padding: 6px 11px; }
  .bs-main { padding: 22px 0 40px; }
  .bs-title h1 { font-size: 24px; }
  .bs-title p { font-size: 14px; }
}

.bs-head {
  background: ${b.headerBg};
  border-bottom: 1px solid rgba(255,255,255,.07);
  position: sticky; top: 0; z-index: 20;
}
.bs-head-in { display: flex; align-items: center; justify-content: space-between; gap: 16px; min-height: 68px; flex-wrap: wrap; padding-top: 10px; padding-bottom: 10px; }
.bs-brand { display: inline-flex; align-items: center; gap: 12px; user-select: none; }
.bs-mark {
  width: 38px; height: 38px; border-radius: 11px; flex: 0 0 auto;
  display: grid; place-items: center;
  font-size: 15px; font-weight: 800; letter-spacing: -.04em;
  color: ${b.markInk}; background: ${b.markGradient};
  box-shadow: 0 6px 18px ${b.accent}47;
}
.bs-name { font-size: 19px; font-weight: 800; color: #fff; letter-spacing: -.01em; }
.bs-name em { font-style: normal; color: ${b.accent}; }
.bs-pill {
  font-size: 12.5px; font-weight: 700; color: ${b.markInk};
  background: ${b.accent}; border-radius: 999px; padding: 7px 14px; white-space: nowrap;
}

.bs-main {
  background:
    radial-gradient(900px 420px at 78% -6%, ${b.accent}1a, transparent 62%),
    ${b.bodyBg};
  padding: 34px 0 56px;
  min-height: 62vh;
}
.bs-title { margin-bottom: 20px; }
.bs-title h1 { font-size: 30px; font-weight: 800; color: #fff; letter-spacing: -.025em; margin: 0; }
.bs-title p { font-size: 14.5px; color: #94a3b8; margin: 7px 0 0; line-height: 1.6; }

.bs-foot { background: ${b.footBg}; border-top: 1px solid rgba(255,255,255,.07); padding: 40px 0 26px; }
.bs-foot-cols { display: grid; gap: 26px; }
@media (min-width: 760px) { .bs-foot-cols { grid-template-columns: minmax(0,1.6fr) minmax(0,1fr); gap: 40px; } }
.bs-foot-brand { margin-bottom: 12px; }
.bs-blurb { font-size: 14px; color: #8fa3bd; line-height: 1.7; margin: 0; max-width: 470px; }
.bs-foot-h { font-size: 11px; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; color: #64748b; margin-bottom: 12px; }
.bs-contact { display: grid; gap: 11px; align-content: start; justify-items: start; }
.bs-contact a { color: #cbd5e1; text-decoration: none; font-size: 14px; }
.bs-contact a:hover { color: ${b.accent}; }
.bs-call {
  display: inline-flex; align-items: center; gap: 9px;
  background: ${b.accent}; color: ${b.markInk} !important;
  font-size: 14.5px; font-weight: 700; letter-spacing: -.01em;
  border-radius: 999px; padding: 11px 20px; margin-bottom: 3px;
  box-shadow: 0 8px 22px ${b.accent}38;
}
.bs-call:hover { background: ${b.accentSoft}; }
.bs-base {
  display: flex; justify-content: space-between; gap: 14px; flex-wrap: wrap;
  border-top: 1px solid rgba(255,255,255,.07);
  margin-top: 30px; padding-top: 18px; font-size: 12.5px; color: #55657c;
}

/* If somebody prints one of these pages, print what's INSIDE it — not the dark brand furniture,
   which comes out as a grey slab or vanishes entirely depending on the browser. */
@media print {
  .bs-head, .bs-foot, .bs-title { display: none !important; }
  .bs-main { background: #fff !important; padding: 0 !important; }
  .bs-wrap { max-width: none; padding: 0; }
}
`;
