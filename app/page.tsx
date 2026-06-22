import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import Problem from "@/components/Problem";
import GerberTrifecta from "@/components/GerberTrifecta";
import TwoTierModel from "@/components/TwoTierModel";
import ExitValuation from "@/components/ExitValuation";
import CaseStudyTeaser from "@/components/CaseStudyTeaser";
import OfferSection from "@/components/OfferSection";
import AuditSection from "@/components/AuditSection";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        {/* 1. HERO — the wedge: you need AI, keep the keys */}
        <Hero />
        {/* 2. SPEED TO LEAD — deliverable one */}
        <Problem />
        {/* 3. STEP ONE vs STEP TWO — linear legacy follow-up → dynamic AI employee */}
        <GerberTrifecta />
        {/* 4. CONTROL, NOT DEPENDENCE — keep the keys, rent the plumbing */}
        <TwoTierModel />
        {/* 5. WHY ME — 40 years, five businesses, runs his own company on it */}
        <ExitValuation />
        {/* 6. THE PROOF — the machine is the receipt (case study) */}
        <CaseStudyTeaser />
        {/* 7. THE EXPANSION — start with one seat, grow the org chart; build + monthly */}
        <OfferSection />
        {/* 8. YOUR NEXT MOVE — book the call */}
        <AuditSection />
      </main>
      <Footer />
    </>
  );
}
