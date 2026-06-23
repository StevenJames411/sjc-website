import Link from "next/link";

export default function CaseStudyCallout() {
  return (
    <div className="rounded-2xl border border-[color:var(--color-sjc-blue)] bg-blue-50/50 px-8 py-6 text-center">
      <p className="text-lg font-semibold text-[color:var(--color-sjc-ink)]">
        Our first install booked 4 consults in 90 minutes &mdash; on a Sunday night, while a human
        would&apos;ve been asleep.{" "}
        <Link
          href="/case-study"
          className="font-bold text-[color:var(--color-sjc-blue)] hover:underline"
        >
          See the proof.
        </Link>
      </p>
    </div>
  );
}
