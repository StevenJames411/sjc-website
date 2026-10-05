"use client";

// Every section uses the whole screen (Steven, 2026-10-03).
//
// "It's horrible when you have a section, and 25% of the section is above or below the fold."
// His rule, in his order: readability first, more screens to scroll is fine, never shrink type to
// make something fit. So this touches PADDING ONLY — never a font size, never the content.
//
// On a laptop-or-wider screen it walks the page's sections top to bottom:
//   · short sections are grouped until the group would pass one screen, then the group is given
//     exactly one screen (the spare height is shared out as padding above and below each one);
//   · a section a little over one screen (up to 15%) gives up padding until it fits, down to a
//     floor — the same trim that was done by hand on the home page;
//   · a section genuinely longer than a screen is left alone and simply scrolls.
//
// ⛔ NOTHING IS EVER SPLIT ACROSS SCREENS. That was built and removed the same day (2026-10-03): rows
// of steps, then rows of cards, were moved down to the next screen so the fold landed in a gap.
// Steven, looking at both: "it just looks like we have too much padding on the page for no reason"
// and "it's just too much dead space." A long section either gets its content compacted to fit one
// screen (in that section's own markup, never by shrinking type) or it scrolls.
//
// ⚠️ WHY A SCRIPT AND NOT CSS. A stylesheet can say "at least one screen tall", but it cannot pair
// two half-screen sections into one screen, and a height tuned for one laptop is wrong on the next.
// This measures the screen it is actually on.
//
// ⚠️ PHONES AND UPRIGHT TABLETS ARE NOT TOUCHED (below 1024px). One column stacks taller than any
// phone screen; that canvas gets its own pass.
//
// The header's real height is published as --sjc-hdr at every width, so the hero rules in
// globals.css stop hardcoding a number that went stale when the logo grew (76px → 97px).

import { useEffect } from "react";

const MIN_WIDTH = 1024;
const MIN_USABLE = 520; // a very short window: fitting to it would crush everything
const TRIM_LIMIT = 0.15; // how far over one screen a section may be and still get trimmed to fit
const PAD_FLOOR = 16;

type Saved = { pt: string; ptP: string; pb: string; pbP: string };
const saved = new WeakMap<HTMLElement, Saved>();

function restore(s: HTMLElement) {
  const o = saved.get(s);
  if (!o) return;
  s.style.setProperty("padding-top", o.pt, o.ptP);
  s.style.setProperty("padding-bottom", o.pb, o.pbP);
  if (!o.pt) s.style.removeProperty("padding-top");
  if (!o.pb) s.style.removeProperty("padding-bottom");
}

function fit() {
  const header = document.querySelector<HTMLElement>("#global-header, header");
  const hdr = header ? header.offsetHeight : 0;
  document.documentElement.style.setProperty("--sjc-hdr", `${hdr}px`);

  const sections = Array.from(document.querySelectorAll<HTMLElement>("main section")).filter(
    (s) => !s.parentElement?.closest("section")
  );
  for (const s of sections) {
    if (!saved.has(s)) {
      saved.set(s, {
        pt: s.style.getPropertyValue("padding-top"),
        ptP: s.style.getPropertyPriority("padding-top"),
        pb: s.style.getPropertyValue("padding-bottom"),
        pbP: s.style.getPropertyPriority("padding-bottom"),
      });
    }
    restore(s);
  }

  const usable = window.innerHeight - hdr;
  if (window.innerWidth < MIN_WIDTH || usable < MIN_USABLE) return;

  const live = sections.filter((s) => s.offsetHeight > 40);
  const m = live.map((s) => {
    const cs = getComputedStyle(s);
    return { s, h: s.getBoundingClientRect().height, pt: parseFloat(cs.paddingTop) || 0, pb: parseFloat(cs.paddingBottom) || 0 };
  });
  const pad = (x: (typeof m)[number], top: number, bottom: number) => {
    x.s.style.setProperty("padding-top", `${Math.max(0, top)}px`, "important");
    x.s.style.setProperty("padding-bottom", `${Math.max(0, bottom)}px`, "important");
  };

  let i = 0;
  while (i < m.length) {
    const x = m[i];
    if (x.h > usable + 1) {
      const over = x.h - usable;
      const room = Math.max(0, x.pt - PAD_FLOOR) + Math.max(0, x.pb - PAD_FLOOR);
      // ⛔ A HERO'S TOP PADDING IS NEVER TRIMMED (Steven, 2026-10-05): "they should have the same padding
      // from the navigation, and they don't." Trimming top and bottom together put the name tag 30px
      // higher on the two pages whose paragraph ran a little over one screen. A twin hero gives up
      // bottom padding only; whatever is still over simply scrolls.
      if (x.s.querySelector("[data-sjc-twin-col]")) {
        pad(x, x.pt, Math.max(PAD_FLOOR, x.pb - over));
      } else if (over <= usable * TRIM_LIMIT && room >= over) {
        const fromTop = (over * Math.max(0, x.pt - PAD_FLOOR)) / room;
        pad(x, x.pt - fromTop, x.pb - (over - fromTop));
      }
      i += 1;
      continue;
    }
    let j = i;
    let sum = x.h;
    while (j + 1 < m.length && sum + m[j + 1].h <= usable) {
      j += 1;
      sum += m[j].h;
    }
    const each = (usable - sum) / (j - i + 1) / 2;
    if (each > 0.5) for (let k = i; k <= j; k += 1) pad(m[k], m[k].pt + each, m[k].pb + each);
    i = j + 1;
  }
}

export default function FoldFit() {
  useEffect(() => {
    let t = 0;
    let first = true;
    const run = () => {
      fit();
      // The page was opened on an anchor (#apply): the browser jumped before the heights settled.
      if (first && window.location.hash.length > 1) {
        document.getElementById(decodeURIComponent(window.location.hash.slice(1)))?.scrollIntoView();
      }
      first = false;
    };
    const later = () => {
      window.clearTimeout(t);
      t = window.setTimeout(fit, 150);
    };
    run();
    window.addEventListener("load", later);
    window.addEventListener("resize", later);
    document.fonts?.ready.then(later).catch(() => {});
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("load", later);
      window.removeEventListener("resize", later);
    };
  }, []);
  return null;
}
