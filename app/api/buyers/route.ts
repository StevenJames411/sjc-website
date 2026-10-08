// GET /api/buyers -> { buyers: [...] }   every book buyer with the pages they opened and the taps from their copy.
// Owner-only, like every /api route not listed public in middleware.ts. Read by the Smart Links screen in the
// design studio and, through its own server, by the dashboard.
import { ownerOnly } from "@/lib/siteAccess";
import { allBuyers } from "@/lib/bookBuyers";

export const dynamic = "force-dynamic";

export async function GET() {
  const deny = await ownerOnly();
  if (deny) return deny;
  return Response.json({ buyers: await allBuyers() }, { headers: { "Cache-Control": "private, no-store, max-age=0" } });
}
