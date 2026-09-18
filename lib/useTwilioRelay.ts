"use client";
// THE HERO'S TALK LANE, TWILIO CONVERSATIONRELAY (ruled 2026-09-18, the-hero-is-the-same-
// conversation-as-the-phone-agent). Lab-only, gated behind ?relay=1 on the live-mode hero —
// nothing here runs on any other page. Rents the plumbing (Twilio) and the mouth (a stock
// ElevenLabs voice inside ConversationRelay); no phone number, browser mic only.

import { useCallback, useEffect, useRef, useState } from "react";
import { AGENT_API, AGENT_PREFIX } from "./useAgentThread";

export type RelayState = "idle" | "connecting" | "live" | "ended";

function pageSlug(): string {
  return window.location.pathname.replace(/^\/+|\/+$/g, "") || "home";
}

export function useTwilioRelay(voiceId: string) {
  const [state, setState] = useState<RelayState>("idle");
  const [error, setError] = useState("");
  const deviceRef = useRef<any>(null);
  const callRef = useRef<any>(null);
  const startingRef = useRef(false);
  // THE TWIN'S MOVEMENT SIGNAL (ruled 2026-09-18, believable-movement-in-relay-mode): the SDK's
  // own 'volume' event, read every frame by the hero's animation loop — refs, not state, so a
  // ring following them does not re-render React 60x/sec. Reset to 0 the moment the call ends,
  // so a stale "still speaking" ring never outlives the call.
  const inputVolume = useRef(0);
  const outputVolume = useRef(0);

  const hangup = useCallback(() => {
    try { callRef.current?.disconnect(); } catch { /* ignore */ }
    try { deviceRef.current?.destroy(); } catch { /* ignore */ }
    callRef.current = null;
    deviceRef.current = null;
    inputVolume.current = 0;
    outputVolume.current = 0;
    setState("ended");
  }, []);

  useEffect(() => {
    const onLeave = () => hangup();
    window.addEventListener("beforeunload", onLeave);
    return () => {
      window.removeEventListener("beforeunload", onLeave);
      hangup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const start = useCallback(async () => {
    if (!AGENT_API || startingRef.current || state === "connecting" || state === "live") return;
    startingRef.current = true;
    setError("");
    setState("connecting");
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      const r = await fetch(`${AGENT_API}/${AGENT_PREFIX}/voice/token`, { method: "POST" });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.token) {
        setError(j.reason || `token request failed (${r.status})`);
        setState("idle");
        return;
      }
      const { Device } = await import("@twilio/voice-sdk");
      const device = new Device(j.token, { logLevel: "error" });
      deviceRef.current = device;
      // The SDK's own ringing/disconnect tones are built for a softphone, not a website hero —
      // the orb's "connecting" state is the only feedback wanted (Steven, 2026-09-18: heard a
      // phone ringing on the first real call).
      device.audio?.outgoing(false);
      device.audio?.disconnect(false);
      device.audio?.incoming(false);
      device.on("error", (e: any) => { setError(e?.message || "device error"); setState("ended"); });
      const params: Record<string, string> = { page: pageSlug() };
      if (voiceId) params.voice = voiceId;
      const call = await device.connect({ params });
      callRef.current = call;
      call.on("accept", () => setState("live"));
      call.on("disconnect", () => setState("ended"));
      call.on("cancel", () => setState("ended"));
      call.on("reject", () => setState("ended"));
      call.on("error", (e: any) => { setError(e?.message || "call error"); setState("ended"); });
    } catch (e: any) {
      setError(e?.message || "microphone permission denied");
      setState("idle");
    } finally {
      startingRef.current = false;
    }
  }, [state, voiceId]);

  const toggle = useCallback(() => {
    if (state === "idle" || state === "ended") start(); else hangup();
  }, [state, start, hangup]);

  return { state, error, start, hangup, toggle };
}
