// Publish control for a page. The editor writes its working copy to `sjc-site-<page>`.
// The public site reads the PUBLISHED snapshot `sjc-site-<page>-pub`, and only when it
// carries a `_pub` marker — so live edits stay private until the owner publishes.
//   POST /api/site-content/publish?page=home                  -> copy draft -> pub (LIVE)
//   POST /api/site-content/publish?page=home&action=unpublish -> clear pub  (back to defaults)
// Gated by middleware (only the signed-in editor can publish).
import { createKvStore } from "@/lib/kvStateStore";
import { getClient } from "@/lib/kvRedis";
import { keyFor } from "@/lib/contentShared";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const url = new URL(req.url);
  const page = url.searchParams.get("page");
  if (!page) return Response.json({ ok: false, error: "no page" }, { status: 400 });

  const client = getClient();
  const pub = createKvStore(client, keyFor(page) + "-pub");

  if (url.searchParams.get("action") === "unpublish") {
    const ok = await pub.write({}); // empty blob, no _pub marker -> public falls back to defaults
    return Response.json({ ok, published: false, configured: pub.configured });
  }

  // publish: snapshot the live draft and stamp it published
  const work = createKvStore(client, keyFor(page));
  const state = ((await work.read()) || {}) as Record<string, unknown>;
  const ok = await pub.write({ ...state, _pub: 1 });
  return Response.json({ ok, published: true, configured: pub.configured });
}
