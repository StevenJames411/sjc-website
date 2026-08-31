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
 * then GROWS above the anchor: three images in the sealed markup carry no width/height (756px once
 * loaded) and the Cal.com calendar mounts at 620px. Everything below slides down ~646px and the
 * scroll position does not follow. Measured live: anchor at 8348, browser at 7702.
 *
 * ⛔ CORRECT ONCE, WHEN THE PAGE HAS STOPPED MOVING — NOT ON A TIMER.
 * The first version re-scrolled at 0/350/1200/2500ms, which fixed the destination and looked awful
 * getting there. Steven: *"it jumps around before it settles in, and that shouldn't be doing
 * that."* Every one of those four passes was a visible hop. A fixed schedule cannot know when the
 * images have finished, so it either hops repeatedly or gives up too early.
 *
 * So: WATCH the page height instead of guessing at it. While it is still changing, do nothing —
 * a correction mid-growth is a jump that will need correcting again. Once it holds still for
 * QUIET_MS, scroll once. One move, after everything has landed.
 *
 * ⚠️ WHY THIS IS A CORRECTION AND NOT A FORK, WHICH IS DELIBERATE. The fork would be to reserve
 * every image's space, which needs each image's intrinsic dimensions recorded at import for every
 * sealed design — a real change to the import pipeline, and one that still would not cover an
 * embed, a font swap or the next third-party widget somebody pastes in. Watching the height is
 * indifferent to WHAT grew, so it covers the whole class. The calendar's own space IS reserved in
 * CSS (`[data-sjc-cal]:not(:has(iframe))`), which removes the largest single shift up front.
 *
 * ⛔ IT MUST YIELD TO THE PERSON. Any scroll, wheel, touch or key press and this stops for good —
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

    let done = false;
    let quiet: number | undefined;
    let lastHeight = document.documentElement.scrollHeight;

    const finish = () => {
      done = true;
      clearTimeout(quiet);
      clearTimeout(giveUp);
      obs.disconnect();
      for (const ev of EVENTS) window.removeEventListener(ev, bail);
    };

    // ⚠️ `scroll` is NOT in this list. The browser's own jump to the hash fires one, which would
    // cancel the correction before it ever ran. Only a deliberate input counts as the person
    // taking over.
    const EVENTS = ["wheel", "touchstart", "keydown", "mousedown"] as const;
    const bail = () => finish();

    const settle = () => {
      if (done) return;
      const el = document.getElementById(id);
      if (!el) return finish();
      // The sticky header sits over the top of the page, so land BELOW it rather than under it.
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
    // swapping. Re-measure rather than trusting the mutation to tell us what it did.
    const obs = new MutationObserver(() => {
      if (done) return;
      const h = document.documentElement.scrollHeight;
      if (h === lastHeight) return;
      lastHeight = h;
      armQuiet();
    });
    obs.observe(document.documentElement, { childList: true, subtree: true, attributes: true });

    const giveUp = window.setTimeout(settle, GIVE_UP_MS);
    for (const ev of EVENTS) window.addEventListener(ev, bail, { once: true, passive: true });

    // An image that is already cached fires no mutation at all, so start the clock immediately —
    // otherwise a warm load would sit and wait for a change that never comes.
    armQuiet();

    return finish;
  }, []);

  return null;
}
