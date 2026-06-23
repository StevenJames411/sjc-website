import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// PUBLIC SITE — unlike the private cockpit (which locks everything), this gate touches
// ONLY content-write requests. Every page view and every read stays wide open. The
// matcher below is scoped to /api/site-content/* so middleware never runs on the site
// itself. Within that, GET (reads) pass; PUT/POST (writes/publish) require the editor
// cookie. So anyone can view, only the signed-in editor can change anything.

const COOKIE_NAME = "sjc_site_auth";

function expectedToken(): string | null {
  const pass = process.env.SITE_EDIT_PASSWORD;
  if (!pass) return null; // no password set -> writes are refused (reads still fine)
  const user = process.env.SITE_EDIT_USER || "steven";
  return Buffer.from(`${user}:${pass}`).toString("base64");
}

export function middleware(req: NextRequest) {
  if (req.method === "GET") return NextResponse.next(); // reads are public

  const expected = expectedToken();
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (expected && token === expected) return NextResponse.next();

  return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
}

export const config = {
  // Only run on content endpoints — the public site and all other routes are untouched.
  // Both the base (save PUT) and the /publish subpath (POST) must be covered.
  matcher: ["/api/site-content", "/api/site-content/:path*"],
};
