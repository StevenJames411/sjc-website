// TWO GLOBAL FOOTERS, AND A SWITCH BETWEEN THEM.
//
// Steven wanted a second footer: *"just the details, the privacy bullshit, the 2026 ARV venture,
// Steven James Consulting, and then just the phone number, text, and email. That's it… so I could
// either use the fancy one or the stripped one."*
//
// ── WHY THE FANCY ONE COULDN'T JUST BE TRIMMED ───────────────────────────────────────────────
// The imported footer is a DesignSection: its three-column grid is welded into the design's own
// markup, so the builder can change the words inside it but never its layout. Emptying the link
// text left two headed columns with nothing under them and the contact buttons squeezed into a
// third of the width, with no way to spread them.
//
// The SiteFooter block has the opposite property: with no link groups it drops the column grid
// entirely and the contact buttons take the full width (components/FooterView — the "More" column
// only appears when it has something in it). That is exactly the stripped shape, already built.
//
// ── WHAT THIS DOES ───────────────────────────────────────────────────────────────────────────
//   1. Banks the ORIGINAL imported footer into the shared section library ("Add saved section"),
//      taken from the revision written by lift-chrome.mjs — i.e. before the link text was blanked.
//   2. Builds the stripped SiteFooter and banks that too.
//   3. Installs the stripped one as this site's live global footer.
//
// Swapping afterwards needs no script: in /edit/<site>/footer, delete the block, press
// "Add saved section", pick the other one. The ★ on any section saves it back.
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

const SITE = process.env.SITE || "sjc-2026";
const ns = SITE === "sjc" ? "sjc" : `site-${SITE}`;
const WRITE = process.argv.includes("--write");
const LIBRARY_KEY = "sjc-section-library";
const pool = new Pool({ connectionString: url, max: 3 });

const get = async (k) => {
  const { rows } = await pool.query("select value from state where key = $1", [k]);
  return rows.length ? rows[0].value : null;
};

async function set(key, value, note) {
  if (!WRITE) return;
  await pool.query(
    `with up as (
       insert into state (key, value, updated_at) values ($1, $2::jsonb, now())
       on conflict (key) do update set value = excluded.value, updated_at = now()
       returning key
     )
     insert into state_rev (key, value, note) select $1, $2::jsonb, $3`,
    [key, JSON.stringify(value), note]
  );
}

// ── 1. THE ORIGINAL FANCY FOOTER, FROM BEFORE THE LINK TEXT WAS BLANKED ──────────────────────
// lift-chrome.mjs stamped its writes with that note, so the pristine copy is findable by name
// rather than by guessing which byte size looks right.
const { rows: revs } = await pool.query(
  `select value from state_rev
    where key = $1 and note = 'lift-chrome'
    order by id desc limit 1`,
  [`${ns}-puck-footer-pub`]
);
const fancy = revs[0]?.value?.content?.[0] || (await get(`${ns}-puck-footer-pub`))?.content?.[0];
if (!fancy) {
  console.error("ABORT: couldn't find a footer block to bank.");
  process.exit(1);
}
const fancyLinks = (String(fancy?.props?.html || "").match(/<a /g) || []).length;
console.log(
  `${WRITE ? "WRITING" : "DRY RUN"} — site ${SITE}\n` +
  `fancy footer found: ${fancy.type}, ${fancyLinks} links in its markup ` +
  `(${revs.length ? "from the pristine lift-chrome revision" : "⚠️ from the CURRENT doc — pristine copy not found"})`
);

// ── 2. THE STRIPPED FOOTER ───────────────────────────────────────────────────────────────────
// ⚠️ `copyright` IS THE MIDDLE OF THE SENTENCE, NOT THE WHOLE LINE. FooterView renders
// `© {year} {copyright}. All rights reserved.` — putting "© 2026" or "All rights reserved" in here
// prints it twice, which is the kind of thing nobody notices until a client does.
//
// ⚠️ `background` LEFT BLANK ON PURPOSE. Blank resolves to the site's own dark brand band, so this
// footer matches whatever site it is dropped onto instead of freezing one hex into every build.
//
// ⚠️ NO `bookHref`. Steven asked for phone, text and email — nothing else. A blank booking link is
// what keeps the fourth button off, and it also stops a client site inheriting SJC's calendar.
const stripped = {
  type: "SiteFooter",
  props: {
    id: "site-footer-stripped",
    brandName: "Steven James Consulting",
    showLogo: false,
    // ⚠️ THE NAME HAS TO MATCH THE HEADER'S. Steven: *"you see how my name is fancy up in the
    // header, and then you changed it for the footer. I want those to match."* `wordmark` is the
    // same Playfair small-caps mark the header draws; the accent word is what makes it two-tone
    // instead of one flat colour.
    brandStyle: "wordmark",
    brandAccentWord: "Consulting",
    brandAccentColor: "",
    // Bordered pills instead of three solid slabs, at the width of one column of three — the
    // proportion Steven pointed at on stevenbarchetti.com. Both are fields in the builder now, so
    // the next nudge costs a click rather than a deploy.
    buttonStyle: "outline",
    // ⛔ ONE ROW, THREE COLUMNS — call · text · email. Steven: *"that'll make the footer much lower
    // profile on desktop, which is what I wanted as far as being minimalist, and on a phone it will
    // just stack."* The height is the point: three stacked pills is roughly three times the band
    // depth of one row, on a footer carrying nothing else.
    contactLayout: "row",
    // Ignored while contactLayout is "row" (the columns are the width) — kept so switching back to
    // stacked lands on the width he already approved rather than the 300px default.
    contactWidth: 420,
    blurb: "",
    links: [],
    groups: [],
    phone: "+12108514906",
    phoneDisplay: "(210) 851-4906",
    email: "support@stevenjamesconsulting.com",
    privacyUrl: "https://www.privacypolicies.com/live/1cbbc5dd-5b42-4b68-abdd-a279a5e3b4f7",
    tosUrl: "https://www.privacypolicies.com/live/34bb5cc7-32b9-4449-ae32-7cfe78f34e45",
    copyright: "ARV Venture Group LLC Parent Company · Steven James Consulting",
    background: "",
    foreground: "",
    // ⚠️ NO SECOND `brandStyle` HERE. There was one, set to "", and a duplicate key later in an
    // object literal silently wins — so the wordmark set above was overwritten by the plain
    // lockup and the footer rendered in the body sans while the header stayed serif. The two-tone
    // accent worked, which made it look like a font-loading problem rather than a typo.
    brandLine2: "",
    brandLine2Color: "",
    iconCall: "",
    iconText: "",
    iconEmail: "",
    bookHref: "",
    bookLabel: "",
    mirrorHeaderLinks: false,
  },
};

// ── 3. BANK BOTH IN THE SHARED SECTION LIBRARY ───────────────────────────────────────────────
// ⚠️ THE LIBRARY IS SHARED ACROSS EVERY SITE (app/api/sections). The stripped one carries SJC's
// phone and email, so dropping it on a client build means changing those two fields on the block.
// Said out loud here because the library's own rule is that a saved section must not carry one
// business's details, and this one does.
const library = (await get(LIBRARY_KEY)) || [];
const stamp = new Date().toISOString();
const entries = [
  { id: "footer-full-sjc2026", name: "Footer — full (SJC 2026 design)", type: fancy.type, savedAt: stamp, block: fancy },
  { id: "footer-stripped", name: "Footer — stripped (name · call/text/email · legal)", type: "SiteFooter", savedAt: stamp, block: stripped },
];
const kept = library.filter((s) => !entries.some((e) => e.id === s.id));
const nextLibrary = [...kept, ...entries];

console.log(`\nsection library: ${library.length} saved -> ${nextLibrary.length}`);
for (const e of entries) console.log(`  + ${e.name}`);

await set(LIBRARY_KEY, nextLibrary, "stripped-footer");

// ── 4. INSTALL THE STRIPPED ONE AS THE LIVE GLOBAL FOOTER ────────────────────────────────────
// Draft carries no `_pub`; the published twin must have it or readPuckPublished ignores it.
const doc = { root: { props: {} }, content: [stripped], zones: {} };
await set(`${ns}-puck-footer`, doc, "stripped-footer");
await set(`${ns}-puck-footer-pub`, { ...doc, _pub: 1 }, "stripped-footer");
console.log(`\nlive global footer -> stripped (all pages of ${SITE})`);

console.log(
  WRITE
    ? "\nWRITTEN. Swap any time: /edit/" + SITE + "/footer -> delete the block -> Add saved section."
    : "\nDry run — nothing written. Re-run with --write."
);
await pool.end();
