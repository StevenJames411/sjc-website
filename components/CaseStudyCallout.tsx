import Link from "next/link";

export default function CaseStudyCallout() {
  return (
    <div className="rounded-2xl border border-[color:var(--color-sjc-blue)] bg-blue-50/50 px-8 py-6 text-center">
      <p className="text-lg font-semibold text-[color:var(--color-sjc-ink)]">
        Our first install booked 4 appointments in 90 minutes on a Sunday night.{" "}
        <Link
          href="/case-study"
          className="font-bold text-[color:var(--color-sjc-blue)] hover:underline"
        >
          Read the case study.
        </Link>
      </p>
    </div>
  );
}
