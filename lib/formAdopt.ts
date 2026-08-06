// Read a page's existing questions so a WORKING COPY of them can sit in the form library.
//
// ── WHAT THIS DELIBERATELY DOES NOT DO: MIGRATE ANYTHING ─────────────────────────────────────
// The first version of this repointed each page at the library and expected Steven to publish
// three live pages to finish the job. Steven, 2026-08-06: *"we have a working copy on the
// websites, so put a working copy in the library. Do you really have to migrate them?"*
//
// No. /apply, /websites and the Designs contact box already work. What was missing was that his
// own forms weren't visible in his own library — he went looking and found three samples. A copy
// in the library fixes exactly that and touches nothing that is currently collecting leads. The
// live pages are not read from the library, are not repointed, and do not need republishing.
//
// ── WHY IT'S A TOOL AND NOT A HAND-WRITTEN LIST ──────────────────────────────────────────────
// The questions live in the durable store, not in this repo, and each carries the key its answers
// are already filed under. Re-typing thirteen of those by eye is how one comes out wrong. Nothing
// here is typed: the keys are READ OFF THE PAGE and carried across verbatim, so the copy in the
// library is a true copy — same columns, same wording, same order.
import type { FormField } from "./formsShared";

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Where a set of questions was found, and how to point it at the library afterwards. */
export type FoundQuestions = {
  /** "LeadForm" | "DesignSection" | "FormStep" — what shape they were in. */
  from: string;
  /** A human description of the place, for the receipt. */
  where: string;
  fields: FormField[];
  /** Already pointing at a library form? Then there is nothing to adopt. */
  existingFormId?: string;
};

/**
 * The key a LeadForm question is ALREADY filing answers under.
 *
 * ⚠️ THIS MUST MATCH components/blocks/LeadForm.tsx `keyFor` EXACTLY, including the fallback. A
 * block built before the library has no `fieldId`, so its column is the slugified label — and if
 * this slugified differently by so much as a trailing dash, adopting the form would move every
 * one of that client's columns.
 */
export function leadFormKey(f: any, i: number): string {
  const stored = String(f?.fieldId || "").trim();
  if (stored) return stored;
  return (
    String(f?.label || `q${i + 1}`)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || `q${i + 1}`
  );
}

/** LeadForm's `inputType` (an HTML input type) back to a library field type. */
const typeFromInput = (t: unknown): FormField["type"] => {
  const s = String(t || "text");
  if (s === "tel" || s === "email" || s === "url" || s === "textarea") return s;
  return "text";
};

/** /apply's `questionType` to a library field type. `multi` has no equivalent yet. */
const typeFromQuestion = (t: unknown): FormField["type"] => {
  const s = String(t || "text");
  if (s === "email") return "email";
  if (s === "phone") return "tel";
  if (s === "choice" || s === "multi") return "choice";
  return "text";
};

/**
 * Every set of questions on a page, wherever it's hiding.
 *
 * ⚠️ WALKS EVERY KEY, not just `props` — the same rule as lib/formPointer.ts, and for the same
 * reason it was written there: a page's blocks live under `content`, and a Section's live under
 * `props.content`. A props-only walk finds neither, typechecks, and reports nothing found.
 */
export function findQuestions(data: any): FoundQuestions[] {
  const out: FoundQuestions[] = [];

  const walk = (v: any, stepTitle?: string): void => {
    if (Array.isArray(v)) return v.forEach((x) => walk(x, stepTitle));
    if (!v || typeof v !== "object") return;

    const type = v?.type;
    const props = v?.props || {};

    // ── /apply: a titled step holding FormQuestion children ──────────────────────────────────
    if (type === "FormStep") {
      const title = String(props.title || "").trim();
      const kids: any[] = Array.isArray(props.content) ? props.content : [];
      const fields: FormField[] = kids
        .filter((q) => q?.type === "FormQuestion")
        .map((q, i) => ({
          // THE BLOCK ID IS THE COLUMN. app/apply/page.tsx reads `q.props.id` as the answer key
          // and falls back to `q<step>-<index>` — both are reproduced here so a block that never
          // got an explicit id keeps the key it has been submitting under.
          fieldId: String(q?.props?.id || "").trim() || `q${out.length}-${i}`,
          label: String(q?.props?.label || "").trim(),
          type: typeFromQuestion(q?.props?.questionType),
          ...(Array.isArray(q?.props?.options) && q.props.options.length
            ? { options: q.props.options.map((o: any) => String(o?.text || "").trim()).filter(Boolean) }
            : {}),
          // /apply treats anything not explicitly false as required — carried across as-is.
          ...(q?.props?.required !== false ? { required: true } : {}),
          ...(title ? { step: title } : {}),
        }))
        .filter((f) => f.label);
      if (fields.length) out.push({ from: "FormStep", where: title || "a step", fields });
      // Don't recurse into a step we've already read, or its questions get found twice.
      return;
    }

    // ── A lead form block, or the form baked into an imported design ─────────────────────────
    const raw =
      type === "LeadForm"
        ? props.fields
        : type === "DesignSection"
          ? props.formFields
          : null;

    if (Array.isArray(raw) && raw.length) {
      out.push({
        from: String(type),
        where: type === "DesignSection" ? "the imported design's contact box" : "a lead form block",
        existingFormId: String(props.formId || "").trim() || undefined,
        fields: raw.map((f: any, i: number) => ({
          fieldId: leadFormKey(f, i),
          label: String(f?.label || "").trim() || `Question ${i + 1}`,
          type: typeFromInput(f?.inputType),
          // A block with no `required` on ANY field is all-or-nothing — LeadForm's own rule.
          ...(raw.some((x: any) => typeof x?.required === "boolean")
            ? f?.required
              ? { required: true }
              : {}
            : { required: true }),
        })),
      });
    }

    for (const val of Object.values(v)) walk(val, stepTitle);
  };

  walk(data);
  return out;
}

// ⚠️ THERE IS DELIBERATELY NO "point this page at the library" FUNCTION HERE. One existed and was
// removed: repointing a page that already works buys nothing and spends a republish of a live
// funnel. Pointing at a form is a choice made per block in the builder, when someone wants it —
// not something a copy tool does on the way past.
