// Which client the link service files a site's links under. The studio calls the flagship
// "sjc-website"; the service has always called it "sjc". Every other site uses its own id.
import { SJC } from "./siteKeys";

const BASE = "https://agent-sjc.onrender.com/go-admin/api";

export const linkClientFor = (siteId: string) => (siteId === SJC ? "sjc" : siteId);

/** Forward one call to the link service as the studio. 503 with a plain message when no key is set. */
export async function forwardLinks(
  path: string,
  siteId: string,
  init: { method?: string; body?: string } = {}
): Promise<Response> {
  const key = process.env.GO_ADMIN_KEY;
  if (!key) {
    return Response.json({ ok: false, error: "Smart Links is not switched on yet." }, { status: 503 });
  }
  try {
    const res = await fetch(`${BASE}/${path}?c=${encodeURIComponent(linkClientFor(siteId))}`, {
      method: init.method || "GET",
      headers: { "X-Dashboard-Token": key, ...(init.body ? { "Content-Type": "application/json" } : {}) },
      body: init.body,
      cache: "no-store",
    });
    const text = await res.text();
    return new Response(text, { status: res.status, headers: { "Content-Type": "application/json" } });
  } catch {
    return Response.json({ ok: false, error: "Could not reach the link service." }, { status: 502 });
  }
}
