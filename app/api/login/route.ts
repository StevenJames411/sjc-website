// Editor sign-in. Validates the password against SITE_EDIT_PASSWORD and, on success,
// sets the auth cookie that middleware checks before allowing any content write.
// Posted as JSON from the edit toolbar's login box; returns { ok }.
import { NextResponse } from "next/server";

const COOKIE_NAME = "sjc_site_auth";

export async function POST(req: Request) {
  const pass = process.env.SITE_EDIT_PASSWORD;
  const user = process.env.SITE_EDIT_USER || "steven";

  let submitted = "";
  const ct = req.headers.get("content-type") || "";
  if (ct.includes("application/x-www-form-urlencoded")) {
    const form = await req.formData();
    submitted = String(form.get("password") || "");
  } else {
    try {
      const body = await req.json();
      submitted = String(body?.password || "");
    } catch {
      submitted = "";
    }
  }

  if (!pass || submitted !== pass) {
    const res = NextResponse.json({ ok: false }, { status: 401 });
    res.cookies.delete(COOKIE_NAME);
    return res;
  }

  const token = Buffer.from(`${user}:${pass}`).toString("base64");
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    // ⛔ LAX, NOT STRICT — AND STRICT SILENTLY BROKE `?preview=1` FROM ANY LINK (2026-08-30).
    //
    // Strict withholds this cookie on every CROSS-SITE navigation, and "cross-site" includes a
    // link clicked from anywhere that is not this domain: a file:// page on Steven's own Desktop,
    // a URL he texts himself, a bookmark from another app. The request then arrives ANONYMOUS —
    // and middleware's preview branch is deliberately quiet about that, because an
    // unauthenticated ?preview=1 falls through to the PUBLISHED page rather than throwing up a
    // login wall on a public URL. On an unpublished draft, "falls through" is a bare 404.
    //
    // ⚠️ IT LOOKED LIKE TEN BROKEN LINKS AND WAS ONE COOKIE FLAG. Typing the same URL into the
    // address bar worked — Chrome counts that as same-site — which is exactly the check you would
    // run to disprove it, so the evidence pointed away from the cause.
    //
    // Lax still refuses cross-site POSTs, iframes and XHR, so the CSRF posture is unchanged; it
    // only allows a top-level GET, which is what a person clicking a link is doing. The
    // magic-link session cookie (app/api/auth/magic) has always been `lax` — this was the odd
    // one out, not the standard.
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
  return res;
}
