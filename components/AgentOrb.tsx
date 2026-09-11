"use client";
// THE ORB — the AI booking agent at the door (ruled 2026-09-10). Phone or laptop, every visitor, three doors:
//   TEXT  — a text thread on the website (the agent's engine on the WEB channel, no phone number)
//   TALK  — voice both ways in the browser (speech-to-text in, the reply spoken back)
//   CALL  — a human: rings the owner's real number (lights up when the Twilio number lands)
// Mounts only when NEXT_PUBLIC_AGENT_API is set. The conversation engine lives in lib/useAgentThread
// (shared with the TalkingHero block, 2026-09-11); on a page whose hero IS the orb, this stays hidden.

import { useEffect, useRef, useState } from "react";
import { useAgentThread, AGENT_CALL, AGENT_NAME } from "@/lib/useAgentThread";

type Door = "closed" | "menu" | "text" | "talk";

export default function AgentOrb() {
  const t = useAgentThread({ pollMs: 2000 });
  const [door, setDoor] = useState<Door>("closed");
  const [draft, setDraft] = useState("");
  const [heroOnPage, setHeroOnPage] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);

  // The hero IS the orb on pages that carry a TalkingHero block — no second mouth.
  useEffect(() => {
    const check = () => setHeroOnPage(document.documentElement.hasAttribute("data-talking-hero"));
    check();
    window.addEventListener("sjc:talking-hero", check);
    return () => window.removeEventListener("sjc:talking-hero", check);
  }, []);

  useEffect(() => {
    t.setActive(door === "text" || door === "talk");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [door]);

  useEffect(() => {
    bottom.current?.scrollIntoView({ block: "end" });
  }, [t.msgs]);

  if (!t.ready || heroOnPage) return null;

  const open = door !== "closed";
  const visible = t.msgs.filter((m) => !m.hidden);
  return (
    <>
      <style>{`
        .agent-orb{position:fixed;right:20px;bottom:20px;z-index:9999;width:64px;height:64px;border-radius:50%;border:0;cursor:pointer;
          background:radial-gradient(circle at 35% 35%,#ffe08a,#f0b323 55%,#b07d0c);box-shadow:0 0 0 0 rgba(240,179,35,.55),0 10px 30px rgba(0,0,0,.35);
          animation:agent-pulse 2.4s ease-out infinite;display:flex;align-items:center;justify-content:center;color:#0f1f3d;font-weight:700;font-size:13px;letter-spacing:.04em}
        .agent-orb:hover{background:#f0b323;color:#111827}
        @keyframes agent-pulse{0%{box-shadow:0 0 0 0 rgba(240,179,35,.55),0 10px 30px rgba(0,0,0,.35)}70%{box-shadow:0 0 0 22px rgba(240,179,35,0),0 10px 30px rgba(0,0,0,.35)}100%{box-shadow:0 0 0 0 rgba(240,179,35,0),0 10px 30px rgba(0,0,0,.35)}}
        .agent-panel{position:fixed;right:20px;bottom:96px;z-index:9999;width:min(380px,calc(100vw - 32px));max-height:min(70vh,560px);display:flex;flex-direction:column;
          background:#0f1f3d;color:#fff;border-radius:18px;box-shadow:0 20px 60px rgba(0,0,0,.45);overflow:hidden;font-family:var(--font-sans,system-ui);border:1px solid rgba(240,179,35,.35)}
        @media (max-width:480px){.agent-panel{right:0;bottom:0;width:100vw;max-height:88vh;border-radius:18px 18px 0 0}.agent-orb{right:16px;bottom:16px}}
        .agent-head{display:flex;align-items:center;justify-content:space-between;padding:14px 16px;background:#1e3a6e;font-weight:600}
        .agent-head button{background:none;border:0;color:#fff;font-size:20px;cursor:pointer;line-height:1}
        .agent-doors{display:grid;gap:10px;padding:16px}
        .agent-door{display:block;width:100%;text-align:left;padding:14px 16px;border-radius:12px;border:2px solid rgba(240,179,35,.82);background:transparent;color:#fff;cursor:pointer;font-size:15px}
        .agent-door b{display:block;color:#f0b323;font-size:16px;margin-bottom:2px}
        .agent-door:hover{background:#f0b323;color:#111827}.agent-door:hover b{color:#111827}
        .agent-door[aria-disabled="true"]{opacity:.5;border-color:rgba(240,179,35,.35);cursor:default}.agent-door[aria-disabled="true"]:hover{background:transparent;color:#fff}.agent-door[aria-disabled="true"]:hover b{color:#f0b323}
        .agent-thread{flex:1;overflow-y:auto;padding:14px 16px;display:flex;flex-direction:column;gap:8px;min-height:180px}
        .agent-m{max-width:85%;padding:10px 12px;border-radius:14px;font-size:15px;line-height:1.35;white-space:pre-wrap}
        .agent-m.in{align-self:flex-end;background:#2563eb}.agent-m.out{align-self:flex-start;background:#1e3a6e}
        .agent-typing{align-self:flex-start;color:#9ca3af;font-size:13px}
        .agent-input{display:flex;gap:8px;padding:12px;border-top:1px solid rgba(255,255,255,.08)}
        .agent-input input{flex:1;padding:12px 14px;border-radius:12px;border:1px solid rgba(255,255,255,.15);background:#0b1730;color:#fff;font-size:16px}
        .agent-input button{padding:12px 16px;border-radius:12px;border:0;background:#f0b323;color:#111827;font-weight:700;cursor:pointer}
        .agent-mic{margin:12px;padding:16px;border-radius:14px;border:2px solid #f0b323;background:transparent;color:#fff;font-size:16px;cursor:pointer}
        .agent-mic[data-on="true"]{background:#f0b323;color:#111827}
        .agent-heard{padding:0 16px 12px;color:#9ca3af;font-size:14px;min-height:20px}
      `}</style>

      {open && (
        <div className="agent-panel" role="dialog" aria-label={`Talk to ${AGENT_NAME}`}>
          <div className="agent-head">
            <span>{door === "menu" ? `Hi, I'm ${AGENT_NAME}. Choose a method from below.` : door === "text" ? `Text ${AGENT_NAME}` : `${AGENT_NAME} is listening`}</span>
            <button onClick={() => { t.stopHandsFree(); setDoor("closed"); }} aria-label="Close">×</button>
          </div>

          {door === "menu" && (
            <div className="agent-doors">
              <button className="agent-door" onClick={() => setDoor("text")}>
                <b>Text me</b>Type like you would in a text. I answer in seconds.
              </button>
              <button className="agent-door" onClick={() => { setDoor("talk"); t.startHandsFree(); }}>
                <b>Speak to me through your speaker</b>Tap, say what you need, and I talk back.
              </button>
              {AGENT_CALL ? (
                <a className="agent-door" href={`tel:${AGENT_CALL}`}>
                  <b>Call me</b>Ring the office and get a person on the phone.
                </a>
              ) : (
                <button className="agent-door" aria-disabled="true">
                  <b>Call me</b>Phone line coming soon. Text or speak for now.
                </button>
              )}
            </div>
          )}

          {(door === "text" || door === "talk") && (
            <>
              <div className="agent-thread">
                {visible.length === 0 && (
                  <div className="agent-m out">{door === "talk" ? "Go ahead, I'm listening." : "Hey! What can I help you with?"}</div>
                )}
                {visible.map((m) => (
                  <div key={m.id} className={`agent-m ${m.direction === "inbound" ? "in" : "out"}`}>{m.body}</div>
                ))}
                {t.busy && <div className="agent-typing">{AGENT_NAME} is typing…</div>}
                <div ref={bottom} />
              </div>
              {door === "talk" ? (
                <>
                  <div className="agent-heard">{t.heard}</div>
                  <button className="agent-mic" data-on={t.listening} onClick={() => { if (t.handsFree()) { t.stopHandsFree(); } else { t.startHandsFree(); } }}>
                    {t.listening ? "Listening… (tap to stop)" : t.handsFree() ? (t.busy ? `${AGENT_NAME} is thinking…` : `${AGENT_NAME} is talking… (tap to stop)`) : "Tap to start talking"}
                  </button>
                </>
              ) : (
                <form className="agent-input" onSubmit={(e) => { e.preventDefault(); t.send(draft); setDraft(""); }}>
                  <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Type here…" autoFocus />
                  <button type="submit" disabled={t.busy}>Send</button>
                </form>
              )}
            </>
          )}
        </div>
      )}

      <button className="agent-orb" onClick={() => { if (open) t.stopHandsFree(); setDoor(open ? "closed" : "menu"); }} aria-label={open ? "Close" : `Talk to ${AGENT_NAME}`}>
        {open ? "×" : AGENT_NAME.toUpperCase()}
      </button>
    </>
  );
}
