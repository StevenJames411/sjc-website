import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import PainPillars from "@/components/PainPillars";

export const metadata = {
  title: "Discover the Lies — Steven James Consulting",
  description:
    "Six lies the world sold you when you opened your business. Pick the one that hits hardest — we'll show you the way out.",
};

export default function DiscoverTheLies() {
  return (
    <>
      <Nav />
      <main>
        <PainPillars />
      </main>
      <Footer />
    </>
  );
}
