// PLACEHOLDER — replace with Steven's Google Calendar Appointment Scheduling link before prod.
// Stack rule: no GHL/Twilio/Perspective for SJC's own use.
export const BOOKING_URL = "#book-placeholder";

type CtaButtonProps = {
  title?: string;
  subtitle?: string;
  className?: string;
  href?: string;
  /**
   * Leave the site behind, or keep it open underneath.
   *
   * ⛔ THE ONE BLOCK THAT MOST NEEDED THIS DID NOT HAVE IT. Images and the header menu both let you
   * choose; the call-to-action button — the thing that actually points at a booking link, Skool or
   * YouTube — always opened in the same tab, with nothing in the panel to change it. Sending
   * someone off-site with no tab left to come back to is where this setting earns its keep.
   *
   * ⚠️ Defaults to the same tab, which is what every button already does.
   */
  newTab?: boolean;
};

export default function CtaButton({
  title = "Apply to work with me",
  subtitle,
  className = "",
  href = BOOKING_URL,
  newTab = false,
}: CtaButtonProps) {
  return (
    <a
      href={href}
      className={`btn-cta ${className}`}
      // ⚠️ `rel` RIDES WITH `target`, ALWAYS. Without noopener the page that opens gets a handle
      // back on this one through window.opener — a real hole, and free to close.
      {...(newTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      <span>{title}</span>
      {subtitle ? <span className="sub">{subtitle}</span> : null}
    </a>
  );
}
