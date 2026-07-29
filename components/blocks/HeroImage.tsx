import React from "react";
import { resolveColor, resolveColorOr } from "@/lib/brandColor";

// The hero photo treatment that makes a $795 site read like a $3,000 one: a rounded photo in a
// thick white frame, tilted a few degrees, with a soft colour glow behind it and small "floating"
// cards sitting on its corners.
//
// WHY THIS IS ONE BLOCK instead of an Image plus some Cards: the badges are positioned ON the
// photo, which means they have to live inside the same box. Trying to assemble this from separate
// blocks would need absolute positioning controls in the builder — a pile of knobs that only ever
// get used together. One block with plain fields is far easier to edit and impossible to
// mis-assemble.
//
// Every effect is OPTIONAL and off-by-default-ish, so the same block also renders a plain photo.
// Setting a badge's title to empty removes that badge entirely.

export type HeroImageProps = {
  src: string;
  alt: string;
  height: number;      // px, the photo's height on desktop
  tilt: number;        // degrees; 0 = straight
  glow: string;        // hex behind the photo, or "" for none
  frame: string;       // border colour ("" = no frame)
  radius: number;      // corner rounding in px
  badgeTitle: string;  // bottom-left card, bold line
  badgeBody: string;   // bottom-left card, small line
  pillText: string;    // top-right pill
  pillColor: string;   // top-right pill background
  spaceAbove: number;
  spaceBelow: number;
};

export const HERO_IMAGE_DEFAULTS: HeroImageProps = {
  src: "",
  alt: "",
  height: 560,
  tilt: 0,
  glow: "",
  frame: "#ffffff",
  radius: 40,
  badgeTitle: "",
  badgeBody: "",
  pillText: "",
  pillColor: "#10b981",
  spaceAbove: 0,
  spaceBelow: 0,
};

export default function HeroImage(props: Partial<HeroImageProps>) {
  const p = { ...HERO_IMAGE_DEFAULTS, ...props };
  const num = (v: unknown, d: number) => (typeof v === "number" ? v : d);

  const height = num(p.height, 560);
  const tilt = num(p.tilt, 0);
  const radius = num(p.radius, 40);

  // Nothing to show yet — say so in the builder rather than rendering an empty box the owner
  // can't see or click.
  if (!p.src) {
    return (
      <div
        className="flex items-center justify-center rounded-3xl border-2 border-dashed border-gray-300 text-sm text-gray-500"
        style={{ height: Math.min(height, 320) }}
      >
        Add a photo in the panel on the right →
      </div>
    );
  }

  return (
    <div
      className="relative"
      style={{
        paddingTop: `${num(p.spaceAbove, 0)}px`,
        paddingBottom: `${num(p.spaceBelow, 0)}px`,
      }}
    >
      {/* Soft colour glow behind the photo. Tilted the opposite way so it peeks out on both
          sides instead of hiding exactly behind the frame. */}
      {p.glow ? (
        <div
          aria-hidden
          className="absolute inset-0 blur-xl"
          style={{
            background: resolveColor(p.glow),
            borderRadius: `${radius + 8}px`,
            transform: `rotate(${-tilt - 3}deg) scale(1.02)`,
            opacity: 0.18,
          }}
        />
      ) : null}

      <div
        className="relative overflow-hidden bg-white"
        style={{
          borderRadius: `${radius}px`,
          transform: tilt ? `rotate(${tilt}deg)` : undefined,
          border: p.frame ? `6px solid ${resolveColor(p.frame)}` : undefined,
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.18)",
        }}
      >
        {/* Deliberately a plain <img>: the rest of the builder still uses one, and swapping the
            whole site to next/image is its own board item (it needs intrinsic dimensions saved
            at upload time, which today's uploads don't capture). */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={p.src}
          alt={p.alt || ""}
          className="w-full object-cover"
          style={{ height: `${height}px`, display: "block" }}
        />

        {/* Bottom-left floating card. Counter-rotated so it sits level while the photo is tilted —
            a tilted card reads like a mistake. */}
        {p.badgeTitle ? (
          <div
            className="absolute bottom-5 left-5 right-5 sm:right-auto rounded-2xl bg-white/95 px-5 py-4 shadow-xl backdrop-blur-md"
            style={{ transform: tilt ? `rotate(${-tilt}deg)` : undefined }}
          >
            <p className="text-base font-extrabold leading-tight text-gray-900">{p.badgeTitle}</p>
            {p.badgeBody ? (
              <p className="mt-0.5 text-sm font-semibold text-gray-600">{p.badgeBody}</p>
            ) : null}
          </div>
        ) : null}

        {/* Top-right pill — the "Open Today" style status flag. */}
        {p.pillText ? (
          <div
            className="absolute right-5 top-5 rounded-full px-4 py-2 text-sm font-bold text-white shadow-lg"
            style={{
              background: resolveColorOr(p.pillColor, "#10b981"),
              transform: tilt ? `rotate(${-tilt}deg)` : undefined,
            }}
          >
            {p.pillText}
          </div>
        ) : null}
      </div>
    </div>
  );
}
