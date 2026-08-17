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
  | "multi"
  | "photos";

/** The single list every writer validates against. An unknown type falls back to `text`. */
export const FORM_FIELD_TYPES: FormFieldType[] = [
  "text",
  "tel",
  "email",
  "url",
  "textarea",
  "choice",
  "multi",
  "photos",
];

/** Types that carry a list of options. One place, so a new one can't be half-added. */
export const CHOICE_TYPES: FormFieldType[] = ["choice", "multi"];

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
  /**
   * For `choice` and `multi`.
   *
   * ⚠️ `multi` EXISTS BECAUSE A COPY THAT LOSES IT ISN'T A COPY. /apply asks "Channel, pick all
   * that apply" as a genuine multi-select. The library had only single-choice, so copying that
   * page in downgraded the question to "pick one" — silently, and it looked right. Had the page
   * then been LINKED to that copy, a live funnel would have started accepting one answer where it
   * used to accept several, and nobody would have seen a thing go wrong.
   */
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
  /**
   * THE SCREEN THIS QUESTION SITS ON, by its heading. Blank = the first/only screen.
   *
   * /apply groups thirteen questions into titled steps ("About your business", "What you've
   * tried") and moves a step at a time. That is a third layout, not a variant of the other two:
   * `oneQuestionPerScreen` is one question at a time with no headings, and a flat form is all of
   * them at once. Consecutive questions sharing a step string are one screen.
   *
   * ⚠️ ADDED SO A MIGRATION DOESN'T HAVE TO CHANGE A LIVE FUNNEL'S SHAPE. Moving /apply into the
   * library was supposed to change WHERE its questions live, nothing else — flattening its steps
   * on the way past would have been a redesign smuggled in as a refactor.
   */
  step?: string;
  /** Draw this `choice` as a real dropdown instead of buttons. Opt-in per question. */
  dropdown?: boolean;
};

/**
 * Is this form plausibly the one this page's questions came from?
 *
 * ⚠️ THE GUARD ON LINKING A WIZARD. /apply files each answer under its question's key, and those
 * keys ARE the columns in the Discovery Intake sheet. Link the page to a form built from some
 * OTHER page's questions and every column silently starts over — the form still renders, visitors
 * still apply, and the sheet grows a second set of columns beside the orphaned first.
 *
 * Zero keys in common is a mis-pick, not an edit: nobody rewrites all thirteen keys at once. Some
 * in common is ordinary editing — a question added, one removed — and is allowed through.
 *
 * Returns true when there is nothing to compare against, because "no opinion" must not read as
 * "wrong".
 */
export function looksLikeSameForm(formKeys: string[], pageKeys: string[]): boolean {
  if (!formKeys.length || !pageKeys.length) return true;
  return formKeys.some((k) => pageKeys.includes(k));
}

/** The questions of a form, grouped into screens by `step`, in order. */
export function stepsOf(fields: FormField[]): { title: string; fields: FormField[] }[] {
  const out: { title: string; fields: FormField[] }[] = [];
  for (const f of fields || []) {
    const title = (f.step || "").trim();
    const last = out[out.length - 1];
    // Grouped by ADJACENCY, not by collecting every field with the same title. Two separated runs
    // of "About you" stay two screens — reordering questions in the editor must not silently
    // teleport one to the other end of the form.
    if (last && last.title === title) last.fields.push(f);
    else out.push({ title, fields: [f] });
  }
  return out;
}

/**
 * HOW MANY QUESTIONS FIT ON ONE SCREEN OF A SURVEY.
 *
 * Steven set these from the mobile case, which is the only case that matters: *"one to four
 * questions lives on the page… if it's more than five questions, the page doesn't look like it
 * goes anywhere and the next set of questions just loads."* A screen has to fit a phone with the
 * Next button reachable without scrolling — that is the whole constraint, and both numbers come
 * out of it. On a desktop it simply reads as generous spacing.
 */
export const SURVEY_CAP = 4;
/** Below this many questions a form isn't worth stepping — it just sits in its section. */
export const SURVEY_MIN = 5;

/** A textarea eats a screen the way two short boxes do; so does a long list of options. */
function screenWeight(f: { type?: string; inputType?: string; options?: string[] }): number {
  const t = String(f?.type || f?.inputType || "").toLowerCase();
  if (t === "textarea") return 2;
  if ((f?.options?.length || 0) > 4) return 2;
  return 1;
}

/**
 * THE SCREENS OF A SURVEY — the one rule the live page and the builder both ask.
 *
 * Three outcomes, in order:
 *   1. The form AUTHORED its own steps (`step` titles, as /apply does) -> use them, untouched.
 *   2. Fewer than SURVEY_MIN questions -> ONE screen. A three-question contact form split across
 *      two screens is worse than the wall the split was meant to fix.
 *   3. Otherwise -> balanced screens of about SURVEY_CAP.
 *
 * ⚠️ AUTHORED STEPS WIN, AND THAT IS NOT A COURTESY. /apply is a live funnel whose thirteen
 * questions sit under headings somebody wrote. Re-chunking them by count would redesign a running
 * funnel as a side effect of a layout change — precisely the trap `step` was added to avoid.
 *
 * ⚠️ BALANCED, NOT GREEDY. Filling each screen to the cap strands the remainder on the last one:
 * seventeen questions become 4/4/4/4/1, and a final screen holding a single box reads as a bug.
 * Splitting to a running target gives 4/4/3/3/3 — no orphan, and nothing over the cap.
 */
export function surveyScreensOf<
  T extends { step?: string; type?: string; inputType?: string; options?: string[] }
>(fields: T[]): { title: string; fields: T[] }[] {
  const list = (fields || []).filter(Boolean);
  if (!list.length) return [];
  if (list.some((f) => String(f?.step || "").trim())) {
    return stepsOf(list as unknown as FormField[]) as unknown as { title: string; fields: T[] }[];
  }
  if (list.length < SURVEY_MIN) return [{ title: "", fields: list }];

  const weights = list.map(screenWeight);
  const total = weights.reduce((n, w) => n + w, 0);
  const screens = Math.max(1, Math.ceil(total / SURVEY_CAP));

  const out: { title: string; fields: T[] }[] = [];
  let current: T[] = [];
  let carried = 0;
  for (let i = 0; i < list.length; i++) {
    current.push(list[i]);
    carried += weights[i];
    // Close this screen once it has taken its share of the total — except the last one, which
    // takes whatever remains rather than opening another screen for the tail.
    const target = (total * (out.length + 1)) / screens;
    const lastField = i === list.length - 1;
    if (lastField || (carried >= target && out.length < screens - 1)) {
      out.push({ title: "", fields: current });
      current = [];
    }
  }
  return out;
}

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

/**
 * WHAT THE THREE GROUPS ON THE LIBRARY SCREEN ARE CALLED.
 *
 * ⚠️ I NAMED THESE; THEY'RE HIS SCREEN. Steven: *"You named them, yours, samples. I want to be
 * able to edit what we call each section."* Same reasoning as the back-office menu, which is
 * already editable data — a label somebody else chose is a label you read past. The GROUPING is
 * the code's job (what's in use, what's yours, what's an example); what it's CALLED is his.
 *
 * ⚠️ THE KEY IS THE IDENTITY, THE LABEL IS DECORATION — the same law as the nav. Rename a heading
 * to anything you like; nothing looks up a section by what it says.
 */
export type SectionKey = "mine" | "inUse" | "samples";

export const SECTION_DEFAULTS: Record<SectionKey, string> = {
  mine: "Yours",
  inUse: "In use — running right now",
  samples: "Samples to start from",
};

export const SECTION_KEYS = Object.keys(SECTION_DEFAULTS) as SectionKey[];

/** Saved labels merged over the code defaults, so a blank or missing one can't leave a heading empty. */
export function mergeSections(saved?: Partial<Record<SectionKey, string>>): Record<SectionKey, string> {
  const out = { ...SECTION_DEFAULTS };
  for (const k of SECTION_KEYS) {
    const v = String(saved?.[k] || "").trim();
    if (v) out[k] = v;
  }
  return out;
}

/**
 * Where a review button points, always. A REFERENCE, never a link — resolved per site at render
 * from that website's own settings. See FormDef.altSuccess for why no form may hold a URL.
 */
export const REVIEW_BUTTON_URL = "{{business.reviewUrl}}";

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
  /**
   * PUT AWAY, NOT DESTROYED — how you "delete" a built-in.
   *
   * ⚠️ A BUILT-IN CANNOT ACTUALLY BE DELETED. Its questions live in code, so removing the saved
   * row would only drop the override and the form would reappear on the next read — which reads
   * as the delete button being broken. So the trash can on a built-in hides it instead, and the
   * screen says so and offers it back.
   *
   * ⚠️ HIDDEN FORMS STILL RESOLVE. This filters the LIBRARY SCREEN, never findForm — a page
   * pointing at a form you tidied away keeps working. Hiding is a housekeeping act, not a way to
   * break somebody's live contact page from two screens away.
   */
  hidden?: boolean;
  /**
   * A DIFFERENT THANK-YOU FOR CERTAIN ANSWERS — and the whole five-star funnel in one field.
   *
   * A review form asks how it went. A happy customer should be sent straight to Google while she
   * is still holding her phone and still pleased; an unhappy one should not, and telling her
   * "leave us a review!" is how a bad afternoon becomes a public one-star. Same form, same
   * questions, two endings.
   *
   * ⚠️ IT IS NOT A FILTER ON WHAT GETS COLLECTED. Every answer lands in the client's sheet
   * whichever ending is shown, including the bad ones — especially the bad ones, which are the
   * ones an owner needs to see. What changes is only the last screen. Suppressing a review is a
   * different thing from choosing who gets ASKED for one, and this does the second.
   */
  altSuccess?: {
    /** Which question decides. */
    fieldId: string;
    /** The answers that trigger it. Matched exactly, against the stored value. */
    values: string[];
    heading: string;
    body: string;
    /**
     * Optional button on the thank-you screen — for a review form, "Leave a Google review".
     *
     * ⛔ THERE IS NO `buttonUrl` HERE, AND THAT IS THE POINT. A form is SHARED: several sites point
     * at one definition. A URL stored on it is one client's review page shown to every other
     * client's customers — the plan's own named counterexample, and it was live. The editor even
     * labelled the field "THIS CLIENT'S Google review link" on an object that has no client.
     *
     * Worse, the guard had it backwards: `normalizeAltSuccess` accepted a value only if it matched
     * `^https?://`, so a hardcoded literal passed and `{{business.reviewUrl}}` — the safe answer,
     * seeded right here in code — was blanked on the first save through the editor.
     *
     * Now the destination is not the form's to hold. lib/formPointer stamps REVIEW_BUTTON_URL on
     * the block when a label exists, and it resolves per site at render from Website settings,
     * exactly like the phone number. Pointing one client's form at another's review page stopped
     * being something to remember and became something you cannot express.
     */
    buttonLabel?: string;
  };
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
    // ── THE REVIEW SURVEY (the five-star funnel) ─────────────────────────────────────────────
    // A product, not a sample. Copy it per client, paste their Google review link into the
    // thank-you button, and send the link out after a finished job.
    //
    // ⚠️ THE POINT IS THE SPLIT, NOT THE QUESTIONS. Four and five stars land on a thank-you that
    // sends her to Google while she is still holding her phone and still pleased. One to three
    // land on a thank-you that says a human will call — because "leave us a review!" to somebody
    // who just had a bad afternoon is how it becomes a public bad afternoon.
    //
    // ⚠️ EVERY ANSWER REACHES THE OWNER'S SHEET EITHER WAY, one-star answers included. Those are
    // the ones he most needs to read. This chooses who gets ASKED for a public review; it does
    // not choose what gets collected, and it must never become that.
    //
    // ⚠️ NO LIST AND NO SCHEDULE LIVES HERE. Sending the link out is the drip, and a drip holds a
    // list plus state, which is the never-a-CRM line. This is a form. It is asked, answered and
    // forgotten, exactly like every other one.
    id: "review",
    name: "Review survey",
    kind: "builtin",
    description: "After a finished job. Happy customers get sent to Google; unhappy ones get a call.",
    fields: [
      {
        fieldId: "rating",
        label: "How did we do?",
        type: "choice",
        required: true,
        options: [
          "★★★★★ Great",
          "★★★★ Good",
          "★★★ OK",
          "★★ Not great",
          "★ Bad",
        ],
      },
      { fieldId: "message", label: "Anything you'd like to tell us?", type: "textarea" },
      { fieldId: "name", label: "Your name", type: "text" },
      { fieldId: "phone", label: "Best phone number", type: "tel" },
    ],
    buttonLabel: "Send it",
    note: "",
    // The DEFAULT ending is the careful one, so a form copied and never configured does the safe
    // thing. Being sent to Google is the exception you opt into by being pleased.
    successHeading: "Thank you — that's really helpful.",
    successBody:
      "Someone will give you a call to put it right. If it's urgent, ring {{business.phone}}.",
    altSuccess: {
      fieldId: "rating",
      values: ["★★★★★ Great", "★★★★ Good"],
      heading: "That's great to hear — thank you.",
      body:
        "Would you mind saying that on Google? It takes a minute and it's the single biggest " +
        "thing that helps people find us.",
      buttonLabel: "Leave a Google review",
    },
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
  multi: "Pick any",
  photos: "Photos",
};
