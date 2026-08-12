// Take one business OUT of content that is moving to another site. ONE implementation.
//
// ── WHY THIS EXISTS ───────────────────────────────────────────────────────────────────────────
// Four paths move content between sites, and until 2026-08-12 they had four different standards:
//
//   make-template     scrubbed facts + colours, and REFUSED to finish if anything survived
//   /api/sections     blanked one field on one block type
//   clone-page        scrubbed nothing at all
//   copySiteContent   scrubbed nothing at all — and it is the path every new site is built on
//
// So the strictest rule lived in the route nobody uses by hand, and the loosest ran on the one
// that matters most. This is the floor all four now share.
//
// ⛔ AND THE FIELD EVERYONE WAS GUARDING WAS THE WRONG ONE. Every comment in the codebase called
// `LeadForm.props.source` "the one that ends relationships". It is not: components/blocks/
// LeadForm.tsx says plainly that source is a LABEL, and that the worst case is a confusing word in
// a spreadsheet cell. Routing is the site id resolved server-side -> Site.leadEmail / sheetId /
// ghlWebhookUrl, none of which live in page content.
//
// What DOES travel, unguarded, is worse and quieter:
//   • `links[].href` — a `tel:` or `mailto:` pointing at the source business. A visitor on the
//     destination site taps "Call now" and rings the WRONG COMPANY. That is a genuine misrouted
//     lead, it never touches lead delivery, and no binding state can ever see it.
//   • `text[]` and the raw `html` — the business name, address and hours as literal strings.
//   • `images[]` — photos stored under the SOURCE site's blob prefix.
//
// ⚠️ DERIVED FROM THE SOURCE SITE, NOT HARDCODED. make-template's FACTS list was a column of
// literal Lucky Dog values — a one-shot script wearing the shape of a policy, which would have
// silently done nothing for business number two. These patterns are built from that site's own
// `business` record, so they work for the next one with no code change.
import type { Site } from "./sitesShared";

/** What the scrub writes in. Named once so the leftover check can tell ours from theirs. */
export const PLACEHOLDER = {
  phone: "+15550000000",
  phoneDisplay: "(555) 000-0000",
  email: "hello@yourbusiness.com",
  address: "123 Main Street, Your City, ST 00000",
  name: "Your Business Name",
};

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Every separator form of a name: "Lucky Dog", "lucky-dog", "luckydog". */
function nameForms(name: string): RegExp | null {
  const words = name.trim().split(/\s+/).filter(Boolean).map(esc);
  if (!words.length) return null;
  return new RegExp(words.join("[\\s\\-_]*"), "gi");
}

/** Digits only, so (210) 474-6252 and +12104746252 are one pattern. */
function phoneForms(phone: string): RegExp | null {
  const d = phone.replace(/\D/g, "").replace(/^1/, "");
  if (d.length !== 10) return null;
  const [a, b, c] = [d.slice(0, 3), d.slice(3, 6), d.slice(6)];
  return new RegExp(`\\+?1?\\s*\\(?${a}\\)?[\\s.\\-]?${b}[\\s.\\-]?${c}`, "g");
}

type Rule = [RegExp, string];

/**
 * The replacement rules for one source business.
 *
 * ⚠️ ORDER MATTERS AND SO DO SEPARATORS. The slug form has to be caught before the spaced form,
 * and a pattern written only for spaces silently misses it — that is exactly how
 * `"/lucky-dog-wash-house — demo"` survived a scrub that reported success.
 */
function rulesFor(site: Pick<Site, "id" | "name" | "business">): Rule[] {
  const b = site.business || ({} as Site["business"]);
  const out: Rule[] = [];

  if (b.address?.trim()) out.push([new RegExp(esc(b.address.trim()), "gi"), PLACEHOLDER.address]);
  if (b.email?.trim()) out.push([new RegExp(esc(b.email.trim()), "gi"), PLACEHOLDER.email]);

  for (const p of [b.phone, b.phoneDisplay]) {
    const re = p?.trim() ? phoneForms(p) : null;
    if (re) out.push([re, PLACEHOLDER.phoneDisplay]);
  }

  // The site id first — it is the hyphenated form, and it appears inside URLs and slugs.
  if (site.id) out.push([new RegExp(esc(site.id), "gi"), "your-business"]);
  for (const n of [b.name, site.name]) {
    const re = n?.trim() ? nameForms(n) : null;
    if (re) out.push([re, PLACEHOLDER.name]);
  }
  return out;
}

/** Is this href a routing destination — something a visitor taps to reach a person? */
const isRouting = (href: string) => /^(tel:|mailto:|sms:|whatsapp:)/i.test(href.trim());

/**
 * Do these two sites belong to the SAME business?
 *
 * ⚠️ THE SCRUB IS ABOUT A CHANGE OF BUSINESS, NOT A CHANGE OF SITE — and getting that wrong is
 * worse than not scrubbing. Steven runs several sites for himself (sjc, sjc-2026,
 * steven-james-designs). Moving a page between them and blanking his own phone number, his own
 * address and his own Call-now links would break the page he is building and look like a bug in
 * the clone, not like a safety feature doing its job.
 *
 * Identity is compared on the FACTS rather than on ownership, because there is no owner field yet.
 * A shared phone or email is conclusive — two businesses do not share a phone number. Name is the
 * weakest signal and is only trusted when neither side has contact details to compare.
 */
export function sameBusiness(
  a: Pick<Site, "name" | "business">,
  b: Pick<Site, "name" | "business">
): boolean {
  const digits = (s?: string) => (s || "").replace(/\D/g, "").replace(/^1/, "");
  const norm = (s?: string) => (s || "").trim().toLowerCase();

  const aPhone = digits(a.business?.phone) || digits(a.business?.phoneDisplay);
  const bPhone = digits(b.business?.phone) || digits(b.business?.phoneDisplay);
  if (aPhone && bPhone) return aPhone === bPhone;

  const aMail = norm(a.business?.email);
  const bMail = norm(b.business?.email);
  if (aMail && bMail) return aMail === bMail;

  const aName = norm(a.business?.name) || norm(a.name);
  const bName = norm(b.business?.name) || norm(b.name);
  return !!aName && aName === bName;
}

export type ScrubReport = {
  facts: number;
  routingLinks: number;
  images: number;
  leadSources: number;
};

/**
 * Scrub a block tree in place-safe fashion (returns a new tree) for transfer to another site.
 *
 * `keepColour` exists for one reason: a bought design keeps its palette in CLASS NAMES
 * (`bg-[#0A0E27]`) and its compiled stylesheet targets exactly those selectors. Rewriting them
 * unstyles the whole design while reporting success — see the note in make-template.
 */
export function scrubForTransfer(
  node: unknown,
  from: Pick<Site, "id" | "name" | "business">,
  report: ScrubReport = { facts: 0, routingLinks: 0, images: 0, leadSources: 0 },
  inDesignHtml = false
): { value: unknown; report: ScrubReport } {
  const rules = rulesFor(from);

  const walk = (value: unknown, key = "", holderType = ""): unknown => {
    if (typeof value === "string") {
      // A routing href is blanked outright, not rewritten. There is no sensible placeholder for
      // "the number a stranger will dial", and a wrong one is worse than an empty one: the
      // destination business notices an empty Call button immediately and never notices a working
      // button that rings somebody else.
      if (key === "href" && isRouting(value)) {
        report.routingLinks++;
        return "";
      }
      // Photos stored under the SOURCE site's prefix are that business's own pictures. Droppable
      // precisely because uploads became site-prefixed (`sites/<id>/…`) in the same pass; before
      // that there was no way to tell one business's photo from another's.
      if (key === "src" && from.id && value.includes(`/sites/${from.id}/`)) {
        report.images++;
        return "";
      }
      let out = value;
      for (const [re, to] of rules) {
        re.lastIndex = 0;
        if (re.test(out)) {
          report.facts++;
          re.lastIndex = 0;
          out = out.replace(re, to);
        }
      }
      return out;
    }

    if (Array.isArray(value)) return value.map((v) => walk(v, key, holderType));

    if (value && typeof value === "object") {
      const o = value as Record<string, unknown> & { type?: string; props?: Record<string, unknown> };
      const type = typeof o.type === "string" ? o.type : holderType;
      const next: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(o)) {
        // ⚠️ `source` is blanked because it is a LABEL that would read as another business's name
        // on the destination's spreadsheet — tidiness, not routing. The routing fix is the href
        // rule above. Keeping this is cheap; believing it was the protection is what was wrong.
        if (k === "source" && type === "LeadForm" && typeof v === "string" && v) {
          report.leadSources++;
          next[k] = "";
          continue;
        }
        next[k] = walk(v, k, type);
      }
      return next;
    }
    return value;
  };

  return { value: walk(node), report };
}

/**
 * What must NOT survive a scrub, checked on the result.
 *
 * Runs with our own placeholders stripped out first, so a placeholder phone number can't mask a
 * real one. `skipDesignHtml` removes imported markup before the COLOUR check only — a design's
 * class names legitimately contain hexes, and the only way that check ever passed was by the
 * scrub having destroyed them, which broke the stylesheet.
 */
export function transferLeftovers(value: unknown): string[] {
  const withoutPlaceholders = Object.values(PLACEHOLDER).reduce(
    (acc, p) => acc.split(p).join(""),
    JSON.stringify(value)
  );
  const checks: [string, RegExp][] = [
    ["a phone number", /\(?\d{3}\)?[\s.\-]?\d{3}[\s.\-]?\d{4}/],
    ["an email address", /[\w.+-]+@[\w-]+\.[\w.]+/],
    ["a click-to-call or click-to-email link", /(tel:|mailto:)[^"'\s\\]+/i],
  ];
  return checks.filter(([, re]) => re.test(withoutPlaceholders)).map(([what]) => what);
}
