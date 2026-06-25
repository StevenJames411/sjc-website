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
        <FieldDeepTemplate
          name="Garage Doors"
          eyebrow="Garage doors — same shape, I've seen it five times"
          intro="I haven't run a garage-door shop, but I've run five businesses shaped exactly like one — and the pattern doesn't change. It's a now business: a broken spring or a door off the track is an emergency, the customer's car is trapped in the garage, and they call the first three companies and book whoever picks up. You're out on installs and service calls while the phone keeps ringing back at the shop. You built it one truck at a time, on your own back. The thing capping you was never the install work — it's every call that comes in while your hands are full of a torsion spring."
          leaksLede="I've watched this same leak in every service business I've run. Here's where the money runs out of a garage-door shop, every day:"
          leaks={[
            "The broken-spring emergency that calls while you're on a job — and books the competitor who answered first.",
            "The new-door quote — a real ticket — that needed a follow-up and never got one. Those close on the second and third touch.",
            "Every after-hours and weekend call that hits voicemail, when a stuck door is exactly the kind of thing people call about at night.",
            "The opener and tune-up customers who never hear from you again until something breaks.",
            "The 'send me a price on a new door' that needed three nudges and got zero.",
            "Years of past repair customers with aging doors and openers, due for a replacement, sitting untouched in your system.",
          ]}
          fix="An AI employee closes every one of those leaks at once. It answers the second a lead lands — nights, weekends, mid-emergency, doesn't matter — and reads what the person actually wrote instead of blasting the same canned reply at everybody. It chases the new-door quote until it gets an answer, follows up on the tune-ups, nudges the 'just send me a price' on its own schedule, and works your old repair list for the doors and openers that are ready to be replaced. It books the call straight onto the calendar — same way every time, every job logged — while you stay on the truck."
          rollup="This is the same playbook running under all five of my businesses — you just point it at garage doors. First you stop the bleed on the shop you've got: the emergency calls and new-door quotes you were losing turn into booked jobs, straight to the bottom line. Then you bolt on the next truck, the next territory, the next shop — and the AI layer runs the phones the same way across all of them, no extra front desk per location. Own that layer and you stop getting priced like a service company and start getting priced like a platform — a technology multiple, not a trade multiple. That's the road a mergers-and-acquisitions operator takes to build something worth buying. Same playbook, maximized — and AI is the newest weapon in it."
        />
      </main>
      <Footer />
    </>
  );
}
