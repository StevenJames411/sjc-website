// Owner-only CRUD for one website's page registry (gated by middleware, same as /api/puck).
// Every call takes a `site`, defaulting to SJC so nothing that predates the site layer breaks.
//   GET    /api/pages?site=<id>              -> { pages }
//   POST   /api/pages { title, site }        -> { ok, slug }   new blank page
//   POST   /api/pages { title, from, site }  -> { ok, slug }   duplicate a page WITHIN this site
//   PATCH  /api/pages { slug, title, site }  -> { ok }         rename (label only)
//   DELETE /api/pages { slug, site }         -> { ok }         delete + purge its content
//
// Standing up a new CLIENT is POST /api/sites, not this.
import { readPages, createPage, duplicatePage, deletePage, renamePage } from "@/lib/pageRegistry";
import { SJC } from "@/lib/siteKeys";

export const dynamic = "force-dynamic";

const siteOf = (v: unknown) => String(v || SJC).trim() || SJC;

export async function GET(req: Request) {
  const site = siteOf(new URL(req.url).searchParams.get("site"));
  return Response.json({ pages: await readPages(site) });
}

export async function POST(req: Request) {
  let body: { title?: string; from?: string; site?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "bad json" }, { status: 400 });
  }
  const site = siteOf(body?.site);
  const res = body?.from
    ? await duplicatePage(body.from, body?.title || "", site)
    : await createPage(body?.title || "", site);
  return Response.json(res, { status: res.ok ? 200 : 400 });
}

export async function PATCH(req: Request) {
  let body: { slug?: string; title?: string; site?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "bad json" }, { status: 400 });
  }
  const res = await renamePage(body?.slug || "", body?.title || "", siteOf(body?.site));
  return Response.json(res, { status: res.ok ? 200 : 400 });
}

export async function DELETE(req: Request) {
  let body: { slug?: string; site?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "bad json" }, { status: 400 });
  }
  const res = await deletePage(body?.slug || "", siteOf(body?.site));
  return Response.json(res, { status: res.ok ? 200 : 400 });
}
