// A BUYER'S OWN LINK:  /b/<code>/<slug>  (lib/bookBuyers.ts)
// The links inside a buyer's signature copy come here first. The tap is logged under the buyer's name, with
// whether it came from the buyer's own device, and then handed to /go/<slug>, the ordinary smart link, which
// counts it as it always has. An unknown code or a made-up slug still ends up somewhere sensible.
import { buyerFromCookie, logTap, readBuyer } from "@/lib/bookBuyers";

export const dynamic = "force-dynamic";

export async function GET(req: Request, ctx: { params: Promise<{ code: string; slug: string }> }) {
  const { code, slug } = await ctx.params;
  const safe = /^[a-z0-9-]{1,80}$/.test(slug) ? slug : "site";
  if (await readBuyer(code)) {
    const ua = req.headers.get("user-agent") || "";
    await logTap(code, {
      link: safe,
      own: buyerFromCookie(req.headers.get("cookie")) === code,
      device: /iPhone|Android.+Mobile/i.test(ua) ? "phone" : /iPad|Android/i.test(ua) ? "tablet" : "laptop",
      country: req.headers.get("x-vercel-ip-country") || "",
    });
  }
  return Response.redirect(`https://stevenjamesconsulting.com/go/${safe}`, 302);
}
