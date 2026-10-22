// The privacy policy and terms, written by us (Steven, 2026-10-22: the free third-party generator still
// named ARV Venture Group; "obviously we could make our own"). Plain words, Tiger Digital Design LLC as the
// company, and the text-message language the carriers look for in an A2P review: what the texts are, how to
// stop them, and that a mobile number is never handed to anyone else for their marketing.
import type { ReactNode } from "react";

export const LEGAL = {
  company: "Tiger Digital Design LLC",
  dba: "Steven James Consulting",
  place: "Shavano Park, Texas",
  email: "support@stevenjamesconsulting.com",
  phone: "(210) 851-4906",
  updated: "October 22, 2026",
};

export function LegalPage({ eyebrow, title, children }: { eyebrow: string; title: string; children: ReactNode }) {
  return (
    <main style={{ background: "#0b0b0b", color: "#fff", minHeight: "100vh" }}>
      <div style={{ maxWidth: 780, margin: "0 auto", padding: "clamp(48px,7vw,96px) clamp(16px,5vw,48px)" }}>
        <div style={{ fontSize: 11, letterSpacing: ".3em", textTransform: "uppercase", color: "#c9a227" }}>{eyebrow}</div>
        <h1 style={{ font: "300 clamp(32px,5vw,54px)/1.1 Georgia, serif", margin: "18px 0 8px" }}>{title}</h1>
        <p style={{ margin: "0 0 28px", fontSize: 14, color: "rgba(255,255,255,.45)" }}>Last updated {LEGAL.updated}</p>
        <div className="sjc-legal">{children}</div>
      </div>
      <style>{`
        .sjc-legal{font-size:17px;line-height:1.8;color:rgba(255,255,255,.74);font-weight:300}
        .sjc-legal h2{font:400 clamp(23px,3vw,29px)/1.25 Georgia,serif;color:#fff;margin:40px 0 10px}
        .sjc-legal p{margin:0 0 16px}
        .sjc-legal ul{margin:0 0 16px;padding-left:1.2em}
        .sjc-legal li{margin:0 0 10px}
        .sjc-legal strong{color:#fff;font-weight:500}
        .sjc-legal a{color:#c9a227;text-decoration:underline;text-underline-offset:3px}
      `}</style>
    </main>
  );
}

export function Reach() {
  return (
    <>
      email <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a> or call {LEGAL.phone}
    </>
  );
}
