// Smart Links for one website, passed through to the link service:
//   GET  /api/links?site=<id>            -> the site's links
//   POST /api/links?site=<id> { slug, destination, name, note } -> add one
// Owner-only like every /api route; siteOr decides which site the caller may touch.
import { siteOr } from "@/lib/siteAccess";
import { SJC } from "@/lib/siteKeys";
import { forwardLinks } from "@/lib/linkClients";

export const dynamic = "force-dynamic";

const siteFrom = (v: unknown) => String(v || "").trim() || SJC;

export async function GET(req: Request) {
  const { site, deny } = await siteOr(siteFrom(new URL(req.url).searchParams.get("site")), req);
  if (deny) return deny;
  return forwardLinks("links", site.id);
}

export async function POST(req: Request) {
  const { site, deny } = await siteOr(siteFrom(new URL(req.url).searchParams.get("site")), req);
  if (deny) return deny;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "bad json" }, { status: 400 });
  }
  return forwardLinks("links", site.id, { method: "POST", body: JSON.stringify(body) });
}
