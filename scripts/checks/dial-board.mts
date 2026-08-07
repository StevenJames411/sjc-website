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
  calendarHref,
  clean,
  isDone,
  isUntouched,
  prettyWhen,
  siteHref,
  splitAtDivider,
  telHref,
  toProspects,
} from "../../lib/dialShared.ts";
import { parseGid, parseSpreadsheetId } from "../../lib/dial.ts";

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
check("the 200+ char URL is kept, not dropped", deck.raw.some((x) => x.value.length > 200));
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

console.log(failed ? `\n${failed} FAILED` : "\nall good");
process.exit(failed ? 1 : 0);
