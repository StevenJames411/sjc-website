// One Smart Link: PUT changes it, DELETE removes it. ?site=<id> says whose it is.
import { siteOr } from "@/lib/siteAccess";
import { SJC } from "@/lib/siteKeys";
import { forwardLinks } from "@/lib/linkClients";

export const dynamic = "force-dynamic";

const siteFrom = (v: unknown) => String(v || "").trim() || SJC;

type Ctx = { params: Promise<{ slug: string }> };

export async function PUT(req: Request, { params }: Ctx) {
  const { site, deny } = await siteOr(siteFrom(new URL(req.url).searchParams.get("site")), req);
  if (deny) return deny;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "bad json" }, { status: 400 });
  }
  const { slug } = await params;
  return forwardLinks(`links/${encodeURIComponent(slug)}`, site.id, { method: "PUT", body: JSON.stringify(body) });
}

export async function DELETE(req: Request, { params }: Ctx) {
  const { site, deny } = await siteOr(siteFrom(new URL(req.url).searchParams.get("site")), req);
  if (deny) return deny;
  const { slug } = await params;
  return forwardLinks(`links/${encodeURIComponent(slug)}`, site.id, { method: "DELETE" });
}
