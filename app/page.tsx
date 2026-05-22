import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import Story from "@/components/Story";
import PainPillars from "@/components/PainPillars";
import Solution from "@/components/Solution";
import About from "@/components/About";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Story />
        <PainPillars />
        <Solution />
        <About />
      </main>
      <Footer />
    </>
  );
}
