"use client";
import React from "react";
import Hero from "@/components/Hero";
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
    { key: "problem", label: "Speed to Lead", Component: Problem },
    { key: "step", label: "Step One vs Step Two", Component: GerberTrifecta },
    { key: "control", label: "Control, Not Dependence", Component: TwoTierModel },
    { key: "why", label: "Why Me", Component: ExitValuation },
    { key: "proof", label: "The Proof", Component: CaseStudyTeaser },
    { key: "expansion", label: "The Expansion", Component: OfferSection },
    { key: "next", label: "Your Next Move", Component: AuditSection },
  ],
};
