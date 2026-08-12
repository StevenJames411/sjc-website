// Cloud persistence for Puck-built pages. Every call takes a `site`, defaulting to SJC.
//   GET  /api/puck?page=about&site=<id>[&pub=1]  -> { data }   (draft, or published snapshot)
//   PUT  /api/puck   { page, site, data }        -> { ok }     (save the working draft)
//   POST /api/puck?page=about&site=<id>&action=publish|unpublish
// All routes are gated by middleware (only the signed-in owner can reach them).
import { createKvStore } from "@/lib/kvStateStore";
import { getClient } from "@/lib/store";
import { puckKey } from "@/lib/puckContent";
import { siteOr } from "@/lib/siteAccess";
import { SJC } from "@/lib/siteKeys";
import { CHROME, isChrome } from "@/lib/puckPages";

export const dynamic = "force-dynamic";

// ⚠️ RESOLVE THROUGH THE REGISTRY, NEVER A REQUEST STRING STRAIGHT INTO siteKeys(). Passing it
// through unchecked is how `site=!!!` reached the FLAGSHIP site's legacy keys; and now that
// siteKeys() throws on a malformed id, an unresolved one would surface as a 500 rather than a 404.
// See lib/siteAccess.ts.
const siteOf = (v: unknown) => String(v ?? "").trim() || SJC;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const page = url.searchParams.get("page") || "about";
  const { site, deny } = await siteOr(siteOf(url.searchParams.get("site")), req);
  if (deny) return deny;
  const pub = url.searchParams.get("pub") === "1";
  const store = createKvStore(getClient(), puckKey(page, pub, site.id));
  return Response.json({ data: (await store.read()) || null });
}

export async function PUT(req: Request) {
  let body: { page?: string; site?: string; data?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "bad json" }, { status: 400 });
  }
  const { site, deny } = await siteOr(siteOf(body?.site), req);
  if (deny) return deny;
  const store = createKvStore(getClient(), puckKey(body?.page || "about", false, site.id));
  // Report the REASON, not just a boolean. A refused save used to return ok:false with an HTTP
  // 200 and no explanation, which the editor rendered as "saved". 409 = the write guard said no.
  const { ok, reason } = await store.writeResult(body?.data || {});
  return Response.json({ ok, reason, configured: store.configured }, { status: ok ? 200 : 409 });
}

export async function POST(req: Request) {
  const url = new URL(req.url);
  const page = url.searchParams.get("page") || "about";
  const { site: resolved, deny } = await siteOr(siteOf(url.searchParams.get("site")), req);
  if (deny) return deny;
  const site = resolved.id;
  const client = getClient();
  const pub = createKvStore(client, puckKey(page, true, site));

  if (url.searchParams.get("action") === "unpublish") {
    const ok = await pub.write({}); // no _pub marker -> the public route 404s / falls back
    return Response.json({ ok, published: false });
  }

  // publish: snapshot the live draft and stamp it published
  const draft = createKvStore(client, puckKey(page, false, site));
  const data = ((await draft.read()) || {}) as Record<string, unknown>;
  const ok = await pub.write({ ...data, _pub: 1 });

  // ⚠️ THE STYLESHEET USED TO NEED PROMOTING HERE, AND NOW CANNOT GO WRONG (2026-08-12).
  //
  // A design's CSS used to live in its own key on the same draft/-pub convention, so publishing the
  // CONTENT alone put the page live with no stylesheet — not "a bit plain" but wreckage: the grid
  // overlay lost its `absolute inset-0` and covered the page in cyan lines. It reported success,
  // and `?preview=1` still looked perfect, because preview read the DRAFT css — so the one view
  // you'd check to reassure yourself was the one that could not show the problem.
  //
  // Sheets are now immutable and content-addressed, and the page's own blocks carry the id. There
  // is no second copy to promote and no way for content and stylesheet to disagree: publishing the
  // content publishes the reference. It is also why the unpublish branch above no longer strands a
  // live sheet behind for neighbouring pages to inherit.

  // ⛔ THE CHROME GOES LIVE WITH THE PAGE. Steven: "Publishing the page is the only thing we should
  // do. Not adding every freaking section one by one."
  //
  // The header and footer are site-wide documents, so they have their own draft/-pub pair — which
  // meant editing the header and pressing Publish on the page shipped NOTHING, silently, and the
  // header had to be published separately from its own card. Two publishes where Steven expects
  // one, and no error to say so: the page went live looking stripped.
  //
  // Only promotes a chrome draft that actually EXISTS, so this can never blank a live header by
  // stamping an empty document over it. Publishing chrome from its own card still works and is now
  // simply unnecessary. Never runs for `unpublish` — that returns above.
  if (!isChrome(page)) {
    for (const part of CHROME) {
      const chromeDraft = createKvStore(client, puckKey(part, false, site));
      const chromeData = (await chromeDraft.read()) as Record<string, unknown> | null;
      if (chromeData && Object.keys(chromeData).length) {
        await createKvStore(client, puckKey(part, true, site)).write({ ...chromeData, _pub: 1 });
      }
    }
  }

  return Response.json({ ok, published: true });
}
