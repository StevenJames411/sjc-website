// Tells the client whether the current visitor is the signed-in editor, so the edit
// affordance only appears for Steven. Public visitors get { authed: false } and never
// see any edit UI (and even if they tried, every write is cookie-gated by middleware).
//
// ── IT ALSO ANSWERS "WHERE DOES EDIT GO?" (2026-08-16) ───────────────────────────────────────
// ⛔ THE CLIENT CANNOT WORK THAT OUT, AND WHEN IT TRIED IT WAS WRONG. `EditLink` used to build
// `/edit/<slug>` from a hardcoded path→slug map, with NO site segment — a leftover from when a
// page was the biggest thing that existed. `/edit/<slug>` then falls through the ambiguity route
// in app/edit/[site]/page.tsx, which treats an unknown segment as a page on the LEGACY `sjc` site.
//
// So clicking "Edit this page" on stevenjamesconsulting.com opened `/edit/sjc/home` — the old
// AI-implementation design — while the page you were standing on was served by `sjc-2026`. Two
// different websites, one button, no error. Steven hit it repeatedly and reasonably read it as
// "the studio has wires crossed."
//
// Which site serves a host is a SERVER question (lib/host.resolveHost: a registry site that claims
// the domain wins over the legacy constant). So the server now computes the whole href and the
// client just renders it. There is no path→slug map left to drift.
import { cookies } from "next/headers";
import { resolveHost } from "@/lib/host";
import { readPages, resolveRedirect } from "@/lib/pageRegistry";
import { SJC } from "@/lib/siteKeys";

const COOKIE_NAME = "sjc_site_auth";

function expectedToken(): string | null {
  const pass = process.env.SITE_EDIT_PASSWORD;
  if (!pass) return null;
  const user = process.env.SITE_EDIT_USER || "steven";
  return Buffer.from(`${user}:${pass}`).toString("base64");
}

/** Where the "Edit this page" button should point for `path` on the host that asked. */
async function editHrefFor(path: string): Promise<string | null> {
  const seg = String(path || "/").replace(/^\/+|\/+$/g, "").split("/")[0] || "";
  const h = await resolveHost();

  if (h.kind === "gone") return null;
  // On the studio's domain one segment IS a website, so the segment is the site id.
  if (h.kind === "studio") return seg ? `/edit/${seg}` : null;

  const site = h.kind === "client" ? h.site.id : SJC;
  const pages = await readPages(site);
  if (!pages.length) return null;

  if (!seg) return `/edit/${site}/${pages[0].slug}`;
  if (pages.some((p) => p.slug === seg)) return `/edit/${site}/${seg}`;

  // A renamed page: the old URL still answers publicly (resolvePage follows the redirect), so the
  // edit button has to follow it too rather than vanish.
  const moved = await resolveRedirect(seg, site);
  if (moved && pages.some((p) => p.slug === moved)) return `/edit/${site}/${moved}`;

  return null; // a route folder, not an editable page — show Sign out only
}

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const expected = expectedToken();
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  const authed = Boolean(expected && token === expected);

  // Only resolve the target for the owner — a public visitor gets the same shape as before and
  // costs no registry reads.
  let editHref: string | null = null;
  if (authed) {
    try {
      editHref = await editHrefFor(new URL(req.url).searchParams.get("path") || "/");
    } catch {
      editHref = null; // never let a bad lookup break the sign-out affordance
    }
  }

  return Response.json({ authed, editHref });
}
