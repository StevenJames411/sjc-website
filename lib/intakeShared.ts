// The intake questions — TYPES + DATA only, no storage, safe to import in the browser.
//
// ── THIS IS A LIBRARY FORM NOW, NOT A HARDCODED LIST ─────────────────────────────────────────
// Until 2026-08-06 the onboarding questions existed ONLY here, in code, which meant the one form
// Steven runs on every client was the one form he couldn't change without a developer — and when
// he went looking for it in his own forms library it wasn't there, correctly, because it wasn't.
//
// The questions below are now the FLOOR of a built-in library form (ONBOARDING_FORM). It shows up
// in the library like any other, it's editable on screen, and anything saved merges on top of this
// code copy — the same implicit-record pattern as BUILTIN_FORMS and SJC_SITE.
//
// ⚠️ EVERY `fieldId` BELOW IS A LIVE ANSWER KEY AND A SPREADSHEET COLUMN. A stored answer is
// filed under it, the Onboarding tab matches columns by it, and `satisfiedBy` writes back through
// it. Rename one and every answer already collected under the old name is orphaned — silently,
// because an orphaned answer looks exactly like a question nobody got round to answering. Reword
// the LABEL as much as you like; the key is fixed forever.
//
// THE DESIGN DECISION THIS FILE ENCODES: there is ONE form, not one for prospects and one for
// inbound. A question appears only when the site record doesn't already answer it.
//
//   Prospected off the scrape → name, phone, address are already on the record, so she never sees
//                               them. She gets the handful of questions only she can answer, and
//                               it reads as "he's done his homework."
//   Inbound (found us, or referred) → the record is empty, so those same questions surface.
//
// No branching, no second form, no flag to keep in sync — `satisfiedBy` does it.
//
// AND: ask only what Google can't tell us. Her Google Business Profile already holds hours,
// address, phone, categories, reviews and often photos. Fifteen questions where four are data
// entry reads as paperwork. Six in her own words reads as a professional who's done this before.

import type { Site } from "./sitesShared";
import { valueAtPath, type FormDef, type FormField } from "./formsShared";

export type IntakeAnswers = Record<string, string | string[]>;

/**
 * A library FormField, seen from the intake side — `fieldId` read out as `id`.
 *
 * The two names are the same string and always have been. Intake called it `id` because it is the
 * key an answer is stored under; the library calls it `fieldId` because it is the column in the
 * spreadsheet. Keeping both names is cheaper than renaming a key that live data is filed under.
 */
export type IntakeQuestion = {
  id: string;
  /** Asked in her language, not ours. */
  label: string;
  help?: string;
  type: FormField["type"];
  options?: string[];
  placeholder?: string;
  required?: boolean;
  /**
   * A dotted path on the Site record that already answers this. If that field has a value, the
   * question is skipped entirely — this is the whole prospect-vs-inbound mechanism.
   */
  satisfiedBy?: string;
};

/** The library id of the onboarding form. Fixed — it's what the onboarding page looks up. */
export const ONBOARDING_FORM_ID = "onboarding";

/** Library field → intake question. The only difference is the name of the key. */
export const toIntakeQuestions = (fields: FormField[]): IntakeQuestion[] =>
  (fields || []).map(({ fieldId, ...rest }) => ({ ...rest, id: fieldId }));

// ⚠️ NO QUALIFIERS ON THIS FORM. There used to be a `disqualifyOn` mechanism that ended the flow
// when someone answered "yes, and it works fine" to the website question. It's gone on purpose.
// This form's only job is collecting what's needed to build the site. It is not a filter, and it
// is not where we decide whether to work with someone — if they don't want to work with us, no
// wording on a form changes that. Questions here either have an answer or they don't.

/**
 * Read "business.phoneDisplay" off a Site.
 *
 * One implementation, in formsShared, because `satisfiedBy` is a library feature now. Two copies
 * of a path-walker is two chances for them to disagree about what an empty value is — and "is
 * this already answered" is exactly the question where disagreeing shows up as a question that
 * appears for one client and not another with no way to tell why.
 */
export const valueAt = (site: Site | null, path?: string): string => valueAtPath(site, path);

/**
 * THE ONBOARDING FORM, as a library record.
 *
 * `oneQuestionPerScreen` is on and must stay on: this is nine questions answered on a phone
 * between jobs, and nine boxes on one screen is the version that doesn't get finished.
 *
 * ⚠️ NO DESTINATION HERE EITHER — see the long note in formsShared.ts. Where these answers go is
 * decided by WHICH SITE the form was opened for, never by anything typed on the form.
 */
export const ONBOARDING_FIELDS: FormField[] = [
  // ── The key that collapses the whole front half ────────────────────────────────────────────
  // One paste gives us hours, address, phone, categories, reviews and often photos. Outbound we
  // already have it from the scrape; inbound this is question one. Either way nobody types their
  // own address into a form on a phone.
  {
    fieldId: "gbpUrl",
    label: "Your Google Business listing",
    help:
      "Search your business name on Google, then copy the link to your listing. This saves you " +
      "typing your address, hours and phone number — we can read all of it from there.",
    type: "url",
    placeholder: "https://maps.google.com/…",
  },

  // ── Identity. Almost always skipped for a prospected client ────────────────────────────────
  {
    fieldId: "businessName",
    label: "Business name",
    type: "text",
    required: true,
    satisfiedBy: "business.name",
  },
  {
    fieldId: "phone",
    label: "Best number for customers to reach you",
    type: "tel",
    required: true,
    satisfiedBy: "business.phoneDisplay",
  },
  {
    fieldId: "address",
    label: "Where you're based",
    help: "Or the towns you cover, if customers don't come to you.",
    type: "text",
    satisfiedBy: "business.address",
  },
  {
    fieldId: "hours",
    label: "Your hours",
    type: "textarea",
    placeholder: "Mon–Fri 8–6, Sat 9–2, closed Sunday",
    satisfiedBy: "business.hours",
  },

  // Information only — what's there now, so we know what we're replacing. Not a test.
  {
    fieldId: "currentSite",
    label: "Do you have a website now?",
    type: "choice",
    options: [
      "No, nothing",
      "Something old I can't update",
      "Yes, and it works fine",
    ],
  },

  // ── The ones only she can answer ───────────────────────────────────────────────────────────
  //
  // ⚠️ WHAT DOES NOT BELONG HERE: anything that sounds like lead generation. "What work do you
  // want more of", "what do you NOT want to be called for" and "describe your best customer"
  // were cut for exactly that reason — they put the owner in mind of MORE customers and IDEAL
  // customers, which is a promise this product does not make. We sell a website, affordably.
  // Don't introduce a problem we're not solving. Lead-gen is a different offer at a different
  // price; asking its questions here sets an expectation the $795 build will never meet.
  {
    fieldId: "whyYou",
    label: "Why do customers pick you over the other guy?",
    help: "In your own words. Don't polish it — I'd rather have how you'd say it out loud.",
    type: "textarea",
    required: true,
  },
  {
    fieldId: "photos",
    label: "Photos of your work",
    help:
      "Ten or so is plenty. Straight off your phone is fine — we'll size and clean them up. " +
      "Real photos of your own work beat anything we could buy.",
    type: "photos",
    required: true,
  },
  {
    fieldId: "anythingElse",
    label: "Anything else we should know?",
    type: "textarea",
  },
];

/**
 * The built-in record. lib/forms.ts merges this in alongside BUILTIN_FORMS, so the onboarding form
 * appears in the library, is editable on screen, and anything saved for it merges over this.
 */
export const ONBOARDING_FORM: FormDef = {
  id: ONBOARDING_FORM_ID,
  name: "Client onboarding",
  kind: "builtin",
  // ⚠️ "AFTER THEY'VE PAID" IS THE LOAD-BEARING WORD. Consulting's /apply survey asks thirteen
  // questions and reads almost exactly like this one asking nine — and it runs BEFORE you'd ever
  // speak to someone, to decide whether to. Two intake forms with no stated moment is how Steven
  // came to believe the /apply survey was this form.
  description:
    "AFTER they've paid — what a new client tells us so their website can be built. Sent as a link, filled in on a phone.",
  fields: ONBOARDING_FIELDS,
  buttonLabel: "Send it in",
  note: "",
  successHeading: "Got it — thank you.",
  successBody:
    "That's everything we need. We'll put it together and send you the site to look at before " +
    "anyone else sees it.",
  oneQuestionPerScreen: true,
};

/**
 * The code copy of the questions.
 *
 * ⚠️ THIS IS THE FLOOR, NOT WHAT SHE SEES. Steven's saved edits merge on top in the library, and
 * only the server can read those. Anything rendering the real form must go through
 * `onboardingQuestions()` in lib/intake.ts; this is the fallback for when the store is cold and
 * the shape for code that only needs the labels.
 */
export const INTAKE_QUESTIONS: IntakeQuestion[] = toIntakeQuestions(ONBOARDING_FIELDS);

/** The questions this particular business still has to answer, from a given set. */
export function questionsFor(site: Site | null, questions = INTAKE_QUESTIONS): IntakeQuestion[] {
  return questions.filter((q) => !valueAt(site, q.satisfiedBy));
}

/** What the site gallery shows about one business's onboarding, at a glance. */
export type IntakeSummary = {
  status: "open" | "closed" | "never opened";
  /** How many of her questions have answers — the chase signal. */
  answered: number;
  /** How many she'll be asked. Fewer for a prospected client; see `satisfiedBy`. */
  asked: number;
  photos: number;
  submitted: boolean;
  /**
   * The unguessable half of her onboarding link, so the gallery can build a URL that actually
   * opens. Absent for a link opened before tokens existed (2026-08-12) — those still work on the
   * old address until they are closed and reopened.
   *
   * ⚠️ This ships to the browser. That is fine and deliberate: it is the OWNER'S own screen, gated
   * by middleware, and copying those links is the entire job of the card it renders on.
   */
  token?: string;
};
