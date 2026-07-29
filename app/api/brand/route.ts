// The site's global brand: read, save a draft, publish it.
// Same draft/published split the page content uses — the live site only reads published.
import { readBrand, writeBrand, normalize, BRAND_DEFAULTS } from "@/lib/brand";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const pub = new URL(req.url).searchParams.get("pub") === "1";
  return Response.json({ ok: true, brand: await readBrand(pub), defaults: BRAND_DEFAULTS });
}

// Save the working copy. Nothing here reaches the public site until it's published.
export async function PUT(req: Request) {
  let body: unknown;
  try { body = await req.json(); }
  catch { return Response.json({ ok: false, error: "bad json" }, { status: 400 }); }

  const ok = await writeBrand(normalize((body as { brand?: unknown })?.brand), false);
  return Response.json({ ok, error: ok ? undefined : "could not save — storage unreachable" });
}

// action=publish  → copy draft to published
// action=reset    → put the site back to the shipped defaults (publishes immediately)
export async function POST(req: Request) {
  let body: { action?: string } = {};
  try { body = await req.json(); } catch { /* no body → treated as unknown action */ }

  if (body.action === "publish") {
    const draft = await readBrand(false);
    const ok = await writeBrand(draft, true);
    return Response.json({ ok, brand: draft });
  }
  if (body.action === "reset") {
    // The way back. Whatever a brand experiment did, this returns the site to as-shipped.
    const a = await writeBrand(BRAND_DEFAULTS, false);
    const b = await writeBrand(BRAND_DEFAULTS, true);
    return Response.json({ ok: a && b, brand: BRAND_DEFAULTS });
  }
  return Response.json({ ok: false, error: "unknown action" }, { status: 400 });
}
