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
const ORB_GAP = 14; // air between the orb's ring and the photo, matching the roleplay hero

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
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(img);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, { passive: true });
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure);
    };
  }, [container]);

  useEffect(() => () => t.stopHandsFree(), []); // eslint-disable-line react-hooks/exhaustive-deps

  function toggle() {
    if (!talkOn) {
      setTalkOn(true);
      t.startHandsFree();
      if (!started.current) { started.current = true; t.send("Hi", { hidden: true }); }
      return;
    }
    if (t.handsFree()) { t.stopHandsFree(); setTalkOn(false); } else { t.startHandsFree(); }
  }

  if (!container || !box || !t.ready) return null;

  const state = t.listening ? "listening" : t.speaking ? "speaking" : t.busy ? "thinking" : "idle";
  const talkSrc = MEDIA + "talking-cutout" + ext.current;
  const listenSrc = MEDIA + "listening-cutout" + ext.current;
  const poster = MEDIA + "twin-cutout.webp";

  return createPortal(
    <>
      <button
        type="button"
        className="sjc-twin-orb"
        aria-label={talkOn ? "Tap to stop talking to Steven" : "Tap and I'll talk to you"}
        onClick={toggle}
        style={{ position: "absolute", left: box.orbLeft, top: box.orbTop, transform: "translateX(-50%)", zIndex: 3 }}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <path d="M5.2 9.7v4.6h2.3l3.2 2.8V6.9L7.5 9.7z" />
          <path d="M13.3 9.6a3.4 3.4 0 0 1 0 4.8" />
          <path d="M15.4 7.6a6.2 6.2 0 0 1 0 8.8" />
          <path d="M4.9 4.9 19.1 19.1" />
        </svg>
      </button>
      <div
        className="sjc-twin-stage"
        data-state={state}
        style={{ position: "absolute", left: box.left, top: box.top, width: box.width, height: box.height, zIndex: 2 }}
      >
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
