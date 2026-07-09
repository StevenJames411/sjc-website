// Editor sign-out. Clears the auth cookie so the owner returns to the public view.
// Open (not gated) so it can always be reached; clearing a cookie is harmless.
import { NextResponse } from "next/server";

const COOKIE_NAME = "sjc_site_auth";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  // Delete + explicitly expire (belt and suspenders for the httpOnly cookie).
  res.cookies.delete(COOKIE_NAME);
  res.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
  return res;
}
