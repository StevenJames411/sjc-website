"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

// ↻ — run a sweep and stay on the board.
//
// ⚠️ IT USED TO BE A LINK TO /api/cron/checks, WHICH NAVIGATES TO JSON. You pressed "run one now"
// to refresh the board and landed on a wall of raw output, then had to press Back to see the thing
// you had just refreshed. A control whose whole purpose is "update what I am looking at" must not
// take you away from what you are looking at.
//
// The icon carries it: a circular arrow reads as refresh everywhere, so the words are only needed
// while it is working.
export default function SweepButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  return (
    <button
      type="button"
      disabled={busy}
      title="Run every check now"
      aria-label="Run every check now"
      onClick={async () => {
        setBusy(true);
        try {
          await fetch("/api/cron/checks", { credentials: "same-origin" });
          router.refresh();
        } finally {
          setBusy(false);
        }
      }}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        background: "none",
        border: "none",
        padding: 0,
        font: "inherit",
        color: "var(--e-accent)",
        cursor: busy ? "default" : "pointer",
        opacity: busy ? 0.6 : 1,
      }}
    >
      <span
        aria-hidden
        style={{
          display: "inline-block",
          fontSize: 14,
          lineHeight: 1,
          // Spins only while it is actually working — a permanently spinning icon says nothing.
          animation: busy ? "sjc-spin 900ms linear infinite" : undefined,
        }}
      >
        ↻
      </span>
      {busy ? "sweeping…" : null}
      <style>{"@keyframes sjc-spin{to{transform:rotate(360deg)}}"}</style>
    </button>
  );
}
