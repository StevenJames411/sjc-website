"use client";
import React from "react";
import Hero from "@/components/Hero";
import Wound from "@/components/Wound";
import Problem from "@/components/Problem";
import GerberTrifecta from "@/components/GerberTrifecta";
import TwoTierModel from "@/components/TwoTierModel";
import ExitValuation from "@/components/ExitValuation";
import CaseStudyTeaser from "@/components/CaseStudyTeaser";
import OfferSection from "@/components/OfferSection";
import AuditSection from "@/components/AuditSection";

// Registry of reorderable sections per page. SitePage renders these in the saved order.
// The `label` is what shows in the "Sections" drag-to-reorder panel. Nav and Footer are
// deliberately NOT here — they're the fixed frame, not reorderable content.
export type SectionDef = { key: string; label: string; Component: React.ComponentType };

export const REGISTRY: Record<string, SectionDef[]> = {
  home: [
    { key: "hero", label: "Hero", Component: Hero },
    { key: "wound", label: "The Two Flywheels", Component: Wound },
    { key: "step", label: "Why This Re-Rates", Component: GerberTrifecta },
    { key: "problem", label: "The Working Model", Component: Problem },
    { key: "proof", label: "Vertical One — The Proof", Component: CaseStudyTeaser },
    { key: "expansion", label: "The Platform", Component: OfferSection },
    { key: "control", label: "The Partnership", Component: TwoTierModel },
    { key: "why", label: "The Moat", Component: ExitValuation },
    { key: "next", label: "The Next Move", Component: AuditSection },
  ],
};
