// Owner-only CRUD for the invoice book (gated by middleware, same as /api/forms):
//   GET    /api/invoices                        -> { invoices, issuer }
//   POST   /api/invoices {}                     -> { ok, id }   a blank invoice
//   POST   /api/invoices { from }               -> { ok, id }   a copy, fresh number + dates
//   PATCH  /api/invoices { id, ...patch }       -> { ok, publicId }   the invoice
//   PATCH  /api/invoices { issuer: {...} }      -> { ok }       your own details
//   PATCH  /api/invoices { packages: [...] }    -> { ok }       the three packages + buy buttons
//   DELETE /api/invoices { id }                 -> { ok }
//
// The PUBLIC site never calls this — an invoice is a private business record, not page content.
// The one public surface is /i/<publicId>, which reads a single invoice by an unguessable token
// and goes nowhere near this route.
import {
  readInvoices,
  readIssuer,
  readPackages,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  saveIssuer,
  savePackages,
} from "@/lib/invoices";

export const dynamic = "force-dynamic";

export async function GET() {
  const [invoices, issuer, packages] = await Promise.all([
    readInvoices(),
    readIssuer(),
    readPackages(),
  ]);
  return Response.json({ invoices, issuer, packages });
}

export async function POST(req: Request) {
  let body: { from?: string; billTo?: Record<string, string> } = {};
  try {
    body = await req.json();
  } catch {
    // A blank invoice is a legitimate empty POST, so bad/absent JSON is not an error here.
  }
  const res = await createInvoice({ from: body?.from, billTo: body?.billTo });
  return Response.json(res, { status: res.ok ? 200 : 400 });
}

export async function PATCH(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "bad json" }, { status: 400 });
  }

  // One route, three shapes. `{ issuer }` saves your own details, `{ packages }` saves the three
  // packages and their buy buttons, and anything with an `id` patches that invoice. Kept together
  // so the editor has a single endpoint to talk to.
  if (body?.issuer && typeof body.issuer === "object") {
    const res = await saveIssuer(body.issuer as Record<string, string>);
    return Response.json(res, { status: res.ok ? 200 : 400 });
  }

  if (Array.isArray(body?.packages)) {
    const res = await savePackages(body.packages as Parameters<typeof savePackages>[0]);
    return Response.json(res, { status: res.ok ? 200 : 400 });
  }

  const { id, ...patch } = body as { id?: string } & Record<string, unknown>;
  const res = await updateInvoice(String(id || ""), patch);
  return Response.json(res, { status: res.ok ? 200 : 400 });
}

export async function DELETE(req: Request) {
  let body: { id?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "bad json" }, { status: 400 });
  }
  const res = await deleteInvoice(body?.id || "");
  return Response.json(res, { status: res.ok ? 200 : 400 });
}
