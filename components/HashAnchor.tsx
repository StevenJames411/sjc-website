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
 * scroll position does not follow, so the viewport ends up parked on the calendar. Measured live:
 * anchor at 8348, browser at 7702.
 *
 * ⚠️ WHY THIS IS A CORRECTION AND NOT A FORK, WHICH IS THE WEAKER KIND OF FIX AND IS DELIBERATE.
 * The fork would be to reserve every image's space, which needs each image's intrinsic dimensions
 * recorded at import for every sealed design — a real change to the import pipeline, and one that
 * still would not cover an embed, a font swap or the next third-party widget somebody pastes in.
 * Re-asserting the scroll is indifferent to WHAT grew, so it covers the whole class. The calendar's
 * own space IS reserved in CSS (`[data-sjc-cal]:not(:has(iframe))`), so this handles the remainder.
 *
 * ⛔ IT MUST YIELD TO THE PERSON. If they scroll, wheel or touch, this stops immediately — nothing
 * is worse than a page that drags you back while you are reading. It also gives up after ~2.5s, so
 * it can never fight a lazy-loading widget forever.
 */
export default function HashAnchor() {
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.replace(/^#/, ""));
    if (!id) return;

    let cancelled = false;
    const stop = () => {
      cancelled = true;
    };
    // `once` so these unhook themselves; passive because none of them are prevented.
    for (const ev of ["wheel", "touchstart", "keydown"] as const) {
      window.addEventListener(ev, stop, { once: true, passive: true });
    }

    const settle = () => {
      if (cancelled) return;
      const el = document.getElementById(id);
      if (!el) return;
      // The sticky header sits over the top of the page, so land BELOW it rather than under it.
      const header = document.getElementById("global-header");
      const offset = header ? header.getBoundingClientRect().height + 16 : 16;
      const want = Math.max(0, el.getBoundingClientRect().top + window.scrollY - offset);
      // Only correct a real miss. Re-scrolling to where we already are would fight the person for
      // the last pixel and cancel their own scrolling for no reason.
      if (Math.abs(window.scrollY - want) > 8) window.scrollTo({ top: want, behavior: "auto" });
    };

    const t: number[] = [];
    // Three passes, not a loop: right away, after the images and the embed have had a moment, and
    // once more at the far end for a slow connection. Each one is a no-op if nothing moved.
    for (const ms of [0, 350, 1200, 2500]) t.push(window.setTimeout(settle, ms));
    window.addEventListener("load", settle, { once: true });

    return () => {
      cancelled = true;
      t.forEach(clearTimeout);
      window.removeEventListener("load", settle);
    };
  }, []);

  return null;
}
