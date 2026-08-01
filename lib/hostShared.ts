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
  return { origin: `https://${STUDIO_HOST}`, prefix: `/${site.id}` };
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
