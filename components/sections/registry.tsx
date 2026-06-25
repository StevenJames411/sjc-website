"use client";
import React from "react";
import HeroReel from "@/components/HeroReel";
import IndustriesStrip from "@/components/IndustriesStrip";
import Playbook from "@/components/Playbook";
import TheCeiling from "@/components/TheCeiling";
import Weapon from "@/components/Weapon";
import WhereItLeads from "@/components/WhereItLeads";
import Proof from "@/components/Proof";
import FourTables from "@/components/FourTables";
import Moat from "@/components/Moat";
import Next from "@/components/Next";

// Registry of reorderable sections per page. SitePage renders these in the saved order.
// The `label` is what shows in the "Sections" drag-to-reorder panel. Nav and Footer are
// deliberately NOT here — they're the fixed frame, not reorderable content.
//
// HOME = the journey spine (solo -> exit): hero sizzle-reel routes the reader, the Industries
// strip hands them their field, then playbook -> weapon -> where-it-leads -> proof -> the four
// tables -> moat -> CTA. The deep M&A sections (Owners, Ceiling, Flip2/3, Platform, Partnership)
// are no longer on the homepage — they relocate into the per-field deep pages.
export type SectionDef = { key: string; label: string; Component: React.ComponentType };

export const REGISTRY: Record<string, SectionDef[]> = {
  home: [
    { key: "hero", label: "Hero — sizzle reel", Component: HeroReel },
    { key: "findYourField", label: "Find Your Field", Component: IndustriesStrip },
    { key: "playbook", label: "The Playbook You Already Run", Component: Playbook },
    { key: "ceiling", label: "The Ceiling — the Problem", Component: TheCeiling },
    { key: "weapon", label: "The Weapon — AI employees", Component: Weapon },
    { key: "whereItLeads", label: "Where It Leads — the M&A play", Component: WhereItLeads },
    { key: "proof", label: "Proof — Chloe", Component: Proof },
    { key: "fourTables", label: "The Four Tables", Component: FourTables },
    { key: "moat", label: "The Moat — Why Me", Component: Moat },
    { key: "next", label: "The Next Move", Component: Next },
  ],
};
