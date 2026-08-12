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
  const isTelHref = /^\s*tel:/i.test(s);
  return s.replace(TOKEN, (_m, key: string) => {
    const k = key.toLowerCase();
    if (k === "url") return url;
    if (k === "phonedial") return dialable(b);
    if (k === "phone" || k === "phonedisplay") {
      return isTelHref ? dialable(b) : b.phoneDisplay || b.phone || "";
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
    if (typeof v === "string") return TOKEN.test(v) ? fillTokens(v, b, url) : v;
    if (Array.isArray(v)) return v.map(walk);
    if (v && typeof v === "object") {
      const o: Record<string, unknown> = {};
      for (const [k, val] of Object.entries(v as Record<string, unknown>)) o[k] = walk(val);
      return o;
    }
    return v;
  };
  // The regex is global, so lastIndex has to be reset or every other .test() returns false.
  TOKEN.lastIndex = 0;
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
