import CtaButton from "./CtaButton";

export default function Hero() {
  return (
    <section style={{ backgroundColor: "#f3f4f6" }} className="w-full">
      <div className="mx-auto max-w-4xl px-6 pt-6 pb-16 text-center md:pt-10 md:pb-24">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-[color:var(--color-sjc-blue)]">
          Your AI Growth Partner
        </p>
        <h1 className="mt-4 text-3xl font-bold leading-tight tracking-tight text-[color:var(--color-sjc-ink)] md:text-5xl">
          You already know you need AI. You just want to keep the keys.
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-xl font-semibold text-[color:var(--color-sjc-blue)] md:text-2xl">
          I install AI on top of the business you already run, operate the
          plumbing so you don&apos;t have to, and hand you the controls.
        </p>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-[color:var(--color-sjc-mute)] md:text-lg">
          You become the AI-first company. Your hand stays on every lead and
          every dollar. I&apos;m just the infrastructure you rent to keep it
          that way.
        </p>

        <div className="mt-10 overflow-hidden rounded-2xl shadow-lg">
          <div className="relative aspect-video w-full bg-gradient-to-br from-[#1e3a6e] to-[#0f1f3d]">
            <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center text-white">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/15 ring-2 ring-white/30 backdrop-blur-sm">
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                  className="ml-1 h-9 w-9 text-white"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
              <p className="mt-5 text-sm font-semibold uppercase tracking-[0.2em] text-white/90 md:text-base">
                Watch: 3 Minutes
              </p>
              <p className="mt-2 max-w-md text-xs text-white/70 md:text-sm">
                What it looks like to put AI to work on top of the business you
                already run &mdash; without giving up the controls.
              </p>
            </div>
            <div className="absolute right-4 top-4 rounded-full bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white/80 backdrop-blur-sm">
              Placeholder
            </div>
          </div>
        </div>

        <div className="mt-10 flex justify-center">
          <CtaButton
            title="Book the Call"
            subtitle="See exactly what we'd install — and what you'd control."
          />
        </div>
      </div>
    </section>
  );
}
