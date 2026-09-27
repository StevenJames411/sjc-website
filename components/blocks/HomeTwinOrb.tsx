"use client";
// THE HOME HERO'S TALK ORB (2026-09-26) — Kay's orb, above Steven's white-polo cutout, above the
// existing Book A Call button. The builder's right column keeps its own <img data-sjc-img="i1">
// exactly as imported (zero visual change with JS off); this portals the orb + cutout stage on
// TOP of it, absolutely positioned against the photo's own measured box, so the column's flow
// height never changes and neither the eyebrow nor the left column ever move.
//
// The conversation is the SAME engine as /live and the header's own thread (useAgentThread ->
// agent-sjc.onrender.com /sjc/web/*) — no new backend, no new voice. The cutout media (twin's
// muted-idle poster, talking loop, listening loop) is the film already shot and served from
// /sjc/roleplay/media/ (built 2026-09-19/20, roleplay_routes.py).

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useAgentThread } from "@/lib/useAgentThread";

const MEDIA = "https://agent-sjc.onrender.com/sjc/roleplay/media/";
const ORB_SIZE = 84;
// The orb's outer ring reaches 48px past its edge (Kay's pulse), so the gap must clear the RINGS, not
// the button — 14px put the rings on his head.
const ORB_GAP = 58;

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
const ICON: Record<string, string> = {
  idle: MUTED_SVG, on: MIC_SVG, listening: MIC_SVG, thinking: DOTS_SVG, speaking: WAVES_SVG, typing: SPEAKER_SVG,
};
const TAGLINE: Record<string, string> = {
  idle: "Tap and talk to me about growing your business.",
  // "on" is only ever the 250ms while the mic reopens — it reads as listening, so the line doesn't flicker.
  on: "Listening… go ahead.",
  listening: "Listening… go ahead.",
  thinking: "Thinking…",
  speaking: "Talking… tap to stop.",
  typing: "I can't hear you in this browser. Type to me below.",
  blocked: "Your microphone is off, so I can't hear you. Type to me below.",
};

type Box = { left: number; top: number; width: number; height: number; orbTop: number; orbLeft: number };

export default function HomeTwinOrb() {
  const t = useAgentThread({ pollMs: 1200 });
  const [container, setContainer] = useState<Element | null>(null);
  const [box, setBox] = useState<Box | null>(null);
  const [talkOn, setTalkOn] = useState(false);
  const [draft, setDraft] = useState("");
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

  useEffect(() => () => t.stopHandsFree(), []); // eslint-disable-line react-hooks/exhaustive-deps

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
  // ⛔ NO MUTE SIGN, AND SAY WHAT IS HAPPENING (09-27): the orb wore a crossed-out speaker the whole
  // call, and a 15s think looked like a dead page. Speaker when idle, mic while it listens, sound waves
  // while it talks; the line under it names the state.
  const phase = !talkOn ? "idle" : t.listening ? "listening" : t.speaking ? "speaking" : (t.busy || t.preparing) ? "thinking" : t.micProblem ? "typing" : "on";
  useEffect(() => {
    if (!ssrOrb) return;
    ssrOrb.setAttribute("aria-label", talkOn ? "Tap to stop talking to Steven" : "Tap and I'll talk to you");
    ssrOrb.setAttribute("data-phase", phase);
    ssrOrb.innerHTML = ICON[phase] || SPEAKER_SVG;
    const line = document.querySelector("[data-sjc-orb-slot] .sjc-twin-tagline");
    if (line) line.textContent = phase === "typing" && t.micProblem === "blocked" ? TAGLINE.blocked : TAGLINE[phase];
  }, [ssrOrb, talkOn, phase, t.micProblem]);

  // Every start is an open: a stop-and-re-tap used to send nothing and sit on "Listening…" in silence.
  // The server answers each open with this page's greeting; the mic opens when the greeting ends.
  function toggle() {
    if (talkOn) { t.stopHandsFree(); setTalkOn(false); return; }
    setTalkOn(true);
    t.startHandsFree({ waitForReply: true });
    t.send("Hi", { hidden: true, open: true });
  }
  toggleRef.current = toggle;

  if (!container || !box || !t.ready) return null;
  // The slot sits ABOVE the photo's wrapper, which can be outside the column element itself.
  const slot = document.querySelector("[data-sjc-orb-slot]");

  // The film follows the same switch as the orb: once stopped, he is idle whatever is still settling.
  const state = !talkOn ? "idle" : t.listening ? "listening" : t.speaking ? "speaking" : (t.busy || t.preparing) ? "thinking" : "idle";
  const talkSrc = MEDIA + "talking-cutout" + ext.current;
  const listenSrc = MEDIA + "listening-cutout" + ext.current;
  const poster = MEDIA + "twin-cutout.webp";

  const orb = (
      <button
        type="button"
        className="sjc-twin-orb"
        aria-label={talkOn ? "Tap to stop talking to Steven" : "Tap and I'll talk to you"}
        onClick={toggle}
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
      {/* NO DEAD END (09-27): no speech recognition here (Firefox, some in-app browsers) or the mic is
          blocked — a type box under the tagline keeps the conversation going; replies still speak. */}
      {slot && talkOn && t.micProblem && createPortal(
        <form
          onSubmit={(e) => { e.preventDefault(); const v = draft.trim(); if (v) { t.send(v); setDraft(""); } }}
          style={{ marginTop: 14, display: "flex", gap: 8, width: "100%", maxWidth: 340 }}
        >
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            aria-label="Type your message"
            style={{ flex: 1, minWidth: 0, padding: "10px 14px", borderRadius: 999, border: "1.5px solid #fff", background: "transparent", color: "#fff", fontSize: 16 }}
          />
          <button type="submit" style={{ padding: "10px 16px", borderRadius: 999, border: 0, background: "#f0b323", color: "#0A0E27", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
            Send
          </button>
        </form>,
        slot
      )}
      {slot && !ssrOrb && createPortal(
        <>
          {orb}
          {/* Kay's lesson: nobody taps a glowing circle unless it says to. Clears the orb's 48px rings. */}
          <div className="sjc-twin-tagline">Tap and talk to me about growing your business.</div>
        </>,
        slot
      )}
      <div
        className="sjc-twin-stage"
        data-state={state}
        style={{ position: "absolute", left: box.left, top: box.top, width: box.width, height: box.height, zIndex: 2 }}
      >
        <img className="sjc-twin-video" src={poster} alt="Steven Barchetti" style={{ opacity: 1 }} />
        <video
          className="sjc-twin-video"
          style={{ opacity: state === "listening" ? 1 : 0 }}
          muted loop playsInline autoPlay preload="auto" poster={poster} src={listenSrc}
        />
        <video
          className="sjc-twin-video"
          style={{ opacity: state === "speaking" ? 1 : 0 }}
          muted loop playsInline autoPlay preload="auto" poster={poster} src={talkSrc}
        />
      </div>
    </>,
    container
  );
}
