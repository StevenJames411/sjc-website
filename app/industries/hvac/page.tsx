import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import FieldDeepTemplate from "@/components/FieldDeepTemplate";

export const metadata = {
  title: "HVAC | Steven James Consulting",
  description:
    "AI employees for HVAC shops — the same playbook, maximized. From solo operator to roll-up.",
};

export default function HvacPage() {
  return (
    <>
      <Nav />
      <main>
        <FieldDeepTemplate name="HVAC" />
      </main>
      <Footer />
    </>
  );
}
