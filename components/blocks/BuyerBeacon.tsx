"use client";
// Tells the website a book buyer opened this page (lib/bookBuyers.ts). It only speaks up on a device their
// download page marked; every other visitor sends nothing.
import { useEffect } from "react";

export default function BuyerBeacon() {
  useEffect(() => {
    if (!/(?:^|;\s*)sjc_b=1/.test(document.cookie)) return;
    const body = JSON.stringify({ path: window.location.pathname });
    try {
      fetch("/api/buyer-view", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true, credentials: "same-origin" }).catch(() => null);
    } catch {
      /* a page view that is not logged is not worth breaking the page over */
    }
  }, []);
  return null;
}
