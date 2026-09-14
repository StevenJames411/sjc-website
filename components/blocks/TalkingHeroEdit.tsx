"use client";
// THE HERO CANVAS, INSIDE THE STUDIO (ruled 2026-09-12). The same TalkingHero renders on the
// page; this wrapper only exists while Puck is editing. It owns which screen is being placed
// (laptop or phone), which element is selected, the strip of controls above the hero, and the one
// way anything is written back: a Puck `replace` of this block's props — so Save, Undo and Publish
// are the studio's own, and the layout is data on the page like every other word on it.
//
// Loaded with next/dynamic (ssr off) from TalkingHeroSwitch so @measured/puck's hooks never enter
// the public bundle — usePuck throws outside <Puck>, and the public page has no <Puck>.

import { useEffect, useMemo, useRef, useState } from "react";
import { registerOverlayPortal, usePuck } from "@measured/puck";
import SizeStepper from "@/components/puck/SizeStepper";
import TalkingHero, { type TalkingHeroProps, type HeroEditApi } from "./TalkingHero";
import {
  HERO_LAYOUT_DEFAULTS, HERO_SCREENS, HERO_SCREEN_LABEL, NEW_LINE_DEFAULT, cloneLayouts, heroLabel, heroText, isExtra, newExtraId, withLayoutDefaults,
  type HeroElement, type HeroExtraLine, type HeroLayouts, type HeroScreen, type HeroText, type HeroTextElement,
} from "./talkingHeroLayout";

type Screen = HeroScreen;

export default function TalkingHeroEdit(props: Partial<TalkingHeroProps> & { id: string }) {
  const { id, ...rest } = props;
  const { dispatch, getItemById, getSelectorForId, history } = usePuck();
  const [screen, setScreen] = useState<Screen>("laptop");
  const [selected, setSelected] = useState<HeroElement | null>(null);

  const layouts = useMemo(() => withLayoutDefaults(rest.layout), [rest.layout]);

  // ⛔ PUCK EATS CLICKS INSIDE A BLOCK. Its wrapper listens natively for `click`, calls
  // stopPropagation (so React's root never hears it) and selects the block — which is why the
  // Tablet tab did nothing the first time (09-12). registerOverlayPortal is Puck's own door for
  // controls that live inside a block: it marks the strip so the wrapper lets its clicks through,
  // and with disableDrag it stops a press on the strip from dragging the block.
  const strip = useRef<HTMLDivElement>(null);
  useEffect(() => registerOverlayPortal(strip.current, { disableDrag: true, disableDragOnFocus: false }), []);

  // The single write path. Reads the block's CURRENT props from Puck (not from this render's
  // props, which can lag one commit behind during a fast drag-then-type), patches, replaces.
  type Words = Partial<TalkingHeroProps> | ((cur: Partial<TalkingHeroProps>) => Partial<TalkingHeroProps>);
  function write(next: (l: HeroLayouts) => HeroLayouts, words?: Words) {
    const item = getItemById(id);
    const sel = getSelectorForId(id);
    if (!item || !sel) return;
    const curProps = item.props as Partial<TalkingHeroProps>;
    const cur = withLayoutDefaults(curProps.layout);
    const w = typeof words === "function" ? words(curProps) : words;
    dispatch({
      type: "replace",
      destinationIndex: sel.index,
      destinationZone: sel.zone,
      data: { ...item, props: { ...item.props, ...(w || {}), layout: next(cloneLayouts(cur)) } },
    });
  }
  const extraOf = (p: Partial<TalkingHeroProps>): HeroExtraLine[] => Array.isArray(p.extra) ? p.extra : [];
  const wordsOf = (p: Partial<TalkingHeroProps>, el: HeroTextElement): string =>
    isExtra(el) ? (extraOf(p).find((x) => x.id === el)?.text || "") : String(p[el] || "");

  // ── + Text · Copy · Remove (09-13: "when I'm on the canvas and want to add another text block") ──
  // A new line lands on all three screens at once (each at that screen's default spot), so the
  // tablet and phone never open with a line missing. Copy clones the selected line's words and
  // its place on every screen, a step down so the two are not on top of each other. Remove only
  // ever removes an added line — the core four are the page's own words and stay.
  function addLine(from?: HeroTextElement) {
    const nid = newExtraId();
    write(
      (l) => {
        for (const sc of HERO_SCREENS) {
          const src = from ? heroText(l[sc], from, sc) : NEW_LINE_DEFAULT[sc];
          l[sc].extra[nid] = { ...src, y: from ? Math.min(92, +(src.y + 7).toFixed(2)) : src.y };
        }
        return l;
      },
      (p) => ({ extra: [...extraOf(p), { id: nid, text: from ? wordsOf(p, from) : "New line" }] }),
    );
    setSelected(nid);
  }
  function removeLine(el: HeroElement) {
    if (!isExtra(el)) return;
    write(
      (l) => { for (const sc of HERO_SCREENS) delete l[sc].extra[el]; return l; },
      (p) => ({ extra: extraOf(p).filter((x) => x.id !== el) }),
    );
    setSelected(null);
  }

  // Selecting a thing on the hero also selects the block in the studio, so the side panel shows
  // this block's fields (its words) and never a half-state. Presses on the canvas are stopped
  // before Puck sees them, so Puck would otherwise never learn the block was picked.
  const selectBlock = () => {
    const sel = getSelectorForId(id);
    if (sel) dispatch({ type: "setUi", ui: { itemSelector: { index: sel.index, zone: sel.zone } } });
  };

  const api: HeroEditApi = {
    screen,
    selected,
    onSelect: (el) => { setSelected(el); if (el) selectBlock(); },
    onPatch: (el, patch) => {
      const clean: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(patch)) if (v !== undefined) clean[k] = v;
      write((l) => {
        if (isExtra(el)) l[screen].extra[el] = { ...heroText(l[screen], el, screen), ...clean } as HeroText;
        else Object.assign(l[screen][el] as object, clean);
        return l;
      });
    },
    onText: (el, text) =>
      isExtra(el)
        ? write((l) => l, (p) => ({ extra: extraOf(p).map((x) => (x.id === el ? { ...x, text } : x)) }))
        : write((l) => l, { [el]: text }),
  };

  const cur: HeroText | { size: number } | null = selected
    ? (selected === "orb" ? layouts[screen].orb : heroText(layouts[screen], selected, screen))
    : null;
  const isText = selected && selected !== "orb";
  const text = isText ? (cur as HeroText) : null;
  const headlineOnPhone = screen === "phone" && selected === "headline";

  // The thing directly above the selected one on this screen (highest y below the selected y),
  // for "Centre under the line above" (09-13 pm) — a one-click version of the smart guide.
  const lineAbove = useMemo((): { el: HeroElement; x: number } | null => {
    if (!selected) return null;
    const L = layouts[screen];
    const yOf = (el: HeroElement) => (el === "orb" ? L.orb.y : heroText(L, el, screen).y);
    const xOf = (el: HeroElement) => (el === "orb" ? L.orb.x : heroText(L, el, screen).x);
    const all: HeroElement[] = ["headline", "byline", "opener", "orb", ...extraOf(rest).map((x) => x.id as HeroElement)];
    const mine = yOf(selected);
    let best: HeroElement | null = null;
    for (const el of all) if (el !== selected && yOf(el) < mine && (best === null || yOf(el) > yOf(best))) best = el;
    return best ? { el: best, x: xOf(best) } : null;
  }, [selected, layouts, screen, rest]);

  return (
    <div className="th-editwrap">
      <div className="th-strip" ref={strip}>
        <div className="th-strip-group" role="tablist" aria-label="Screen">
          {HERO_SCREENS.map((s) => (
            <button key={s} type="button" role="tab" aria-selected={screen === s} onClick={() => { setScreen(s); setSelected(null); }}>{HERO_SCREEN_LABEL[s]}</button>
          ))}
        </div>

        <span className="th-strip-sel">
          {selected ? heroLabel(selected) : "Click a thing on the hero to place it · drag to move · click again to type"}
        </span>

        {selected ? (
          <div className="th-strip-group">
            {headlineOnPhone ? (
              <span className="th-strip-note">22px on a phone — every hero headline, his law</span>
            ) : (
              <SizeStepper
                label=""
                value={(cur as { size: number }).size}
                onChange={(v) => api.onPatch(selected, { size: Math.max(selected === "orb" ? 40 : 8, v ?? 0) })}
                fallback={(cur as { size: number }).size}
                step={selected === "orb" ? 8 : 2}
                min={selected === "orb" ? 40 : 8}
                allowZero={false}
              />
            )}
          </div>
        ) : null}

        {text && selected ? (
          <>
            <div className="th-strip-group">
              <button type="button" aria-pressed={text.color === "white"} onClick={() => api.onPatch(selected, { color: "white" })}>White</button>
              <button type="button" aria-pressed={text.color === "gold"} onClick={() => api.onPatch(selected, { color: "gold" })}>Gold</button>
              <button type="button" aria-pressed={text.bold} onClick={() => api.onPatch(selected, { bold: !text.bold })}>Bold</button>
            </div>
            <div className="th-strip-group">
              <button type="button" aria-pressed={text.align === "left"} onClick={() => api.onPatch(selected, { align: "left" })}>Left</button>
              <button type="button" aria-pressed={text.align === "center"} onClick={() => api.onPatch(selected, { align: "center" })}>Centre</button>
              <button type="button" aria-pressed={text.align === "right"} onClick={() => api.onPatch(selected, { align: "right" })}>Right</button>
              <button type="button" aria-pressed={!!text.w} title="Let the words wrap inside a set width; drag the dot to change it" onClick={() => api.onPatch(selected, { w: text.w ? null : 50 })}>Wrap</button>
            </div>
          </>
        ) : null}

        {selected ? (
          <div className="th-strip-group">
            <button type="button" title="Put this thing dead centre, left to right, on this screen" onClick={() => api.onPatch(selected, { x: 50 })}>Centre on page</button>
            <button
              type="button"
              disabled={!lineAbove}
              title={lineAbove ? `Put this thing on the same centre line as the ${heroLabel(lineAbove.el).toLowerCase()} above it` : "Nothing sits above this thing on this screen"}
              onClick={() => lineAbove && api.onPatch(selected, { x: lineAbove.x })}
            >
              Centre under the line above
            </button>
          </div>
        ) : null}

        <div className="th-strip-group">
          <button type="button" title="Add another line of text to the hero (it lands on every screen)" onClick={() => addLine()}>+ Text</button>
          {text && selected ? (
            <button type="button" title="Copy this line — same words, same place, one step down" onClick={() => addLine(selected as HeroTextElement)}>Copy</button>
          ) : null}
          {selected && isExtra(selected) ? (
            <button type="button" title="Remove this added line from every screen" onClick={() => removeLine(selected)}>Remove</button>
          ) : null}
        </div>

        <div className="th-strip-group th-strip-end">
          <button type="button" onClick={() => history.back()} disabled={!history.hasPast} title="Undo the last change (the studio's own undo)">↶ Undo</button>
          <button
            type="button"
            title="Put every element on THIS screen back where it started"
            onClick={() => write((l) => { l[screen] = cloneLayouts(HERO_LAYOUT_DEFAULTS)[screen]; return l; })}
          >
            Reset {screen}
          </button>
          <button
            type="button"
            title="Clear this browser's conversation thread and reload — test the opener fresh"
            onClick={() => { try { window.localStorage.removeItem("agent-session"); } catch {} window.location.reload(); }}
          >
            Start over
          </button>
        </div>
      </div>

      <TalkingHero {...rest} layout={layouts} edit={api} />
    </div>
  );
}
