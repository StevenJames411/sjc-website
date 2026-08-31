"use client";

import { useEffect } from "react";

/**
 * Land a `#section` link on the section, even after the page grows underneath it.
 *
 * ── THE BUG THIS EXISTS FOR ────────────────────────────────────────────────────────────────────
 * Steven, 2026-08-31: *"go to any page but the home page, click pricing… it goes to the pricing
 * section, and then jumps up into the calendar."*
 *
 * ⛔ THE LINK WAS NEVER WRONG. `/#sl6o1yj` is correct and the target exists. The browser jumps to
 * the anchor as soon as it can, using the page as it stands at that instant — and the home page
 * then GROWS above the anchor: four images carry no width/height (756px once loaded) and the
 * Cal.com calendar mounts at 620px. Everything below slides down ~646px and the scroll does not
 * follow. Measured live: anchor at 8348, browser parked at 7702.
 *
 * ⛔ CORRECT ONCE, WHEN THE PAGE HAS STOPPED MOVING — NEVER ON A TIMER.
 * The first version re-scrolled at 0/350/1200/2500ms. It reached the right place and looked awful
 * getting there. Steven: *"it jumps around before it settles in, and that shouldn't be doing
 * that."* Each pass was a visible hop, and a fixed schedule cannot know when the images have
 * finished — so it either hops repeatedly or gives up too early. This version WATCHES the height:
 * while it is still changing, do nothing, because a correction mid-growth is a jump that will need
 * correcting again. Once it holds still for QUIET_MS, move once.
 *
 * ⚠️ THE REAL FORK WAS TRIED AND REVERTED, AND THE REASON MATTERS. Writing each image's true pixel
 * size into the markup removes the shift at source — but the logo is drawn by CSS at 48px tall with
 * its width left free, so a `width="964"` attribute made the browser draw it 964px wide and broke
 * the header. Sizing the images requires pairing every attribute with the CSS that constrains it.
 * Worth doing; it is not a one-liner. Until then this stays.
 *
 * ⛔ IT MUST YIELD TO THE PERSON. Any wheel, touch, key or mouse press and this stops for good —
 * nothing is worse than a page that drags you back while you are reading.
 */

/** The page must hold this height, unchanged, before the scroll is considered safe to make. */
const QUIET_MS = 120;
/** Hard stop. A widget that never settles must not leave this armed forever. */
const GIVE_UP_MS = 4000;

export default function HashAnchor() {
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.replace(/^#/, ""));
    if (!id) return;

    // ⚠️ `scroll` is NOT in this list. The browser's own jump to the hash fires one, which would
    // cancel the correction before it ever ran. Only a deliberate input counts as taking over.
    const EVENTS = ["wheel", "touchstart", "keydown", "mousedown"] as const;

    let done = false;
    let quiet: number | undefined;
    let lastHeight = document.documentElement.scrollHeight;

    const finish = () => {
      if (done) return;
      done = true;
      clearTimeout(quiet);
      clearTimeout(giveUp);
      obs.disconnect();
      for (const ev of EVENTS) window.removeEventListener(ev, finish);
    };

    const settle = () => {
      if (done) return;
      const el = document.getElementById(id);
      if (!el) return finish();
      // The sticky header sits over the top of the page, so land BELOW it, not under it.
      const header = document.getElementById("global-header");
      const offset = (header?.getBoundingClientRect().height ?? 0) + 16;
      const want = Math.max(0, el.getBoundingClientRect().top + window.scrollY - offset);
      // Only correct a real miss — a few pixels is not worth a movement the eye can catch.
      if (Math.abs(window.scrollY - want) > 8) window.scrollTo({ top: want, behavior: "auto" });
      finish();
    };

    const armQuiet = () => {
      clearTimeout(quiet);
      quiet = window.setTimeout(settle, QUIET_MS);
    };

    // Any DOM change can change the height — an image decoding, the embed mounting, a font
    // swapping. Re-measure rather than trusting the mutation to say what it did.
    const obs = new MutationObserver(() => {
      if (done) return;
      const h = document.documentElement.scrollHeight;
      if (h === lastHeight) return;
      lastHeight = h;
      armQuiet();
    });
    obs.observe(document.documentElement, { childList: true, subtree: true, attributes: true });

    const giveUp = window.setTimeout(settle, GIVE_UP_MS);
    for (const ev of EVENTS) window.addEventListener(ev, finish, { once: true, passive: true });

    // A fully cached page fires no mutation at all, so start the clock immediately — otherwise a
    // warm load would sit waiting for a change that never comes.
    armQuiet();

    return finish;
  }, []);

  return null;
}
