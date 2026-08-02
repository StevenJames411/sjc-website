// The printable invoice. `?print=1` opens the print dialog on arrival, so the button in the
// editor is one click rather than two.
//
// Under /edit, so it's owner-only like everything else here — an invoice URL must not be
// something a customer can guess their way into.
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { findInvoice, readIssuer } from "@/lib/invoices";
import InvoicePrint from "@/components/edit/InvoicePrint";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Invoice" };

export default async function PrintInvoicePage({
  params,
  searchParams,
}: {
  params: Promise<{ invoice: string }>;
  searchParams: Promise<{ print?: string }>;
}) {
  const [{ invoice }, sp] = await Promise.all([params, searchParams]);
  const [found, issuer] = await Promise.all([findInvoice(invoice), readIssuer()]);
  if (!found) notFound();

  // The invoice's OWN snapshot of your details, so reprinting an old one reproduces what was
  // actually sent. Only invoices written before snapshots existed fall back to the template.
  return <InvoicePrint invoice={found} issuer={found.from ?? issuer} auto={sp?.print === "1"} />;
}
