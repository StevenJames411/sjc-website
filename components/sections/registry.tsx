"use client";
import React from "react";
import HeroReel from "@/components/HeroReel";
import Playbook from "@/components/Playbook";
import TheCeiling from "@/components/TheCeiling";
import Weapon from "@/components/Weapon";
import Proof from "@/components/Proof";
import Platform from "@/components/Platform";
import Moat from "@/components/Moat";
import Next from "@/components/Next";

// Registry of reorderable sections per page. SitePage renders these in the saved order.
// The `label` is what shows in the "Sections" drag-to-reorder panel. Nav and Footer are
// deliberately NOT here — they're the fixed frame, not reorderable content.
//
// HOME = the boutique-baseline spine (who I am + how I help): hero (story) -> playbook (the play)
// -> ceiling (the problem) -> weapon (AI fills the seats) -> proof (live AI employee) -> platform
// (above any one industry — the parent positioning) -> moat (why me) -> close. No vertical router,
// no acquirer-finance layer (the double flywheel + per-field deep pages live off the homepage; the
// surgical M&A math lives in outbound, not here).
export type SectionDef = { key: string; label: string; Component: React.ComponentType };

export const REGISTRY: Record<string, SectionDef[]> = {
  home: [
    { key: "hero", label: "Hero — sizzle reel", Component: HeroReel },
    { key: "playbook", label: "The Playbook You Already Run", Component: Playbook },
    { key: "ceiling", label: "The Ceiling — the Problem", Component: TheCeiling },
    { key: "weapon", label: "What Changed — AI fills the seats", Component: Weapon },
    { key: "proof", label: "Proof — live AI employee", Component: Proof },
    { key: "platform", label: "Above Any One Industry", Component: Platform },
    { key: "moat", label: "The Moat — Why Me", Component: Moat },
    { key: "next", label: "The Next Move", Component: Next },
  ],
};
