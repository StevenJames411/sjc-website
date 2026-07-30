// The website registry — the top-level object the whole builder now hangs off.
//
// Before this, a "page" was the biggest thing that existed, so every client's pages sat in one
// flat list and every client's colours competed for one global brand slot. A site is the container
// those things actually belong to: its own pages, its own brand, its own SEO, its own domain.
//
// Three kinds:
//   sjc      — Steven James Consulting itself. Always exists, never deleted, keeps its legacy keys.
//   client   — a real customer's website.
//   template — a starting layout with NO business in it. "New website → from template" copies one.
//              A template is not a special object; that is exactly why a library of them is cheap.
//
// Server-only (pulls in the store). Types that the browser needs live in ./sitesShared.
import { createKvStore } from "./kvStateStore";
import { getClient } from "./store";
import { siteKeys, SITES_KEY, SJC } from "./siteKeys";
import { RESERVED_SITE_IDS, type Site, type SiteKind, emptyBusiness, emptySeo } from "./sitesShared";

export * from "./sitesShared";

type SitesBlob = { sites?: Site[] };

const store = () => createKvStore(getClient(), SITES_KEY);

// SJC is implicit, the same way the built-in pages are: it exists whether or not anything has been
// written to the registry, so a cold/unprovisioned store can never make the live site disappear.
const SJC_SITE: Site = {
  id: SJC,
  name: "Steven James Consulting",
  kind: "sjc",
  description: "The consulting site — AI employees, podcast, the $795 website offer.",
  business: emptyBusiness(),
  seo: emptySeo(),
};

const slugify = (s: string) =>
  String(s || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export async function readSites(): Promise<Site[]> {
  const blob = (await store().read<SitesBlob>()) || {};
  const saved = (blob.sites || []).filter((s) => s && s.id);

  // SJC stays IMPLICIT — it exists whether or not anything has been written, so a cold or
  // unprovisioned store can never make the live site vanish from the builder. But anything saved
  // for it (a renamed business, SEO defaults) merges on top, so it is editable like any other.
  const override = saved.find((s) => s.id === SJC);
  const sjc: Site = {
    ...SJC_SITE,
    ...(override || {}),
    id: SJC,
    kind: "sjc",
    business: { ...SJC_SITE.business, ...(override?.business || {}) },
    seo: { ...SJC_SITE.seo, ...(override?.seo || {}) },
  };
  return [sjc, ...saved.filter((s) => s.id !== SJC)];
}

export async function findSite(id: string): Promise<Site | undefined> {
  return (await readSites()).find((s) => s.id === String(id || "").trim());
}

/** Only the sites you'd start a new build from. */
export async function readTemplates(): Promise<Site[]> {
  return (await readSites()).filter((s) => s.kind === "template");
}

// SJC IS persisted once it's been edited — its implicit defaults in SJC_SITE stay the floor that
// readSites merges over, so a wiped store still shows the live site, but a name or an SEO default
// set here survives.
async function writeSites(sites: Site[]): Promise<boolean> {
  return store().write({ sites });
}

/**
 * Create a website.
 *
 * `from` copies another site's pages and brand — that is what makes a template a template, and
 * it is the same code path whether the source is a template or an existing client site.
 *
 * A copy NEVER inherits the source's business facts or SEO. That is the whole point: cloning a
 * finished site used to drag the previous owner's phone number into the new one.
 */
export async function createSite(opts: {
  name: string;
  kind?: SiteKind;
  from?: string;
  description?: string;
  business?: Partial<Site["business"]>;
  seo?: Partial<Site["seo"]>;
}): Promise<{ ok: boolean; id?: string; error?: string }> {
  const name = String(opts?.name || "").trim();
  if (!name) return { ok: false, error: "A website name is required." };

  const base = slugify(name);
  if (!base) return { ok: false, error: "That name has no usable letters or numbers." };

  const existing = await readSites();
  const taken = new Set([...RESERVED_SITE_IDS, ...existing.map((s) => s.id)]);
  let id = base;
  let n = 2;
  while (taken.has(id)) id = `${base}-${n++}`;

  const site: Site = {
    id,
    name,
    kind: opts?.kind || "client",
    description: opts?.description || "",
    business: { ...emptyBusiness(), name, ...(opts?.business || {}) },
    seo: { ...emptySeo(), ...(opts?.seo || {}) },
  };

  if (!(await writeSites([...existing, site]))) {
    return { ok: false, error: "Couldn't save — storage is unavailable." };
  }

  if (opts?.from) {
    const copied = await copySiteContent(opts.from, id);
    if (!copied) {
      await deleteSite(id);
      return { ok: false, error: "Couldn't copy the template's pages — nothing was created." };
    }
  }

  return { ok: true, id };
}

/**
 * Copy every page (draft + published) and the brand from one site to another.
 *
 * The published marker is stripped on purpose: a new website starts UNPUBLISHED so a half-edited
 * page carrying the wrong business's details can never be live at a URL before it's been looked at.
 */
export async function copySiteContent(fromId: string, toId: string): Promise<boolean> {
  const { readPages } = await import("./pageRegistry");
  const client = getClient();
  const from = siteKeys(fromId);
  const to = siteKeys(toId);

  // The page registry first — without it the copied content has nothing pointing at it.
  const pages = await readPages(fromId);
  const custom = pages.map((p) => ({ slug: p.slug, title: p.title }));
  const wroteRegistry = await createKvStore(client, to.pages).write({ custom, hidden: [], titles: {} });
  if (!wroteRegistry) return false;

  let copied = 0;
  for (const p of pages) {
    for (const pub of [false, true]) {
      const src = await createKvStore(client, from.puck(p.slug, pub)).read<Record<string, unknown>>();
      if (!src) continue;
      const { _pub, ...rest } = src as { _pub?: number };
      if (await createKvStore(client, to.puck(p.slug, pub)).write(rest)) copied++;
    }
  }

  // Brand comes across — a template's whole job is to arrive looking like something.
  for (const pub of [false, true]) {
    const b = await createKvStore(client, from.brand(pub)).read<Record<string, unknown>>();
    if (b) await createKvStore(client, to.brand(pub)).write(b);
  }

  return copied > 0;
}

export async function updateSite(
  id: string,
  patch: Partial<Omit<Site, "id">>
): Promise<{ ok: boolean; error?: string }> {
  const s = String(id || "").trim();
  const sites = await readSites();
  const i = sites.findIndex((x) => x.id === s);
  if (i < 0) return { ok: false, error: "No such website." };

  const next = [...sites];
  next[i] = {
    ...next[i],
    ...patch,
    id: next[i].id,
    // `kind` is not editable — a client site must not be able to promote itself to "sjc" and
    // start reading the live site's storage keys.
    kind: next[i].kind,
    business: { ...next[i].business, ...(patch.business || {}) },
    seo: { ...next[i].seo, ...(patch.seo || {}) },
  };
  return (await writeSites(next))
    ? { ok: true }
    : { ok: false, error: "Couldn't save — storage is unavailable." };
}

export async function deleteSite(id: string): Promise<{ ok: boolean; error?: string }> {
  const s = String(id || "").trim();
  if (s === SJC) return { ok: false, error: "The SJC site can't be deleted." };

  const sites = await readSites();
  if (!sites.some((x) => x.id === s)) return { ok: false, error: "No such website." };

  // Purge its content first, so a failed registry write can't strand live pages at a URL.
  const { readPages } = await import("./pageRegistry");
  const client = getClient();
  const k = siteKeys(s);
  for (const p of await readPages(s)) {
    await createKvStore(client, k.puck(p.slug)).write({});
    await createKvStore(client, k.puck(p.slug, true)).write({});
  }
  await createKvStore(client, k.pages).write({});

  return (await writeSites(sites.filter((x) => x.id !== s)))
    ? { ok: true }
    : { ok: false, error: "Couldn't save the change." };
}
