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
 * ⛔ CORRECT ONCE, WHEN THE PAGE HAS STOPPED MOVING — NEVER ON A TIMER. The first version
 * re-scrolled at 0/350/1200/2500ms; it reached the right place and hopped visibly getting there.
 * Steven: *"it jumps around before it settles in, and that shouldn't be doing that."* This watches
 * the height, does nothing while it is changing, and moves once when it holds still.
 *
 * ⛔ IT MUST YIELD TO THE PERSON. Any wheel, touch, key or mouse press and it stops for good.
 */

/** The page must hold this height, unchanged, before the scroll is considered safe to make. */
const QUIET_MS = 120;
/** Hard stop, so a widget that never settles cannot leave this armed. */
const GIVE_UP_MS = 3000;

export default function HashAnchor() {
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.replace(/^#/, ""));
    if (!id) return;

    // ⚠️ `scroll` is NOT here. The browser's own jump to the hash fires one, which would cancel the
    // correction before it ran. Only a deliberate input counts as the person taking over.
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
      // ⛔ USE THE ELEMENT'S OWN scroll-margin-top. The sections carry `scroll-mt-20` (80px) and
      // that IS the correct offset. An earlier version subtracted the header's height instead —
      // wrong twice over, because `#global-header` is `position: static` here and scrolls away.
      const marginTop = parseFloat(getComputedStyle(el).scrollMarginTop) || 0;
      const want = Math.max(0, el.getBoundingClientRect().top + window.scrollY - marginTop);
      // Only correct a real miss — a few pixels is not worth a movement the eye can catch.
      if (Math.abs(window.scrollY - want) > 8) window.scrollTo({ top: want, behavior: "auto" });
      finish();
    };

    const armQuiet = () => {
      clearTimeout(quiet);
      quiet = window.setTimeout(settle, QUIET_MS);
    };

    // Any DOM change can change the height. Re-measure rather than trust the mutation.
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

    // A fully cached page fires no mutation at all, so start the clock immediately.
    armQuiet();

    return finish;
  }, []);

  return null;
}
