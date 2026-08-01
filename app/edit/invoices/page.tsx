// The invoice book.
//
// A static segment under /edit, so it wins precedence over app/edit/[site] the same way
// /edit/forms does. "invoices" is in RESERVED_SITE_IDS for that reason — without it a website
// with that id would be created happily and then be unopenable.
//
// Owner-only for free: middleware.ts protects everything under /edit/.
import type { Metadata } from "next";
import { readInvoices, readIssuer } from "@/lib/invoices";
import InvoiceLibrary from "@/components/edit/InvoiceLibrary";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Invoices" };

export default async function InvoicesPage() {
  const [invoices, issuer] = await Promise.all([readInvoices(), readIssuer()]);
  return <InvoiceLibrary invoices={invoices} issuer={issuer} />;
}
