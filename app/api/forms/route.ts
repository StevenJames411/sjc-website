// Owner-only CRUD for the form library (gated by middleware, same as /api/sites):
//   GET    /api/forms                        -> { forms }
//   POST   /api/forms { name }               -> { ok, id }   blank
//   POST   /api/forms { name, from }         -> { ok, id }   a copy of another form
//   PATCH  /api/forms { id, ...patch }       -> { ok }       questions, button, thank-you
//   DELETE /api/forms { id }                 -> { ok }       presets only
//
// The PUBLIC site never calls this. A form's questions are copied into the page when you pick a
// preset, so a visitor's browser has no reason to know the library exists.
import { readForms, createForm, updateForm, deleteForm } from "@/lib/forms";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({ forms: await readForms() });
}

export async function POST(req: Request) {
  let body: { name?: string; from?: string; description?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "bad json" }, { status: 400 });
  }
  const res = await createForm({
    name: body?.name || "",
    from: body?.from,
    description: body?.description,
  });
  return Response.json(res, { status: res.ok ? 200 : 400 });
}

export async function PATCH(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "bad json" }, { status: 400 });
  }
  const { id, ...patch } = body as { id?: string } & Record<string, unknown>;
  const res = await updateForm(String(id || ""), patch);
  return Response.json(res, { status: res.ok ? 200 : 400 });
}

export async function DELETE(req: Request) {
  let body: { id?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "bad json" }, { status: 400 });
  }
  const res = await deleteForm(body?.id || "");
  return Response.json(res, { status: res.ok ? 200 : 400 });
}
