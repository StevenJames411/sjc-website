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
  /**
   * ⛔ TWO SIZES, BECAUSE THE TWO SURFACES ARE NOT THE SAME SHAPE.
   *
   * Steven, on the menu: "do the icons have to be so small? We have lots of canvas real estate."
   * He was right — the overlay is a full screen with an empty half below these buttons, and they
   * were drawn to text-button proportions inherited from the footer. His own Alamo Slim blocks run
   * 64–80px icons for exactly this reason.
   *
   * "md"   — the FOOTER. It sits in a ~250px column beside three others; a large icon there would
   *          force the column wider and break the four-column grid.
   * "tile" — the MENU. ⛔ NOT A TALLER BUTTON. Steven, pointing at his Alamo Slim blocks: "those
   *          are actually clickable photos instead of CTA buttons." He is right, and it is why
   *          two rounds of making the button bigger still read wrong — a tile is a different
   *          OBJECT, not a scaled pill: big icon centred on top, label stacked beneath it, the
   *          whole block clickable.
   *          It also retires the hover chip. A tile has room to simply PRINT the number, so the
   *          value is visible to everyone instead of only to someone with a mouse.
   */
  size?: "md" | "tile";
  /**
   * REAL ARTWORK INSTEAD OF THE DRAWN GLYPHS — one URL per action, blank = use the glyph.
   *
   * ⛔ THESE ARE ONLY WORTH USING AT TILE SIZE. Steven already owns the glossy calendar and phone
   * icons (hosted on his Landing Site AI account, used on alamoslimclinic.com). At the ~16px a
   * compact pill gives an icon they turn to mush — which is the whole reason the drawn glyphs
   * exist. At the 56px a tile gives them, they are exactly what they were designed for.
   *
   * Rendered as <img>, so a PNG with a baked-in background will show that background. If one
   * looks wrong on the blue fill, it needs a transparent export, not a code change.
   */
  iconCall?: string;
  iconText?: string;
  iconEmail?: string;
};

// One path per icon, sized by the caller — so a size change cannot alter the artwork.
const PATHS = {
  call: (
    <path fillRule="evenodd" d="M1.5 4.5a3 3 0 013-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 01-.694 1.955l-1.293.97c-.135.101-.164.249-.126.352a11.285 11.285 0 006.697 6.697c.103.038.25.009.352-.126l.97-1.293a1.875 1.875 0 011.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 01-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 6.75V4.5z" clipRule="evenodd" />
  ),
  text: (
    <path fillRule="evenodd" d="M4.848 2.771A49.144 49.144 0 0112 2.25c2.43 0 4.817.178 7.152.52 1.978.292 3.348 2.024 3.348 3.97v6.521c0 1.946-1.37 3.678-3.348 3.97a48.901 48.901 0 01-3.476.383.39.39 0 00-.297.17l-2.755 4.133a.75.75 0 01-1.248 0l-2.755-4.133a.39.39 0 00-.297-.17 48.9 48.9 0 01-3.476-.384c-1.978-.29-3.348-2.024-3.348-3.97V6.741c0-1.946 1.37-3.68 3.348-3.97z" clipRule="evenodd" />
  ),
  email: (
    <>
      <path d="M1.5 8.67v8.58a3 3 0 003 3h15a3 3 0 003-3V8.67l-8.928 5.493a3 3 0 01-3.144 0L1.5 8.67z" />
      <path d="M22.5 6.908V6.75a3 3 0 00-3-3h-15a3 3 0 00-3 3v.158l9.714 5.978a1.5 1.5 0 001.572 0L22.5 6.908z" />
    </>
  ),
};

// ⛔ SHAPE AND COLOUR ARE SEPARATE ON PURPOSE.
// The menu's primary "Book a Call" has to be the SAME shape as these three — Steven: "the new
// book a call CTA button isn't shaped the same as the other CTA buttons" — while keeping its own
// fill. Exporting only a fully-coloured class would have forced NavView to re-type the geometry,
// which is precisely how the two drifted apart the first time.
// ⛔ TWO SHAPES, NOT ONE SHAPE AT TWO SCALES.
//   md   — a row: icon beside the label, compact enough for a footer column.
//   tile — a block: icon centred ABOVE a stacked label, the whole thing a click target.
// Scaling the row up is what failed twice; the tile has to be built as its own arrangement.
const PILL_BASE = "group relative w-full rounded-lg font-semibold text-white shadow transition";
export const PILL_SIZE = {
  md: "inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm",
  // ⛔ THE ICON SETS THE HEIGHT — PADDING WAS THE WRONG DIAL, AND IT GOT PULLED TWICE BEFORE THIS.
  // First pass: py-8 → py-4, "so the buttons don't look like boulders." They still read as "four
  // giant blocks on the page", because at h-14 the ICON was 56px and no amount of padding trimming
  // touches that. Cutting one while the other holds the height is the same mistake made twice more
  // in this component's history (scaling a pill when the shape was wrong, twice).
  // So icon and padding move TOGETHER, in one constant, and the block halves for real.
  tile: "flex flex-col items-center justify-center gap-1.5 px-3 py-3 text-center text-sm",
} as const;
export const ICON_SIZE = { md: "h-4 w-4", tile: "h-9 w-9" } as const;
const PILL = `${PILL_BASE} bg-[color:var(--color-sjc-blue)] hover:bg-[color:var(--color-sjc-green)]`;

export default function ContactButtons({
  phone = "",
  phoneDisplay = "",
  email = "",
  className = "",
  size = "md",
  iconCall = "",
  iconText = "",
  iconEmail = "",
}: ContactButtonsProps) {
  const button = (
    href: string,
    path: React.ReactNode,
    verb: string,
    value: string,
    src?: string
  ) => (
    <a href={href} className={`${PILL} ${PILL_SIZE[size]} ${className}`} title={value}>
      {src ? (
        // object-contain so a non-square export is letterboxed rather than squashed.
        <img src={src} alt="" aria-hidden className={`${ICON_SIZE[size]} shrink-0 object-contain`} />
      ) : (
        <svg viewBox="0 0 24 24" fill="currentColor" className={`${ICON_SIZE[size]} shrink-0`} aria-hidden>
          {path}
        </svg>
      )}
      {verb}
      {/* ⛔ THE VALUE IS ON HOVER AT EVERY SIZE — SETTLED, AND I BROKE IT ONCE.
          Building the tile I printed the number under the label, reasoning that a tile has the
          room. Steven: "take the email and phone number off of them, and when you hover it you'll
          see the phone number and the email just like we did in the footer. I thought we already
          settled that. The hover is what gives you the visual."
          He is right — it was decided when the buttons first shrank to fit, and a bigger surface
          is not a reason to re-open it. One behaviour, both sizes. */}
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
      {phone ? button(telLink(phone), PATHS.call, "Click to Call", phoneDisplay || phone, iconCall) : null}
      {phone ? button(`sms:${phone}`, PATHS.text, "Click to Text", phoneDisplay || phone, iconText) : null}
      {email ? button(`mailto:${email}`, PATHS.email, "Click to Email", email, iconEmail) : null}
    </>
  );
}

// The menu's primary CTA imports PILL_BASE so it is the same object, not a copy that looks like it.
export { PILL as CONTACT_PILL, PILL_BASE as CONTACT_PILL_BASE };
