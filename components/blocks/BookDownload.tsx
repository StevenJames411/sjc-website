"use client";
// /book-thank-you: the two download buttons only work for a finished order (see app/api/book-checkout GET).
import { useEffect } from "react";

export default function BookDownload() {
  useEffect(() => {
    const a = document.querySelector<HTMLAnchorElement>('[data-sjc-sec="book-thank-you"] a[data-sjc-link="h1"], #sbookty a[data-sjc-link="h1"]');
    const k = document.querySelector<HTMLAnchorElement>('[data-sjc-sec="book-thank-you"] a[data-sjc-link="h2"], #sbookty a[data-sjc-link="h2"]');
    const box = a?.parentElement;
    if (!a || !k || !box) return;
    const lock = (msg: string) => {
      box.innerHTML = "";
      const p = document.createElement("p"); p.textContent = msg; p.style.cssText = "color:#fff;margin:0 0 14px;line-height:1.5";
      const b = document.createElement("a"); b.href = "/get-the-book"; b.textContent = "Get The Book"; b.className = a.className;
      box.append(p, b);
    };
    const id = new URLSearchParams(window.location.search).get("session_id") || "";
    if (!id) { lock("This page opens after you buy the book."); return; }
    box.style.opacity = "0.5";
    fetch("/api/book-checkout?session_id=" + encodeURIComponent(id))
      .then((r) => r.json())
      .then((j) => {
        if (!j.paid) { lock("We could not find a finished order for this link. If you paid, email support@stevenjamesconsulting.com and we will send the book."); return; }
        a.href = j.apple; k.href = j.kindle; box.style.opacity = "1";
      })
      .catch(() => lock("Something went wrong loading your download. Refresh the page, or email support@stevenjamesconsulting.com."));
  }, []);
  return null;
}
