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
//   · a section genuinely longer than a screen, built as a heading over a list of like things (steps,
//     cards, definitions), is PAGED: whole rows are pushed to the next screen so the fold lands in a
//     gap, never through a card, and each screenful is centred. Same thing that was done by hand to
//     the six cards on the home page.
//   · anything else longer than a screen (long prose, one tall illustration) is left alone. It cannot
//     fit, and padding it out would only add empty bands.
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

const PAGE_PAD = 24; // least air above and below a paged screenful
const MAX_PAGES = 10;

type Saved = { pt: string; ptP: string; pb: string; pbP: string };
const saved = new WeakMap<HTMLElement, Saved>();
// Rows that were pushed down to start a new screen: element -> the inline margin-top it had before.
const pushed = new Map<HTMLElement, [string, string]>();

function unpush() {
  pushed.forEach(([v, pr], el) => {
    if (v) el.style.setProperty("margin-top", v, pr);
    else el.style.removeProperty("margin-top");
  });
  pushed.clear();
}

// The list inside a long section: follow the only-child chain down to where the content fans out,
// then take the biggest block there. It counts as a list only when its children are all the same
// kind of thing and it is not itself a framed object (a chat mock-up is a tall box of like children
// too, and splitting THAT across two screens would tear the picture in half).
function findList(section: HTMLElement): HTMLElement | null {
  const flow = (e: HTMLElement) =>
    Array.from(e.children).filter((c): c is HTMLElement => {
      if (!(c instanceof HTMLElement) || c.offsetHeight < 8) return false;
      const pos = getComputedStyle(c).position;
      return pos !== "absolute" && pos !== "fixed";
    });
  let box: HTMLElement = section;
  for (let d = 0; d < 4; d += 1) {
    const kids = flow(box);
    if (kids.length !== 1) break;
    box = kids[0];
  }
  const kids = flow(box);
  if (kids.length < 2) return null;
  const list = kids.reduce((a, b) => (b.offsetHeight > a.offsetHeight ? b : a));
  if (list.offsetHeight < box.offsetHeight * 0.5) return null;
  const items = flow(list);
  if (items.length < 2) return null;
  const kind = (e: HTMLElement) => `${e.tagName}.${e.className}`;
  if (!items.every((e) => kind(e).split(" ")[0] === kind(items[0]).split(" ")[0])) return null;
  const cs = getComputedStyle(list);
  const framed =
    parseFloat(cs.borderTopWidth) > 0 ||
    parseFloat(cs.borderTopLeftRadius) > 0 ||
    (cs.backgroundColor !== "rgba(0, 0, 0, 0)" && cs.backgroundColor !== "transparent") ||
    cs.backgroundImage !== "none" ||
    cs.overflowY === "hidden" ||
    cs.overflowY === "auto" ||
    cs.overflowY === "scroll";
  return framed ? null : list;
}

// Returns false (and changes nothing) when the section cannot be paged cleanly.
function paginate(s: HTMLElement, pt: number, pb: number, usable: number): boolean {
  const list = findList(s);
  if (!list) return false;
  const rect = s.getBoundingClientRect();
  const start = rect.top + pt;
  const end = rect.bottom - pb;
  const rows: { top: number; bottom: number; els: HTMLElement[] }[] = [];
  for (const el of Array.from(list.children)) {
    if (!(el instanceof HTMLElement) || el.offsetHeight < 8) continue;
    const r = el.getBoundingClientRect();
    const row = rows.find((x) => Math.abs(x.top - r.top) < 4);
    if (row) {
      row.bottom = Math.max(row.bottom, r.bottom);
      row.els.push(el);
    } else rows.push({ top: r.top, bottom: r.bottom, els: [el] });
  }
  rows.sort((a, b) => a.top - b.top);
  if (rows.length < 2) return false;

  const room = usable - PAGE_PAD * 2;
  // pages[k] = { from: where its content starts, to: where it ends, first: the row that opens it }
  // The heading block counts as content of the first screen. When the heading plus the first row is
  // already more than a screen (a lede over three tall conversation cards), the heading gets a screen
  // to itself and the rows start on the next one.
  const headEnd = list.getBoundingClientRect().top - (parseFloat(getComputedStyle(list).marginTop) || 0);
  const hasHead = headEnd - start > 8;
  const pages: { from: number; to: number; first: number }[] = [{ from: start, to: hasHead ? headEnd : rows[0].bottom, first: hasHead ? -1 : 0 }];
  for (let r = 0; r < rows.length; r += 1) {
    const page = pages[pages.length - 1];
    if (rows[r].bottom - page.from > room && r !== page.first) {
      pages.push({ from: rows[r].top, to: rows[r].bottom, first: r });
    } else page.to = rows[r].bottom;
  }
  pages[pages.length - 1].to = Math.max(pages[pages.length - 1].to, end); // whatever follows the list
  if (pages.length < 2 || pages.length > MAX_PAGES) return false;
  if (pages.some((p) => p.to - p.from > room)) return false; // one row is taller than a screen

  const air = pages.map((p) => (usable - (p.to - p.from)) / 2);
  for (let k = 1; k < pages.length; k += 1) {
    const natural = pages[k].from - pages[k - 1].to;
    const extra = air[k - 1] + air[k] - natural;
    if (extra <= 0) continue;
    for (const el of rows[pages[k].first].els) {
      if (!pushed.has(el)) pushed.set(el, [el.style.getPropertyValue("margin-top"), el.style.getPropertyPriority("margin-top")]);
      const base = parseFloat(getComputedStyle(el).marginTop) || 0;
      el.style.setProperty("margin-top", `${base + extra}px`, "important");
    }
  }
  s.style.setProperty("padding-top", `${air[0]}px`, "important");
  s.style.setProperty("padding-bottom", `${air[pages.length - 1]}px`, "important");
  return true;
}

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
  unpush();

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
      if (over <= usable * TRIM_LIMIT && room >= over) {
        const fromTop = (over * Math.max(0, x.pt - PAD_FLOOR)) / room;
        pad(x, x.pt - fromTop, x.pb - (over - fromTop));
      } else paginate(x.s, x.pt, x.pb, usable);
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
