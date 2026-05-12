import CtaButton from "./CtaButton";

export default function StatCta() {
  return (
    <section style={{ backgroundColor: "#f3f4f6" }} className="w-full">
      <div className="mx-auto max-w-3xl px-6 py-16 text-center">
        <p className="text-2xl font-bold text-[color:var(--color-sjc-blue)]">
          Most companies score under 8/20.
        </p>
        <p className="mt-3 text-lg font-bold text-[color:var(--color-sjc-ink)]">The audit is free.</p>
        <p className="mt-2 text-base text-[color:var(--color-sjc-ink)]">
          The fixes are what we can implement swiftly.
        </p>
        <div className="mt-8 flex justify-center">
          <CtaButton />
        </div>
      </div>
    </section>
  );
}
