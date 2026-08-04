// Saves the order Steven dragged the roster into. Owner-only: /api/board-order is matched by
// middleware's isProtected via the /api/sites-style list — see the note there if you add routes.
//
// Deliberately dumb: it takes a list of keys and stores it. It does NOT validate that every key is
// a live site, because the merge in lib/boardOrder.ts already tolerates stale keys (they simply
// match nothing) and rejecting them here would mean a save could fail while Steven is mid-drag.
import { writeBoardOrder } from "@/lib/boardOrder";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const order = Array.isArray(body?.order) ? body.order : null;
    if (!order) return Response.json({ ok: false, error: "order must be an array" }, { status: 400 });

    // ⛔ AN EMPTY LIST IS NOT A SAVE. Storing [] means "he has never arranged anything", which
    // silently reverts him to worst-first — a wipe disguised as a write. A client with no rows
    // has nothing to save anyway.
    if (!order.length) return Response.json({ ok: false, error: "refusing to store an empty order" }, { status: 400 });

    const ok = await writeBoardOrder(order);
    return Response.json({ ok }, { status: ok ? 200 : 500 });
  } catch (e) {
    return Response.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}
