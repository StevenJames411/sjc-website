import Link from "next/link";

const ASSESSMENT_URL = "/assessment";

type CtaButtonProps = {
  title?: string;
  subtitle?: string;
  className?: string;
};

export default function CtaButton({
  title = "Want your business to run without you?",
  subtitle = "Take the assessment. Get your full roadmap.",
  className = "",
}: CtaButtonProps) {
  return (
    <Link href={ASSESSMENT_URL} className={`btn-cta ${className}`}>
      <span>{title}</span>
      <span className="sub">{subtitle}</span>
    </Link>
  );
}
