import Link from "next/link";

const INTAKE_URL = "#intake";

type CtaButtonProps = {
  title?: string;
  subtitle?: string;
  className?: string;
  href?: string;
};

export default function CtaButton({
  title = "Ready to see what your org chart should look like?",
  subtitle = "Book an intake call. We'll show you the way out.",
  className = "",
  href = INTAKE_URL,
}: CtaButtonProps) {
  return (
    <Link href={href} className={`btn-cta ${className}`}>
      <span>{title}</span>
      <span className="sub">{subtitle}</span>
    </Link>
  );
}
