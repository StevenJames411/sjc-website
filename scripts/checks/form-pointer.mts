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
import { BUILTIN_FORMS, type FormDef } from "../../lib/formsShared.ts";

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

const seen: string[] = [];
formsInUse(page, (id) => seen.push(id));
check("connections found", seen.length === 1 && seen[0] === "quote", JSON.stringify(seen));

console.log(failed ? `\n${failed} FAILED` : "\nall good");
process.exit(failed ? 1 : 0);
