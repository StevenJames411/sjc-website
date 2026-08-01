// Structured data for a client's website — the block Google and the AI crawlers read to work out
// what this business IS.
//
// ── WHY THIS EXISTS ───────────────────────────────────────────────────────────────────────────
// app/layout.tsx used to emit SJC's Organization, Service and FAQPage schema on EVERY route, so a
// groomer's website told Google it was Steven James Consulting — ARV Venture Group LLC, Steven's
// phone number, SJC's logo, under her business name. Scoping that to SJC's own domain was right,
// but it left every other site with NO structured data at all. For a product sold as "built to be
// found on Google and by AI search", zero is the wrong end of that trade.
//
// ── IT COSTS NOTHING PER CLIENT ───────────────────────────────────────────────────────────────
// Every value comes from Website settings, which is filled in during onboarding anyway. There is
// no schema step: type her phone number once and the markup writes itself. A field left blank is
// simply left out — an empty `telephone` in the JSON is worse than no telephone, because it says
// the business has none.
//
// Emitted on demos too. `noindex` keeps a demo out of Google regardless, and rendering it early
// means what Steven sees on the demo is exactly what goes live the day she buys — the markup's
// first outing is never on a paying client's site.
import type { Site } from "./sitesShared";

/** Drop empty strings, empty arrays and undefined so no key is emitted with nothing behind it. */
function compact<T extends Record<string, unknown>>(o: T): Partial<T> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(o)) {
    if (v === undefined || v === null) continue;
    if (typeof v === "string" && !v.trim()) continue;
    if (Array.isArray(v) && !v.length) continue;
    out[k] = v;
  }
  return out as Partial<T>;
}

/**
 * Split a one-line address into the parts schema.org wants.
 *
 * Steven types "819 New Laredo Hwy, San Antonio, TX 78211" into a single box, because asking a
 * business owner for four separate fields to satisfy a search engine is the wrong trade. Best
 * effort: a confident parse or nothing. A wrong `addressRegion` is worse than an absent one.
 */
function postalAddress(address: string) {
  const parts = address.split(",").map((s) => s.trim()).filter(Boolean);
  if (parts.length < 3) return undefined;
  const last = parts[parts.length - 1];
  const m = last.match(/^([A-Za-z]{2})\s+(\d{5}(?:-\d{4})?)$/);
  if (!m) return undefined;
  return compact({
    "@type": "PostalAddress",
    streetAddress: parts.slice(0, -2).join(", "),
    addressLocality: parts[parts.length - 2],
    addressRegion: m[1].toUpperCase(),
    postalCode: m[2],
    addressCountry: "US",
  });
}

/**
 * The site's own LocalBusiness block, or null when there isn't enough to say anything true.
 *
 * A name alone is not worth emitting — schema with nothing in it is noise to a crawler and can
 * look like spam. It needs a name plus at least one way to reach the business.
 */
export function localBusinessSchema(site: Site, siteUrl: string): Record<string, unknown> | null {
  const b = site.business || {};
  const name = (b.name || site.name || "").trim();
  if (!name) return null;

  const phone = (b.phoneDisplay || b.phone || "").trim();
  const address = (b.address || "").trim();
  const email = (b.email || "").trim();
  if (!phone && !address && !email) return null;

  const schema = compact({
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name,
    url: siteUrl,
    telephone: phone || undefined,
    email: email || undefined,
    address: address ? postalAddress(address) : undefined,
    // The one-line form, kept when the parse wasn't confident enough — a crawler can still read
    // it, and it is better than dropping the address entirely.
    ...(address && !postalAddress(address) ? { description: `${name} — ${address}` } : {}),
    openingHours: (b.hours || "").trim() || undefined,
    image: site.seo?.shareImage || site.logo || undefined,
  });

  return schema as Record<string, unknown>;
}
