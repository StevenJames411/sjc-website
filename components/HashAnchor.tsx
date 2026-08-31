"use client";

import { useEffect } from "react";

/**
 * Land a `#section` link on the section.
 *
 * ⛔ THIS IS A CORRECTION, NOT A CURE, AND IT IS LABELLED THAT WAY ON PURPOSE.
 * Removing it puts the bug straight back — verified on the live site, 566px out the moment it was
 * unmounted. Whatever is wrong is still unidentified.
 *
 * ── THE BUG ────────────────────────────────────────────────────────────────────────────────────
 * Steven, 2026-08-31: *"click pricing… it goes to the pricing section, and then jumps up into the
 * calendar."* Loading `/#sl6o1yj` lands at scrollY 7702. The target is at 8348 with
 * `scroll-margin-top: 80px`, so a correct landing is 8268. The anchor ends up 646px below the
 * viewport top — 570 (the Cal iframe) + 76 (the header) — i.e. the browser puts the CALENDAR at
 * the top of the screen.
 *
 * ⛔ THE MISS IS EXACTLY 566px ON EVERY LOAD: warm, cold, cache-busted, clicked, typed, fresh tab.
 * It never varies by a pixel. A race varies; this does not. That constancy is the strongest clue
 * available and it has not yet been explained.
 *
 * ⚠️ MEASURED AND RULED OUT — each was shipped, tested, and changed NOTHING. Do not re-try them:
 *   · Sizing the two `<img>` tags that lacked width/height. (Sizing the LOGO additionally broke the
 *     header: its CSS sets height and leaves width free, so a width attribute became the rendered
 *     width, 964px across.)
 *   · Reserving the Cal container's height — in CSS, then permanently, then as an INLINE style on
 *     the element in the server HTML so no stylesheet timing could matter.
 *   · Preloading IBM Plex and dropping the stale Space Grotesk preloads. Worth doing on its own
 *     merits and kept, but it did not fix this.
 *   · Layout shift as a mechanism: `PerformanceObserver({type:'layout-shift',buffered:true})`
 *     reports NONE on the failing load, and the anchor measures 8348 both in the raw server HTML
 *     rendered with JS disabled AND after settling. The page geometry never changes.
 *   · Scroll restoration: same 566 in a brand-new tab on a never-seen URL.
 *
 * ⚠️ AND THE TIMING MATTERS. A version that corrected at ~120ms ran, disarmed, and the page still
 * ended up 566 out — so whatever moves the scroll acts LATER than that. A version that corrected at
 * 0/350/1200/2500ms worked, but each pass was a visible hop: *"it jumps around before it settles
 * in, and that shouldn't be doing that."* Hence one pass, late.
 *
 * ⛔ IT YIELDS TO THE PERSON. Any wheel, touch, key or mouse press and it stops for good.
 */

/**
 * Late enough to be after whatever moves the scroll — the Cal embed's own resize lands at ~1376ms
 * on the live page, and a correction at 120ms was demonstrably too early.
 */
const CORRECT_AT_MS = 1500;
/** One backstop for a slow connection. A no-op whenever the first pass already landed it. */
const BACKSTOP_MS = 3000;

export default function HashAnchor() {
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.replace(/^#/, ""));
    if (!id) return;

    // ⚠️ `scroll` is deliberately NOT in this list. The browser's own jump to the hash fires one,
    // which would cancel the correction before it ever ran. Only deliberate input counts.
    const EVENTS = ["wheel", "touchstart", "keydown", "mousedown"] as const;

    let done = false;
    const timers: number[] = [];

    const finish = () => {
      if (done) return;
      done = true;
      timers.forEach(clearTimeout);
      for (const ev of EVENTS) window.removeEventListener(ev, finish);
    };

    const settle = (isLast: boolean) => {
      if (done) return;
      const el = document.getElementById(id);
      if (!el) return finish();
      // ⛔ USE THE ELEMENT'S OWN scroll-margin-top. The sections carry `scroll-mt-20` and that IS
      // the intended offset. An earlier version subtracted the header height instead — wrong twice,
      // because `#global-header` is `position: static` here and scrolls away with the page.
      const marginTop = parseFloat(getComputedStyle(el).scrollMarginTop) || 0;
      const want = Math.max(0, el.getBoundingClientRect().top + window.scrollY - marginTop);
      // Only correct a real miss. A few pixels is not worth a movement the eye can catch.
      if (Math.abs(window.scrollY - want) > 8) window.scrollTo({ top: want, behavior: "auto" });
      if (isLast) finish();
    };

    for (const ev of EVENTS) window.addEventListener(ev, finish, { once: true, passive: true });
    timers.push(
      window.setTimeout(() => settle(false), CORRECT_AT_MS),
      window.setTimeout(() => settle(true), BACKSTOP_MS)
    );

    return finish;
  }, []);

  return null;
}
