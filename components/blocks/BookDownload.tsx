"use client";
// /book-thank-you: the download buttons (two for the book, three for the study guide) only work for a finished
// order (see app/api/book-checkout GET).
import { useEffect } from "react";

export default function BookDownload() {
  useEffect(() => {
    const a = document.querySelector<HTMLAnchorElement>('[data-sjc-sec="book-thank-you"] a[data-sjc-link="h1"], #sbookty a[data-sjc-link="h1"]');
    const k = document.querySelector<HTMLAnchorElement>('[data-sjc-sec="book-thank-you"] a[data-sjc-link="h2"], #sbookty a[data-sjc-link="h2"]');
    // The downloads sit in one marked area (pictures with a button under each); older layouts had the buttons
    // directly in one box, so that still works.
    const box = (a?.closest("[data-sjc-dl]") as HTMLElement | null) || a?.parentElement;
    if (!a || !k || !box) return;
    // The locked view: the "forgot my password" box. Type the email, a fresh link goes to that inbox.
    const COPPER = "display:block;width:100%;text-align:center;font-weight:700;padding:14px 24px;border-radius:9999px;color:#1A0E06;border:1.5px solid #F6C48A;background:linear-gradient(90deg,#8F4515 0%,#BF7530 31%,#D58A42 50%,#BF7530 69%,#8F4515 100%);box-shadow:0 0 24px rgba(224,138,46,.35);cursor:pointer;font-size:16px";
    const lock = (msg: string) => {
      box.innerHTML = "";
      // The box is dimmed to half while the order is being checked. A locked page must come back to full
      // strength, or the buttons and the message sit at half brightness (Steven, 2026-10-08).
      box.style.opacity = "1"; box.style.maxWidth = "440px";
      const p = document.createElement("p"); p.textContent = msg; p.style.cssText = "color:#fff;margin:0 0 4px;line-height:1.5";
      const form = document.createElement("form"); form.style.cssText = "display:flex;flex-direction:column;gap:12px;margin:0";
      const input = document.createElement("input"); input.type = "email"; input.required = true; input.autocomplete = "email";
      input.placeholder = "The email you bought the book with"; input.setAttribute("aria-label", "The email you bought the book with");
      input.style.cssText = "width:100%;padding:13px 16px;border-radius:12px;border:1.5px solid #F6C48A;background:#FBF6EA;color:#1A0E06;font-size:16px";
      const send = document.createElement("button"); send.type = "submit"; send.textContent = "Send My Digital Assets Page"; send.style.cssText = COPPER;
      form.append(input, send);
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const email = input.value.trim(); if (!email) return;
        send.disabled = true; send.textContent = "Sending...";
        fetch("/api/book-checkout", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) })
          .catch(() => null)
          .then(() => {
            const ok = document.createElement("p"); ok.style.cssText = "color:#fff;margin:0;line-height:1.5";
            ok.textContent = "If that email bought the book, a fresh link is on its way to it now. Check your inbox, and your spam folder too.";
            form.replaceWith(ok);
          });
      });
      box.append(p, form);
      // No "Get The Book" button here (Steven, 2026-10-08): nobody reaches this page without having bought it.
      // The page's own words say "Here is your book", which is only true for a buyer.
      const sec = box.closest("section");
      const h = sec?.querySelector("h1"); if (h) h.textContent = "Attention To Dollars";
      const eyebrow = h?.previousElementSibling; if (eyebrow) eyebrow.textContent = "The book";
      const lede = h?.nextElementSibling; if (lede && lede !== box) (lede as HTMLElement).style.display = "none";
      // The download area sits BELOW the top of the page. A returning buyer must not have to scroll past the
      // book to find the email box, so when the page is locked the box moves up under the heading.
      const lead = h?.parentElement;
      if (lead && !lead.contains(box)) { box.style.marginTop = "18px"; lead.appendChild(box); }
    };
    const q = new URLSearchParams(window.location.search);
    const id = q.get("session_id") || "";
    const fresh = q.get("k") || "";
    // THE OWNER ALWAYS SEES THE BUYER'S PAGE (Steven, 2026-10-08: he opened "?preview=" without the 1 and got the
    // locked view). With no order and no fresh link in the address, the page asks as the owner; the server
    // says yes only to the signed-in owner, so a stranger still lands on the locked view.
    const preview = !id && !fresh;
    const AGAIN = "Type the email you bought the book with and we will send a fresh download page to that inbox.";
    const OUT = "That download link has run out. Type the email you bought the book with and we will send a fresh download page to that inbox.";
    box.style.opacity = "0.5";
    const ask = preview ? "preview=1" : fresh ? "k=" + encodeURIComponent(fresh) : "session_id=" + encodeURIComponent(id);
    fetch("/api/book-checkout?" + ask + "&t=" + Date.now(), { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => {
        if (!j.paid) {
          const ranOut = j.expired || q.get("expired") === "1";
          lock(ranOut ? OUT : AGAIN);
          return;
        }
        a.href = j.apple; k.href = j.kindle; box.style.opacity = "1";
        // The three study guide buttons sit in the same box, so the lock above clears them with the rest.
        for (const [key, href] of [["h4", j.guidePhone], ["h5", j.guideTablet], ["h6", j.guideLaptop]] as const) {
          const g = box.querySelector<HTMLAnchorElement>(`a[data-sjc-link="${key}"]`);
          if (g && href) g.href = href;
        }
      })
      .catch(() => lock("Something went wrong loading your download. Refresh the page, or type the email you bought the book with and we will send a fresh link."));
  }, []);
  return null;
}
