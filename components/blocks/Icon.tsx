import React from "react";

// The site's icon set — inline SVG, drawn here, no package and no CDN.
//
// WHY INLINE: the design we ported pulled its icons from unpkg at "@latest". That's a live
// dependency on somebody else's server inside a paying client's website — if it goes down or
// ships a breaking change, every site we've built loses its icons at once, and we find out from
// the client. These are a few hundred bytes of markup that can never break.
//
// One consistent 24×24 grid, 2px strokes, round caps — so any two icons sit together without
// looking like they came from different sets. Fill-style icons (star, paw) are the exception and
// are drawn as filled shapes on the same grid.
//
// Adding one: draw it on a 24×24 box, keep the stroke at 2, and add it to ICONS. The dropdown in
// the builder is generated from this object, so a new entry shows up on its own.

export const ICONS: Record<string, React.ReactNode> = {
  phone: <path d="M4 4h4l2 5-2.5 1.5a12 12 0 0 0 6 6L15 14l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 3 5a1 1 0 0 1 1-1z" />,
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M3 11h18" />
    </>
  ),
  "calendar-check": (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M3 11h18M9 16l2 2 4-4" />
    </>
  ),
  star: <path d="M12 2.5l2.9 5.9 6.6.9-4.8 4.6 1.2 6.5L12 17.3 6.1 20.4l1.2-6.5L2.5 9.3l6.6-.9z" fill="currentColor" stroke="none" />,
  "map-pin": (
    <>
      <path d="M12 22s7-6.1 7-11a7 7 0 1 0-14 0c0 4.9 7 11 7 11z" />
      <circle cx="12" cy="11" r="2.5" />
    </>
  ),
  sparkles: <path d="M12 3l1.8 4.7L18.5 9.5 13.8 11.3 12 16l-1.8-4.7L5.5 9.5l4.7-1.8zM19 15l.9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9z" />,
  check: <path d="M4 12.5l5 5L20 6.5" />,
  "check-circle": (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12.5l2.5 2.5L16 9.5" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5.5l3.5 2" />
    </>
  ),
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 6 9-6" />
    </>
  ),
  "arrow-right": <path d="M4 12h15m-6-6l6 6-6 6" />,
  heart: <path d="M12 20s-7-4.4-7-9.5A4.5 4.5 0 0 1 12 8a4.5 4.5 0 0 1 7 2.5C19 15.6 12 20 12 20z" />,
  paw: (
    <g fill="currentColor" stroke="none">
      <ellipse cx="7" cy="9" rx="2" ry="2.6" />
      <ellipse cx="12" cy="7.5" rx="2" ry="2.8" />
      <ellipse cx="17" cy="9" rx="2" ry="2.6" />
      <path d="M12 12c3 0 5 2.2 5 4.4S15 21 12 21s-5-2.4-5-4.6S9 12 12 12z" />
    </g>
  ),
  bone: <path d="M6.5 9a2.5 2.5 0 1 1 2-4 2.5 2.5 0 0 1 4 1.2l4 4A2.5 2.5 0 0 1 20.5 15a2.5 2.5 0 1 1-2 4 2.5 2.5 0 0 1-4-1.2l-4-4A2.5 2.5 0 0 1 6.5 9z" />,
  scissors: (
    <>
      <circle cx="6" cy="6" r="2.5" />
      <circle cx="6" cy="18" r="2.5" />
      <path d="M8 7.5L20 18M8 16.5L20 6" />
    </>
  ),
  droplet: <path d="M12 3s6 6.2 6 10a6 6 0 0 1-12 0c0-3.8 6-10 6-10z" />,
  wind: <path d="M3 8h11a3 3 0 1 0-3-3M3 13h14a3 3 0 1 1-3 3M3 18h8" />,
  award: (
    <>
      <circle cx="12" cy="9" r="5" />
      <path d="M9 13.5L7.5 21l4.5-2.5L16.5 21 15 13.5" />
    </>
  ),
  shield: <path d="M12 3l7 3v5.5c0 4.5-3 8-7 9.5-4-1.5-7-5-7-9.5V6z" />,
  users: (
    <>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3 20a6 6 0 0 1 12 0M16 5.2a3.2 3.2 0 0 1 0 5.6M17.5 14A6 6 0 0 1 21 20" />
    </>
  ),
  "thumbs-up": <path d="M7 21V10l4.5-7A2 2 0 0 1 14 4.6L13 10h5.5a2 2 0 0 1 2 2.4l-1.4 6A2 2 0 0 1 17 20H7zM7 10H3v11h4" />,
  message: <path d="M21 12a7.5 7.5 0 0 1-8 7.5c-1 0-2-.2-2.9-.5L4 21l1.6-4.4A7 7 0 0 1 4.5 12 7.5 7.5 0 0 1 12.5 4.5 7.5 7.5 0 0 1 21 12z" />,
  home: <path d="M4 11l8-7 8 7v9a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z" />,
  camera: (
    <>
      <path d="M3 8h4l1.5-2.5h7L17 8h4v12H3z" />
      <circle cx="12" cy="13.5" r="3.5" />
    </>
  ),
  truck: (
    <>
      <path d="M2 7h11v9H2zM13 10h4l3 3v3h-7" />
      <circle cx="6" cy="18" r="1.8" />
      <circle cx="17" cy="18" r="1.8" />
    </>
  ),
  wrench: <path d="M20 5.5a5 5 0 0 1-6.8 6.3L6 19a2.1 2.1 0 0 1-3-3l7.2-7.2A5 5 0 0 1 16.5 2z" />,
  leaf: <path d="M20 4C9 4 4 9 4 16c0 1.5.3 2.8.8 4C7 14 12 10 19 9c-5 3-8 6-10 12" />,
  "shower-head": (
    <>
      <path d="M4 20L16 8M13 5l6 6M9 9l6 6" />
      <path d="M12 18v.01M16 20v.01M8 16v.01M20 18v.01" />
    </>
  ),
};

export const ICON_NAMES = Object.keys(ICONS).sort();

// Options list for a Puck select field — generated, so adding an icon above is the only step.
export const ICON_OPTIONS = [
  { label: "None", value: "" },
  ...ICON_NAMES.map((n) => ({ label: n.replace(/-/g, " "), value: n })),
];

export default function Icon({
  name,
  size = 18,
  className = "",
  style,
}: {
  name?: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  if (!name || !ICONS[name]) return null;
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ flexShrink: 0, ...style }}
    >
      {ICONS[name]}
    </svg>
  );
}
