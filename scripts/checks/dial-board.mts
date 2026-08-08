// Does the dial board read a real scraped call sheet correctly, and can it dial what it reads?
//
//   npx tsx scripts/checks/dial-board.mts
//
// ⚠️ EXITS NONZERO ON A FAILURE, same as the other checks — one whose failure looks like its
// success is a check nobody reads twice.
//
// The assertions that matter most, and why each one is here rather than being obvious:
//
//   "null" is not a fact          Steven's groomer scrape wrote the literal string `null` into
//                                 every Hours cell. On a card whose whole job is telling him who
//                                 he is about to talk to, a confident lie is worse than a blank.
//   columns are found by NAME     His groomer sheet and his deck-builder sheet already disagree
//                                 about their columns, and both will grow. Position-matching
//                                 would put a phone number where a rating goes.
//   an unknown column survives    Anything unrecognised still has to reach the card, or a column
//                                 added next month is silently dropped and he never knows.
//   tel: gets a country code      A 10-digit US number with no +1 makes Continuity guess.
//   the calendar link is UTC      Google reads a local-looking timestamp in the calendar's own
//                                 zone. A callback booked for 10am would land at 5am his time and
//                                 he'd find out by missing it.
import {
  DEFAULT_FILTERS,
  OUTCOMES,
  applyFilters,
  calendarHref,
  clean,
  filterCounts,
  headerKey,
  isDefaultFilters,
  pitchLine,
  statusText,
  type Filters,
  isDone,
  isUntouched,
  labelFor,
  normaliseStatus,
  prettyWhen,
  toneFor,
  siteHref,
  splitAtDivider,
  telHref,
  toProspects,
} from "../../lib/dialShared.ts";
import { parseGid, parseSpreadsheetId } from "../../lib/dial.ts";
import {
  activeMs,
  clock,
  count,
  countDial,
  isPaused,
  pause,
  resume,
  startSession,
  toRow,
  touch,
} from "../../lib/dialSession.ts";

let failed = 0;
const check = (label: string, pass: boolean, detail = "") => {
  if (!pass) failed++;
  console.log(`${pass ? "ok  " : "FAIL"}  ${label}${detail ? `  — ${detail}` : ""}`);
};

// ── a row shaped exactly like Steven's Austin-Pet-Groomers sheet ──────────────────────────────
// "Instagram" is the stand-in for a column that does not exist yet. Every one of his sheets grows
// one eventually, and the point of `extra` is that it shows up without a code change.
const headers = [
  "Name", "Phone", "Reviews", "Rating", "Claimed", "Email",
  "Notes", "Website", "Hours", "Category", "Instagram",
];
const rows = [
  { row: 2, cells: [
    "What A Dog Grooming", "+1512-846-4044", "89", "5", "Yes", "",
    "Called me back, not interested", "https://www.moego.pet/", "null", "Pet Groomer", "@whatadog",
  ] },
  { row: 3, cells: [
    "Rainbow PawsAbilities", "", "6", "5", "Yes", "", "", "", "null", "Pet Groomer", "",
  ] },
];

const [a, b] = toProspects(headers, rows);

check("the business name is found", a.name === "What A Dog Grooming", a.name);
check("the phone keeps the sheet's own formatting", a.phone === "+1512-846-4044", a.phone);
check("reviews and rating land in their own fields", a.reviews === "89" && a.rating === "5");
check("an existing note is carried, not lost", a.notes.startsWith("Called me back"));
check("the row number travels with the prospect", a.row === 2 && b.row === 3);

check(
  'the literal string "null" never reaches the card',
  !JSON.stringify(a).includes("null") || a.extra.every((x) => x.value !== "null"),
  JSON.stringify(a.extra)
);
check(
  '"null" Hours is dropped rather than shown',
  !a.extra.some((x) => x.label === "Hours"),
  JSON.stringify(a.extra.map((x) => x.label))
);
check("an empty cell is not shown as a field", !a.extra.some((x) => x.label === "Email"));
check("a known column goes to its own slot, not the leftovers", a.category === "Pet Groomer" && !a.extra.some((x) => x.label === "Category"));
check(
  "a column we have no field for still reaches the card",
  a.extra.some((x) => x.label === "Instagram" && x.value === "@whatadog"),
  JSON.stringify(a.extra)
);
check("a leftover column that is empty on THIS row is not shown", !b.extra.some((x) => x.label === "Instagram"));

check('clean() strips the junk words', clean("N/A") === "" && clean("—") === "" && clean(" none ") === "");
check("clean() keeps a real value", clean("  Pride and Groom  ") === "Pride and Groom");

// ── the 130-column sheet: the sheet's own "— full data →" marker ──────────────────────────────
// Shaped from the real SA-Deck-Builders headers. 130 columns, a divider at index 22, and 14
// headers that appear TWICE (once curated, once in the raw dump) carrying identical values.
const deckHeaders = [
  "rank", "name", "reviews", "rating", "phone", "website", "city",
  "— full data →",
  "query", "name", "phone", "website", "city", "location_link", "latitude", "country_code",
];
const deckRow = [{ row: 2, cells: [
  "1", "American Lawn and Garden LLC", "36", "4.5", "+1 346-704-1501", "", "San Antonio",
  "",
  "landscape designer, 78202", "American Lawn and Garden LLC", "+1 346-704-1501", "", "San Antonio",
  "https://www.google.com/maps/place/American+Lawn+and+Garden+LLC/@29.396733299999998,-98.47319209999999,14z/data=" + "!4m8!1m2!2m1!1s".repeat(12),
  "29.3967333", "US",
] }];

const deck = toProspects(deckHeaders, deckRow)[0];

check("the divider column is found", splitAtDivider(deckHeaders) === 7, String(splitAtDivider(deckHeaders)));
check("a sheet with no divider is unaffected", splitAtDivider(headers) === headers.length);
check("the card binds to the CURATED name, not the scrape's copy", deck.name === "American Lawn and Garden LLC");
check(
  "NOTHING past the divider lands on the card face",
  deck.extra.every((x) => !["query", "latitude", "country_code", "location_link"].includes(x.label)),
  JSON.stringify(deck.extra.map((x) => x.label))
);
check("the raw block collects what's past the divider", deck.raw.some((x) => x.label === "latitude"), JSON.stringify(deck.raw.map((x) => x.label)));
check(
  "a column duplicated either side of the divider is printed ONCE, on the curated side",
  deck.extra.filter((x) => x.label === "city").length === 1 &&
    deck.raw.filter((x) => x.label === "city").length === 0,
  `extra:${deck.extra.filter((x) => x.label === "city").length} raw:${deck.raw.filter((x) => x.label === "city").length}`
);
check(
  "a duplicated leftover with the same value is not repeated",
  deck.raw.filter((x) => x.value === "American Lawn and Garden LLC").length <= 1,
  JSON.stringify(deck.raw.filter((x) => x.value.startsWith("American")))
);
check(
  "the 200+ char URL is kept, and is now the Maps BUTTON rather than a raw row",
  deck.maps.length > 200 && !deck.raw.some((x) => x.label === "location_link"),
  `maps=${deck.maps.length} chars`
);
check("a blank cell either side of the divider is skipped", !deck.raw.some((x) => x.value === ""));
check(
  "the divider column itself never renders as a field",
  ![...deck.extra, ...deck.raw].some((x) => /full data/.test(x.label))
);
check("an empty-ish header also reads as a divider", splitAtDivider(["a", "  ", "b"]) === 1);

// ── the queue ─────────────────────────────────────────────────────────────────────────────────
const base = toProspects(headers, [{ row: 4, cells: ["X", "5125550000", "", "", "", "", "", "", "", ""] }])[0];

check("a fresh row is untouched", isUntouched(base) && !isDone(base));
check("sold is done", isDone({ ...base, status: "sold" }));
check("not interested is done", isDone({ ...base, status: "Not Interested" }), "case and spacing must not matter");
check(
  "a NO ANSWER is NOT done — it is a call to make again",
  !isDone({ ...base, status: "no-answer" }),
  "retiring a prospect after one unanswered ring is the obvious wrong version"
);
check("a conversation is not done either", !isDone({ ...base, status: "conversation" }));

// ── the row's colour, which has to survive Steven editing the sheet by hand ───────────────────
check("an untouched row wears no colour", toneFor("") === "");
check("sold is green", toneFor("sold") === "ok");
check("not interested is red", toneFor("not-interested") === "bad");
check("callback is amber", toneFor("callback") === "warn");
check("a conversation is blue", toneFor("conversation") === "info");
check(
  "a HAND-TYPED status still colours the row",
  toneFor(" Not Interested ") === "bad" && toneFor("NO ANSWER") === "none",
  "he owns the sheet; typing in it must not blank the colour"
);
check("a status we don't recognise still reads as touched, not blank", toneFor("thinking about it") === "none");
check("the button lights up off the sheet's own value", normaliseStatus("voicemail") === "voicemail");
check(
  "typing the words ON THE BUTTON works too",
  normaliseStatus("Left Voicemail") === "voicemail" && normaliseStatus("Not Interested") === "not-interested",
  "the key is `voicemail` but the button says `Left voicemail` — a human copies what they can see"
);
check("the sheet is written with words, not slugs", statusText("voicemail") === "Left voicemail" && statusText("no-answer") === "No answer");
check("what we write reads back as what we wrote", OUTCOMES.every((o) => normaliseStatus(statusText(o.key)) === o.key));
check("a hand-typed status prints as our label", labelFor("NOT-INTERESTED") === "Not interested", labelFor("NOT-INTERESTED"));
check("a status we didn't write prints verbatim", labelFor("thinking about it") === "thinking about it");

// ── the dialer ────────────────────────────────────────────────────────────────────────────────
check("a formatted number becomes a clean tel:", telHref("+1512-846-4044") === "tel:+15128464044", telHref("+1512-846-4044"));
check("parentheses and spaces are stripped", telHref("(512) 846-4044") === "tel:+15128464044", telHref("(512) 846-4044"));
check("a bare 10-digit US number gets +1", telHref("5128464044") === "tel:+15128464044", telHref("5128464044"));
check("a leading 1 is not doubled", telHref("15128464044") === "tel:+15128464044", telHref("15128464044"));
check("no phone means no call button", telHref("") === "" && telHref("null") === "");

check("a bare domain gets a scheme", siteHref("moego.pet") === "https://moego.pet");
check("a real url is left alone", siteHref("http://x.com") === "http://x.com");
check("a blank website stays blank", siteHref("null") === "");

// ── the calendar handoff ──────────────────────────────────────────────────────────────────────
const href = calendarHref({ name: "Grooming With Emily", phone: "+1512-550-4233", when: "2026-08-12T15:00:00.000Z", note: "wants a call after 2" });
const dates = new URL(href).searchParams.get("dates") || "";

check("the calendar link is a Google TEMPLATE url", href.startsWith("https://calendar.google.com/calendar/render?"));
check(
  "the times are UTC basic-format with the Z",
  /^\d{8}T\d{6}Z\/\d{8}T\d{6}Z$/.test(dates),
  dates || "(none)"
);
check("it starts at the requested instant", dates.startsWith("20260812T150000Z"), dates);
check("it defaults to a 15-minute slot", dates.endsWith("20260812T151500Z"), dates);
check("the business name is in the title", (new URL(href).searchParams.get("text") || "").includes("Grooming With Emily"));
check("the number is in the body, so the event alone is enough to make the call", (new URL(href).searchParams.get("details") || "").includes("+1512-550-4233"));
check("the note is carried into the event", (new URL(href).searchParams.get("details") || "").includes("wants a call after 2"));
check("a junk date produces no link at all", calendarHref({ name: "x", phone: "", when: "not a date" }) === "");
check("prettyWhen is human, not ISO", /Aug/.test(prettyWhen("2026-08-12T15:00:00.000Z")), prettyWhen("2026-08-12T15:00:00.000Z"));

// ── pasting a sheet ───────────────────────────────────────────────────────────────────────────
const pasted = "https://docs.google.com/spreadsheets/d/1aUJhAuk1qNZJFTu53Tt3T-4tN85wtQH_PhH1dzGgr38/edit?gid=1445404341#gid=1445404341";
check("the id comes out of a pasted URL", parseSpreadsheetId(pasted) === "1aUJhAuk1qNZJFTu53Tt3T-4tN85wtQH_PhH1dzGgr38", parseSpreadsheetId(pasted));
check("a bare id still works", parseSpreadsheetId("1aUJhAuk1qNZJFTu53Tt3T-4tN85wtQH_PhH1dzGgr38").length > 20);
check("nonsense is refused rather than stored", parseSpreadsheetId("my sheet") === "");
check("the gid is read when the URL carries one", parseGid(pasted) === "1445404341", parseGid(pasted));

// ── ⛔ THE TWO-PITCH TOGGLE ────────────────────────────────────────────────────────────────────
// Steven: *"I sell the people with websites my Google review funnel... The ones without a website,
// I try to sell them both."* BOTH halves are sellable. The toggle picks the SCRIPT, and review
// count flips meaning between the two, so the default sort has to flip with it.
const H = ["name", "phone", "website", "reviews", "rating", "status"];
const mk = (name: string, phone: string, web: string, rev: string, rate: string, st = "") =>
  ({ row: 0, cells: [name, phone, web, rev, rate, st] });

const pool = toProspects(H, [
  { ...mk("NoSite Big", "5125550001", "", "89", "5"), row: 2 },
  { ...mk("NoSite Small", "5125550002", "", "3", "4"), row: 3 },
  { ...mk("HasSite Few", "5125550003", "acme.com", "11", "4.8"), row: 4 },
  { ...mk("HasSite Many", "5125550004", "b.com", "240", "4.2"), row: 5 },
  { ...mk("NoPhone", "", "", "40", "5"), row: 6 },
  { ...mk("Unrated", "5125550006", "", "", ""), row: 7 },
  { ...mk("Already Sold", "5125550007", "c.com", "8", "5", "SOLD"), row: 8 },
]);
const F = (patch: Partial<Filters>): Filters => ({ ...DEFAULT_FILTERS, ...patch });
const names = (ps: typeof pool) => ps.map((p) => p.name);

check("no filters returns everything, untouched", names(applyFilters(pool, DEFAULT_FILTERS)).join() === names(pool).join());
check("`site` keeps only the ones with NO website", applyFilters(pool, F({ pitch: "site" })).every((p) => !p.website));
check("`reviews` keeps only the ones WITH a website", applyFilters(pool, F({ pitch: "reviews" })).every((p) => !!p.website));
check(
  "⛔ nothing is thrown away — the two pitches partition the list",
  applyFilters(pool, F({ pitch: "site" })).length + applyFilters(pool, F({ pitch: "reviews" })).length === pool.length
);
check(
  "⛔ review-funnel mode sorts FEWEST reviews first",
  names(applyFilters(pool, F({ pitch: "reviews" })))[0] === "Already Sold",
  "8 < 11 < 240 — the smallest count is the biggest opening"
);
check("every other mode keeps sheet order", names(applyFilters(pool, F({ pitch: "site" }))).join() === "NoSite Big,NoSite Small,NoPhone,Unrated");
check("an explicit sort beats the pitch default", names(applyFilters(pool, F({ pitch: "reviews", sort: "most-reviews" })))[0] === "HasSite Many");
check("sort by rating puts the best first", names(applyFilters(pool, F({ sort: "rating" })))[0] === "NoSite Big");

check("⚠️ a BLANK rating passes a rating floor", names(applyFilters(pool, F({ minRating: 4.5 }))).includes("Unrated"), "no rating ≠ a bad business");
check("⚠️ a blank review count passes a review floor", names(applyFilters(pool, F({ minReviews: 50 }))).includes("Unrated"));
check("a real rating below the floor is dropped", !names(applyFilters(pool, F({ minRating: 4.5 }))).includes("HasSite Many"));
check("a business with no number sinks, it does not sort as zero", names(applyFilters(pool, F({ sort: "fewest-reviews" }))).at(-1) === "Unrated");
check("`has a number` drops the ones we can't call", !names(applyFilters(pool, F({ phoneOnly: true }))).includes("NoPhone"));
check("work=todo hides anything with a status", !names(applyFilters(pool, F({ work: "todo" }))).includes("Already Sold"));
check("work=done shows only what has a status", names(applyFilters(pool, F({ work: "done" }))).join() === "Already Sold");
check("search is case-insensitive and matches a substring", names(applyFilters(pool, F({ q: "nosite" }))).length === 2);

const c = filterCounts(pool);
check("chip counts add up", c.site + c.reviews === c.total && c.todo + c.done === c.total, JSON.stringify(c));
check("isDefaultFilters is honest", isDefaultFilters(DEFAULT_FILTERS) && !isDefaultFilters(F({ pitch: "site" })));

check("the pitch line for no-website sells the SITE", pitchLine(pool[0]).text === "No website — sell the site");
check("the pitch line for has-website sells the REVIEW FUNNEL", /review funnel/.test(pitchLine(pool[2]).text), pitchLine(pool[2]).text);
check("...and it leads with their review count", pitchLine(pool[2]).text.startsWith("11 reviews"), pitchLine(pool[2]).text);
check("a website with no review count still gets a pitch", pitchLine({ ...pool[2], reviews: "" }).text === "Has a website — sell the review funnel");
check(
  "one review is singular",
  pitchLine({ ...pool[2], reviews: "1" }).text === "1 review — sell the review funnel",
  "fewest-first puts this exact row at the top of the page"
);

// ── Maps + Reviews links promoted out of the raw dump ─────────────────────────────────────────
const linkHeaders = ["name", "phone", "reviews", "location_link", "location_reviews_link"];
const linked = toProspects(linkHeaders, [
  { row: 2, cells: ["American Lawn", "+1 346-704-1501", "36", "https://maps.google.com/x", "https://maps.google.com/reviews/y"] },
])[0];
check("the Maps link lands in its own field", linked.maps === "https://maps.google.com/x", linked.maps);
check("the Reviews link lands in its own field", linked.reviewsUrl === "https://maps.google.com/reviews/y", linked.reviewsUrl);
check(
  "⚠️ the review COUNT is still a count, not the link",
  linked.reviews === "36",
  "`reviews` and `location_reviews_link` must never collide"
);
check("neither link is left in the leftovers", ![...linked.extra, ...linked.raw].some((x) => /location_/.test(x.label)));
check("a sheet without those columns just has no buttons", pool[0].maps === "" && pool[0].reviewsUrl === "");

// ── ⛔ HIS COLUMN NAMES WIN, NOT OURS ──────────────────────────────────────────────────────────
// The board writes `Callback`; he named his column `Call-Back`. Under exact matching the next
// write would create a SECOND column beside his and leave the one he made empty forever, while
// every screen looked fine.
check("hyphens, spaces, case and underscores are all noise", ["Call-Back", "call back", "CALLBACK", "call_back"].every((h) => headerKey(h) === "callback"));
check("dots too, for the scrape's phone.phones_enricher columns", headerKey("phone.whitepages_phones.name") === "phonewhitepagesphonesname");
check(
  "a renamed column still binds to the card",
  toProspects(["Business Name", "Phone Number", "Last-Called"], [{ row: 2, cells: ["Acme Decks", "5125550000", "8/7 5pm"] }])[0].name === "Acme Decks",
  "he renames headers in HIS sheet; the code adapts, he does not"
);
check(
  "...including the write-back columns",
  toProspects(["name", "Call-Back", "Last Called"], [{ row: 2, cells: ["X", "Tue 10am", "8/7"] }])[0].lastCalled === "8/7"
);

// ── the call session: pause arithmetic and the row it becomes ─────────────────────────────────
const T0 = 1_760_000_000_000; // a fixed instant; every function takes `now`, nothing reads a clock
const MIN = 60_000;

let sess = startSession(T0, "SA deck builders");
check("a fresh session has worked no time", activeMs(sess, T0) === 0);
check("time accrues while running", activeMs(sess, T0 + 30 * MIN) === 30 * MIN);

sess = pause(sess, T0 + 30 * MIN);
check("⛔ a pause STOPS the clock", activeMs(sess, T0 + 45 * MIN) === 30 * MIN, "15 min of bathroom break must not be billed as work");
sess = resume(sess, T0 + 45 * MIN);
check("resuming picks up where it stopped", activeMs(sess, T0 + 50 * MIN) === 35 * MIN);

sess = pause(sess, T0 + 50 * MIN);
sess = resume(sess, T0 + 70 * MIN);
check("multiple pauses all bank", activeMs(sess, T0 + 80 * MIN) === 45 * MIN, "30 + 5 + 10 worked, 35 paused");
check("pausing twice is not double-counted", activeMs(pause(pause(sess, T0 + 80 * MIN), T0 + 85 * MIN), T0 + 90 * MIN) === 45 * MIN);
check("resuming a running session does nothing", activeMs(resume(sess, T0 + 80 * MIN), T0 + 90 * MIN) === 55 * MIN);
check("isPaused reports honestly", !isPaused(sess) && isPaused(pause(sess, T0)));

let tally = startSession(T0, "L");
tally = countDial(tally, T0);
tally = countDial(tally, T0);
tally = count(tally, "conversation", T0);
tally = count(tally, "sold", T0);
tally = count(tally, "callback", T0);
tally = count(tally, "no-answer", T0);
check("dials and outcomes tally separately", tally.dials === 2 && tally.convos === 1 && tally.sold === 1 && tally.callbacks === 1);
check("a no-answer counts as neither a convo nor a sale", tally.convos === 1 && tally.sold === 1);
check("any activity moves the crash-recovery marker", touch(tally, T0 + 99).lastActiveAt === T0 + 99);

check("the clock reads mm:ss under an hour", clock(9 * MIN + 5000) === "9:05", clock(9 * MIN + 5000));
check("...and h:mm:ss over one", clock(75 * MIN + 3000) === "1:15:03", clock(75 * MIN + 3000));
check("a negative never renders", clock(-500) === "0:00");

const row = toRow(sess, T0 + 80 * MIN);
check("the row carries WHO from day one", row.who === "Steven", "per-rep logins are the endgame; a later column leaves history anonymous");
check("active minutes are rounded from real worked time", row.activeMins === 45, String(row.activeMins));
check("the row keeps which list was worked", row.list === "SA deck builders");
check(
  "⛔ a session ending after midnight belongs to the day it STARTED",
  toRow(startSession(T0, "L"), T0 + 8 * 60 * MIN).date === new Date(T0).toLocaleDateString("en-US"),
  "otherwise a late-night block lands on the wrong day of his Mon–Sat view"
);
// ⛔ THE CRASH PATH. A session found still open on the next load is closed at its LAST ACTIVITY,
// not at "now" — otherwise a laptop shut at 5pm and reopened Monday logs a 62-hour day.
const crashed = countDial(startSession(T0, "L"), T0 + 20 * MIN);
check(
  "a crashed session closes at its last activity, not at discovery",
  toRow(crashed, crashed.lastActiveAt).activeMins === 20,
  String(toRow(crashed, crashed.lastActiveAt).activeMins)
);
check("...and discovering it days later changes nothing", toRow(crashed, crashed.lastActiveAt).activeMins !== Math.round((3 * 24 * 60)));

console.log(failed ? `\n${failed} FAILED` : "\nall good");
process.exit(failed ? 1 : 0);
