"use client";
import { useEffect, useState } from "react";

// Owner-only floating "Edit this page" button. Lives on every public page (added once in the
// root layout). Maps the current path to its builder slug and links straight to /edit/<slug>,
// so the owner never has to type the URL. Hidden for non-owners and on the builder itself.
const PATH_TO_SLUG: Record<string, string> = {
  "/": "home",
  "/about": "about",
  "/podcast": "podcast",
  "/faqs": "faqs",
  "/apply": "apply",
  "/guest": "guest",
  "/websites": "websites",
};

export default function EditLink() {
  const [slug, setSlug] = useState<string | null>(null);
  const [authed, setAuthed] = useState(false);
  // ⚠️ NOT ON /edit. The back-office rail carries its own Sign out now, and this one is
  // position:fixed — two sign-out buttons on the same screen, one of them floating over the page.
  // Mounted in the ROOT layout, so it cannot be excluded by a nested layout; it has to opt out.
  const [inBackOffice, setInBackOffice] = useState(false);

  useEffect(() => {
    const raw = window.location.pathname.replace(/\/+$/, "") || "/";
    setSlug(PATH_TO_SLUG[raw] ?? null);
    setInBackOffice(raw === "/edit" || raw.startsWith("/edit/"));
    fetch("/api/auth-status")
      .then((r) => r.json())
      .then((j) => setAuthed(Boolean(j && j.authed)))
      .catch(() => {});
  }, []);

  async function signOut() {
    try {
      await fetch("/api/logout", { method: "POST" });
    } catch {
      /* ignore — reload re-checks auth either way */
    }
    window.location.reload();
  }

  // Owner is signed in. Always offer Sign out; show Edit only on pages that map to a builder slug.
  if (!authed || inBackOffice) return null;

  const font = "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif";

  return (
    <div
      style={{
        position: "fixed",
        left: 18,
        bottom: 18,
        zIndex: 950,
        display: "flex",
        alignItems: "center",
        gap: 8,
      }}
    >
      {slug && (
        <a
          href={`/edit/${slug}`}
          style={{
            background: "#2563eb",
            color: "#fff",
            borderRadius: 10,
            padding: "10px 16px",
            fontSize: 14,
            fontWeight: 700,
            boxShadow: "0 10px 26px rgba(0,0,0,0.28)",
            fontFamily: font,
            textDecoration: "none",
          }}
        >
          ✎ Edit this page
        </a>
      )}
      <button
        onClick={signOut}
        style={{
          background: "#1f2937",
          color: "#e5e7eb",
          border: "1px solid #374151",
          borderRadius: 10,
          padding: "10px 14px",
          fontSize: 13,
          fontWeight: 600,
          cursor: "pointer",
          boxShadow: "0 10px 26px rgba(0,0,0,0.28)",
          fontFamily: font,
        }}
      >
        Sign out
      </button>
    </div>
  );
}
