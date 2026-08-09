import { resolveColor, resolveColorOr } from "@/lib/brandColor";
import { telLink } from "@/lib/businessTokens";
const LOGO_URL =
  "https://ddhmhtqvn5lepkpr.public.blob.vercel-storage.com/uploads/1785815543979-logo.png";

export type FooterLink = { label: string; target: string };
/**
 * A titled column of links — "SERVICES", "COMPANY".
 *
 * ⚠️ WHY GROUPS AND NOT ONE LONGER LIST. Every bought design's footer is three or four titled
 * columns, and this footer had exactly one, headed "More". Reproducing a design meant either
 * dumping fifteen links into a single column nobody reads, or leaving the footer visibly cheaper
 * than the page above it — which is the half of the page a visitor scrolls to when they are
 * deciding whether a business is real.
 *
 * Empty by default, and when it IS empty the footer renders exactly as it did before, so no site
 * already built moves.
 */
export type FooterGroup = { heading: string; links?: FooterLink[] };
export type FooterViewProps = {
  blurb?: string;
  links?: FooterLink[];
  groups?: FooterGroup[];
  phone?: string;
  phoneDisplay?: string;
  email?: string;
  privacyUrl?: string;
  tosUrl?: string;
  copyright?: string;
  // Footer band colour + text colour. #111827 was hardcoded, which put SJC's near-black on every
  // client site built from this template. Both default to the old values, so nothing already
  // published moves.
  background?: string;
  foreground?: string;
  // The business name shown beside the logo, and whether the SJC logo appears at all. Both were
  // hardcoded to SJC — the single most obvious giveaway on a client build.
  brandName?: string;
  showLogo?: boolean;
  // ── THE BRAND MARK'S SHAPE — MIRRORS NavView ────────────────────────────────────────────────
  // "" (default) = logo image + name in the body sans. Every existing footer.
  // "wordmark"   = the name set in the display serif as small-caps, with a letterspaced second
  //                line beneath it, and NO image at all.
  //
  // ⛔ THE HEADER GOT THIS AND THE FOOTER DID NOT, so a page wore two different brands: the serif
  // wordmark on top and the old `SJC` circle at the bottom of the same screen. A brand mark is a
  // template-level thing — if only half the template has it, every site built from it is wrong in
  // the same way.
  //
  // ⚠️ In wordmark mode the logo branch is BYPASSED, not hidden. The image is SJC's own blob
  // asset, so on a client build it puts Steven's mark on their business — the same leak already
  // closed in the nav.
  brandStyle?: string;
  /** The second line ("Consulting"). Wordmark mode only. */
  brandLine2?: string;
  brandLine2Color?: string;
};

// The live site footer, rendered from props. Used BOTH on the live site (via Footer.tsx, which
// reads the published "footer" block) AND in the builder preview (via the SiteFooter Puck block),
// so what Steven edits at /edit/footer is exactly what ships. Static (no interactivity).
export default function FooterView({
  blurb = "",
  links = [],
  groups = [],
  phone = "+12108514906",
  phoneDisplay = "(210) 851-4906",
  email = "support@stevenjamesconsulting.com",
  privacyUrl = "",
  tosUrl = "",
  copyright = "Steven James Consulting",
  background,
  foreground,
  brandName,
  showLogo,
  brandStyle,
  brandLine2,
  brandLine2Color,
}: FooterViewProps) {
  // ROLES, not hexes. #111827 here meant the footer sat one shade off every dark band above it and
  // never moved when the palette did — on 2026-08-05 the whole site went near-black cyan and the
  // footer stayed the old charcoal, which is what read as "the footer doesn't match".
  const bg = background || "bandDark";
  const fg = foreground || "white";
  const name = brandName || "Steven James Consulting";
  const logoOn = showLogo !== false;
  const year = new Date().getFullYear();
  const linkEls = (links || []).filter((l) => l && l.label);
  const groupEls = (groups || [])
    .map((g) => ({ heading: g?.heading || "", links: (g?.links || []).filter((l) => l && l.label) }))
    .filter((g) => g.links.length);
  // The "More" column only appears when it has something in it. Without this, adding groups left
  // an empty titled column sitting between them — a heading with nothing under it, which reads as
  // a bug rather than as a design.
  const showMore = linkEls.length > 0 || !!email || !!phoneDisplay;
  const btn =
    "inline-flex items-center justify-center gap-2 rounded-lg bg-[color:var(--color-sjc-blue)] px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-[color:var(--color-sjc-green)]";
  // WHY A FLAT FILL READS AS CHEAP, AND WHAT THE BOUGHT DESIGNS DO INSTEAD.
  //
  // Steven put it exactly right on 2026-08-05: the SiteDrop footer "looks richer, deeper blue,"
  // ours "looks flatter." He guessed it was the font. It isn't — it's two layers, and neither one
  // is a colour:
  //
  //   1. a 1px hairline across the top, fading to nothing at both ends. That is the SEAM. Without
  //      it the footer is just where the page changes colour; with it, it's an edge someone drew.
  //   2. a huge, heavily blurred, very faint circle tucked off one corner. It makes the fill
  //      UNEVEN, and unevenness is the whole trick — a single flat hex has no light in it, so it
  //      reads as a slab no matter which hex you pick.
  //
  // Both paint from brand roles, so they re-skin with everything else and every client site gets
  // them. Both are decoration: `pointer-events-none` and aria-hidden by omission, so nothing here
  // can intercept a click meant for a footer link.
  return (
    <footer
      className="relative overflow-hidden"
      style={{ backgroundColor: resolveColor(bg), color: resolveColor(fg) }}
    >
      {/* The seam. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{
          backgroundImage: `linear-gradient(to right, transparent, color-mix(in srgb, var(--color-sjc-blue) 55%, transparent), transparent)`,
        }}
      />
      {/* The glow. Sized and blurred hard enough that no edge of the circle is ever visible —
          if you can see it as a shape, it's too small or not blurred enough. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-40 -top-40 h-96 w-96 rounded-full opacity-[0.14]"
        style={{ backgroundColor: "var(--color-sjc-blue)", filter: "blur(120px)" }}
      />
      <div className="relative mx-auto max-w-6xl px-6 py-14">
        <div
          className="grid gap-10"
          style={{
            // Auto-fit rather than a fixed three: the brand block keeps a wide column and each
            // group takes one, so three groups and none both lay out without choosing a count.
            //
            // ⛔ min() ON BOTH FLOORS, AND IT IS THE WHOLE FIX FOR THE PHONE.
            // A grid track will NOT shrink below its minmax floor. On a 390px iPhone there is
            // ~342px of usable width after px-6, while these two tracks demanded 220 + 140 = 360 —
            // so the last column hung off the right edge and took the email address with it.
            //
            // ⚠️ Wrapping the text does NOT fix this. The FLOOR sets the width, not the string;
            // with a 140px floor the column stays 140px wide and still overflows. `min(220px,100%)`
            // lets the track collapse when the viewport is narrower than the floor, which is the
            // supported way to make an auto-fit grid genuinely responsive.
            gridTemplateColumns: groupEls.length
              ? "minmax(min(220px, 100%), 1.6fr) repeat(auto-fit, minmax(min(140px, 100%), 1fr))"
              : undefined,
          }}
        >
          <div className={groupEls.length ? "" : "md:col-span-2"}>
            {String(brandStyle) === "wordmark" ? (
              // Same mark as the header (NavView) — Playfair is already loaded site-wide, so this
              // costs no extra font request. `font-variant: small-caps` is what produces the
              // tall-initial / small-rest shape; uppercasing the string gives shouting instead.
              <div className="leading-none">
                <span
                  className="block"
                  style={{
                    fontFamily: "var(--font-playfair), Georgia, serif",
                    fontVariant: "small-caps",
                    fontWeight: 500,
                    letterSpacing: "0.04em",
                    fontSize: "26px",
                  }}
                >
                  {name}
                </span>
                {brandLine2 ? (
                  <span
                    className="mt-1.5 block uppercase"
                    style={{
                      fontFamily: "var(--font-playfair), Georgia, serif",
                      letterSpacing: "0.34em",
                      fontSize: "12px",
                      color: resolveColorOr(brandLine2Color, "currentColor"),
                      opacity: brandLine2Color ? 1 : 0.75,
                    }}
                  >
                    {brandLine2}
                  </span>
                ) : null}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                {logoOn ? <img src={LOGO_URL} alt="logo" className="h-12 w-12 rounded-full" /> : null}
                <span className="text-lg font-semibold">{name}</span>
              </div>
            )}
            {blurb ? <p className="mt-6 max-w-sm text-sm leading-relaxed text-white/80">{blurb}</p> : null}
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <a href={telLink(phone)} className={btn}>
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                  <path fillRule="evenodd" d="M1.5 4.5a3 3 0 013-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 01-.694 1.955l-1.293.97c-.135.101-.164.249-.126.352a11.285 11.285 0 006.697 6.697c.103.038.25.009.352-.126l.97-1.293a1.875 1.875 0 011.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 01-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 6.75V4.5z" clipRule="evenodd" />
                </svg>
                Call Us
              </a>
              <a href={`sms:${phone}`} className={btn}>
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                  <path fillRule="evenodd" d="M4.848 2.771A49.144 49.144 0 0112 2.25c2.43 0 4.817.178 7.152.52 1.978.292 3.348 2.024 3.348 3.97v6.521c0 1.946-1.37 3.678-3.348 3.97a48.901 48.901 0 01-3.476.383.39.39 0 00-.297.17l-2.755 4.133a.75.75 0 01-1.248 0l-2.755-4.133a.39.39 0 00-.297-.17 48.9 48.9 0 01-3.476-.384c-1.978-.29-3.348-2.024-3.348-3.97V6.741c0-1.946 1.37-3.68 3.348-3.97z" clipRule="evenodd" />
                </svg>
                Text Us
              </a>
            </div>
          </div>

          {groupEls.map((g, gi) => (
            <div key={`g${gi}`}>
              <p className="text-sm font-semibold uppercase tracking-wide text-white/90">{g.heading}</p>
              <ul className="mt-4 space-y-3 text-sm">
                {g.links.map((l, i) => (
                  <li key={i}>
                    <a href={l.target || "#"} className="text-white/80 hover:text-white">{l.label}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {showMore && (
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-white/90">More</p>
            <ul className="mt-4 space-y-3 text-sm">
              {linkEls.map((l, i) => (
                <li key={i}>
                  <a href={l.target || "#"} className="text-white/80 hover:text-white">{l.label}</a>
                </li>
              ))}
              {email ? (
                <li>
                  {/* break-words: an address has no spaces, so without it the string itself
                      becomes the column's minimum width and pushes the layout wide. The grid
                      floors above are the primary fix; this stops the text re-creating the
                      problem from the inside. */}
                  <a
                    href={`mailto:${email}`}
                    className="break-words text-white/80 hover:text-white"
                  >
                    {email}
                  </a>
                </li>
              ) : null}
              {phoneDisplay ? (
                <li>
                  <a href={telLink(phone)} className="text-white/80 hover:text-white">{phoneDisplay}</a>
                </li>
              ) : null}
            </ul>
          </div>
          )}
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-white/10 pt-6 text-xs text-white/70 sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} {copyright}. All rights reserved.</p>
          <div className="flex gap-6">
            {privacyUrl ? (
              <a href={privacyUrl} className="hover:text-white" target="_blank" rel="noopener noreferrer">Privacy Policy</a>
            ) : null}
            {tosUrl ? (
              <a href={tosUrl} className="hover:text-white" target="_blank" rel="noopener noreferrer">Terms of Service</a>
            ) : null}
          </div>
        </div>
      </div>
    </footer>
  );
}
