import { permanentRedirect } from "next/navigation";
import { STUDIO_HOST } from "@/lib/hostShared";

// THE WEB STUDIO MOVED OUT.
//
// This offer used to live at stevenjamesconsulting.com/websites — a second business nested inside
// the AI-implementation site, sharing its domain, its schema and its root namespace. It now has
// its own home at stevenjamesdesigns.com, so this address exists only to forward the links that
// are already out in the world.
//
// The CONTENT did not move: the page is still edited at /edit/websites and still stored under
// SJC's `websites` page key. Storage keys are deliberately independent of public URLs — see
// lib/siteKeys.ts — so changing where a page is served costs nothing and migrates nothing.
//
// Why a redirect rather than deleting the route: a texted link to /websites is the whole reason
// this offer got any traffic, and a 404 on an address a prospect was given is worse than an extra
// hop. 308 tells Google the move is permanent and passes the authority along.
export const dynamic = "force-dynamic";

export default function WebsitesMoved() {
  permanentRedirect(`https://${STUDIO_HOST}/`);
}
