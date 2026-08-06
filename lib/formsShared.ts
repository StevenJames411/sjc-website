// Form TYPES + CONSTANTS only — no storage, safe to import in the browser.
//
// Split from ./forms for the same reason sitesShared is split from sites: the library panel and
// the Puck picker are client components, and importing the storage module drags the database
// client into the browser bundle.
//
// ── WHAT A FORM IS HERE, AND WHAT IT DELIBERATELY IS NOT ──────────────────────────────────────
// A Form is a REUSABLE SET OF QUESTIONS, and a page POINTS AT one rather than holding a copy.
//
// ⚠️ THIS NOTE USED TO SAY THE OPPOSITE, and said it for months after it stopped being true.
// Forms were copy-on-use until 2026-08-06, when Steven asked for the live link: *"if I change a
// question in the form library, whatever's on their website should update."* The resolver is
// lib/formPointer.ts. Copy-on-use bought a small blast radius and cost the whole point of having
// a library — you changed the questions in one place and got them in none.
//
// ── WHAT A FORM HAS TO BE ABLE TO HOLD ────────────────────────────────────────────────────────
// Every form Steven actually uses was built its own way, outside this library, because the
// library couldn't hold what they do. Three things closed that gap (2026-08-06):
//   `photos`               a question that takes pictures, not words
//   satisfiedBy            skip a question when the site record already answers it
//   oneQuestionPerScreen   a long form is a conversation, not a wall
// None of them are new mechanisms — they are the ones the onboarding form already ran on, moved
// down here so a form can be edited on a screen instead of in code.
//
// ⚠️ THERE IS NO DESTINATION ON THIS RECORD, AND THERE MUST NEVER BE ONE.
// No email, no spreadsheet id, no webhook, no "notify" toggle. Where a lead goes is a pure
// function of WHICH WEBSITE it was submitted on — see lib/leadDelivery.ts, which reads the Site
// record and nothing else. Because there is nothing here to type, typing cannot go wrong; because
// there is nothing here to carry, copying a form cannot carry one client's destination onto
// another client's site. That failure — client A's enquiry landing in client B's inbox — is the
// one that ends a retainer and the referral behind it. It is prevented structurally, by the shape
// of this type, not by anybody remembering to check.

import type { Site } from "./sitesShared";

/**
 * ⚠️ `photos` IS NOT A TEXT BOX AND CANNOT GO ANYWHERE A TEXT BOX CAN.
 *
 * It runs the onboarding upload pipeline — HEIC→JPEG, resize, EXIF/GPS strip, hosted under a path
 * derived from a verified site id, capped per client (lib/imagePrep.ts + app/api/intake/upload).
 * That route is gated by an onboarding link being open, which a stranger on a client's public
 * contact page does not have. So a photo question works on an onboarding form and is SKIPPED on a
 * website's lead form — see FIELD_TYPE_ONBOARDING_ONLY, lib/formPointer.ts, and the warning the
 * editor puts under the question so it is visible where it is chosen, not just true in code.
 */
export type FormFieldType =
  | "text"
  | "tel"
  | "email"
  | "url"
  | "textarea"
  | "choice"
  | "photos";

/** The single list every writer validates against. An unknown type falls back to `text`. */
export const FORM_FIELD_TYPES: FormFieldType[] = [
  "text",
  "tel",
  "email",
  "url",
  "textarea",
  "choice",
  "photos",
];

/** Types a public website form can't draw. Kept as a set so adding one is a one-line change. */
export const FIELD_TYPE_ONBOARDING_ONLY: FormFieldType[] = ["photos"];

export type FormField = {
  /**
   * THE GOOGLE SHEET COLUMN KEY. Minted once, when the question is created, and never again.
   *
   * ⚠️ NEVER derive this from the label. The Apps Script matches sheet columns by this exact
   * string (kept in the header cell's note), which is what lets a question be reworded and the
   * column keep its history. Derive it from the label and rewording silently orphans the column
   * and starts a new one — the bug this whole field exists to kill.
   */
  fieldId: string;
  label: string;
  help?: string;
  type: FormFieldType;
  /** For `choice` only. */
  options?: string[];
  placeholder?: string;
  required?: boolean;
  /**
   * A dotted path on the Site record that ALREADY ANSWERS THIS. If that field has a value, the
   * question never appears.
   *
   * This is the whole prospect-vs-inbound mechanism, and it is why there is ONE form rather than
   * one for people we scraped and one for people who found us. Prospected off the scrape, her
   * name, phone and address are already on the record, so she never sees them and it reads as
   * "he's done his homework." Inbound, the record is empty and those same questions surface. No
   * branching, no second form, no flag to keep in sync.
   *
   * ⚠️ ONLY MEANINGFUL WHERE A SITE RECORD EXISTS — that's onboarding. A stranger filling in a
   * contact form on a client's website has no record of her own, so nothing is ever skipped there
   * and every question shows. See questionsToAsk below, which is a no-op with a null site.
   */
  satisfiedBy?: string;
};

/**
 * What Steven picks from instead of typing `business.phoneDisplay`.
 *
 * The paths are real dotted paths into the Site record (lib/sitesShared.ts). Keeping the list here
 * rather than letting him type one means a typo can't quietly turn "skip if known" into "never
 * skips" — a wrong path reads as an empty value, which looks exactly like a question that simply
 * always gets asked. That failure is invisible; a dropdown makes it impossible.
 */
export const SATISFIED_BY_CHOICES: { path: string; label: string }[] = [
  { path: "business.name", label: "Business name" },
  { path: "business.phoneDisplay", label: "Phone number" },
  { path: "business.email", label: "Email address" },
  { path: "business.address", label: "Address" },
  { path: "business.hours", label: "Opening hours" },
];

/** Read "business.phoneDisplay" off a Site record. */
export function valueAtPath(site: Site | null | undefined, path?: string): string {
  if (!site || !path) return "";
  const found = path.split(".").reduce<unknown>((acc, k) => {
    if (acc && typeof acc === "object") return (acc as Record<string, unknown>)[k];
    return undefined;
  }, site);
  return typeof found === "string" ? found : "";
}

/**
 * The questions this particular business still has to answer.
 *
 * Pass `null` for the site and you get every question back — which is the correct answer for a
 * public form, where there is no record to check against.
 */
export function questionsToAsk(fields: FormField[], site: Site | null | undefined): FormField[] {
  return (fields || []).filter((f) => !valueAtPath(site, f.satisfiedBy));
}

/** `builtin` records live in code and always exist; `preset` ones are Steven's own. */
export type FormKind = "builtin" | "preset";

export type FormDef = {
  id: string;
  name: string;
  kind: FormKind;
  description?: string;
  fields: FormField[];
  buttonLabel: string;
  /** The small print under the button. */
  note: string;
  successHeading: string;
  successBody: string;
  /**
   * ONE QUESTION AT A TIME instead of one long list.
   *
   * Fifteen fields on a phone is a wall; one question with a big box is a conversation, and it
   * makes "where was I" trivial to answer when she comes back to a half-finished form. It earns
   * its keep on a long form and costs nothing but clicks on a four-question contact form, so it's
   * off by default and turned on per form.
   *
   * ⚠️ A LONG FORM ON ONE SCREEN IS THE VERSION THAT DOESN'T GET FINISHED, and an unfinished
   * onboarding form is Steven chasing somebody by text. That is what this exists to prevent.
   */
  oneQuestionPerScreen?: boolean;
};

/**
 * A fixed vocabulary of the questions almost every service business asks.
 *
 * The point is the KEY, not the label. When every client's form uses `phone` for the phone
 * question, every client's Leads tab has the same columns in the same order, and one glance reads
 * any client's spreadsheet. Labels stay freely editable — reword "Best phone number" to "Cell"
 * and the column doesn't move.
 */
export const STANDARD_FIELDS: FormField[] = [
  { fieldId: "name", label: "Your name", type: "text", required: true },
  { fieldId: "phone", label: "Best phone number", type: "tel", required: true },
  { fieldId: "email", label: "Email", type: "email" },
  { fieldId: "business", label: "Business name", type: "text" },
  { fieldId: "service", label: "What do you need done?", type: "text", required: true },
  { fieldId: "when", label: "When do you need it?", type: "text" },
  { fieldId: "address", label: "Address", type: "text" },
  { fieldId: "message", label: "Anything else?", type: "textarea" },
];

/**
 * Mint a key for a question that isn't one of the standards.
 *
 * The slug half keeps it readable when you're staring at a header note in a spreadsheet trying to
 * work out which column is which. The random half is both the collision guard and a deliberate
 * visual signal: nobody looks at `q-what-breed-7f3a` and concludes that rewording the label
 * changes it.
 */
export function mintFieldId(label: string, taken: string[] = []): string {
  const slug =
    String(label || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 32) || "q";
  for (let n = 0; n < 50; n++) {
    // Not Math.random: a stable-ish suffix from the label plus the attempt keeps repeat mints
    // from colliding without pulling in a dependency.
    const suffix = Math.abs(hash(`${slug}:${taken.length}:${n}`)).toString(36).slice(0, 4);
    const id = `q-${slug}-${suffix}`;
    if (!taken.includes(id)) return id;
  }
  return `q-${slug}-${taken.length}`;
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return h;
}

export const emptyForm = (): FormDef => ({
  id: "",
  name: "",
  kind: "preset",
  fields: [],
  buttonLabel: "Send it",
  note: "",
  successHeading: "Got it — thank you.",
  successBody: "We'll be in touch shortly.",
});

/**
 * The presets that always exist, even against an empty store.
 *
 * Same trick as SJC_SITE in lib/sites.ts: these are implicit records merged UNDER anything saved
 * for the same id, so a cold or unprovisioned store still shows a working library, and editing
 * one is allowed without the code copy ever being the thing that has to change.
 *
 * ⚠️ The success copy uses {{business.phone}}, not a literal number. A literal is how Steven's own
 * phone number ended up on a client's thank-you screen — see components/blocks/DesignSection.tsx.
 * Tokens resolve per-site at public render via lib/businessTokens.ts.
 */
export const BUILTIN_FORMS: FormDef[] = [
  {
    id: "contact",
    name: "Contact",
    kind: "builtin",
    description: "The everyday four. Name, phone, what they need, and room to explain.",
    fields: [
      { fieldId: "name", label: "Your name", type: "text", required: true },
      { fieldId: "phone", label: "Best phone number", type: "tel", required: true },
      { fieldId: "service", label: "What do you need done?", type: "text", required: true },
      { fieldId: "message", label: "Anything else?", type: "textarea" },
    ],
    buttonLabel: "Send it",
    note: "",
    successHeading: "Got it — thank you.",
    successBody: "We'll be in touch shortly. Rather talk now? Call {{business.phone}}.",
  },
  {
    id: "quote",
    name: "Quote request",
    kind: "builtin",
    description: "For trades quoting work — adds the address and when they need it.",
    fields: [
      { fieldId: "name", label: "Your name", type: "text", required: true },
      { fieldId: "phone", label: "Best phone number", type: "tel", required: true },
      { fieldId: "service", label: "What are you looking to have done?", type: "text", required: true },
      { fieldId: "address", label: "Where's the job?", type: "text" },
      { fieldId: "when", label: "When were you hoping to start?", type: "text" },
      { fieldId: "message", label: "Anything else we should know?", type: "textarea" },
    ],
    buttonLabel: "Get my quote",
    note: "No obligation. We'll call you back to talk it through.",
    successHeading: "Got it — thank you.",
    successBody: "We'll call you back shortly. Rather talk now? Call {{business.phone}}.",
  },
  {
    id: "callback",
    name: "Call me back",
    kind: "builtin",
    description: "The shortest one that still works. Two boxes.",
    fields: [
      { fieldId: "name", label: "Your name", type: "text", required: true },
      { fieldId: "phone", label: "Best number to reach you", type: "tel", required: true },
    ],
    buttonLabel: "Call me back",
    note: "",
    successHeading: "Got it — thank you.",
    successBody: "We'll call you back shortly.",
  },
];

/** The label shown for an input type in the editor. One list, so the wording can't drift. */
export const FIELD_TYPE_LABELS: Record<FormFieldType, string> = {
  text: "Short text",
  tel: "Phone",
  email: "Email",
  url: "Web address",
  textarea: "Long text",
  choice: "Pick one",
  photos: "Photos",
};
