// Owner-only CRUD for the invoice book (gated by middleware, same as /api/forms):
//   GET    /api/invoices                        -> { invoices, issuer }
//   POST   /api/invoices {}                     -> { ok, id }   a blank invoice
//   POST   /api/invoices { from }               -> { ok, id }   a copy, fresh number + dates
//   PATCH  /api/invoices { id, ...patch }       -> { ok }       the invoice
//   PATCH  /api/invoices { issuer: {...} }      -> { ok }       your own details
//   DELETE /api/invoices { id }                 -> { ok }
//
// The PUBLIC site never calls this — an invoice is a private business record, not page content.
import {
  readInvoices,
  readIssuer,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  saveIssuer,
} from "@/lib/invoices";

export const dynamic = "force-dynamic";

export async function GET() {
  const [invoices, issuer] = await Promise.all([readInvoices(), readIssuer()]);
  return Response.json({ invoices, issuer });
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

  // One route, two shapes. `{ issuer }` saves your own details; anything with an `id` patches
  // that invoice. Kept together so the editor has a single endpoint to talk to.
  if (body?.issuer && typeof body.issuer === "object") {
    const res = await saveIssuer(body.issuer as Record<string, string>);
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
