import CtaButton from "./CtaButton";

export default function Hero() {
  return (
    <section style={{ backgroundColor: "#f3f4f6" }} className="w-full">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 md:grid-cols-2 md:items-center md:py-24">
        <div>
          <h1 className="text-4xl font-bold leading-tight tracking-tight text-[color:var(--color-sjc-ink)] md:text-5xl">
            Has AI made your company invisible?
          </h1>
          <p className="mt-6 text-lg text-[color:var(--color-sjc-ink)]">
            Customers aren&apos;t using Google anymore.
          </p>
          <p className="mt-1 text-lg text-[color:var(--color-sjc-ink)]">
            They&apos;re asking AI.
          </p>
          <div className="mt-8">
            <CtaButton />
          </div>
        </div>

        <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-[color:var(--color-sjc-ink)] shadow-lg">
          {/* Video placeholder — will be replaced with VSL embed once filmed */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[color:var(--color-sjc-blue)] shadow-xl">
              <svg viewBox="0 0 24 24" fill="white" className="ml-1 h-7 w-7">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
