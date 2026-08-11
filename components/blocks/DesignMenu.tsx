"use client";

// Make an imported design's mobile menu work.
//
// ── WHY IT ARRIVES BROKEN ─────────────────────────────────────────────────────────────────────
// A bought design ships the hamburger as markup plus a <script> that toggles it:
//
//   <button id="mobile-toggle" class="md:hidden" aria-label="Menu">
//   <div id="mobile-menu" class="hidden md:hidden">…</div>
//
// lib/designHtml.ts strips every <script> and every inline on* handler at import — deliberately,
// because executing arbitrary JavaScript from a third-party design file on a client's live website
// is not a trade worth making. So the button and the panel both survive and nothing connects them.
// On a phone the menu is simply dead, which on a site whose visitors are ALL on phones is the
// worst possible thing to lose.
//
// So we do the toggle ourselves. This is first-party code doing one specific, legible thing —
// add and remove a class — rather than the design's script being trusted.
//
// ── FINDING THE PAIR WITHOUT TRUSTING THE DESIGN'S NAMING ─────────────────────────────────────
// Tried in order, most explicit first:
//   1. aria-controls           the accessible, standard way to say "this button opens that"
//   2. #mobile-toggle/#mobile-menu   SiteDrop's convention
//   3. a button hidden at desktop (`md:hidden`) + the nearest element that is `hidden` and also
//      collapses at desktop — the shape every Tailwind mobile menu has
//
// If none match, nothing happens. A design whose menu we can't identify is left exactly as it was
// rather than half-wired.
//
// ── THE SECOND SHAPE: A STATE ATTRIBUTE, AND A PANEL IN ANOTHER SECTION ───────────────────────
// Everything above searches inside ONE section, because that is where a Tailwind mobile menu lives.
// A hand-built design doesn't have to oblige. sjc-2026 ships:
//
//   <header class="hdr">…<button class="menubtn" id="menuOpen" aria-label="Open menu">…</header>
//   <div class="ovl" id="ovl" data-open="false">…<button class="ovl__close" id="menuClose">…</div>
//
// The overlay is a SIBLING of the header at body level, so splitSections() makes it its own block —
// the button and the panel end up in different sections and no section-scoped search can ever pair
// them. It also carries no `hidden` class: its state is the `data-open` attribute its own CSS keys
// off. So this strategy searches the document and toggles the attribute the design already uses.
//
// ⚠️ Document-wide, but DesignMenu renders once per section — so the first instance to find the
// panel claims it and marks it, and the rest leave it alone. Without that, a ten-section page binds
// ten click handlers to the same button and the menu toggles ten times per tap: open, closed, open,
// closed… i.e. dead, in a way that looks identical to not being wired at all.
import { useEffect, useRef } from "react";

const HIDDEN = "hidden";
const WIRED = "data-sjc-menu-wired";

/** The design's own open/close state, toggled where the design already reads it. */
function wireStatefulMenu(): (() => void) | null {
  const panel = document.querySelector<HTMLElement>(`[data-open]:not([${WIRED}])`);
  if (!panel) return null;

  // A button that opens it: anything outside the panel that says "menu" in the ways designs say it.
  const opener = Array.from(
    document.querySelectorAll<HTMLElement>('button,[role="button"]')
  ).find(
    (b) =>
      !panel.contains(b) &&
      (/menu/i.test(b.getAttribute("aria-label") || "") ||
        /(?:^|[\s_-])menu|menubtn|hamburger|burger/i.test(b.className + " " + b.id))
  );
  if (!opener) return null;

  panel.setAttribute(WIRED, "1");

  const set = (open: boolean) => {
    panel.setAttribute("data-open", String(open));
    opener.setAttribute("aria-expanded", String(open));
  };
  const isOpen = () => panel.getAttribute("data-open") === "true";

  // Start closed no matter what the markup was saved with — an overlay that arrives open buries the
  // page, which is the whole failure this pairs with.
  set(false);

  const onOpen = (e: Event) => {
    e.preventDefault();
    set(!isOpen());
  };
  // Close on the panel's own close button, and on any link — tapping a link should navigate AND
  // close, or the menu stays over the page it just went to.
  const onPanel = (e: Event) => {
    const t = e.target as Element | null;
    if (!t?.closest) return;
    const close = t.closest<HTMLElement>("button,[role=button]");
    if (close && /close/i.test((close.getAttribute("aria-label") || "") + close.className + close.id)) {
      e.preventDefault();
      set(false);
      return;
    }
    if (t.closest("a")) set(false);
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Escape" && isOpen()) set(false);
  };

  opener.addEventListener("click", onOpen);
  panel.addEventListener("click", onPanel);
  document.addEventListener("keydown", onKey);
  return () => {
    opener.removeEventListener("click", onOpen);
    panel.removeEventListener("click", onPanel);
    document.removeEventListener("keydown", onKey);
    panel.removeAttribute(WIRED);
  };
}

/** Is this element a menu PANEL — starts hidden, and only exists at mobile widths? */
function looksLikePanel(el: Element): boolean {
  const c = el.className;
  if (typeof c !== "string") return false;
  return c.split(/\s+/).includes(HIDDEN) && /(?:^|\s)(?:md|lg):hidden(?:\s|$)/.test(c);
}

export default function DesignMenu() {
  const anchor = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const root = anchor.current?.parentElement;
    if (!root) return;

    // The stateful shape first: it's the only one whose panel can live outside this section, so a
    // section-scoped miss below would otherwise be the end of it.
    const stateful = wireStatefulMenu();
    if (stateful) return stateful;

    const button =
      root.querySelector<HTMLElement>("[aria-controls]") ||
      root.querySelector<HTMLElement>("#mobile-toggle") ||
      Array.from(root.querySelectorAll<HTMLElement>("button")).find((b) =>
        /(?:^|\s)(?:md|lg):hidden(?:\s|$)/.test(b.className || "")
      );
    if (!button) return;

    const controls = button.getAttribute("aria-controls");
    const panel =
      (controls && root.querySelector<HTMLElement>(`#${CSS.escape(controls)}`)) ||
      root.querySelector<HTMLElement>("#mobile-menu") ||
      Array.from(root.querySelectorAll<HTMLElement>("div,nav,ul")).find(looksLikePanel);
    if (!panel || panel === button) return;

    const set = (open: boolean) => {
      panel.classList.toggle(HIDDEN, !open);
      button.setAttribute("aria-expanded", String(open));
    };
    const isOpen = () => !panel.classList.contains(HIDDEN);

    set(false);
    button.setAttribute("aria-expanded", "false");
    if (controls) button.setAttribute("aria-controls", controls);

    const onToggle = (e: Event) => {
      e.preventDefault();
      set(!isOpen());
    };
    // Tapping a link should navigate AND close, or the menu stays over the page it just went to —
    // which reads as the site being stuck.
    const onNavigate = (e: Event) => {
      if ((e.target as Element)?.closest?.("a")) set(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen()) set(false);
    };

    button.addEventListener("click", onToggle);
    panel.addEventListener("click", onNavigate);
    document.addEventListener("keydown", onKey);
    return () => {
      button.removeEventListener("click", onToggle);
      panel.removeEventListener("click", onNavigate);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return <span ref={anchor} hidden aria-hidden="true" />;
}
