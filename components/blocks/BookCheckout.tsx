"use client";
// The book's card form, mounted into the page's own [data-sjc-book-checkout] slot (see app/api/book-checkout).
// Stripe's script is loaded here, only on this page, and only the card form comes from Stripe.
import { useEffect, useState } from "react";

declare global {
  interface Window { Stripe?: (pk: string) => { initEmbeddedCheckout: (o: { fetchClientSecret: () => Promise<string> }) => Promise<{ mount: (el: Element) => void; destroy: () => void }> } }
}

const PK = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "";

export default function BookCheckout() {
  const [problem, setProblem] = useState("");
  useEffect(() => {
    const slot = document.querySelector("[data-sjc-book-checkout]");
    if (!slot) return;
    let checkout: { destroy: () => void } | null = null;
    let gone = false;
    const start = async () => {
      try {
        if (!PK || !window.Stripe) throw new Error("not ready");
        const c = await window.Stripe(PK).initEmbeddedCheckout({
          fetchClientSecret: async () => {
            const r = await fetch("/api/book-checkout", { method: "POST" });
            const j = await r.json();
            if (!r.ok || !j.clientSecret) throw new Error(j.error || "no session");
            return j.clientSecret as string;
          },
        });
        if (gone) { c.destroy(); return; }
        checkout = c;
        slot.innerHTML = "";
        c.mount(slot);
      } catch {
        setProblem("The checkout did not load. Refresh the page, or use Apply To Work With Us below and we will send you the book.");
      }
    };
    const existing = document.querySelector<HTMLScriptElement>('script[src="https://js.stripe.com/v3/"]');
    if (window.Stripe) start();
    else if (existing) existing.addEventListener("load", start, { once: true });
    else {
      const s = document.createElement("script");
      s.src = "https://js.stripe.com/v3/"; s.async = true; s.onload = start; s.onerror = () => setProblem("The checkout did not load. Please refresh the page.");
      document.head.appendChild(s);
    }
    return () => { gone = true; checkout?.destroy(); };
  }, []);
  useEffect(() => {
    if (!problem) return;
    const slot = document.querySelector("[data-sjc-book-checkout]");
    if (slot) slot.textContent = problem;
  }, [problem]);
  return null;
}
