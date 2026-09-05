// THE SYSTEMS ONBOARDING AUDIT — what a client actually has, A to Z, before we quote the work.
//
// ⛔ WHY THIS IS A SECOND FORM AND NOT MORE QUESTIONS ON THE FIRST ONE.
// `lib/intakeShared.ts` is the WEBSITE intake: nine questions, scoped on purpose to a small build,
// carrying an explicit warning not to add anything that promises more than that build delivers. A
// groomer buying a site should never be asked what laptop she uses or whether she runs GoHighLevel.
// This form is for the buyer taking the SYSTEMS engagement — website + GoHighLevel + community —
// where the same questions are not paperwork, they are the survey the quote is built on.
// Two products, two forms. The `satisfiedBy` mechanism is shared and works identically in both.
//
// ── THE SHAPE, AND IT IS STEVEN'S ────────────────────────────────────────────────────────────
// *"List our full suite from the website to the coaching program, everything they would possibly
// need if they had zero assets. If they have half of it and they upload half of it, great — we
// only ask for the second half."*  Every question here is one line of a complete inventory, and
// what comes back empty IS the work order. → the brain,
// `sjc-ops/2026-09-04-the-onboarding-intake-is-the-work-order`
//
// ⭐ EVERY BLOCK IS THREE BEATS: THE QUESTION · THE REASON · PERMISSION TO HAVE NOTHING.
// The reason is what turns forty questions from bureaucracy into a professional who has done this
// before, and it goes per section, never once at the top, because the reason is different every
// time. The permission is what stops a half-built stack reading as a failing grade — and
// half-built is what almost everyone is. Steven: *"I don't care if it's nothing or 20 things."*
//
// ⚠️ EVERY `fieldId` IS A SPREADSHEET COLUMN AND AN ANSWER KEY, MINTED ONCE. Reword any label
// freely; renaming a key orphans every answer already filed under it, silently.
import type { FormDef, FormField } from "./formsShared";

export const SYSTEMS_ONBOARDING_FORM_ID = "systems-onboarding";

/** The sentence that buys the length. Shown once, at the top, in Steven's own voice. */
export const SYSTEMS_INTAKE_INTRO =
  "These questions go deeper than you are used to, and there is a reason. Your tools have to work " +
  "together, and they do not all play nicely with each other — the email you use decides what your " +
  "calendar can do, and the phone in your pocket decides what we can install. Twenty minutes here " +
  "saves a month of surprises. Wherever the answer is 'nothing', say nothing. That is useful too.";

export const SYSTEMS_ONBOARDING_FIELDS: FormField[] = [
  // ── A. THE SHORTCUT ────────────────────────────────────────────────────────────────────────
  {
    fieldId: "gbpUrl",
    label: "Your Google Business listing",
    help:
      "Search your business on Google and copy the link. It saves you typing your address, hours " +
      "and phone, and it tells us what a customer sees before they ever reach your site.",
    type: "url",
    placeholder: "https://maps.google.com/…",
  },
  { fieldId: "businessName", label: "Business name", type: "text", required: true, satisfiedBy: "business.name" },
  { fieldId: "phone", label: "Best number for customers", type: "tel", required: true, satisfiedBy: "business.phoneDisplay" },
  { fieldId: "address", label: "Where you are based", help: "Or the areas you cover, if customers do not come to you.", type: "text", satisfiedBy: "business.address" },

  // ── B. EMAIL — the question that decides half the build ────────────────────────────────────
  {
    fieldId: "emailProvider",
    label: "What email do you actually use for the business?",
    help:
      "This matters more than it sounds. Google Workspace connects to your calendar, your customer " +
      "records and your review requests with nothing in between. The others each need a workaround, " +
      "and it is better to know now than to find out in week three.",
    type: "choice",
    options: [
      "Google Workspace (a paid @yourbusiness.com Google account)",
      "Free Gmail (@gmail.com)",
      "Microsoft 365 / Outlook",
      "Yahoo",
      "Hotmail / Live / MSN",
      "AOL",
      "Whatever came with my website host",
      "Something else / I am not sure",
    ],
    required: true,
  },
  {
    fieldId: "emailAddresses",
    label: "Which addresses are in use, and who reads them?",
    help: "info@, the owner's personal one, an old one nobody checks — all of it. We need to know where a lead currently lands.",
    type: "textarea",
    placeholder: "info@ — goes to me\nbookings@ — nobody has checked it in a year",
  },

  // ── C. THE WEBSITE ─────────────────────────────────────────────────────────────────────────
  {
    fieldId: "currentSite",
    label: "Your website today",
    help: "Whatever you have, including nothing. We would rather tune up something decent than replace it for the sake of it.",
    type: "choice",
    options: ["Nothing at all", "Something old I cannot update", "Something decent that needs work", "Yes, and I am happy with it"],
    required: true,
  },
  { fieldId: "currentSiteUrl", label: "Link to it", type: "url", placeholder: "https://…" },
  {
    fieldId: "sitePlatform",
    label: "What is it built on, if you know?",
    help: "Wix, Squarespace, WordPress, GoDaddy, a guy who has stopped answering. Not knowing is a normal answer.",
    type: "text",
  },
  {
    fieldId: "domainRegistrar",
    label: "Where is your domain name registered, and can you log in?",
    help:
      "GoDaddy, Namecheap, Google Domains, or whoever set it up. This is the single most common " +
      "thing a business cannot get back into, and it is the one thing we cannot do without.",
    type: "text",
  },

  // ── D. CUSTOMER SYSTEM ─────────────────────────────────────────────────────────────────────
  {
    fieldId: "crm",
    label: "How do you keep track of customers and follow-ups right now?",
    help:
      "Be honest — a notebook and your memory is the most common answer we get, and it is not a " +
      "problem. We just need to know what we are moving from.",
    type: "choice",
    options: [
      "Nothing formal — my phone and my memory",
      "A spreadsheet",
      "GoHighLevel",
      "HubSpot / Salesforce / Zoho",
      "Jobber / Housecall Pro / ServiceTitan",
      "Something else",
    ],
    required: true,
  },
  { fieldId: "crmDetail", label: "If you named one, which and how long?", type: "text" },
  {
    fieldId: "customerList",
    label: "Your customer list",
    help:
      "Everyone who has ever bought or enquired. Export it however it comes out — a CSV, a " +
      "spreadsheet, a screenshot of your contacts. Names you already paid for are the fastest money " +
      "in the whole engagement, and most people are sitting on more of them than they think.",
    type: "file",
  },

  // ── E. SOCIAL ──────────────────────────────────────────────────────────────────────────────
  {
    fieldId: "socialPlatforms",
    label: "Which social accounts exist? Tick everything, even the abandoned ones.",
    help:
      "Nothing is a fine answer. We are not judging the accounts — we are deciding which ones get " +
      "pointed at the new site and which ones we leave alone.",
    type: "multi",
    options: ["Facebook page", "Instagram", "LinkedIn", "YouTube", "TikTok", "X / Twitter", "Pinterest", "Nextdoor", "None of these"],
  },
  { fieldId: "socialLinks", label: "Paste the links to the ones that matter", type: "textarea", placeholder: "facebook.com/…\ninstagram.com/…" },
  {
    fieldId: "adAccounts",
    label: "Have you ever run paid ads?",
    help: "If there is an old Meta or Google ad account, it usually still holds the audience and the history — worth recovering rather than starting cold.",
    type: "choice",
    options: ["Never", "Facebook / Instagram ads", "Google ads", "Both", "Someone ran them for me and I do not know what happened to the account"],
  },

  // ── F. REVIEWS ─────────────────────────────────────────────────────────────────────────────
  {
    fieldId: "reviewsToday",
    label: "How do you get reviews at the moment?",
    help: "Almost everyone says 'when I remember'. That is the honest answer and it is the one we are here to fix.",
    type: "choice",
    options: ["I do not ask", "I ask when I remember", "I have a system that asks automatically"],
  },

  // ── G. PAYMENTS ────────────────────────────────────────────────────────────────────────────
  {
    fieldId: "payments",
    label: "How do you take money today?",
    help: "It decides what we can wire the booking and the coaching platform into without you changing banks.",
    type: "multi",
    options: ["Cash / cheque", "Card reader in person", "Stripe", "Square", "PayPal", "Invoices by email", "QuickBooks", "Something else"],
  },

  // ── H. THE COACHING SIDE — only if they are building one ───────────────────────────────────
  {
    fieldId: "hasProgram",
    label: "Are you running, or planning, a course, membership or coaching program?",
    help: "If not, say no and skip the next few — this whole section only applies to people selling what they know.",
    type: "choice",
    options: ["No", "Planning one", "Yes, running it now"],
    required: true,
  },
  {
    fieldId: "programPlatform",
    label: "Where does it live today?",
    help: "Skool, Kajabi, Teachable, a Facebook group, a shared Drive folder, nowhere yet. A Facebook group you do not own is the most common answer and the one worth moving.",
    type: "text",
  },
  { fieldId: "programOffer", label: "What is the program and what does it cost?", help: "In your words. The price matters because it sets what the funnel around it has to do.", type: "textarea" },
  { fieldId: "programMaterials", label: "Upload whatever exists of it", help: "Slides, a curriculum, recorded calls, a rough outline on a napkin. Half-finished is normal.", type: "file" },
  { fieldId: "emailList", label: "Do you have an email list, and where?", help: "Mailchimp, ConvertKit, a spreadsheet, the contacts in your phone. Size does not matter here — ownership does.", type: "text" },

  // ── I. BRAND ───────────────────────────────────────────────────────────────────────────────
  {
    fieldId: "logo",
    label: "Your logo, in the best quality you have",
    help:
      "If someone designed it, ask them for the original file — a version off your website is a " +
      "photograph of a logo, not the logo. If you have never had one, say so; that is a job, not a problem.",
    type: "file",
  },
  { fieldId: "brandColors", label: "Brand colours and fonts, if they were ever decided", type: "text", placeholder: "Navy and gold. Or: nobody ever decided." },
  {
    fieldId: "photos",
    label: "Photos of your own work, your team, your place",
    help:
      "Ten or so is plenty to start. Straight off your phone is fine — we resize and clean them up " +
      "at our end. Real photos of your own work beat anything we could buy, every time.",
    type: "photos",
  },
  { fieldId: "video", label: "Any video at all?", help: "Phone footage counts. A wide clip cannot be cropped into a phone-shaped one, so if you are shooting new material, shoot it upright as well.", type: "file" },

  // ── J. THE MACHINES — nobody else asks this, and it changes the proposal ────────────────────
  {
    fieldId: "computer",
    label: "What laptop or desktop do you actually work on?",
    help:
      "We are going to install things you use every day, and some of it behaves differently on a Mac " +
      "than on a Windows machine. Easier to plan around your setup now than to hand you something " +
      "that fights it.",
    type: "choice",
    options: ["Mac laptop", "Mac desktop / iMac", "Windows laptop", "Windows desktop", "Chromebook", "I mostly use my phone", "A mix"],
    required: true,
  },
  {
    fieldId: "phoneDevice",
    label: "And your phone?",
    help: "The apps differ, the notifications differ, and how a booking reaches you differs. It is a thirty-second question that saves a support call.",
    type: "choice",
    options: ["iPhone", "Android", "Both"],
    required: true,
  },
  { fieldId: "techComfort", label: "How do you feel about all this?", help: "There is no wrong answer and it changes how we hand things over, not what we build.", type: "choice", options: ["I am fine with technology", "I get by", "I would rather never touch it — just make it work"] },

  // ── K. THE PEOPLE ──────────────────────────────────────────────────────────────────────────
  {
    fieldId: "whoElse",
    label: "Who else touches any of this?",
    help: "An office manager, a nephew who built the site, an agency still running your ads. We need to know who we will be coordinating with — or replacing.",
    type: "textarea",
  },
  { fieldId: "whoAnswers", label: "Who answers the phone and the messages today?", help: "This is the seat we are most often filling, so it helps to know whether it is you at nine at night.", type: "text" },

  // ── L. IN THEIR WORDS ──────────────────────────────────────────────────────────────────────
  { fieldId: "whyYou", label: "Why do customers pick you over the other guy?", help: "In your own words. Do not polish it — I would rather have how you would say it out loud.", type: "textarea", required: true },
  { fieldId: "biggestGap", label: "What is the one thing that, if it just worked, would change your month?", type: "textarea" },
  { fieldId: "anythingElse", label: "Anything else we should know?", type: "textarea" },
];

/**
 * The built-in record. Registered alongside the website onboarding form, so it shows up in the
 * library, is editable on screen, and anything saved for it merges over this code copy.
 */
export const SYSTEMS_ONBOARDING_FORM: FormDef = {
  id: SYSTEMS_ONBOARDING_FORM_ID,
  name: "Systems onboarding — the full audit",
  kind: "builtin",
  description:
    "The A-to-Z survey for a website + GoHighLevel + community engagement. Lists everything a client " +
    "with zero assets would need; `satisfiedBy` removes whatever we already know, and whatever comes " +
    "back empty is the work order.",
  fields: SYSTEMS_ONBOARDING_FIELDS,
  buttonLabel: "Send it in",
  note: SYSTEMS_INTAKE_INTRO,
  successHeading: "That is everything — thank you.",
  successBody:
    "Now we know exactly what you have and what is missing, which means the plan we come back with " +
    "is built on your actual setup rather than a guess. Nothing you left blank is a problem; the " +
    "blanks are simply the list of what we build first.",
  // ⛔ ONE QUESTION PER SCREEN, AND IT IS NOT OPTIONAL AT THIS LENGTH. Thirty-five questions on one
  // page is a form nobody finishes; thirty-five screens with a reason on each is a conversation.
  oneQuestionPerScreen: true,
};
