import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import FieldDeepTemplate from "@/components/FieldDeepTemplate";

export const metadata = {
  title: "Roofing | Steven James Consulting",
  description:
    "AI employees for roofing companies — the same playbook, maximized. From solo operator to roll-up.",
};

export default function RoofingPage() {
  return (
    <>
      <Nav />
      <main>
        <FieldDeepTemplate
          name="Roofing"
          intro="I ran a roofing company. I know exactly where the money leaks in this business — and exactly how the same playbook scales it from one truck to a platform."
        />
      </main>
      <Footer />
    </>
  );
}
