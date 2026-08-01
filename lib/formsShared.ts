// Form TYPES + CONSTANTS only — no storage, safe to import in the browser.
//
// Split from ./forms for the same reason sitesShared is split from sites: the library panel and
// the Puck picker are client components, and importing the storage module drags the database
// client into the browser bundle.
//
// ── WHAT A FORM IS HERE, AND WHAT IT DELIBERATELY IS NOT ──────────────────────────────────────
// A Form is a REUSABLE SET OF QUESTIONS. That is all. It is a starting point you copy onto a
// website, not a live dependency that website keeps pointing at.
//
// The alternative — a website links to a form and resolves it at render — was rejected on
// purpose. It buys "fix a typo everywhere in one click" and costs a blast radius: one careless
// edit changes every client's contact form at once, and deleting a form leaves published pages
// pointing at nothing. Copying means the worst a bad preset can do is put the wrong questions on
// ONE page, where you can see it and fix it. At thirty clients, fixing a typo everywhere is
// thirty clicks, once. That trade is worth it.
//
// ⚠️ THERE IS NO DESTINATION ON THIS RECORD, AND THERE MUST NEVER BE ONE.
// No email, no spreadsheet id, no webhook, no "notify" toggle. Where a lead goes is a pure
// function of WHICH WEBSITE it was submitted on — see lib/leadDelivery.ts, which reads the Site
// record and nothing else. Because there is nothing here to type, typing cannot go wrong; because
// there is nothing here to carry, copying a form cannot carry one client's destination onto
// another client's site. That failure — client A's enquiry landing in client B's inbox — is the
// one that ends a retainer and the referral behind it. It is prevented structurally, by the shape
// of this type, not by anybody remembering to check.

export type FormFieldType = "text" | "tel" | "email" | "url" | "textarea" | "choice";

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
};

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
};
