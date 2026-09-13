"use client";
import { useEffect } from "react";

// PREVIEW ONLY (Steven, 09-13): "I just want the clear navigation for preview only... until I
// change everything, I want the old blue navigation left alone." The server knows a request is an
// owner's ?preview=1 (lib/puckContent previewRequested); this stamps that fact on <html> so CSS
// can gate on it — the floating nav over the talking hero reads BOTH marks, and a visitor on the
// published page never gets this one. Renders nothing.
export default function PreviewMark() {
  useEffect(() => {
    document.documentElement.setAttribute("data-sjc-preview", "1");
    return () => document.documentElement.removeAttribute("data-sjc-preview");
  }, []);
  return null;
}
