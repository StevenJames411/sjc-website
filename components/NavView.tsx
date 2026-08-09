"use client";

import { useState } from "react";
import Icon from "@/components/blocks/Icon";
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

  const Brand = (
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

    return (
      <header className="sticky top-0 z-30 w-full" style={{ backgroundColor: resolveColor(bg) }}>
        <div
          className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4"
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

          <div className="mx-auto grid max-w-5xl gap-10 px-6 pb-20 pt-4 md:grid-cols-2">
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

            <div className="grid gap-3 md:col-span-2">
              {ctaLabel ? (
                <a
                  href={ctaHref || "#"}
                  {...tabAttrs(ctaNewTab)}
                  onClick={() => setOpen(false)}
                  className="block px-8 py-4 text-center text-[10.5px] font-semibold uppercase tracking-[0.22em] text-white"
                  style={{ backgroundColor: resolveColorOr(ctaColor, "var(--color-sjc-blue)") }}
                >
                  {ctaLabel}
                </a>
              ) : null}
              {menuPhone ? (
                <a
                  href={`tel:${menuPhone}`}
                  className="flex items-center justify-center gap-2.5 border px-8 py-3.5 text-sm tracking-[0.14em]"
                  style={{ borderColor: "currentColor", opacity: 0.85 }}
                >
                  {menuPhoneDisplay || menuPhone}
                </a>
              ) : null}
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
      className="sticky top-0 z-20 w-full"
      style={{ backgroundColor: resolveColor(bg) }}
    >
      {/* Desktop: brand left · tagline centered · links + button right */}
      <div className="mx-auto hidden max-w-6xl grid-cols-[auto_1fr_auto] items-center gap-6 px-6 py-3 lg:grid" style={{ color: resolveColor(fg) }}>
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
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3 lg:hidden" style={{ color: resolveColor(fg) }}>
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
