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
import { CHOICE_TYPES, type FormDef , REVIEW_BUTTON_URL} from "./formsShared";

/** The props a LeadForm block carries. Only the ones this touches. */
type LeadFormProps = {
  formId?: string;
  fields?: unknown;
  /** An imported design's contact box keeps its questions under a different name. */
  formFields?: unknown;
  buttonLabel?: string;
  note?: string;
  successHeading?: string;
  successBody?: string;
};

type Node = { type?: string; props?: LeadFormProps & Record<string, unknown> };

/**
 * WHICH PROP HOLDS THIS BLOCK'S QUESTIONS.
 *
 * ⚠️ A DesignSection CALLS THEM `formFields`, NOT `fields`, and filling in the wrong one is a
 * silent no-op: the block reads `formFields`, finds the questions it always had, and renders
 * exactly as before. The pointer would appear to be set and change nothing — the same shape of
 * failure as the props-only walk below, which is the reason this file has a test at all.
 */
const questionsProp = (type: unknown) => (type === "DesignSection" ? "formFields" : "fields");

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

  // ⚠️ WALK EVERY KEY, NOT JUST `props`. The first version recursed only into `props`, which meant
  // the page object itself — whose blocks live under `content`, with no `props` of its own — was
  // never entered, so NOTHING resolved. It typechecked, it built, and it silently did nothing; a
  // unit test against a nested block is the only reason it didn't ship that way.
  const walk = (v: unknown): unknown => {
    if (Array.isArray(v)) return v.map(walk);
    if (!v || typeof v !== "object") return v;

    const n = v as Node;
    const id = typeof n.props?.formId === "string" ? n.props.formId.trim() : "";
    const form = id ? byId.get(id) : undefined;

    const out: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(v as Record<string, unknown>)) out[k] = walk(val);

    const props = (out.props || {}) as Record<string, unknown>;

    if (form) {
      props[questionsProp(n.type)] = form.fields
        // ⚠️ PHOTO QUESTIONS ARE DROPPED HERE, ON PURPOSE. The upload route is gated by an
        // onboarding link being open (app/api/intake/upload), which a stranger on a client's
        // public contact page does not have — so there is nowhere for the file to go. Rendering
        // the picker anyway would take her photos and lose them, which is worse than not asking.
        // Not silent: the form editor warns under any photo question that a website form skips
        // it, so the trade is visible where the question is chosen.
        .filter((f) => f.type !== "photos")
        .map((f) => ({
          label: f.label,
          // ⚠️ `fieldId` IS THE SPREADSHEET COLUMN and must be carried across verbatim. Drop it
          // and LeadForm falls back to slugifying the label — so rewording a question starts
          // filing answers in a NEW column and orphans everything collected under the old one.
          // Carrying it is precisely what lets Steven reword a question in the library without
          // breaking a client's sheet, which is half the point of pointing at the form at all.
          fieldId: f.fieldId,
          // `choice` used to degrade to a text box here — a named gap that became a real one the
          // moment a form's ENDING started depending on the answer. A review form's rating is a
          // choice, and a free-text box means "★★★★★ Great" is typed by hand or not at all, so
          // the rule that decides who gets sent to Google would essentially never match. The
          // options travel and LeadForm draws them.
          inputType: CHOICE_TYPES.includes(f.type) ? "text" : f.type,
          ...(CHOICE_TYPES.includes(f.type) && f.options?.length
            ? { options: f.options, multi: f.type === "multi", dropdown: Boolean(f.dropdown), placeholder: f.placeholder }
            : {}),
          required: f.required,
        }));
      props.buttonLabel = prefer(n.props?.buttonLabel, form.buttonLabel);
      props.note = prefer(n.props?.note, form.note);
      props.successHeading = prefer(n.props?.successHeading, form.successHeading);
      props.successBody = prefer(n.props?.successBody, form.successBody);
      // ⚠️ THE FORM ALWAYS WINS ON THIS ONE — no page override. The other four are wording, which
      // a page is entitled to phrase its own way. This decides WHO GETS SENT TO GOOGLE, and a
      // page quietly holding a stale copy of that rule is a client's customers being sent to the
      // wrong review page. It belongs to the form or nowhere.
      // The destination is stamped here, not stored on the form, and it is the SAME reference for
      // every site — `{{business.reviewUrl}}` resolves from whichever website is being rendered.
      // That is what makes one shared Review survey safe on ten clients.
      if (form.altSuccess) {
        props.altSuccess = form.altSuccess.buttonLabel
          ? { ...form.altSuccess, buttonUrl: REVIEW_BUTTON_URL }
          : form.altSuccess;
      }
      out.props = props;
    }

    return out as unknown;
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
  // Same "walk every key" rule as above, and for the same reason: blocks sit under `content` on
  // the page and under `props.content` inside a Section, so a props-only walk misses both.
  const walk = (v: unknown): void => {
    if (Array.isArray(v)) return v.forEach(walk);
    if (!v || typeof v !== "object") return;
    const n = v as Node;
    const id = typeof n.props?.formId === "string" ? n.props.formId.trim() : "";
    if (id) onFound(id);
    Object.values(v as Record<string, unknown>).forEach(walk);
  };
  walk(data);
}
