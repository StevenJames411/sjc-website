export const BOOKING_URL =
  "https://api.leadconnectorhq.com/widget/bookings/find-your-gap";

type CtaButtonProps = {
  title?: string;
  subtitle?: string;
  className?: string;
  href?: string;
};

export default function CtaButton({
  title = "Book the Call",
  subtitle,
  className = "",
  href = BOOKING_URL,
}: CtaButtonProps) {
  return (
    <a href={href} className={`btn-cta ${className}`}>
      <span>{title}</span>
      {subtitle ? <span className="sub">{subtitle}</span> : null}
    </a>
  );
}
