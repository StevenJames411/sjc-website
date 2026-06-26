"use client";
import { useEffect, useState } from "react";
import { Puck, type Data } from "@measured/puck";
import "@measured/puck/puck.css";
import { config, SEED } from "@/components/puck/config";

// The Puck visual-builder canvas for /about. The whole site is password-gated by middleware,
// so only Steven reaches this. He drags/adds/deletes/reorders blocks here; "Publish" snapshots
// the layout to the live /about page. Until he publishes, /about keeps showing the old page.
export default function AboutEditPage() {
  const [data, setData] = useState<Data | null>(null);

  // Load the saved draft; first time (nothing saved) open to the seeded current About page.
  useEffect(() => {
    fetch("/api/puck?page=about")
      .then((r) => r.json())
      .then((j) => setData(j && j.data && Array.isArray(j.data.content) ? j.data : SEED))
      .catch(() => setData(SEED));
  }, []);

  if (!data) {
    return <div style={{ padding: 40, fontFamily: "sans-serif" }}>Loading editor…</div>;
  }

  const saveDraft = (d: Data) =>
    fetch("/api/puck", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ page: "about", data: d }),
    });

  return (
    <div style={{ height: "100vh" }}>
      <Puck
        config={config}
        data={data}
        iframe={{ enabled: false }}
        onPublish={async (d) => {
          await saveDraft(d);
          await fetch("/api/puck?page=about&action=publish", {
            method: "POST",
            credentials: "same-origin",
          });
          if (typeof window !== "undefined") {
            window.alert("Published — your changes are now live on the /about page.");
          }
        }}
      />
    </div>
  );
}
