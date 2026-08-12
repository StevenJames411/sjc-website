// MAGIC-LINK SIGN-IN — how a client gets into their own website.
//
//   POST /api/auth/magic { email }        -> { ok: true }        always. see below.
//   GET  /api/auth/magic?token=…          -> 302 + session cookie
//
// ── WHY A LINK AND NOT A PASSWORD ─────────────────────────────────────────────────────────────
// Steven, on the client this is for: a contractor who runs his business from his phone. A password
// is a thing he will forget, reset, write on a whiteboard, or ring Steven about at 7am — and every
// one of those is a support call against a done-for-you service whose entire promise is that he
// never touches the machine. A link in his inbox has no state to lose.
//
// It also means SJC stores no client passwords, which is the sort of thing that only ever becomes
// a problem on the worst day.
//
// ── THE TWO RULES THIS ROUTE EXISTS TO HOLD ───────────────────────────────────────────────────
//  1. POST ALWAYS ANSWERS ok, whether or not the address is known. Answering differently turns
//     this into a free tool for asking "is this person a client of yours?" — a list of Steven's
//     customers, one request at a time, from anyone on the internet.
//  2. A TOKEN IS SINGLE-USE AND SHORT-LIVED. It arrives by email, and email is forwarded, quoted,
//     synced to three devices and backed up. Consuming it on first use means a leaked mailbox
//     yields a link that is already spent.
import { NextResponse } from "next/server";
import { createKvStore } from "@/lib/kvStateStore";
import { getClient } from "@/lib/store";
import { readSites } from "@/lib/sites";
import { signIdentity, SESSION_COOKIE } from "@/lib/identity";
import type { Identity } from "@/lib/identity";
import { sendAlert } from "@/lib/leadDelivery";
import { currentIdentity } from "@/lib/siteAccess";

export const dynamic = "force-dynamic";

/** Fifteen minutes. Long enough to walk to a laptop, short enough that a forwarded email is dead. */
const TTL_SECONDS = 15 * 60;

const linkKey = (token: string) => `auth-magic-${token}`;

/** One record per person trying to get in, so repeated attempts are visible as a pattern. */
const attemptKey = (email: string) => `auth-attempt-${email.replace(/[^a-z0-9]/gi, "-")}`;

/**
 * ── THE SHOULDER-TAP ──────────────────────────────────────────────────────────────────────────
 * Steven, on watching a client struggle to sign in: *"I'd like to get a copy so that I could see
 * the trouble and if it doesn't clear itself up, I could then reach out... I'm not required to do
 * anything, but I just see that there's something going on in the background."*
 *
 * ⛔ SO IT IS NOT A COPY OF EVERY LINK. A contractor signing in normally is not news, and an inbox
 * that gets one email per successful login is an inbox where the ONE that matters is invisible by
 * week two. The alert fires on TROUBLE, which is a different event from ACTIVITY:
 *
 *   • asked twice inside the window  — they are not receiving it, or the link is not working
 *   • no website has that address    — almost always the wrong email, and a 10-second fix for him
 *   • the send itself failed         — nothing is coming, and only he can see it
 *
 * ⚠️ IT NEVER CHANGES WHAT THE CALLER SEES. The response stays a bare `{ok:true}` in every case —
 * the whole no-leak rule above depends on the outside being unable to tell these apart. The
 * difference is only ever visible to Steven.
 *
 * Capped at one alert per address per hour, so a bot hammering the endpoint taps his shoulder once
 * rather than filling his phone.
 */
async function tapSteven(email: string, why: string, detail: string): Promise<void> {
  try {
    const { findSite } = await import("@/lib/sites");
    const { SJC } = await import("@/lib/siteKeys");
    const to = (await findSite(SJC))?.leadEmail?.trim();
    if (!to) return;
    await sendAlert({
      to,
      from: process.env.LEAD_FROM || "leads@send.stevenjamesdesigns.com",
      fromName: "SJC sign-in watch",
      subject: `Sign-in trouble — ${email}`,
      html:
        `<div style="font-family:-apple-system,Segoe UI,sans-serif;font-size:15px;color:#111827">` +
        `<p style="margin:0 0 14px"><strong>${email}</strong> ${why}</p>` +
        `<p style="margin:0 0 14px;color:#374151">${detail}</p>` +
        `<p style="margin:0;color:#6b7280;font-size:13px">Nothing to do — this is a heads-up. If it ` +
        `doesn't sort itself out, reach out to them.</p></div>`,
    });
  } catch {
    // A failed heads-up must never break a sign-in. It is the least important thing here.
  }
}

/** Which websites this address may open. Empty is a valid answer and denies everything. */
async function sitesFor(email: string): Promise<{ sites: string[]; owner: boolean }> {
  const e = email.trim().toLowerCase();
  const ownerAddresses = (process.env.OWNER_EMAILS || "")
    .split(",")
    .map((x) => x.trim().toLowerCase())
    .filter(Boolean);
  if (ownerAddresses.includes(e)) return { sites: [], owner: true };

  const all = await readSites();
  return {
    sites: all
      .filter((s) => !s.deletedAt)
      .filter((s) => (s.ownerEmails || []).some((o) => (o || "").trim().toLowerCase() === e))
      .map((s) => s.id),
    owner: false,
  };
}

export async function POST(req: Request) {
  let email = "";
  try {
    email = String(((await req.json()) as { email?: string })?.email || "").trim().toLowerCase();
  } catch {
    return NextResponse.json({ ok: false, error: "bad json" }, { status: 400 });
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    // A malformed address is a typo, not a probe — saying so helps the person and reveals nothing.
    return NextResponse.json({ ok: false, error: "That doesn't look like an email address." }, { status: 400 });
  }

  const { sites, owner } = await sitesFor(email);

  // Count the attempt BEFORE the unknown-address return, so the address nobody recognises is
  // exactly the one whose repeats get counted.
  const attempts = createKvStore(getClient(), attemptKey(email));
  const prior = (await attempts.read<{ n?: number; firstAt?: number; alertedAt?: number }>()) || {};
  const windowOpen = prior.firstAt && Date.now() - prior.firstAt < TTL_SECONDS * 1000;
  const n = (windowOpen ? prior.n || 0 : 0) + 1;
  const alertedRecently = prior.alertedAt && Date.now() - prior.alertedAt < 60 * 60 * 1000;
  await attempts.write({
    n,
    firstAt: windowOpen ? prior.firstAt : Date.now(),
    alertedAt: alertedRecently ? prior.alertedAt : Date.now(),
  });

  // ⛔ RULE 1. No match: stop here, having done nothing, and answer exactly as if we had. Do NOT
  // move this into an `if` that also skips the response shape.
  if (!owner && sites.length === 0) {
    if (!alertedRecently) {
      await tapSteven(
        email,
        "tried to sign in, but no website has that address on it.",
        "Usually the wrong email — they signed up with one address and typed another. Add it to " +
          "that website's settings under who may sign in, and their next link will work."
      );
    }
    return NextResponse.json({ ok: true });
  }

  if (n > 1 && !alertedRecently) {
    await tapSteven(
      email,
      `has asked for a sign-in link ${n} times in the last ${TTL_SECONDS / 60} minutes.`,
      "The link is sending, so they are probably not receiving it — spam folder, or their mail " +
        "provider is dropping it. They may need it another way."
    );
  }

  const token = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
  const store = createKvStore(getClient(), linkKey(token));
  const wrote = await store.write({
    email,
    sites: owner ? "*" : sites,
    expiresAt: Date.now() + TTL_SECONDS * 1000,
  });
  if (!wrote) {
    return NextResponse.json({ ok: false, error: "Couldn't start the sign-in." }, { status: 500 });
  }

  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://stevenjamesconsulting.com";
  const link = `${base}/api/auth/magic?token=${token}`;

  // ⚠️ sendAlert RESOLVES TO void AND THROWS ON FAILURE — it does not return a boolean. Written as
  // `const sent = await sendAlert(...).catch(() => false)`, success gives `undefined`, so the
  // "did not send" line below fired on every successful send. A log that cries wolf every time is
  // worse than no log: it is the one you learn to scroll past on the day it is telling the truth.
  let sent = true;
  let sendError = "";
  await sendAlert({
    to: email,
    from: process.env.LEAD_FROM || "leads@send.stevenjamesdesigns.com",
    fromName: "Steven James Consulting",
    subject: "Your sign-in link",
    html:
      `<div style="font-family:-apple-system,Segoe UI,sans-serif;font-size:15px;color:#111827">` +
      `<p style="margin:0 0 16px">Here's your link to sign in and edit your website.</p>` +
      `<p style="margin:0 0 22px"><a href="${link}" style="background:#111827;color:#fff;` +
      `text-decoration:none;padding:12px 20px;border-radius:8px;display:inline-block">Open my website</a></p>` +
      `<p style="margin:0 0 8px;color:#6b7280;font-size:13px">This link works once, and only for ` +
      `the next 15 minutes.</p>` +
      `<p style="margin:0;color:#6b7280;font-size:13px">If you didn't ask for it, you can ignore ` +
      `this — nobody can get in without the link.</p></div>`,
  }).catch((e) => {
    sent = false;
    sendError = (e as Error).message;
    console.error(`[auth] magic link for ${email} failed to send: ${sendError}`);
    void tapSteven(
      email,
      "asked for a sign-in link and it FAILED TO SEND.",
      `Nothing is on its way to them. The sender said: ${sendError}`
    );
  });

  // ── WHAT THE OWNER SEES, AND WHY IT IS DIFFERENT ────────────────────────────────────────────
  // A stranger gets `{ok:true}` and nothing else — rule 1, unchanged.
  //
  // Steven gets the truth: whether it sent, and the reason if it didn't. Without this, "the client
  // says the link never arrived" is unanswerable from the outside — the route is DESIGNED to look
  // identical whether it worked or not, and console.error does not survive to anywhere he can read
  // it. He is already authenticated as the owner here, so he learns nothing he could not read off
  // the sites list anyway.
  //
  // He also gets THE LINK ITSELF, which is a feature and not a debugging leftover. Two situations
  // need it and neither is rare: the client says the email never arrived (spam, a typo'd address,
  // a mailbox that silently drops mail from a young sending domain), and onboarding a contractor
  // who is standing next to a van — texting him a link beats talking him through his inbox. The
  // link is still single-use and still dies in 15 minutes, so handing it over is no weaker than
  // the email that would have carried it.
  const me = await currentIdentity();
  if (me?.sites === "*") {
    return NextResponse.json({
      ok: true,
      sent,
      sites: owner ? "*" : sites,
      error: sendError,
      link,
      expiresInMinutes: TTL_SECONDS / 60,
    });
  }

  // Still `ok` on a send failure for everyone else: the caller must not learn whether an address
  // exists from a 500 either.
  return NextResponse.json({ ok: true });
}

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token") || "";
  const bad = (why: string) =>
    NextResponse.redirect(new URL(`/edit?signin=${why}`, req.url), { status: 302 });

  if (!token || !/^[a-f0-9]{64}$/i.test(token)) return bad("bad");

  const store = createKvStore(getClient(), linkKey(token));
  const rec = await store.read<{ email?: string; sites?: "*" | string[]; expiresAt?: number }>();
  if (!rec?.email) return bad("expired");

  // ⛔ RULE 2, AND THE ORDER MATTERS. Consume BEFORE minting the session, so a double-click or a
  // mail scanner prefetching the link cannot produce two live sessions from one email.
  await store.purge();

  if (!rec.expiresAt || rec.expiresAt < Date.now()) return bad("expired");

  const identity: Identity = {
    email: rec.email,
    sites: rec.sites === "*" ? "*" : rec.sites || [],
    via: "magic",
    // Thirty days, matching the owner cookie. A contractor checking his leads once a fortnight
    // should not be re-authenticating every visit; that is the friction this exists to remove.
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30,
  };

  const res = NextResponse.redirect(new URL("/edit", req.url), { status: 302 });
  res.cookies.set(SESSION_COOKIE, await signIdentity(identity), {
    httpOnly: true,
    secure: true,
    // `lax`, not `strict`: the user is arriving from a link in their mail client, which is a
    // cross-site navigation. Under `strict` the cookie is withheld on exactly that first hop and
    // they land back on the sign-in page having just signed in successfully.
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
