// Move a page OUT of a website and into one of its own.
//
// WHY THIS EXISTS. Before a website was a first-class object, every page went into one drawer —
// so a client's whole site ended up sitting inside SJC's page list, one entry down from "About".
// Making the container was only half the job; the existing contents still have to be separated,
// and doing it by hand means copying storage keys and hoping.
//
//   POST { fromSite?, slug, name?, dryRun? } -> { ok, id?, moved, business }
//
// ORDER MATTERS AND IS DELIBERATE: create the new website, copy the content, VERIFY the copy
// landed, and only then tombstone the original. A failure at any step leaves the page exactly
// where it was rather than half-moved with nothing serving its URL.
import { createSite, updateSite, deleteSite } from "@/lib/sites";
import { createPage, deletePage, findPageMeta } from "@/lib/pageRegistry";
import { createKvStore } from "@/lib/kvStateStore";
import { getClient } from "@/lib/store";
import { puckKey } from "@/lib/puckContent";
import { SJC } from "@/lib/siteKeys";
import { cleanName, propOf } from "@/lib/publicSitePage";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

type Node = { type?: string; props?: Record<string, unknown> };

/** Pull the business facts the page already carries onto the site record where they belong. */
function factsFrom(data: unknown, fallbackName: string) {
  const footer = ((data as { content?: Node[] } | null)?.content || []).find(
    (b) => b?.type === "SiteFooter"
  )?.props as Record<string, string> | undefined;

  const text = JSON.stringify(data || {});
  const address = (text.match(/\d+\s+[A-Z][\w.]*(?:\s+[A-Z][\w.]*)*\s+(?:Hwy|Highway|St|Street|Ave|Avenue|Rd|Road|Blvd|Dr|Drive|Ln|Lane)[^"]{0,40}/) || [])[0] || "";

  return {
    name: cleanName(
      propOf(data, "SiteHeader", "brandName") || footer?.brandName || fallbackName
    ),
    phone: footer?.phone || (text.match(/tel:(\+?[\d-]+)/) || [])[1] || "",
    phoneDisplay: footer?.phoneDisplay || "",
    email: footer?.email || (text.match(/[\w.+-]+@[\w-]+\.[\w.]+/) || [])[0] || "",
    address,
    hours: "",
  };
}

export async function POST(req: Request) {
  let body: { fromSite?: string; slug?: string; name?: string; dryRun?: boolean };
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "bad json" }, { status: 400 });
  }

  const fromSite = String(body?.fromSite || SJC).trim() || SJC;
  const slug = String(body?.slug || "").trim();
  if (!slug) return Response.json({ ok: false, error: "Which page?" }, { status: 400 });

  const meta = await findPageMeta(slug, fromSite);
  if (!meta) return Response.json({ ok: false, error: "No such page." }, { status: 404 });

  const client = getClient();
  const draft = await createKvStore(client, puckKey(slug, false, fromSite)).read<Record<string, unknown>>();
  const pub = await createKvStore(client, puckKey(slug, true, fromSite)).read<Record<string, unknown>>();
  if (!draft && !pub) {
    return Response.json({ ok: false, error: "That page has no saved content to move." }, { status: 404 });
  }

  const name = String(body?.name || "").trim() || cleanName(meta.title) || slug;
  const business = factsFrom(pub || draft, name);

  if (body?.dryRun) {
    return Response.json({
      ok: true,
      dryRun: true,
      name,
      business,
      willPublish: Boolean(pub?._pub),
      // The URL it serves today must be the URL it serves afterwards.
      urlNow: `/${slug}`,
      urlAfter: `/${slug}`,
    });
  }

  // 1. the new website. Its id is the slug, so the public URL is unchanged.
  const site = await createSite({ name, kind: "client", business });
  if (!site.ok || !site.id) return Response.json(site, { status: 400 });
  const id = site.id;

  if (id !== slug) {
    // createSite bumped the id to avoid a collision, which would silently change the public URL.
    await deleteSite(id);
    return Response.json(
      { ok: false, error: `"${slug}" is already taken as a website id, so its URL would change. Rename first.` },
      { status: 409 }
    );
  }

  // 2. a home page inside it, and the content.
  const home = await createPage("Home", id);
  if (!home.ok || !home.slug) {
    await deleteSite(id);
    return Response.json(home, { status: 400 });
  }

  if (draft) await createKvStore(client, puckKey(home.slug, false, id)).write(draft);
  if (pub) await createKvStore(client, puckKey(home.slug, true, id)).write(pub);

  // 3. VERIFY before removing anything. Read it back out of the new location.
  const check = await createKvStore(client, puckKey(home.slug, pub ? true : false, id)).read<Record<string, unknown>>();
  const blocks = ((check as { content?: unknown[] } | null)?.content || []).length;
  if (!blocks) {
    await deleteSite(id);
    return Response.json({ ok: false, error: "The copy didn't land — nothing was moved." }, { status: 500 });
  }

  // 4. only now, retire the original. deletePage tombstones a built-in and purges its content, so
  //    the page stops appearing in the old site's list and its old keys stop serving.
  const removed = await deletePage(slug, fromSite);

  await updateSite(id, { description: `Moved out of ${fromSite} — ${blocks} blocks.` });

  return Response.json({
    ok: true,
    id,
    page: home.slug,
    blocks,
    business,
    removedFromOldSite: removed.ok,
    url: `/${slug}`,
  });
}
