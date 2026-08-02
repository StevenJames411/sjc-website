// The invoice book.
//
// A static segment under /edit, so it wins precedence over app/edit/[site] the same way
// /edit/forms does. "invoices" is in RESERVED_SITE_IDS for that reason — without it a website
// with that id would be created happily and then be unopenable.
//
// Owner-only for free: middleware.ts protects everything under /edit/.
import { readInvoices, readIssuer, readPackages } from "@/lib/invoices";
import { navLabel } from "@/lib/editNav";
import InvoiceLibrary from "@/components/edit/InvoiceLibrary";

export const dynamic = "force-dynamic";

// Heading and tab both read the name Steven gave this screen in the rail. See lib/editNav.ts.
export async function generateMetadata() {
  return { title: await navLabel("invoices") };
}

export default async function InvoicesPage() {
  const [invoices, issuer, packages, title] = await Promise.all([
    readInvoices(),
    readIssuer(),
    readPackages(),
    navLabel("invoices"),
  ]);
  return <InvoiceLibrary invoices={invoices} issuer={issuer} packages={packages} title={title} />;
}
