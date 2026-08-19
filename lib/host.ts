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
import { readSites, readSitesRaw, type Site, reachability } from "./sites";
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
  | { kind: "client"; site: Site }
  /**
   * A demo address for a site that has since bought its own domain. Serves NOTHING — 404.
   *
   * ⛔ NOT A REDIRECT. The demo URL is the sales asset; it dies when the sale closes. Forwarding
   * it would keep a second address alive for every customer forever, which is the duplicate this
   * exists to kill.
   */
  | { kind: "gone" };

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
/** Is the signed-in owner making this request? Set by middleware, stripped from anything inbound. */
async function isOwnerRequest(): Promise<boolean> {
  try {
    return (await headers()).get("x-sjc-owner") === "1";
  } catch {
    return false; // outside a request scope (static generation, scripts) nobody is the owner
  }
}

export const resolveHost = cache(async (): Promise<HostKind> => {
  const host = await requestHost();

  if (!host) return { kind: "sjc" };

  // THE REGISTRY WINS — FOR THE STUDIO'S OWN DOMAIN, AND NOW FOR THE APEX TOO.
  //
  // The studio's sales page is not a special kind of page — it is a website Steven builds in his
  // own builder, exactly like a client's, and it claims its domain the same way a client's site
  // claims theirs. Assign the domain in Website settings and it serves at the root; there is no
  // code path to change and no hardcoded sales page to keep in sync with the builder.
  //
  // ⛔ THE APEX USED TO SHORT-CIRCUIT ABOVE THIS LINE. `host === sjcHost()` returned the legacy
  // site before the registry was ever consulted, which made the rule above a half-truth: the
  // registry won everywhere except the one domain that mattered most. Steven rebuilt SJC's own
  // site as `sjc-2026` and there was no setting in the builder that could serve it at the apex.
  //
  // ⚠️ NOTHING VALIDATES DOMAIN UNIQUENESS — `updateSite` writes the field through unchecked — and
  // the built-in `sjc` row declares the apex as its own default (lib/sites.ts). The `s.id !== SJC`
  // filter below is what stops the retiring site re-claiming the apex through this path. Keep it.
  const sites = await readSites();
  const site = sites.find((s) => s.id !== SJC && s.domain && normalizeHost(s.domain) === host);
  // ⛔ THE STATE CHECK IS A BRANCH ON THE FOUND SITE — NEVER A PREDICATE INSIDE THE `.find()`.
  //
  // Written the natural way — `find(s => … && reachability(s).onDomain)` — a site set to Draft
  // stops MATCHING, execution falls six lines down to the apex fallback, and
  // stevenjamesconsulting.com starts serving the RETIRED legacy site (which declares the apex as
  // its own default; see lib/sites.ts). Steven would flip a switch labelled "only you can see
  // this" and put the old site on the money domain, with no error anywhere.
  //
  // Match first, decide second: an unreachable site is GONE, not absent.
  // The owner sees his own work at its real address even while it is Draft — otherwise "how does
  // this look on a phone" has no answer short of publishing it. A visitor still gets the 404.
  if (site) {
    return reachability(site).onDomain || (await isOwnerRequest())
      ? { kind: "client", site }
      : { kind: "gone" };
  }

  // The apex with nothing in the registry claiming it — the legacy site, exactly as before.
  if (host === sjcHost()) return { kind: "sjc" };

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
      // `-demo` is a label, not part of the id — see publicBaseFor in ./hostShared. The bare form
      // is still matched so any link sent before the suffix existed keeps resolving.
      const bare = label.endsWith("-demo") ? label.slice(0, -"-demo".length) : label;
      // ⚠️ RAW — DELETED AND ARCHIVED SITES INCLUDED, AND THAT IS THE WHOLE POINT HERE.
      //
      // `readSites()` hides binned sites, so a deleted site's demo label matched NOTHING and the
      // request fell all the way through to the SJC fallback at the bottom of this function —
      // quietly serving the consulting site at `<their-business>-demo.…`. That is precisely the
      // failure the note below warns about, and it was live for every deleted site.
      //
      // Looking it up raw means the address is recognised as one we used to serve, so it can be
      // answered with `gone` instead of being mistaken for an unknown host.
      // ⛔ `sjc` IS NOT EXCLUDED HERE, AND MUST NOT BE (fixed 2026-08-18).
      //
      // It used to be — copied from the domain lookup above, where the filter IS load-bearing.
      // Here it was the opposite of protective: `sjc-demo.stevenjamesconsulting.com` matched
      // nothing, skipped the reachability check entirely, and fell through to the SJC fallback at
      // the bottom of this function. The retired brand's homepage and its two live intake forms
      // were served publicly — and that host answered `Allow: /` to GPTBot and ClaudeBot while the
      // real site was on `Disallow: /`. The dead brand was the only thing inviting crawlers.
      //
      // Matching it means `sjc` gets judged like every other site: Draft is reachable by nobody,
      // so the address answers `gone`. The apex is still protected by the `s.id !== SJC` filter on
      // the DOMAIN lookup above, which is a different question and stays exactly as it is.
      const demo = (await readSitesRaw()).find((s) => s.id === bare || s.id === label);
      // A site in the bin, or archived, is reachable by nobody — `reachability` already says so,
      // but a deleted one has no status to consult, so it is refused here first.
      if (demo?.deletedAt) return { kind: "gone" };
      // ⛔ THE DEMO ADDRESS DIES THE DAY THEY BUY. Steven, and he has said it more than once:
      // *"everybody gets a demo URL. Once they become a customer, the demo URL dies… If they buy,
      // they get a real URL."* A prospect who didn't buy loses the link — that is the point of it
      // being a demo, not an oversight to be smoothed over with a redirect.
      //
      // ⚠️ GONE, NOT FORWARDED, AND NOT FALLING THROUGH. Falling through would hand the request to
      // the SJC fallback at the bottom of this function, so a dead demo address would quietly
      // serve the consulting site — the same content at a third address, which is worse than the
      // duplicate it was meant to remove.
      // ⚠️ NOW DECIDED BY STATE, NOT BY "HAS A DOMAIN". Same rule, said properly: `onDemo` is true
      // for a Demo site, and for a Published one whose domain is not resolving yet — the handover
      // window, where killing the demo link would leave the prospect with two dead addresses.
      // Draft and Archived are reachable by nobody, which is the whole point of them.
      if (demo) {
        return reachability(demo).onDemo || (await isOwnerRequest())
          ? { kind: "client", site: demo }
          : { kind: "gone" };
      }
    }
  }

  // Nothing in the registry claims it yet, so fall back to the built-in sales page. This is what
  // serves stevenjamesdesigns.com until a site is assigned to it — never a blank domain.
  if (host === studio) return { kind: "studio" };

  // Unknown: a preview URL, localhost, or a domain pointed here before its record was filled in.
  // SJC is the safe answer — see the note at the top of this file.
  return { kind: "sjc" };
});
