import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// PRIVATE SITE (pre-launch) — the whole website is gated behind ONE app password,
// mirroring the private cockpit (sjc-cockpit/middleware.js). Only the signed-in owner
// can view OR edit; nobody else sees it. This replaces Vercel's paid "Require Log In"
// gate (which is turned OFF at the Vercel project level). When the site goes public,
// relax the matcher or add a public path allow (the /share/ branch is reserved for that).
//
// Required env: SITE_EDIT_PASSWORD  (set in Vercel, never committed; set to the SAME
//               value as the cockpit's COCKPIT_PASSWORD so one password unlocks both)
// Optional env: SITE_EDIT_USER (defaults to "steven")

const COOKIE_NAME = "sjc_site_auth";

function expectedToken(): string | null {
  const pass = process.env.SITE_EDIT_PASSWORD;
  if (!pass) return null; // no password set -> fail closed (locked)
  const user = process.env.SITE_EDIT_USER || "steven";
  return Buffer.from(`${user}:${pass}`).toString("base64");
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

  // The login API handles itself (must stay open so the login form can post).
  if (pathname.startsWith("/api/login")) return NextResponse.next();

  // Reserved: public client-share pages (none yet) — mirrors the cockpit so the
  // shareable-link pattern is ready the day the site wants one.
  if (pathname.startsWith("/share/")) return NextResponse.next();

  const expected = expectedToken();
  if (!expected) {
    // Fail closed: no password configured means the site stays locked.
    return new NextResponse(
      '<!DOCTYPE html><html><body style="font-family:sans-serif;background:#0b1220;color:#e5e7eb;padding:40px"><h1>Site locked</h1><p>SITE_EDIT_PASSWORD is not set. Configure it in the deployment environment.</p></body></html>',
      { status: 503, headers: { "Content-Type": "text/html" } }
    );
  }

  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (token === expected) return NextResponse.next();

  // No valid cookie: APIs get a JSON 401; page views get the login page.
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
