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
  business: BusinessFacts;
  seo: SiteSeo;
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
  // The client intake link lives at /start/<id>.
  "start",
];
