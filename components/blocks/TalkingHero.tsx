"use client";
// THE TALKING HERO (ruled 2026-09-11): Steven IS the orb. The hero of the page is a live, spoken,
// back-and-forth conversation with his AI twin — no two-column video, no floating button. The room
// (his idle loop) is the whole canvas; the page's headline sits over it; one tap starts the talk.
// Level 4 of the build (the live HeyGen face) mounts into the same face panel later; the idle loop
// is what plays before the first tap and whenever the stream is off. Draft-mode safe: it is a Puck
// block, so it ships to a page only when Steven publishes that page.

import { useEffect, useRef, useState } from "react";
import { useAgentThread, AGENT_NAME } from "@/lib/useAgentThread";

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
};

export default function TalkingHero(p: Partial<TalkingHeroProps>) {
  const props = { ...TALKING_HERO_DEFAULTS, ...p };
  const t = useAgentThread({ pollMs: 1200 });
  const [mode, setMode] = useState<"idle" | "talk" | "type">("idle");
  const [draft, setDraft] = useState("");
  const [showVideo, setShowVideo] = useState(false);
  const started = useRef(false);
  const captionsEnd = useRef<HTMLDivElement>(null);

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
    setMode(as);
    if (as === "talk") t.startHandsFree(); else t.setActive(true);
    if (!started.current) {
      started.current = true;
      t.send("Hi", { hidden: true });
    }
  }

  const visible = t.msgs.filter((m) => !m.hidden);
  const captions = visible.slice(-4);
  const state = t.listening ? "listening" : t.speaking ? "talking" : t.busy ? "thinking" : mode === "idle" ? "idle" : "ready";

  return (
    <section className="sjc-design" data-sjc-talking-hero data-state={state} style={{ ["--th-min" as any]: `${props.minHeight}vh` }}>
      {/* the room — his idle loop is the whole canvas; wide on a laptop, tall on a phone */}
      <div className="th-room" aria-hidden="true">
        {props.idleWide ? <video className="th-loop th-wide" src={props.idleWide} poster={props.poster || undefined} autoPlay muted loop playsInline preload="auto" /> : null}
        {props.idleTall ? <video className="th-loop th-tall" src={props.idleTall} poster={props.poster || undefined} autoPlay muted loop playsInline preload="auto" /> : null}
        <div className="th-shade" />
      </div>

      <div className="th-words">
        {props.eyebrow ? <p className="th-eyebrow">{props.eyebrow}</p> : null}
        <h1>{props.headline}</h1>
        {props.byline ? <p className="th-byline">{props.byline}</p> : null}
      </div>

      <div className="th-talk">
        {/* captions: what he says and what you said, the last few lines */}
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

        <div className="th-controls">
          {mode === "talk" ? (
            <button className="th-mic" data-on={t.listening} onClick={() => { if (t.handsFree()) { t.stopHandsFree(); setMode("idle"); } else { t.startHandsFree(); } }}>
              {t.listening ? "Listening… tap to stop" : t.speaking ? `${AGENT_NAME} is talking… tap to stop` : t.busy ? `${AGENT_NAME} is thinking…` : "Tap to talk"}
            </button>
          ) : (
            <button className="th-mic" onClick={() => begin("talk")} disabled={!t.ready}>
              {props.ctaTalk}
            </button>
          )}
          {mode !== "type" ? (
            <button className="th-ghost" onClick={() => { t.stopHandsFree(); begin("type"); }} disabled={!t.ready}>{props.ctaType}</button>
          ) : (
            <button className="th-ghost" onClick={() => begin("talk")}>Talk instead</button>
          )}
          {props.videoUrl ? (
            <button className="th-play" onClick={() => setShowVideo(true)}>▶ {props.videoLabel}</button>
          ) : null}
        </div>
        {!t.ready ? <p className="th-note">The conversation is switched off on this preview.</p> : null}
      </div>

      {showVideo && props.videoUrl ? (
        <div className="th-modal" role="dialog" aria-label={props.videoLabel} onClick={() => setShowVideo(false)}>
          <video src={props.videoUrl} controls autoPlay playsInline onClick={(e) => e.stopPropagation()} />
          <button className="th-close" aria-label="Close" onClick={() => setShowVideo(false)}>×</button>
        </div>
      ) : null}
    </section>
  );
}
