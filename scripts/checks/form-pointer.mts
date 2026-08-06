// Does a page that POINTS AT a library form actually get that form's questions?
//
// ⚠️ THIS TEST EXISTS BECAUSE THE FIRST VERSION SILENTLY DID NOTHING. resolveFormPointers walked
// only `props`, so the page object — whose blocks live under `content` — was never entered. It
// typechecked, it built, the site rendered fine, and not one pointer resolved. Nothing but a
// nested block would have caught it.
//
//   node --experimental-strip-types scripts/checks/form-pointer.mts
//
// Six assertions, all printing true when it works. The two that matter most:
//   SHEET COLUMN carried — fieldId must survive, or rewording a question orphans a client's data
//   unlinked untouched   — a block with no pointer must render exactly as it always has
import { resolveFormPointers, formsInUse } from "../../lib/formPointer.ts";
import { BUILTIN_FORMS } from "../../lib/formsShared.ts";

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
console.log("linked question count :", fields.length, "(library has", quote.fields.length + ")");
console.log("labels came from lib  :", fields[0].label === quote.fields[0].label);
console.log("SHEET COLUMN carried  :", fields.every((f, i) => f.fieldId === quote.fields[i].fieldId));
console.log("blank button <- lib   :", linked.buttonLabel === quote.buttonLabel);
console.log("page override wins    :", linked.successBody === "Page wins");
console.log("unlinked untouched    :", (unlinked.fields as {label:string}[])[0].label === "Untouched" && unlinked.buttonLabel === "Keep me");

const seen: string[] = [];
formsInUse(page, (id) => seen.push(id));
console.log("connections found     :", JSON.stringify(seen));
