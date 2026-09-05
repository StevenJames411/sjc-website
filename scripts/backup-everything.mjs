#!/usr/bin/env node
/**
 * backup-everything.mjs — MIRROR EVERY SITE'S PHOTOS AND CONTENT TO A REPO.
 *
 * ⛔ WHY THIS EXISTS, AND IT IS NOT HYPOTHETICAL. On 2026-09-04 a retired site was purged, which
 * deletes its `sites/<id>/` blob prefix by design. Three images the LIVE site was serving lived in
 * that folder — the About hero, an explainer graphic and the favicon — because the upload route
 * used to default its folder to a hardcoded id. They went instantly, and the only reason anything
 * came back is that Steven happened to have the originals on his laptop.
 *
 * Steven: *"I want all the goddamn photos to this website on a server somewhere so that this
 * doesn't happen again. Whenever we build a website for a customer, their website and their photos
 * need to survive on a goddamn server backed up somewhere, not on my local machine."*
 *
 * ⭐ SO IT MIRRORS BOTH HALVES, BECAUSE EITHER ONE ALONE IS USELESS:
 *   assets/   every object in the blob store, at its own pathname
 *   content/  every site's page documents (draft AND published), page registry, and brand record
 *   manifest.json  url, size, sha256 and site for every asset — the index that makes a restore
 *                  possible without guessing which file was which
 *
 * A page document without its photos restores a site full of broken frames. Photos without the
 * documents restore a folder nobody can reassemble. Both, or it is not a backup.
 *
 * ⚠️ INCREMENTAL BY SHA. An asset already on disk with a matching size is skipped, so a daily run
 * costs a listing call and nothing else. Deleted-upstream files are KEPT — that is the entire
 * point; the backup is not a mirror of today, it is everything that has ever existed.
 *
 * USAGE
 *   node scripts/backup-everything.mjs --dest ~/SJC/sjc-site-backup [--commit] [--push]
 *
 * Credentials: BLOB_READ_WRITE_TOKEN and SITE_EDIT_TOKEN from the environment, or .env.local when
 * run by hand. In CI they are repository secrets — see the workflow this ships with.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join, resolve } from "node:path";
import { execFileSync } from "node:child_process";

const BASE = process.env.SJC_SITE_BASE || "https://stevenjamesconsulting.com";
const arg = (n, d) => {
  const i = process.argv.indexOf(n);
  return i > -1 ? process.argv[i + 1] : d;
};
const has = (n) => process.argv.includes(n);
const DEST = resolve(arg("--dest", join(process.env.HOME || ".", "SJC/sjc-site-backup")).replace(/^~/, process.env.HOME || "~"));

/** .env.local is the hand-run path; CI passes real env vars and has no such file. */
function env(key) {
  if (process.env[key]) return process.env[key];
  for (const f of [".env.local", ".env"]) {
    try {
      const line = readFileSync(f, "utf8").split("\n").find((l) => l.startsWith(key + "="));
      if (line) return line.slice(key.length + 1).trim().replace(/^["']|["']$/g, "");
    } catch {}
  }
  return "";
}

const BLOB = env("BLOB_READ_WRITE_TOKEN");
const EDIT = env("SITE_EDIT_TOKEN");
if (!BLOB) throw new Error("BLOB_READ_WRITE_TOKEN missing — cannot list the asset store");
if (!EDIT) throw new Error("SITE_EDIT_TOKEN missing — cannot read site content");

const api = async (path) => {
  const r = await fetch(BASE + path, { headers: { Authorization: `Bearer ${EDIT}` } });
  if (!r.ok) throw new Error(`HTTP ${r.status} on ${path}`);
  return r.json();
};
const write = (rel, body) => {
  const p = join(DEST, rel);
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, body);
};

// ── 1. EVERY ASSET ───────────────────────────────────────────────────────────────────────────
async function assets() {
  let cursor, all = [];
  do {
    const r = await fetch(`https://blob.vercel-storage.com?limit=1000${cursor ? "&cursor=" + cursor : ""}`, {
      headers: { Authorization: `Bearer ${BLOB}` },
    }).then((r) => r.json());
    all = all.concat(r.blobs || []);
    cursor = r.cursor;
  } while (cursor);

  const manifest = [];
  let fetched = 0, skipped = 0, bytes = 0;
  for (const b of all) {
    const rel = join("assets", b.pathname);
    const p = join(DEST, rel);
    const size = Number(b.size || 0);
    // Already here at the same size — the bytes at a Vercel blob URL never change under you, the
    // URL changes instead, so size equality is a safe skip.
    if (existsSync(p) && statSync(p).size === size) {
      skipped++;
      manifest.push({ pathname: b.pathname, url: b.url, size, sha256: sha(p), site: siteOf(b.pathname) });
      continue;
    }
    const buf = Buffer.from(await fetch(b.url).then((r) => r.arrayBuffer()));
    write(rel, buf);
    fetched++; bytes += buf.length;
    manifest.push({ pathname: b.pathname, url: b.url, size, sha256: sha(p), site: siteOf(b.pathname) });
  }
  write("manifest.json", JSON.stringify({ takenAt: new Date().toISOString(), count: manifest.length, assets: manifest }, null, 1));
  return { total: all.length, fetched, skipped, mb: (bytes / 1048576).toFixed(1) };
}
const sha = (p) => createHash("sha256").update(readFileSync(p)).digest("hex").slice(0, 16);
const siteOf = (p) => (p.match(/^sites\/([^/]+)\//) || [, "(unprefixed)"])[1];

// ── 2. EVERY SITE'S CONTENT ──────────────────────────────────────────────────────────────────
async function content() {
  const { sites } = await api("/api/sites?deleted=1");
  write("content/_sites.json", JSON.stringify(sites, null, 1));
  let pages = 0, skippedSites = [];
  for (const s of sites) {
    // ⛔ ONE BAD SITE MUST NOT ABORT THE RUN. A site in the 30-day bin, or one whose id no longer
    // resolves, makes the registry call throw — and on the first run that killed the whole content
    // pass AFTER 560MB of assets had already been fetched. A backup that only works when every
    // record is healthy is a backup that fails exactly when you need it.
    let list;
    try { ({ pages: list } = await api(`/api/pages?site=${s.id}`)); }
    catch (e) { skippedSites.push(`${s.id}: ${e.message}`); continue; }
    write(`content/${s.id}/_pages.json`, JSON.stringify(list, null, 1));
    for (const pg of list) {
      for (const [suffix, q] of [["draft", ""], ["published", "&pub=1"]]) {
        try {
          const { data } = await api(`/api/puck?page=${pg.slug}&site=${s.id}${q}`);
          if (data) { write(`content/${s.id}/${pg.slug}.${suffix}.json`, JSON.stringify(data, null, 1)); pages++; }
        } catch (e) { skippedSites.push(`${s.id}/${pg.slug}.${suffix}: ${e.message}`); }
      }
    }
    try {
      const brand = await api(`/api/brand?site=${s.id}&pub=1`);
      write(`content/${s.id}/_brand.json`, JSON.stringify(brand, null, 1));
    } catch {}
  }
  if (skippedSites.length) write("content/_skipped.json", JSON.stringify(skippedSites, null, 1));
  return { sites: sites.length, docs: pages, skipped: skippedSites.length };
}

const a = await assets();
const c = await content();
const stamp = `assets ${a.total} (${a.fetched} new, ${a.mb}MB) · ${c.sites} sites · ${c.docs} page documents` + (c.skipped ? ` · ${c.skipped} skipped (see content/_skipped.json)` : "");
write("README.md",
`# SJC site backup\n\nEvery website's photos and content, mirrored off Vercel Blob and the content store.\n` +
`Generated by \`scripts/backup-everything.mjs\` in the sjc-website repo. Do not hand-edit.\n\n` +
`Last run: ${new Date().toISOString()}\n\n${stamp}\n\n` +
`- \`assets/\` — every object, at its original pathname\n- \`content/<site>/\` — page documents (draft + published), page list, brand\n` +
`- \`manifest.json\` — url, size, sha256 and owning site for every asset\n\n` +
`⛔ Files deleted upstream are KEPT here on purpose. This is not a mirror of today; it is everything that has ever existed.\n`);
console.log(stamp);

if (has("--commit")) {
  const git = (...args) => execFileSync("git", args, { cwd: DEST, stdio: "inherit" });
  if (!existsSync(join(DEST, ".git"))) git("init");
  git("add", "-A");
  try {
    git("-c", "user.name=SJC backup", "-c", "user.email=steven@stevenbarchetti.com", "commit", "-m", `backup: ${stamp}`);
  } catch { console.log("nothing changed since the last run"); }
  if (has("--push")) git("push", "origin", "HEAD");
}
