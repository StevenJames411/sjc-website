// Cloud persistence for Puck-built pages. Every call takes a `site`, defaulting to SJC.
//   GET  /api/puck?page=about&site=<id>[&pub=1]  -> { data }   (draft, or published snapshot)
//   PUT  /api/puck   { page, site, data }        -> { ok }     (save the working draft)
//   POST /api/puck?page=about&site=<id>&action=publish|unpublish
// All routes are gated by middleware (only the signed-in owner can reach them).
import { createKvStore } from "@/lib/kvStateStore";
import { getClient } from "@/lib/store";
import { puckKey, readDesignCssDraft, writeDesignCss } from "@/lib/puckContent";
import { SJC } from "@/lib/siteKeys";
import { CHROME, isChrome } from "@/lib/puckPages";

export const dynamic = "force-dynamic";

const siteOf = (v: unknown) => String(v || SJC).trim() || SJC;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const page = url.searchParams.get("page") || "about";
  const site = siteOf(url.searchParams.get("site"));
  const pub = url.searchParams.get("pub") === "1";
  const store = createKvStore(getClient(), puckKey(page, pub, site));
  return Response.json({ data: (await store.read()) || null });
}

export async function PUT(req: Request) {
  let body: { page?: string; site?: string; data?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "bad json" }, { status: 400 });
  }
  const store = createKvStore(getClient(), puckKey(body?.page || "about", false, siteOf(body?.site)));
  // Report the REASON, not just a boolean. A refused save used to return ok:false with an HTTP
  // 200 and no explanation, which the editor rendered as "saved". 409 = the write guard said no.
  const { ok, reason } = await store.writeResult(body?.data || {});
  return Response.json({ ok, reason, configured: store.configured }, { status: ok ? 200 : 409 });
}

export async function POST(req: Request) {
  const url = new URL(req.url);
  const page = url.searchParams.get("page") || "about";
  const site = siteOf(url.searchParams.get("site"));
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

  // ⚠️ THE STYLESHEET HAS TO GO WITH IT. A page imported from a bought design keeps its compiled
  // CSS in a separate key, on the same draft/-pub convention. Publishing the CONTENT alone put
  // the page live with no stylesheet at all — and because only inline styles survive that, the
  // result wasn't "a bit plain", it was wreckage: the grid overlay lost its `absolute inset-0`
  // and covered the whole page in cyan lines.
  //
  // Worst of all it reported success, and `?preview=1` still looked perfect — preview reads the
  // DRAFT css, so the one view you'd check to reassure yourself was the one that couldn't show
  // the problem.
  const css = await readDesignCssDraft(page, site);
  if (css) await writeDesignCss(page, css, true, site);

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
