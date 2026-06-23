// Cloud persistence for a page's editable content (text overrides + section order).
// One blob per page on the shared Upstash drawer, key `sjc-site-<page>` (draft) and
// `sjc-site-<page>-pub` (published snapshot). GET is public so pages can read content;
// PUT is gated by middleware (only the signed-in editor can write).
import { createKvStore } from "@/lib/kvStateStore";
import { getClient } from "@/lib/kvRedis";
import { keyFor } from "@/lib/contentShared";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const page = url.searchParams.get("page") || "home";
  const pub = url.searchParams.get("pub") === "1";
  const store = createKvStore(getClient(), keyFor(page) + (pub ? "-pub" : ""));
  return Response.json({ configured: store.configured, state: (await store.read()) || {} });
}

export async function PUT(req: Request) {
  let body: { page?: string; state?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "bad json" }, { status: 400 });
  }
  const store = createKvStore(getClient(), keyFor(body?.page || "home"));
  const ok = await store.write(body?.state || {});
  return Response.json({ ok, configured: store.configured });
}
