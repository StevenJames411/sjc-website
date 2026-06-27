"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Puck, type Data } from "@measured/puck";
import "@measured/puck/puck.css";
import { config } from "@/components/puck/config";
import { seedFor } from "@/components/puck/seeds";
import { PUCK_PAGES } from "@/lib/puckPages";

// The unified visual builder for ANY page. A thin bar on top adds the two things Puck doesn't
// give us: a page-switcher dropdown (jump between all our pages) and auto-save (every change
// quietly written to the cloud, with a Saving…/Saved indicator). Puck's own header keeps the
// Publish button (draft stays private until Publish pushes it live). The whole site is
// password-gated by middleware, so only the owner reaches this.
//
// To reset a page to its seed: navigate to /edit/<page>?reset=1 — the URL param triggers the
// reset on load and is then stripped, so no fumble-able button sits on the toolbar.
type SaveState = "idle" | "saving" | "saved";

export default function PuckEditor({ page, title }: { page: string; title: string }) {
  const router = useRouter();
  const [data, setData] = useState<Data | null>(null);
  const [save, setSave] = useState<SaveState>("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const writeDraft = (d: Data) => {
    setSave("saving");
    return fetch("/api/puck", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ page, data: d }),
    })
      .then(() => setSave("saved"))
      .catch(() => setSave("idle"));
  };

  // Load this page's saved draft, or fall back to its seed. If ?reset=1 is in the URL,
  // load the seed directly (and strip the param) — deliberate recovery, not a fumble-able button.
  useEffect(() => {
    let alive = true;
    setData(null);

    const params = new URLSearchParams(window.location.search);
    if (params.get("reset") === "1") {
      const url = new URL(window.location.href);
      url.searchParams.delete("reset");
      window.history.replaceState({}, "", url.toString());
      const s = seedFor(page, title);
      setData(s);
      fetch("/api/puck", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ page, data: s }),
      });
      return () => { alive = false; };
    }

    fetch(`/api/puck?page=${encodeURIComponent(page)}`)
      .then((r) => r.json())
      .then((j) => {
        if (!alive) return;
        setData(j && j.data && Array.isArray(j.data.content) ? j.data : seedFor(page, title));
      })
      .catch(() => alive && setData(seedFor(page, title)));
    return () => {
      alive = false;
    };
  }, [page, title]);

  // Debounced auto-save on every edit.
  const onChange = (d: Data) => {
    if (timer.current) clearTimeout(timer.current);
    setSave("saving");
    timer.current = setTimeout(() => writeDraft(d), 800);
  };

  if (!data) {
    return <div style={{ padding: 40, fontFamily: "sans-serif" }}>Loading editor…</div>;
  }

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <div style={bar}>
        <span style={{ fontWeight: 700, fontSize: 13 }}>Page:</span>
        <select
          value={page}
          onChange={(e) => router.push(`/edit/${e.target.value}`)}
          style={select}
        >
          {PUCK_PAGES.map((p) => (
            <option key={p.slug} value={p.slug}>
              {p.title}
            </option>
          ))}
        </select>
        <span style={{ fontSize: 12, color: save === "saved" ? "#16a34a" : "#6b7280" }}>
          {save === "saving" ? "Saving…" : save === "saved" ? "Saved" : ""}
        </span>
        <span style={{ marginLeft: "auto", fontSize: 12, color: "#6b7280" }}>
          Edits auto-save as a draft · use Publish to go live · reset via /edit/{page}?reset=1
        </span>
      </div>
      <div style={{ flex: 1, minHeight: 0, position: "relative" }}>
        <Puck
          key={page}
          config={config}
          data={data}
          iframe={{ enabled: false }}
          onChange={onChange}
          onPublish={async (d) => {
            await writeDraft(d);
            await fetch(`/api/puck?page=${encodeURIComponent(page)}&action=publish`, {
              method: "POST",
              credentials: "same-origin",
            });
            if (typeof window !== "undefined") {
              const path = page === "home" ? "/" : `/${page}`;
              window.alert(`Published — live on ${path}`);
            }
          }}
        />
      </div>
    </div>
  );
}

const bar: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "8px 14px",
  borderBottom: "1px solid #e5e7eb",
  background: "#fff",
  fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
};
const select: React.CSSProperties = {
  border: "1px solid #d1d5db",
  borderRadius: 6,
  padding: "5px 8px",
  fontSize: 13,
  fontWeight: 600,
  background: "#fff",
  cursor: "pointer",
};
