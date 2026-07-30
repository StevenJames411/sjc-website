import { ImageResponse } from "next/og";

// The link-preview card for the WEBSITE side of the business. This is the image a small
// business owner sees when Steven texts them stevenjamesconsulting.com/websites — so it
// speaks their language, not the AI language of the root site. Sitting in this folder is
// what makes it override the root card for this route.
//
// ⚠️ NO PRICE HERE, same rule as the description in page.tsx. This reaches the prospect
// before the discovery call; the number belongs on the call.

export const alt = "A real website for your business — live in three days";
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
          background: "#ffffff",
          padding: "80px 88px",
        }}
      >
        {/* Light card, deliberately unlike the dark AI card — a different business, a
            different first impression, even at thumbnail size in a text message. */}
        <div style={{ display: "flex", width: 88, height: 8, background: "#2563eb", marginBottom: 44 }} />

        <div
          style={{
            display: "flex",
            fontSize: 26,
            letterSpacing: 4,
            textTransform: "uppercase",
            color: "#4b5563",
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
            color: "#111827",
            marginBottom: 30,
          }}
        >
          A real website for your business.
        </div>

        <div
          style={{
            display: "flex",
            fontSize: 32,
            lineHeight: 1.4,
            color: "#4b5563",
            maxWidth: 940,
          }}
        >
          Your work, your reviews, your phone number — and a contact form that texts you the
          second someone fills it out. Live in three days. You never touch any of it.
        </div>

        {/* In normal flow, not absolute — absolute let the centered copy run straight into it. */}
        <div style={{ display: "flex", marginTop: 48, fontSize: 26, color: "#6b7280" }}>
          stevenjamesconsulting.com/websites
        </div>
      </div>
    ),
    { ...size }
  );
}
