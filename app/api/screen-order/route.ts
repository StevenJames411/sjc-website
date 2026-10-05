// The saved section order for one studio screen of one website. Owner-only (everything under /api is,
// unless listed PUBLIC in middleware), and scoped to a site the caller may touch.
//   GET  /api/screen-order?site=<id>&screen=<name>           -> { order, noLine }
//   POST /api/screen-order?site=<id>&screen=<name> { order, noLine } -> { ok }
import { readScreenOrder, writeScreenOrder } from "@/lib/screenOrder";
import { siteOr } from "@/lib/siteAccess";
import { SJC } from "@/lib/siteKeys";

export const dynamic = "force-dynamic";
const args = (req: Request) => {
  const u = new URL(req.url);
  return { siteId: (u.searchParams.get("site") || "").trim() || SJC, screen: (u.searchParams.get("screen") || "").replace(/[^a-z0-9-]/gi, "").slice(0, 40) };
};

export async function GET(req: Request) {
  const { siteId, screen } = args(req);
  const { site, deny } = await siteOr(siteId, req);
  if (deny) return deny;
  if (!screen) return Response.json({ order: [], noLine: [] });
  return Response.json(await readScreenOrder(site.id, screen));
}

export async function POST(req: Request) {
  const { siteId, screen } = args(req);
  const { site, deny } = await siteOr(siteId, req);
  if (deny) return deny;
  const body = await req.json().catch(() => null);
  if (!screen || !Array.isArray(body?.order) || !body.order.length) return Response.json({ ok: false, error: "nothing to save" }, { status: 400 });
  const ok = await writeScreenOrder(site.id, screen, { order: body.order, noLine: Array.isArray(body.noLine) ? body.noLine : [] });
  return Response.json({ ok }, { status: ok ? 200 : 500 });
}
