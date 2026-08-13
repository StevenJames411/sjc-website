import type { BusinessFacts } from "./sitesShared";

// Let any text on any block pull from the website's settings.
//
// THE PROBLEM. A business's phone number used to exist only as characters typed inside a Text
// block — six or seven times over, across the header, the hero, the contact card and the footer.
// Changing it meant hunting every block, and copying the site copied the digits with it. That is
// the difference between a template and a copy of somebody's website.
//
// Now a block can hold {{business.phone}} and the value comes from one screen.
//
// ⚠️ SUBSTITUTION HAPPENS AT PUBLIC RENDER ONLY. The builder deliberately shows the raw token.
// If the editor were handed resolved text, the next auto-save would write the resolved VALUE back
// into the block and quietly sever the link to the settings screen — the same class of bug as the
// image adoption that Publish silently reverted. Seeing the token is also the honest UI: it tells
// you at a glance that this text is driven from somewhere else.

const TOKEN =
  /\{\{\s*business\.(name|phone|phoneDisplay|phoneDial|email|address|hours|url)\s*\}\}/gi;

/** Digits (and a leading +) only — what a tel: link needs to actually dial. */
const dialable = (b: BusinessFacts) => {
  const raw = b.phone || b.phoneDisplay || "";
  const digits = raw.replace(/[^\d+]/g, "");
  if (!digits) return "";
  return digits.startsWith("+") ? digits : digits.length === 10 ? `+1${digits}` : `+${digits}`;
};

/**
 * Resolve one string's tokens. Unset fields collapse to "" rather than printing the raw token.
 *
 * ⚠️ `{{business.phone}}` is CONTEXT-SENSITIVE. In visible copy people want "(210) 555-1212"; in
 * an href they need "+12105551212" or the link doesn't dial. Writing the pretty form into a tel:
 * produced `href="tel:(210) 555-1212"` — a button that looks perfect and does nothing on a phone,
 * on a page whose entire job is getting someone to call. So a string that IS a tel: link resolves
 * every phone token to the dialable form.
 */
export function fillTokens(s: string, b: BusinessFacts, url = ""): string {
  // ⛔ DIALABLE IS DECIDED PER MATCH, NOT PER STRING — and the difference is the whole bug.
  //
  // This used to be `/^\s*tel:/i.test(s)`: does the WHOLE STRING start with `tel:`. That works for
  // a bare prop like `SiteFooter.phone`, and is useless for the case that actually matters — an
  // imported design, where `s` is a multi-kilobyte blob of markup with `href="sms:{{business.
  // phone}}"` somewhere in the middle. The blob does not start with `sms:`, so the number rendered
  // in its readable form and the live home page shipped `sms:(210) 851-4906`: a text-us button
  // that looks right and does nothing when tapped.
  //
  // It hid because the `tel:` links beside it were fine — but for an unrelated reason. Tokenize had
  // already written `{{business.phoneDial}}` for those, which is dialable in any context. Only the
  // `sms:` one relied on this check, and only that one was wrong.
  //
  // ⚠️ TWO PLACES KNOW ABOUT DIAL CONTEXT and they must agree: this, and `isDialString` in
  // lib/tokenizePage. Fixing it here is what makes it retroactive — pages already tokenized and
  // published render correctly without rewriting a single stored document.
  const dialAt = (at: number): boolean => /(tel|sms):\s*$/i.test(s.slice(Math.max(0, at - 10), at));
  const isTelHref = /^\s*(tel|sms):/i.test(s);
  return s.replace(TOKEN, (_m, key: string, offset: number) => {
    const k = key.toLowerCase();
    if (k === "url") return url;
    if (k === "phonedial") return dialable(b);
    if (k === "phone" || k === "phonedisplay") {
      return isTelHref || dialAt(offset) ? dialable(b) : b.phoneDisplay || b.phone || "";
    }
    const map: Record<string, string> = {
      name: b.name,
      // A destination, resolved per site — see BusinessFacts.reviewUrl for why it cannot live on
      // the shared form.
      reviewurl: b.reviewUrl || "",
      email: b.email,
      address: b.address,
      hours: b.hours,
    };
    return map[k] ?? "";
  });
}

/** Walk saved page data and fill every token in every string. Returns a new object. */
export function fillBusinessTokens<T>(data: T, b: BusinessFacts, url = ""): T {
  const walk = (v: unknown): unknown => {
    // ⛔ NO `TOKEN.test(v)` GUARD HERE, AND THAT IS THE FIX (2026-08-12).
    //
    // It used to read `TOKEN.test(v) ? fillTokens(...) : v` with a single `TOKEN.lastIndex = 0`
    // before the walk. TOKEN is a GLOBAL regex, and `.test()` on a global regex ADVANCES
    // lastIndex — so resetting once only ever fixed the first string. Every string after it was
    // tested from wherever the previous match ended, and roughly every other one returned false
    // for a value that plainly contained a token. The old comment named the hazard exactly and
    // then put the reset where it could not help.
    //
    // What that looked like live: `{{business.phone}}` rendered raw on the public site — in a
    // title attribute, in an `sms:` href, and in visible text — while other copies of the SAME
    // token on the SAME page resolved fine. Invisible until pages actually contained tokens,
    // which is why tokenizing exposed it rather than caused it.
    //
    // `String.replace` with a global regex starts at 0 and resets on its own, so calling
    // fillTokens unconditionally is both correct and cheaper than getting the guard right.
    if (typeof v === "string") return v.includes("{{") ? fillTokens(v, b, url) : v;
    if (Array.isArray(v)) return v.map(walk);
    if (v && typeof v === "object") {
      const o: Record<string, unknown> = {};
      for (const [k, val] of Object.entries(v as Record<string, unknown>)) o[k] = walk(val);
      return o;
    }
    return v;
  };
  return walk(data) as T;
}

/**
 * Build a tel: href from whatever a phone field happens to contain.
 *
 * ⚠️ USE THIS EVERYWHERE A tel: LINK IS BUILT. `href={`tel:${phone}`}` looks harmless and produced
 * `tel:(210) 474-6252` on a live page — a call button that renders perfectly and does nothing when
 * tapped, on a page whose entire job is getting someone to phone. It happens whenever the field
 * holds the readable form, which is true if a token resolved to it OR if a human simply typed the
 * number the way people write it.
 */
export function telLink(value: string): string {
  const digits = String(value || "").replace(/[^\d+]/g, "");
  if (!digits) return "";
  const n = digits.startsWith("+") ? digits : digits.length === 10 ? `+1${digits}` : `+${digits}`;
  return `tel:${n}`;
}

/** A tel: href for a whole business record. */
export const telHref = (b: BusinessFacts) => telLink(b.phone || b.phoneDisplay);
