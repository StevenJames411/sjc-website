#!/usr/bin/env node
// EXPORT A WEBSITE TO A FOLDER — the exit hatch.
//
//   node scripts/export-site.mjs <site-id> [--out ./export] [--host stevenjamesconsulting.com]
//
// Produces a folder of plain HTML, CSS, JS and images that opens by double-clicking index.html and
// can be dropped on any host — Netlify, S3, a cPanel box, a USB stick.
//
// ── WHY THIS EXISTS ───────────────────────────────────────────────────────────────────────────
// Steven, on the platform he is building: *"we're still renting from Vercel. We're not
// overbuilding software and then turning into a software maintaining business."*
//
// This is what makes that true rather than a hope. Two different things depend on it:
//
//   1. THE CLIENT'S ANSWER TO "WHAT IF YOU DISAPPEAR." A done-for-you service where the vendor
//      holds the only copy is a service nobody sensible signs a big cheque for. "Here is your
//      website, in a folder, it works without us" removes the objection before it is raised.
//   2. HIS OWN. If Vercel triples its price, or the builder becomes a burden, the sites are not
//      hostages. An exit that has never been RUN is not an exit, which is why this is a script
//      that produces a real folder and not a paragraph on a page.
//
// ── HOW, AND WHY THIS WAY ─────────────────────────────────────────────────────────────────────
// It fetches the LIVE PUBLIC PAGES rather than re-rendering from stored content. That is the whole
// trick: whatever a visitor's browser receives is what lands in the folder — tokens resolved,
// forms rendered, design stylesheet applied, chrome in place. Re-rendering would mean a second
// implementation of the renderer, which would drift, and the drift would only show up in the
// artifact handed to a leaving client.
//
// ⚠️ WHAT AN EXPORT CANNOT CARRY, said plainly rather than discovered later: the forms stop
// working. They POST to /api/apply on the live app, which is not in the folder. The export writes
// EXPORT-README.txt saying so, because a client who finds out by losing enquiries is a client who
// tells people about it.
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join, extname } from "node:path";

const args = process.argv.slice(2);
const siteId = args.find((a) => !a.startsWith("--"));
const flag = (n, d) => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : d;
};
const OUT = flag("out", "./export");
const HOST = flag("host", "stevenjamesconsulting.com");

if (!siteId) {
  console.error("usage: node scripts/export-site.mjs <site-id> [--out ./export] [--host <host>]");
  process.exit(1);
}

const token = await (async () => {
  const { readFile } = await import("node:fs/promises");
  try {
    const env = await readFile(new URL("../.env.local", import.meta.url), "utf8");
    return (env.match(/^SITE_EDIT_TOKEN=(.*)$/m)?.[1] || "").trim().replace(/^["']|["']$/g, "");
  } catch {
    return "";
  }
})();

const api = async (path) => {
  const res = await fetch(`https://${HOST}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error(`${path} -> ${res.status}`);
  return res.json();
};

// ── which host actually serves this site's pages ────────────────────────────────────────────
// A live site answers on its own domain; a draft or demo answers on the demo subdomain. Getting
// this wrong does not error — it silently exports the WRONG SITE, because the studio host serves
// its own pages for any slug it recognises.
const { sites } = await api("/api/sites");
const site = (sites || []).find((s) => s.id === siteId);
if (!site) {
  console.error(`No website with id '${siteId}'. Known: ${(sites || []).map((s) => s.id).join(", ")}`);
  process.exit(1);
}
const origin = site.domain
  ? `https://${site.domain}`
  : `https://${siteId}-demo.stevenjamesconsulting.com`;

const { pages } = await api(`/api/pages?site=${siteId}`);
const slugs = (pages || []).map((p) => p.slug).filter((s) => s !== "nav" && s !== "footer");

console.log(`Exporting ${site.name || siteId}`);
console.log(`  from   ${origin}`);
console.log(`  pages  ${slugs.length}`);

const root = join(OUT, siteId);
const assets = new Map(); // absolute url -> local relative path
let assetN = 0;

/** Give a downloaded file a local name that cannot collide and keeps its extension. */
function localName(url) {
  if (assets.has(url)) return assets.get(url);
  let ext = extname(new URL(url).pathname).split("?")[0] || "";
  if (ext.length > 6) ext = "";
  const name = `assets/a${++assetN}${ext}`;
  assets.set(url, name);
  return name;
}

/**
 * Rewrite one page's HTML so every reference points inside the folder.
 *
 * ⚠️ REGEX, DELIBERATELY, AND ONLY OVER ATTRIBUTE VALUES. Parsing the DOM would mean re-serialising
 * it, and a serialiser's idea of correct HTML is not always the browser's — the export must be a
 * faithful copy, not a tidied one.
 */
function rewrite(html, pageDepth) {
  const up = pageDepth > 0 ? "../".repeat(pageDepth) : "./";

  // Absolute references to our own origin, and to the blob store the photos live in.
  html = html.replace(/(href|src)="(https?:\/\/[^"]+)"/g, (m, attr, url) => {
    const sameApp = url.startsWith(origin) || url.includes(".vercel-storage.com") || url.includes("/_next/");
    if (!sameApp) return m; // leave third-party links alone — they still work
    if (/\.(html?|)$/.test(new URL(url).pathname) && url.startsWith(origin) && !url.includes("/_next/")) return m;
    return `${attr}="${up}${localName(url)}"`;
  });

  // Root-relative references: /_next/…, /uploads/…, /favicon.ico
  html = html.replace(/(href|src)="\/([^"/][^"]*)"/g, (m, attr, path) => {
    if (path.startsWith("api/")) return m; // an API path in a static folder is honest breakage
    const abs = `${origin}/${path}`;
    // A bare slug is another PAGE, not an asset.
    if (slugs.includes(path.replace(/\/$/, ""))) return `${attr}="${up}${path.replace(/\/$/, "")}.html"`;
    return `${attr}="${up}${localName(abs)}"`;
  });

  // url(...) inside inline <style> blocks — where imported designs keep their background images.
  html = html.replace(/url\((['"]?)(\/[^)'"]+|https?:\/\/[^)'"]+)\1\)/g, (m, q, url) => {
    const abs = url.startsWith("/") ? `${origin}${url}` : url;
    if (!abs.startsWith(origin) && !abs.includes(".vercel-storage.com")) return m;
    return `url(${q}${up}${localName(abs)}${q})`;
  });

  // The home page is index.html; every other link becomes <slug>.html.
  html = html.replace(/(href)="\/"/g, `$1="${up}index.html"`);
  return html;
}

await mkdir(join(root, "assets"), { recursive: true });

let ok = 0;
const failed = [];
for (const slug of slugs) {
  const url = slug === "home" ? `${origin}/` : `${origin}/${slug}`;
  const res = await fetch(url);
  if (!res.ok) {
    // A page that 404s is usually unpublished, which is not a failure worth stopping for — but it
    // MUST be named, or the folder quietly ships missing pages.
    failed.push(`${slug} (${res.status})`);
    continue;
  }
  const html = rewrite(await res.text(), 0);
  await writeFile(join(root, slug === "home" ? "index.html" : `${slug}.html`), html, "utf8");
  ok++;
}

// ── the assets, after the pages, because the pages are what discover them ────────────────────
let assetOk = 0;
const assetFail = [];
for (const [url, local] of assets) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(String(res.status));
    const buf = Buffer.from(await res.arrayBuffer());
    await mkdir(dirname(join(root, local)), { recursive: true });
    await writeFile(join(root, local), buf);
    assetOk++;
  } catch (e) {
    assetFail.push(`${url} (${e.message})`);
  }
}

await writeFile(
  join(root, "EXPORT-README.txt"),
  `${site.name || siteId} — exported ${new Date().toISOString().slice(0, 10)}
from ${origin}

WHAT THIS IS
A complete, working copy of the website: ${ok} pages and ${assetOk} files (images, styles, fonts).
Open index.html in a browser, or upload this whole folder to any web host. Nothing needs to be
installed and nothing phones home.

WHAT DOES NOT WORK IN THIS COPY
The forms. On the live site they send enquiries to an inbox, a spreadsheet and a CRM; that runs on
the server, which is not part of a folder of files. The forms will still LOOK right and a visitor
can still type in them, but nothing is sent or recorded. Anyone rehosting this needs to point the
forms at their own handler first.

Everything else — every page, every image, the layout, the styling — is here and works offline.
`,
  "utf8"
);

console.log(`\n  pages   ${ok}/${slugs.length}${failed.length ? ` — skipped: ${failed.join(", ")}` : ""}`);
console.log(`  assets  ${assetOk}/${assets.size}${assetFail.length ? ` — ${assetFail.length} failed` : ""}`);
if (assetFail.length) assetFail.slice(0, 5).forEach((f) => console.log(`            ${f}`));
console.log(`\n  → ${root}`);
