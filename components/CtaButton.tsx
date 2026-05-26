import Link from "next/link";

type CtaButtonProps = {
  title?: string;
  subtitle?: string;
  className?: string;
  href?: string;
};

export default function CtaButton({
  title = "See How Many Hats You're Wearing",
  subtitle = "Take the 30-second audit. Find out how vulnerable your business really is.",
  className = "",
  href = "/assessment",
}: CtaButtonProps) {
  return (
    <Link href={href} className={`btn-cta ${className}`}>
      <span>{title}</span>
      <span className="sub">{subtitle}</span>
    </Link>
  );
}
