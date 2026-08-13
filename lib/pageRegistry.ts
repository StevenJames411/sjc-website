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

/**
 * Every slug this site has EVER used — live pages, tombstoned built-ins, renamed ones, and the
 * built-in list itself.
 *
 * ⚠️ NOT `readPages().map(p => p.slug)`, and the difference is what leaks. `readPages` deliberately
 * hides tombstoned built-ins, and a deleted custom page leaves the registry entirely. But deleting
 * a page only blanks its Puck content — its compiled stylesheet and archived design source stay in
 * the store under that slug. A purge that walked only LIVE pages would erase the site and leave
 * the dead pages' design keys behind forever, invisible to the orphan sweeper that is supposed to
 * catch exactly that.
 *
 * For accounting only — deleting, renaming, sweeping. Never for anything user-facing.
 */
export async function allSlugsEver(siteId: string): Promise<string[]> {
  const blob = await readBlob(siteId);
  const out = new Set<string>(["home"]);
  // Built-ins are defined in code, so their keys can exist with no registry row at all.
  for (const p of PUCK_PAGES) out.add(p.slug);
  for (const p of blob.custom || []) out.add(p.slug);
  for (const s of blob.hidden || []) out.add(s);
  for (const s of Object.keys(blob.titles || {})) out.add(s);
  return [...out];
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

// Top-level Next.js route folders.
//
// ⛔ THESE SHADOW EVERY SITE, NOT JUST SJC — AND THE OLD COMMENT HERE SAID OTHERWISE.
// It read: "Only SJC's pages collide with these, because SJC's pages serve at /<page> while a
// client site's serve at /<site>/<page>." That was true when a demo lived under a path prefix.
// It stopped being true when demos moved to their own subdomain and their pages went to the ROOT
// of it (see `publicBaseFor` in lib/hostShared.ts) — from then on a client page slugged `about`
// sits at /about, and a STATIC route segment always beats the catch-all that would have served it.
//
// The failure is silent and total: `createPage` accepts the slug, the editor opens it, publishing
// reports success, and the public URL serves SJC's hardcoded page instead — forever, with no
// error anywhere. Three pages of a freshly imported ten-page site landed exactly there on
// 2026-08-11 (`about`, `podcast`, `careers`) and looked for all the world like a bad import.
//
// ⚠️ KEEP THIS IN STEP WITH `ls app/*/`. A folder added here without a slug reservation is a page
// somebody can create and never see. `careers` was missing from this list while `app/careers/`
// existed, which is how that one got through.
// ⚠️ SHRINKING THIS LIST IS THE FIX, NOT MAINTAINING IT. Every name here is a name NO site can
// use — including the client demos, which were serving SJC's own About page at /about because a
// hardcoded folder wins on every hostname. `about`, `faqs` and `podcast` were pure duplicates of
// what app/[slug] already does for SJC and were DELETED 2026-08-11, which is what frees the names.
// The rest still hold real code (forms, custom layouts) and each one still costs every site a slug.
const ROUTE_FOLDERS = [
  "api", "apply", "careers", "edit", "guest",
  "i", "llms.txt", "share", "v2", "websites",
];

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
/**
 * ⛔ A SLUG MAY NOT END IN `-pub`, AND THIS ONE IS REACHABLE WITH A PLAUSIBLE NAME (2026-08-12).
 *
 * A page's keys are `<ns>-puck-<slug>` for the draft and the same plus `-pub` for the published
 * snapshot. Nothing reserved that suffix — so creating a page called "Home Pub" yields slug
 * `home-pub`, and `puck("home-pub", false)` is byte-identical to `puck("home", true)`.
 *
 * Saving that page's draft therefore OVERWRITES the site's published home page with a document
 * carrying no `_pub` marker, so the front page 404s; deleting it writes `{}` over the same key.
 * A perfectly reasonable page name silently takes the site's home page down.
 *
 * Rejected at creation rather than mangled, so the name is a decision the person makes.
 */
const collidesWithPublishedKey = (slug: string) => /-pub$/.test(slug);

async function reservedSlugs(siteId: string): Promise<Set<string>> {
  const pages = await readPages(siteId);
  return new Set([
    ...EDITOR_SEGMENTS,
    // ROUTE_FOLDERS applies to EVERY site — see the note on the constant. Next.js routing has no
    // idea which site is being served, so a static segment shadows a client's page just as surely
    // as it shadows SJC's. PUCK_PAGES stays SJC-only: those are SJC's own built-in pages, and the
    // ones that would actually collide (`about`, `podcast`) are route folders anyway.
    ...ROUTE_FOLDERS,
    ...(siteId === SJC ? PUCK_PAGES.map((p) => p.slug) : []),
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

  // Refused, not silently renamed: the storage key for a `-pub` slug is the same key as another
  // page's PUBLISHED snapshot, so saving it would take that page off the live site. See
  // collidesWithPublishedKey. Renaming it behind his back would hide a name worth reconsidering.
  if (collidesWithPublishedKey(base)) {
    return {
      ok: false,
      error: `A page name can't end in "pub" — "${base}" would share its storage with another page's published copy. Try another name.`,
    };
  }

  const reserved = await reservedSlugs(siteId);
  let slug = base;
  let n = 2;
  while (reserved.has(slug) || collidesWithPublishedKey(slug)) slug = `${base}-${n++}`;

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

  // ⛔ purge(), NOT write({}) — AND THE DIFFERENCE IS THE WHOLE BUG.
  //
  // This used to write an empty object over both keys. The write guard in pgClient refuses saves
  // that look like data loss, and `{}` over a full page is the most data-loss-shaped write there
  // is, so it was REFUSED EVERY SINGLE TIME. kvStateStore's own header says so in as many words
  // — that is exactly why `purge()` was added, and this caller never got switched over.
  //
  // What it cost: deleting a page removed its registry entry, so the URL 404d and the delete
  // looked like it worked. The content was still sitting there, `_pub` marker intact. Create a
  // page with the same title later — same slug — and the "new blank page" came up as the old
  // deleted one, already published, live at that URL. The page you thought you threw away
  // reappears, and nothing on screen explains why.
  //
  // ⚠️ ALSO PURGE THE LEGACY PER-PAGE DESIGN KEYS. Sheets are content-addressed and global now
  // (props.sheet), so a fresh page cannot inherit a dead design's styling any more — but sites
  // built before that still carry `-designcss-<slug>` / `-designsrc-<slug>` blobs, and leaving
  // them behind is how a purged site fails "scan the store for its id".
  const client = getClient();
  const k = siteKeys(siteId);
  const purges = await Promise.all([
    createKvStore(client, k.puck(s)).purge(),
    createKvStore(client, k.puck(s, true)).purge(),
    createKvStore(client, k.designSrc(s)).purge(),
    createKvStore(client, k.designCss(s, false)).purge(),
    createKvStore(client, k.designCss(s, true)).purge(),
  ]);

  // Say so when the content outlived the registry entry. Silence here is what let the bug above
  // survive: the page vanished from the switcher, so the delete read as complete.
  const failed = purges.filter((r) => !r.ok).map((r) => r.reason || "unknown");
  if (failed.length) {
    return {
      ok: false,
      error:
        `Removed "${s}" from the site, but couldn't erase its content: ${failed.join("; ")}. ` +
        `Don't re-use that page name until this is sorted — a new page with the same name would ` +
        `pick up the old content.`,
    };
  }

  return ok ? { ok } : { ok: false, error: "Couldn't save the change." };
}
