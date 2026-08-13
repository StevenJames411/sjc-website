import { NextResponse } from "next/server";
import { IDENTITY_HEADER as ID_HEADER, SESSION_COOKIE, verifyIdentity, ownerIdentity, signIdentity } from "./lib/identity";
import type { NextRequest } from "next/server";
import { normalizeHost, STUDIO_HOST } from "@/lib/hostShared";

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

/**
 * The genuinely PUBLIC API routes. Everything else under /api is owner-only.
 *
 * ⛔ INVERTED 2026-08-12, AND THE INVERSION IS THE POINT. This used to enumerate the PROTECTED
 * routes, so a route that wasn't on the list was public — deny by omission. Which means every
 * route added later by anyone who never read this file shipped open to the internet. Three had:
 *
 *   • /api/sections — read, write and DELETE of the shared section library, unauthenticated. GET
 *     with `full=1` handed back every string in a saved band: the phone numbers in its link hrefs,
 *     the copy, the photo URLs.
 *   • /api/brand — took the site from the request and wrote the PUBLISHED brand key, so a single
 *     POST repainted any site's colours and fonts live, with no publish step involved.
 *   • /api/versions — POST restored any page of any site to any earlier revision, so the owner's
 *     next Publish shipped content they never wrote.
 *
 * None of that was a decision anyone made. It was the default. Listing what is PUBLIC makes a new
 * route protected until somebody deliberately opens it, and the deliberate act is adding a line
 * here with a reason next to it.
 */
const PUBLIC_API = [
  "/api/login",
  "/api/logout",
  "/api/auth-status", // self-reports authed:false; never leaks state
  // ⛔ MUST BE PUBLIC, and it is safe to be. A client arriving from the link in their inbox has no
  // cookie yet — that is the whole point of the request — so gating this route behind the login
  // makes the sign-in flow require being signed in. POST answers `ok` for every address so it
  // leaks nothing, and GET is worthless without a 64-hex single-use token.
  "/api/auth/magic",
  "/api/apply", // the public lead form
  "/api/guest", // podcast guest intake
  "/api/careers",
  "/api/send-roadmap",
  "/api/intake", // the client's own onboarding link — gated by its own capability token
  "/api/lead-problem",
  "/api/board-status", // read-only health for the status board
  "/api/health",
  "/api/cron", // gated by CRON_SECRET, not by the owner cookie
  "/api/stripe", // Stripe's own signature is the gate
];

// The owner-only surfaces: the whole editor, plus every API route not explicitly made public.
function isProtected(pathname: string): boolean {
  if (pathname === "/edit" || pathname.startsWith("/edit/")) return true;
  if (pathname === "/account" || pathname.startsWith("/account/")) return true;
  if (!pathname.startsWith("/api/")) return false; // public pages stay public
  return !PUBLIC_API.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

const COOKIE_NAME = "sjc_site_auth";

// Internal request header meaning "this request is an authenticated owner asking for the draft".
// Set ONLY by middleware, and stripped from every inbound request first — see middleware().
// lib/puckContent.ts reads it. Nothing else should set it.
export const PREVIEW_HEADER = "x-sjc-preview";

/**
 * "This request is the signed-in owner." Set ONLY here, and stripped from every inbound request
 * first, exactly like PREVIEW_HEADER.
 *
 * ⚠️ WITHOUT THIS, DRAFT LOCKS STEVEN OUT TOO. Draft means the address 404s — which is the point —
 * but it must not mean HE cannot open his own site on a phone. `resolveHost` serves a draft site
 * when this header is present, so the same URL is a 404 in a private window and the real page for
 * him. The builder canvas is a different surface and would not have covered it: "how does this
 * look on an actual phone" is the question preview exists to answer.
 */
export const OWNER_HEADER = "x-sjc-owner";

/**
 * ⛔ THE THIRD STAMPED HEADER, AND THE ONE THAT MATTERS MOST. Carries WHO the caller is and which
 * websites are theirs — see lib/identity.ts. Stripped inbound and re-stamped here for the same
 * reason as the two above: a request that can assert its own identity has no security model.
 *
 * Middleware stays the ONLY authenticator. Routes read this header through
 * lib/siteAccess.assertSiteAccess and never parse a cookie themselves.
 */
export { IDENTITY_HEADER } from "./lib/identity";

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
<style>*{box-sizing:border-box;margin:0;padding:0}body{background:#0b1220;color:#e5e7eb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center}.card{background:#111a2e;border:1px solid #1f2a44;border-radius:12px;padding:40px;width:100%;max-width:360px}h1{font-size:18px;font-weight:700;margin-bottom:6px;color:#f9fafb}p{font-size:14px;color:#93a4c4;margin-bottom:28px}label{display:block;font-size:13px;font-weight:600;color:#e5e7eb;margin-bottom:6px}input{width:100%;background:#0b1220;border:1px solid #2a3658;border-radius:6px;color:#e5e7eb;padding:10px 12px;font-size:15px;margin-bottom:16px;outline:none}input:focus{border-color:#3b82f6}button{width:100%;background:#3b82f6;color:#fff;border:none;border-radius:6px;padding:11px;font-size:15px;font-weight:600;cursor:pointer;margin-top:4px}button:hover{background:#2563eb}.sep{display:flex;align-items:center;gap:10px;margin:22px 0 18px;color:#5b6b8c;font-size:12px}.sep:before,.sep:after{content:'';flex:1;height:1px;background:#1f2a44}button.ghost{background:transparent;border:1px solid #2a3658;color:#cbd5e1}button.ghost:hover{background:#16203a}.sent{display:none;background:#10241a;border:1px solid #1e5138;border-radius:6px;padding:12px 14px;font-size:13px;color:#86efac;line-height:1.5}.error{display:${error ? "block" : "none"};background:#3f1515;border:1px solid #7f1d1d;border-radius:6px;padding:10px 12px;font-size:13px;color:#fca5a5;margin-bottom:16px}</style>
</head><body><div class="card"><h1>Steven James Consulting</h1><p>Private &middot; sign in to view &amp; edit</p>
<div class="error" id="err">Incorrect password.</div>
<form id="f"><label>Password</label><input type="password" name="password" autocomplete="current-password" autofocus required><button type="submit">Enter</button></form>
<div class="sep"><span>or</span></div>
<form id="m"><label>Your email</label><input type="email" name="email" autocomplete="email" placeholder="you@yourbusiness.com" required><button type="submit" class="ghost">Email me a sign-in link</button></form>
<div class="sent" id="sent">Check your email. If that address is on a website of ours, a link is on its way \u2014 it works once, for the next 15 minutes.</div>
</div>
<script>
var f=document.getElementById('f'),err=document.getElementById('err');
f.onsubmit=async function(e){e.preventDefault();err.style.display='none';
  try{var r=await fetch('/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:f.password.value})});
    if(r.ok){location.href='/';}else{err.style.display='block';f.password.value='';f.password.focus();}
  }catch(x){err.style.display='block';}
};
// ⛔ THE SAME MESSAGE WHATEVER HAPPENS. The route already answers ok for an unknown address so it
// cannot be used to ask "is this person your client"; showing "no such account" here would hand
// back exactly what the route refuses to say.
var m=document.getElementById('m'),sent=document.getElementById('sent');
m.onsubmit=async function(e){e.preventDefault();
  var b=m.querySelector('button');b.disabled=true;b.textContent='Sending\u2026';
  try{await fetch('/api/auth/magic',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:m.email.value})});}catch(x){}
  m.style.display='none';sent.style.display='block';
};
</script>
</body></html>`;
}

/**
 * ONE BRAND, ONE ROOT — everything on stevenjamesdesigns.com moves to the consulting domain.
 *
 * ⛔ THIS USED TO POINT THE OTHER WAY, AND THE REASONING EXPIRED (fixed 2026-08-12). It read: "the
 * builder is a Steven James DESIGNS product; Consulting is one row in its library" — true before
 * the brands merged, and false the moment they did. STUDIO_HOST moved to the consulting domain on
 * 08-11, which quietly turned this redirect into a no-op consulting→consulting while
 * `stevenjamesdesigns.com/edit` carried on serving the builder perfectly happily.
 *
 * So the studio had two working front doors and the legacy one is what ended up in the address bar
 * all day. Steven, looking at it: *"the root URL for the entire design studio is incorrect."*
 *
 * A redirect, not a second correct-looking home: two addresses that both work is exactly how the
 * wrong one ends up in a screenshot.
 *
 * ⚠️ WHOLE-HOST, NOT JUST /edit. Every path moves, because the point is that the old brand's root
 * is retired — a redirect that covered only the builder would leave the same problem on every
 * other page. Demo subdomains, custom domains, *.vercel.app and localhost fall through untouched,
 * so a client's own site is never redirected anywhere.
 *
 * Onboarding links already texted to a client keep answering: they land here and are moved, which
 * is a change of address rather than a broken link.
 */
const LEGACY_HOST = "stevenjamesdesigns.com";

/**
 * ⛔ EVERY PATH LANDS ON ONE PAGE — NOT MAPPED PATH-FOR-PATH (his call, 2026-08-13).
 *
 * This used to keep the pathname and only swap the host, which was right while the two brands were
 * two websites with matching page trees. They are not any more: website sales folded into a single
 * SJC offering that lives at ONE page, so `/pricing` on the old domain has no counterpart to map to
 * and would have 404'd on arrival — a redirect into a dead end is worse than no redirect.
 *
 * Steven, deciding it: *"I haven't given the domain name out to anybody… let's redirect it to the
 * dedicated page that talks about building the websites. So that's kind of parked and a little
 * easier to clean up."* PARKED, not retired — he likes the name and it is one word off the
 * Consulting brand, so it stays pointed somewhere sensible until he wants it for something.
 *
 * ⚠️ WHY NOT DELETE THE DOMAIN INSTEAD: Vercel refuses (409) while the registrar's nameservers
 * point at `ns*.vercel-dns.com` — deleting would leave the NS records aimed at a zone Vercel no
 * longer serves. Getting to a truly unresolvable domain means changing nameservers at the
 * registrar first. A redirect to a real page beats a `DEPLOYMENT_NOT_FOUND` error screen anyway.
 *
 * ⚠️ APEX ONLY BY DESIGN. `www.` is attached to the project and Vercel redirects it to the apex
 * before middleware ever runs, so it arrives here as the apex and is caught. The WILDCARD is
 * deliberately NOT attached — old `<id>-demo.stevenjamesdesigns.com` links stay dead, because
 * demos live on the Consulting domain now and reviving a second demo address is the duplicate
 * `HostKind.gone` exists to kill.
 */
const LEGACY_LANDING = "/custom-websites";
function studioRedirect(req: NextRequest): URL | null {
  const here = normalizeHost(
    req.headers.get("x-forwarded-host") || req.headers.get("host") || ""
  );
  // ONLY the retired root. A demo subdomain (`<id>-demo.…`), a client's own domain, a preview URL
  // and localhost all fall through, so nobody else's site is ever moved.
  if (here !== normalizeHost(LEGACY_HOST)) return null;

  const to = normalizeHost(process.env.NEXT_PUBLIC_STUDIO_DOMAIN || STUDIO_HOST);
  if (here === to) return null; // nothing to do if they are configured the same

  const url = new URL(req.nextUrl);
  url.protocol = "https:";
  url.port = "";
  url.host = to;
  // ⛔ THE PATH IS DISCARDED, AND SO IS THE QUERY STRING. Everything arrives at the one page.
  url.pathname = LEGACY_LANDING;
  url.search = "";
  return url;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Before anything else — a change of address, not a decision about who's allowed in. The
  // builder is still gated once it lands on the studio host; this only decides WHICH host.
  // ⚠️ 302, NOT 308 — AND THE DIFFERENCE IS THE WHOLE POINT OF "PARKED" (changed 2026-08-13).
  //
  // A 308 is PERMANENT: browsers cache it more or less forever and search engines treat it as the
  // old address surrendering its identity. That was correct when this was a retirement. It is
  // wrong now that the domain is parked and Steven expects to want it back — reclaiming it would
  // mean fighting every browser that ever followed the redirect, on a domain he still likes.
  //
  // 302 says "look over there for now" and costs nothing, because nothing here needs SEO credit
  // to move: the domain was never given out or linked.
  const moved = studioRedirect(req);
  if (moved) {
    // ⛔ ROBOTS.TXT ANSWERS HERE — IT IS THE ONE PATH THAT MUST NOT BE REDIRECTED.
    //
    // A crawler asks for /robots.txt BEFORE it asks for anything else. Redirecting that request to
    // an HTML page means the crawler never receives a robots file at all, and the standard reading
    // of "no robots.txt" is ALLOW EVERYTHING. So the redirect that was meant to retire this domain
    // was quietly leaving it wide open.
    //
    // Answered in middleware rather than by app/robots.ts on purpose: nothing in the registry
    // claims this host, so `resolveHost` reports `sjc` for it and robots.ts would hand back the
    // allow-all SJC rules. Keeping the refusal next to the redirect means the two can't disagree.
    if (pathname === "/robots.txt") {
      return new NextResponse("User-Agent: *\nDisallow: /\n", {
        status: 200,
        headers: { "Content-Type": "text/plain; charset=utf-8", "X-Robots-Tag": "noindex" },
      });
    }
    const res = NextResponse.redirect(moved, 302);
    // ⚠️ THE HEADER IS WHAT MAKES 302 SAFE HERE. A permanent 301/308 drops the old URL out of the
    // index by itself; a TEMPORARY redirect does not — it says "this address is coming back", so
    // the designs URL can stay indexed. `noindex` states the intent outright instead of relying on
    // a side effect of the status code, which is what lets the redirect stay reclaimable AND
    // uncrawled. Honoured on a 3xx: crawlers read response headers before following.
    res.headers.set("X-Robots-Tag", "noindex");
    return res;
  }

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

  // ── WHO IS THIS? ────────────────────────────────────────────────────────────────────────────
  // Two ways in, and they are NOT equivalent:
  //   • the password cookie / bearer token  -> the OWNER. Full access, every site. This is Steven
  //     and his scripts, and it is exactly what `authed` has always meant.
  //   • the magic-link session               -> a named person with a LIST of websites. A client.
  //
  // A client's session must never widen into owner access, so it is only consulted when the owner
  // check has already failed. Get that ordering backwards and a client who also knows the shared
  // password silently keeps the narrower scope — or worse, the reverse.
  let identity = authed ? ownerIdentity(process.env.SITE_EDIT_USER || "steven", "password") : null;
  if (!identity) identity = await verifyIdentity(req.cookies.get(SESSION_COOKIE)?.value);
  const identityToken = identity ? await signIdentity(identity) : "";

  const forward = (preview: boolean) => {
    const headers = new Headers(req.headers);
    headers.delete(PREVIEW_HEADER);
    headers.delete(OWNER_HEADER); // forgeable otherwise — same reason as the preview header
    headers.delete(ID_HEADER); // ⛔ the important one: never let a request name itself
    if (preview) headers.set(PREVIEW_HEADER, "1");
    if (authed) headers.set(OWNER_HEADER, "1");
    // Re-signed rather than passed through, so a route can verify the header it reads with the
    // same function that made it — no "trust me, middleware checked" contract in the middle.
    if (identityToken) headers.set(ID_HEADER, identityToken);
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

  // ⛔ /api/admin/* IS THE OWNER'S TOOLBOX — NEVER A CLIENT'S, whatever site they own.
  //
  // A FORK, not a bouncer, and deliberately so. These nineteen routes reskin sites, rewrite links,
  // recompile stylesheets, purge orphans, set statuses and read stored leads. Auditing each one to
  // check it scopes correctly is work that has to be redone every time somebody adds the twentieth.
  // Refusing the whole prefix to anyone who is not the owner cannot be forgotten by a future route.
  //
  // Found by testing rather than reading: a client session scoped to ONE site read a different
  // client's stored leads through /api/admin/leads, which never called assertSiteAccess. The seam
  // existed; the route simply did not use it. This makes that irrelevant for the whole prefix.
  if (pathname.startsWith("/api/admin/") && !authed) {
    return NextResponse.json({ ok: false, error: "not found" }, { status: 404 });
  }

  // ⛔ TWO FRONT DOORS, AND THEY ARE NOT THE SAME DOOR.
  //
  // /edit is the STUDIO — Steven's workbench. It lists websites, imports designs, runs sweeps and
  // manages the library. Its APIs are scoped now, so a client landing there would see only their
  // own site, but that is not the point: the studio is the machinery, and the whole offer is that
  // a contractor never sees the machinery. Showing him a builder full of controls that mostly are
  // not his is how "done for you" starts feeling like homework.
  //
  // /account is HIS door — his business details, his leads, his photos. Nothing else.
  //
  // So a signed-in client asking for /edit is not an error, it is someone at the wrong door: send
  // them to theirs rather than showing a 404 to a paying customer.
  if (identity && identity.sites !== "*" && (pathname === "/edit" || pathname.startsWith("/edit/"))) {
    return NextResponse.redirect(new URL("/account", req.url), { status: 302 });
  }

  // The owner, or a client with a live magic-link session. `assertSiteAccess` is what decides
  // WHICH websites the second one may touch — middleware only decides they may be here at all.
  if (authed || identity) return forward(wantsPreview);

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
