// Does a page that POINTS AT a library form actually get that form's questions?
//
// ⚠️ THIS TEST EXISTS BECAUSE THE FIRST VERSION SILENTLY DID NOTHING. resolveFormPointers walked
// only `props`, so the page object — whose blocks live under `content` — was never entered. It
// typechecked, it built, the site rendered fine, and not one pointer resolved. Nothing but a
// nested block would have caught it.
//
//   npx tsx scripts/checks/form-pointer.mts
//
// ⚠️ IT EXITS NONZERO ON A FAILURE. It used to only print, and a check whose failure looks like
// its success is a check nobody reads twice.
//
// The three assertions that matter most:
//   SHEET COLUMN carried — fieldId must survive, or rewording a question orphans a client's data
//   unlinked untouched   — a block with no pointer must render exactly as it always has
//   photo question dropped — see the note in lib/formPointer.ts; a public page has nowhere to put
//                            an uploaded file, and taking her photos to lose them is the worst
//                            outcome of the three
import { resolveFormPointers, formsInUse } from "../../lib/formPointer.ts";
import { BUILTIN_FORMS, looksLikeSameForm, stepsOf, type FormDef } from "../../lib/formsShared.ts";

let failed = 0;
const check = (label: string, pass: boolean, detail = "") => {
  if (!pass) failed++;
  console.log(`${pass ? "ok  " : "FAIL"}  ${label}${detail ? `  — ${detail}` : ""}`);
};

const page = {
  content: [
    { type: "Section", props: { id: "s1", content: [
      { type: "LeadForm", props: { id: "lf1", formId: "quote", fields: [{ label: "OLD", inputType: "text" }], buttonLabel: "", successBody: "Page wins" } },
    ] } },
    { type: "LeadForm", props: { id: "lf2", fields: [{ label: "Untouched", inputType: "text" }], buttonLabel: "Keep me" } },
  ],
};

const out = resolveFormPointers(page, BUILTIN_FORMS) as typeof page;
const sec = out.content[0].props as { content: { props: Record<string, unknown> }[] };
const linked = sec.content[0].props;
const unlinked = out.content[1].props as Record<string, unknown>;
const quote = BUILTIN_FORMS.find((f) => f.id === "quote")!;

const fields = linked.fields as { label: string; fieldId?: string }[];
check("linked question count", fields.length === quote.fields.length, `${fields.length} vs ${quote.fields.length}`);
check("labels came from lib", fields[0].label === quote.fields[0].label);
check("SHEET COLUMN carried", fields.every((f, i) => f.fieldId === quote.fields[i].fieldId));
check("blank button <- lib", linked.buttonLabel === quote.buttonLabel);
check("page override wins", linked.successBody === "Page wins");
check(
  "unlinked untouched",
  (unlinked.fields as { label: string }[])[0].label === "Untouched" && unlinked.buttonLabel === "Keep me"
);

// ── A photo question must not reach a public website form ────────────────────────────────────
const withPhotos: FormDef = {
  ...quote,
  id: "with-photos",
  fields: [
    { fieldId: "name", label: "Your name", type: "text", required: true },
    { fieldId: "shots", label: "Photos of the job", type: "photos", required: true },
    { fieldId: "phone", label: "Best phone number", type: "tel" },
  ],
};
const photoPage = { content: [{ type: "LeadForm", props: { formId: "with-photos" } }] };
const photoOut = resolveFormPointers(photoPage, [withPhotos]) as typeof photoPage;
const photoFields = (photoOut.content[0].props as { fields: { fieldId?: string }[] }).fields;
check("photo question dropped", !photoFields.some((f) => f.fieldId === "shots"));
check(
  "the other questions survive",
  photoFields.length === 2 && photoFields[0].fieldId === "name" && photoFields[1].fieldId === "phone",
  JSON.stringify(photoFields.map((f) => f.fieldId))
);

// ── An imported design's contact box keeps its questions under `formFields` ───────────────────
// Filling in `fields` here is a perfect silent no-op: the block reads `formFields`, finds what it
// always had, and renders identically. The pointer looks set and does nothing.
const designPage = {
  content: [
    { type: "DesignSection", props: { formId: "quote", formFields: [{ label: "OLD", inputType: "text" }] } },
  ],
};
const designOut = resolveFormPointers(designPage, BUILTIN_FORMS) as typeof designPage;
const designProps = designOut.content[0].props as { formFields: { label: string }[] };
check(
  "DesignSection filled via formFields",
  designProps.formFields.length === quote.fields.length && designProps.formFields[0].label === quote.fields[0].label,
  designProps.formFields[0].label
);

// ── The review survey: the five-star split ───────────────────────────────────────────────────
// Its whole product is the ending, and the ending depends on the rating being a real CHOICE the
// customer taps. Left as a text box (the old behaviour) she would have to type "★★★★★ Great"
// exactly, so the rule would essentially never match and nobody would ever be sent to Google.
const review = BUILTIN_FORMS.find((f) => f.id === "review")!;
const reviewPage = { content: [{ type: "LeadForm", props: { formId: "review" } }] };
const reviewOut = resolveFormPointers(reviewPage, BUILTIN_FORMS) as typeof reviewPage;
const reviewProps = reviewOut.content[0].props as {
  fields: { fieldId?: string; options?: string[] }[];
  altSuccess?: { fieldId: string; values: string[]; buttonUrl?: string };
};
const rating = reviewProps.fields.find((f) => f.fieldId === "rating");

check("the rating keeps its options", (rating?.options || []).length === 5, JSON.stringify(rating?.options));
check("the split rule reaches the page", reviewProps.altSuccess?.fieldId === "rating");
check(
  "only the happy answers trigger it",
  reviewProps.altSuccess?.values.length === 2 &&
    reviewProps.altSuccess.values.every((v) => (rating?.options || []).includes(v)),
  JSON.stringify(reviewProps.altSuccess?.values)
);
check(
  "a value that isn't an option would never fire",
  (review.altSuccess?.values || []).every((v) => (review.fields.find((f) => f.fieldId === "rating")?.options || []).includes(v)),
  "a typo in the rule sends nobody to Google — which is the safe direction, but still a dead product"
);
check(
  "the shipped review link is EMPTY",
  !review.altSuccess?.buttonUrl,
  "a real link in code sends every client's customers to whoever was typed in first"
);
check(
  "the default ending is the careful one",
  /call/i.test(review.successBody),
  "an unconfigured copy must not ask an unhappy customer for a public review"
);

// ── Linking the /apply wizard to the wrong form ──────────────────────────────────────────────
// The wrong form here doesn't look broken. It renders, visitors apply, and the Discovery Intake
// sheet quietly grows a second set of columns beside the orphaned first.
const APPLY_KEYS = ["q0-0", "q0-1", "q1-0"];
check(
  "a form sharing no keys is refused",
  !looksLikeSameForm(["name", "phone"], APPLY_KEYS),
  "nobody rewrites every key at once — zero overlap is a mis-pick"
);
check("an edited form still passes", looksLikeSameForm(["q0-0", "q0-1", "q-new-1a2b"], APPLY_KEYS));
check("nothing to compare against is not 'wrong'", looksLikeSameForm([], APPLY_KEYS) && looksLikeSameForm(APPLY_KEYS, []));

// ── stepsOf: adjacency, not collection ───────────────────────────────────────────────────────
const grouped = stepsOf([
  { fieldId: "a", label: "A", type: "text", step: "One" },
  { fieldId: "b", label: "B", type: "text", step: "One" },
  { fieldId: "c", label: "C", type: "text", step: "Two" },
  { fieldId: "d", label: "D", type: "text", step: "One" },
]);
check(
  "a repeated heading stays a separate screen",
  grouped.length === 3 && grouped[2].fields[0].fieldId === "d",
  "grouping by collection would teleport 'd' up to screen one on reorder"
);

const seen: string[] = [];
formsInUse(page, (id) => seen.push(id));
check("connections found", seen.length === 1 && seen[0] === "quote", JSON.stringify(seen));

console.log(failed ? `\n${failed} FAILED` : "\nall good");
process.exit(failed ? 1 : 0);
