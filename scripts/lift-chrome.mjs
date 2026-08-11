// LIFT AN IMPORTED DESIGN'S HEADER + FOOTER INTO THE SITE'S GLOBAL CHROME.
//
// ── THE PROBLEM THIS FIXES ───────────────────────────────────────────────────────────────────
// lib/importDesign.ts splits a bought design into one DesignSection per top-level element, so the
// design's <header> and <footer> land INSIDE the page like any other band. Import ten pages and
// you get ten copies of the header — and a page created afterwards gets none, which is what it
// looks like from the outside: "the new page has no header or footer, and the ones in the sidebar
// are the old site's."
//
// They are. The SiteHeader/SiteFooter blocks in the builder's sidebar carry NAV_DEFAULTS /
// FOOTER_DEFAULTS (components/puck/config.tsx) — the pre-import SJC header, hardcoded. Nothing
// about them reads the imported site.
//
// ── WHAT IT DOES ─────────────────────────────────────────────────────────────────────────────
// Moves the header and footer into `nav` and `footer`, the two documents lib/publicSitePage.tsx
// already renders around EVERY page of a site, and deletes the per-page copies so nothing renders
// twice. After this: edit the header once at /edit/<site>/nav and all pages follow, and a brand
// new page wears it with no action at all.
//
// ⚠️ THE STYLESHEET NEEDS NO WORK. lib/puckContent.ts readDesignCss() already falls back to a
// sibling page's compiled sheet when a page has none of its own — so a new blank page picks up the
// design's CSS, and the lifted header renders styled. That fallback is the whole reason this is a
// data move and not a code change.
//
// ── SAFETY ───────────────────────────────────────────────────────────────────────────────────
// DRY RUN IS THE DEFAULT; pass --write to save. Writes go through the same upsert + append-only
// state_rev insert the app uses (lib/pgClient.ts), so every change is a recoverable revision, and
// lib/pgClient's write guard is reproduced verbatim below — a write this refuses is a write the
// app would refuse too.
//
//   cd projects/sjc-website
//   npx vercel env pull .env.migrate --environment=production --yes
//   ENV_FILE=.env.migrate SITE=sjc-2026 node scripts/lift-chrome.mjs            # dry run
//   ENV_FILE=.env.migrate SITE=sjc-2026 node scripts/lift-chrome.mjs --write    # do it
//   rm .env.migrate
//
// DATABASE_URL may also come straight from the environment, in which case ENV_FILE is not needed.
import fs from "node:fs";

const { Pool } = await import("pg");

function dbUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const file = process.env.ENV_FILE;
  if (!file || !fs.existsSync(file)) return "";
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    const i = line.indexOf("=");
    if (i < 0) continue;
    if (line.slice(0, i).trim() !== "DATABASE_URL") continue;
    return line.slice(i + 1).trim().replace(/^"|"$/g, "");
  }
  return "";
}

const url = dbUrl();
if (!url) {
  console.error("No DATABASE_URL. Set it, or point ENV_FILE at a `vercel env pull` file.");
  process.exit(1);
}

const SITE = process.env.SITE || "sjc-2026";
// lib/siteKeys.ts: site `sjc` keeps its legacy key names, every other site is namespaced.
const ns = SITE === "sjc" ? "sjc" : `site-${SITE}`;
const WRITE = process.argv.includes("--write");
const pool = new Pool({ connectionString: url, max: 3 });

const get = async (k) => {
  const { rows } = await pool.query("select value from state where key = $1", [k]);
  return rows.length ? rows[0].value : null;
};

/** lib/pgClient.ts guardReason, verbatim — so a refusal here is a refusal there. */
function guardReason(prev, next) {
  if (prev === null || prev === undefined) return null;
  if (next === null || next === undefined) return "refusing to overwrite an existing document with null";
  const pArr = Array.isArray(prev), nArr = Array.isArray(next);
  const pObj = prev && typeof prev === "object", nObj = next && typeof next === "object";
  if (Boolean(pObj) !== Boolean(nObj) || pArr !== nArr) return "type changed";
  if (!pObj) return null;
  if (pArr && nArr) {
    if (prev.length - next.length > 3 && next.length < prev.length * 0.5) {
      return `array shrank ${prev.length} -> ${next.length}`;
    }
    return null;
  }
  const isEmpty = (v) =>
    v === null || v === undefined ||
    (Array.isArray(v) && v.length === 0) ||
    (typeof v === "object" && Object.keys(v).length === 0);
  const BOOKKEEPING = new Set(["_pub"]);
  const lost = Object.keys(prev).filter((k) => !(k in next) && !isEmpty(prev[k]) && !BOOKKEEPING.has(k));
  if (lost.length) return `top-level keys disappeared: ${lost.join(", ")}`;
  for (const k of Object.keys(prev)) {
    const a = prev[k], b = next[k];
    if (Array.isArray(a) && Array.isArray(b) && a.length - b.length > 3 && b.length < a.length * 0.5) {
      return `'${k}' shrank ${a.length} -> ${b.length}`;
    }
  }
  const pl = JSON.stringify(prev).length, nl = JSON.stringify(next).length;
  if (pl > 500 && nl < pl * 0.4) return `document shrank ${pl} -> ${nl} bytes`;
  return null;
}

async function set(key, value) {
  const reason = guardReason(await get(key), value);
  if (reason) return { ok: false, reason };
  if (!WRITE) return { ok: true };
  await pool.query(
    `with up as (
       insert into state (key, value, updated_at) values ($1, $2::jsonb, now())
       on conflict (key) do update set value = excluded.value, updated_at = now()
       returning key
     )
     insert into state_rev (key, value, note) select $1, $2::jsonb, $3`,
    [key, JSON.stringify(value), "lift-chrome"]
  );
  return { ok: true };
}

const tag = (h) => (String(h || "").match(/^\s*<\s*([a-z0-9]+)/i) || [, ""])[1].toLowerCase();
const isHeader = (b) => b?.type === "DesignSection" && tag(b.props?.html) === "header";
const isFooter = (b) => b?.type === "DesignSection" && tag(b.props?.html) === "footer";

const reg = await get(`${ns}-pages`);
const pages = (reg?.custom || []).map((p) => p.slug);
if (!pages.length) {
  console.error(`No pages found for site '${SITE}'. Check the site id.`);
  process.exit(1);
}
console.log(`${WRITE ? "WRITING" : "DRY RUN"} — site ${SITE}, ${pages.length} pages\n`);

// ── 1. THE SOURCE: the home page's header and footer ─────────────────────────────────────────
const home = await get(`${ns}-puck-home-pub`);
const headerBlk = (home?.content || []).find(isHeader);
const footerBlk = (home?.content || []).find(isFooter);
if (!headerBlk || !footerBlk) {
  console.error("ABORT: the home page has no header/footer DesignSection to lift.");
  process.exit(1);
}

// ⚠️ ARE THE COPIES ACTUALLY THE SAME? If they are not, "global" silently picks a winner and every
// other page changes appearance. Checked out loud rather than assumed.
let drift = 0;
for (const slug of pages) {
  const d = await get(`${ns}-puck-${slug}-pub`);
  const h = (d?.content || []).find(isHeader);
  const f = (d?.content || []).find(isFooter);
  const hSame = h?.props?.html === headerBlk.props.html;
  const fSame = f?.props?.html === footerBlk.props.html;
  if (hSame && fSame) continue;
  drift++;
  console.log(`  drift: ${slug} — header ${hSame ? "same" : "DIFFERS"}, footer ${fSame ? "same" : "DIFFERS"}`);
}
console.log(
  drift
    ? `\n⚠️ ${drift} page(s) differ from home's chrome — they will all take home's after this.\n`
    : "Every page carries identical chrome — one global copy loses nothing.\n"
);

const doc = (block) => ({ root: { props: {} }, content: [block], zones: {} });

// ── 2. THE TWO GLOBAL DOCUMENTS ──────────────────────────────────────────────────────────────
// The draft carries no `_pub`; the published twin must have it or readPuckPublished ignores it
// (and an `{_pub:1}` shell with no `content` is exactly what was sitting there before).
for (const [slug, block] of [["nav", headerBlk], ["footer", footerBlk]]) {
  const a = await set(`${ns}-puck-${slug}`, doc(block));
  const b = await set(`${ns}-puck-${slug}-pub`, { ...doc(block), _pub: 1 });
  console.log(
    `chrome ${slug}: draft ${a.ok ? "ok" : "REFUSED — " + a.reason} | ` +
    `published ${b.ok ? "ok" : "REFUSED — " + b.reason}`
  );
}

// ── 3. REMOVE THE PER-PAGE COPIES ────────────────────────────────────────────────────────────
console.log("");
let removedTotal = 0;
let refused = 0;
for (const slug of pages) {
  for (const pub of [false, true]) {
    const key = `${ns}-puck-${slug}${pub ? "-pub" : ""}`;
    const d = await get(key);
    if (!Array.isArray(d?.content)) continue;
    const next = { ...d, content: d.content.filter((b) => !isHeader(b) && !isFooter(b)) };
    const removed = d.content.length - next.content.length;
    if (!removed) continue;
    const r = await set(key, next);
    if (r.ok) removedTotal += removed;
    else refused++;
    console.log(
      `  ${slug}${pub ? " pub  " : " draft"}: ${d.content.length} -> ${next.content.length} blocks` +
      (r.ok ? "" : `  REFUSED — ${r.reason}`)
    );
  }
}

console.log(`\n${removedTotal} chrome blocks removed across pages, ${refused} refused.`);
console.log(
  WRITE
    ? "WRITTEN. Every change is an append-only state_rev revision, so any of it can be put back."
    : "Dry run — nothing written. Re-run with --write."
);
await pool.end();
