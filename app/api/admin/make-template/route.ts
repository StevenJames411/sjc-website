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
import { puckKey } from "@/lib/puckContent";
import { SJC, siteKeys } from "@/lib/siteKeys";

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

function scrub(value: unknown, counts: Record<string, number>): unknown {
  if (typeof value === "string") {
    let out = value;

    const role = HEX_TO_ROLE[out.trim().toLowerCase()];
    if (role) {
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

    // A hex that wasn't in the known palette still can't stay — it would freeze a colour into the
    // template that no brand panel can reach. Fall back to the nearest sensible role.
    out = out.replace(/#[0-9a-f]{6}\b/gi, (hex) => {
      counts.strayColours = (counts.strayColours || 0) + 1;
      return HEX_TO_ROLE[hex.toLowerCase()] || "accent";
    });

    return out;
  }
  if (Array.isArray(value)) return value.map((v) => scrub(v, counts));
  if (value && typeof value === "object") {
    const o: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) o[k] = scrub(v, counts);
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

  const text = withoutPlaceholders(JSON.stringify(cleaned));
  const leftovers = FORBIDDEN.filter(([, re]) => re.test(text)).map(([what]) => what);
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

  // ⚠️ THE STYLESHEET HAS TO COME TOO, AND IT DIDN'T UNTIL 2026-08-05.
  //
  // A bought design keeps its compiled Tailwind in its OWN key, per page per site (siteKeys →
  // designCss), deliberately: a 50KB blob inside the page data would make the store's save-guard
  // diff meaningless. This route copied the content and not the stylesheet, so a template made
  // from an imported design carried every piece of markup and none of the CSS.
  //
  // It failed the worst way — silently, and later. The template gets created, the API says ok, and
  // nothing looks wrong until somebody builds a site from it and gets unstyled HTML. The same
  // shape as every other failure today: the receipt said done, the page said otherwise.
  //
  // Missing is NOT an error: a template made from a native build has no design sheet and never
  // did. Reported as `styled` instead, so "no stylesheet" is something you can see rather than
  // something you assume.
  const css =
    (await createKvStore(client, siteKeys(fromSite).designCss(from, true)).read<unknown>()) ??
    (await createKvStore(client, siteKeys(fromSite).designCss(from, false)).read<unknown>());
  let styled = false;
  if (css) {
    styled = await createKvStore(client, siteKeys(site.id).designCss(page.slug, true)).write(css);
    // The draft too, so the builder canvas matches the published page.
    await createKvStore(client, siteKeys(site.id).designCss(page.slug, false)).write(css);
  }

  return Response.json({
    ok: true,
    id: site.id,
    slug: page.slug,
    counts,
    published: okPub,
    styled,
    leftovers: [],
  });
}
