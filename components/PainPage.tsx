import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import CtaButton from "@/components/CtaButton";

export type PainPageProps = {
  eyebrow: string;
  lie: string;
  truth: string;
  story: string[];
  litmus: string[];
  solutionHeadline: string;
  solutionBody: string[];
  closer: string;
  ctaTitle: string;
  ctaSubtitle: string;
};

export default function PainPage(props: PainPageProps) {
  return (
    <>
      <Nav />
      <main>
        {/* HERO — the lie crossed out, the truth */}
        <section style={{ backgroundColor: "#f3f4f6" }} className="w-full">
          <div className="mx-auto max-w-4xl px-6 pt-10 pb-16 text-center md:pt-14 md:pb-20">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[color:var(--color-sjc-blue)]">
              {props.eyebrow}
            </p>
            <h1 className="mt-5 text-3xl font-bold leading-tight tracking-tight text-[color:var(--color-sjc-ink)] line-through decoration-2 decoration-[color:var(--color-sjc-blue)] md:text-4xl">
              {props.lie}
            </h1>
            <p className="mt-6 text-xl font-bold italic leading-snug text-[color:var(--color-sjc-blue)] md:text-2xl">
              {props.truth}
            </p>
          </div>
        </section>

        {/* STORY — the lived reality of this lie */}
        <section className="bg-white">
          <div className="mx-auto max-w-3xl px-6 py-20 md:py-24">
            <div className="space-y-6 text-lg leading-relaxed text-[color:var(--color-sjc-ink)]">
              {props.story.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </div>
        </section>

        {/* LITMUS TEST */}
        <section style={{ backgroundColor: "#f3f4f6" }} className="w-full">
          <div className="mx-auto max-w-3xl px-6 py-20 md:py-24">
            <p className="text-sm font-bold uppercase tracking-wide text-[color:var(--color-sjc-blue)]">
              The Litmus Test
            </p>
            <h2 className="mt-3 text-2xl font-bold leading-tight tracking-tight text-[color:var(--color-sjc-ink)] md:text-3xl">
              Be honest with yourself.
            </h2>
            <ul className="mt-8 space-y-4">
              {props.litmus.map((q, i) => (
                <li
                  key={i}
                  className="rounded-xl border border-gray-200 bg-white px-6 py-5 text-lg leading-relaxed text-[color:var(--color-sjc-ink)]"
                >
                  {q}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* SOLUTION beat */}
        <section className="bg-white">
          <div className="mx-auto max-w-3xl px-6 py-20 md:py-24">
            <p className="text-sm font-bold uppercase tracking-wide text-[color:var(--color-sjc-blue)]">
              The Way Out
            </p>
            <h2 className="mt-3 text-3xl font-bold leading-tight tracking-tight text-[color:var(--color-sjc-ink)] md:text-4xl">
              {props.solutionHeadline}
            </h2>
            <div className="mt-8 space-y-6 text-lg leading-relaxed text-[color:var(--color-sjc-ink)]">
              {props.solutionBody.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
            <p className="mt-10 text-xl font-bold leading-snug text-[color:var(--color-sjc-blue)] md:text-2xl">
              {props.closer}
            </p>
            <div className="mt-10 flex justify-center">
              <CtaButton title={props.ctaTitle} subtitle={props.ctaSubtitle} />
            </div>
            <div className="mt-12 text-center">
              <Link
                href="/discover-the-lies"
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
