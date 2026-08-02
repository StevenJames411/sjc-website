// The intake questions — TYPES + DATA only, no storage, safe to import in the browser.
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

export type IntakeAnswers = Record<string, string | string[]>;

export type IntakeQuestion = {
  id: string;
  /** Asked in her language, not ours. */
  label: string;
  help?: string;
  type: "text" | "tel" | "url" | "textarea" | "choice" | "photos";
  options?: string[];
  placeholder?: string;
  required?: boolean;
  /**
   * A dotted path on the Site record that already answers this. If that field has a value, the
   * question is skipped entirely — this is the whole prospect-vs-inbound mechanism.
   */
  satisfiedBy?: string;
};

// ⚠️ NO QUALIFIERS ON THIS FORM. There used to be a `disqualifyOn` mechanism that ended the flow
// when someone answered "yes, and it works fine" to the website question. It's gone on purpose.
// This form's only job is collecting what's needed to build the site. It is not a filter, and it
// is not where we decide whether to work with someone — if they don't want to work with us, no
// wording on a form changes that. Questions here either have an answer or they don't.

/** Read "business.phoneDisplay" off a Site. */
export function valueAt(site: Site | null, path?: string): string {
  if (!site || !path) return "";
  return path.split(".").reduce<unknown>((acc, k) => {
    if (acc && typeof acc === "object") return (acc as Record<string, unknown>)[k];
    return undefined;
  }, site) as string || "";
}

export const INTAKE_QUESTIONS: IntakeQuestion[] = [
  // ── The key that collapses the whole front half ────────────────────────────────────────────
  // One paste gives us hours, address, phone, categories, reviews and often photos. Outbound we
  // already have it from the scrape; inbound this is question one. Either way nobody types their
  // own address into a form on a phone.
  {
    id: "gbpUrl",
    label: "Your Google Business listing",
    help:
      "Search your business name on Google, then copy the link to your listing. This saves you " +
      "typing your address, hours and phone number — we can read all of it from there.",
    type: "url",
    placeholder: "https://maps.google.com/…",
  },

  // ── Identity. Almost always skipped for a prospected client ────────────────────────────────
  {
    id: "businessName",
    label: "Business name",
    type: "text",
    required: true,
    satisfiedBy: "business.name",
  },
  {
    id: "phone",
    label: "Best number for customers to reach you",
    type: "tel",
    required: true,
    satisfiedBy: "business.phoneDisplay",
  },
  {
    id: "address",
    label: "Where you're based",
    help: "Or the towns you cover, if customers don't come to you.",
    type: "text",
    satisfiedBy: "business.address",
  },
  {
    id: "hours",
    label: "Your hours",
    type: "textarea",
    placeholder: "Mon–Fri 8–6, Sat 9–2, closed Sunday",
    satisfiedBy: "business.hours",
  },

  // Information only — what's there now, so we know what we're replacing. Not a test.
  {
    id: "currentSite",
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
    id: "whyYou",
    label: "Why do customers pick you over the other guy?",
    help: "In your own words. Don't polish it — I'd rather have how you'd say it out loud.",
    type: "textarea",
    required: true,
  },
  {
    id: "photos",
    label: "Photos of your work",
    help:
      "Ten or so is plenty. Straight off your phone is fine — we'll size and clean them up. " +
      "Real photos of your own work beat anything we could buy.",
    type: "photos",
    required: true,
  },
  {
    id: "anythingElse",
    label: "Anything else we should know?",
    type: "textarea",
  },
];

/** The questions this particular business still has to answer. */
export function questionsFor(site: Site | null): IntakeQuestion[] {
  return INTAKE_QUESTIONS.filter((q) => !valueAt(site, q.satisfiedBy));
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
};
