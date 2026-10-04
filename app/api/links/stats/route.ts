// Read-only click breakdown for one website's links (30 days, phone vs desktop, countries).
//   GET /api/links/stats?site=<id>
import { siteOr } from "@/lib/siteAccess";
import { SJC } from "@/lib/siteKeys";
import { forwardLinks } from "@/lib/linkClients";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const raw = new URL(req.url).searchParams.get("site");
  const { site, deny } = await siteOr(String(raw || "").trim() || SJC, req);
  if (deny) return deny;
  return forwardLinks("stats", site.id);
}
