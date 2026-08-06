// The onboarding answer keys are FROZEN. This is the check that says so out loud.
//
//   npx tsx scripts/checks/onboarding-keys.mts
//
// ── WHY THIS EXISTS ──────────────────────────────────────────────────────────────────────────
// On 2026-08-06 the onboarding questions moved out of a hardcoded list and into the form library,
// so Steven can edit them on a screen instead of in code. That is the point. The cost is that
// nine strings which used to be safe inside a code file are now the identity of live data:
//
//   · every answer a client has already given is stored under its key
//   · the Onboarding tab in her Google Sheet matches columns by it
//   · `satisfiedBy` writes an answer back onto the site record through it
//
// Rename one and every answer collected under the old name is orphaned — SILENTLY, because an
// orphaned answer is indistinguishable from a question nobody got round to answering. There is no
// error, no empty page, nothing to notice. That is the exact shape of failure worth a check.
//
// If you are here because this failed: you almost certainly changed a `fieldId` in
// ONBOARDING_FIELDS when you meant to change a `label`. Labels are free to reword forever — that
// is the whole reason keys and labels are separate things. Put the key back.
//
// Adding a NEW question is fine and expected: add its key to EXPECTED below. Removing one is not
// a code change — retire it in the library, where the data stays put.
import { ONBOARDING_FIELDS, ONBOARDING_FORM, ONBOARDING_FORM_ID } from "../../lib/intakeShared.ts";
import { BUILTIN_FORMS } from "../../lib/formsShared.ts";

/** The keys live client data is filed under. Append only. */
const EXPECTED = [
  "gbpUrl",
  "businessName",
  "phone",
  "address",
  "hours",
  "currentSite",
  "whyYou",
  "photos",
  "anythingElse",
];

let failed = 0;
const check = (label: string, pass: boolean, detail = "") => {
  if (!pass) failed++;
  console.log(`${pass ? "ok  " : "FAIL"}  ${label}${detail ? `  — ${detail}` : ""}`);
};

const actual = ONBOARDING_FIELDS.map((f) => f.fieldId);

const missing = EXPECTED.filter((k) => !actual.includes(k));
const added = actual.filter((k) => !EXPECTED.includes(k));

check("no live answer key was renamed or dropped", missing.length === 0, missing.join(", ") || "none missing");
check(
  "any new key was declared in this check",
  added.length === 0,
  added.length ? `${added.join(", ")} — add to EXPECTED if deliberate` : "none added"
);
check("no duplicate keys", new Set(actual).size === actual.length, actual.join(", "));
check("every question has a key and a label", ONBOARDING_FIELDS.every((f) => !!f.fieldId && !!f.label));

// The onboarding form must not collide with a sample, or readForms would merge the wrong record.
check(
  "id doesn't collide with a sample form",
  !BUILTIN_FORMS.some((f) => f.id === ONBOARDING_FORM_ID),
  ONBOARDING_FORM_ID
);

// A long phone form on one screen is the version that doesn't get finished. The code floor keeps
// it on; only a deliberate edit in the library can turn it off.
check("one question per screen is the floor", ONBOARDING_FORM.oneQuestionPerScreen === true);

// `satisfiedBy` decides whether a question is ever asked. A path that doesn't resolve reads as an
// empty value, which looks exactly like a question that simply always gets asked.
const SITE_PATHS = ["business.name", "business.phoneDisplay", "business.email", "business.address", "business.hours"];
const badPaths = ONBOARDING_FIELDS.filter((f) => f.satisfiedBy && !SITE_PATHS.includes(f.satisfiedBy));
check("every skip-if-known path is a real one", badPaths.length === 0, badPaths.map((f) => f.satisfiedBy).join(", "));

console.log(failed ? `\n${failed} FAILED` : "\nall good");
process.exit(failed ? 1 : 0);
