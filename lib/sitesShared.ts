// Website TYPES + CONSTANTS only — no storage, safe to import in the browser.
// Split from ./sites for the same reason brandShared is split from brand: the editor is a client
// component, and importing the storage module drags the redis client into the browser bundle.

export type SiteKind = "sjc" | "client" | "template";

/**
 * The facts about the business that owns a website.
 *
 * These live HERE, once per site, instead of being typed into blocks — which is the difference
 * between a template and a copy of somebody's website. Duplicating a page used to carry the
 * previous owner's phone number with it, because the digits were sitting inside a Text block.
 * Blocks reference these; the site record is the only place they exist.
 */
export type BusinessFacts = {
  name: string;
  /**
   * WHERE A HAPPY CUSTOMER IS SENT TO LEAVE A REVIEW — this business's own Google link.
   *
   * ⚠️ IT LIVES HERE BECAUSE IT IS A DESTINATION, AND THE FORM LIBRARY MUST NOT HOLD ONE.
   * lib/formsShared states the invariant plainly: a form carries QUESTIONS, never a destination,
   * "because there is nothing here to carry, copying a form cannot carry one client's destination
   * onto another client's site."
   *
   * `altSuccess.buttonUrl` was the exception that broke it. Forms are live POINTERS — several sites
   * share one library form — so a real URL typed there would hand every one of those businesses'
   * delighted customers to whichever review page got filled in first. The seeded form's own comment
   * says exactly that and leaves it blank, which is a rule enforced by remembering.
   *
   * As a fact on the SITE it resolves per business through `{{business.reviewUrl}}`, the same way
   * the phone number does. One shared form, the right link on every site.
   */
  reviewUrl?: string;
  phone: string;        // dialable, e.g. +12104746252
  phoneDisplay: string; // human, e.g. (210) 474-6252
  email: string;
  address: string;
  hours: string;
};

/** What a link preview and a Google result show. Page-level settings override these. */
export type SiteSeo = {
  /**
   * The headline a shared link shows — a text message, Facebook, LinkedIn — and the browser tab.
   *
   * ⛔ ADDED 2026-08-26 BECAUSE IT WAS ALREADY BEING READ AND COULD NOT BE WRITTEN. `metadataFor`
   * has always preferred this over the site's name, and there was no field for it, so a shared
   * link showed whatever the site was CALLED at import. Steven texted his own site and the card
   * read "SJC LandingSite build".
   */
  title: string;
  businessName: string;
  description: string;
  shareImage: string;
  titleSuffix: string;
  /**
   * The little icon in the browser tab. Blank = the platform default.
   *
   * ⚠️ LIVES WITH THE SHARE PREVIEW, NOT IN A NEW BLOCK. It is the same category of decision as the
   * preview image and the title suffix — how this website identifies itself away from the page —
   * and a fifth home for "how it looks when someone sees it elsewhere" is how a concept ends up
   * editable in five places, which this codebase has already paid for once.
   */
  favicon?: string;
};

/**
 * How long a deleted website is recoverable before it is erased for good.
 *
 * 30 days is the industry default — Google Workspace, Shopify, Mailchimp, Squarespace and
 * GoHighLevel all use it, and it's the standard notice period in hosting contracts. Seven is too
 * short (a client on holiday misses it); ninety means holding a stranger's data for no reason.
 *
 * It is also a re-sign window, not just a courtesy: a client who leaves in a huff and cools off a
 * fortnight later gets switched back on in a minute instead of rebuilt from nothing.
 *
 * What Steven tells a client, in one line:
 *   "If you cancel we keep your site and your leads for 30 days in case you change your mind.
 *    After that it's permanently deleted."
 */
export const RETENTION_DAYS = 30;

/**
 * WHO CAN REACH THIS WEBSITE. A stated fact, not an inference.
 *
 * ⛔ IT USED TO BE INFERRED FROM `domain`, WHICH WAS TWO FACTS IN ONE FIELD: where a site lives,
 * and whether anyone is allowed in. So "no domain" meant draft — except it did not, because a
 * domain-less site is served IN FULL at `<id>-demo.…`, kept out of Google but readable by anybody
 * with the link. The state Steven kept calling "draft" was one the system did not have.
 *
 *   draft      Only you, in the studio. The demo address 404s. THE DEFAULT for everything.
 *   demo       The demo link works and is shareable. Out of Google. No domain of its own.
 *   published  Live on its own domain and indexable. The demo address dies — see lib/host.ts.
 *   archived   Kept indefinitely, reachable by nobody, out of the main grid. NOT a countdown.
 *
 * ⚠️ ARCHIVED IS NOT DELETED, AND THAT IS THE POINT OF IT. Deleting starts a 30-day timer that
 * ends in erasure; archiving ends nothing. Steven, finding his retired site sitting in the bin:
 * *"there was no draft mode… that should be archive."* Work you are finished with is not the same
 * as a mistake you want gone, and giving them one button is how a retired site quietly expires.
 */
export type SiteStatus = "draft" | "demo" | "published" | "archived";

export type Site = {
  id: string;
  name: string;
  kind: SiteKind;
  description?: string;
  /** Gallery card image. */
  logo?: string;
  /**
   * Who can reach it. Absent on a record written before 2026-08-12 — always read it through
   * `statusOf()` so the fallback lives in exactly one place and cannot drift between readers.
   */
  status?: SiteStatus;
  /**
   * SET WHEN THE SITE WAS ARCHIVED. Absent = not archived.
   *
   * Kept as a timestamp rather than only a status so "when did we retire this" survives, the same
   * way `deletedAt` does. Nothing expires it.
   */
  archivedAt?: string;
  /**
   * IS CHLOE ATTACHED TO THIS CLIENT, AND IS SHE ANSWERING?
   *
   * ⚠️ ONE WRITER, MANY VIEWS. The kill switch used to be global, in the cockpit — so pausing one
   * client for nonpayment would have stopped Chloe replying for every paying client at the same
   * time. It has to be per-customer, and the customer is this record.
   *
   * The STUDIO writes this, because this is where a client's Sheet, CRM webhook and lead email are
   * already set. The cockpit and the heartbeat board READ it. Two screens that can both write is
   * how you end up switching her off in one place while she answers somebody's customer from the
   * other.
   *
   * ⚠️ AND THE SWITCH IS ENFORCED WHERE SHE RUNS, not on either screen. Chloe's server checks this
   * before she replies — same rule as the lead-delivery gate: the check belongs at the moment of
   * the action, not at the control. A toggle her server does not consult is a light switch wired
   * to nothing, and you would find out from a customer.
   *
   * `offReason` is written by whoever turned her off, including the automatic nonpayment kill, so
   * a machine's decision and yours land in the same field and the reason is on screen.
   */
  chloe?: { attached: boolean; on: boolean; offReason?: string; changedAt?: string };
  /**
   * SET WHEN THE SITE WAS DELETED. Absent = live.
   *
   * Deleting is deliberately NOT destruction. The site stops serving and leaves the list, and its
   * content sits untouched for RETENTION_DAYS so it can be put back with one click. Only after
   * that is anything actually erased.
   *
   * Steven hesitated over the delete button because it used to be one-way. Making it reversible
   * for a month is what lets him stop being careful — which is the point.
   */
  deletedAt?: string;
  /** The client's own domain, once they have one. Empty = served from the demo URL. */
  domain?: string;
  /**
   * KEEP THIS SITE OUT OF GOOGLE WHILE IT IS BEING BUILT ON ITS REAL DOMAIN.
   *
   * ⛔ "INVISIBLE" USED TO BE INFERRED FROM HAVING NO DOMAIN, and that conflated two different
   * things: where a site lives, and whether the world is allowed in. Point a client's real domain
   * at a half-finished build and it became indexable the same second — the only way to stay
   * hidden was to keep the domain off, which is the opposite of what you want while you finish it.
   *
   * Every build wants this gap: domain pointed, world not yet let in. Launch day is unticking one
   * box, not a DNS change.
   *
   * ⚠️ Default off, so nothing already built changes. Read alongside `!domain` everywhere that
   * asks "is this public?" — see lib/publicSitePage, app/robots.ts, app/sitemap.ts.
   */
  holdIndexing?: boolean;
  /**
   * WHERE THIS WEBSITE'S LEADS GO.
   *
   * ⚠️ THE ONE THAT ENDS RELATIONSHIPS. Every lead form used to post to one endpoint that fed
   * SJC's own intake sheet, with the site name riding along as a text label. Sell a site with that
   * still true and the owner's enquiries land in Steven's pile instead of theirs — they find out
   * when a customer asks why nobody called back.
   *
   * Blank = the lead stays in SJC's intake (correct for a demo, and for SJC's own pages).
   */
  leadEmail?: string;
  /**
   * WHO MAY SIGN IN AND EDIT THIS WEBSITE. Lower-cased addresses; a magic link to any of them opens
   * this site and nothing else.
   *
   * ⛔ DELIBERATELY NOT `leadEmail`. It is tempting to reuse it — it is usually the same person —
   * and it would be wrong twice over. Where a lead GOES is a delivery setting a client changes at
   * will, sometimes to a shared inbox, an assistant, or a CRM address nobody reads; who may EDIT
   * is a permission. Wiring the two together means changing where enquiries land silently hands
   * or revokes access to the website, and the screen gives no hint that it did.
   *
   * Absent or empty means nobody but the owner — which is the right default for every site Steven
   * builds before a client is invited to it.
   */
  ownerEmails?: string[];
  /**
   * WHAT ADDRESS THE OWNER'S ALERT IS SENT *FROM* — the part after the @.
   *
   * Almost always blank, and blank is correct: it falls back to LEAD_FROM, then to the one
   * verified sending domain. What the client actually reads in his inbox is the DISPLAY NAME,
   * which is already his own business name (see leadDelivery.ts) — so one domain serves every
   * client without any of them seeing another's brand.
   *
   * ⚠️ THE DOMAIN HERE MUST BE VERIFIED IN RESEND OR THE SEND FAILS OUTRIGHT. This exists so a
   * site belonging to a DIFFERENT brand (Consulting, Barchetti) can send under its own domain
   * once that domain is verified — a field to fill instead of a code change. Resend's free plan
   * holds exactly one domain, so today there is only one legal value and this stays empty.
   *
   * There is deliberately no UI field for it yet; adding one is cheap when a second brand needs it.
   */
  leadFrom?: string;
  /**
   * THIS CLIENT'S OWN GOOGLE SHEET — its spreadsheet id.
   *
   * Each client gets one sheet, which Steven owns and shares with them view-only: their leads on
   * one tab, what they told us at onboarding on another. It is theirs to look at any time, and
   * it is the renewal proof and the "I never got that lead" safety net.
   *
   * ⚠️ NOT SJC's own intake sheet. Steven's three-tab operations sheet is for HIS three forms.
   * A client's data never lands there — see scripts/apply-webhook.gs, which says so and was
   * nearly overruled on 2026-07-30.
   *
   * An ID, not a webhook. The first version stored a per-client Apps Script URL, which meant
   * deploying and authorizing a script for every customer. One script now writes to every sheet
   * by id (lib/sheets.ts), so this is just which spreadsheet is hers.
   *
   * Blank = no sheet yet. The intake copy logs and moves on; nothing fails, because the durable
   * store holds the answers regardless.
   */
  sheetId?: string;
  /**
   * THE THIRD LEAD DESTINATION — her GoHighLevel inbound webhook.
   *
   * The $97 offer says "every lead in one place — calls, texts and website forms in a single
   * inbox." Calls and texts arrive in GHL on their own. Website forms are OURS, and until this
   * existed they went to an email and a spreadsheet and nowhere else — so the one lead source we
   * actually built was the one missing from the inbox we sold him. He'd find out when a lead he
   * never saw turned up in a sheet he never opens.
   *
   * Blank = no GHL for this business, which is correct for a demo and for the $50 tier (website
   * plus email plus sheet, no CRM). Blank is not an error.
   *
   * ⚠️ This does not make us a CRM. We WRITE a submission and forget it. Nothing here ever reads
   * a contact back — GHL stays the truth.
   */
  ghlWebhookUrl?: string;
  /**
   * EVERY VENDOR ACCOUNT ATTACHED TO THIS BUSINESS — the join key for the whole operation.
   *
   * A client is a row here, a sub-account in GoHighLevel, a customer in Stripe, a number at
   * Twilio and a domain at a registrar. Before this field the only vendor joined to a site was
   * her Google Sheet; everything else was connected by Steven remembering it. That is what makes
   * offboarding a feat of recall instead of a derived checklist, and it is why a per-customer
   * health board could not be assembled at all — nothing said which subscription was hers.
   *
   * ⚠️ A MAP, NOT NAMED FIELDS, and that is the whole design. Adding a vendor has to be a new key
   * and nothing else — no type change, no migration, no editor rewrite. The moment this becomes
   * fifteen optional properties, vendor sixteen means touching five files and the modularity is
   * gone.
   *
   * Identities only. Where leads GO lives above (leadEmail, sheetId, ghlWebhookUrl) because that
   * group answers a different question and earns a different badge on the card.
   */
  accounts?: SiteAccounts;
  business: BusinessFacts;
  seo: SiteSeo;
};

/**
 * Vendor account identifiers for one business, keyed by vendor.
 *
 * Open on purpose — an unrecognised key stores and renders exactly like a known one, so a vendor
 * nobody has thought of yet costs nothing to record.
 */
export type SiteAccounts = Record<string, string>;

/**
 * Labels for the vendors we already know about. Purely cosmetic: a key missing from this list is
 * still stored, still shown and still offboarded — it just renders under its own name.
 */
export const ACCOUNT_LABELS: Record<string, string> = {
  ghlLocationId: "GoHighLevel sub-account",
  stripeCustomerId: "Stripe customer",
  stripeSubscriptionId: "Stripe subscription",
  twilioNumber: "Twilio number",
  twilioA2pBrandId: "Twilio A2P brand",
  registrarAccount: "Domain registrar",
  metaAdAccountId: "Meta ad account",
  metaPixelId: "Meta pixel",
  gbpLocation: "Google Business Profile",
  anthropicKeyRef: "Anthropic key (1Password ref)",
  vercelProject: "Vercel project",
};

/**
 * THIS SITE'S STATE — the only place the fallback for an unset `status` lives.
 *
 * ⚠️ NO READER MAY TOUCH `site.status` DIRECTLY. An absent value is a real case (every record
 * written before 2026-08-12), and a fallback repeated at each call site is a fallback that drifts
 * — which is how `domain` came to mean three different things in three different files.
 *
 * The derivation is deliberately conservative: a site with its own domain was already serving the
 * world, so it is `published`; everything else is `draft`, which is the tighter of the two. A
 * domain-less site WAS reachable at its demo address, so this narrows what the world can see
 * rather than widening it — and Steven's own reading of his library was that all of it should be
 * draft anyway.
 */
export function statusOf(site: Pick<Site, "status" | "domain" | "archivedAt">): SiteStatus {
  if (site.status) return site.status;
  if (site.archivedAt) return "archived";
  return site.domain?.trim() ? "published" : "draft";
}

/**
 * What each surface needs to know, derived from the state in ONE place.
 *
 *   onDomain   serve this site at its own domain
 *   onDemo     serve it at `<id>-demo.<studio host>`
 *   indexable  let Google in
 *
 * ⚠️ `noindex` REMAINS A SEPARATE AXIS ON TOP OF THIS. Publishing decides whether the world can
 * REACH the site; indexing decides whether Google is invited. A site live on its own domain that
 * is still being finished wants the first without the second, and folding them into one enum is
 * what made `holdIndexing` necessary as an override before a line of it was written.
 */
export function reachability(site: Pick<Site, "status" | "domain" | "archivedAt" | "holdIndexing">): {
  status: SiteStatus;
  onDomain: boolean;
  onDemo: boolean;
  indexable: boolean;
} {
  const status = statusOf(site);
  const published = status === "published";
  return {
    status,
    // A published site needs a domain to be served at one. Published with the domain not yet
    // pointed is the handover window: nothing serves there until DNS resolves, and the demo link
    // stays alive so the prospect is not left with two dead addresses.
    onDomain: published && !!site.domain?.trim(),
    onDemo: status === "demo" || (published && !site.domain?.trim()),
    indexable: published && !!site.domain?.trim() && !site.holdIndexing,
  };
}

/**
 * WHERE THIS SITE'S LEADS GO — and whether any of it belongs to somebody else.
 *
 * ⚠️ ONE IMPLEMENTATION, TWO SURFACES. The heartbeat board asks "is this joint healthy" and the
 * Design Library card asks "is this wired up" — the same three fields answering two questions. If
 * the card computed its own version they would drift the first time a destination changed, and the
 * screen you happened to be looking at would decide what you believed.
 *
 * Lives in sitesShared rather than lib/checks so the gallery (a client component) and the board (a
 * server sweep) can both call it.
 *
 * ⛔ A COLLISION IS THE SERIOUS ONE. Missing means a client is owed something they have not got —
 * amber. SHARED means their customer's enquiry arrives in another client's inbox, which is the
 * cross-tenant failure this whole layer exists to prevent. Red, on sight.
 */
export function leadWiring(
  site: Pick<Site, "id" | "kind" | "leadEmail" | "sheetId" | "ghlWebhookUrl">,
  all: Pick<Site, "id" | "kind" | "name" | "deletedAt" | "leadEmail" | "sheetId" | "ghlWebhookUrl">[]
): {
  hasEmail: boolean;
  hasSheet: boolean;
  hasGhl: boolean;
  /**
   * ⛔ THE ONE THAT ENDS A RETAINER. True when SOMEONE gets told a lead arrived.
   *
   * This is `notifiedSomeone` from lib/leadDelivery, lifted so the board and the delivery path
   * cannot grade the same site differently. A sheet is a RECORD, not a notification: a site with a
   * sheet but no inbox and no CRM files every enquiry perfectly and tells nobody. Verified live on
   * 2026-08-06 — a Marbleford enquiry landed in the sheet and not one person was told.
   *
   * So it is deliberately NOT `missing.length === 0`. Missing a sheet is a gap. Missing this is
   * silence, and the two must never be the same colour on a board.
   */
  notifiesSomeone: boolean;
  missing: string[];
  collidesWith: string | null;
} {
  const email = (site.leadEmail || "").trim().toLowerCase();
  const ghl = (site.ghlWebhookUrl || "").trim();
  const sheet = (site.sheetId || "").trim();

  const missing: string[] = [];
  if (!email) missing.push("no lead email");
  if (!sheet) missing.push("no sheet");
  if (!ghl) missing.push("no CRM webhook");

  const others = all.filter((s) => s.id !== site.id && s.kind === "client" && !s.deletedAt);
  // Ternaries rather than `email && find(...)`: `&&` on an empty string yields "" rather than
  // undefined, and a collision variable that can be a string is a collision variable that lies.
  const clash =
    (email ? others.find((s) => (s.leadEmail || "").trim().toLowerCase() === email) : undefined) ||
    (ghl ? others.find((s) => (s.ghlWebhookUrl || "").trim() === ghl) : undefined) ||
    (sheet ? others.find((s) => (s.sheetId || "").trim() === sheet) : undefined);

  return {
    hasEmail: !!email,
    hasSheet: !!sheet,
    hasGhl: !!ghl,
    // GHL counts as notified: for a $97 client that inbox IS the notification. Same rule as
    // leadDelivery's runtime check, which is the point of putting it here.
    notifiesSomeone: !!email || !!ghl,
    missing,
    collidesWith: clash ? clash.name : null,
  };
}

export const emptyBusiness = (): BusinessFacts => ({
  name: "",
  phone: "",
  phoneDisplay: "",
  email: "",
  address: "",
  hours: "",
});

/** Days left before a deleted site is erased. Negative means it's overdue for the sweep. */
export function daysLeft(site: Pick<Site, "deletedAt">, now = Date.now()): number | null {
  if (!site.deletedAt) return null;
  const gone = new Date(site.deletedAt).getTime() + RETENTION_DAYS * 86_400_000;
  return Math.ceil((gone - now) / 86_400_000);
}

export const emptySeo = (): SiteSeo => ({
  title: "",
  businessName: "",
  description: "",
  shareImage: "",
  titleSuffix: "",
});

// A site is served at /<id>, so its id can never collide with a real Next.js route folder — a
// hardcoded route wins precedence and would silently shadow the whole website.
export const RESERVED_SITE_IDS = [
  "about", "api", "apply", "edit", "faqs", "guest", "podcast", "share", "websites",
  "home", "nav", "footer", "brand", "import", "new", "sites", "admin",
  // The form library lives at /edit/forms, a static segment that shadows /edit/<site>. A site
  // with this id would be created happily and then be permanently unopenable.
  "forms",
  // The invoice book lives at /edit/invoices, same static-segment reason as "forms".
  "invoices",
  // The dial board lives at /edit/dial, same static-segment reason as "forms".
  "dial",
  // The client intake link lives at /start/<id>.
  "start",
  // A customer's copy of an invoice lives at /i/<publicId>. Short on purpose — it gets pasted into
  // an email — which is exactly why nothing else may ever claim it.
  "i",
];
