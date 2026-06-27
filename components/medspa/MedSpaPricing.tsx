import CostComparisonChart from "../CostComparisonChart";

export type MedSpaPricingProps = {
  eyebrow: string;
  h2: string;
  p1: string;
  p2bold1: string;
  p2mid: string;
  p2bold2: string;
  p2end: string;
};

export const MEDSPA_PRICING_DEFAULTS: MedSpaPricingProps = {
  eyebrow: "The Expansion",
  h2: "Start with one. Build out the rest of your team on your timeline.",
  p1: "Most owners start with speed to lead — one AI employee answering every lead the second it lands. Once that's running and you can see it work, the same setup covers the rest of the jobs you're doing yourself: follow-up, intake, scheduling, the paperwork that eats your week. You add more when you're ready, not before.",
  p2bold1: "The build",
  p2mid: "is a one-time install.",
  p2bold2: "A flat monthly",
  p2end: "keeps it running, monitored, and improving — the same way you already pay for the software you run on. Standard, and simple. You see the full number before anything gets built.",
};

export default function MedSpaPricing({
  eyebrow,
  h2,
  p1,
  p2bold1,
  p2mid,
  p2bold2,
  p2end,
}: MedSpaPricingProps) {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-5xl px-6 py-20 md:py-24">
        <p className="text-sm font-bold uppercase tracking-wide text-[color:var(--color-sjc-blue)]">
          {eyebrow}
        </p>
        <h2 className="mt-3 text-3xl font-bold leading-tight tracking-tight text-[color:var(--color-sjc-ink)] md:text-4xl">
          {h2}
        </h2>
        <div className="mt-8 space-y-6 text-lg leading-relaxed text-[color:var(--color-sjc-ink)]">
          <p>{p1}</p>
          <p>
            <strong>{p2bold1}</strong>{" "}
            {p2mid}{" "}
            <strong>{p2bold2}</strong>{" "}
            {p2end}
          </p>
        </div>
        <div className="mt-12">
          <CostComparisonChart />
        </div>
      </div>
    </section>
  );
}
