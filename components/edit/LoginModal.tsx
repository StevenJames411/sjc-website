"use client";
import React, { useState } from "react";

// Editor sign-in box. Posts the password to /api/login; on success the auth cookie is
// set and the caller flips into edit mode. Public visitors never see this.
export default function LoginModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(false);
    try {
      const r = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pw }),
      });
      const j = await r.json();
      if (j && j.ok) onSuccess();
      else setErr(true);
    } catch {
      setErr(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={overlay} onClick={onClose}>
      <form style={card} onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4, color: "#0f1f3d" }}>
          Edit this site
        </div>
        <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 16 }}>
          Enter the editor password.
        </div>
        {err && <div style={errBox}>Incorrect password.</div>}
        <input
          autoFocus
          type="password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          placeholder="Password"
          style={input}
        />
        <button type="submit" disabled={busy} style={btn}>
          {busy ? "…" : "Enter"}
        </button>
      </form>
    </div>
  );
}

const overlay: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(15,31,61,0.45)",
  zIndex: 1000,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};
const card: React.CSSProperties = {
  background: "#fff",
  borderRadius: 12,
  padding: 28,
  width: 320,
  boxShadow: "0 20px 50px rgba(0,0,0,0.25)",
  fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
};
const input: React.CSSProperties = {
  width: "100%",
  border: "1px solid #d1d5db",
  borderRadius: 8,
  padding: "10px 12px",
  fontSize: 15,
  marginBottom: 12,
  outline: "none",
  boxSizing: "border-box",
};
const btn: React.CSSProperties = {
  width: "100%",
  background: "#2563eb",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  padding: "11px",
  fontSize: 15,
  fontWeight: 600,
  cursor: "pointer",
};
const errBox: React.CSSProperties = {
  background: "#fef2f2",
  border: "1px solid #fecaca",
  color: "#b91c1c",
  borderRadius: 8,
  padding: "8px 10px",
  fontSize: 13,
  marginBottom: 12,
};
