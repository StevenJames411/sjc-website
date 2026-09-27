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
  const [preparing, setPreparing] = useState(false); // a reply arrived; its voice is loading
  const [listening, setListening] = useState(false);
  const [heard, setHeard] = useState("");
  const [active, setActive] = useState(false);    // polling on/off
  // Why the mic can't be used, if it can't: "unsupported" (no speech recognition in this browser —
  // Firefox, some in-app webviews) or "blocked" (permission denied / no microphone). The hero shows a
  // type box instead of dead-ending on "I'm here".
  const [micProblem, setMicProblem] = useState<"" | "unsupported" | "blocked">("");
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
  // ⛔ A STOP IS A STOP (09-27): every tap-stop bumps this. Anything started before it — a voice still
  // loading, a play() in flight, a recognizer finalising — checks it and drops itself.
  const epoch = useRef(0);
  // One poll at a time: two taps' worth of polls used to overlap, add the same messages twice, and
  // race the backlog marker. A second call while one is in flight joins it.
  const pollInFlight = useRef<Promise<boolean> | null>(null);
  // The history read that must finish before an opening message goes out, so the new greeting can
  // never be mistaken for backlog.
  const backlogRead = useRef<Promise<void> | null>(null);
  // Hands-free mic: opened only after the greeting has been voiced, not 300ms after the tap.
  const waitingForGreeting = useRef(false);
  const micErrors = useRef(0);
  const quickEnds = useRef(0);

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

  const poll = useCallback((): Promise<boolean> => {
    if (!AGENT_API || !session.current) return Promise.resolve(false);
    if (pollInFlight.current) return pollInFlight.current;
    const run = (async () => {
      try {
        const r = await fetch(`${AGENT_API}/${AGENT_PREFIX}/web/thread?session=${encodeURIComponent(session.current)}&after=${lastId.current}`);
        const j = await r.json();
        const fresh: Msg[] = (j.messages || []).filter((x: Msg) => x.id > lastId.current);
        if (skipBacklog.current) {
          // The first answer after a tap is the history this visitor already had — shown, never re-spoken.
          // Cleared only by a poll that SUCCEEDED, so a failed read can't hand the flag to the greeting.
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
        return true;
      } catch {
        return false; /* server asleep or offline — just wait */
      } finally {
        pollInFlight.current = null;
      }
    })();
    pollInFlight.current = run;
    return run;
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

  // One id, one line, one voice — used for real replies (id = the message id) AND for the two
  // canned nudge lines (id = "nudge-1" / "nudge-2", pre-cached on the voice server so a silent
  // visitor never waits on a cold GPU). Same server-first, browser-fallback order either way.
  async function speakRaw(id: string | number, _text: string, onDone: () => void) {
    // ⛔ HIS VOICE OR NOTHING (09-27): the robot browser voice is gone. It fired whenever the cloned
    // voice was slow or a stop-tap aborted play() — "sounded like a computer piece of shit". Now a
    // miss is silence (the words are still in the thread), and a stop is a stop.
    const my = epoch.current;
    const alive = () => my === epoch.current;
    speakingRef.current = true;
    setPreparing(true);
    try { recog.current?.abort(); } catch { /* not listening */ }
    recog.current = null;
    setListening(false);
    let finished = false;
    const onEnd = () => {
      if (finished) return;
      finished = true;
      if (!alive()) return; // a stop already reset everything; this line's ending belongs to nobody
      speakingRef.current = false;
      setPreparing(false);
      onDone();
    };
    const url = `${AGENT_API}/${AGENT_PREFIX}/web/speak/${id}`;
    // ⛔ NO-STORE: Chrome once replayed a cached failure in 2ms. A model reply's voice measured 4-29s to
    // make on 09-27; the server shares one render per reply, so retrying for up to a minute just
    // re-attaches to it instead of starting over.
    let ok = false;
    // A canned line ("nudge-1") is a fixed recording, not a render: three quick tries, as before.
    const maxTries = typeof id === "number" ? 6 : 3;
    const deadline = Date.now() + 60000;
    for (let i = 0; i < maxTries && !ok && Date.now() < deadline; i++) {
      if (!alive()) return onEnd(); // stopped while we waited
      try { ok = (await fetch(url, { method: "HEAD", cache: "no-store" })).ok; } catch { ok = false; }
      if (!ok) await new Promise((r) => setTimeout(r, 1500));
    }
    if (!ok || !alive()) return onEnd();
    const a = audio.current || new Audio();
    audio.current = a;
    a.onplaying = () => { if (!alive()) return; setPreparing(false); setSpeaking(true); }; // the mouth moves when the sound does
    a.onended = onEnd;
    a.onerror = onEnd;
    a.src = url;
    try { await a.play(); } catch { onEnd(); }
    // A stop that landed between the last check and play() resolving: silence it now.
    if (!alive()) { try { a.pause(); } catch { /* ignore */ } }
  }

  async function speak(m: Msg) {
    const done = () => { setSpeaking(false); waitingForGreeting.current = false; listenAgain(); };
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
  // ⛔ ONE REPLY AT A TIME (09-27): the guard read only `speaking`, which turns true when sound starts —
  // a second reply arriving while the first one's voice was still loading started a second voice on the
  // same element. speakingRef is true from the moment a line is picked up until it finishes.
  useEffect(() => {
    if (!voiceOn) return;
    if (speaking || preparing || speakingRef.current) return;
    const next = msgs.find((m) => m.direction === "outbound" && !spoken.current.has(m.id));
    if (!next) return;
    spoken.current.add(next.id);
    speak(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [msgs, voiceOn, speaking, preparing]);

  // ⛔ NEVER "THINKING…" FOREVER (09-27): a turn the server answers with nothing (the model chose
  // silence, a human is in the thread, bot-off, opt-out) left the orb thinking with the mic shut. After
  // 45s with no reply the wait ends and, hands-free, the mic reopens.
  useEffect(() => {
    if (!busy) return;
    const my = epoch.current;
    const t = setTimeout(() => {
      if (my !== epoch.current) return;
      setBusy(false);
      waitingForGreeting.current = false;
      if (handsFree.current && !speakingRef.current) startListening();
    }, 45000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busy]);

  // ── send ──────────────────────────────────────────────────────────────────────────────────
  async function send(text: string, o: { hidden?: boolean; open?: boolean } = {}) {
    const t = text.trim();
    if (!t || !AGENT_API) return;
    if (o.hidden) hiddenTexts.current.add(t);
    setBusy(true);
    setActive(true);
    // The tap's history read lands first, so this message's reply can't be swallowed as backlog.
    if (backlogRead.current) { await backlogRead.current; backlogRead.current = null; }
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
      setMicProblem("unsupported");
      setListening(false);
      return;
    }
    if (micErrors.current >= 3) { setListening(false); return; } // mic denied: the type box takes over
    if (speakingRef.current) { setListening(false); return; } // the twin is talking; listenAgain reopens the mic when it finishes
    if (waitingForGreeting.current) { setListening(false); return; } // the greeting's end opens the mic
    // No pause here: nothing real is playing (the guard above), and pausing killed the tap's silent
    // unlock clip 300ms in — which can leave Safari's audio locked for the first reply.
    try { recog.current?.abort(); } catch { /* none running */ }
    const my = epoch.current;
    const r = new SR();
    const startedAt = Date.now();
    const mine = () => my === epoch.current && recog.current === r && handsFree.current;
    r.lang = "en-US";
    r.interimResults = true;
    r.continuous = false;
    r.onresult = (e: any) => {
      // ⛔ A STOP IS A STOP: a recognizer finalising after the stop tap must not send.
      if (!mine()) return;
      let s = "";
      for (const res of e.results) s += res[0].transcript;
      setHeard(s);
      const last = e.results[e.results.length - 1];
      if (last.isFinal) {
        micErrors.current = 0;
        quickEnds.current = 0;
        // NOISE IS NOT A TURN (09-27): a beep became "nope" and "outer space", and the twin answered both.
        // Drop a final that is a single character, or that the browser itself scored as a low-confidence
        // guess (0 means "not reported" on some browsers, so it is kept).
        const conf = typeof last[0]?.confidence === "number" ? last[0].confidence : 0;
        const said = s.trim();
        if (said.length < 2 || (conf > 0 && conf < 0.45)) { setHeard(""); return; } // onend reopens the mic
        gotFinal.current = true;
        setListening(false);
        send(said);
        setHeard("");
      }
    };
    r.onend = () => {
      if (!mine()) return;
      const quick = Date.now() - startedAt < 600;
      quickEnds.current = quick ? quickEnds.current + 1 : 0;
      // The browser drops the mic after a pause. Hands-free: if nothing final was heard and
      // nobody is talking, pick it straight back up — and keep "Listening…" on screen through the
      // 250ms gap instead of flickering to "I'm here". A mic that dies instantly five times running
      // is broken, not idle: stop the loop and offer the type box.
      if (!gotFinal.current && !speakingRef.current && quickEnds.current < 5 && micErrors.current < 3) {
        setTimeout(() => {
          if (mine() && !speakingRef.current) startListening();
          else setListening(false);
        }, 250);
      } else {
        setListening(false);
        if (quickEnds.current >= 5 || micErrors.current >= 3) setMicProblem("blocked");
      }
    };
    r.onerror = (e: any) => {
      if (!mine()) return;
      const err = String(e?.error || "");
      if (err === "not-allowed" || err === "service-not-allowed" || err === "audio-capture") {
        micErrors.current = 3; // denied or no microphone: never retry in a loop
        setMicProblem("blocked");
        setListening(false);
      } else if (err !== "no-speech" && err !== "aborted") {
        micErrors.current += 1;
      }
    };
    recog.current = r;
    gotFinal.current = false;
    setListening(true);
    try {
      r.start();
    } catch {
      // Starting failed outright: never leave the listening film and "Listening…" stuck on.
      recog.current = null;
      setListening(false);
      setMicProblem("blocked");
    }
  }

  // `waitForReply`: an opening message is about to go out — keep the mic shut until its greeting has
  // been voiced (the greeting used to cut off a mic that opened 0.5s after the tap).
  function startHandsFree(o: { waitForReply?: boolean } = {}) {
    epoch.current += 1;
    // UNLOCK THE MOUTH ON THE TAP (09-27): the reply's audio starts seconds later, outside the tap,
    // and Safari refuses that. Playing a silent clip on this same element inside the tap unlocks it.
    // Old handlers are cleared first, or the clip fires a stopped line's onplaying/onended.
    try {
      const a = audio.current || new Audio();
      audio.current = a;
      a.onplaying = null; a.onended = null; a.onerror = null;
      a.src = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=";
      a.play().catch(() => {});
    } catch { /* no audio on this device */ }
    setMsgs((m) => { m.forEach((x) => { if (x.direction === "outbound") spoken.current.add(x.id); }); return m; });
    skipBacklog.current = true;
    backlogRead.current = (async () => {
      for (let i = 0; i < 3; i++) {
        if (await poll()) return;
        await new Promise((r) => setTimeout(r, 700));
      }
      skipBacklog.current = false; // server unreachable: don't let the flag eat the next reply
    })();
    // A fresh tap tries the mic again (the visitor may have just allowed it); a denial fires once, no loop.
    micErrors.current = 0;
    quickEnds.current = 0;
    setMicProblem("");
    handsFree.current = true;
    waitingForGreeting.current = !!o.waitForReply;
    speakingRef.current = false;
    setVoiceOn(true);
    setActive(true);
    if (!o.waitForReply) setTimeout(startListening, 300);
  }

  function stopHandsFree() {
    epoch.current += 1;
    handsFree.current = false;
    speakingRef.current = false;
    waitingForGreeting.current = false;
    // abort, not stop: stop() delivers one last final result, which used to send after the stop tap.
    try { recog.current?.abort(); } catch { /* ignore */ }
    recog.current = null;
    try {
      const a = audio.current;
      if (a) { a.onplaying = null; a.onended = null; a.onerror = null; a.pause(); }
    } catch { /* ignore */ }
    // Nothing voices after a stop, and the tab stops polling: a reply still being written lands in the
    // thread and is treated as backlog on the next tap.
    setVoiceOn(false);
    setActive(false);
    setBusy(false);
    setListening(false);
    setSpeaking(false);
    setPreparing(false);
  }

  return {
    ready: !!AGENT_API,
    msgs, busy, speaking, preparing, listening, heard, active, micProblem,
    handsFree: () => handsFree.current,
    send, startListening, startHandsFree, stopHandsFree, speakSystemLine,
    setActive, setVoiceOn,
  };
}
