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
import { useEffect, useRef } from "react";

const HIDDEN = "hidden";

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
