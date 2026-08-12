// Build a reusable TEMPLATE out of a finished website.
//
// A template is not a copy of somebody's site. The whole reason "Duplicate for a client" was the
// wrong tool is that copying a finished page drags the previous owner's phone number, address and
// palette along with it — those values were typed into the blocks, so they travel with the blocks.
//
// This scrubs them out:
//   • business facts (phone, email, address, the business name) -> neutral placeholders
//   • literal hexes -> the brand ROLE they were playing, so the copy re-skins from one screen
//
// Then it fails loudly if anything identifiable survived. A template that still carries a real
// business's details is worse than no template, because it looks finished.
//
//   POST { from, fromSite?, name?, dryRun? } -> { ok, id?, replaced, leftovers }
import { createSite, deleteSite } from "@/lib/sites";
import { createPage } from "@/lib/pageRegistry";
import { createKvStore } from "@/lib/kvStateStore";
import { getClient } from "@/lib/store";
import { puckKey, sheetIdsIn } from "@/lib/puckContent";
import { SJC } from "@/lib/siteKeys";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

// The palette Lucky Dog was built in, and the role each colour was actually playing. Mapping by
// role rather than by "make it grey" is what keeps the template looking like a designed page.
const HEX_TO_ROLE: Record<string, string> = {
  "#0ea5e9": "accent",
  "#10b981": "secondary",
  "#f59e0b": "highlight",
  "#334155": "ink",
  "#f8fafc": "bandSoft",
  "#0f172a": "bandDark",
};

// The placeholders this scrub writes. Named once so the safety check below can tell "we put this
// here" apart from "the source business's real number survived".
const PH = {
  phone: "+15550000000",
  phoneDisplay: "(555) 000-0000",
  email: "hello@yourbusiness.com",
  address: "123 Main Street, Your City, ST 00000",
  name: "Your Business Name",
  slug: "your-business",
};

// Anything that names a specific business.
//
// ⚠️ ORDER AND SEPARATORS BOTH MATTER. The hyphenated slug form has to be caught before the
// spaced form, and a pattern written only for spaces silently misses it — that is exactly how
// `"source": "/lucky-dog-wash-house — demo"` survived a scrub that reported success. The lead
// form's source field is the one that decides whose inbox a lead lands in.
const FACTS: [RegExp, string][] = [
  [/819 New Laredo Hwy,?\s*San Antonio,?\s*TX\s*78211/gi, PH.address],
  [/hello@luckydogwashhouse\.com/gi, PH.email],
  [/\+1\s*\(?210\)?[\s.-]?474[\s.-]?6252/g, PH.phone],
  [/tel:\+?1?2104746252/gi, `tel:${PH.phone}`],
  [/\+?1?2104746252/g, PH.phone],
  [/\(?210\)?[\s.-]?474[\s.-]?6252/g, PH.phoneDisplay],
  [/lucky[-_]dog[-_]wash[-_]house/gi, PH.slug], // slug form FIRST
  [/lucky[\s-]*dog[\s-]*wash[\s-]*house/gi, PH.name],
  [/luckydogwashhouse/gi, "yourbusiness"],
  [/San Antonio's Premier Pet Wash & Grooming/gi, "Your City's Best [Your Service]"],
  [/San Antonio/gi, "Your City"],
  [/New Laredo Hwy/gi, "Main Street"],
];

// What must NOT survive. This is the check that makes the template trustworthy — and it runs on
// the text with our own placeholders removed, so a placeholder phone number can't mask a real one.
const FORBIDDEN: [string, RegExp][] = [
  ["a phone number", /\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/],
  ["a hex colour", /#[0-9a-f]{6}\b/i],
  ["an email address", /[\w.+-]+@[\w-]+\.[\w.]+/],
  // Separator-tolerant on purpose: "lucky dog", "lucky-dog" and "luckydog" must all trip it.
  ["the source business name", /lucky[\s\-_]*dog/i],
];

/** Remove the placeholders we deliberately wrote, so FORBIDDEN only sees real leftovers. */
const withoutPlaceholders = (s: string) =>
  Object.values(PH).reduce((acc, p) => acc.split(p).join(""), s);

/**
 * ⛔ A DESIGN'S MARKUP IS NOT SCRUBBED FOR COLOUR, AND THAT IS LOAD-BEARING (2026-08-12).
 *
 * A bought design keeps its palette in its CLASS NAMES — `bg-[#0A0E27]`, `text-[#00D9FF]`,
 * `shadow-[#00D9FF]/20` — and its compiled stylesheet declares rules for exactly those selectors.
 * The colour scrub below ran over every string in the page, `DesignSection.props.html` included, so
 * it rewrote those class names to `bg-[bandDark]` and the sheet's selectors matched nothing.
 *
 * The trap was that this looked like success. `FORBIDDEN` refuses to finish if a hex survives — so
 * the check PASSED precisely BECAUSE the hexes had been destroyed, and the route reported ok on a
 * template that could not render. A design import could never have passed that check with its
 * classes intact.
 *
 * So: business FACTS are still scrubbed everywhere (a phone number in imported markup is exactly
 * what this route exists to remove), but colour is left alone inside a design's own markup. The
 * palette is the product, not a frozen brand value to be re-roled.
 */
const isDesignHtml = (key: string, holder: unknown) =>
  key === "html" &&
  !!holder &&
  typeof holder === "object" &&
  typeof (holder as { html?: unknown }).html === "string";

function scrub(value: unknown, counts: Record<string, number>, skipColour = false): unknown {
  if (typeof value === "string") {
    let out = value;

    const role = HEX_TO_ROLE[out.trim().toLowerCase()];
    if (role && !skipColour) {
      counts.colours = (counts.colours || 0) + 1;
      return role;
    }

    for (const [re, to] of FACTS) {
      if (re.test(out)) {
        counts.facts = (counts.facts || 0) + 1;
        out = out.replace(re, to);
      }
      re.lastIndex = 0;
    }

    // A hex that wasn't in the known palette still can't stay in a NATIVE block — it would freeze a
    // colour into the template that no brand panel can reach. Skipped inside a design's markup, for
    // the reason on `isDesignHtml` above: there the hex is part of the class name the stylesheet
    // targets, and rewriting it silently unstyles the whole template.
    if (!skipColour) {
      out = out.replace(/#[0-9a-f]{6}\b/gi, (hex) => {
        counts.strayColours = (counts.strayColours || 0) + 1;
        return HEX_TO_ROLE[hex.toLowerCase()] || "accent";
      });
    }

    return out;
  }
  if (Array.isArray(value)) return value.map((v) => scrub(v, counts, skipColour));
  if (value && typeof value === "object") {
    const o: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      o[k] = scrub(v, counts, skipColour || isDesignHtml(k, value));
    }
    return o;
  }
  return value;
}

/**
 * Blank every lead form's `source` in a template.
 *
 * ⚠️ THE ONE THAT ENDS RELATIONSHIPS. `source` is the tag that says whose lead this is. If a
 * template carries one, every website cloned from it inherits the same tag and two clients' leads
 * become indistinguishable — client A's enquiry landing in client B's pile. A placeholder is not
 * good enough here; it has to be empty so it is obviously unset.
 *
 * (Deriving it from the site id automatically is Phase B and is NOT done yet — until then this
 * field must be filled in per website.)
 */
function blankLeadSources(node: unknown, out: { n: number }): void {
  if (Array.isArray(node)) return node.forEach((c) => blankLeadSources(c, out));
  if (!node || typeof node !== "object") return;
  const n = node as { type?: string; props?: Record<string, unknown> };
  if (n.type === "LeadForm" && n.props && typeof n.props.source === "string") {
    n.props.source = "";
    out.n++;
  }
  if (n.props) Object.values(n.props).forEach((v) => blankLeadSources(v, out));
}

export async function POST(req: Request) {
  let body: { from?: string; fromSite?: string; name?: string; dryRun?: boolean };
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "bad json" }, { status: 400 });
  }

  const from = String(body?.from || "").trim();
  const fromSite = String(body?.fromSite || SJC).trim() || SJC;
  const name = String(body?.name || "Service Business — starter").trim();
  if (!from) return Response.json({ ok: false, error: "Which page?" }, { status: 400 });

  const client = getClient();
  // Prefer the published copy: it is what was actually looked at and signed off.
  const src =
    (await createKvStore(client, puckKey(from, true, fromSite)).read<Record<string, unknown>>()) ||
    (await createKvStore(client, puckKey(from, false, fromSite)).read<Record<string, unknown>>());
  if (!src) return Response.json({ ok: false, error: "That page has no saved content." }, { status: 404 });

  const counts: Record<string, number> = {};
  const { _pub, ...rest } = src as { _pub?: number };
  const cleaned = scrub(rest, counts) as Record<string, unknown>;

  // The page title is the root prop the builder shows; it must not name the source business.
  const root = (cleaned.root as { props?: Record<string, unknown> } | undefined)?.props;
  if (root) root.title = "Your Business Name — [Your Service], Your City";

  const leads = { n: 0 };
  blankLeadSources(cleaned.content, leads);
  counts.leadFormsCleared = leads.n;

  // ⚠️ THE HEX RULE IS EVALUATED WITH DESIGN MARKUP REMOVED (2026-08-12), and the rest of the rules
  // are not. A phone number or an email inside imported markup is still a hard stop — that is the
  // whole point of this route. But a design's markup legitimately contains hexes in its class names
  // (`bg-[#0A0E27]`), and the only way it ever passed this check was by having them destroyed,
  // which unstyled the template while reporting success. Colour is checked on everything else.
  const text = withoutPlaceholders(JSON.stringify(cleaned));
  const textNoDesignHtml = withoutPlaceholders(
    JSON.stringify(cleaned, (k, v) => (isDesignHtml(k, { html: v }) ? "" : v))
  );
  const leftovers = FORBIDDEN.filter(([what, re]) =>
    re.test(what === "a hex colour" ? textNoDesignHtml : text)
  ).map(([what]) => what);
  if (leftovers.length) {
    return Response.json(
      { ok: false, error: `Scrub incomplete — still contains ${leftovers.join(", ")}.`, leftovers, counts },
      { status: 422 }
    );
  }

  if (body?.dryRun) return Response.json({ ok: true, dryRun: true, counts, leftovers: [] });

  const site = await createSite({
    name,
    kind: "template",
    description: "Header, hero, stats, services, about, how-it-works, reviews, contact form.",
  });
  if (!site.ok || !site.id) return Response.json(site, { status: 400 });

  const page = await createPage("Home", site.id);
  if (!page.ok || !page.slug) {
    await deleteSite(site.id);
    return Response.json(page, { status: 400 });
  }

  // Draft AND published: a template you can't preview is hard to choose from.
  const okDraft = await createKvStore(client, puckKey(page.slug, false, site.id)).write(cleaned);
  const okPub = await createKvStore(client, puckKey(page.slug, true, site.id)).write({ ...cleaned, _pub: 1 });
  if (!okDraft) {
    await deleteSite(site.id);
    return Response.json({ ok: false, error: "Couldn't save the template's content." }, { status: 500 });
  }

  // ⚠️ THE STYLESHEET USED TO HAVE TO BE COPIED HERE, AND ONCE WASN'T (2026-08-05 → 2026-08-12).
  //
  // A bought design's compiled Tailwind lived in its OWN per-page, per-site key, so this route
  // copied content and not CSS: a template made from an imported design carried every piece of
  // markup and none of the styling. It failed the worst way — silently and later. The template got
  // created, the API said ok, and nothing looked wrong until somebody built a site from it and got
  // unstyled HTML. Copying it here in August fixed this route and left `copySiteContent` — the path
  // that actually CONSUMES a template — still dropping it, so the fix was inert.
  //
  // Sheets are now global, immutable and referenced by `DesignSection.props.sheet`, which the scrub
  // above copies like any other prop. Nothing to carry, and nothing left to forget.
  const sheets = sheetIdsIn(cleaned);

  return Response.json({
    ok: true,
    id: site.id,
    slug: page.slug,
    counts,
    published: okPub,
    // Which design sheets the template references. Empty is normal for a natively built page.
    sheets,
    leftovers: [],
  });
}
