// PLACEHOLDER — replace with Steven's Google Calendar Appointment Scheduling link before prod.
// Stack rule: no GHL/Twilio/Perspective for SJC's own use.
export const BOOKING_URL = "#book-placeholder";

type CtaButtonProps = {
  title?: string;
  subtitle?: string;
  className?: string;
  href?: string;
};

export default function CtaButton({
  title = "Apply to work with me",
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
