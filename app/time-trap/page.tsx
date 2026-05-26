import PainPage from "@/components/PainPage";

export const metadata = {
  title: "The Time Freedom Trap — Steven James Consulting",
  description:
    "They sold you time freedom. You can't unplug. Here's the architecture problem nobody told you about.",
};

export default function TimeTrap() {
  return (
    <PainPage
      eyebrow="Lie #2"
      lie="Time freedom"
      truth="You work more hours than your old job. You can't unplug."
      story={[
        "They told you owning a business meant working when you want. Take Tuesday off. Pick up the kids. Travel.",
        "Reality? You work more hours than your worst W-2 job. Vacation means checking email at the beach. Sundays are admin day. There is no off switch — because you ARE the switch.",
        "Your time isn't free. It's the cost of running a one-person operation. Every hat you wear is an hour you don't get back.",
        "Gerber wrote in 1986: 'Your business is not your life. Your business and your life are two totally separate things.' He prescribed working ON the business instead of IN it. The mechanism he had: hire humans. The mechanism we have: install AI employees. Same prescription, new tools.",
      ]}
      litmus={[
        "Can you take 30 days completely off — phone off, email off — and your business actually grows while you're gone?",
        "When's the last time you took a real vacation without checking your phone?",
        "If you got the flu next week, does the business stop?",
        "If your kid had a school event at 2pm Tuesday, could you go without rescheduling clients?",
      ]}
      solutionHeadline="Get your week back."
      solutionBody={[
        "Time freedom isn't a productivity hack. It's an architecture problem. As long as you're the only operator in your business, every hour belongs to the business.",
        "Our AI Employee Operating System covers the roles you're wearing yourself. Marketing runs without you. Bookings run without you. Follow-up runs without you. You stay CEO — strategy, vision, the work only you can do.",
      ]}
      closer="30 days off isn't a fantasy. It's an org chart problem."
      ctaTitle="Want your time back?"
      ctaSubtitle="Take the 30-second audit. See how exposed your business really is."
    />
  );
}
