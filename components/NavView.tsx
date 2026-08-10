"use client";

import { useState } from "react";
import Icon from "@/components/blocks/Icon";
// Shared with FooterView — one definition of the three contact buttons, so the menu and the
// footer cannot drift apart again.
import ContactButtons, { CONTACT_PILL_BASE, PILL_SIZE, ICON_SIZE } from "@/components/ContactButtons";
import { resolveColor, resolveColorOr, tint } from "@/lib/brandColor";

const LOGO_URL =
  "https://ddhmhtqvn5lepkpr.public.blob.vercel-storage.com/uploads/1785815543979-logo.png";

// `note` is the one-line description shown under a link in MENU mode. A horizontal bar has no
// room for it and a hover tooltip is invisible on a phone — the overlay is the first place this
// site has ever had space to explain a link instead of just naming it.
export type NavLink = { label: string; target: string; fontSize?: number; color?: string; newTab?: boolean; note?: string; group?: string };
export type NavViewProps = {
  brandName?: string;
  brandHref?: string;
  brandSize?: number;
  tagline?: string;
  taglineColor?: string;
  taglineSize?: number;
  links?: NavLink[];
  ctaLabel?: string;
  ctaHref?: string;
  ctaNewTab?: boolean;
  // The header band's colour. SJC navy was hardcoded here — which meant every client site built
  // on this template shipped wearing SJC's colours. Defaults to the old value, so nothing that
  // already exists moves.
  background?: string;
  // The Book/Call button's colour. Was welded to SJC blue via a CSS var, which put our brand on
  // every client's most-clicked element. Blank = the old SJC blue.
  ctaColor?: string;
  // Brand text + link colour. White reads on navy; a light header needs dark text or the nav
  // vanishes into the background.
  foreground?: string;
  // Hide the logo on a client site that isn't SJC.
  showLogo?: boolean;
  // A client's mark in place of the SJC logo image — a paw for a groomer, a wrench for a
  // contractor. Sits in a soft tinted square, which is what makes a plain wordmark read as
  // a brand rather than as text.
  brandIcon?: string;
  brandIconColor?: string;
  // ⛔ TWO NAV SHAPES, AND THE DEFAULT NEVER MOVES.
  //
  // "bar"  = links across the top, collapsing to a hamburger on narrow screens. The original.
  // "menu" = a Menu button at EVERY width, opening a full-screen overlay.
  //
  // A bar has a hard ceiling: its breakpoint moved three times in one evening (1000 → 1200 →
  // 1340) purely because labels got longer, and two more links were still queued. The overlay
  // has no ceiling, shows each link WITH its description, and leaves the full canvas to the
  // photography.
  //
  // ⚠️ Default stays "bar" deliberately. This component renders the LIVE site's header on every
  // page; flipping the default would restyle a published site as a side effect of adding an
  // option. Steven turns it on per nav, when he's looking at it.
  menuMode?: string;
  // Shown inside the overlay only — never in the bar. Nobody books before they know who you are,
  // and a phone number in the bar is the first thing to break on a narrow screen.
  menuPhone?: string;
  menuPhoneDisplay?: string;
  /**
   * The email on the menu's Click to Email button.
   *
   * ⛔ The overlay used to offer a phone number and nothing else — no text, no email — while the
   * footer offered all three. Same actions, two implementations, and they drifted until Steven
   * asked why they didn't match. Both surfaces now render components/ContactButtons.
   */
  menuEmail?: string;
  /**
   * Real artwork for the menu tiles — one URL each, blank = the drawn glyph.
   * ⛔ Steven already owns these (the glossy calendar and phone on alamoslimclinic.com, hosted
   * on his Landing Site AI account). They are fields rather than code so he can swap them per
   * site without a deploy — and so a client build never inherits SJC's artwork by default.
   */
  ctaIcon?: string;
  menuIconCall?: string;
  menuIconText?: string;
  menuIconEmail?: string;
  // ── THE BRAND MARK'S SHAPE ───────────────────────────────────────────────────────────────────
  // "" (default) = logo image or icon, then the name in the body sans. Every existing nav.
  // "wordmark"   = no image at all — the name set in the display serif as small-caps, with a
  //                second letterspaced line beneath it. A picture-plus-text lockup and a typeset
  //                wordmark are two different marks; you cannot get the second by hiding the
  //                first, because what makes it read is the SERIF and the tracking, not the
  //                absence of an icon.
  brandStyle?: string;
  // Wordmark's second line ("CONSULTING"). Deliberately NOT `tagline` — tagline is the centered
  // who-you-are line in bar mode, and reusing it would mean the same field renders in two
  // unrelated places the moment anyone flips nav style.
  brandLine2?: string;
  brandLine2Color?: string;
  // Faint graph-paper over the header band, same overlay the Section block draws. Blank = off.
  // With it set to the hero's grid colour the bar and the hero read as ONE navy field instead of
  // two stacked rectangles — which is the whole point of putting it here rather than only below.
  bandGrid?: string;
};

// "Open in a new tab" is set per link in the builder. rel="noopener noreferrer" rides along
// because a new-tab link without it hands the opened page a handle back to ours.
const tabAttrs = (newTab?: boolean) =>
  newTab ? { target: "_blank" as const, rel: "noopener noreferrer" } : {};

// The actual site nav, rendered from props. Used BOTH on the live site (via Nav.tsx, which
// reads the published "nav" block) AND in the builder preview (via the SiteHeader Puck block),
// so what Steven edits at /edit/nav is exactly what ships. Desktop = 3-col grid (brand left,
// tagline centered, links+button right, no overlap); narrow screens collapse to a hamburger.
export default function NavView({
  brandName = "Steven James Consulting",
  // Where the logo + name link to. "/" for the site-wide nav; a standalone sales page points it
  // at ITSELF so clicking the logo doesn't dump the buyer onto a different offer.
  brandHref = "/",
  brandSize = 16,
  tagline = "Your Native AI Implementation Partner",
  // A role, not a hex — a hex default freezes on every nav that never touched the field.
  taglineColor = "secondary",
  taglineSize = 18,
  links = [],
  ctaLabel = "See How It Works",
  ctaHref = "/#at-work",
  ctaNewTab = false,
  background,
  foreground,
  showLogo,
  ctaColor,
  brandIcon,
  brandIconColor,
  menuMode,
  menuPhone,
  menuPhoneDisplay,
  menuEmail,
  ctaIcon,
  menuIconCall,
  menuIconText,
  menuIconEmail,
  brandStyle,
  brandLine2,
  brandLine2Color,
  bandGrid,
}: NavViewProps) {
  const [open, setOpen] = useState(false);
  const linkEls = (links || []).filter((l) => l && l.label);

  // Existing nav documents have none of these saved → undefined → these defaults.
  //
  // ⚠️ ROLES. #1e3a6e was the last thing on the page a palette change couldn't reach: the site
  // went near-black cyan on 2026-08-05 and the header stayed royal navy, sitting on top of every
  // page announcing the old brand.
  //
  // bandHEADER — the bar's own dial, and blank on that role falls back to bandDarker, which is
  // what the header used before the role existed. Three dark surfaces (this bar, the dark page
  // sections, the footer) wanted three different darks; with only two roles, two of them had to
  // share, and every attempt to tune one dragged the other.
  const bg = background || "bandHeader";
  const fg = foreground || "white";
  const logoOn = showLogo !== false;

  // The typeset wordmark. Playfair is already loaded site-wide (app/layout.tsx), so this costs
  // no new font request. `font-variant: small-caps` is what produces the tall-initial / small-rest
  // shape — uppercasing the string instead gives you shouting, not a wordmark.
  const Wordmark = (
    <a href={brandHref || "/"} className="block leading-none" onClick={() => setOpen(false)}>
      <span
        className="block"
        style={{
          fontFamily: "var(--font-playfair), Georgia, serif",
          fontVariant: "small-caps",
          fontWeight: 500,
          letterSpacing: "0.04em",
          fontSize: `${brandSize || 26}px`,
        }}
      >
        {brandName}
      </span>
      {brandLine2 ? (
        <span
          className="mt-1.5 block uppercase"
          style={{
            fontFamily: "var(--font-playfair), Georgia, serif",
            // Tracked out hard and set at roughly half the top line — the two lines have to read
            // as one mark, and equal weight makes them read as two separate words instead.
            letterSpacing: "0.34em",
            fontSize: `${Math.max(9, Math.round((brandSize || 26) * 0.44))}px`,
            color: resolveColorOr(brandLine2Color, "currentColor"),
            opacity: brandLine2Color ? 1 : 0.75,
          }}
        >
          {brandLine2}
        </span>
      ) : null}
    </a>
  );

  const GridOverlay = bandGrid ? (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0"
      style={{
        backgroundImage: `linear-gradient(${resolveColor(bandGrid)} 1px, transparent 1px), linear-gradient(90deg, ${resolveColor(bandGrid)} 1px, transparent 1px)`,
        backgroundSize: "60px 60px",
        opacity: 0.07,
      }}
    />
  ) : null;

  const Brand = String(brandStyle) === "wordmark" ? Wordmark : (
    <a href={brandHref || "/"} className="flex items-center gap-3" onClick={() => setOpen(false)}>
      {brandIcon ? (
        <span
          className="flex h-10 w-10 items-center justify-center rounded-xl"
          style={{ background: tint(brandIconColor, 10, fg), color: resolveColorOr(brandIconColor, fg) }}
        >
          <Icon name={brandIcon} size={22} />
        </span>
      ) : logoOn ? (
        <img src={LOGO_URL} alt="logo" className="h-9 w-9 rounded-full" />
      ) : null}
      <span className="font-semibold tracking-tight" style={{ fontSize: `${brandSize || 16}px` }}>{brandName}</span>
    </a>
  );

  const Tagline = tagline ? (
    <span
      className="whitespace-nowrap font-semibold tracking-tight"
      style={{ color: resolveColorOr(taglineColor, "var(--color-sjc-secondary)"), fontSize: `${taglineSize || 18}px` }}
    >
      {tagline}
    </span>
  ) : null;

  // ── MENU MODE ────────────────────────────────────────────────────────────────────────────────
  // Returned whole rather than woven into the bar below with conditionals. The two shapes share
  // only the brand mark; interleaving them would mean every future change to one has to be
  // reasoned about against the other, which is how the bar's breakpoint kept moving.
  if (String(menuMode) === "menu") {
    // Links can carry a `group` ("The Divisions", "The Company") to split the overlay into
    // columns. No group at all = one column, which is what a small site wants.
    const groups: { title: string; items: NavLink[] }[] = [];
    for (const l of linkEls) {
      const title = l.group || "";
      const found = groups.find((g) => g.title === title);
      if (found) found.items.push(l);
      else groups.push({ title, items: [l] });
    }

    // ⚠️ NOT `relative` — `sticky` and `relative` are both position utilities and the CSS
    // cascade, not the class order, decides which wins; adding it silently unsticks the header.
    // A sticky element is already a positioned ancestor, so the absolute overlay anchors to it
    // as-is. Only the clip is needed.
    return (
      <header
        className={`sticky top-0 z-30 w-full${bandGrid ? " overflow-hidden" : ""}`}
        style={{ backgroundColor: resolveColor(bg) }}
      >
        {GridOverlay}
        <div
          className={`mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4${bandGrid ? " relative z-10" : ""}`}
          style={{ color: resolveColor(fg) }}
        >
          {Brand}
          <button
            type="button"
            aria-label="Open menu"
            aria-expanded={open}
            onClick={() => setOpen(true)}
            className="flex items-center gap-3 border px-4 py-2.5 text-[10.5px] uppercase tracking-[0.22em] transition hover:opacity-80"
            style={{ color: resolveColor(fg), borderColor: "currentColor" }}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M3 6h18M3 12h18M3 18h18" />
            </svg>
            Menu
          </button>
        </div>

        {/* The overlay. Opaque, not translucent — at 98.5% the page ghosted through and the menu
            read as unfinished rather than as a place you had arrived at. */}
        <div
          className="fixed inset-0 z-40 overflow-y-auto transition-opacity duration-300"
          style={{
            backgroundColor: resolveColor(bg),
            opacity: open ? 1 : 0,
            visibility: open ? "visible" : "hidden",
            color: resolveColor(fg),
          }}
        >
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
            {Brand}
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setOpen(false)}
              className="border px-3.5 py-1.5 text-2xl leading-none transition hover:opacity-80"
              style={{ borderColor: "currentColor" }}
            >
              &times;
            </button>
          </div>

          {/* ⛔ max-w-6xl — SAME CANVAS AS THE BAR ABOVE IT. This was max-w-5xl while the overlay's
              own header row (line ~288) and the sticky bar both use max-w-6xl, so ONE screen had
              three different left edges: the wordmark at one, the link columns 87px inward, and the
              close button hard right against a wider container.
              Steven kept reading it as "uncentered" and could not name why — because nothing was
              off-centre; two containers were simply different sizes. Every tile resize before this
              was being made INSIDE a misaligned box, which is why none of them fixed the feeling. */}
          <div className="mx-auto grid max-w-6xl gap-10 px-6 pb-20 pt-4 md:grid-cols-2">
            {groups.map((g, gi) => (
              <div key={gi}>
                {g.title ? (
                  <div
                    className="mb-4 text-[10px] uppercase tracking-[0.3em]"
                    style={{ color: resolveColorOr(taglineColor, "var(--color-sjc-secondary)") }}
                  >
                    {g.title}
                  </div>
                ) : null}
                {g.items.map((l, i) => (
                  <a
                    key={i}
                    href={l.target || "#"}
                    {...tabAttrs(l.newTab)}
                    onClick={() => setOpen(false)}
                    className="block border-t py-4 transition hover:opacity-80"
                    style={{ borderColor: "currentColor", borderTopWidth: 1, opacity: 0.95 }}
                  >
                    <span className="block text-xl md:text-2xl" style={{ fontSize: l.fontSize ? `${l.fontSize}px` : undefined }}>
                      {l.label}
                    </span>
                    {l.note ? <span className="mt-1.5 block text-sm opacity-60">{l.note}</span> : null}
                  </a>
                ))}
              </div>
            ))}

            {/* ⛔ ONE ROW OF FOUR MATCHING PILLS. Steven: "the new book a call CTA button isn't
                shaped the same as the other CTA buttons. It doesn't have the hover like the other
                CTA buttons. And I'm not crazy about how it fits on the page."

                All three were the same mistake: the CTA was a square-cornered, edge-to-edge,
                uppercase letterspaced BAR sitting above three rounded sentence-case pills. Two
                visual languages in one block, and at full width it put a slab of blue across the
                whole overlay with three more blocks under it.

                Now it uses CONTACT_PILL_BASE — the same geometry object the contact buttons use,
                not a copy of it — with its own fill, and sits as the FIRST of four across.
                Priority comes from position and the calendar icon rather than from being a
                different shape. Collapses to a stack on a phone with the rest. */}
            {/* ⛔ NO col-span, NO max-w — IT SITS IN THE FIRST COLUMN AND INHERITS ITS WIDTH.
                Two failed attempts before this both used a magic number: span both columns (tiles
                came out ~280px), then cap the row at max-w-2xl (tiles right, but the strip ended
                at 1158 — lining up with nothing, because 672px is not the width of anything else
                on the screen).
                As a plain third grid child it lands under Divisions and takes exactly that column's
                width, so both its edges match the column above it by construction rather than by
                arithmetic. Nothing to re-tune when the canvas or the gap changes. */}
            <div className="grid gap-3 sm:grid-cols-4">
              {ctaLabel ? (
                <a
                  href={ctaHref || "#"}
                  {...tabAttrs(ctaNewTab)}
                  onClick={() => setOpen(false)}
                  className={`${CONTACT_PILL_BASE} ${PILL_SIZE.tile} hover:opacity-90`}
                  title={ctaLabel}
                  style={{ backgroundColor: resolveColorOr(ctaColor, "var(--color-sjc-blue)") }}
                >
                  {/* ⛔ A COLOURED GLYPH, NOT A FLAT OUTLINE AND NOT THE RASTER ICON.
                      Steven wanted the button "dressed up" like the calendar art on Alamo Slim.
                      That art is a 1.6MB PNG with a grey background baked in, built for ~80px —
                      at the ~18px a text button gives it, the spiral binding and 25 numbers become
                      about six grey pixels, and the grey square would sit on the blue fill.

                      Note what Steven himself did on that site: the rich icon is a CARD graphic at
                      80px, and the actual buttons ("Schedule Phone Consult") use a plain inline
                      glyph. Two icons for two jobs. This is the second job.

                      So: keep it inline SVG (sharp at any size, no file weight) and take what makes
                      his read — a white body with a highlighted date square instead of a hollow
                      outline.
                      ⚠️ The band is RED, not blue like his. His sits on white; this sits on a blue
                      button, where a blue band would disappear. */}
                  {ctaIcon ? (
                    <img
                      src={ctaIcon}
                      alt=""
                      aria-hidden
                      className={`${ICON_SIZE.tile} shrink-0 object-contain`}
                    />
                  ) : (
                  <svg viewBox="0 0 24 24" className={`${ICON_SIZE.tile} shrink-0`} aria-hidden>
                    {/* binding rings */}
                    <rect x="7" y="1.5" width="2" height="4" rx="1" fill="currentColor" opacity="0.7" />
                    <rect x="15" y="1.5" width="2" height="4" rx="1" fill="currentColor" opacity="0.7" />
                    {/* body */}
                    <rect x="2.5" y="3.5" width="19" height="19" rx="3" fill="#ffffff" />
                    {/* top band */}
                    <path d="M2.5 6.5a3 3 0 013-3h13a3 3 0 013 3V9h-19V6.5z" fill="#e2483d" />
                    {/* the highlighted date */}
                    <rect x="9.5" y="12" width="5" height="5" rx="1" fill="#e2483d" />
                    {/* a couple of ruled days so it reads as a grid, not a card */}
                    <rect x="4.5" y="12.75" width="3.5" height="1.6" rx="0.8" fill="#94a3b8" />
                    <rect x="16" y="12.75" width="3.5" height="1.6" rx="0.8" fill="#94a3b8" />
                    <rect x="4.5" y="18" width="3.5" height="1.6" rx="0.8" fill="#94a3b8" />
                    <rect x="10.25" y="18" width="3.5" height="1.6" rx="0.8" fill="#94a3b8" />
                    <rect x="16" y="18" width="3.5" height="1.6" rx="0.8" fill="#94a3b8" />
                  </svg>
                  )}
                  {/* Stacked like the contact tiles beside it — label, then the hint. Steven's own
                      Alamo Slim blocks read title / value / "(Click Here)", and a tile with a bare
                      one-line label next to three two-line ones sits visibly short. */}
                  <span className="flex flex-col gap-1">
                    <span className="block">{ctaLabel}</span>
                    <span className="block text-sm font-normal opacity-90">(Click Here)</span>
                  </span>
                  {/* ⛔ ITS OWN LABEL, NOT THE IMAGE URL. Steven: "when I hover over it, I see the
                      stupid image URL. That's not going to work." Browsers fall back to showing the
                      src when a hovered image has nothing better to say, so the chip states the
                      same words the tile does — and `title` below covers the touch long-press. */}
                  <span
                    aria-hidden
                    className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md px-2.5 py-1.5 text-xs font-normal text-white opacity-0 shadow-lg ring-1 ring-white/15 transition-opacity duration-150 group-hover:opacity-100"
                    style={{ backgroundColor: "rgba(2, 6, 23, 0.95)" }}
                  >
                    {ctaLabel} — (Click Here)
                  </span>
                </a>
              ) : null}
              {/* ⛔ THE SAME THREE BUTTONS THE FOOTER RENDERS — literally the same component.
                  This was a single outline bar showing a bare phone number: no text option, no
                  email, no icons, nothing like the footer's three pills. Two pieces of markup for
                  the same three actions, which is how they drifted until Steven asked why the menu
                  and the footer didn't match. Now neither can move without the other.

                  ⚠️ The primary CTA above deliberately does NOT become a pill. It is the one thing
                  the page is asking for; making it look like the three utility buttons beside it
                  would flatten the difference between "book the call" and "here's how to reach
                  us." Different job, different weight. */}
              {/* Direct grid children, NOT wrapped in their own row — that is what puts all four
                  buttons on one line instead of one bar above a row of three. */}
              <ContactButtons
                phone={menuPhone}
                phoneDisplay={menuPhoneDisplay}
                email={menuEmail}
                size="tile"
                iconCall={menuIconCall}
                iconText={menuIconText}
                iconEmail={menuIconEmail}
              />
            </div>
          </div>
        </div>
      </header>
    );
  }

  return (
    // OPAQUE. It was briefly translucent + blurred, copying the Designs site's bar — and that is a
    // DARK-PAGE trick. Designs is dark top to bottom, so its header sits on the same tone the
    // whole scroll and never changes. This site goes white below the hero, so a translucent bar
    // picked up the white and drifted grey halfway down: one page with two different headers,
    // and only one of them matched anything.
    //
    // Steven found it by looking rather than by measuring — "against blue they look similar,
    // against white they look more different." That IS the mechanism. A colour that depends on
    // what happens to be behind it isn't a colour you can tune.
    <header
      className={`sticky top-0 z-20 w-full${bandGrid ? " overflow-hidden" : ""}`}
      style={{ backgroundColor: resolveColor(bg) }}
    >
      {GridOverlay}
      {/* Desktop: brand left · tagline centered · links + button right */}
      <div className={`mx-auto hidden max-w-6xl grid-cols-[auto_1fr_auto] items-center gap-6 px-6 py-3 lg:grid${bandGrid ? " relative z-10" : ""}`} style={{ color: resolveColor(fg) }}>
        <div className="justify-self-start">{Brand}</div>
        <div className="justify-self-center text-center">{Tagline}</div>
        <div className="flex items-center gap-5 justify-self-end">
          {linkEls.map((l, i) => (
            <a
              key={i}
              href={l.target || "#"}
              {...tabAttrs(l.newTab)}
              className="whitespace-nowrap font-medium opacity-90 transition hover:opacity-100"
              style={{ fontSize: `${l.fontSize || 14}px`, color: resolveColorOr(l.color, fg) }}
            >
              {l.label}
            </a>
          ))}
          {ctaLabel ? (
            <a
              href={ctaHref || "#"}
              {...tabAttrs(ctaNewTab)}
              className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm transition${ctaColor ? " hover:opacity-90" : " bg-[color:var(--color-sjc-blue)] hover:bg-[color:var(--color-sjc-green)]"}`}
              style={ctaColor ? { backgroundColor: resolveColor(ctaColor) } : undefined}
            >
              {ctaLabel} &rarr;
            </a>
          ) : null}
        </div>
      </div>

      {/* Mobile: brand + hamburger */}
      <div className={`mx-auto flex max-w-6xl items-center justify-between px-6 py-3 lg:hidden${bandGrid ? " relative z-10" : ""}`} style={{ color: resolveColor(fg) }}>
        {Brand}
        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((prev) => !prev)}
          className="flex h-10 w-10 items-center justify-center rounded-md hover:bg-black/5" style={{ color: resolveColor(fg) }}
        >
          {open ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
              <path d="M6 6l12 12M6 18L18 6" strokeLinecap="round" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
              <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile dropdown — tagline + links + button, all readable */}
      {open && (
        <div className="border-t border-black/10 lg:hidden" style={{ backgroundColor: resolveColor(bg) }}>
          <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-6 pb-6 pt-3">
            {Tagline}
            {linkEls.map((l, i) => (
              <a
                key={i}
                href={l.target || "#"}
                {...tabAttrs(l.newTab)}
                onClick={() => setOpen(false)}
                className="font-medium text-white"
                style={{ fontSize: `${l.fontSize || 16}px`, color: resolveColorOr(l.color, fg) }}
              >
                {l.label}
              </a>
            ))}
            {ctaLabel ? (
              <a
                href={ctaHref || "#"}
                {...tabAttrs(ctaNewTab)}
                onClick={() => setOpen(false)}
                className="w-full rounded-lg bg-[color:var(--color-sjc-blue)] px-4 py-3 text-center text-base font-semibold text-white shadow-sm"
              >
                {ctaLabel} &rarr;
              </a>
            ) : null}
          </div>
        </div>
      )}
    </header>
  );
}
