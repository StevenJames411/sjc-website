"use client";
// THE ORB — Chloe at the door (ruled 2026-09-10). Phone or laptop, every visitor, three doors:
//   TEXT  — a text thread on the website (Chloe's engine on the WEB channel, no phone number)
//   TALK  — voice both ways in the browser (speech-to-text in, Chloe's reply spoken back)
//   CALL  — a human: rings the owner's real number (lights up when the Twilio number lands)
// Mounts only when NEXT_PUBLIC_CHLOE_API is set, so the live site shows nothing until Chloe's
// server exists. Session id lives in localStorage so a returning visitor keeps their thread.

import { useCallback, useEffect, useRef, useState } from "react";

type Msg = { id: number; direction: "inbound" | "outbound"; author: string; body: string };
type Door = "closed" | "menu" | "text" | "talk";

const API = process.env.NEXT_PUBLIC_CHLOE_API || "";
const PREFIX = process.env.NEXT_PUBLIC_CHLOE_PREFIX || "sjc";
const CALL = process.env.NEXT_PUBLIC_CHLOE_CALL || "";
const NAME = process.env.NEXT_PUBLIC_CHLOE_NAME || "Chloe";

function sessionId(): string {
  try {
    const k = "chloe-session";
    let s = window.localStorage.getItem(k);
    if (!s) {
      s = Math.random().toString(36).slice(2) + Date.now().toString(36);
      window.localStorage.setItem(k, s);
    }
    return s;
  } catch {
    return "anon-" + Date.now().toString(36);
  }
}

export default function ChloeOrb() {
  const [door, setDoor] = useState<Door>("closed");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const [heard, setHeard] = useState("");
  const lastId = useRef(0);
  const session = useRef("");
  const spoken = useRef<Set<number>>(new Set());
  const bottom = useRef<HTMLDivElement>(null);
  const recog = useRef<any>(null);

  useEffect(() => {
    session.current = sessionId();
  }, []);

  // Poll the thread while a door is open. Chloe answers in ~1-20s on the web channel.
  const poll = useCallback(async () => {
    if (!API || !session.current) return;
    try {
      const r = await fetch(`${API}/${PREFIX}/web/thread?session=${encodeURIComponent(session.current)}&after=${lastId.current}`);
      const j = await r.json();
      const fresh: Msg[] = j.messages || [];
      if (fresh.length) {
        lastId.current = fresh[fresh.length - 1].id;
        setMsgs((m) => [...m, ...fresh]);
        if (fresh.some((x) => x.direction === "outbound")) setBusy(false);
      }
    } catch {
      /* server asleep or offline — the orb just waits */
    }
  }, []);

  useEffect(() => {
    if (door === "closed" || door === "menu") return;
    poll();
    const t = setInterval(poll, 2000);
    return () => clearInterval(t);
  }, [door, poll]);

  useEffect(() => {
    bottom.current?.scrollIntoView({ block: "end" });
  }, [msgs]);

  // TALK door: speak every new Chloe reply aloud, once.
  useEffect(() => {
    if (door !== "talk" || typeof window === "undefined" || !("speechSynthesis" in window)) return;
    for (const m of msgs) {
      if (m.direction === "outbound" && !spoken.current.has(m.id)) {
        spoken.current.add(m.id);
        const u = new SpeechSynthesisUtterance(m.body);
        const voices = window.speechSynthesis.getVoices();
        const pick = voices.find((v) => /Samantha|Karen|Moira|Google US English|Microsoft Aria/i.test(v.name)) || voices.find((v) => v.lang.startsWith("en"));
        if (pick) u.voice = pick;
        u.rate = 1.0;
        window.speechSynthesis.speak(u);
      }
    }
  }, [msgs, door]);

  async function send(text: string) {
    const t = text.trim();
    if (!t || !API) return;
    setDraft("");
    setBusy(true);
    try {
      await fetch(`${API}/${PREFIX}/web/message`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ session: session.current, text: t }),
      });
      setTimeout(poll, 600);
    } catch {
      setBusy(false);
    }
  }

  function startListening() {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      setHeard("Your browser can't listen — try Chrome or Safari, or use the text door.");
      return;
    }
    window.speechSynthesis?.cancel();
    const r = new SR();
    r.lang = "en-US";
    r.interimResults = true;
    r.continuous = false;
    r.onresult = (e: any) => {
      let s = "";
      for (const res of e.results) s += res[0].transcript;
      setHeard(s);
      if (e.results[e.results.length - 1].isFinal) {
        setListening(false);
        send(s);
        setHeard("");
      }
    };
    r.onend = () => setListening(false);
    r.onerror = () => setListening(false);
    recog.current = r;
    setListening(true);
    r.start();
  }

  if (!API) return null;

  const open = door !== "closed";
  return (
    <>
      <style>{`
        .chloe-orb{position:fixed;right:20px;bottom:20px;z-index:9999;width:64px;height:64px;border-radius:50%;border:0;cursor:pointer;
          background:radial-gradient(circle at 35% 35%,#ffe08a,#f0b323 55%,#b07d0c);box-shadow:0 0 0 0 rgba(240,179,35,.55),0 10px 30px rgba(0,0,0,.35);
          animation:chloe-pulse 2.4s ease-out infinite;display:flex;align-items:center;justify-content:center;color:#0f1f3d;font-weight:700;font-size:13px;letter-spacing:.04em}
        .chloe-orb:hover{background:#f0b323;color:#111827}
        @keyframes chloe-pulse{0%{box-shadow:0 0 0 0 rgba(240,179,35,.55),0 10px 30px rgba(0,0,0,.35)}70%{box-shadow:0 0 0 22px rgba(240,179,35,0),0 10px 30px rgba(0,0,0,.35)}100%{box-shadow:0 0 0 0 rgba(240,179,35,0),0 10px 30px rgba(0,0,0,.35)}}
        .chloe-panel{position:fixed;right:20px;bottom:96px;z-index:9999;width:min(380px,calc(100vw - 32px));max-height:min(70vh,560px);display:flex;flex-direction:column;
          background:#0f1f3d;color:#fff;border-radius:18px;box-shadow:0 20px 60px rgba(0,0,0,.45);overflow:hidden;font-family:var(--font-sans,system-ui);border:1px solid rgba(240,179,35,.35)}
        @media (max-width:480px){.chloe-panel{right:0;bottom:0;width:100vw;max-height:88vh;border-radius:18px 18px 0 0}.chloe-orb{right:16px;bottom:16px}}
        .chloe-head{display:flex;align-items:center;justify-content:space-between;padding:14px 16px;background:#1e3a6e;font-weight:600}
        .chloe-head button{background:none;border:0;color:#fff;font-size:20px;cursor:pointer;line-height:1}
        .chloe-doors{display:grid;gap:10px;padding:16px}
        .chloe-door{display:block;width:100%;text-align:left;padding:14px 16px;border-radius:12px;border:1px solid rgba(240,179,35,.55);background:transparent;color:#fff;cursor:pointer;font-size:15px}
        .chloe-door b{display:block;color:#f0b323;font-size:16px;margin-bottom:2px}
        .chloe-door:hover{background:#f0b323;color:#111827}.chloe-door:hover b{color:#111827}
        .chloe-door[aria-disabled="true"]{opacity:.55;cursor:default}.chloe-door[aria-disabled="true"]:hover{background:transparent;color:#fff}.chloe-door[aria-disabled="true"]:hover b{color:#f0b323}
        .chloe-thread{flex:1;overflow-y:auto;padding:14px 16px;display:flex;flex-direction:column;gap:8px;min-height:180px}
        .chloe-m{max-width:85%;padding:10px 12px;border-radius:14px;font-size:15px;line-height:1.35;white-space:pre-wrap}
        .chloe-m.in{align-self:flex-end;background:#2563eb}.chloe-m.out{align-self:flex-start;background:#1e3a6e}
        .chloe-typing{align-self:flex-start;color:#9ca3af;font-size:13px}
        .chloe-input{display:flex;gap:8px;padding:12px;border-top:1px solid rgba(255,255,255,.08)}
        .chloe-input input{flex:1;padding:12px 14px;border-radius:12px;border:1px solid rgba(255,255,255,.15);background:#0b1730;color:#fff;font-size:16px}
        .chloe-input button{padding:12px 16px;border-radius:12px;border:0;background:#f0b323;color:#111827;font-weight:700;cursor:pointer}
        .chloe-mic{margin:12px;padding:16px;border-radius:14px;border:2px solid #f0b323;background:transparent;color:#fff;font-size:16px;cursor:pointer}
        .chloe-mic[data-on="true"]{background:#f0b323;color:#111827}
        .chloe-heard{padding:0 16px 12px;color:#9ca3af;font-size:14px;min-height:20px}
      `}</style>

      {open && (
        <div className="chloe-panel" role="dialog" aria-label={`Talk to ${NAME}`}>
          <div className="chloe-head">
            <span>{door === "menu" ? `Hi, I'm ${NAME}. How do you want to talk?` : door === "text" ? `Text ${NAME}` : `${NAME} is listening`}</span>
            <button onClick={() => { window.speechSynthesis?.cancel(); setDoor("closed"); }} aria-label="Close">×</button>
          </div>

          {door === "menu" && (
            <div className="chloe-doors">
              <button className="chloe-door" onClick={() => setDoor("text")}>
                <b>Text me</b>Type like you would in a text. I answer in seconds.
              </button>
              <button className="chloe-door" onClick={() => { setDoor("talk"); setTimeout(startListening, 300); }}>
                <b>Speak to me through your speaker</b>Tap, say what you need, and I talk back.
              </button>
              {CALL ? (
                <a className="chloe-door" href={`tel:${CALL}`}>
                  <b>Call me</b>Ring the office and get a person on the phone.
                </a>
              ) : (
                <button className="chloe-door" aria-disabled="true">
                  <b>Call me</b>Phone line coming soon. Text or speak for now.
                </button>
              )}
            </div>
          )}

          {(door === "text" || door === "talk") && (
            <>
              <div className="chloe-thread">
                {msgs.length === 0 && (
                  <div className="chloe-m out">{door === "talk" ? "Go ahead, I'm listening." : "Hey! What can I help you with?"}</div>
                )}
                {msgs.map((m) => (
                  <div key={m.id} className={`chloe-m ${m.direction === "inbound" ? "in" : "out"}`}>{m.body}</div>
                ))}
                {busy && <div className="chloe-typing">{NAME} is typing…</div>}
                <div ref={bottom} />
              </div>
              {door === "talk" ? (
                <>
                  <div className="chloe-heard">{heard}</div>
                  <button className="chloe-mic" data-on={listening} onClick={startListening}>
                    {listening ? "Listening… tap when done" : "Tap to talk"}
                  </button>
                </>
              ) : (
                <form className="chloe-input" onSubmit={(e) => { e.preventDefault(); send(draft); }}>
                  <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Type here…" autoFocus />
                  <button type="submit" disabled={busy}>Send</button>
                </form>
              )}
            </>
          )}
        </div>
      )}

      <button className="chloe-orb" onClick={() => { setDoor(open ? "closed" : "menu"); if (open) window.speechSynthesis?.cancel(); }} aria-label={open ? "Close" : `Talk to ${NAME}`}>
        {open ? "×" : NAME.toUpperCase()}
      </button>
    </>
  );
}
