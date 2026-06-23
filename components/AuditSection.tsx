import CtaButton from "./CtaButton";

export default function AuditSection() {
  return (
    <section style={{ backgroundColor: "#f3f4f6" }} className="w-full">
      <div className="mx-auto max-w-3xl px-6 py-20 text-center md:py-24">
        <p className="text-sm font-bold uppercase tracking-wide text-[color:var(--color-sjc-blue)]">
          Your Next Move
        </p>
        <h2 className="mt-3 text-3xl font-bold leading-tight tracking-tight text-[color:var(--color-sjc-ink)] md:text-5xl">
          You already know you need AI. Let&apos;s install it &mdash; with you
          still running your own shop.
        </h2>

        <div className="mx-auto mt-8 max-w-2xl space-y-5 text-lg leading-relaxed text-[color:var(--color-sjc-ink)] md:text-xl">
          <p>
            Get on a quick call. Tell me how you run today, and I&apos;ll show
            you exactly where AI plugs in &mdash; starting with speed to lead.
          </p>
          <p className="font-semibold">
            I install it. We run it for you. You stay in control.
          </p>
        </div>

        <div className="mt-10 flex justify-center">
          <CtaButton
            title="Book the Call"
            subtitle="A quick call. No pitch deck — just where AI fits on your business."
          />
        </div>
      </div>
    </section>
  );
}
