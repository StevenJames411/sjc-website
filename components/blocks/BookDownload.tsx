"use client";
// /book-thank-you: the download buttons (two for the book, three for the study guide) only work for a finished
// order (see app/api/book-checkout GET).
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
      const b = document.createElement("a"); b.href = "/get-the-book"; b.textContent = "Get The Book";
      b.style.cssText = "display:block;text-align:center;font-weight:700;padding:14px 24px;border-radius:9999px;color:#1A0E06;border:1.5px solid #F6C48A;background:linear-gradient(90deg,#8F4515 0%,#BF7530 31%,#D58A42 50%,#BF7530 69%,#8F4515 100%);box-shadow:0 0 24px rgba(224,138,46,.35)";
      box.append(p, b);
      // The page's own words say "Here is your book", which is only true for a buyer.
      const sec = box.closest("section");
      const h = sec?.querySelector("h1"); if (h) h.textContent = "Attention To Dollars";
      const eyebrow = h?.previousElementSibling; if (eyebrow) eyebrow.textContent = "The book";
      const lede = h?.nextElementSibling; if (lede && lede !== box) (lede as HTMLElement).style.display = "none";
    };
    const q = new URLSearchParams(window.location.search);
    const id = q.get("session_id") || "";
    const preview = q.get("preview") === "1";
    if (!id && !preview) { lock("This page opens after you buy the book."); return; }
    box.style.opacity = "0.5";
    fetch((preview ? "/api/book-checkout?preview=1" : "/api/book-checkout?session_id=" + encodeURIComponent(id)) + "&t=" + Date.now(), { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => {
        if (!j.paid) { lock("We could not find a finished order for this link. If you paid, email support@stevenjamesconsulting.com and we will send the book."); return; }
        a.href = j.apple; k.href = j.kindle; box.style.opacity = "1";
        // The three study guide buttons sit in the same box, so the lock above clears them with the rest.
        for (const [key, href] of [["h4", j.guidePhone], ["h5", j.guideTablet], ["h6", j.guideLaptop]] as const) {
          const g = box.querySelector<HTMLAnchorElement>(`a[data-sjc-link="${key}"]`);
          if (g && href) g.href = href;
        }
      })
      .catch(() => lock("Something went wrong loading your download. Refresh the page, or email support@stevenjamesconsulting.com."));
  }, []);
  return null;
}
