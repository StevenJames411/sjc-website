"use client";
import { useEffect, useState } from "react";

// Owner-only floating "Edit this page" button. Lives on every public page (added once in the
// root layout). Maps the current path to its builder slug and links straight to /edit/<slug>,
// so the owner never has to type the URL. Hidden for non-owners and on the builder itself.
const PATH_TO_SLUG: Record<string, string> = {
  "/": "home",
  "/about": "about",
  "/industries": "industries",
  "/med-spa": "med-spa",
  "/industries/hvac": "industry-hvac",
  "/industries/roofing": "industry-roofing",
  "/industries/garage-doors": "industry-garage-doors",
  "/faqs": "faqs",
  "/case-study": "case-study",
  "/tech": "tech",
  "/board-of-directors": "board-of-directors",
  "/raising-capital": "raising-capital",
  "/podcast": "podcast",
  "/for-agencies": "for-agencies",
};

export default function EditLink() {
  const [slug, setSlug] = useState<string | null>(null);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    const raw = window.location.pathname.replace(/\/+$/, "") || "/";
    setSlug(PATH_TO_SLUG[raw] ?? null);
    fetch("/api/auth-status")
      .then((r) => r.json())
      .then((j) => setAuthed(Boolean(j && j.authed)))
      .catch(() => {});
  }, []);

  if (!authed || !slug) return null;

  return (
    <a
      href={`/edit/${slug}`}
      style={{
        position: "fixed",
        left: 18,
        bottom: 18,
        zIndex: 950,
        background: "#2563eb",
        color: "#fff",
        borderRadius: 10,
        padding: "10px 16px",
        fontSize: 14,
        fontWeight: 700,
        boxShadow: "0 10px 26px rgba(0,0,0,0.28)",
        fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
        textDecoration: "none",
      }}
    >
      ✎ Edit this page
    </a>
  );
}
