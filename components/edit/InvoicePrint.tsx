"use client";
// The printable invoice — this page IS the PDF.
//
// ── WHY THERE IS NO PDF LIBRARY ───────────────────────────────────────────────────────────────
// The obvious instinct is a server-side generator (pdfkit, puppeteer, a headless Chrome). For a
// one-page document made of text that would mean shipping a binary into a serverless function,
// a second layout engine to keep in sync with this one, and a whole new way for "download my
// invoice" to fail at the moment it's needed. Cmd+P → "Save as PDF" is already in the operating
// system, renders exactly what is on screen, works with no network, and cannot drift from the
// preview because it IS the preview.
//
// Everything below the print CSS exists to make that one keystroke produce a clean page.
import { useEffect } from "react";
import InvoiceDoc from "./InvoiceDoc";
import type { Invoice, IssuerDetails } from "@/lib/invoicesShared";

export default function InvoicePrint({
  invoice,
  issuer,
  auto,
}: {
  invoice: Invoice;
  issuer: IssuerDetails;
  auto?: boolean;
}) {
  // ?print=1 opens the dialog straight away, so the button in the editor is one click, not two.
  // rAF rather than a timer: it fires after the browser has laid the page out, so the dialog
  // never captures a half-rendered document.
  useEffect(() => {
    if (!auto) return;
    const id = requestAnimationFrame(() => window.print());
    return () => cancelAnimationFrame(id);
  }, [auto]);

  return (
    <>
      <style>{printCss}</style>

      <div className="screen-only" style={bar}>
        <a href={`/edit/invoices/${invoice.id}`} style={backLink}>
          ← Back to the invoice
        </a>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span style={hint}>Choose “Save as PDF” as the destination</span>
          <button type="button" style={printBtn} onClick={() => window.print()}>
            Print / Save as PDF
          </button>
        </div>
      </div>

      <div className="page">
        <InvoiceDoc invoice={invoice} issuer={issuer} />
      </div>
    </>
  );
}

const printCss = `
  /* Letter with real margins. The browser's own header and footer (page title, date, URL) are
     switched off in the print dialog by the user, but a proper @page margin is what stops the
     document sitting hard against the edge when they forget. */
  @page { size: letter; margin: 0.6in; }

  html, body { background: #f3f4f6; }

  /* On screen: show the sheet as a sheet, so what you're looking at is obviously a page. */
  .page {
    background: #fff;
    max-width: 7.4in;
    margin: 24px auto 60px;
    padding: 0.55in 0.6in;
    box-shadow: 0 1px 3px rgba(0,0,0,.12), 0 8px 24px rgba(0,0,0,.08);
    border-radius: 2px;
  }

  @media print {
    /* Nothing but the document. */
    .screen-only { display: none !important; }

    html, body { background: #fff !important; }
    .page {
      max-width: none;
      margin: 0;
      padding: 0;
      box-shadow: none;
      border-radius: 0;
    }

    /* Force the ink. Browsers drop backgrounds and lighten text when printing to save toner,
       which turns the header rule and the table borders into nothing. */
    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }

    /* A one-page document must not spill a stray line onto a second sheet. */
    .invoice-sheet { page-break-inside: avoid; }
    tr, td, th { page-break-inside: avoid; }
  }
`;

const bar: React.CSSProperties = {
  fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
  maxWidth: "7.4in",
  margin: "0 auto",
  padding: "18px 4px 0",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 16,
  flexWrap: "wrap",
};
const backLink: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: "#374151",
  textDecoration: "none",
};
const hint: React.CSSProperties = { fontSize: 12, color: "#6b7280" };
const printBtn: React.CSSProperties = {
  background: "#111827",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  padding: "9px 16px",
  fontSize: 14,
  fontWeight: 700,
  cursor: "pointer",
};
