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
  HERO_ELEMENT_LABEL, HERO_LAYOUT_DEFAULTS, HERO_SCREENS, HERO_SCREEN_LABEL, cloneLayouts, withLayoutDefaults,
  type HeroElement, type HeroLayouts, type HeroScreen, type HeroText,
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
  function write(next: (l: HeroLayouts) => HeroLayouts, words?: Partial<TalkingHeroProps>) {
    const item = getItemById(id);
    const sel = getSelectorForId(id);
    if (!item || !sel) return;
    const cur = withLayoutDefaults((item.props as Partial<TalkingHeroProps>).layout);
    dispatch({
      type: "replace",
      destinationIndex: sel.index,
      destinationZone: sel.zone,
      data: { ...item, props: { ...item.props, ...(words || {}), layout: next(cloneLayouts(cur)) } },
    });
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
      write((l) => { Object.assign(l[screen][el] as object, clean); return l; });
    },
    onText: (el, text) => write((l) => l, { [el]: text }),
  };

  const cur = selected ? (layouts[screen][selected] as HeroText | { size: number }) : null;
  const isText = selected && selected !== "orb";
  const text = isText ? (cur as HeroText) : null;
  const headlineOnPhone = screen === "phone" && selected === "headline";

  return (
    <div className="th-editwrap">
      <div className="th-strip" ref={strip}>
        <div className="th-strip-group" role="tablist" aria-label="Screen">
          {HERO_SCREENS.map((s) => (
            <button key={s} type="button" role="tab" aria-selected={screen === s} onClick={() => { setScreen(s); setSelected(null); }}>{HERO_SCREEN_LABEL[s]}</button>
          ))}
        </div>

        <span className="th-strip-sel">
          {selected ? HERO_ELEMENT_LABEL[selected] : "Click a thing on the hero to place it · drag to move · click again to type"}
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
