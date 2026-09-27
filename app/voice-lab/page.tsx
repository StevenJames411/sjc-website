"use client";
// THE VOICE LAB (2026-09-27). Steven: "Let's hear the voices I could pick from for Twilio and put Opus back in."
// A private page (noindex, in no menu) that runs the REAL fast path — Twilio ConversationRelay in the browser, the
// brain on SJC_TALK_MODEL (claude-opus-5) — in each of the four stock voices the server allows (voice_routes.py
// RELAY_VOICES, the one list; Brian is the server default he picked by ear 09-18). Tap a voice, talk, tap to hang up.

import { useEffect, useState } from "react";
import { useTwilioRelay } from "@/lib/useTwilioRelay";

const VOICES = [
  { id: "CwhRBWXzGAHq8TQ4Fs17", name: "Roger", note: "confident, warm, resonant" },
  { id: "pqHfZKP75CvOlQylNhV4", name: "Bill", note: "older, trustworthy" },
  { id: "nPczCjzI2devNBz1zQrb", name: "Brian", note: "deep, middle-aged (your 09-18 pick)" },
  { id: "cjVigY5qzO86Huf0OWal", name: "Eric", note: "warm, friendly, mid-40s" },
];

export default function VoiceLab() {
  const [voice, setVoice] = useState("");
  const relay = useTwilioRelay(voice);
  const [want, setWant] = useState(false);

  // Start once the hook has re-rendered with the chosen voice.
  useEffect(() => {
    if (want && voice && (relay.state === "idle" || relay.state === "ended")) { setWant(false); relay.start(); }
  }, [want, voice, relay]);

  function pick(id: string) {
    if (relay.state === "live" || relay.state === "connecting") relay.hangup();
    setVoice(id);
    setWant(true);
  }

  const live = relay.state === "live" || relay.state === "connecting";
  const current = VOICES.find((v) => v.id === voice);

  return (
    <main style={{ minHeight: "100vh", background: "#0A0E27", color: "#fff", padding: "48px 16px", fontFamily: "system-ui, sans-serif" }}>
      <meta name="robots" content="noindex,nofollow" />
      <div style={{ maxWidth: 560, margin: "0 auto" }}>
        <h1 style={{ fontSize: 30, margin: "0 0 8px" }}>Voice lab</h1>
        <p style={{ fontSize: 17, lineHeight: 1.5, margin: "0 0 28px" }}>
          Tap a voice and talk to it. It is the real fast setup: Twilio in your browser, the brain on Opus 5. Tap the same
          voice again, or Hang up, to end.
        </p>
        <div style={{ display: "grid", gap: 12 }}>
          {VOICES.map((v) => {
            const on = v.id === voice && live;
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => (on ? relay.hangup() : pick(v.id))}
                style={{
                  textAlign: "left", padding: "18px 20px", borderRadius: 14, cursor: "pointer", fontSize: 18,
                  border: on ? "2px solid #f0b323" : "2px solid #fff", background: on ? "#f0b323" : "transparent",
                  color: on ? "#0A0E27" : "#fff",
                }}
              >
                <strong>{v.name}</strong> — {v.note}
                <span style={{ float: "right", fontWeight: 700 }}>{on ? (relay.state === "connecting" ? "Connecting…" : "Live — tap to hang up") : "Talk"}</span>
              </button>
            );
          })}
        </div>
        <p style={{ fontSize: 16, marginTop: 24 }}>
          {current ? `${current.name}: ${relay.state}` : "Pick a voice."}
          {relay.error ? ` — ${relay.error}` : ""}
        </p>
        {live ? (
          <button type="button" onClick={() => relay.hangup()} style={{ marginTop: 8, padding: "12px 22px", borderRadius: 999, border: 0, background: "#fff", color: "#0A0E27", fontWeight: 800, fontSize: 16, cursor: "pointer" }}>
            Hang up
          </button>
        ) : null}
      </div>
    </main>
  );
}
