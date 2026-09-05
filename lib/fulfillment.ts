// THE FULFILMENT FRAMEWORK — what gets built, in what order, and what each step is waiting on.
//
// ⛔ WHY THIS EXISTS. The intake tells us what a client HAS. Nothing until now said what we then
// DO, so every job routed back through Steven for the same forty judgement calls: are we migrating
// the email, does their phone run the app, which social accounts point at the new site. Steven,
// 2026-09-04, on why the depth of the intake was worth it: *"The next thing you know, I will be
// hiring some virtual assistants to help with that back end and fulfillment work."*
//
// ⭐ THE WHOLE IDEA IN ONE LINE: THE GAPS IN THE INTAKE ARE THE WORK ORDER. A deliverable declares
// which intake answers it needs; `workOrderFor` sorts the list into what can start this morning and
// what is waiting on the client, and names exactly what is missing. Nobody decides anything.
//
// ⚠️ THIS IS THE FRAME, NOT THE FINISHED RUNBOOK. Each step's `how` is one line — enough for
// someone who has done it before. The full click-by-click SOPs hang off these ids as they get
// written, and the ids are the stable thing: `web.domain`, `crm.a2p`, `community.launch`.
//
// ⛔ NOTHING HERE DECIDES WHETHER TO DO THE WORK. It decides ORDER and READINESS. Whether a client
// is worth taking is a conversation, and no list replaces it.
import type { Site } from "./sitesShared";

/** The three things SJC sells as a build. A client may buy one, two or all three. */
export type Product = "website" | "crm" | "community";

export type Deliverable = {
  /** Stable forever — SOPs, checklists and spreadsheet columns hang off this. */
  id: string;
  product: Product;
  /** Ordered phases within a product. Everything in phase 1 clears before phase 2 starts. */
  phase: 1 | 2 | 3;
  title: string;
  /** One line, written for someone who has done it before. The SOP is the expansion of this. */
  how: string;
  /**
   * Intake `fieldId`s this step cannot begin without. An empty list means it never waits on the
   * client — those are the steps a VA can start the morning the deposit lands.
   */
  needs: string[];
  /** Who does it. `client` steps are chase items, not work items. */
  owner: "sjc" | "client";
};

export const DELIVERABLES: Deliverable[] = [
  // ── WEBSITE ────────────────────────────────────────────────────────────────────────────────
  { id: "web.domain", title: "Get into the domain registrar", product: "website", phase: 1, owner: "client", needs: ["domainRegistrar"],
    how: "Get into the registrar. If they cannot, that is the first job — everything downstream waits on DNS." },
  { id: "web.assets", title: "Prepare logo, photos and favicon", product: "website", phase: 1, owner: "sjc", needs: ["logo", "photos"],
    how: "Run every photo through the pipeline (2000px, WebP, EXIF stripped). Logo at full quality, favicon cut from it." },
  { id: "web.copy", title: "Write the copy from their own words", product: "website", phase: 1, owner: "sjc", needs: ["whyYou", "businessName"],
    how: "Their words from the intake, not ours. `whyYou` is the spine of the home page." },
  { id: "web.build", title: "Build or tune the site", product: "website", phase: 2, owner: "sjc", needs: ["currentSite"],
    how: "Import the design, lift chrome global, fill business tokens. Tune up rather than replace where the answer said 'decent'." },
  { id: "web.seo", title: "Titles, share image and local schema", product: "website", phase: 2, owner: "sjc", needs: ["gbpUrl"],
    how: "Title, description, share image and LocalBusiness schema off the Google listing." },
  { id: "web.forms", title: "Wire the lead form and test it", product: "website", phase: 2, owner: "sjc", needs: [],
    how: "Lead form wired to their destination. ⛔ Submit a real test lead and confirm it lands before go-live." },
  { id: "web.launch", title: "Point the domain and go live", product: "website", phase: 3, owner: "sjc", needs: ["domainRegistrar"],
    how: "Point the domain, verify apex and www, retire the demo host — a demo URL outliving the real site is one more address saying the same thing worse." },

  // ── CRM / GOHIGHLEVEL ──────────────────────────────────────────────────────────────────────
  { id: "crm.email", title: "Settle the email provider", product: "crm", phase: 1, owner: "client", needs: ["emailProvider"],
    how: "Workspace connects to calendar, records and review requests with nothing in between. Anything else needs a workaround — decide which, here, before building on it." },
  { id: "crm.account", title: "Stand up the CRM account", product: "crm", phase: 1, owner: "sjc", needs: ["emailProvider"],
    how: "Sub-account stood up, users invited on the email they actually read." },
  { id: "crm.number", title: "Provision the phone number", product: "crm", phase: 1, owner: "sjc", needs: ["phone"],
    how: "Number provisioned. ⚠️ Start this first — A2P registration is the longest wait in the whole build and everything conversational sits behind it." },
  { id: "crm.a2p", title: "A2P brand and campaign registration", product: "crm", phase: 1, owner: "client", needs: ["businessName", "address"],
    how: "A2P brand and campaign. Needs their legal entity details; it is the step most likely to bounce back for a detail." },
  { id: "crm.import", title: "Import and tag the customer list", product: "crm", phase: 2, owner: "sjc", needs: ["customerList"],
    how: "Clean and import the list. Tag by source so reactivation can be measured against it later." },
  { id: "crm.calendar", title: "Calendar and availability", product: "crm", phase: 2, owner: "sjc", needs: ["hours"],
    how: "Calendar, availability and buffers matching the hours they gave, not the hours we assume." },
  { id: "crm.payments", title: "Connect their payment processor", product: "crm", phase: 2, owner: "sjc", needs: ["payments"],
    how: "Connect what they already take money with. Do not move them to a new processor as part of a website job." },
  { id: "crm.workflows", title: "The four standard workflows", product: "crm", phase: 2, owner: "sjc", needs: [],
    how: "Speed to lead, follow-up, review request, reactivation. The four that exist on every build." },
  { id: "crm.ai", title: "Tune the AI employee to their business", product: "crm", phase: 3, owner: "sjc", needs: ["whyYou"],
    // ⛔ NOT `programOffer` — that is a coaching-only field, and requiring it blocked this step
    // forever for every client who does not sell a program. Caught the first time the work order
    // was run against a realistic website+CRM client. A prerequisite must be something EVERY buyer
    // of that product answers, or the step never unblocks and nobody can see why.
    how: "Tune the AI employee on their offers, prices and objections. This is the 20% that is bespoke and the reason it cannot be handed to a stranger." },
  { id: "crm.handover", title: "Handover on the devices they actually use", product: "crm", phase: 3, owner: "sjc", needs: ["computer", "phoneDevice"],
    how: "Mobile app installed on the phone they actually carry, notifications proven, one walkthrough recorded so it is rewatchable." },

  // ── COMMUNITY / SKOOL ──────────────────────────────────────────────────────────────────────
  { id: "community.decide", title: "Confirm there is a program at all", product: "community", phase: 1, owner: "client", needs: ["hasProgram"],
    how: "Only runs if they answered planning or running. A 'no' closes this track cleanly rather than leaving it half-built." },
  { id: "community.space", title: "Create and brand the space", product: "community", phase: 1, owner: "sjc", needs: ["businessName", "logo"],
    how: "Space created, branded, about page written from their own words." },
  { id: "community.curriculum", title: "Collect the program materials", product: "community", phase: 2, owner: "client", needs: ["programMaterials"],
    how: "Whatever exists, however rough. Half-finished is normal and is still the input." },
  { id: "community.build", title: "Lay the program out as a course", product: "community", phase: 2, owner: "sjc", needs: ["programMaterials", "programOffer"],
    how: "Modules laid out in order, content uploaded, the path through it obvious to somebody who joined this morning." },
  { id: "community.join", title: "Wire payment to membership and access", product: "community", phase: 3, owner: "sjc", needs: ["payments"],
    how: "⭐ THE STEP NOBODY DOES: payment → member created → correct course unlocked, with no human typing anybody in at midnight." },
  { id: "community.migrate", title: "Migrate the people they own", product: "community", phase: 3, owner: "sjc", needs: ["programPlatform"],
    how: "If there is a Facebook group, move the people they own and leave the ones they do not. Nothing is deleted on the old platform." },
];

export type WorkOrder = {
  ready: Deliverable[];
  /** Waiting, and on exactly what — these are the chase list, in the client's language. */
  blocked: { item: Deliverable; missing: string[] }[];
};

/**
 * Sort a client's build into what can start and what is waiting.
 *
 * `answers` is the stored intake record keyed by `fieldId`. A field the SITE RECORD already answers
 * counts as answered — the same `satisfiedBy` idea the form uses, so we never chase a client for
 * something we prospected off their Google listing.
 */
export function workOrderFor(
  products: Product[],
  answers: Record<string, unknown>,
  site?: Site | null
): WorkOrder {
  const answered = (id: string) => {
    const v = answers?.[id];
    if (Array.isArray(v) ? v.length : String(v ?? "").trim()) return true;
    // The handful the site record can satisfy on its own.
    const fromSite: Record<string, unknown> = {
      businessName: site?.business?.name,
      phone: site?.business?.phoneDisplay,
      address: site?.business?.address,
      hours: site?.business?.hours,
    };
    return Boolean(String(fromSite[id] ?? "").trim());
  };

  const ready: Deliverable[] = [];
  const blocked: WorkOrder["blocked"] = [];
  for (const d of DELIVERABLES) {
    if (!products.includes(d.product)) continue;
    const missing = d.needs.filter((n) => !answered(n));
    if (missing.length) blocked.push({ item: d, missing });
    else ready.push(d);
  }
  // Phase order, then product, so the list reads as a sequence rather than a pile.
  const order = (a: Deliverable, b: Deliverable) => a.phase - b.phase || a.product.localeCompare(b.product);
  ready.sort(order);
  blocked.sort((a, b) => order(a.item, b.item));
  return { ready, blocked };
}

/** Every deliverable for a product, for writing the SOP that expands each `how` into steps. */
export const forProduct = (p: Product) => DELIVERABLES.filter((d) => d.product === p);
