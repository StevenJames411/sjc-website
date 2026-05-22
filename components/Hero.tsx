export default function Hero() {
  return (
    <section style={{ backgroundColor: "#f3f4f6" }} className="w-full">
      <div className="mx-auto max-w-4xl px-6 pt-6 pb-16 text-center md:pt-10 md:pb-24">
        <h1 className="text-3xl font-bold leading-tight tracking-tight text-[color:var(--color-sjc-ink)] md:text-4xl">
          AI Employee Operating Systems for solo entrepreneurs trapped in their own business.
        </h1>
        <p className="mt-5 text-xl font-semibold text-[color:var(--color-sjc-blue)] md:text-2xl">
          If tragedy happened and you couldn&apos;t work for 30 to 90 days, would your business thrive &mdash; or implode?
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
                Video Sales Letter
              </p>
              <p className="mt-2 max-w-md text-xs text-white/70 md:text-sm">
                The full business model &mdash; in one watch.
              </p>
            </div>
            <div className="absolute right-4 top-4 rounded-full bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white/80 backdrop-blur-sm">
              Placeholder
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
