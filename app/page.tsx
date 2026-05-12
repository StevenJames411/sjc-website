import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import ProblemFraming from "@/components/ProblemFraming";
import AuditReveals from "@/components/AuditReveals";
import StatCta from "@/components/StatCta";
import About from "@/components/About";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <ProblemFraming />
        <AuditReveals />
        <StatCta />
        <About />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
