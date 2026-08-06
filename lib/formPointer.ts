// A page POINTS AT a form; it doesn't hold a copy of one.
//
// ── WHAT CHANGED AND WHY ─────────────────────────────────────────────────────────────────────
// Until now "start from a preset" COPIED the library's questions into the page, and the link was
// over. Steven, 2026-08-06: *"once an onboarding form gets created for a page or a client, if I
// change a question in the form library, whatever's on their website should update."* With a copy
// you change the questions in one place and get them in none.
//
// So the block stores the form's ID and this fills in the rest at render. Edit the form once,
// every page pointing at it changes — no code to re-paste anywhere.
//
// ⚠️ NOT AN IFRAME, AND THAT IS THE POINT. An embedded form is a window onto somebody else's
// website: their styling, their spinner, their branding, and a snippet you must re-paste when
// anything changes. This resolves to plain data and OUR components draw it, so a form inherits
// the host site's header, footer, fonts and colours automatically. It looks like a page because
// it is one.
//
// ── WHAT THE PAGE STILL OWNS ─────────────────────────────────────────────────────────────────
// The QUESTIONS come from the library, always — that is the thing being kept in sync. The button
// label, the small print and the thank-you wording are page-specific (the same form on a contact
// page and in a footer wants different words), so a non-empty value on the block wins and a blank
// one falls back to the library's.
import type { FormDef } from "./formsShared";

/** The props a LeadForm block carries. Only the ones this touches. */
type LeadFormProps = {
  formId?: string;
  fields?: unknown;
  buttonLabel?: string;
  note?: string;
  successHeading?: string;
  successBody?: string;
};

type Node = { type?: string; props?: LeadFormProps & Record<string, unknown> };

/** Page value if it has one, otherwise the library's. Blank means "follow the form". */
const prefer = (pageValue: unknown, formValue: string) => {
  const v = typeof pageValue === "string" ? pageValue.trim() : "";
  return v || formValue;
};

/**
 * Walk a page's saved content and fill in every block that points at a library form.
 *
 * ⚠️ A POINTER TO A FORM THAT NO LONGER EXISTS IS LEFT ALONE, not blanked. The block keeps
 * whatever questions it last had, so a deleted form degrades to a stale form rather than to an
 * empty box on a customer's live contact page. `formsInUse` below is what stops it getting that
 * far in the first place.
 */
export function resolveFormPointers<T>(data: T, forms: FormDef[]): T {
  const byId = new Map(forms.map((f) => [f.id, f]));

  const walk = (v: unknown): unknown => {
    if (Array.isArray(v)) return v.map(walk);
    if (!v || typeof v !== "object") return v;

    const n = v as Node;
    const id = typeof n.props?.formId === "string" ? n.props.formId.trim() : "";
    const form = id ? byId.get(id) : undefined;

    const props: Record<string, unknown> = {};
    for (const [k, val] of Object.entries((n.props || {}) as Record<string, unknown>)) {
      props[k] = walk(val);
    }

    if (form) {
      props.fields = form.fields.map((f) => ({
        label: f.label,
        // ⚠️ `fieldId` IS THE SPREADSHEET COLUMN and must be carried across verbatim. Drop it and
        // LeadForm falls back to slugifying the label — so rewording a question starts filing
        // answers in a NEW column and orphans everything collected under the old one. Carrying it
        // is precisely what lets Steven reword a question in the library without breaking a
        // client's sheet, which is half the point of pointing at the form at all.
        fieldId: f.fieldId,
        // `choice` has no LeadForm equivalent yet, so it degrades to a text box rather than
        // rendering nothing. Named here so it's a known gap, not a silent one.
        inputType: f.type === "choice" ? "text" : f.type,
        required: f.required,
      }));
      props.buttonLabel = prefer(n.props?.buttonLabel, form.buttonLabel);
      props.note = prefer(n.props?.note, form.note);
      props.successHeading = prefer(n.props?.successHeading, form.successHeading);
      props.successBody = prefer(n.props?.successBody, form.successBody);
    }

    return { ...(v as object), props } as unknown;
  };

  return walk(data) as T;
}

/**
 * Every place a given form is actually used: which website, which page.
 *
 * ⚠️ THIS IS THE THING THAT MAKES DELETING SAFE, and Steven asked for it by name: *"when you try
 * to delete something, you see all the dots that are connected to it… so a human sees what's
 * connected to things before they delete things."* A pointer architecture buys live updates and
 * pays for them with dangling references — three client sites can be quietly depending on one
 * form. The answer isn't to forbid deleting, it's to show the connections first.
 */
export function formsInUse(
  data: unknown,
  onFound: (formId: string) => void
): void {
  const walk = (v: unknown): void => {
    if (Array.isArray(v)) return v.forEach(walk);
    if (!v || typeof v !== "object") return;
    const n = v as Node;
    const id = typeof n.props?.formId === "string" ? n.props.formId.trim() : "";
    if (id) onFound(id);
    if (n.props) Object.values(n.props).forEach(walk);
  };
  walk(data);
}
