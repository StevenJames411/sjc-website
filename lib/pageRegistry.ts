// The DYNAMIC page registry — what pages exist inside ONE website.
//
// Every function takes a `siteId` and defaults it to SJC, so the original single-site callers keep
// behaving exactly as before while new code is explicit. The key itself comes from lib/siteKeys,
// which is what keeps one client's page list out of another's.
//
// Blob shape: { custom: PuckPage[]; hidden: string[]; titles: Record<string,string> }
//   custom  = pages created in the builder (served by the app/[slug] catch-all route).
//   hidden  = slugs of BUILT-IN pages that were deleted (tombstones — a code-added built-in still
//             appears automatically, but a deleted one stays gone).
//   titles  = renames. A built-in's name lives in code, so a rename is stored here keyed by slug.
//             The SLUG never changes — only the label — so no URL or saved content is affected.
//
// ⚠️ The built-in page list (lib/puckPages.ts) belongs to SJC ONLY. A client website starts with
// whatever its template gave it and nothing else; inheriting SJC's About/Podcast/Apply pages into
// a groomer's site would be exactly the leak this whole change exists to prevent.
import { createKvStore } from "./kvStateStore";
import { getClient } from "./store";
import { PUCK_PAGES, isChrome, type PuckPage } from "./puckPages";
import { siteKeys, SJC } from "./siteKeys";
import { RESERVED_SITE_IDS } from "./sitesShared";

export type PageEntry = PuckPage & { custom: boolean };

// Site-wide pieces that can NEVER be deleted (deleting them would break every page).
const SYSTEM = new Set(["home", "nav", "footer"]);

type RegistryBlob = { custom?: PuckPage[]; hidden?: string[]; titles?: Record<string, string> };

const store = (siteId: string) => createKvStore(getClient(), siteKeys(siteId).pages);
const readBlob = async (siteId: string): Promise<RegistryBlob> =>
  (await store(siteId).read<RegistryBlob>()) || {};

// Title -> safe, URL-friendly slug. Final class matches siteKeys' safe() (a-z0-9-).
const slugify = (title: string) =>
  String(title || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export async function readPages(siteId: string): Promise<PageEntry[]> {
  const blob = await readBlob(siteId);
  const hidden = new Set(blob.hidden || []);
  const titles = blob.titles || {};
  const named = (p: PuckPage) => ({ ...p, title: titles[p.slug] || p.title });

  // Only SJC gets the hardcoded built-ins; see the warning at the top of this file.
  //
  // ⚠️ EXCEPT THE TWO CHROME DOCUMENTS. A client site gets `nav` and `footer` — and nothing else.
  // They are not pages, they are the wrapper every page renders inside, and without them a site's
  // header has to be typed into each page separately and the copies drift the first time one moves
  // (which is exactly what forced this change, with five division pages queued behind it).
  //
  // This is NOT the leak the warning above is about: About/Podcast/Apply stay SJC-only, and an
  // empty chrome document falls back to the page's own blocks rather than to SJC's chrome. There
  // is no path from here to a client wearing Steven's nav.
  const grant = siteId === SJC ? PUCK_PAGES : PUCK_PAGES.filter((p) => isChrome(p.slug));
  const builtins: PageEntry[] = grant
    .filter((p) => !hidden.has(p.slug))
    .map((p) => ({ ...named(p), custom: false }));
  const custom: PageEntry[] = (blob.custom || []).map((p) => ({ ...named(p), custom: true }));
  return [...builtins, ...custom];
}

export async function findPageMeta(
  slug: string,
  siteId: string
): Promise<PageEntry | undefined> {
  return (await readPages(siteId)).find((p) => p.slug === slug);
}

/** Rename a page. Display name only — slug, URL and saved content are untouched. */
export async function renamePage(
  slug: string,
  title: string,
  siteId: string
): Promise<{ ok: boolean; error?: string }> {
  const s = String(slug || "").trim();
  const t = String(title || "").trim();
  if (!t) return { ok: false, error: "A page name is required." };
  if (!(await findPageMeta(s, siteId))) return { ok: false, error: "No such page." };

  const blob = await readBlob(siteId);
  const ok = await store(siteId).write({
    ...blob,
    titles: { ...(blob.titles || {}), [s]: t },
  });
  return ok ? { ok } : { ok: false, error: "Couldn't save — storage is unavailable." };
}

// Top-level Next.js route folders. Only SJC's pages collide with these, because SJC's pages serve
// at /<page> while a client site's serve at /<site>/<page>.
const ROUTE_FOLDERS = ["about", "api", "apply", "edit", "faqs", "guest", "podcast", "share", "websites"];

// Static segments under /edit/<site>/ — a page with one of these slugs would be shadowed in the
// builder by the route of the same name and become uneditable.
// ⚠️ ADD A SEGMENT HERE THE MOMENT YOU ADD ONE UNDER /edit/[site]/. A static segment WINS over
// the dynamic [page] route, so a page slugged the same name is created happily and then can never
// be opened in the builder — content that exists, renders publicly, and has no way back in.
// "brand" joined the list when /edit/[site]/brand landed on 2026-08-06.
const EDITOR_SEGMENTS = ["settings", "brand"];

// Every slug already spoken for inside this site.
//
// ⚠️ NOT `RESERVED_SITE_IDS`. That list reserves WEBSITE ids and contains "home" — applying it to
// page slugs meant a new site's first page came out as "home-2", and the public route looks for
// "home", so the site 404'd at its own address. Site ids and page slugs are different namespaces.
async function reservedSlugs(siteId: string): Promise<Set<string>> {
  const pages = await readPages(siteId);
  return new Set([
    ...EDITOR_SEGMENTS,
    ...(siteId === SJC ? [...ROUTE_FOLDERS, ...PUCK_PAGES.map((p) => p.slug)] : []),
    ...pages.map((p) => p.slug),
  ]);
}

export async function createPage(
  title: string,
  siteId: string
): Promise<{ ok: boolean; slug?: string; error?: string }> {
  const t = String(title || "").trim();
  if (!t) return { ok: false, error: "A page name is required." };
  const base = slugify(t);
  if (!base) return { ok: false, error: "That name has no usable letters or numbers." };

  const reserved = await reservedSlugs(siteId);
  let slug = base;
  let n = 2;
  while (reserved.has(slug)) slug = `${base}-${n++}`;

  const blob = await readBlob(siteId);
  const custom = [...(blob.custom || []), { slug, title: t }];
  const ok = await store(siteId).write({ ...blob, custom });
  return ok ? { ok, slug } : { ok: false, error: "Couldn't save — storage is unavailable." };
}

/**
 * Copy a page — content and all — to a new name inside the SAME site.
 *
 * ⚠️ This is page-level duplication (a second Services page, say). Standing up a new CLIENT is
 * `createSite({ from })` in lib/sites.ts — copying a finished page into the same drawer is what
 * produced one flat list of everybody's pages in the first place.
 *
 * Copies the DRAFT and the PUBLISHED snapshot separately, stripping `_pub`: a copy starts
 * unpublished so a half-edited page can never be live at a URL before it's been looked at.
 */
export async function duplicatePage(
  fromSlug: string,
  title: string,
  siteId: string
): Promise<{ ok: boolean; slug?: string; error?: string }> {
  const src = String(fromSlug || "").trim();
  if (!src) return { ok: false, error: "No page to copy from." };
  if (!(await findPageMeta(src, siteId))) return { ok: false, error: "That page doesn't exist." };

  const created = await createPage(title, siteId);
  if (!created.ok || !created.slug) return created;
  const dest = created.slug;

  const client = getClient();
  const k = siteKeys(siteId);

  let copied = 0;
  for (const pub of [false, true]) {
    const data = await createKvStore(client, k.puck(src, pub)).read<Record<string, unknown>>();
    if (!data) continue;
    const { _pub, ...rest } = data as { _pub?: number };
    if (await createKvStore(client, k.puck(dest, pub)).write(rest)) copied++;
  }

  if (!copied) {
    // Nothing came across — don't leave a phantom page in the switcher pointing at nothing.
    await deletePage(dest, siteId);
    return { ok: false, error: "Couldn't copy the page's content — nothing was created." };
  }
  return { ok: true, slug: dest };
}

export async function deletePage(
  slug: string,
  siteId: string
): Promise<{ ok: boolean; error?: string }> {
  const s = String(slug || "").trim();
  if (SYSTEM.has(s)) {
    return { ok: false, error: "That page is part of the site and can't be deleted." };
  }

  const blob = await readBlob(siteId);
  const prevCustom = blob.custom || [];
  const custom = prevCustom.filter((p) => p.slug !== s);
  const wasCustom = custom.length !== prevCustom.length;
  const isBuiltin = siteId === SJC && PUCK_PAGES.some((p) => p.slug === s);
  if (!wasCustom && !isBuiltin) return { ok: false, error: "No such page." };

  const hidden = new Set(blob.hidden || []);
  if (isBuiltin) hidden.add(s); // tombstone the built-in so it stays gone

  const ok = await store(siteId).write({ ...blob, custom, hidden: [...hidden] });

  // purge the page's Puck content (draft + published) so its URL 404s
  const client = getClient();
  const k = siteKeys(siteId);
  await createKvStore(client, k.puck(s)).write({});
  await createKvStore(client, k.puck(s, true)).write({});

  return ok ? { ok } : { ok: false, error: "Couldn't save the change." };
}
