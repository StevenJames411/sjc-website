import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import Story from "@/components/Story";
import GerberTrifecta from "@/components/GerberTrifecta";
import CaseStudyTeaser from "@/components/CaseStudyTeaser";
import TwoTierModel from "@/components/TwoTierModel";
import About from "@/components/About";
import OfferSection from "@/components/OfferSection";
import ExitValuation from "@/components/ExitValuation";
import IntakeCTA from "@/components/IntakeCTA";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        {/* 1. GUT PUNCH — the hero (do not change) */}
        <Hero />
        {/* 2. THE PROBLEM EXPLAINED — pain of the entrepreneur trap */}
        <Story />
        {/* 3. THE PERFECT STORM — trifecta, then Gerber as context */}
        <GerberTrifecta />
        {/* 4. CASE STUDY ZERO — proof it works (Chloe's numbers) */}
        <CaseStudyTeaser />
        {/* 5. THE TWO-TIER MODEL — superhuman vs utility seats */}
        <TwoTierModel />
        {/* 6. THE BUILDER — 5 businesses, 40 years, same trenches */}
        <About />
        {/* 7. THE OFFER — install + retainer pricing */}
        <OfferSection />
        {/* 8. YOUR EXIT — the system is the asset */}
        <ExitValuation />
        {/* 9. THE CLOSE — "We build it for you" */}
        <IntakeCTA />
      </main>
      <Footer />
    </>
  );
}
