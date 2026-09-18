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
import { useTwilioRelay } from "@/lib/useTwilioRelay";
import {
  HERO_BREAKS, HERO_FRAME_WIDTH, heroLabel, heroText, splitGold, withLayoutDefaults,
  type HeroElement, type HeroExtraLine, type HeroLayout, type HeroLayouts, type HeroScreen, type HeroText, type HeroTextElement,
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
  nudgeSeconds: number;  // silence before the first nudge line (placed layout only)
  nudgeCount: number;    // how many nudges before the call goes quiet
  extra: HeroExtraLine[]; // lines added from the strip ("+ Text", 09-13) — words here, places in `layout`
  // DEMO MODE (Steven, 09-13): "for now I just want the HeyGen example without the tap and type
  // under it... the demo with the HeyGen voice." "film" plays the rendered film in the room and
  // the orb is sound on/off — nothing under it, no thread, no agent. "live" is the real thing,
  // untouched, for when the back-and-forth is ready. Two different features, one block.
  mode: "film" | "live";
  filmWide: string;      // 16:9 film with its own voice (laptop)
  filmTall: string;      // 9:16 film (phone)
  // SPACE ABOVE / BELOW ARE INSIDE THE ROOM (Steven, 09-13: "I can't adjust the padding at the
  // top of the section"). The room stays full-bleed under the floating nav; these inset the STAGE
  // the placed things sit on, so everything moves down (or up) together and nothing paints white.
  spaceAbove: number;
  spaceBelow: number;
};

// The two lines a silent visitor hears — pre-cached on the voice server (Lane H) under these
// ids, so a nudge never waits on a cold GPU the way a fresh reply would.
const NUDGE_LINES = ["Still there? Take your time.", "I'll be right here when you're ready."];

// TWILIO CONVERSATIONRELAY, LAB ONLY (ruled 2026-09-18): ?relay=1 on a live-mode page swaps the
// text/browser-speech thread for a real phone call to Twilio's ConversationRelay — no number,
// natural turn timing. Voice IDs match voice_routes.py's RELAY_VOICES, picker only — the
// SERVER is the one place the default lives (Brian, picked by ear 2026-09-18): this page sends
// a `voice` param only when the URL names one, so there is no second default to drift.
const RELAY_VOICES: Record<string, string> = {
  "1": "CwhRBWXzGAHq8TQ4Fs17", // Roger — confident, warm, resonant American
  "2": "pqHfZKP75CvOlQylNhV4", // Bill — older, trustworthy American
  "3": "nPczCjzI2devNBz1zQrb", // Brian — deep, middle-aged American narration voice
  "4": "cjVigY5qzO86Huf0OWal", // Eric — warm, friendly American, smooth mid-40s
};

// THE TWIN'S MOVEMENT (ruled 2026-09-18, believable-movement-in-relay-mode): true lip-sync is
// impossible on ConversationRelay (Twilio generates the speech; the browser never gets the audio
// ahead of time to drive a mouth), so the twin NEVER mimes talking — mouth stays closed in every
// loop, and a separate ring/waveform signal (below) shows who is speaking. Three seamless loops,
// swapped by a state machine driven off the call's own volume events.
type TwinState = "idle" | "listening" | "engaged";
type TwinCrop = "wide" | "portrait";
type TwinLoopSet = { idle: string; listening: string; engaged: string; poster: string };
// ⛔ idle/listening/engaged are BLANK — every video vendor on hand was out of runway the day this
// was built (fal.ai balance exhausted, Gemini/Veo prepay depleted, Higgsfield has no key in .env);
// OpenRouter's image-to-video ignored the source photo outright and rendered a stranger. The poster
// is the real still (t=24s of film-1-heygen.mp4, mouth closed, eyes on camera) — TwinStage falls
// back to it correctly with every loop field blank, so this ships honest today and only needs URLs
// dropped in once a vendor is funded again.
const TWIN_LOOPS: Record<TwinCrop, TwinLoopSet> = {
  wide: {
    idle: "", listening: "", engaged: "",
    poster: "https://ddhmhtqvn5lepkpr.public.blob.vercel-storage.com/sites/sjc-website/hero/twin/idle-wide-poster.jpg",
  },
  portrait: {
    idle: "", listening: "", engaged: "",
    poster: "https://ddhmhtqvn5lepkpr.public.blob.vercel-storage.com/sites/sjc-website/hero/twin/idle-portrait-poster.jpg",
  },
};
function twinSrc(set: TwinLoopSet, state: TwinState): string {
  return set[state] || set.idle || "";
}
// outputVolume above this = the twin is speaking; inputVolume above this = the visitor is. Both
// 0-1 off the Voice JS SDK's 'volume' event — ASSUMPTION, never heard on a real call by this model;
// tune by ear against a live call before trusting the exact numbers.
const OUT_THRESHOLD = 0.05, IN_THRESHOLD = 0.06;
const ENGAGED_HOLD_MS = 300, LISTENING_HOLD_MS = 150;
// ?fakevol=1 (lab only — see relayOn below) drives the whole state machine without a real call, so
// the loop crossfade and the ring can be watched without anyone talking on the line: silence, then
// the visitor "speaks", a beat of silence, then the twin "speaks", then back to silence.
function fakeVolumes(t: number): [number, number] {
  const cycle = 12000, p = t % cycle;
  if (p < 3000) return [0, 0];
  if (p < 6000) return [0.25 + 0.5 * (0.5 + 0.5 * Math.sin((p - 3000) / 180)), 0];
  if (p < 6300) return [0, 0];
  if (p < 10000) return [0, 0.3 + 0.55 * (0.5 + 0.5 * Math.sin((p - 6300) / 220))];
  return [0, 0];
}

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
  nudgeSeconds: 8,
  nudgeCount: 2,
  extra: [],
  mode: "film",
  filmWide: "https://ddhmhtqvn5lepkpr.public.blob.vercel-storage.com/sites/sjc-website/hero/film/film-1-v1.mp4",
  filmTall: "https://ddhmhtqvn5lepkpr.public.blob.vercel-storage.com/sites/sjc-website/hero/film/film-1-tall-v2.mp4",
  spaceAbove: 0,
  spaceBelow: 0,
};

/** What the studio hands the block while editing. Absent on the public page. */
export type HeroEditApi = {
  screen: HeroScreen;
  selected: HeroElement | null;
  onSelect: (el: HeroElement | null) => void;
  /** Commit a position/size change for one element on the CURRENT screen. */
  onPatch: (el: HeroElement, patch: Partial<HeroText> & { size?: number; x?: number; y?: number }) => void;
  /** Commit new words for a text element (the headline keeps "|" for the gold half). */
  onText: (el: HeroTextElement, text: string) => void;
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
  // ?relay=1 on a live-mode page only — every other page, and live mode without the flag,
  // is untouched (Steven, 2026-09-18: rent the plumbing for the lab test). Voice id is sent
  // to the server ONLY when the URL names one — no voice param, no client-side default, so
  // the server's Brian default is the only default that exists (2026-09-18 pm).
  const [relayFlag, setRelayFlag] = useState(false);
  const [relayVoiceId, setRelayVoiceId] = useState("");
  // ?twin=wide (default) | portrait | off — an eye-comparison switch, not a breakpoint pick: it
  // forces the SAME crop into the canvas at any screen size so Steven can judge one against the
  // other. ?fakevol=1 exercises the state machine with no call on the line.
  const [twinParam, setTwinParam] = useState<"wide" | "portrait" | "off">("wide");
  const [fakevolFlag, setFakevolFlag] = useState(false);
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    setRelayFlag(sp.get("relay") === "1");
    const v = sp.get("voice");
    setRelayVoiceId((v && RELAY_VOICES[v]) || "");
    const tw = sp.get("twin");
    setTwinParam(tw === "portrait" ? "portrait" : tw === "off" ? "off" : "wide");
    setFakevolFlag(sp.get("fakevol") === "1");
  }, []);
  const relay = useTwilioRelay(relayVoiceId);
  const [mode, setMode] = useState<"idle" | "talk" | "type">("idle");
  const [draft, setDraft] = useState("");
  const [showVideo, setShowVideo] = useState(false);
  const started = useRef(false);
  const captionsEnd = useRef<HTMLDivElement>(null);
  // ⚠️ A block saved before these fields existed hands them over as undefined, and that would
  // override the default above (live mode, no film) — so undefined means the default here.
  const film = (props.mode || "film") === "film";
  const relayOn = !film && relayFlag; // live mode + ?relay=1 only
  const fakevolOn = relayOn && fakevolFlag; // never fires off the lab's own gate
  const twinCrop: TwinCrop = twinParam === "portrait" ? "portrait" : "wide";
  const useTwinStage = relayOn && twinParam !== "off";

  // ── THE TWIN'S STATE MACHINE — which loop plays. Polls the call's own volume refs (or the fake
  // oscillator) every frame; only re-renders when the DISCRETE state actually changes, never per
  // frame. A hold on each direction stops single-word gaps from flapping the loop mid-sentence. ──
  const [twinState, setTwinState] = useState<TwinState>("idle");
  const twinStateRef = useRef<TwinState>("idle");
  useEffect(() => {
    if (!relayOn) { if (twinStateRef.current !== "idle") { twinStateRef.current = "idle"; setTwinState("idle"); } return; }
    let raf = 0; let engagedUntil = 0, listeningUntil = 0;
    const tick = () => {
      const now = performance.now();
      let inVol = 0, outVol = 0;
      if (fakevolOn) [inVol, outVol] = fakeVolumes(now);
      else if (relay.state === "live") { inVol = relay.inputVolume.current; outVol = relay.outputVolume.current; }
      if (outVol > OUT_THRESHOLD) engagedUntil = now + ENGAGED_HOLD_MS;
      if (inVol > IN_THRESHOLD) listeningUntil = now + LISTENING_HOLD_MS;
      const next: TwinState = now < engagedUntil ? "engaged" : now < listeningUntil ? "listening" : "idle";
      if (next !== twinStateRef.current) { twinStateRef.current = next; setTwinState(next); }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [relayOn, fakevolOn, relay.state]);

  // ── THE SPEAKING RING — a continuous level, independent of the discrete loop above. Writes a CSS
  // var straight onto the DOM node every frame (no React state per frame). `prefers-reduced-motion`
  // gets a fixed glow per state instead of the eased, ever-moving one. ──
  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => {
    const m = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(m.matches);
    const on = () => setReduceMotion(m.matches);
    m.addEventListener("change", on);
    return () => m.removeEventListener("change", on);
  }, []);
  const ringRef = useRef<HTMLSpanElement>(null);
  const waveRefs = useRef<Array<HTMLSpanElement | null>>([]);
  useEffect(() => {
    if (!relayOn || reduceMotion) return;
    let raf = 0; let easedIn = 0, easedOut = 0;
    const tick = () => {
      const now = performance.now();
      let inVol = 0, outVol = 0;
      if (fakevolOn) [inVol, outVol] = fakeVolumes(now);
      else if (relay.state === "live") { inVol = relay.inputVolume.current; outVol = relay.outputVolume.current; }
      easedIn += (inVol - easedIn) * 0.2;
      easedOut += (outVol - easedOut) * 0.2;
      const level = Math.max(easedIn, easedOut);
      const ring = ringRef.current;
      if (ring) {
        ring.style.setProperty("--th-ring-v", level.toFixed(3));
        ring.dataset.who = easedOut >= easedIn ? "twin" : "visitor";
      }
      waveRefs.current.forEach((el, i) => {
        if (!el) return;
        const h = 0.22 + (0.15 + level * 0.85) * (0.5 + 0.5 * Math.sin(now / 140 + i * 0.8));
        el.style.transform = `scaleY(${h.toFixed(3)})`;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [relayOn, reduceMotion, fakevolOn, relay.state]);
  useEffect(() => {
    if (!relayOn || !reduceMotion) return;
    const ring = ringRef.current;
    if (!ring) return;
    ring.style.setProperty("--th-ring-v", twinState === "engaged" ? "0.6" : twinState === "listening" ? "0.35" : "0");
    ring.dataset.who = twinState === "engaged" ? "twin" : "visitor";
  }, [relayOn, reduceMotion, twinState]);
  const filmWide = props.filmWide || TALKING_HERO_DEFAULTS.filmWide;
  const filmTall = props.filmTall || TALKING_HERO_DEFAULTS.filmTall;
  const [filmOn, setFilmOn] = useState(false); // sound on = the film restarts from the top with its voice
  const filmWideRef = useRef<HTMLVideoElement>(null);
  const filmTallRef = useRef<HTMLVideoElement>(null);
  function toggleFilm() {
    if (edit) return;
    const v = (window.innerWidth <= HERO_BREAKS.phoneMax ? filmTallRef.current : filmWideRef.current) || filmWideRef.current || filmTallRef.current;
    if (!v) return;
    if (v.muted) { v.muted = false; v.currentTime = 0; v.play().catch(() => {}); setFilmOn(true); }
    else { v.muted = true; setFilmOn(false); }
  }
  const screen = useScreen(edit?.screen);
  const phone = screen === "phone";
  const silenceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nudgesSent = useRef(0);

  // Tell the floating orb it is not needed on this page — the hero IS the orb.
  useEffect(() => {
    document.documentElement.setAttribute("data-talking-hero", "1");
    window.dispatchEvent(new Event("sjc:talking-hero"));
    return () => {
      document.documentElement.removeAttribute("data-talking-hero");
      window.dispatchEvent(new Event("sjc:talking-hero"));
    };
  }, []);

  // ── THE SILENCE NUDGES — placed layout only; the legacy grid is untouched (09-12 ruling). ─────
  // Armed every time the mic reopens on its own (hands-free listening, mid-call). Quiet for
  // `nudgeSeconds` -> one canned line, quiet again -> the second, then the call goes to sleep
  // exactly like a manual hang-up (stopHandsFree + idle) so a further tap resumes hands-free
  // without `begin()` ever re-sending the hidden "Hi" (started.current is already true).
  function clearSilence() {
    if (silenceTimer.current) { clearTimeout(silenceTimer.current); silenceTimer.current = null; }
  }
  useEffect(() => {
    if (edit || !props.layout) return; // studio, or the original grid: no auto-nudge
    if (mode !== "talk") { clearSilence(); return; }
    if (!t.listening) { clearSilence(); return; }
    clearSilence();
    const seconds = Math.max(1, props.nudgeSeconds || 8);
    silenceTimer.current = setTimeout(() => {
      if (nudgesSent.current < Math.max(0, props.nudgeCount ?? 2)) {
        nudgesSent.current += 1;
        const line = NUDGE_LINES[nudgesSent.current - 1] || NUDGE_LINES[NUDGE_LINES.length - 1];
        t.speakSystemLine(`nudge-${nudgesSent.current}`, line);
      } else {
        t.stopHandsFree();
        setMode("idle");
        nudgesSent.current = 0;
      }
    }, seconds * 1000);
    return clearSilence;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t.listening, mode, props.layout, props.nudgeSeconds, props.nudgeCount, edit]);

  // Real activity (the visitor's own words landing in the thread) resets the nudge count, so a
  // second quiet stretch later in the same call still gets both lines, not zero.
  useEffect(() => {
    const last = t.msgs[t.msgs.length - 1];
    if (last && last.direction === "inbound") nudgesSent.current = 0;
  }, [t.msgs]);

  // Leaving the page stops everything — mic, recognition, any playing audio. stopHandsFree()
  // already does all three; nothing here is new machinery, just calling it on unmount.
  useEffect(() => {
    return () => { clearSilence(); t.stopHandsFree(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
  const state = relayOn
    ? (relay.state === "connecting" ? "thinking" : relay.state === "live" ? "listening" : "idle")
    : film
    ? (filmOn ? "talking" : "idle")
    : t.listening ? "listening" : t.speaking ? "talking" : t.busy ? "thinking" : mode === "idle" ? "idle" : "ready";

  const room = film ? (
    <div className="th-room" aria-hidden="true">
      {filmWide ? <video ref={filmWideRef} className="th-loop th-wide" src={filmWide} poster={props.poster || undefined} autoPlay muted loop playsInline preload="auto" /> : null}
      {filmTall ? <video ref={filmTallRef} className="th-loop th-tall" src={filmTall} poster={props.poster || undefined} autoPlay muted loop playsInline preload="auto" /> : null}
    </div>
  ) : (
    <div className="th-room" aria-hidden="true">
      {props.idleWide ? <video className="th-loop th-wide" src={props.idleWide} poster={props.poster || undefined} autoPlay muted loop playsInline preload="auto" /> : null}
      {props.idleTall ? <video className="th-loop th-tall" src={props.idleTall} poster={props.poster || undefined} autoPlay muted loop playsInline preload="auto" /> : null}
    </div>
  );

  const relayStatusLine =
    relay.state === "connecting" ? "Connecting…" :
    relay.state === "live" ? `Live — talk to ${AGENT_NAME} now.` :
    relay.error ? `Call ended: ${relay.error}` :
    relay.state === "ended" ? "Call ended. Tap the orb to call again." :
    "Tap the orb to start a real phone call — Twilio ConversationRelay.";

  const conversation = relayOn ? (
    <div className="th-captions" aria-live="polite">
      <p className="th-cap out">{relayStatusLine}</p>
    </div>
  ) : (
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
            {relayOn ? (
              <button className="th-mic" onClick={relay.toggle} disabled={!t.ready}>
                {relay.state === "connecting" ? "Connecting…" : relay.state === "live" ? "Live — tap to hang up" : "Tap to call (Twilio relay)"}
              </button>
            ) : mode === "talk" ? (
              <button className="th-mic" data-on={t.listening} onClick={toggleTalk}>
                {t.listening ? "Listening… tap to stop" : t.speaking ? `${AGENT_NAME} is talking… tap to stop` : t.busy ? `${AGENT_NAME} is thinking…` : "Tap to talk"}
              </button>
            ) : (
              <button className="th-mic" onClick={() => begin("talk")} disabled={!t.ready}>{props.ctaTalk}</button>
            )}
            {relayOn ? null : mode !== "type" ? (
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
  // THE CENTRE LINE (09-13: "I'm having to eyeball where center is"). While a thing is dragged
  // within SNAP_PCT of the canvas's middle, a dashed line shows and the thing locks to x = 50.
  const [guide, setGuide] = useState<Guide | null>(null);
  const layouts = withLayoutDefaults(props.layout);
  const L: HeroLayout = layouts[screen];
  const { plain, gold } = splitGold(props.headline);

  const canvas = (
    <div className="th-canvas" data-screen={screen}>
      {room}
      {/* No brand line here: the site's navigation is a global block and carries the name on every
          page (Steven, 09-12: "we have it on two different blocks now"). The eyebrow field stays
          for the original grid only. */}

      {/* The stage: every placed thing lives here, inset from the room's edges by Space above /
          below. Drags measure against this box, so a % position is a % of the stage. */}
      <div className="th-stage" style={{ top: Math.max(0, props.spaceAbove || 0), bottom: Math.max(0, props.spaceBelow || 0) }}>
      {edit && guide?.v !== null && guide?.v !== undefined ? <div className={`th-guide-v${guide.vPage ? "" : " el"}`} style={{ left: `${guide.v}%` }} aria-hidden="true" /> : null}
      {edit && guide?.h !== null && guide?.h !== undefined ? <div className="th-guide-h" style={{ top: `${guide.h}%` }} aria-hidden="true" /> : null}

      <Free el="headline" t={L.headline} edit={edit} phone={phone} onGuide={setGuide}>
        <h1 className="th-h1">{plain}{gold !== null ? <em>{gold}</em> : null}</h1>
      </Free>

      {props.byline || edit ? (
        <Free el="byline" t={L.byline} edit={edit} phone={phone} onGuide={setGuide}>
          <p className="th-q">{props.byline || (edit ? "Your question here" : "")}</p>
        </Free>
      ) : null}

      {film ? (
        props.opener || edit ? (
          <Free el="opener" t={L.opener} edit={edit} phone={phone} onGuide={setGuide}>
            <p className="th-q">{props.opener || (edit ? "First line (blank hides it)" : "")}</p>
          </Free>
        ) : null
      ) : (
        <Free el="opener" t={L.opener} edit={edit} phone={phone} onGuide={setGuide}>
          <div className="th-talk">{conversation}</div>
        </Free>
      )}

      {(props.extra || []).map((x) => (
        <Free key={x.id} el={x.id as HeroTextElement} t={heroText(L, x.id as HeroTextElement, screen)} edit={edit} phone={phone} onGuide={setGuide}>
          <p className="th-q">{x.text || (edit ? "Type here" : "")}</p>
        </Free>
      ))}

      <Orb x={L.orb.x} y={L.orb.y} size={L.orb.size} state={state} edit={edit} onTap={film ? toggleFilm : relayOn ? relay.toggle : toggleTalk} ready={film || t.ready} onGuide={setGuide} />

      {/* Under the orb — LIVE MODE ONLY; in film mode the orb stands alone. The words and the
          type button each show only when their field has words: blank it and it is gone (09-13). */}
      {film ? null : (
      <div className="th-under" style={{ left: `${L.orb.x}%`, top: `calc(${L.orb.y}% + ${L.orb.size / 2 + 10}px)` }}>
        {relayOn ? null : mode === "idle" && props.ctaTalk ? <span className="th-orblabel">{props.ctaTalk}</span> : null}
        {relayOn ? null : !props.ctaType ? null : mode !== "type" ? (
          <button className="th-ghost th-small" onClick={() => { t.stopHandsFree(); begin("type"); }} disabled={!t.ready || !!edit}>{props.ctaType}</button>
        ) : (
          <button className="th-ghost th-small" onClick={() => begin("talk")}>Talk instead</button>
        )}
        {props.videoUrl ? <button className="th-play" onClick={() => setShowVideo(true)}>▶ {props.videoLabel}</button> : null}
      </div>
      )}
      {!film && !t.ready && !edit ? <p className="th-note th-note-abs">The conversation is switched off on this preview.</p> : null}
      </div>
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

// Snap a dragged centre line to the canvas middle when it is close. Returns the x to use and
// whether the guide should show. The threshold is in % of the canvas so it feels the same on
// every screen (~1.5% is about 20px on a laptop, 6px on a phone frame).
const SNAP_PCT = 1.5;

// ── SMART GUIDES (09-13 pm: "when I use a text block down below, there's nothing to center off
// of"). The page's middle was the only guide, and a short line in the column beside him is not
// meant to sit on the page's middle — it is meant to sit on the line above it. So a drag now
// measures every OTHER thing on the stage and snaps to it, the way Keynote does:
//   • centre to centre (a white dashed line through both)   • left edge to left edge, right to right
//   • middle to middle (up and down)                          • equal gap: the space above the dragged
//     line matches the space above the line above it, so three lines stack evenly.
// The page's own middle keeps its gold line and wins a tie. Everything is measured from the DOM
// at the moment the drag starts, in % of the stage, so it is right for whatever font or wrap
// the other lines have — nothing here reads the stored layout.
type Guide = { v: number | null; vPage: boolean; h: number | null };
type Box = { l: number; r: number; cx: number; t: number; b: number; cy: number };
// Offsets of the dragged thing's own box from its stored (x, y), so a box at any (x, y) is known.
type SelfBox = { dl: number; dr: number; dt: number; db: number };

function boxOf(n: Element, host: DOMRect): Box {
  const r = n.getBoundingClientRect();
  const l = ((r.left - host.left) / host.width) * 100, rr = ((r.right - host.left) / host.width) * 100;
  const t = ((r.top - host.top) / host.height) * 100, b = ((r.bottom - host.top) / host.height) * 100;
  return { l, r: rr, cx: (l + rr) / 2, t, b, cy: (t + b) / 2 };
}
/** Every other placed thing on the stage, plus the dragged thing's own box relative to (x, y). */
function measureStage(self: HTMLElement, x: number, y: number): { others: Box[]; me: SelfBox } {
  const stage = self.parentElement!;
  const host = stage.getBoundingClientRect();
  const inner = (n: Element) => n.querySelector(".th-text") || n; // the words, not their padding
  const others: Box[] = [];
  stage.querySelectorAll(".th-free:not(.hid), .th-orb").forEach((n) => { if (n !== self) others.push(boxOf(inner(n), host)); });
  const mine = boxOf(inner(self), host);
  return { others, me: { dl: mine.l - x, dr: mine.r - x, dt: mine.t - y, db: mine.b - y } };
}
/** Snap a dragged (x, y) to the page middle or to any other thing within SNAP_PCT. */
function snapSmart(x: number, y: number, me: SelfBox, others: Box[]): { x: number; y: number; guide: Guide | null } {
  const l = x + me.dl, r = x + me.dr, cx = (l + r) / 2, t = y + me.dt, b = y + me.db, cy = (t + b) / 2;
  // left to right: the page's middle first, then every other thing
  type XHit = { d: number; at: number; page: boolean }; type YHit = { d: number; at: number };
  const hit: { x: XHit | null; y: YHit | null } = { x: Math.abs(50 - cx) <= SNAP_PCT ? { d: 50 - cx, at: 50, page: true } : null, y: null };
  const tryX = (d: number, at: number) => { if (Math.abs(d) <= SNAP_PCT && (!hit.x || Math.abs(d) < Math.abs(hit.x.d))) hit.x = { d, at, page: false }; };
  for (const o of others) { tryX(o.cx - cx, o.cx); tryX(o.l - l, o.l); tryX(o.r - r, o.r); }
  // up and down: middles, and equal gaps
  const tryY = (d: number, at: number) => { if (Math.abs(d) <= SNAP_PCT && (!hit.y || Math.abs(d) < Math.abs(hit.y.d))) hit.y = { d, at }; };
  for (const o of others) tryY(o.cy - cy, o.cy);
  // equal gap: A is the nearest thing above the dragged one, B the nearest above A; the dragged
  // top wants to sit (A.t - B.b) below A.b — the same gap twice.
  const above = others.filter((o) => o.b <= t + SNAP_PCT).sort((p, q) => q.b - p.b)[0];
  if (above) {
    const aboveA = others.filter((o) => o !== above && o.b <= above.t + 0.5).sort((p, q) => q.b - p.b)[0];
    if (aboveA) { const want = above.b + (above.t - aboveA.b); tryY(want - t, want); }
  }
  const gx = hit.x, gy = hit.y;
  return {
    x: gx ? x + gx.d : x,
    y: gy ? y + gy.d : y,
    guide: gx || gy ? { v: gx ? gx.at : null, vPage: !!gx?.page, h: gy ? gy.at : null } : null,
  };
}

// ── one free-floating text element ─────────────────────────────────────────────────────────────
function Free({ el, t, edit, phone, children, onGuide }: {
  el: HeroTextElement; t: HeroText; edit?: HeroEditApi; phone: boolean; children: ReactNode; onGuide?: (g: Guide | null) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [live, setLive] = useState<Partial<HeroText> | null>(null); // while a drag is in flight
  const [typing, setTyping] = useState(false);
  const drag = useRef<{ kind: "move" | "size"; sx: number; sy: number; x: number; y: number; size: number; w: number | null; bw: number; cw: number; ch: number; moved: boolean; others: Box[]; me: SelfBox } | null>(null);
  // 22px is the phone headline's DEFAULT (his 09-09 law, derived for a 375 phone), no longer a
  // lock: on 09-13 pm he selected it on the phone canvas to make it smaller and had no control.
  const size = live?.size ?? t.size;
  const v = { ...t, ...live, size };
  const sel = edit?.selected === el;
  // Hidden on this screen: gone from the page, a ghost in the studio so it can be selected and shown again.
  const hidden = !!t.hidden;

  const style: CSSProperties = {
    left: `${v.x}%`, top: `${v.y}%`, fontSize: `${size}px`,
    width: v.w ? `${v.w}%` : "max-content", whiteSpace: v.w ? "normal" : "nowrap",
    textAlign: v.align, color: v.color === "gold" ? "#f0b323" : "#fff", fontWeight: v.bold ? 700 : 400,
  };
  // THE PLATE (09-14): the room stays bright, and each line carries its own capsule — the nav
  // pill's navy, at the darkness he dials in on the strip. Nothing until he asks for it.
  const plate = Math.min(90, Math.max(0, typeof v.plate === "number" ? v.plate : 0));
  if (plate > 0) {
    style.background = `rgba(11, 23, 48, ${plate / 100})`;
    style.borderRadius = v.w ? ".7em" : "999px"; // a wrapped block is a rounded box, a single line a capsule
    style.padding = ".32em .85em";
    style.boxShadow = `0 0 0 1px rgba(240, 179, 35, ${Math.min(0.55, plate / 140)})`;
  }

  function down(e: RPointerEvent<HTMLDivElement>, kind: "move" | "size") {
    if (!edit || typing) return;
    // ⛔ STOP IT NATIVELY, HERE, IN THE CAPTURE PHASE. Puck's drag layer listens natively on the
    // block wrapper; React's own stopPropagation runs at the root, after that listener has fired.
    e.nativeEvent.stopPropagation();
    const host = ref.current!.parentElement!.getBoundingClientRect();
    drag.current = { kind, sx: e.clientX, sy: e.clientY, x: t.x, y: t.y, size: t.size, w: t.w, bw: ref.current!.getBoundingClientRect().width, cw: host.width, ch: host.height, moved: false, ...measureStage(ref.current!, t.x, t.y) };
    ref.current!.setPointerCapture(e.pointerId);
    e.preventDefault(); e.stopPropagation();
  }
  function move(e: RPointerEvent<HTMLDivElement>) {
    const d = drag.current; if (!d) return;
    const dx = e.clientX - d.sx, dy = e.clientY - d.sy;
    if (!d.moved && Math.hypot(dx, dy) < DRAG_START_PX) return;
    d.moved = true;
    if (d.kind === "move") {
      const m = snapSmart(d.x + (dx / d.cw) * 100, d.y + (dy / d.ch) * 100, d.me, d.others);
      onGuide?.(m.guide);
      setLive({ x: m.x, y: m.y });
    } else {
      const k = Math.max(0.3, 1 + dx / Math.max(60, d.bw));
      setLive({ size: Math.max(8, Math.round(d.size * k)), w: d.w ? Math.max(10, Math.round(d.w * k)) : null });
    }
  }
  function up(e: RPointerEvent<HTMLDivElement>) {
    const d = drag.current; if (!d || !edit) return;
    drag.current = null;
    onGuide?.(null);
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

  if (hidden && !edit) return null;
  return (
    <div
      ref={ref}
      className={`th-free th-${el}${sel ? " sel" : ""}${typing ? " typing" : ""}${hidden ? " hid" : ""}`}
      style={style}
      data-el={el}
      onPointerDownCapture={edit ? (e) => down(e, "move") : undefined}
      onPointerMove={edit ? move : undefined}
      onPointerUp={edit ? up : undefined}
      onPointerCancel={edit ? () => { drag.current = null; setLive(null); onGuide?.(null); } : undefined}
    >
      <div className="th-text">{children}</div>
      {edit && sel ? (
        <>
          <span className="th-tag">{heroLabel(el)} · {size}px{plate ? ` · plate ${plate}%` : ""}{hidden ? ` · hidden on ${edit.screen}` : ""}</span>
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

// ── the twin's room, relay mode only — two stacked <video> layers crossfade between the three
// closed-mouth loops; a plain <img> poster sits underneath both as the guaranteed fallback (no
// loop URL yet, or a loop that fails to load, both land here — never a black flash). ──────────────
function TwinStage({ state, srcs }: { state: TwinState; srcs: TwinLoopSet }) {
  const aRef = useRef<HTMLVideoElement>(null);
  const bRef = useRef<HTMLVideoElement>(null);
  const frontRef = useRef<"a" | "b">("a");
  const [front, setFront] = useState<"a" | "b">("a");
  const [srcA, setSrcA] = useState(() => twinSrc(srcs, state));
  const [srcB, setSrcB] = useState("");
  const [failedA, setFailedA] = useState(false);
  const [failedB, setFailedB] = useState(false);
  const current = useRef(twinSrc(srcs, state));

  useEffect(() => {
    const target = twinSrc(srcs, state);
    if (target === current.current) return;
    current.current = target;
    if (!target) return; // no clip for this state — stay on whatever is already showing
    const back = frontRef.current === "a" ? "b" : "a";
    (back === "a" ? setFailedA : setFailedB)(false);
    (back === "a" ? setSrcA : setSrcB)(target);
    const v = (back === "a" ? aRef : bRef).current;
    if (!v) return;
    let swapped = false;
    const swap = () => { if (swapped) return; swapped = true; frontRef.current = back; setFront(back); };
    v.oncanplay = swap;
    v.play().catch(() => {});
    const t = setTimeout(swap, 900); // don't hang the crossfade if canplay never fires
    return () => clearTimeout(t);
  }, [state, srcs]);

  return (
    <>
      {srcs.poster ? <img className="th-loop th-twin-poster" src={srcs.poster} alt="" /> : null}
      <video ref={aRef} className="th-loop th-twin-layer" style={{ opacity: front === "a" && srcA && !failedA ? 1 : 0 }}
        src={srcA || undefined} poster={srcs.poster || undefined} onError={() => setFailedA(true)}
        autoPlay muted loop playsInline preload="auto" />
      <video ref={bRef} className="th-loop th-twin-layer" style={{ opacity: front === "b" && srcB && !failedB ? 1 : 0 }}
        src={srcB || undefined} poster={srcs.poster || undefined} onError={() => setFailedB(true)}
        autoPlay muted loop playsInline preload="auto" />
    </>
  );
}

// ── the orb — the one control on the page, never small ──────────────────────────────────────────
function Orb({ x, y, size, state, edit, onTap, ready, onGuide, twin, ringRef, waveRefs }: {
  x: number; y: number; size: number; state: string; edit?: HeroEditApi; onTap: () => void; ready: boolean; onGuide?: (g: Guide | null) => void;
  twin?: boolean; ringRef?: React.Ref<HTMLSpanElement>; waveRefs?: React.MutableRefObject<Array<HTMLSpanElement | null>>;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const [live, setLive] = useState<{ x: number; y: number } | null>(null);
  const drag = useRef<{ sx: number; sy: number; x: number; y: number; cw: number; ch: number; moved: boolean; others: Box[]; me: SelfBox } | null>(null);
  const v = live ?? { x, y };
  const sel = edit?.selected === "orb";

  function down(e: RPointerEvent<HTMLButtonElement>) {
    if (!edit) return;
    e.nativeEvent.stopPropagation(); // see Free.down
    const host = ref.current!.parentElement!.getBoundingClientRect();
    drag.current = { sx: e.clientX, sy: e.clientY, x, y, cw: host.width, ch: host.height, moved: false, ...measureStage(ref.current!, x, y) };
    ref.current!.setPointerCapture(e.pointerId);
    e.preventDefault(); e.stopPropagation();
  }
  function move(e: RPointerEvent<HTMLButtonElement>) {
    const d = drag.current; if (!d) return;
    const dx = e.clientX - d.sx, dy = e.clientY - d.sy;
    if (!d.moved && Math.hypot(dx, dy) < DRAG_START_PX) return;
    d.moved = true;
    const m = snapSmart(d.x + (dx / d.cw) * 100, d.y + (dy / d.ch) * 100, d.me, d.others);
    onGuide?.(m.guide);
    setLive({ x: m.x, y: m.y });
  }
  function up(e: RPointerEvent<HTMLButtonElement>) {
    const d = drag.current; if (!d || !edit) return;
    drag.current = null;
    onGuide?.(null);
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
      onPointerCancel={edit ? () => { drag.current = null; setLive(null); onGuide?.(null); } : undefined}
    >
      <svg viewBox="0 0 32 32" style={{ width: size * 0.56, height: size * 0.56 }} aria-hidden="true">
        <g><path d="M5 12h5l7-6v20l-7-6H5z" /><path d="M21 12.5a5 5 0 0 1 0 7" /><path d="M23.5 9.5a9 9 0 0 1 0 13" /><path d="M26 6.5a13 13 0 0 1 0 19" /></g>
        <path className="th-slash" d="M4 4l24 24" />
      </svg>
      {edit && sel ? <span className="th-tag">The orb · {size}px</span> : null}
    </button>
  );
}
