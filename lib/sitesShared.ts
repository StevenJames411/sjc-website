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

export type Site = {
  id: string;
  name: string;
  kind: SiteKind;
  description?: string;
  /** Gallery card image. */
  logo?: string;
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
];
