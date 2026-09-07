// Sign-out. Clears BOTH sessions and returns to the public view.
// Open (not gated) so it can always be reached; clearing a cookie is harmless.
import { NextResponse } from "next/server";
import { cookieDomainFor } from "@/lib/authCookie";

// ⛔ THERE ARE TWO SESSIONS NOW, AND THIS KNEW ABOUT ONE (fixed 2026-08-12).
//   sjc_site_auth — Steven's password login
//   sjc_id        — a client's magic-link session
// Clearing only the first meant a client pressing "Sign out" stayed signed in, on what is
// usually a shared or family device. A sign-out that does not sign you out is worse than no
// sign-out button, because the button is the reassurance.
const COOKIES = ["sjc_site_auth", "sjc_id"];

function clear(res: NextResponse, host: string | null): NextResponse {
  for (const name of COOKIES) {
    // Delete + explicitly expire (belt and suspenders for the httpOnly cookie).
    res.cookies.delete(name);
    // Cleared twice: host-only (how sjc_id and the pre-09-07 owner cookie were written) AND under
    // the studio domain (how the owner cookie is written now). A cookie cleared under different
    // attributes than it was written with is not reliably cleared at all.
    for (const scope of [{}, cookieDomainFor(host)]) {
      res.cookies.set(name, "", {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
        maxAge: 0,
        ...scope,
      });
    }
  }
  return res;
}

export async function POST(req: Request) {
  return clear(NextResponse.json({ ok: true }), req.headers.get("host"));
}

/**
 * ⚠️ GET TOO, because a sign-out LINK is a GET. The client shell's "Sign out" is an anchor — the
 * right control for a page a contractor reads on a phone — and against a POST-only route it did
 * nothing at all, silently.
 */
export async function GET(req: Request) {
  return clear(NextResponse.redirect(new URL("/", req.url), { status: 302 }), req.headers.get("host"));
}
