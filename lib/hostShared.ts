// Public-address helpers — PURE, no storage, no next/headers, safe to import in the browser.
//
// Split from ./host for the same reason sitesShared is split from sites: the editor toolbar and
// the site gallery are client components, and they have to show the SAME address the server will
// actually serve. Two copies of this arithmetic is how the link Steven copies stops matching the
// page a prospect opens.

/** The web studio's domain. Demos live one segment under it. */
export const STUDIO_HOST = "stevenjamesdesigns.com";

/** SJC's own domain. Anything unrecognised resolves here — see lib/host.ts. */
export const SJC_HOST = "stevenjamesconsulting.com";

/** Strip port and a leading www., and lowercase. `www.x.com` and `x.com` are the same host. */
export function normalizeHost(raw: string): string {
  return String(raw || "")
    .toLowerCase()
    .split(",")[0] // x-forwarded-host can carry a list
    .trim()
    .replace(/:\d+$/, "")
    .replace(/^www\./, "");
}

/**
 * Where a site's pages live.
 *
 *   has a domain (they bought)   origin = their domain,  prefix = ""
 *   no domain yet (a demo)       origin = the studio,    prefix = "/<site-id>"
 *
 * The prefix disappearing the moment a domain is set is the whole point: buying doesn't migrate
 * anything, it just changes which address serves the same stored content.
 */
export function publicBaseFor(site: { id: string; domain?: string }): {
  origin: string;
  prefix: string;
} {
  const domain = normalizeHost(site.domain || "");
  if (domain) return { origin: `https://${domain}`, prefix: "" };
  // No domain yet: a demo on its own subdomain of the studio.
  //
  // The `-demo` suffix says what the link is. A prospect opening
  // bobs-landscaping-demo.stevenjamesdesigns.com sees his own business name first and knows it's a
  // mockup; the studio's brand sits in the tail where it belongs. It's driven by the SAME rule
  // that already decides sandbox-vs-live — no domain means demo — so there's one concept, not two,
  // and the suffix disappears on its own the moment a domain is set.
  //
  // The prefix stays empty: a demo is served at the ROOT of its subdomain, so its pages sit at
  // /services rather than /bobs/services. That's what makes the swap at sale free — no URL inside
  // the site changes, only the address in front of them.
  return { origin: `https://${site.id}-demo.${STUDIO_HOST}`, prefix: "" };
}

/** The absolute public URL of one page. A site's FIRST page sits at its bare address. */
export function publicUrlFor(
  site: { id: string; domain?: string },
  page = "",
  isFirstPage = true
): string {
  const { origin, prefix } = publicBaseFor(site);
  const tail = !page || isFirstPage ? "" : `/${page}`;
  return `${origin}${prefix}${tail}` || origin;
}

/** Just the path part, for a link that stays on the current host. */
export function publicPathFor(
  site: { id: string; domain?: string },
  page = "",
  isFirstPage = true
): string {
  const { prefix } = publicBaseFor(site);
  const tail = !page || isFirstPage ? "" : `/${page}`;
  return `${prefix}${tail}` || "/";
}

/** The onboarding link for a business. Same shape as her website, deliberately. */
export function onboardUrlFor(site: { id: string; domain?: string }): string {
  const { origin, prefix } = publicBaseFor(site);
  return `${origin}${prefix}/onboard`;
}

/**
 * The customer's link to an invoice.
 *
 * ON THE STUDIO HOST, ALWAYS. Both domains serve the same deployment, so /i/<id> answers on
 * either — but the address is part of the document. A bill from Steven James Designs arriving at
 * stevenjamesconsulting.com makes the person reading it check whether they've been phished, and
 * they'd be right to. It's the same rule as the link preview: whoever the invoice says it's from
 * is who the URL has to say it's from.
 */
export function invoiceUrlFor(publicId: string): string {
  const host = normalizeHost(process.env.NEXT_PUBLIC_STUDIO_DOMAIN || STUDIO_HOST);
  return `https://${host}/i/${publicId}`;
}
