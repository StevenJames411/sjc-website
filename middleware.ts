import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// PUBLIC SITE (launched 2026-07-09) — the website is live to the general public. Only the
// owner-edit + admin surfaces stay gated behind the app password (mirroring the private
// cockpit). Public page views render server-side from Upstash and need no auth. To take the
// whole site private again (e.g. a rebuild), set PROTECTED below to always-true.
//
// GATED (owner-only, require the sjc_site_auth cookie): /edit/*, /api/puck, /api/pages,
//   /api/site-content (draft read + publish), /api/upload.
// OPEN: every public page + /api/login, /api/auth-status (self-reports authed:false),
//   /api/apply, /api/guest, /api/send-roadmap (public form posts).
//
// Required env: SITE_EDIT_PASSWORD  (set in Vercel, never committed; set to the SAME
//               value as the cockpit's COCKPIT_PASSWORD so one password unlocks both)
// Optional env: SITE_EDIT_USER (defaults to "steven")

// The owner-only surfaces. Everything NOT matched here is public.
function isProtected(pathname: string): boolean {
  return (
    pathname === "/edit" ||
    pathname.startsWith("/edit/") ||
    pathname.startsWith("/api/puck") ||
    pathname.startsWith("/api/pages") ||
    // The website registry + the importer. Both create and destroy client sites, so they are
    // owner-only for the same reason /api/pages is.
    pathname.startsWith("/api/sites") ||
    // The form library. Owner-only: the public site never reads it (a preset is copied into the
    // page when it's picked), so nothing legitimate calls this from a visitor's browser.
    pathname.startsWith("/api/forms") ||
    // The invoice book. Owner-only for the obvious reason: it records who was billed what.
    pathname.startsWith("/api/invoices") ||
    pathname.startsWith("/api/import-html") ||
    pathname.startsWith("/api/adopt-images") ||
    // One-time maintenance routes. They create and rewrite stored content, so they are owner-only
    // — an unauthenticated /api/admin/* is a stranger with write access to every client's site.
    pathname.startsWith("/api/admin") ||
    pathname.startsWith("/api/site-content") ||
    pathname.startsWith("/api/upload")
  );
}

const COOKIE_NAME = "sjc_site_auth";

// Internal request header meaning "this request is an authenticated owner asking for the draft".
// Set ONLY by middleware, and stripped from every inbound request first — see middleware().
// lib/puckContent.ts reads it. Nothing else should set it.
export const PREVIEW_HEADER = "x-sjc-preview";

function expectedToken(): string | null {
  const pass = process.env.SITE_EDIT_PASSWORD;
  if (!pass) return null; // no password set -> fail closed (locked)
  const user = process.env.SITE_EDIT_USER || "steven";
  return Buffer.from(`${user}:${pass}`).toString("base64");
}

// MACHINE CREDENTIAL (added 2026-07-30). The cookie above only exists inside a browser, so
// every scripted edit — a draft save, an import, a bulk change — had to be hand-driven through
// Chrome. SITE_EDIT_TOKEN is the same trick the backup cron already uses (Bearer CRON_SECRET):
// a bearer token that lets code reach these routes directly.
//
// Deliberately narrow:
//   - /api/* ONLY. Never the /edit pages — a leaked token must not hand somebody the editor UI,
//     and there is no reason a script needs HTML.
//   - Refuses anything under 32 chars, so a weak or half-set value fails closed instead of
//     quietly becoming the weakest way in.
//   - Constant-time compare: Buffer.compare / crypto aren't available in the edge runtime, and
//     `===` on secrets leaks length and prefix through timing.
// Keep the value in 1Password and inject it (`op run`). Unlike the cookie it never expires.
function bearerAuthorized(req: NextRequest, pathname: string): boolean {
  if (!pathname.startsWith("/api/")) return false;
  const secret = process.env.SITE_EDIT_TOKEN;
  if (!secret || secret.length < 32) return false;

  const header = req.headers.get("authorization") || "";
  if (!header.startsWith("Bearer ")) return false;
  const presented = header.slice(7).trim();
  if (presented.length !== secret.length) return false;

  let diff = 0;
  for (let i = 0; i < secret.length; i++) diff |= presented.charCodeAt(i) ^ secret.charCodeAt(i);
  return diff === 0;
}

// Is this request the owner, by either door — browser cookie or machine token?
function isOwner(req: NextRequest, pathname: string): boolean {
  const expected = expectedToken();
  if (expected === null) return false; // no password configured -> nobody is the owner
  if (req.cookies.get(COOKIE_NAME)?.value === expected) return true;
  return bearerAuthorized(req, pathname);
}

function loginPage(error: boolean): string {
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Steven James Consulting — Sign in</title>
<style>*{box-sizing:border-box;margin:0;padding:0}body{background:#0b1220;color:#e5e7eb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center}.card{background:#111a2e;border:1px solid #1f2a44;border-radius:12px;padding:40px;width:100%;max-width:360px}h1{font-size:18px;font-weight:700;margin-bottom:6px;color:#f9fafb}p{font-size:14px;color:#93a4c4;margin-bottom:28px}label{display:block;font-size:13px;font-weight:600;color:#e5e7eb;margin-bottom:6px}input{width:100%;background:#0b1220;border:1px solid #2a3658;border-radius:6px;color:#e5e7eb;padding:10px 12px;font-size:15px;margin-bottom:16px;outline:none}input:focus{border-color:#3b82f6}button{width:100%;background:#3b82f6;color:#fff;border:none;border-radius:6px;padding:11px;font-size:15px;font-weight:600;cursor:pointer;margin-top:4px}button:hover{background:#2563eb}.error{display:${error ? "block" : "none"};background:#3f1515;border:1px solid #7f1d1d;border-radius:6px;padding:10px 12px;font-size:13px;color:#fca5a5;margin-bottom:16px}</style>
</head><body><div class="card"><h1>Steven James Consulting</h1><p>Private &middot; sign in to view &amp; edit</p>
<div class="error" id="err">Incorrect password.</div>
<form id="f"><label>Password</label><input type="password" name="password" autocomplete="current-password" autofocus required><button type="submit">Enter</button></form></div>
<script>
var f=document.getElementById('f'),err=document.getElementById('err');
f.onsubmit=async function(e){e.preventDefault();err.style.display='none';
  try{var r=await fetch('/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:f.password.value})});
    if(r.ok){location.href='/';}else{err.style.display='block';f.password.value='';f.password.focus();}
  }catch(x){err.style.display='block';}
};
</script>
</body></html>`;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const authed = isOwner(req, pathname);

  // PREVIEW MODE (added 2026-07-30). `?preview=1` on any public URL renders the DRAFT through
  // the real public template — same layout, same CSS, same everything a visitor gets — so a
  // change can be checked on an actual phone before Publish. Previously the only way to see a
  // draft was the editor canvas, wedged between two panels, which is why "how will this look on
  // mobile?" was unanswerable.
  //
  // The flag travels as a REQUEST HEADER, not a query string the page re-reads, so lib/
  // puckContent can honour it without every call site having to opt in.
  //
  // Two things this must not do:
  //   1. Let a stranger read unpublished work. The header is only ever set for an authenticated
  //      owner; an unauthenticated ?preview=1 silently falls through to the published page
  //      rather than throwing up a login wall on a public URL (no login prompt where a visitor
  //      wouldn't expect one, and no hint that preview exists at all).
  //   2. Be forgeable. Any inbound x-sjc-preview is DELETED first — a visitor can send that
  //      header themselves, and without this line it would be a free read of every draft.
  const wantsPreview = req.nextUrl.searchParams.get("preview") === "1";
  const forward = (preview: boolean) => {
    const headers = new Headers(req.headers);
    headers.delete(PREVIEW_HEADER);
    if (preview) headers.set(PREVIEW_HEADER, "1");
    return NextResponse.next({ request: { headers } });
  };

  // PUBLIC: the site is live. Everything except the owner-edit/admin surfaces is open.
  if (!isProtected(pathname)) return forward(wantsPreview && authed);

  if (expectedToken() === null) {
    // Fail closed: no password configured means the site stays locked.
    return new NextResponse(
      '<!DOCTYPE html><html><body style="font-family:sans-serif;background:#0b1220;color:#e5e7eb;padding:40px"><h1>Site locked</h1><p>SITE_EDIT_PASSWORD is not set. Configure it in the deployment environment.</p></body></html>',
      { status: 503, headers: { "Content-Type": "text/html" } }
    );
  }

  if (authed) return forward(wantsPreview);

  // No valid credential: APIs get a JSON 401; page views get the login page.
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const showError = req.nextUrl.searchParams.get("e") === "1";
  return new NextResponse(loginPage(showError), {
    status: 401,
    headers: { "Content-Type": "text/html" },
  });
}

export const config = {
  // Protect everything except Next internals and static assets (mirror the cockpit).
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
