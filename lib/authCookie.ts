// Which `domain` the owner's sign-in cookie should carry — see app/api/login and app/api/logout.
//
// The studio serves many hosts: the apex, every `<id>-demo.` address, and clients' own domains.
// A host-only cookie set on the apex is invisible on the demo subdomains, so Steven was signed in
// on the editor and anonymous one click later on the draft preview (2026-09-07). Scoping the
// cookie to the studio domain fixes that for every studio host at once. A client's own domain
// (myfullcalendar.com) is a different registrable domain and keeps a host-only cookie — a cookie
// cannot span domains, and it should not.
import { STUDIO_HOST } from "./hostShared";

export function cookieDomainFor(host: string | null | undefined): { domain?: string } {
  const h = (host || "").toLowerCase().split(":")[0];
  if (h === STUDIO_HOST || h.endsWith(`.${STUDIO_HOST}`)) return { domain: STUDIO_HOST };
  return {};
}
