// Owner-only CRUD for the website registry (gated by middleware, same as /api/puck):
//   GET    /api/sites                          -> { sites }
//   POST   /api/sites { name }                 -> { ok, id }   from blank
//   POST   /api/sites { name, from }           -> { ok, id }   from a template or another site
//   PATCH  /api/sites { id, ...patch }         -> { ok }       name, business facts, seo, domain
//   DELETE /api/sites { id }                   -> { ok }       registry entry + all its content
import { readSites, createSite, updateSite, deleteSite, restoreSite, purgeSiteForever } from "@/lib/sites";
import { siteOr, ownerOnly, currentIdentity } from "@/lib/siteAccess";

// ⛔ WHAT A CLIENT MAY CHANGE ABOUT THEIR OWN WEBSITE. Nothing else, whatever they send.
//
// Found by testing on 2026-08-12, and it was the worst hole of the day: PATCH took `{id, ...patch}`
// and handed the whole object to updateSite with NO site check and NO field check. A signed-in
// client — one who owned NO sites at all — rewrote another site's record on the first try.
//
// The damage was not hypothetical or limited to vandalism. The same call could set:
//   ownerEmails  -> grant themselves permanent access to any website on the platform
//   leadEmail    -> redirect a competitor's enquiries into their own inbox, silently
//   domain       -> point someone else's site at a domain they control
//   status       -> take a paying client's website off the internet
//
// So scoping the ROUTE is not enough; the FIELDS have to be scoped too. A client owns their
// business facts. Everything else — where leads go, what domain serves it, whether it is live, and
// who may sign in — is SJC's plumbing, and the whole offer is that they never touch it.
const CLIENT_EDITABLE = new Set(["business"]);

export const dynamic = "force-dynamic";

// `?deleted=1` includes sites in the 30-day bin. The gallery asks for them so it can offer
// Restore; everything else must never see them.
export async function GET(req: Request) {
  const includeDeleted = new URL(req.url).searchParams.get("deleted") === "1";
  const all = await readSites({ includeDeleted });

  // ⛔ A CLIENT SEES ONLY THEIR OWN. This used to return every site to anyone who was signed in —
  // the full customer list, with each one's lead email, spreadsheet id and domain attached. That
  // is Steven's book of business handed over by a GET.
  const id = await currentIdentity();
  if (id?.sites === "*") return Response.json({ sites: all });
  const mine = id?.email
    ? all.filter((s) => (s.ownerEmails || []).some((o) => (o || "").trim().toLowerCase() === id.email))
    : [];
  return Response.json({ sites: mine });
}

export async function POST(req: Request) {
  // Creating and restoring websites is the owner's job. A client with either could mint sites, or
  // pull one back out of the bin after Steven put it there.
  const denied = await ownerOnly();
  if (denied) return denied;

  let body: { name?: string; from?: string; kind?: string; description?: string; action?: string; id?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "bad json" }, { status: 400 });
  }
  // Restore rides on POST rather than its own route: it's the inverse of DELETE and belongs with
  // the rest of the registry's verbs.
  if (body?.action === "restore") {
    const res = await restoreSite(body?.id || "");
    return Response.json(res, { status: res.ok ? 200 : 400 });
  }

  const res = await createSite({
    name: body?.name || "",
    from: body?.from,
    // Only "template" is settable from outside; everything else is a client site. "sjc" is
    // implicit and must never be creatable, or the live site could be shadowed by a duplicate.
    kind: body?.kind === "template" ? "template" : "client",
    description: body?.description,
  });
  return Response.json(res, { status: res.ok ? 200 : 400 });
}

export async function PATCH(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "bad json" }, { status: 400 });
  }
  const { id, ...patch } = body as { id?: string } & Record<string, unknown>;

  const { site, deny } = await siteOr(id, req);
  if (deny) return deny;

  // The owner may change anything; everyone else is filtered to their own business facts. Filtered
  // SILENTLY rather than refused: the client shell only ever sends those fields, so a rejection
  // here would mean somebody is poking at the API, and a 403 is free information for them.
  const me = await currentIdentity();
  const safe =
    me?.sites === "*"
      ? patch
      : Object.fromEntries(Object.entries(patch).filter(([k]) => CLIENT_EDITABLE.has(k)));

  const res = await updateSite(site.id, safe);
  return Response.json(res, { status: res.ok ? 200 : 400 });
}

// DELETE { id }            -> into the 30-day bin; the site stops serving, nothing is destroyed
// DELETE { id, forever }   -> erased now, including its revision history. No undo.
// POST   { id, action:"restore" } -> back out of the bin
export async function DELETE(req: Request) {
  // Never a client's call, not even for their own site — deletion here is SJC's, and "forever"
  // destroys revision history.
  const denied = await ownerOnly();
  if (denied) return denied;

  let body: { id?: string; forever?: boolean };
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "bad json" }, { status: 400 });
  }
  const id = body?.id || "";
  const res = body?.forever ? await purgeSiteForever(id) : await deleteSite(id);
  return Response.json(res, { status: res.ok ? 200 : 400 });
}
