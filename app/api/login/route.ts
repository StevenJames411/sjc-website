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
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
  return res;
}
