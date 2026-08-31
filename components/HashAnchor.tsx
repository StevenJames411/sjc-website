"use client";

import { useEffect } from "react";

/**
 * Land a `#section` link on the section.
 *
 * ── WHAT IS ACTUALLY WRONG, AND WHAT IS STILL UNPROVEN ─────────────────────────────────────────
 * Steven, 2026-08-31: *"click pricing… it goes to the pricing section, and then jumps up into the
 * calendar."*
 *
 * ⛔ THE LINK IS CORRECT. `/#sl6o1yj` resolves, the id exists exactly once, and the target's own
 * `scroll-mt-20` means a correct landing is `anchor − 80` = **8268**. The browser lands at **7702**
 * instead — the anchor ends up **646px** below the viewport top, which is the calendar's 570px plus
 * the header's 76px. In other words the browser puts the CALENDAR at the top of the screen.
 *
 * ⛔ THE MISS IS EXACTLY 566px ON EVERY LOAD — warm, cold, clicked, typed, fresh tab, cache-busted
 * URL. A race varies. A constant does not. That single fact is what finally ruled out every theory
 * below, and it is the thing to trust if this is ever reopened.
 *
 * ⚠️ MEASURED AND RULED OUT — do not spend the night on these again:
 *   · **Images.** Two home images had no width/height. Sizing them changed nothing. (Sizing the
 *     LOGO broke the header: its CSS sets height and leaves width free, so a width attribute became
 *     the rendered width — 964px across.)
 *   · **The Cal embed's height.** Reserved in CSS, reserved permanently, then reserved INLINE on the
 *     element so no stylesheet timing could matter. Changed nothing.
 *   · **Fonts.** The page preloaded five Space Grotesk weights it no longer draws and never
 *     preloaded IBM Plex, which every character now uses. Fixed — worth doing on its own merits —
 *     and it changed nothing here.
 *   · **Layout shift.** `PerformanceObserver({type:'layout-shift', buffered:true})` reports NO
 *     shifts on the failing load, and the anchor measures 8348 both pre-hydration (server HTML
 *     rendered with scripts disabled) and after settling. **The page geometry never changes.**
 *   · **Scroll restoration.** Same 566 in a brand-new tab with a never-before-seen URL.
 *   · **A late re-scroll.** Scrolling to 8268 by hand after load STAYS. Whatever moves it acts only
 *     during the load window.
 *
 * ⚠️ SO THE CORRECTION STAYS, AND IT IS HONESTLY A CORRECTION. The remaining suspect is something
 * scrolling the Cal iframe to the top during load (focus or `scrollIntoView` from inside the frame)
 * — consistent with the calendar landing exactly at the viewport top, and with a hash that matches
 * nothing producing no scroll at all. It is not proven, because this tooling cannot observe the
 * load window.
 *
 * ⛔ CORRECT ONCE, AND LATE. The first version re-scrolled at 0/350/1200/2500ms — right place,
 * visible hopping. Steven: *"it jumps around before it settles in."* The second watched the page
 * height and moved when it went quiet, which is quiet at ~120ms and therefore BEFORE the culprit:
 * measured still 566px out after it had run and disarmed. Timing it off the height is the wrong
 * signal because the geometry never changes. So it waits past the event and moves exactly once.
 *
 * ⛔ IT MUST YIELD TO THE PERSON. Any wheel, touch, key or mouse press and it stops for good.
 */

/**
 * ⛔ ONE CORRECTION, AND IT MUST BE LATE. THIS NUMBER IS THE WHOLE FIX.
 * A quiet-settle at 120ms corrected, disarmed, and THEN the page moved — measured: still 566px out
 * after it had already run and finished. Whatever scrolls the calendar to the top acts around a
 * second in. The original four-nudge version "worked" only because one of its nudges was late; the
 * other three were the visible hopping. So: wait past the culprit, then move exactly once.
 * ⚠️ 1400ms is chosen from measurement, not taste — the Cal embed's own resize lands at ~1376ms.
 */
const CORRECT_AT_MS = 1400;
/** A second pass, far enough out to catch a slow connection. No-op when the first one was right. */
const BACKSTOP_MS = 2800;

export default function HashAnchor() {
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.replace(/^#/, ""));
    if (!id) return;

    // ⚠️ `scroll` is NOT here. The browser's own jump to the hash fires one, which would cancel the
    // correction before it ran. Only a deliberate input counts as the person taking over.
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
      // ⛔ USE THE ELEMENT'S OWN scroll-margin-top. The sections carry `scroll-mt-20` (80px) and
      // that IS the correct offset. An earlier version subtracted the header's height instead —
      // wrong twice over, because `#global-header` is `position: static` here and scrolls away.
      const marginTop = parseFloat(getComputedStyle(el).scrollMarginTop) || 0;
      const want = Math.max(0, el.getBoundingClientRect().top + window.scrollY - marginTop);
      // Only correct a real miss — a few pixels is not worth a movement the eye can catch.
      if (Math.abs(window.scrollY - want) > 8) window.scrollTo({ top: want, behavior: "auto" });
      if (isLast) finish();
    };

    for (const ev of EVENTS) window.addEventListener(ev, finish, { once: true, passive: true });

    // Two passes only. The first is after the culprit; the second is a no-op unless the connection
    // was slow enough that the first one still landed too early. Two moves at most, and in practice
    // one — nothing like the four-nudge version that hopped.
    const first = window.setTimeout(() => settle(false), CORRECT_AT_MS);
    const giveUp = window.setTimeout(() => settle(true), BACKSTOP_MS);
    timers.push(first, giveUp);

    return finish;
  }, []);

  return null;
}
