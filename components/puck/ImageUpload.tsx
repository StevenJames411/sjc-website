"use client";
import React, { useRef, useState } from "react";

// Custom Puck field rendered inside the Image block's sidebar panel.
// "Upload image" picks a file → POSTs to /api/upload → sets the block src to the
// returned public Blob URL. The URL text box below lets Steven paste a hosted link
// instead (either/or). A small preview shows the current image.
export default function ImageUpload({
  value,
  onChange,
}: {
  value: string;
  onChange: (url: string) => void;
}) {
  const [status, setStatus] = useState<"idle" | "uploading" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatus("uploading");
    setErrorMsg("");
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      if (!res.ok) throw new Error(`Upload failed (${res.status})`);
      const json = await res.json();
      if (!json.url) throw new Error("No URL returned");
      onChange(json.url);
      setStatus("idle");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Upload failed");
      setStatus("error");
    }
    // Reset so the same file can be re-selected if needed.
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={handleFile}
      />

      <button
        type="button"
        disabled={status === "uploading"}
        onClick={() => inputRef.current?.click()}
        style={BTN}
      >
        {status === "uploading" ? "Uploading…" : "Upload image"}
      </button>

      {status === "error" && (
        <span style={{ fontSize: 12, color: "#dc2626" }}>{errorMsg}</span>
      )}

      <span style={{ fontSize: 12, color: "#6b7280" }}>Or paste a URL</span>
      <input
        type="text"
        value={value || ""}
        placeholder="https://…"
        onChange={(e) => onChange(e.target.value)}
        style={URL_INPUT}
      />

      {value && (
        <img
          src={value}
          alt="preview"
          style={{
            marginTop: 2,
            maxHeight: 80,
            maxWidth: "100%",
            objectFit: "contain",
            borderRadius: 4,
            border: "1px solid #e5e7eb",
          }}
        />
      )}
    </div>
  );
}

const BTN: React.CSSProperties = {
  padding: "7px 14px",
  borderRadius: 6,
  border: "1px solid #d1d5db",
  background: "#ffffff",
  fontSize: 13,
  fontWeight: 600,
  color: "#111827",
  cursor: "pointer",
};

const URL_INPUT: React.CSSProperties = {
  width: "100%",
  padding: "6px 10px",
  borderRadius: 6,
  border: "1px solid #d1d5db",
  fontSize: 13,
  color: "#111827",
  background: "#ffffff",
};
