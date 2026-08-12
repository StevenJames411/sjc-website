import type { BusinessFacts } from "./sitesShared";

// Swap a page's literal business details for references to the website's settings.
//
// This runs AUTOMATICALLY ON IMPORT — the importer already digs the phone, email and name out of
// the markup to fill in the site record, so writing the tokens at the same moment costs nothing
// and means an imported website arrives already wired to its own settings.
//
// It exists as a separate module because it is also needed as a one-off sweep for pages that were
// built before any of this, where the details were typed in by hand.

export type Rule = { re: RegExp; token: string; label: string };

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Every literal → token swap a set of business facts can justify.
 *
 * ⚠️ ORDER MATTERS. Address and email go before anything shorter that could sit inside them, and
 * the business name goes LAST because it turns up inside the others ("hello@luckydog…").
 */
export function tokenRules(b: BusinessFacts): Rule[] {
  const out: Rule[] = [];
  const add = (v: string, token: string, label: string, flags = "g") => {
    if (v && v.trim()) out.push({ re: new RegExp(esc(v.trim()), flags), token, label });
  };

  add(b.address, "{{business.address}}", "address");
  add(b.email, "{{business.email}}", "email", "gi");

  // Match the digits however they're punctuated, so "(210) 474-6252", "210.474.6252" and
  // "tel:+12104746252" all become one token. The renderer picks the readable or the dialable form
  // depending on whether it lands inside a tel: link.
  const digits = (b.phone || b.phoneDisplay || "").replace(/\D/g, "").slice(-10);
  if (digits.length === 10) {
    const [a, c, d] = [digits.slice(0, 3), digits.slice(3, 6), digits.slice(6)];
    out.push({
      re: new RegExp(`\\+?1?\\s*\\(?${a}\\)?[\\s.\\-]?${c}[\\s.\\-]?${d}`, "g"),
      token: "{{business.phone}}",
      label: "phone",
    });
  }

  add(b.hours, "{{business.hours}}", "hours");
  add(b.name, "{{business.name}}", "business name");
  return out;
}

// Props whose value is fed straight into a tel: link by the component that renders them. A
// readable number in one of these produces `tel:(210) 474-6252` — a call button that does nothing
// when tapped. They get the dialable token instead.
const DIAL_PROPS = new Set(["phone", "tel"]);

/**
 * …and the same problem when the STRING is the link rather than the prop.
 *
 * ⚠️ AN IMPORTED DESIGN CARRIES ITS CALL BUTTON AS `href: "tel:+12104746252"`, and `href` is not in
 * DIAL_PROPS — so the rule above handed it the READABLE token and produced `tel:(210) 474-6252`, a
 * Call-now button that does nothing when tapped. Deciding by prop NAME alone was only ever right
 * for our own blocks; imported markup puts the whole URL in the value.
 */
const isDialString = (s: string) => /tel:\s*$|^\s*tel:/i.test(s);

/**
 * Apply the rules to every string in a page, counting what changed.
 *
 * The prop NAME matters, not just the value: the same phone number means the readable form in a
 * heading and the dialable form in `SiteFooter.phone`. Walking strings without knowing which key
 * they sat under is what put an undialable number on a live page.
 */
export function applyTokens<T>(data: T, rules: Rule[], counts: Record<string, number> = {}): T {
  const walk = (v: unknown, key = ""): unknown => {
    if (typeof v === "string") {
      let s = v;
      for (const { re, token, label } of rules) {
        re.lastIndex = 0;
        const hits = s.match(re);
        if (hits?.length) {
          counts[label] = (counts[label] || 0) + hits.length;
          // The dialable form when this value IS a tel: link, or sits in a prop that becomes one.
          // Inside a blob of markup a number can appear both ways, so the replacement decides per
          // match on what immediately precedes it rather than once for the whole string.
          s =
            label === "phone"
              ? s.replace(re, (m, ...rest) => {
                  const at = rest[rest.length - 2] as number;
                  return isDialString(s.slice(Math.max(0, at - 8), at)) || DIAL_PROPS.has(key)
                    ? "{{business.phoneDial}}"
                    : token;
                })
              : s.replace(re, token);
        }
      }
      return s;
    }
    if (Array.isArray(v)) return v.map((x) => walk(x, key));
    if (v && typeof v === "object") {
      const o: Record<string, unknown> = {};
      for (const [k, val] of Object.entries(v as Record<string, unknown>)) o[k] = walk(val, k);
      return o;
    }
    return v;
  };
  return walk(data) as T;
}
