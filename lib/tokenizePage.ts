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

/** Apply the rules to every string in a page, counting what changed. */
export function applyTokens<T>(data: T, rules: Rule[], counts: Record<string, number> = {}): T {
  const walk = (v: unknown): unknown => {
    if (typeof v === "string") {
      let s = v;
      for (const { re, token, label } of rules) {
        re.lastIndex = 0;
        const hits = s.match(re);
        if (hits?.length) {
          counts[label] = (counts[label] || 0) + hits.length;
          s = s.replace(re, token);
        }
      }
      return s;
    }
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
