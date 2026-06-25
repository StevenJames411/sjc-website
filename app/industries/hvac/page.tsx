import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import FieldDeepTemplate from "@/components/FieldDeepTemplate";
import EditablePage from "@/components/edit/EditablePage";
import { readPublished } from "@/lib/siteContent";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "HVAC | Steven James Consulting",
  description:
    "AI employees for HVAC shops — the same playbook, maximized. From solo operator to roll-up.",
};

export default async function HvacPage() {
  const published = await readPublished("industry-hvac");
  return (
    <>
      <Nav />
      <main>
        <EditablePage pageKey="industry-hvac" published={published}>
        <FieldDeepTemplate
          tid="hvac"
          name="HVAC"
          eyebrow="HVAC — same shape, I've seen it five times"
          intro="I haven't run an HVAC shop, but I've run five businesses that move exactly like one — and the pattern is the same every time. Your season is a wall: the first 100-degree week hits and every phone in town rings at once, and the unit that goes down in July is an emergency that pays today. You're dispatching techs, chasing parts, and quoting installs while the calls stack up faster than anyone can answer them. You built it one truck at a time, on your own back. What's been capping you was never the wrench work — it's everything happening on the phone while your crew is in the field."
          leaksLede="I've watched this exact leak in every service business I've run. Here's where the money runs out of an HVAC shop, every day:"
          leaks={[
            "The no-AC emergency that calls at 9 p.m. in July — and goes to the competitor who answered while yours rang out.",
            "The $9,000 system-replacement quote that needed a follow-up, and never got one. Big tickets close on the follow-through.",
            "Every call that hits voicemail during the heat wave — the exact week one missed call is a whole install gone.",
            "The maintenance-plan customers who lapse because nobody reminded them their tune-up was due.",
            "The 'let me talk to my spouse' install quote that needed three touches and got none.",
            "Years of past service customers with aging units, due for a replacement, sitting in your system untouched.",
          ]}
          fix="An AI employee closes every one of those leaks at once. It picks up the instant a lead lands — peak-season midnight, weekend, doesn't matter — and reads what the person actually said instead of blasting the same canned text at everybody. It chases the big install quote until it gets a yes or a no, reminds the maintenance-plan customers their tune-up is due, nudges the 'let me check with my spouse' on its own clock, and works your old service list for the units that are ready to be replaced. It books the call straight onto the dispatch calendar — same way every time, every job logged — while your techs stay on the tools."
          rollup="This is the same playbook underneath all five of my businesses — you just point it at HVAC. First you stop the bleed on the shop you've already got: the emergency calls and install quotes you were losing turn into booked revenue, straight to the bottom line. Then you bolt on the next location, the next service area — and the AI layer answers the phones the same way across all of them, no new call center per branch. Own that layer and you stop getting priced like a service company and start getting priced like a platform — a technology multiple, not a trade multiple. That's the path a mergers-and-acquisitions operator runs to build something worth buying. Same playbook, maximized — and AI is the newest weapon in it."
        />
        </EditablePage>
      </main>
      <Footer />
    </>
  );
}
