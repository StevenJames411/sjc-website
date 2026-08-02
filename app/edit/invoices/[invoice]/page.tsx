import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { findInvoice, readIssuer, readPackages } from "@/lib/invoices";
import { readSites } from "@/lib/sites";
import { SJC } from "@/lib/siteKeys";
import InvoiceEditor from "@/components/edit/InvoiceEditor";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Edit invoice" };

export default async function EditInvoicePage({
  params,
}: {
  params: Promise<{ invoice: string }>;
}) {
  const { invoice } = await params;
  const [found, issuer, sites, packages] = await Promise.all([
    findInvoice(invoice),
    readIssuer(),
    readSites(),
    readPackages(),
  ]);
  if (!found) notFound();

  // The websites, only so the bill-to can be filled from one. SJC's own site and deleted ones are
  // dropped — you never invoice yourself, and a binned site is not a customer.
  const billable = sites.filter((s) => s.id !== SJC && s.kind !== "template" && !s.deletedAt);

  return <InvoiceEditor invoice={found} issuer={issuer} sites={billable} packages={packages} />;
}
