// Owner-only CRUD for the dynamic page registry (gated by middleware, same as /api/puck):
//   GET    /api/pages            -> { pages }        (the full builder page list)
//   POST   /api/pages { title }  -> { ok, slug }     (create a new page, returns its slug)
//   POST   /api/pages { title, from } -> { ok, slug } (DUPLICATE `from` under a new name)
//   PATCH  /api/pages { slug, title } -> { ok }      (rename a page — label only, slug unchanged)
//   DELETE /api/pages { slug }   -> { ok }           (delete a page + purge its content)
import { readPages, createPage, duplicatePage, deletePage, renamePage } from "@/lib/pageRegistry";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({ pages: await readPages() });
}

export async function POST(req: Request) {
  let body: { title?: string; from?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "bad json" }, { status: 400 });
  }
  // `from` present => copy that page's content into the new one; absent => blank page, as before.
  const res = body?.from
    ? await duplicatePage(body.from, body?.title || "")
    : await createPage(body?.title || "");
  return Response.json(res, { status: res.ok ? 200 : 400 });
}

export async function PATCH(req: Request) {
  let body: { slug?: string; title?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "bad json" }, { status: 400 });
  }
  const res = await renamePage(body?.slug || "", body?.title || "");
  return Response.json(res, { status: res.ok ? 200 : 400 });
}

export async function DELETE(req: Request) {
  let body: { slug?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "bad json" }, { status: 400 });
  }
  const res = await deletePage(body?.slug || "");
  return Response.json(res, { status: res.ok ? 200 : 400 });
}
