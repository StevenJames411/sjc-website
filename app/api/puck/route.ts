// Cloud persistence for Puck-built pages. Every call takes a `site`, defaulting to SJC.
//   GET  /api/puck?page=about&site=<id>[&pub=1]  -> { data }   (draft, or published snapshot)
//   PUT  /api/puck   { page, site, data }        -> { ok }     (save the working draft)
//   POST /api/puck?page=about&site=<id>&action=publish|unpublish
// All routes are gated by middleware (only the signed-in owner can reach them).
import { createKvStore } from "@/lib/kvStateStore";
import { getClient } from "@/lib/store";
import { puckKey } from "@/lib/puckContent";
import { SJC } from "@/lib/siteKeys";

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
  const ok = await store.write(body?.data || {});
  return Response.json({ ok, configured: store.configured });
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
  return Response.json({ ok, published: true });
}
