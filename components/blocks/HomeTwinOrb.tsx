"use client";
// THE HOME HERO'S TALK ORB (2026-09-26) — Kay's orb, above Steven's white-polo cutout, above the
// existing Book A Call button. The builder's right column keeps its own <img data-sjc-img="i1">
// exactly as imported (zero visual change with JS off); this portals the orb + cutout stage on
// TOP of it, absolutely positioned against the photo's own measured box, so the column's flow
// height never changes and neither the eyebrow nor the left column ever move — UNTIL a call card
// is showing (09-27): that piece renders in NORMAL FLOW directly below the photo (its own slot,
// inserted once after the photo's wrapper), so his face stays fully visible and the column/page
// grow while it's up, same as Book A Call moving down. Never inside .sjc-twin-stage, never absolute.
//
// ⛔ FAST PATH ONLY (ruled 2026-09-27, live on camera 11am Central): the browser-speech-recognition
// / whole-reply-MP3 thread (useAgentThread, 18-38s of silence per turn) is OUT of this orb. The
// conversation is now a real Twilio ConversationRelay call (useTwilioRelay — the same engine proven
// on /voice-lab), server voice default (Brian) and server brain (SJC_TALK_MODEL=claude-opus-5) —
// no voice id sent from here, so the server's own default is the only default that exists. The
// cutout media (twin's muted-idle poster, talking loop, listening loop) is the film already shot
// and served from /sjc/roleplay/media/ (built 2026-09-19/20, roleplay_routes.py).

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTwilioRelay } from "@/lib/useTwilioRelay";
import CallCard, { CallCardData, SAMPLE_CARD } from "@/components/blocks/CallCard";
import { AGENT_PREFIX } from "@/lib/useAgentThread";

const AGENT_API = process.env.NEXT_PUBLIC_AGENT_API || "";
const MEDIA = "https://agent-sjc.onrender.com/sjc/roleplay/media/";
const ROLEPLAY = `${AGENT_API}/${AGENT_PREFIX}/roleplay`;
const CALLCARD_POLL_MS = 600;
const ORB_SIZE = 84;
// The orb's outer ring reaches 48px past its edge (Kay's pulse), so the gap must clear the RINGS, not
// the button — 14px put the rings on his head.
const ORB_GAP = 58;

// THE TWIN'S MOVEMENT SIGNAL, same thresholds/hold as TalkingHero's relay mode (ruled 2026-09-18,
// believable-movement-in-relay-mode) — reused, not reinvented. The orb only ever needs ONE boolean
// (is the twin talking right now), because during a live call the visitor's turn IS "listening" —
// there is no separate idle-while-live state here, unlike the hero's three-state machine.
const OUT_THRESHOLD = 0.05;
const ENGAGED_HOLD_MS = 300;

function videoExt(): string {
  if (typeof navigator === "undefined") return ".webm";
  const ua = navigator.userAgent;
  const safari = /Safari/.test(ua) && !/Chrome|Chromium|Android|CriOS|FxiOS|Edg/.test(ua);
  return safari ? ".mov" : ".webm";
}

const SPEAKER_SVG =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" />' +
  '<path d="M5.2 9.7v4.6h2.3l3.2 2.8V6.9L7.5 9.7z" /><path d="M13.3 9.6a3.4 3.4 0 0 1 0 4.8" />' +
  '<path d="M15.4 7.6a6.2 6.2 0 0 1 0 8.8" /></svg>';
// Steven 09-27: idle wears the MUTED speaker (the "tap me" look); a stop tap returns to it.
const MUTED_SVG =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" />' +
  '<path d="M5.2 9.7v4.6h2.3l3.2 2.8V6.9L7.5 9.7z" /><path d="M13.3 9.6a3.4 3.4 0 0 1 0 4.8" />' +
  '<path d="M15.4 7.6a6.2 6.2 0 0 1 0 8.8" /><path d="M4.9 4.9 19.1 19.1" /></svg>';
const MIC_SVG =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" />' +
  '<rect x="9.6" y="5.6" width="4.8" height="8.2" rx="2.4" /><path d="M7.4 11.6a4.6 4.6 0 0 0 9.2 0" />' +
  '<path d="M12 16.2v2.4" /></svg>';
// While he talks: the circle with three sound bars. While he thinks: three dots.
const WAVES_SVG =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" />' +
  '<path d="M8 10v4" /><path d="M10.7 7.5v9" /><path d="M13.3 9v6" /><path d="M16 10.5v3" /></svg>';
const DOTS_SVG =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" />' +
  '<circle cx="8" cy="12" r="0.9" /><circle cx="12" cy="12" r="0.9" /><circle cx="16" cy="12" r="0.9" /></svg>';

type Phase = "idle" | "connecting" | "listening" | "speaking";
const ICON: Record<Phase, string> = { idle: MUTED_SVG, connecting: DOTS_SVG, listening: MIC_SVG, speaking: WAVES_SVG };
const TAGLINE: Record<Phase, string> = {
  idle: "Tap and talk to me about growing your business.",
  connecting: "Connecting…",
  listening: "Listening… go ahead.",
  speaking: "Talking… tap to stop.",
};

// The hook's own catch-all message ("microphone permission denied") plus the real DOMException
// text every browser actually throws (Chrome: "Permission denied"; Safari: "...not allowed by the
// user agent...") — none of them share one exact string, so this reads for the family of words.
function micWasDenied(err: string): boolean {
  const s = err.toLowerCase();
  return s.includes("permission") || s.includes("denied") || s.includes("allow") || s.includes("microphone");
}

type Box = { left: number; top: number; width: number; height: number; orbTop: number; orbLeft: number };

export default function HomeTwinOrb() {
  const relay = useTwilioRelay();
  const [container, setContainer] = useState<Element | null>(null);
  const [box, setBox] = useState<Box | null>(null);
  const ext = useRef(videoExt());

  // Find the builder's own column — it exists in the server-rendered HTML already, but retry a
  // few frames in case the design's stylesheet <link> reflows the image size after paint.
  useEffect(() => {
    let tries = 0;
    const find = () => {
      const el = document.querySelector("[data-sjc-twin-col]");
      if (el) { setContainer(el); return; }
      if (tries++ < 40) requestAnimationFrame(find);
    };
    find();
  }, []);

  useEffect(() => {
    if (!container) return;
    const img = container.querySelector('img[data-sjc-img="i1"]') as HTMLElement | null;
    if (!img) return;

    function measure() {
      const colRect = container!.getBoundingClientRect();
      const imgRect = img!.getBoundingClientRect();
      // ⛔ NEVER CLIP: the section around this hero ships `overflow-hidden`. The orb floats above
      // the photo, but never above the section's own top edge, or Safari/Chrome would cut it off.
      const section = container!.closest("section");
      const minPageTop = (section?.getBoundingClientRect().top ?? 0) + 8;
      const orbPageTop = Math.max(minPageTop, imgRect.top - ORB_SIZE - ORB_GAP);
      setBox({
        left: imgRect.left - colRect.left,
        top: imgRect.top - colRect.top,
        width: imgRect.width,
        height: imgRect.height,
        orbTop: orbPageTop - colRect.top,
        orbLeft: imgRect.left - colRect.left + imgRect.width / 2,
      });
    }
    // THE ORB TAKES REAL SPACE (09-26): pinned over the old photo it floated into the section top on
    // a laptop and onto the eyebrow on a phone. A slot in the flow, above the photo's wrapper, holds it.
    const wrap = img.parentElement as HTMLElement;
    if (!document.querySelector("[data-sjc-orb-slot]")) {
      const slot = document.createElement("div");
      slot.setAttribute("data-sjc-orb-slot", "");
      slot.style.cssText = "display:flex;flex-direction:column;align-items:center;padding:52px 0 18px";
      wrap.parentElement!.insertBefore(slot, wrap);
    }
    // THE CALL CARD'S OWN SLOT (09-27, redone after his real call): IN FLOW, directly after the
    // photo's wrapper — never inside the absolutely-positioned stage that sits over the photo. His
    // face stays fully visible the whole call; this slot just grows the column (and the page) while
    // a card is showing, and the CTA below shifts down with it.
    if (!document.querySelector("[data-sjc-cardflow-slot]")) {
      const flow = document.createElement("div");
      flow.setAttribute("data-sjc-cardflow-slot", "");
      wrap.parentElement!.insertBefore(flow, wrap.nextSibling);
    }
    // The photo box takes the cutout's own shape (900x810), so there is no dead band under him.
    // The server-built hero already paints the twin's poster here; only an old imported photo hides.
    if (!(img as HTMLImageElement).src.includes("twin-cutout")) img.style.visibility = "hidden";
    img.style.aspectRatio = "10 / 9";
    // Width lives in globals.css (phone vs laptop). The wrapper must span the column, or the photo's
    // percentage width resolves against a shrink-to-fit box and he renders at ~210px.
    wrap.style.width = "100%";
    img.style.height = "auto";
    img.style.objectFit = "cover";
    wrap.style.paddingTop = "0";
    wrap.style.paddingBottom = "0";
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(img);
    // The orb slot and the reshaped photo move the photo AFTER the first measure, and a moved box fires
    // no resize - observe the column too, and re-measure once fonts and layout settle.
    ro.observe(container);
    const settle = [150, 600, 1500].map((ms) => window.setTimeout(measure, ms));
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, { passive: true });
    return () => {
      ro.disconnect();
      settle.forEach(clearTimeout);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure);
    };
  }, [container]);

  // THE SERVER ALREADY DREW THE ORB (lib/twinColSsr, 09-27): wire that one instead of portaling a
  // second, so the first paint and the live page are the same pixels and nothing swaps on hydration.
  const toggleRef = useRef<() => void>(() => {});
  const [ssrOrb, setSsrOrb] = useState<HTMLElement | null>(null);
  useEffect(() => {
    const b = document.querySelector("[data-sjc-orb-ssr]") as HTMLElement | null;
    if (!b) return;
    const onTap = () => toggleRef.current();
    b.addEventListener("click", onTap);
    setSsrOrb(b);
    return () => b.removeEventListener("click", onTap);
  }, []);
  toggleRef.current = relay.toggle;

  // ── IS THE TWIN TALKING RIGHT NOW — a single held boolean off the call's own volume ref, on a
  // rAF loop only while the call is live. The hold (ENGAGED_HOLD_MS) stops a half-second breath
  // mid-sentence from flapping the film back to "listening". ──────────────────────────────────
  const [engaged, setEngaged] = useState(false);
  const engagedRef = useRef(false);
  useEffect(() => {
    if (relay.state !== "live") {
      if (engagedRef.current) { engagedRef.current = false; setEngaged(false); }
      return;
    }
    let raf = 0; let engagedUntil = 0;
    const tick = () => {
      const now = performance.now();
      if (relay.outputVolume.current > OUT_THRESHOLD) engagedUntil = now + ENGAGED_HOLD_MS;
      const next = now < engagedUntil;
      if (next !== engagedRef.current) { engagedRef.current = next; setEngaged(next); }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [relay.state]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── THE CALL CARD (ported 2026-09-27 from the practice page's pollCard/tap): while the call is
  // live, poll /callcard on the CallSid every 600ms and render whatever the brain named. A tap goes
  // straight to /calltap, into the SAME live call's queue — no session line, no /turn. ─────────────
  const [callCard, setCallCard] = useState<CallCardData | null>(null);
  const [tapStatus, setTapStatus] = useState("");
  const [devPreview, setDevPreview] = useState(false);
  useEffect(() => {
    if (typeof window !== "undefined" && /[?&]cardpreview=1\b/.test(window.location.search)) setDevPreview(true);
  }, []);
  const wasLiveRef = useRef(false);
  const lastSidRef = useRef("");
  useEffect(() => {
    if (relay.state === "connecting") { setCallCard(null); setTapStatus(""); return; }
    const sid = relay.callSid;
    if (relay.state !== "live" || !sid || !AGENT_API) return;
    wasLiveRef.current = true;
    lastSidRef.current = sid;
    let stopped = false;
    const poll = async () => {
      try {
        const r = await fetch(`${ROLEPLAY}/callcard?sid=${encodeURIComponent(sid)}`);
        const d = await r.json();
        if (stopped) return;
        if (d && d.card && Object.keys(d.card).length) setCallCard(d.card);
      } catch { /* the next tick tries again */ }
    };
    poll();
    const id = window.setInterval(poll, CALLCARD_POLL_MS);
    return () => { stopped = true; window.clearInterval(id); };
  }, [relay.state, relay.callSid]);

  // AFTER HANGUP (mirrors the practice page's endCall): the brain's closing card/booking often lands
  // just after the SDK's disconnect event, so one more poll runs 400ms out; the panel then sits a few
  // seconds for a visitor mid-read before it clears (or clears at once if a new call starts first).
  useEffect(() => {
    if (relay.state === "live" || relay.state === "connecting" || !wasLiveRef.current) return;
    wasLiveRef.current = false;
    const sid = lastSidRef.current;
    const lastPoll = window.setTimeout(async () => {
      if (!sid || !AGENT_API) return;
      try {
        const r = await fetch(`${ROLEPLAY}/callcard?sid=${encodeURIComponent(sid)}`);
        const d = await r.json();
        if (d && d.card && Object.keys(d.card).length) setCallCard(d.card);
      } catch { /* the panel just clears on schedule below */ }
    }, 400);
    const clearAfter = window.setTimeout(() => setCallCard(null), 6000);
    return () => { window.clearTimeout(lastPoll); window.clearTimeout(clearAfter); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [relay.state]);

  async function tapCard(t: { kind: "choice" | "slot" | "confirm"; text?: string } | { kind: "field"; field: "first_name" | "last_name" | "phone" | "email"; value: string }) {
    if (!relay.callSid) return;
    setTapStatus("");
    try {
      const r = await fetch(`${ROLEPLAY}/calltap`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sid: relay.callSid, ...t }),
      });
      const d = await r.json().catch(() => ({}));
      if (d && d.reason) setTapStatus(d.reason);
    } catch { /* the live call still has the visitor's voice as a fallback */ }
  }

  const phase: Phase = relay.state === "connecting" ? "connecting" : relay.state === "live" ? (engaged ? "speaking" : "listening") : "idle";
  const tagline =
    phase === "idle" && relay.error
      ? micWasDenied(relay.error)
        ? "Your microphone is off. Allow it and tap again."
        : "Couldn't connect. Tap to try again."
      : TAGLINE[phase];

  useEffect(() => {
    if (!ssrOrb) return;
    const on = phase !== "idle";
    ssrOrb.setAttribute("aria-label", on ? "Tap to stop talking to Steven" : "Tap and I'll talk to you");
    ssrOrb.setAttribute("data-phase", phase);
    ssrOrb.innerHTML = ICON[phase] || SPEAKER_SVG;
    const line = document.querySelector("[data-sjc-orb-slot] .sjc-twin-tagline");
    if (line) line.textContent = tagline;
  }, [ssrOrb, phase, tagline]);

  if (!container || !box || !AGENT_API) return null;
  // The slot sits ABOVE the photo's wrapper, which can be outside the column element itself.
  const slot = document.querySelector("[data-sjc-orb-slot]");
  // The card's own slot sits BELOW the photo's wrapper, in normal flow — never inside .sjc-twin-stage.
  const cardSlot = document.querySelector("[data-sjc-cardflow-slot]");
  const activeCard = devPreview ? SAMPLE_CARD : callCard;

  const talkSrc = MEDIA + "talking-cutout" + ext.current;
  const listenSrc = MEDIA + "listening-cutout" + ext.current;
  const poster = MEDIA + "twin-cutout.webp";

  const orb = (
      <button
        type="button"
        className="sjc-twin-orb"
        aria-label={phase !== "idle" ? "Tap to stop talking to Steven" : "Tap and I'll talk to you"}
        onClick={relay.toggle}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <path d="M5.2 9.7v4.6h2.3l3.2 2.8V6.9L7.5 9.7z" />
          <path d="M13.3 9.6a3.4 3.4 0 0 1 0 4.8" />
          <path d="M15.4 7.6a6.2 6.2 0 0 1 0 8.8" />
        </svg>
      </button>
  );

  return createPortal(
    <>
      {slot && !ssrOrb && createPortal(
        <>
          {orb}
          {/* Kay's lesson: nobody taps a glowing circle unless it says to. Clears the orb's 48px rings. */}
          <div className="sjc-twin-tagline">{tagline}</div>
        </>,
        slot
      )}
      <div
        className="sjc-twin-stage"
        data-state={phase}
        style={{ position: "absolute", left: box.left, top: box.top, width: box.width, height: box.height, zIndex: 2 }}
      >
        <img className="sjc-twin-video" src={poster} alt="Steven Barchetti" style={{ opacity: 1 }} />
        <video
          className="sjc-twin-video"
          style={{ opacity: phase === "listening" ? 1 : 0 }}
          muted loop playsInline autoPlay preload="auto" poster={poster} src={listenSrc}
        />
        <video
          className="sjc-twin-video"
          style={{ opacity: phase === "speaking" ? 1 : 0 }}
          muted loop playsInline autoPlay preload="auto" poster={poster} src={talkSrc}
        />
      </div>
      {cardSlot && createPortal(
        <CallCard card={activeCard} onTap={tapCard} status={tapStatus} />,
        cardSlot
      )}
    </>,
    container
  );
}
