import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

export default function PlaceholderPainPage({ number }: { number: number }) {
  return (
    <>
      <Nav />
      <main>
        <section style={{ backgroundColor: "#f3f4f6" }} className="w-full">
          <div className="mx-auto max-w-3xl px-6 py-32 text-center md:py-40">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[color:var(--color-sjc-blue)]">
              Lie #{number}
            </p>
            <h1 className="mt-5 text-3xl font-bold leading-tight tracking-tight text-[color:var(--color-sjc-ink)] md:text-4xl">
              Coming soon.
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-[color:var(--color-sjc-ink)]">
              We're still locking down the wording on this one. The full pain-and-solution breakdown
              drops here as soon as it's ready.
            </p>
            <div className="mt-10">
              <Link
                href="/"
                className="text-sm font-semibold text-[color:var(--color-sjc-blue)] hover:underline"
              >
                ← Back to the other lies
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
