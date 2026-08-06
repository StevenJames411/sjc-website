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
import { RESERVED_SITE_IDS, daysLeft, type Site, type SiteKind, emptyBusiness, emptySeo } from "./sitesShared";

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
  // It has had a domain the whole time; leaving this blank made its own card report "no domain".
  domain: "stevenjamesconsulting.com",
  business: emptyBusiness(),
  seo: emptySeo(),
};

const slugify = (s: string) =>
  String(s || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/**
 * Every website, DELETED ONES EXCLUDED.
 *
 * Deleting is reversible for RETENTION_DAYS, so a deleted site still has a registry row and all
 * its content. Everything that asks "what websites are there" — the public router, the gallery's
 * main grid, name-collision checks — must not see it. Only the code that manages the bin passes
 * `{ includeDeleted: true }`.
 */
export async function readSites(opts?: { includeDeleted?: boolean }): Promise<Site[]> {
  const all = await readSitesRaw();
  return opts?.includeDeleted ? all : all.filter((s) => !s.deletedAt);
}

/** Every row, deleted included. The bin, the sweep and restore need this. */
export async function readSitesRaw(): Promise<Site[]> {
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

  // Raw: a site sitting in the bin still owns its id and its storage keys, so reusing the name
  // would collide with content that is about to come back.
  const existing = await readSitesRaw();
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

  // ⚠️ RAW, NOT readSites(). This read used to be the filtered one, which drops every site sitting
  // in the 30-day bin — so writing the array back ERASED THEM ALL. Saving Website settings on any
  // one site quietly destroyed every deleted site's row: its leadEmail, sheetId, GHL webhook and
  // domain, and with them the re-sign window that deletion is supposed to preserve. Restore then
  // failed with "No such website."
  //
  // The write guard would not have caught it either: it only refuses an array that loses more
  // than three entries AND more than half its length (lib/pgClient.ts), so one or two binned
  // sites disappear inside the tolerance.
  //
  // deleteSite, restoreSite and purgeSiteForever all read raw already. This was the one that
  // didn't, and it is the one that runs on an ordinary save.
  const sites = await readSitesRaw();
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

/**
 * Delete a website — RECOVERABLE for RETENTION_DAYS, then erased by the sweep.
 *
 * Deleting does not destroy anything. The row is stamped `deletedAt`, which takes the site out of
 * readSites() — so it stops serving publicly, leaves the gallery, and frees nothing else — and its
 * content sits exactly where it was. One click puts it back.
 *
 * ⚠️ WHY IT ISN'T IMMEDIATE ANY MORE. It used to be one-way, and 30 days is what every comparable
 * product gives you (Google Workspace, Shopify, Mailchimp, Squarespace, GoHighLevel) because a
 * client who cancels in a huff often wants back in a fortnight later. It also means Steven can
 * stop hesitating over the button.
 */
export async function deleteSite(id: string): Promise<{ ok: boolean; error?: string }> {
  const s = String(id || "").trim();
  if (s === SJC) return { ok: false, error: "The SJC site can't be deleted." };

  const all = await readSitesRaw();
  const row = all.find((x) => x.id === s);
  if (!row) return { ok: false, error: "No such website." };
  if (row.deletedAt) return { ok: true }; // already in the bin; deleting twice is not an error

  const next = all.map((x) => (x.id === s ? { ...x, deletedAt: new Date().toISOString() } : x));
  return (await writeSites(next))
    ? { ok: true }
    : { ok: false, error: "Couldn't save — storage is unavailable." };
}

/** Put a deleted website back. Nothing was removed, so this is just clearing the stamp. */
export async function restoreSite(id: string): Promise<{ ok: boolean; error?: string }> {
  const s = String(id || "").trim();
  const all = await readSitesRaw();
  const row = all.find((x) => x.id === s);
  if (!row) return { ok: false, error: "No such website." };
  if (!row.deletedAt) return { ok: true };

  // A site whose name was reused while it sat in the bin can't come back to a taken address.
  const clash = all.some((x) => x.id !== s && !x.deletedAt && x.domain && row.domain && x.domain === row.domain);
  if (clash) return { ok: false, error: `Another website is already using ${row.domain}.` };

  const next = all.map((x) => (x.id === s ? { ...x, deletedAt: undefined } : x));
  return (await writeSites(next))
    ? { ok: true }
    : { ok: false, error: "Couldn't save — storage is unavailable." };
}

/**
 * ERASE A WEBSITE FOR GOOD. No undo, by design.
 *
 * Runs from the 30-day sweep, or by hand from the bin when Steven wants it gone now. Everything
 * this site owns is emptied — pages, draft and published content, the compiled design stylesheet,
 * brand, and the intake record with the owner's answers and photo links.
 *
 * ⚠️ THE HISTORY GOES TOO. `state_rev` is append-only and is what makes a bad save recoverable, so
 * nothing else in the codebase touches it. But "we delete your data after 30 days" is not true
 * while every past revision of their pages is still sitting there, and that promise is the whole
 * reason this function exists. Deleting those rows is the difference between the live copy being
 * gone and the DATA being gone.
 *
 * Order matters: content first, history second, registry row last — a failure part-way leaves the
 * site visible in the bin rather than stranding orphaned content nobody can see. That exact
 * failure is how thirteen dead websites accumulated unnoticed.
 */
export async function purgeSiteForever(id: string): Promise<{ ok: boolean; error?: string }> {
  const s = String(id || "").trim();
  if (s === SJC) return { ok: false, error: "The SJC site can't be deleted." };

  const all = await readSitesRaw();
  if (!all.some((x) => x.id === s)) return { ok: false, error: "No such website." };

  const { readPages } = await import("./pageRegistry");
  const client = getClient();
  const k = siteKeys(s);
  const failed: string[] = [];
  const keys: string[] = [];
  const kill = async (key: string) => {
    keys.push(key);
    const res = await createKvStore(client, key).purge();
    if (!res.ok) failed.push(`${key}: ${res.reason}`);
  };

  for (const p of await readPages(s)) {
    await kill(k.puck(p.slug));
    await kill(k.puck(p.slug, true));
    // A page from a bought design keeps its compiled stylesheet in its own key.
    await kill(k.designCss(p.slug));
    await kill(k.designCss(p.slug, true));
  }
  await kill(k.pages);
  await kill(k.brand());
  await kill(k.brand(true));
  await kill(k.intake);

  if (failed.length) {
    return { ok: false, error: `Nothing was erased — ${failed.join("; ")}` };
  }

  await dropHistory(keys);

  return (await writeSites(all.filter((x) => x.id !== s)))
    ? { ok: true }
    : { ok: false, error: "Content was erased but the list couldn't be saved." };
}

/**
 * Remove these keys' revision history.
 *
 * Deliberately the ONLY place in the codebase that deletes from state_rev, and it runs only from
 * purgeSiteForever. Everywhere else the history is untouchable on purpose.
 *
 * Best-effort: if it fails the content is still gone, which is the part that matters operationally
 * — so it logs rather than failing the erase and leaving a half-deleted site in the list.
 */
async function dropHistory(keys: string[]): Promise<void> {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!url || !keys.length) return;
  try {
    const pg = (await import("pg")).default;
    const pool = new pg.Pool({ connectionString: url, max: 2 });
    try {
      await pool.query("delete from state_rev where key = any($1::text[])", [keys]);
    } finally {
      await pool.end();
    }
  } catch (e) {
    console.error(`[sites] history not removed for ${keys.length} keys: ${(e as Error).message}`);
  }
}

/** Deleted sites whose 30 days are up. The sweep's input. */
export async function expiredSites(now = Date.now()): Promise<Site[]> {
  const all = await readSitesRaw();
  return all.filter((s) => {
    const left = daysLeft(s, now);
    return left !== null && left <= 0;
  });
}

/**
 * SJC'S OWN CONTACT NUMBER — one place, read from the record.
 *
 * ⚠️ This number was hardcoded in THIRTEEN files and stored in ZERO editable ones. Steven went
 * looking for it in the website builder to correct it and couldn't find it, because it was never
 * there — it lived in the source. That is the bug this exists to end.
 *
 * The literals stay only as a floor so nothing renders blank while SJC's record is still empty.
 * Fill in `business.phoneDisplay` on the SJC site in Website settings and every caller follows,
 * with no code change.
 */
export async function sjcContact(): Promise<{ display: string; dial: string }> {
  const site = await findSite(SJC);
  const display = (site?.business?.phoneDisplay || "").trim() || "(210) 851-4906";
  const dial = (site?.business?.phone || "").trim() || "+12108514906";
  return { display, dial };
}
