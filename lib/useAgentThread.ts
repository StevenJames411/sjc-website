"use client";
// THE CONVERSATION ENGINE — one hook, two mouths (ruled 2026-09-11, the talking hero).
// The hero of every page and the floating orb share this: one session id in localStorage (the
// thread follows the visitor across pages), one poll loop, one send, one listen (browser speech
// recognition, hands-free), one speak. Speaking prefers the SERVER voice (`/web/speak/{id}`, the
// owner's cloned voice, one voice on every device — step 2 of the build) and falls back to the
// browser's own voice until that endpoint exists.

import { useCallback, useEffect, useRef, useState } from "react";

export type Msg = { id: number; direction: "inbound" | "outbound"; author: string; body: string; hidden?: boolean };

export const AGENT_API = process.env.NEXT_PUBLIC_AGENT_API || "";
export const AGENT_PREFIX = process.env.NEXT_PUBLIC_AGENT_PREFIX || "sjc";
export const AGENT_CALL = process.env.NEXT_PUBLIC_AGENT_CALL || "";
export const AGENT_NAME = process.env.NEXT_PUBLIC_AGENT_NAME || "your assistant";

// HETERONYMS (Steven, 2026-09-10): "leads" is spelled like the metal and the voice read it that
// way. In this business the word is never the metal. Heard, never shown.
export function sayItRight(text: string): string {
  return text
    .replace(/\b([Ll])ead(s|\b)/g, (_m, l: string, tail: string) => l + "eed" + (tail || ""))
    .replace(/\b([Ll])eading\b/g, "$1eeding")
    .replace(/\b(I|you|we|they|he|she|already|just|last\s+\w+)\s+read\b/g, "$1 red");
}

function sessionId(): string {
  try {
    const k = "agent-session";
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

function pageSlug(): string {
  return window.location.pathname.replace(/^\/+|\/+$/g, "") || "home";
}

export function useAgentThread(opts: { pollMs?: number } = {}) {
  const pollMs = opts.pollMs ?? 2000;
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [busy, setBusy] = useState(false);        // waiting on a reply
  const [speaking, setSpeaking] = useState(false); // a reply is being voiced
  const [listening, setListening] = useState(false);
  const [heard, setHeard] = useState("");
  const [active, setActive] = useState(false);    // polling on/off
  const lastId = useRef(0);
  const session = useRef("");
  const spoken = useRef<Set<number>>(new Set());
  const hiddenTexts = useRef<Set<string>>(new Set());
  const recog = useRef<any>(null);
  const handsFree = useRef(false);
  const gotFinal = useRef(false);
  const audio = useRef<HTMLAudioElement | null>(null);
  // ⛔ ONE MOUTH AT A TIME (09-27): the mic stayed open while the cloned voice played; Chrome drops
  // an idle mic after a few seconds, onend reopened it, and startListening PAUSED the voice — the
  // reply cut off mid-word and the film looped. While this is true, the mic stays shut.
  const speakingRef = useRef(false);
  // ⛔ NEVER REPLAY (09-27): the thread follows the visitor across pages, and the voice spoke every
  // reply this page load hadn't spoken — so the home orb opened with the Speed to Lead greeting.
  // A tap speaks only what arrives after it.
  const skipBacklog = useRef(false);

  useEffect(() => {
    session.current = sessionId();
  }, []);

  // WARM ON LOAD — the voice server's GPU container is cold until something asks it for audio,
  // and the first tap should not be the thing that wakes it up. Fire-and-forget: nobody is
  // waiting on this, so a slow or dead voice server must never delay or block the page.
  //
  // ⛔ NO NEW BRAIN ROUTE. There is no dedicated warm/health endpoint on this path (that belongs
  // to another lane); HEADing the speak route for a message id that will never exist ("warm")
  // still reaches the same Modal function and starts it spinning, which is the only thing this
  // needs to do.
  useEffect(() => {
    if (!AGENT_API) return;
    fetch(`${AGENT_API}/${AGENT_PREFIX}/web/speak/warm`, { method: "HEAD" }).catch(() => {});
  }, []);

  const poll = useCallback(async () => {
    if (!AGENT_API || !session.current) return;
    try {
      const r = await fetch(`${AGENT_API}/${AGENT_PREFIX}/web/thread?session=${encodeURIComponent(session.current)}&after=${lastId.current}`);
      const j = await r.json();
      const fresh: Msg[] = j.messages || [];
      if (skipBacklog.current) {
        // The first answer after a tap is the history this visitor already had — shown, never re-spoken.
        skipBacklog.current = false;
        fresh.forEach((x) => { if (x.direction === "outbound") spoken.current.add(x.id); });
      }
      if (fresh.length) {
        lastId.current = fresh[fresh.length - 1].id;
        setMsgs((m) => [
          ...m,
          ...fresh.map((x) => (x.direction === "inbound" && hiddenTexts.current.has(x.body) ? { ...x, hidden: true } : x)),
        ]);
        if (fresh.some((x) => x.direction === "outbound")) setBusy(false);
      }
    } catch {
      /* server asleep or offline — just wait */
    }
  }, []);

  useEffect(() => {
    if (!active) return;
    poll();
    const t = setInterval(poll, pollMs);
    return () => clearInterval(t);
  }, [active, poll, pollMs]);

  // ── speak ─────────────────────────────────────────────────────────────────────────────────
  const listenAgain = useCallback(() => {
    if (handsFree.current) setTimeout(() => startListening(), 150);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function speakWithBrowser(text: string, onEnd: () => void) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) { onEnd(); return; }
    const u = new SpeechSynthesisUtterance(sayItRight(text));
    const voices = window.speechSynthesis.getVoices();
    const want = process.env.NEXT_PUBLIC_AGENT_VOICE || "";
    const pick =
      (want && voices.find((v) => v.name.toLowerCase().includes(want.toLowerCase()))) ||
      voices.find((v) => /^(Daniel|Oliver|Arthur)\b/i.test(v.name) && v.lang.startsWith("en")) ||
      voices.find((v) => /Google UK English Male|Microsoft (Ryan|George|Guy)|Aaron|Fred/i.test(v.name)) ||
      voices.find((v) => v.lang.startsWith("en-GB")) ||
      voices.find((v) => v.lang.startsWith("en"));
    if (pick) u.voice = pick;
    u.rate = 1.0;
    u.onend = onEnd;
    u.onerror = onEnd;
    window.speechSynthesis.speak(u);
  }

  // One id, one line, one voice — used for real replies (id = the message id) AND for the two
  // canned nudge lines (id = "nudge-1" / "nudge-2", pre-cached on the voice server so a silent
  // visitor never waits on a cold GPU). Same server-first, browser-fallback order either way.
  async function speakRaw(id: string | number, text: string, onDone: () => void) {
    speakingRef.current = true;
    setSpeaking(true);
    try { recog.current?.abort(); } catch { /* not listening */ }
    setListening(false);
    let finished = false;
    const onEnd = () => {
      if (finished) return;
      finished = true;
      speakingRef.current = false;
      onDone();
    };
    try {
      const url = `${AGENT_API}/${AGENT_PREFIX}/web/speak/${id}`;
      // ⛔ NO-STORE (09-27): Chrome kept a failed answer for this URL and replayed it in 2ms, so the
      // cloned voice was never asked for and the robot voice spoke instead. One retry before giving up.
      const ask = () => fetch(url, { method: "HEAD", cache: "no-store" });
      const head = await ask().catch(() => new Promise<Response>((r) => setTimeout(() => r(ask()), 1500)));
      if (head.ok) {
        const a = audio.current || new Audio();
        audio.current = a;
        a.src = url;
        a.onended = onEnd;
        a.onerror = () => speakWithBrowser(text, onEnd);
        await a.play();
        return;
      }
    } catch { /* fall through to the browser voice */ }
    speakWithBrowser(text, onEnd);
  }

  async function speak(m: Msg) {
    const done = () => { setSpeaking(false); listenAgain(); };
    await speakRaw(m.id, m.body, done);
  }

  // A system line the thread never carried — the silence nudges. Speaks it, then reopens the mic
  // exactly like a real reply (hands-free only; a typed conversation has no silence to nudge).
  function speakSystemLine(id: string, text: string) {
    const done = () => { setSpeaking(false); listenAgain(); };
    speakRaw(id, text, done);
  }

  // voice mode: speak every new reply aloud, once, in order
  const [voiceOn, setVoiceOn] = useState(false);
  useEffect(() => {
    if (!voiceOn) return;
    const next = msgs.find((m) => m.direction === "outbound" && !spoken.current.has(m.id));
    if (!next || speaking) return;
    spoken.current.add(next.id);
    speak(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [msgs, voiceOn, speaking]);

  // ── send ──────────────────────────────────────────────────────────────────────────────────
  async function send(text: string, o: { hidden?: boolean; open?: boolean } = {}) {
    const t = text.trim();
    if (!t || !AGENT_API) return;
    if (o.hidden) hiddenTexts.current.add(t);
    setBusy(true);
    setActive(true);
    try {
      await fetch(`${AGENT_API}/${AGENT_PREFIX}/web/message`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        // THE PAGE IS CONTEXT: the slug rides with every message so the twin opens on this page's subject.
        body: JSON.stringify({ session: session.current, text: t, page: pageSlug(), ...(o.open ? { open: true } : {}) }),
      });
      setTimeout(poll, 600);
    } catch {
      setBusy(false);
    }
  }

  // ── listen ────────────────────────────────────────────────────────────────────────────────
  function startListening() {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      setHeard("Your browser can't listen — try Chrome or Safari, or type instead.");
      return;
    }
    if (speakingRef.current) return; // the twin is talking; listenAgain reopens the mic when it finishes
    // No pause here: nothing real is playing (the guard above), and pausing killed the tap's silent
    // unlock clip 300ms in — which can leave Safari's audio locked for the first reply.
    const r = new SR();
    r.lang = "en-US";
    r.interimResults = true;
    r.continuous = false;
    r.onresult = (e: any) => {
      let s = "";
      for (const res of e.results) s += res[0].transcript;
      setHeard(s);
      if (e.results[e.results.length - 1].isFinal) {
        gotFinal.current = true;
        setListening(false);
        send(s);
        setHeard("");
      }
    };
    r.onend = () => {
      setListening(false);
      // The browser drops the mic after a pause. Hands-free: if nothing final was heard and
      // nobody is talking, pick it straight back up.
      if (handsFree.current && !gotFinal.current && !speakingRef.current) {
        setTimeout(() => { if (handsFree.current) startListening(); }, 250);
      }
    };
    r.onerror = () => setListening(false);
    recog.current = r;
    gotFinal.current = false;
    setListening(true);
    try { r.start(); } catch { /* already started */ }
  }

  function startHandsFree() {
    // UNLOCK THE MOUTH ON THE TAP (09-27): the reply's audio starts seconds later, outside the tap,
    // and Safari refuses that. Playing a silent clip on this same element inside the tap unlocks it.
    try {
      const a = audio.current || new Audio();
      audio.current = a;
      a.src = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=";
      a.play().catch(() => {});
      window.speechSynthesis?.speak(new SpeechSynthesisUtterance(""));
    } catch { /* no audio on this device */ }
    setMsgs((m) => { m.forEach((x) => { if (x.direction === "outbound") spoken.current.add(x.id); }); return m; });
    skipBacklog.current = true;
    poll();
    handsFree.current = true;
    setVoiceOn(true);
    setActive(true);
    setTimeout(startListening, 300);
  }

  function stopHandsFree() {
    handsFree.current = false;
    speakingRef.current = false;
    try { recog.current?.stop(); } catch { /* ignore */ }
    window.speechSynthesis?.cancel();
    try { audio.current?.pause(); } catch { /* ignore */ }
    setListening(false);
    setSpeaking(false);
  }

  return {
    ready: !!AGENT_API,
    msgs, busy, speaking, listening, heard, active,
    handsFree: () => handsFree.current,
    send, startListening, startHandsFree, stopHandsFree, speakSystemLine,
    setActive, setVoiceOn,
  };
}
