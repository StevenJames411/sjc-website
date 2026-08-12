// Public-address helpers — PURE, no storage, no next/headers, safe to import in the browser.
//
// Split from ./host for the same reason sitesShared is split from sites: the editor toolbar and
// the site gallery are client components, and they have to show the SAME address the server will
// actually serve. Two copies of this arithmetic is how the link Steven copies stops matching the
// page a prospect opens.

/**
 * The domain demos live one segment under.
 *
 * ⛔ 2026-08-11: MOVED FROM stevenjamesdesigns.com TO THE CONSULTING DOMAIN.
 * Designs and Consulting merged into one brand, so there is no second root for client
 * work to hang off. Every demo address in the studio is built from this one constant
 * (see `publicBaseFor` below) — the Design Library cards, the editor toolbar, the
 * copy-link button — so this line moves all of them at once.
 *
 * It is deliberately the SAME value as SJC_HOST now, and that is safe because
 * `resolveHost` in ./host.ts checks `host === sjcHost()` BEFORE the studio branch:
 * the apex keeps serving the SJC site, and only `<id>-demo.` subdomains take the
 * demo path. The one thing it retires is the built-in studio sales page at the root,
 * which the merge is retiring anyway.
 *
 * ⚠️ Requires a wildcard DNS record on this domain. stevenjamesconsulting.com is on
 * GoDaddy's nameservers (its mail is Google Workspace, so they must not move), so the
 * wildcard is a `*` CNAME -> cname.vercel-dns.com added there on 2026-08-11, plus
 * `*.stevenjamesconsulting.com` attached to this Vercel project.
 */
export const STUDIO_HOST = "stevenjamesconsulting.com";

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

/**
 * The onboarding link for a business.
 *
 * ON THE STUDIO HOST, ALWAYS, AND IT NEVER MOVES — same rule as invoiceUrlFor above.
 *
 * ── WHY THIS IS NOT DERIVED FROM publicBaseFor ────────────────────────────────────────────────
 * It used to be, and that made the address change the moment a domain landed on her record: the
 * link went from <id>-demo.stevenjamesdesigns.com/onboard to herdomain.com/onboard. She'd have
 * been texted the first one, be halfway through, and the page would still be telling her "your
 * answers save as you go — come back to the same link." Buying her domain locked her out of her
 * own form.
 *
 * The mistake underneath was tying an EARLY-phase artifact to a LATE-phase fact. She fills this
 * in so the site can be built; the domain doesn't exist yet and won't for days.
 *
 * A site's id is permanent, so this address is permanent — domain purchase, DNS propagation, a
 * change of registrar later, none of it reaches her form. Her business name is still in the path,
 * which is the part that makes it read as legitimate in a text message; the demo subdomain was
 * never doing anything the path doesn't do.
 *
 * ⚠️ It also has to be a URL something ANSWERS. app/[slug]/onboard/page.tsx takes the business
 * from the PATH, so on her own subdomain (`/onboard`, no slug) it looked for a page of her site
 * named "onboard" and 404'd. Generating this shape is what makes that route correct again.
 */
export function onboardUrlFor(site: { id: string; domain?: string }, token?: string): string {
  const host = normalizeHost(process.env.NEXT_PUBLIC_STUDIO_DOMAIN || STUDIO_HOST);
  // ⚠️ THE TOKEN IS THE LAST SEGMENT (2026-08-12). Her business name stays in the path — that is
  // what makes the link read as legitimate in a text message — and the unguessable half sits after
  // it. A URL built without one does not open: the token is always required, and a record that has
  // none reads as closed until it is reopened. See lib/intakeLinks.ts.
  return `https://${host}/${site.id}/onboard${token ? `/${token}` : ""}`;
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
