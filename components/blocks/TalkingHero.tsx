"use client";
// THE TALKING HERO (ruled 2026-09-11): Steven IS the orb. The hero of the page is a live, spoken,
// back-and-forth conversation with his AI twin — no two-column video, no floating button. The room
// (his idle loop) is the whole canvas; the page's headline sits over it; one tap starts the talk.
// Level 4 of the build (the live HeyGen face) mounts into the same face panel later; the idle loop
// is what plays before the first tap and whenever the stream is off. Draft-mode safe: it is a Puck
// block, so it ships to a page only when Steven publishes that page.
//
// THE LAYOUT IS PLACED BY HAND, ON THE PAGE, IN THE STUDIO (ruled 2026-09-12). Four things float
// over the room — the headline, the question, the first line, and the orb — each with a position
// in % and a size in px, one set for a laptop and one for a phone. `layout` null = the original
// grid (what the draft carried before this existed). When the studio hands this block an `edit`
// api, the same elements become draggable, resizable and typeable in place; nothing about the
// public render changes, it only gains handles. See talkingHeroLayout.ts for the shape.

import { useEffect, useRef, useState, type CSSProperties, type ReactNode, type PointerEvent as RPointerEvent } from "react";
import { useAgentThread, AGENT_NAME } from "@/lib/useAgentThread";
import {
  HERO_BREAKS, HERO_ELEMENT_LABEL, HERO_FRAME_WIDTH, splitGold, withLayoutDefaults,
  type HeroElement, type HeroLayout, type HeroLayouts, type HeroScreen, type HeroText,
} from "./talkingHeroLayout";

export type TalkingHeroProps = {
  eyebrow: string;
  headline: string;
  byline: string;
  opener: string;        // the first line the visitor READS before tapping (the twin says it once they tap)
  ctaTalk: string;
  ctaType: string;
  idleWide: string;      // 16:9 idle loop (laptop)
  idleTall: string;      // 9:16 idle loop (phone)
  poster: string;
  videoUrl: string;      // the 3-minute version — a play button appears only when set
  videoLabel: string;
  minHeight: number;     // laptop canvas height in vh
  layout: HeroLayouts | null; // null = the original grid; set = placed by hand in the studio
};

export const TALKING_HERO_DEFAULTS: TalkingHeroProps = {
  eyebrow: "Steven James Consulting",
  headline: "Everybody wants more leads. Everybody wants more revenue.",
  byline: "Your 2026 Growth Partner",
  opener: "Welcome. This website is like none other — you can actually talk to it, and you're talking to me. I help business owners grow: more leads, more customers, more revenue. Is that what you're here for?",
  ctaTalk: "Tap and I'll talk to you",
  ctaType: "Type instead",
  idleWide: "https://ddhmhtqvn5lepkpr.public.blob.vercel-storage.com/sites/sjc-website/hero/idle-wide-v1.mp4",
  idleTall: "https://ddhmhtqvn5lepkpr.public.blob.vercel-storage.com/sites/sjc-website/hero/idle-tall-v1.mp4",
  poster: "",
  videoUrl: "",
  videoLabel: "Watch the 3-minute version",
  minHeight: 86,
  layout: null,
};

/** What the studio hands the block while editing. Absent on the public page. */
export type HeroEditApi = {
  screen: HeroScreen;
  selected: HeroElement | null;
  onSelect: (el: HeroElement | null) => void;
  /** Commit a position/size change for one element on the CURRENT screen. */
  onPatch: (el: HeroElement, patch: Partial<HeroText> & { size?: number; x?: number; y?: number }) => void;
  /** Commit new words for a text element (the headline keeps "|" for the gold half). */
  onText: (el: "headline" | "byline" | "opener", text: string) => void;
};

const DRAG_START_PX = 4; // less than this is a click, more is a drag

// Which of the three layouts the visitor gets: phone ≤ 640 · tablet ≤ 1023 · laptop above. The
// studio forces one while placing. The lines match the CSS (tall film ≤ 1023, 22px h1 ≤ 640).
function useScreen(force?: HeroScreen): HeroScreen {
  const [screen, setScreen] = useState<HeroScreen>("laptop");
  useEffect(() => {
    if (force) return;
    const p = window.matchMedia(`(max-width: ${HERO_BREAKS.phoneMax}px)`);
    const t = window.matchMedia(`(max-width: ${HERO_BREAKS.tabletMax}px)`);
    const on = () => setScreen(p.matches ? "phone" : t.matches ? "tablet" : "laptop");
    on();
    p.addEventListener("change", on); t.addEventListener("change", on);
    return () => { p.removeEventListener("change", on); t.removeEventListener("change", on); };
  }, [force]);
  return force ?? screen;
}

export default function TalkingHero(p: Partial<TalkingHeroProps> & { edit?: HeroEditApi }) {
  const { edit, ...rest } = p;
  const props = { ...TALKING_HERO_DEFAULTS, ...rest };
  const t = useAgentThread({ pollMs: 1200 });
  const [mode, setMode] = useState<"idle" | "talk" | "type">("idle");
  const [draft, setDraft] = useState("");
  const [showVideo, setShowVideo] = useState(false);
  const started = useRef(false);
  const captionsEnd = useRef<HTMLDivElement>(null);
  const screen = useScreen(edit?.screen);
  const phone = screen === "phone";

  // Tell the floating orb it is not needed on this page — the hero IS the orb.
  useEffect(() => {
    document.documentElement.setAttribute("data-talking-hero", "1");
    window.dispatchEvent(new Event("sjc:talking-hero"));
    return () => {
      document.documentElement.removeAttribute("data-talking-hero");
      window.dispatchEvent(new Event("sjc:talking-hero"));
    };
  }, []);

  useEffect(() => {
    captionsEnd.current?.scrollIntoView({ block: "end" });
  }, [t.msgs, t.heard]);

  // The twin speaks first. A hidden "Hi" opens the thread; the reply is his opener, voiced.
  function begin(as: "talk" | "type") {
    if (edit) return; // in the studio the orb is a thing you place, not a thing you tap
    setMode(as);
    if (as === "talk") t.startHandsFree(); else t.setActive(true);
    if (!started.current) {
      started.current = true;
      t.send("Hi", { hidden: true });
    }
  }
  function toggleTalk() {
    if (edit) return;
    if (mode !== "talk") return begin("talk");
    if (t.handsFree()) { t.stopHandsFree(); setMode("idle"); } else { t.startHandsFree(); }
  }

  const visible = t.msgs.filter((m) => !m.hidden);
  const captions = visible.slice(-4);
  const state = t.listening ? "listening" : t.speaking ? "talking" : t.busy ? "thinking" : mode === "idle" ? "idle" : "ready";

  const room = (
    <div className="th-room" aria-hidden="true">
      {props.idleWide ? <video className="th-loop th-wide" src={props.idleWide} poster={props.poster || undefined} autoPlay muted loop playsInline preload="auto" /> : null}
      {props.idleTall ? <video className="th-loop th-tall" src={props.idleTall} poster={props.poster || undefined} autoPlay muted loop playsInline preload="auto" /> : null}
      <div className="th-shade" />
    </div>
  );

  const conversation = (
    <>
      <div className="th-captions" aria-live="polite">
        {mode === "idle" && visible.length === 0 ? (
          <p className="th-cap out">{props.opener}</p>
        ) : null}
        {captions.map((m) => (
          <p key={m.id} className={`th-cap ${m.direction === "inbound" ? "in" : "out"}`}>{m.body}</p>
        ))}
        {t.heard ? <p className="th-cap in hearing">{t.heard}</p> : null}
        {t.busy ? <p className="th-cap thinking">{AGENT_NAME} is thinking…</p> : null}
        <div ref={captionsEnd} />
      </div>
      {mode === "type" ? (
        <form className="th-input" onSubmit={(e) => { e.preventDefault(); t.send(draft); setDraft(""); }}>
          <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Type here…" autoFocus aria-label="Your message" />
          <button type="submit" disabled={t.busy}>Send</button>
        </form>
      ) : null}
    </>
  );

  const modal = showVideo && props.videoUrl ? (
    <div className="th-modal" role="dialog" aria-label={props.videoLabel} onClick={() => setShowVideo(false)}>
      <video src={props.videoUrl} controls autoPlay playsInline onClick={(e) => e.stopPropagation()} />
      <button className="th-close" aria-label="Close" onClick={() => setShowVideo(false)}>×</button>
    </div>
  ) : null;

  // ── THE ORIGINAL GRID — layout null. Untouched from 09-11 so nothing published moves. ──────────
  if (!props.layout && !edit) {
    return (
      <section className="sjc-design" data-sjc-talking-hero data-state={state} style={{ ["--th-min" as any]: `${props.minHeight}vh` }}>
        {room}
        <div className="th-words">
          {props.eyebrow ? <p className="th-eyebrow">{props.eyebrow}</p> : null}
          <h1>{props.headline}</h1>
          {props.byline ? <p className="th-byline">{props.byline}</p> : null}
        </div>
        <div className="th-talk">
          {conversation}
          <div className="th-controls">
            {mode === "talk" ? (
              <button className="th-mic" data-on={t.listening} onClick={toggleTalk}>
                {t.listening ? "Listening… tap to stop" : t.speaking ? `${AGENT_NAME} is talking… tap to stop` : t.busy ? `${AGENT_NAME} is thinking…` : "Tap to talk"}
              </button>
            ) : (
              <button className="th-mic" onClick={() => begin("talk")} disabled={!t.ready}>{props.ctaTalk}</button>
            )}
            {mode !== "type" ? (
              <button className="th-ghost" onClick={() => { t.stopHandsFree(); begin("type"); }} disabled={!t.ready}>{props.ctaType}</button>
            ) : (
              <button className="th-ghost" onClick={() => begin("talk")}>Talk instead</button>
            )}
            {props.videoUrl ? <button className="th-play" onClick={() => setShowVideo(true)}>▶ {props.videoLabel}</button> : null}
          </div>
          {!t.ready ? <p className="th-note">The conversation is switched off on this preview.</p> : null}
        </div>
        {modal}
      </section>
    );
  }

  // ── PLACED BY HAND — one layout per screen, every element at its own x/y/size. ────────────────
  const layouts = withLayoutDefaults(props.layout);
  const L: HeroLayout = layouts[screen];
  const { plain, gold } = splitGold(props.headline);

  const canvas = (
    <div className="th-canvas" data-screen={screen}>
      {room}
      {props.eyebrow ? <p className="th-eyebrow th-brand">{props.eyebrow}</p> : null}

      <Free el="headline" t={L.headline} edit={edit} phone={phone}>
        <h1 className="th-h1">{plain}{gold !== null ? <em>{gold}</em> : null}</h1>
      </Free>

      {props.byline || edit ? (
        <Free el="byline" t={L.byline} edit={edit} phone={phone}>
          <p className="th-q">{props.byline || (edit ? "Your question here" : "")}</p>
        </Free>
      ) : null}

      <Free el="opener" t={L.opener} edit={edit} phone={phone}>
        <div className="th-talk">{conversation}</div>
      </Free>

      <Orb x={L.orb.x} y={L.orb.y} size={L.orb.size} state={state} edit={edit} onTap={toggleTalk} ready={t.ready} />

      <div className="th-under" style={{ left: `${L.orb.x}%`, top: `calc(${L.orb.y}% + ${L.orb.size / 2 + 10}px)` }}>
        {mode === "idle" ? <span className="th-orblabel">{props.ctaTalk}</span> : null}
        {mode !== "type" ? (
          <button className="th-ghost th-small" onClick={() => { t.stopHandsFree(); begin("type"); }} disabled={!t.ready || !!edit}>{props.ctaType}</button>
        ) : (
          <button className="th-ghost th-small" onClick={() => begin("talk")}>Talk instead</button>
        )}
        {props.videoUrl ? <button className="th-play" onClick={() => setShowVideo(true)}>▶ {props.videoLabel}</button> : null}
      </div>
      {!t.ready && !edit ? <p className="th-note th-note-abs">The conversation is switched off on this preview.</p> : null}
    </div>
  );

  return (
    <section
      className="sjc-design"
      data-sjc-talking-hero
      data-layout=""
      data-state={state}
      data-screen={screen}
      data-editing={edit ? "" : undefined}
      style={{ ["--th-min" as any]: `${props.minHeight}vh` }}
      onPointerDown={edit ? (e) => { if ((e.target as HTMLElement).closest(".th-free, .th-orb")) return; edit.onSelect(null); } : undefined}
    >
      {edit && HERO_FRAME_WIDTH[edit.screen] ? <div className="th-frame" data-frame={edit.screen} style={{ width: HERO_FRAME_WIDTH[edit.screen]! }}>{canvas}</div> : canvas}
      {modal}
    </section>
  );
}

// ── one free-floating text element ─────────────────────────────────────────────────────────────
function Free({ el, t, edit, phone, children }: {
  el: "headline" | "byline" | "opener"; t: HeroText; edit?: HeroEditApi; phone: boolean; children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [live, setLive] = useState<Partial<HeroText> | null>(null); // while a drag is in flight
  const [typing, setTyping] = useState(false);
  const drag = useRef<{ kind: "move" | "size"; sx: number; sy: number; x: number; y: number; size: number; w: number | null; bw: number; cw: number; ch: number; moved: boolean } | null>(null);
  // The phone headline is 22px, always — his law (09-09, three rulings from his iPhone).
  const size = phone && el === "headline" ? 22 : (live?.size ?? t.size);
  const v = { ...t, ...live, size };
  const sel = edit?.selected === el;

  const style: CSSProperties = {
    left: `${v.x}%`, top: `${v.y}%`, fontSize: `${size}px`,
    width: v.w ? `${v.w}%` : "max-content", whiteSpace: v.w ? "normal" : "nowrap",
    textAlign: v.align, color: v.color === "gold" ? "#f0b323" : "#fff", fontWeight: v.bold ? 700 : 400,
  };

  function down(e: RPointerEvent<HTMLDivElement>, kind: "move" | "size") {
    if (!edit || typing) return;
    // ⛔ STOP IT NATIVELY, HERE, IN THE CAPTURE PHASE. Puck's drag layer listens natively on the
    // block wrapper; React's own stopPropagation runs at the root, after that listener has fired.
    e.nativeEvent.stopPropagation();
    const host = ref.current!.parentElement!.getBoundingClientRect();
    drag.current = { kind, sx: e.clientX, sy: e.clientY, x: t.x, y: t.y, size: t.size, w: t.w, bw: ref.current!.getBoundingClientRect().width, cw: host.width, ch: host.height, moved: false };
    ref.current!.setPointerCapture(e.pointerId);
    e.preventDefault(); e.stopPropagation();
  }
  function move(e: RPointerEvent<HTMLDivElement>) {
    const d = drag.current; if (!d) return;
    const dx = e.clientX - d.sx, dy = e.clientY - d.sy;
    if (!d.moved && Math.hypot(dx, dy) < DRAG_START_PX) return;
    d.moved = true;
    if (d.kind === "move") setLive({ x: d.x + (dx / d.cw) * 100, y: d.y + (dy / d.ch) * 100 });
    else {
      const k = Math.max(0.3, 1 + dx / Math.max(60, d.bw));
      setLive({ size: Math.max(8, Math.round(d.size * k)), w: d.w ? Math.max(10, Math.round(d.w * k)) : null });
    }
  }
  function up(e: RPointerEvent<HTMLDivElement>) {
    const d = drag.current; if (!d || !edit) return;
    drag.current = null;
    try { ref.current!.releasePointerCapture(e.pointerId); } catch {}
    if (d.moved && live) { edit.onPatch(el, { ...live, x: live.x !== undefined ? +live.x.toFixed(2) : undefined, y: live.y !== undefined ? +live.y.toFixed(2) : undefined }); setLive(null); return; }
    setLive(null);
    // A click, not a drag: select it, and if it was already selected, start typing in place.
    if (sel) startTyping(); else edit.onSelect(el);
  }
  function startTyping() {
    const node = ref.current?.querySelector<HTMLElement>(".th-text");
    if (!node || !edit) return;
    setTyping(true);
    node.setAttribute("contenteditable", "true");
    node.focus();
    const done = () => {
      node.removeAttribute("contenteditable");
      setTyping(false);
      edit.onText(el, extract(node));
    };
    node.addEventListener("blur", done, { once: true });
    node.addEventListener("keydown", (ev) => { if (ev.key === "Enter") { ev.preventDefault(); node.blur(); } if (ev.key === "Escape") node.blur(); });
  }

  return (
    <div
      ref={ref}
      className={`th-free th-${el}${sel ? " sel" : ""}${typing ? " typing" : ""}`}
      style={style}
      data-el={el}
      onPointerDownCapture={edit ? (e) => down(e, "move") : undefined}
      onPointerMove={edit ? move : undefined}
      onPointerUp={edit ? up : undefined}
      onPointerCancel={edit ? () => { drag.current = null; setLive(null); } : undefined}
    >
      <div className="th-text">{children}</div>
      {edit && sel ? (
        <>
          <span className="th-tag">{HERO_ELEMENT_LABEL[el]}{phone && el === "headline" ? " · 22px on a phone" : ` · ${size}px`}</span>
          <span className="th-handle" title="Drag to resize" onPointerDownCapture={(e) => down(e as any, "size")} />
        </>
      ) : null}
    </div>
  );
}

// Words back out of a contenteditable: text nodes stay, <em> becomes the "|" gold marker. Walks
// the whole tree — the em sits inside the h1, inside the box, and a one-level read lost the gold
// the first time it was typed into (09-12).
function extract(node: Node): string {
  let s = "";
  node.childNodes.forEach((n) => {
    if (n.nodeType === 3) s += n.textContent;
    else if ((n as HTMLElement).tagName === "EM") s += "|" + n.textContent;
    else if ((n as HTMLElement).tagName === "BR") s += " ";
    else s += extract(n);
  });
  return s.replace(/\s+/g, " ").trim();
}

// ── the orb — the one control on the page, never small ──────────────────────────────────────────
function Orb({ x, y, size, state, edit, onTap, ready }: {
  x: number; y: number; size: number; state: string; edit?: HeroEditApi; onTap: () => void; ready: boolean;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const [live, setLive] = useState<{ x: number; y: number } | null>(null);
  const drag = useRef<{ sx: number; sy: number; x: number; y: number; cw: number; ch: number; moved: boolean } | null>(null);
  const v = live ?? { x, y };
  const sel = edit?.selected === "orb";

  function down(e: RPointerEvent<HTMLButtonElement>) {
    if (!edit) return;
    e.nativeEvent.stopPropagation(); // see Free.down
    const host = ref.current!.parentElement!.getBoundingClientRect();
    drag.current = { sx: e.clientX, sy: e.clientY, x, y, cw: host.width, ch: host.height, moved: false };
    ref.current!.setPointerCapture(e.pointerId);
    e.preventDefault(); e.stopPropagation();
  }
  function move(e: RPointerEvent<HTMLButtonElement>) {
    const d = drag.current; if (!d) return;
    const dx = e.clientX - d.sx, dy = e.clientY - d.sy;
    if (!d.moved && Math.hypot(dx, dy) < DRAG_START_PX) return;
    d.moved = true;
    setLive({ x: d.x + (dx / d.cw) * 100, y: d.y + (dy / d.ch) * 100 });
  }
  function up(e: RPointerEvent<HTMLButtonElement>) {
    const d = drag.current; if (!d || !edit) return;
    drag.current = null;
    try { ref.current!.releasePointerCapture(e.pointerId); } catch {}
    if (d.moved && live) edit.onPatch("orb", { x: +live.x.toFixed(2), y: +live.y.toFixed(2) });
    else edit.onSelect("orb");
    setLive(null);
  }

  return (
    <button
      ref={ref}
      type="button"
      className={`th-orb${sel ? " sel" : ""}`}
      data-state={state}
      style={{ left: `${v.x}%`, top: `${v.y}%`, width: size, height: size }}
      aria-label={state === "idle" ? "Tap and I'll talk to you" : "Tap to stop"}
      disabled={!edit && !ready}
      onClick={edit ? undefined : onTap}
      onPointerDownCapture={edit ? down : undefined}
      onPointerMove={edit ? move : undefined}
      onPointerUp={edit ? up : undefined}
      onPointerCancel={edit ? () => { drag.current = null; setLive(null); } : undefined}
    >
      <svg viewBox="0 0 32 32" style={{ width: size * 0.56, height: size * 0.56 }} aria-hidden="true">
        <g><path d="M5 12h5l7-6v20l-7-6H5z" /><path d="M21 12.5a5 5 0 0 1 0 7" /><path d="M23.5 9.5a9 9 0 0 1 0 13" /><path d="M26 6.5a13 13 0 0 1 0 19" /></g>
        <path className="th-slash" d="M4 4l24 24" />
      </svg>
      {edit && sel ? <span className="th-tag">The orb · {size}px</span> : null}
    </button>
  );
}
