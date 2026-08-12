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
  phone: string;        // dialable, e.g. +12104746252
  phoneDisplay: string; // human, e.g. (210) 474-6252
  email: string;
  address: string;
  hours: string;
};

/** What a link preview and a Google result show. Page-level settings override these. */
export type SiteSeo = {
  businessName: string;
  description: string;
  shareImage: string;
  titleSuffix: string;
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

export type Site = {
  id: string;
  name: string;
  kind: SiteKind;
  description?: string;
  /** Gallery card image. */
  logo?: string;
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
