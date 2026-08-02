// Saves the back office's own menu. Owner-only — see middleware's isProtected.
//
// Everything arriving here goes through mergeNav before it is stored, so the document in Postgres
// is always normalised: known keys only, hrefs from code, labels from Steven. There is no shape a
// caller can post that makes a link point somewhere new.
import { writeNav } from "@/lib/editNav";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // ⛔ AN EMPTY MENU IS NOT A SAVE. A rail with no entries is a back office with no way out of
    // whatever page you happen to be on — and no way to reach the editor that would fix it.
    if (!Array.isArray(body?.entries) || !body.entries.length) {
      return Response.json({ ok: false, error: "refusing to store an empty menu" }, { status: 400 });
    }

    const ok = await writeNav(body);
    return Response.json({ ok }, { status: ok ? 200 : 500 });
  } catch (e) {
    return Response.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}
