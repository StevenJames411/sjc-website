import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import FieldDeepTemplate from "@/components/FieldDeepTemplate";

export const metadata = {
  title: "Garage Doors | Steven James Consulting",
  description:
    "AI employees for garage-door businesses — the same playbook, maximized. From solo operator to roll-up.",
};

export default function GarageDoorsPage() {
  return (
    <>
      <Nav />
      <main>
        <FieldDeepTemplate name="Garage Doors" />
      </main>
      <Footer />
    </>
  );
}
