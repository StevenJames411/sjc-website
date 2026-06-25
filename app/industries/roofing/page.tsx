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
          eyebrow="Roofing — I ran one of these"
          live={false}
          intro="I ran a roofing company. So I'm not guessing here — I know how this one moves. The phone runs your week: a storm rolls through, the leads pile up all at once, and whoever calls back first gets the job. You're up on a roof or running a crew while the next ten callers go to the next guy in the truck. You built it on your own back, every hat your own, and the thing that's been holding you back was never the work — it's everything that happens off the ladder while your hands are full."
          leaksLede="I've stood in this exact spot. Here's where the money runs out of a roofing shop, every single day:"
          leaks={[
            "The storm-chase lead that hits at 8 p.m. — you call back at noon the next day and they already signed with whoever picked up first.",
            "The estimate you drove out and gave, then never followed up on. Half of those close on the third nudge you never sent.",
            "The calls that roll to voicemail while you're up top or under a deadline — and a roofing voicemail almost never gets a callback.",
            "The insurance-claim job that stalls because nobody chased the adjuster's paperwork on time.",
            "The 'we'll think about it' that needed three touches over two weeks — and got zero, because you were on the next roof.",
            "Two years of past customers sitting in your phone, due for a re-roof or a referral, that nobody has time to work.",
          ]}
          fix="An AI employee plugs every one of those holes at the same time. It answers the second a lead lands — storm night, Sunday, 2 a.m., doesn't matter — and it actually reads what the person wrote instead of firing the same canned blast at everybody. It chases the estimate, nudges the 'we'll think about it' on its own schedule, keeps the claim paperwork moving, and quietly works your old customer list for re-roofs and referrals. It books the appointment straight onto the calendar. Same way every time, every job logged, while your hands stay on the work you're actually good at."
          rollup="This is the same playbook I've run five times — you just point it at roofing. First you stop the bleed on the shop you've already got: the leads you were losing turn into booked jobs, and that drops straight to the bottom line. Then you bolt on the next crew, the next town, the next shop — and the AI layer runs the phones the same way across all of them, no extra front desk per location. Own that layer and you stop getting priced like a roofing company and start getting priced like a platform — a technology multiple instead of a trade multiple. That's the difference between selling a truck and a crew, and selling a machine. Same playbook a mergers-and-acquisitions operator runs — maximized, and AI is the newest weapon in it."
        />
      </main>
      <Footer />
    </>
  );
}
