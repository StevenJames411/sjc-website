// Owner-only CRUD for one website's page registry (gated by middleware, same as /api/puck).
// Every call takes a `site`, defaulting to SJC so nothing that predates the site layer breaks.
//   GET    /api/pages?site=<id>              -> { pages }
//   POST   /api/pages { title, site }        -> { ok, slug }   new blank page
//   POST   /api/pages { title, from, site }  -> { ok, slug }   duplicate a page WITHIN this site
//   PATCH  /api/pages { slug, title, site }   -> { ok }         rename (label only)
//   PATCH  /api/pages { slug, newSlug, site } -> { ok, slug }   change the page's WEB ADDRESS
//   DELETE /api/pages { slug, site }         -> { ok }         delete + purge its content
//
// Standing up a new CLIENT is POST /api/sites, not this.
import { readPages, createPage, duplicatePage, deletePage, renamePage, changeSlug } from "@/lib/pageRegistry";
import { siteOr } from "@/lib/siteAccess";
import { SJC } from "@/lib/siteKeys";

export const dynamic = "force-dynamic";

// ⚠️ RESOLVE THROUGH THE REGISTRY, NEVER A REQUEST STRING STRAIGHT INTO siteKeys(). Passing it
// through unchecked is how `site=!!!` reached the FLAGSHIP site's legacy keys; and now that
// siteKeys() throws on a malformed id, an unresolved one would surface as a 500 rather than a 404.
// `siteOr` hands back either the resolved site or the Response to return. See lib/siteAccess.ts.
const siteOf = (v: unknown) => String(v ?? "").trim() || SJC;

export async function GET(req: Request) {
  const { site, deny } = await siteOr(siteOf(new URL(req.url).searchParams.get("site")), req);
  if (deny) return deny;
  return Response.json({ pages: await readPages(site.id) });
}

export async function POST(req: Request) {
  let body: { title?: string; from?: string; site?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "bad json" }, { status: 400 });
  }
  const { site, deny } = await siteOr(siteOf(body?.site), req);
  if (deny) return deny;
  const res = body?.from
    ? await duplicatePage(body.from, body?.title || "", site.id)
    : await createPage(body?.title || "", site.id);
  return Response.json(res, { status: res.ok ? 200 : 400 });
}

export async function PATCH(req: Request) {
  let body: { slug?: string; title?: string; newSlug?: string; site?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "bad json" }, { status: 400 });
  }
  const { site, deny } = await siteOr(siteOf(body?.site), req);
  if (deny) return deny;
  // `newSlug` present -> changing the page's WEB ADDRESS (lib/pageRegistry:changeSlug), which
  // moves stored content and leaves the old slug redirecting. Otherwise -> the existing
  // label-only rename. Same verb, different field on purpose — the two have very different blast
  // radii, and `body.from` on POST above is the same "extra field picks the operation" pattern.
  const res = body?.newSlug
    ? await changeSlug(body?.slug || "", body.newSlug, site.id)
    : await renamePage(body?.slug || "", body?.title || "", site.id);
  return Response.json(res, { status: res.ok ? 200 : 400 });
}

export async function DELETE(req: Request) {
  let body: { slug?: string; site?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "bad json" }, { status: 400 });
  }
  const { site, deny } = await siteOr(siteOf(body?.site), req);
  if (deny) return deny;
  const res = await deletePage(body?.slug || "", site.id);
  return Response.json(res, { status: res.ok ? 200 : 400 });
}
