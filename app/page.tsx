import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import Story from "@/components/Story";
import GerberTrifecta from "@/components/GerberTrifecta";
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
        {/* 4. THE TWO-TIER MODEL — superhuman vs utility seats */}
        <TwoTierModel />
        {/* 5. THE BUILDER — 5 businesses, 40 years, same trenches */}
        <About />
        {/* 6. THE OFFER — install + retainer pricing */}
        <OfferSection />
        {/* 7. YOUR EXIT — the system is the asset */}
        <ExitValuation />
        {/* 8. THE CLOSE — assessment funnel */}
        <IntakeCTA />
      </main>
      <Footer />
    </>
  );
}
