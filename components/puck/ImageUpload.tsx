"use client";
import React, { useRef, useState } from "react";
import { prepareImage } from "@/lib/imagePrep";

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
  const [status, setStatus] = useState<"idle" | "preparing" | "uploading" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [note, setNote] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMsg("");
    setNote("");
    try {
      // Every file goes through here first — HEIC decoded, oversized photos scaled down, GPS
      // and the rest of the EXIF dropped. See lib/imagePrep.ts for why it's the browser's job.
      setStatus("preparing");
      const { file: ready, note: what } = await prepareImage(file);

      setStatus("uploading");
      const form = new FormData();
      form.append("file", ready);
      // Which site this photo belongs to, so the blob lands under `sites/<id>/` and is deletable
      // with the site. Read from the URL rather than threaded through props: a Puck custom field is
      // rendered by the library, not by us, and the builder is only ever mounted at
      // /edit/<site>/<page>. No match leaves the server's own default.
      const site = window.location.pathname.match(/^\/edit\/([a-z0-9-]+)\//i)?.[1] || "";
      const res = await fetch(`/api/upload${site ? `?site=${encodeURIComponent(site)}` : ""}`, {
        method: "POST",
        body: form,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || `Upload failed (${res.status})`);
      }
      const json = await res.json();
      if (!json.url) throw new Error("No URL returned");
      onChange(json.url);
      if (what) setNote(what);
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
        disabled={status === "preparing" || status === "uploading"}
        onClick={() => inputRef.current?.click()}
        style={BTN}
      >
        {status === "preparing"
          ? "Preparing photo…"
          : status === "uploading"
            ? "Uploading…"
            : "Upload image"}
      </button>

      {status === "error" && (
        <span style={{ fontSize: 12, color: "#dc2626" }}>{errorMsg}</span>
      )}

      {note && (
        <span style={{ fontSize: 12, color: "#16a34a" }}>{note}</span>
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
