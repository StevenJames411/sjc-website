import Link from "next/link";

const PILLARS = [
  {
    slug: "financial-trap",
    lie: "Financial freedom",
    truth: "You're a glorified self-employed contractor.",
    placeholder: false,
  },
  {
    slug: "time-trap",
    lie: "Time freedom",
    truth: "You work more hours than your old job. You can't unplug.",
    placeholder: false,
  },
  {
    slug: "asset-trap",
    lie: "You're building something you can sell",
    truth: "Nobody buys a business when the owner IS the system.",
    placeholder: false,
  },
  {
    slug: "hustle-trap",
    lie: "Hustle harder and you'll make it",
    truth: "You can't out-hustle a broken system.",
    placeholder: false,
  },
  {
    slug: "master-trap",
    lie: "You're great at this. You should open your own business.",
    truth: "Being the Master doesn't make you a business owner.",
    placeholder: false,
  },
  {
    slug: "rock-star-trap",
    lie: "Just hire the rock star and they'll fix it.",
    truth: "The rock star becomes the new bottleneck. They want all the pay and create all the problems.",
    placeholder: false,
  },
];

export default function PainPillars() {
  return (
    <section id="traps" style={{ backgroundColor: "#f3f4f6" }} className="w-full scroll-mt-20">
      <div className="mx-auto max-w-6xl px-6 py-20 md:py-24">
        <p className="text-sm font-bold uppercase tracking-wide text-[color:var(--color-sjc-blue)]">
          Discover the Lies
        </p>
        <h2 className="mt-3 text-3xl font-bold leading-tight tracking-tight text-[color:var(--color-sjc-ink)] md:text-4xl">
          You bought THE dream. Did you get it?
        </h2>
        <p className="mt-4 max-w-3xl text-lg leading-relaxed text-[color:var(--color-sjc-ink)]">
          Six lies the world sold you when you opened your business. Pick the one that hits hardest
          — we'll show you the way out.
        </p>

        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {PILLARS.map((p, i) => (
            <Link
              key={p.slug}
              href={`/${p.slug}`}
              className={`group relative flex flex-col rounded-2xl border bg-white p-7 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                p.placeholder
                  ? "border-dashed border-gray-300"
                  : "border-gray-200 hover:border-[color:var(--color-sjc-blue)]"
              }`}
            >
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[color:var(--color-sjc-blue)]">
                Lie #{i + 1}
              </p>
              <p className="mt-2 text-xl font-bold leading-snug text-[color:var(--color-sjc-ink)] line-through decoration-[1.5px] decoration-[color:var(--color-sjc-blue)]">
                {p.lie}
              </p>

              <p className="mt-5 text-xs font-bold uppercase tracking-[0.18em] text-gray-400">
                The Truth
              </p>
              <p className="mt-2 text-base leading-relaxed text-[color:var(--color-sjc-ink)]">
                {p.truth}
              </p>

              <p className="mt-6 text-sm font-bold text-[color:var(--color-sjc-blue)]">
                {p.placeholder ? "Coming soon" : "See how we fix it →"}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
