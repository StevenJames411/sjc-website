// POST /api/buyer-view { path }  -> 204
// One page view by a book buyer, logged under their name (lib/bookBuyers.ts). The signed cookie set on their
// download page says who they are; without it this does nothing. Always 204, so it tells a stranger nothing.
import { buyerFromCookie, logView } from "@/lib/bookBuyers";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const code = buyerFromCookie(req.headers.get("cookie"));
  if (code) {
    const body = (await req.json().catch(() => ({}))) as { path?: string };
    const path = String(body.path || "");
    if (/^\/[A-Za-z0-9\-_/]*$/.test(path)) await logView(code, path || "/");
  }
  return new Response(null, { status: 204 });
}
