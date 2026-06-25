"use client";
import React from "react";
import Hero from "@/components/Hero";
import Playbook from "@/components/Playbook";
import Owners from "@/components/Owners";
import Ceiling from "@/components/Ceiling";
import Flip1 from "@/components/Flip1";
import Flip2 from "@/components/Flip2";
import Flip3 from "@/components/Flip3";
import Flywheel from "@/components/Flywheel";
import Proof from "@/components/Proof";
import Platform from "@/components/Platform";
import Partnership from "@/components/Partnership";
import Moat from "@/components/Moat";
import Next from "@/components/Next";

// Registry of reorderable sections per page. SitePage renders these in the saved order.
// The `label` is what shows in the "Sections" drag-to-reorder panel. Nav and Footer are
// deliberately NOT here — they're the fixed frame, not reorderable content.
export type SectionDef = { key: string; label: string; Component: React.ComponentType };

export const REGISTRY: Record<string, SectionDef[]> = {
  home: [
    { key: "hero", label: "Hero", Component: Hero },
    { key: "playbook", label: "The Playbook You Already Run", Component: Playbook },
    { key: "owners", label: "Your Hardest Adversary Is the Owners", Component: Owners },
    { key: "ceiling", label: "The Ceiling on the Multiple", Component: Ceiling },
    { key: "flip1", label: "Flip One — Earnings per Location", Component: Flip1 },
    { key: "flip2", label: "Flip Two — Re-Rate the Platform", Component: Flip2 },
    { key: "flip3", label: "Flip Three — The Owners Say Yes", Component: Flip3 },
    { key: "flywheel", label: "Why It Compounds", Component: Flywheel },
    { key: "proof", label: "A Working Prototype", Component: Proof },
    { key: "platform", label: "The Platform", Component: Platform },
    { key: "partnership", label: "The Partnership", Component: Partnership },
    { key: "moat", label: "The Moat — Why Me", Component: Moat },
    { key: "next", label: "The Next Move", Component: Next },
  ],
};
