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
  // ⛔ NOT res.cookies.set (fixed 2026-09-08). Next's ResponseCookies is keyed by NAME, so setting
  // the same name twice keeps only the last write — production emitted ONE Set-Cookie per name,
  // domain-scoped, and a host-only cookie written before 09-07 survived every "Sign out". The
  // headers are appended by hand so BOTH scopes actually reach the browser.
  const { domain } = cookieDomainFor(host);
  for (const name of COOKIES) {
    const base = `${name}=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Secure; HttpOnly; SameSite=Lax`;
    res.headers.append("Set-Cookie", base);
    if (domain) res.headers.append("Set-Cookie", `${base}; Domain=${domain}`);
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
