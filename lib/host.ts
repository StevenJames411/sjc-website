// WHICH BUSINESS IS THIS REQUEST FOR? Answered from the hostname. SERVER ONLY.
//
// One deployment answers to three kinds of address:
//
//   stevenjamesconsulting.com   SJC itself — the AI implementation company
//   stevenjamesdesigns.com      the web studio — sales page at /, demos at /<site>
//   bellasgrooming.com          a customer who bought, served at their own root
//
// ── WHY THIS IS NOT IN middleware.ts ──────────────────────────────────────────────────────────
// The obvious place to branch on a hostname is the middleware, and it can't be done there: it
// runs on the edge runtime, and matching a customer domain means reading the site registry out of
// Postgres. Middleware would have to make a network hop on every single request — including every
// request for an unknown host, which is what a bad bot sends.
//
// Server components already read the registry, and `headers()` is available to them, so the branch
// lives at the page level instead. No rewrites, no vercel.json, no database client at the edge.
//
// ── THE RULE THAT KEEPS THE LIVE SITE SAFE ────────────────────────────────────────────────────
// UNKNOWN HOST => SJC. Preview deployments, *.vercel.app, localhost, an IP, a Host header someone
// invented — all of it falls through to exactly the behaviour that exists today. A new hostname
// can only ever ADD a mapping; it can never take the selling site away.
//
// Pure address arithmetic lives in ./hostShared so the editor and the gallery can show the same
// URL the server will serve.
import { headers } from "next/headers";
import { cache } from "react";
import { readSites, type Site } from "./sites";
import { SJC } from "./siteKeys";
import { normalizeHost, STUDIO_HOST, SJC_HOST } from "./hostShared";

export * from "./hostShared";

/** Env overrides so a rename, or testing on a preview URL, doesn't need a code change. */
const studioHost = () => normalizeHost(process.env.STUDIO_DOMAIN || STUDIO_HOST);
const sjcHost = () => normalizeHost(process.env.SJC_DOMAIN || SJC_HOST);

export type HostKind =
  /** SJC's own site, and the fallback for anything unrecognised. */
  | { kind: "sjc" }
  /** The web studio: its sales page at /, its demos one level down. */
  | { kind: "studio" }
  /** A customer's own domain. Their site is served at the root of it. */
  | { kind: "client"; site: Site };

/**
 * The host of the request being served. `x-forwarded-host` first, because that is what Vercel
 * sets when a custom domain is attached; `host` is the fallback for local development.
 */
async function requestHost(): Promise<string> {
  const h = await headers();
  return normalizeHost(h.get("x-forwarded-host") || h.get("host") || "");
}

/**
 * Resolve the hostname to a site.
 *
 * `cache()` dedupes within one request — a page asks once in generateMetadata and again in the
 * component, and both should cost one registry read rather than two. It deliberately does NOT
 * cache across requests: a domain typed into Website settings has to take effect on the next page
 * load, not after some revalidation window nobody can see.
 */
export const resolveHost = cache(async (): Promise<HostKind> => {
  const host = await requestHost();

  if (!host || host === sjcHost()) return { kind: "sjc" };

  // THE REGISTRY WINS, INCLUDING FOR THE STUDIO'S OWN DOMAIN.
  //
  // Checked before the studio branch on purpose. The studio's sales page is not a special kind of
  // page — it is a website Steven builds in his own builder, exactly like a client's, and it
  // claims stevenjamesdesigns.com the same way a client's site claims theirs. Assign the domain in
  // Website settings and it serves at the root; there is no code path to change and no hardcoded
  // sales page to keep in sync with the builder.
  const sites = await readSites();
  const site = sites.find((s) => s.id !== SJC && s.domain && normalizeHost(s.domain) === host);
  if (site) return { kind: "client", site };

  // A DEMO: <site-id>.stevenjamesdesigns.com
  //
  // Demos get a subdomain rather than a path because the studio's own domain root belongs to the
  // sales page — once a site is serving there, /anything is one of ITS pages, so there is no path
  // namespace left for demos to use. A subdomain also reads as a real website to a prospect,
  // which a /path never does.
  //
  // The label is matched against the registry, never trusted: an unknown subdomain falls through
  // to SJC rather than rendering anything.
  const studio = studioHost();
  if (host.endsWith(`.${studio}`)) {
    const label = host.slice(0, -(studio.length + 1));
    // Only one level. a.b.stevenjamesdesigns.com is not a demo.
    if (label && !label.includes(".")) {
      const demo = sites.find((s) => s.id !== SJC && s.id === label);
      if (demo) return { kind: "client", site: demo };
    }
  }

  // Nothing in the registry claims it yet, so fall back to the built-in sales page. This is what
  // serves stevenjamesdesigns.com until a site is assigned to it — never a blank domain.
  if (host === studio) return { kind: "studio" };

  // Unknown: a preview URL, localhost, or a domain pointed here before its record was filled in.
  // SJC is the safe answer — see the note at the top of this file.
  return { kind: "sjc" };
});
