import { telLink } from "@/lib/businessTokens";

/**
 * THE THREE CONTACT BUTTONS — Click to Call · Click to Text · Click to Email.
 *
 * ⛔ ONE DEFINITION, BECAUSE TWO IS WHAT BROKE IT. These lived only in FooterView while the menu
 * overlay (NavView) had its own pair of full-width bars — a big uppercase CTA and a naked phone
 * number. Same three actions, two pieces of markup, and they drifted exactly as you would expect:
 * a site-wide copy pass renamed every call to action on the page and silently missed the one in
 * the menu, because that label was typed into scripts/port-sjc-2026.py instead of read from
 * content.ts. Steven caught it by eye.
 *
 * Matching them by hand would have fixed the screenshot and left the next change free to split
 * them again. So this is the seam: both surfaces render THIS, and "the menu doesn't match the
 * footer" stops being a thing that can happen.
 *
 * WHAT THE DESIGN IS DOING, so it survives the next edit:
 *  - The number/address is NOT printed under the label. It replaces the label on hover, in a chip
 *    floating ABOVE the button. Inside the button it sized the button — the email address made
 *    "Click to Email" wider than the other two and the row came out ragged.
 *  - The chip is absolute + pointer-events-none, so it can be any length without touching layout
 *    or shifting the buttons below it.
 *  - `title` carries the value too, which is what a long-press surfaces on a phone, where hover
 *    does not exist.
 *  - Each button renders only when its value exists, so a client with no email gets two buttons
 *    rather than a dead third.
 */
export type ContactButtonsProps = {
  phone?: string;
  phoneDisplay?: string;
  email?: string;
  /** Extra classes for the pill — used to match the surrounding surface. */
  className?: string;
  valueColor?: string;
};

const ICON = {
  call: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 shrink-0">
      <path fillRule="evenodd" d="M1.5 4.5a3 3 0 013-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 01-.694 1.955l-1.293.97c-.135.101-.164.249-.126.352a11.285 11.285 0 006.697 6.697c.103.038.25.009.352-.126l.97-1.293a1.875 1.875 0 011.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 01-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 6.75V4.5z" clipRule="evenodd" />
    </svg>
  ),
  text: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 shrink-0">
      <path fillRule="evenodd" d="M4.848 2.771A49.144 49.144 0 0112 2.25c2.43 0 4.817.178 7.152.52 1.978.292 3.348 2.024 3.348 3.97v6.521c0 1.946-1.37 3.678-3.348 3.97a48.901 48.901 0 01-3.476.383.39.39 0 00-.297.17l-2.755 4.133a.75.75 0 01-1.248 0l-2.755-4.133a.39.39 0 00-.297-.17 48.9 48.9 0 01-3.476-.384c-1.978-.29-3.348-2.024-3.348-3.97V6.741c0-1.946 1.37-3.68 3.348-3.97z" clipRule="evenodd" />
    </svg>
  ),
  email: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 shrink-0">
      <path d="M1.5 8.67v8.58a3 3 0 003 3h15a3 3 0 003-3V8.67l-8.928 5.493a3 3 0 01-3.144 0L1.5 8.67z" />
      <path d="M22.5 6.908V6.75a3 3 0 00-3-3h-15a3 3 0 00-3 3v.158l9.714 5.978a1.5 1.5 0 001.572 0L22.5 6.908z" />
    </svg>
  ),
};

const PILL =
  "group relative inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[color:var(--color-sjc-blue)] px-5 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-[color:var(--color-sjc-green)]";

export default function ContactButtons({
  phone = "",
  phoneDisplay = "",
  email = "",
  className = "",
}: ContactButtonsProps) {
  const button = (href: string, icon: React.ReactNode, verb: string, value: string) => (
    <a href={href} className={`${PILL} ${className}`} title={value}>
      {icon}
      {verb}
      <span
        aria-hidden
        className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md px-2.5 py-1.5 text-xs font-normal text-white opacity-0 shadow-lg ring-1 ring-white/15 transition-opacity duration-150 group-hover:opacity-100"
        style={{ backgroundColor: "rgba(2, 6, 23, 0.95)" }}
      >
        {value}
      </span>
    </a>
  );

  return (
    <>
      {phone ? button(telLink(phone), ICON.call, "Click to Call", phoneDisplay || phone) : null}
      {phone ? button(`sms:${phone}`, ICON.text, "Click to Text", phoneDisplay || phone) : null}
      {email ? button(`mailto:${email}`, ICON.email, "Click to Email", email) : null}
    </>
  );
}

// Kept exported so a caller can match the pill's shape on a neighbouring control without
// re-deriving the class string (the menu's primary CTA deliberately does NOT use it — see NavView).
export { PILL as CONTACT_PILL };
