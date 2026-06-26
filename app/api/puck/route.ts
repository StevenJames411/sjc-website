// Cloud persistence for Puck-built pages (the /about pilot). Mirrors /api/site-content:
//   GET  /api/puck?page=about[&pub=1]      -> { data }     (draft, or published snapshot)
//   PUT  /api/puck   { page, data }        -> { ok }       (save the working draft)
//   POST /api/puck?page=about&action=publish|unpublish     (snapshot draft -> live, or clear)
// All routes are gated by middleware (only the signed-in owner can reach the private site).
import { createKvStore } from "@/lib/kvStateStore";
import { getClient } from "@/lib/kvRedis";
import { puckKey } from "@/lib/puckContent";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const page = url.searchParams.get("page") || "about";
  const pub = url.searchParams.get("pub") === "1";
  const store = createKvStore(getClient(), puckKey(page, pub));
  return Response.json({ data: (await store.read()) || null });
}

export async function PUT(req: Request) {
  let body: { page?: string; data?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "bad json" }, { status: 400 });
  }
  const store = createKvStore(getClient(), puckKey(body?.page || "about"));
  const ok = await store.write(body?.data || {});
  return Response.json({ ok, configured: store.configured });
}

export async function POST(req: Request) {
  const url = new URL(req.url);
  const page = url.searchParams.get("page") || "about";
  const client = getClient();
  const pub = createKvStore(client, puckKey(page, true));

  if (url.searchParams.get("action") === "unpublish") {
    const ok = await pub.write({}); // no _pub marker -> public falls back to the hand-coded page
    return Response.json({ ok, published: false });
  }

  // publish: snapshot the live draft and stamp it published
  const draft = createKvStore(client, puckKey(page));
  const data = ((await draft.read()) || {}) as Record<string, unknown>;
  const ok = await pub.write({ ...data, _pub: 1 });
  return Response.json({ ok, published: true });
}
