// The DYNAMIC page registry — the source of truth for what pages exist in the builder.
// Replaces the old fixed PUCK_PAGES list at runtime: the built-in pages are still the seed,
// but the owner can now CREATE new pages and DELETE any page from the editor, and those changes
// persist in the shared Upstash drawer (Redis key `sjc-pages`). Server-only (pulls in ioredis).
//
// Blob shape: { custom: PuckPage[]; hidden: string[] }
//   custom  = pages the owner created in the builder (served by the app/[slug] catch-all route).
//   hidden  = slugs of BUILT-IN pages the owner deleted (tombstones — so a code-added built-in
//             still appears automatically, but a deleted one stays gone).
// readPages() = the built-ins (minus hidden) + the custom pages. Degrades to the built-ins when
// Redis is unprovisioned (never crashes the editor).
import { createKvStore } from "./kvStateStore";
import { getClient } from "./kvRedis";
import { PUCK_PAGES, type PuckPage } from "./puckPages";
import { puckKey } from "./puckContent";

export type PageEntry = PuckPage & { custom: boolean };

const REGISTRY_KEY = "sjc-pages";

// Site-wide pieces that can NEVER be deleted (deleting them would break every page).
const SYSTEM = new Set(["home", "nav", "footer"]);

// Every top-level app/ route folder. A new page's slug can't collide with one of these — a
// hardcoded Next.js route wins precedence and would silently shadow the new page's content.
const ROUTE_FOLDERS = [
  "about", "apply", "assessment", "asset-trap", "board-of-directors", "case-study",
  "discover-the-lies", "edit", "faqs", "financial-trap", "for-agencies", "hustle-trap",
  "industries", "master-trap", "med-spa", "podcast", "raising-capital", "rock-star-trap",
  "tech", "time-trap", "what-changed", "api", "share",
];

type RegistryBlob = { custom?: PuckPage[]; hidden?: string[] };

const store = () => createKvStore(getClient(), REGISTRY_KEY);
const readBlob = async (): Promise<RegistryBlob> => (await store().read<RegistryBlob>()) || {};

// Title -> safe, URL-friendly slug. Final class matches puckContent's safe() (a-z0-9-).
const slugify = (title: string) =>
  String(title || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export async function readPages(): Promise<PageEntry[]> {
  const blob = await readBlob();
  const hidden = new Set(blob.hidden || []);
  const builtins: PageEntry[] = PUCK_PAGES
    .filter((p) => !hidden.has(p.slug))
    .map((p) => ({ ...p, custom: false }));
  const custom: PageEntry[] = (blob.custom || []).map((p) => ({ ...p, custom: true }));
  return [...builtins, ...custom];
}

export async function findPageMeta(slug: string): Promise<PageEntry | undefined> {
  return (await readPages()).find((p) => p.slug === slug);
}

// Every slug already spoken for — existing pages + hardcoded route folders.
async function reservedSlugs(): Promise<Set<string>> {
  const pages = await readPages();
  return new Set([
    ...ROUTE_FOLDERS,
    ...PUCK_PAGES.map((p) => p.slug),
    ...pages.map((p) => p.slug),
  ]);
}

export async function createPage(
  title: string
): Promise<{ ok: boolean; slug?: string; error?: string }> {
  const t = String(title || "").trim();
  if (!t) return { ok: false, error: "A page name is required." };
  const base = slugify(t);
  if (!base) return { ok: false, error: "That name has no usable letters or numbers." };

  // never collide with an existing page or a hardcoded route — bump -2, -3, … if taken
  const reserved = await reservedSlugs();
  let slug = base;
  let n = 2;
  while (reserved.has(slug)) slug = `${base}-${n++}`;

  const blob = await readBlob();
  const custom = blob.custom || [];
  custom.push({ slug, title: t });
  const ok = await store().write({ ...blob, custom });
  return ok ? { ok, slug } : { ok: false, error: "Couldn't save — storage is unavailable." };
}

export async function deletePage(slug: string): Promise<{ ok: boolean; error?: string }> {
  const s = String(slug || "").trim();
  if (SYSTEM.has(s)) return { ok: false, error: "That page is part of the site and can't be deleted." };

  const blob = await readBlob();
  const prevCustom = blob.custom || [];
  const custom = prevCustom.filter((p) => p.slug !== s);
  const wasCustom = custom.length !== prevCustom.length;
  const isBuiltin = PUCK_PAGES.some((p) => p.slug === s);
  if (!wasCustom && !isBuiltin) return { ok: false, error: "No such page." };

  const hidden = new Set(blob.hidden || []);
  if (isBuiltin) hidden.add(s); // tombstone the built-in so it stays gone

  const ok = await store().write({ custom, hidden: [...hidden] });

  // purge the page's Puck content (draft + published) so its URL 404s
  const client = getClient();
  await createKvStore(client, puckKey(s)).write({});
  await createKvStore(client, puckKey(s, true)).write({});

  return ok ? { ok } : { ok: false, error: "Couldn't save the change." };
}
