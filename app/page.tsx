import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import Story from "@/components/Story";
import PerfectStorm from "@/components/PerfectStorm";
import CaseStudy from "@/components/CaseStudy";
import About from "@/components/About";
import Offer from "@/components/Offer";
import IntakeCTA from "@/components/IntakeCTA";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Story />
        <PerfectStorm />
        <CaseStudy />
        <About />
        <Offer />
        <IntakeCTA />
      </main>
      <Footer />
    </>
  );
}
