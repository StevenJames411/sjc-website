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

type Box = { left: number; top: number; width: number; height: number; orbTop: number; orbLeft: number };

export default function HomeTwinOrb() {
  const t = useAgentThread({ pollMs: 1200 });
  const [container, setContainer] = useState<Element | null>(null);
  const [box, setBox] = useState<Box | null>(null);
  const [talkOn, setTalkOn] = useState(false);
  const started = useRef(false);
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
    img.style.visibility = "hidden";
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

  function toggle() {
    if (!talkOn) {
      setTalkOn(true);
      t.startHandsFree();
      if (!started.current) { started.current = true; t.send("Hi", { hidden: true, open: true }); }
      return;
    }
    if (t.handsFree()) { t.stopHandsFree(); setTalkOn(false); } else { t.startHandsFree(); }
  }

  if (!container || !box || !t.ready) return null;
  // The slot sits ABOVE the photo's wrapper, which can be outside the column element itself.
  const slot = document.querySelector("[data-sjc-orb-slot]");

  const state = t.listening ? "listening" : t.speaking ? "speaking" : t.busy ? "thinking" : "idle";
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
          <path d="M4.9 4.9 19.1 19.1" />
        </svg>
      </button>
  );

  return createPortal(
    <>
      {slot && createPortal(
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
          style={{ opacity: state === "speaking" || state === "thinking" ? 1 : 0 }}
          muted loop playsInline autoPlay preload="auto" poster={poster} src={talkSrc}
        />
      </div>
    </>,
    container
  );
}
