// Owner-only CRUD for the website registry (gated by middleware, same as /api/puck):
//   GET    /api/sites                          -> { sites }
//   POST   /api/sites { name }                 -> { ok, id }   from blank
//   POST   /api/sites { name, from }           -> { ok, id }   from a template or another site
//   PATCH  /api/sites { id, ...patch }         -> { ok }       name, business facts, seo, domain
//   DELETE /api/sites { id }                   -> { ok }       registry entry + all its content
import { readSites, createSite, updateSite, deleteSite, restoreSite, purgeSiteForever } from "@/lib/sites";

export const dynamic = "force-dynamic";

// `?deleted=1` includes sites in the 30-day bin. The gallery asks for them so it can offer
// Restore; everything else must never see them.
export async function GET(req: Request) {
  const includeDeleted = new URL(req.url).searchParams.get("deleted") === "1";
  return Response.json({ sites: await readSites({ includeDeleted }) });
}

export async function POST(req: Request) {
  let body: { name?: string; from?: string; kind?: string; description?: string; action?: string; id?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "bad json" }, { status: 400 });
  }
  // Restore rides on POST rather than its own route: it's the inverse of DELETE and belongs with
  // the rest of the registry's verbs.
  if (body?.action === "restore") {
    const res = await restoreSite(body?.id || "");
    return Response.json(res, { status: res.ok ? 200 : 400 });
  }

  const res = await createSite({
    name: body?.name || "",
    from: body?.from,
    // Only "template" is settable from outside; everything else is a client site. "sjc" is
    // implicit and must never be creatable, or the live site could be shadowed by a duplicate.
    kind: body?.kind === "template" ? "template" : "client",
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
  const res = await updateSite(String(id || ""), patch);
  return Response.json(res, { status: res.ok ? 200 : 400 });
}

// DELETE { id }            -> into the 30-day bin; the site stops serving, nothing is destroyed
// DELETE { id, forever }   -> erased now, including its revision history. No undo.
// POST   { id, action:"restore" } -> back out of the bin
export async function DELETE(req: Request) {
  let body: { id?: string; forever?: boolean };
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "bad json" }, { status: 400 });
  }
  const id = body?.id || "";
  const res = body?.forever ? await purgeSiteForever(id) : await deleteSite(id);
  return Response.json(res, { status: res.ok ? 200 : 400 });
}
