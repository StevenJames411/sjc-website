import { ImageResponse } from "next/og";

// The link-preview card for the AI side of the business (everything under the root that
// isn't /websites). Generated in code on purpose: no art file to lose, no CDN to depend on,
// and the copy stays in version control next to the metadata it belongs to.
//
// Next.js wires this into <meta property="og:image"> automatically for this segment and
// every segment below it — do NOT also set openGraph.images in layout.tsx, a manual value
// would win and silently orphan this file. /websites has its own card that overrides this.

export const alt = "Steven James Consulting — AI employees for your business";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          background: "#0f1f3d",
          padding: "80px 88px",
        }}
      >
        {/* accent rule, top-left — the same blue the site uses */}
        <div style={{ display: "flex", width: 88, height: 8, background: "#2563eb", marginBottom: 44 }} />

        <div
          style={{
            display: "flex",
            fontSize: 26,
            letterSpacing: 4,
            textTransform: "uppercase",
            color: "#8fb0e8",
            marginBottom: 26,
          }}
        >
          Steven James Consulting
        </div>

        <div
          style={{
            display: "flex",
            fontSize: 74,
            lineHeight: 1.08,
            fontWeight: 700,
            color: "#ffffff",
            marginBottom: 30,
          }}
        >
          AI employees for your business.
        </div>

        <div
          style={{
            display: "flex",
            fontSize: 32,
            lineHeight: 1.4,
            color: "#c7d6ef",
            maxWidth: 940,
          }}
        >
          They answer every lead in seconds, book the appointments, and cover the phones 24/7 —
          on top of the software you already run.
        </div>

        {/* In normal flow, not absolute — absolute let the centered copy run straight into it. */}
        <div style={{ display: "flex", marginTop: 48, fontSize: 26, color: "#6f8dc4" }}>
          stevenjamesconsulting.com
        </div>
      </div>
    ),
    { ...size }
  );
}
