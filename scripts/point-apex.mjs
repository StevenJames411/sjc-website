// MOVE stevenjamesconsulting.com FROM THE OLD SITE TO SJC 2026, AND RETIRE THE OTHER TWO.
//
// Three edits to one registry row set, written atomically:
//   1. `sjc-2026`             -> holdIndexing ON, then domain = stevenjamesconsulting.com
//   2. `sjc`                  -> domain cleared  (retired: demo-only, noindex, stays in the studio)
//   3. `steven-james-designs` -> domain cleared  (same)
//
// ⛔ WHY CLEARING COMES WITH THE SAME WRITE. Nothing validates domain uniqueness — `updateSite`
// writes the field through unchecked and `lib/host.ts` simply takes the FIRST registry row whose
// domain matches. Two rows claiming the apex is therefore a silent coin-flip. One atomic write
// means that state never exists.
//
// ⛔ AND holdIndexing GOES ON IN THE SAME BREATH AS THE DOMAIN. Assigning the domain is what makes
// a site indexable (lib/publicSitePage, app/robots.ts, app/sitemap.ts all key off `!domain`).
// Setting the domain first and the hold second leaves a window — however short — where the apex is
// live and crawlable. Launch day is unticking the box in Website settings.
//
// ⚠️ "Draft mode" for the two old sites is exactly `domain: ""`. That is not a workaround: an empty
// domain is already how this codebase spells "not public" — noindex, robots Disallow, out of the
// sitemap, a Demo badge in the gallery, and a demo URL. They stay fully editable in the studio and
// readable at <id>-demo.stevenjamesconsulting.com for cherry-picking.
//
// DRY RUN IS THE DEFAULT; pass --write to save. Every write is an append-only state_rev revision.
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

const APEX = "stevenjamesconsulting.com";
const WRITE = process.argv.includes("--write");
const pool = new Pool({ connectionString: url, max: 3 });

const { rows } = await pool.query("select value from state where key = 'sjc-sites'");
const blob = rows[0]?.value;
const sites = blob?.sites;
if (!Array.isArray(sites)) {
  console.error("ABORT: the site registry is not the shape expected ({ sites: [...] }).");
  process.exit(1);
}

const byId = (id) => sites.find((s) => s.id === id);
const need = ["sjc", "steven-james-designs", "sjc-2026"];
for (const id of need) {
  if (!byId(id)) {
    console.error(`ABORT: no registry row for '${id}'.`);
    process.exit(1);
  }
}

console.log(`${WRITE ? "WRITING" : "DRY RUN"}\n\nbefore:`);
for (const id of need) {
  const s = byId(id);
  console.log(`  ${id.padEnd(22)} domain="${s.domain || ""}" holdIndexing=${s.holdIndexing ?? "-"}`);
}

const next = sites.map((s) => {
  if (s.id === "sjc-2026") return { ...s, holdIndexing: true, domain: APEX };
  if (s.id === "sjc" || s.id === "steven-james-designs") return { ...s, domain: "" };
  return s;
});

console.log("\nafter:");
for (const id of need) {
  const s = next.find((x) => x.id === id);
  console.log(`  ${id.padEnd(22)} domain="${s.domain || ""}" holdIndexing=${s.holdIndexing ?? "-"}`);
}

// ⚠️ Exactly one row may claim the apex, checked rather than assumed — this is the failure the
// atomic write exists to prevent, so it is worth failing loudly if the maths is ever wrong.
const claimants = next.filter((s) => (s.domain || "").toLowerCase() === APEX).map((s) => s.id);
console.log(`\nrows claiming ${APEX}: ${claimants.join(", ") || "(none)"}`);
if (claimants.length !== 1 || claimants[0] !== "sjc-2026") {
  console.error("ABORT: the apex must be claimed by exactly one row, and it must be sjc-2026.");
  process.exit(1);
}

if (!WRITE) {
  console.log("\nDry run — nothing written. Re-run with --write.");
  await pool.end();
  process.exit(0);
}

await pool.query(
  `with up as (
     insert into state (key, value, updated_at) values ($1, $2::jsonb, now())
     on conflict (key) do update set value = excluded.value, updated_at = now()
     returning key
   )
   insert into state_rev (key, value, note) select $1, $2::jsonb, $3`,
  ["sjc-sites", JSON.stringify({ ...blob, sites: next }), "point-apex"]
);

console.log("\nWRITTEN. The apex serves SJC 2026, held out of Google until you untick the box in");
console.log("Website settings. The two old sites are demo-only and still in the studio.");
await pool.end();
