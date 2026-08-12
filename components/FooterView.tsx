import { resolveColor, resolveColorOr } from "@/lib/brandColor";
import { telLink } from "@/lib/businessTokens";
// ⛔ SHARED WITH THE MENU OVERLAY (NavView). These three buttons used to be defined here only,
// while the menu had its own pair of full-width bars for the same actions — which is how the two
// drifted far enough apart for Steven to ask why they didn't match. One definition now.
import ContactButtons from "@/components/ContactButtons";
const LOGO_URL =
  "https://ddhmhtqvn5lepkpr.public.blob.vercel-storage.com/uploads/1785815543979-logo.png";

// `note` — the one-line descriptor under a link. The nav has carried this since menu mode shipped
// ("Everything else points at it, so it goes first"), and app/v2/content.ts has always put it on
// the footer's division links too, with the comment "a footer has the room a nav bar doesn't."
// It was simply never rendered here, so the footer listed the four divisions where the menu
// TEACHES them. Optional, so no existing footer changes.
// ⚠️ `newTab` OPTIONAL, so every footer link already saved keeps opening in the same tab.
export type FooterLink = { label: string; target: string; note?: string; newTab?: boolean };
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
  /**
   * THE TAIL OF THE NAME, IN THE ACCENT COLOUR — "Steven James **Consulting**".
   *
   * Steven, comparing the footer to the header: *"you see how my name is fancy up in the header,
   * and then you changed it for the footer. I want those to match."* The header's mark is two-tone
   * and the wordmark below was one flat colour, so the same words read as two different brands on
   * one page.
   *
   * ⛔ AN EXPLICIT WORD, NOT "colour the last word". A heuristic gets "Marbleford Pet **Wash**"
   * right and "Bexar Oak **Co.**" wrong, on somebody's live site, with nobody watching. Blank
   * leaves the name in one colour, which is every existing footer.
   *
   * ⚠️ Matched at the END of the name, case-insensitively, and only ever the tail — so it can
   * never chop a word out of the middle.
   */
  brandAccentWord?: string;
  brandAccentColor?: string;
  /** "outline" = bordered pills on the dark band, matching the menu's calmer treatment. */
  buttonStyle?: string;
  /**
   * "row" = the contact buttons sit SIDE BY SIDE across the band — call · text · email — instead
   * of stacked in a column.
   *
   * Steven, on the stripped footer: *"do the call in the left column, text in the middle column,
   * and email in the right column. That'll make the footer much lower profile on desktop, which is
   * what I wanted as far as being minimalist, and on a phone it will just stack."*
   *
   * ⚠️ IT IS THE HEIGHT HE IS BUYING, NOT THE ARRANGEMENT. Three stacked pills plus their gaps is
   * roughly three times the band depth of one row, and on a footer carrying nothing else that
   * depth is the whole difference between minimal and padded.
   *
   * ⚠️ ONLY MEANINGFUL WITH NO LINK COLUMNS. With Divisions and Company beside it the contact
   * block IS one column of the grid, and a row inside a 300px track would wrap to nonsense. Guarded
   * below rather than left to whoever picks it.
   *
   * Blank = stacked, which is every footer already published.
   */
  contactLayout?: string;
  /**
   * THE BAND'S OWN DEPTH — the last hardcoded number in this component.
   *
   * ⚠️ IT WAS `py-14`, AND ON A STRIPPED FOOTER THAT 56px WAS MOST OF THE REMAINING HEIGHT. Steven
   * had just cut the footer to one row precisely to make it low-profile, and the only thing left
   * holding it open was a number nobody could reach. Exactly the same failure as `contactWidth`
   * before it — see the note on that field, in his words.
   *
   * Defaults match `py-14` / `mt-12` exactly, so nothing already published moves a pixel.
   */
  paddingTop?: number | null;
  paddingBottom?: number | null;
  /** Gap above the copyright + legal row. Was `mt-12`. */
  legalGap?: number | null;
  /**
   * Contact-button artwork and the Book a Call target — mirrors the menu's fields exactly.
   * ⛔ Blank on every one of them means a client site falls back to the drawn glyphs and shows
   * three buttons, never SJC's icons or SJC's booking link.
   */
  iconCall?: string;
  iconText?: string;
  iconEmail?: string;
  bookHref?: string;
  bookLabel?: string;
  bookIcon?: string;
  /**
   * ⛔ THE TWO GEOMETRY DIALS THAT ESCAPED CODE. Steven: "if I could click buttons... it'd be
   * ten times quicker if those controls were at my fingertips instead of being in code."
   * Every footer width change tonight cost a build, a push, a deploy and a publish for a number
   * that takes five seconds to dial. These two are the ones that kept coming back.
   * Defaults match what was hardcoded, so an untouched footer does not move.
   */
  contactWidth?: number;       // px, the desktop Contact column
  buttonWidthMobile?: number;  // %, the stacked button width
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
  brandAccentWord,
  brandAccentColor,
  buttonStyle,
  contactLayout,
  paddingTop,
  paddingBottom,
  legalGap,
  iconCall,
  iconText,
  iconEmail,
  bookHref,
  bookLabel,
  bookIcon,
  contactWidth,
  buttonWidthMobile,
}: FooterViewProps) {
  // ROLES, not hexes. #111827 here meant the footer sat one shade off every dark band above it and
  // never moved when the palette did — on 2026-08-05 the whole site went near-black cyan and the
  // footer stayed the old charcoal, which is what read as "the footer doesn't match".
  const bg = background || "bandDark";
  const fg = foreground || "white";
  const name = brandName || "Steven James Consulting";
  const logoOn = showLogo !== false;

  // ── THE TWO-TONE SPLIT ──────────────────────────────────────────────────────────────────────
  // Tail-only and case-insensitive; anything else leaves the name exactly as typed. Built here
  // rather than inline so both the wordmark and the plain lockup can use the same split and cannot
  // disagree about where the accent starts.
  const accentWord = String(brandAccentWord || "").trim();
  const splitAt =
    accentWord && name.toLowerCase().endsWith(accentWord.toLowerCase())
      ? name.length - accentWord.length
      : -1;
  const nameHead = splitAt > 0 ? name.slice(0, splitAt) : name;
  const nameTail = splitAt > 0 ? name.slice(splitAt) : "";
  const brandMark =
    nameTail !== "" ? (
      <>
        {nameHead}
        <span style={{ color: resolveColorOr(brandAccentColor, "var(--color-sjc-blue)") }}>
          {nameTail}
        </span>
      </>
    ) : (
      name
    );

  const pillVariant = String(buttonStyle) === "outline" ? "outline" : "solid";
  const year = new Date().getFullYear();
  const linkEls = (links || []).filter((l) => l && l.label);
  const groupEls = (groups || [])
    .map((g) => ({ heading: g?.heading || "", links: (g?.links || []).filter((l) => l && l.label) }))
    .filter((g) => g.links.length);
  // ⚠️ GUARDED, NOT TRUSTED — and declared HERE because it reads `groupEls`. A row inside a ~300px
  // grid track wraps to nonsense, so the option only takes effect on a footer with no link columns,
  // which is the only shape it was asked for.
  const contactRow = String(contactLayout) === "row" && !groupEls.length;
  // The "More" column only appears when it has something in it. Without this, adding groups left
  // an empty titled column sitting between them — a heading with nothing under it, which reads as
  // a bug rather than as a design.
  // ⚠️ LINKS ONLY NOW. This used to be true when there was merely an email or a phone, which after
  // moving both onto the contact buttons would render an empty column headed "More".
  const showMore = linkEls.length > 0;

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
      <div
        className="relative mx-auto max-w-6xl px-6"
        // ⚠️ NUMBERS, NOT CLASSES. `py-14` could not be overridden from a field without an
        // !important fight, so the value moves to a style and the class goes.
        style={{
          paddingTop: typeof paddingTop === "number" ? paddingTop : 56,
          paddingBottom: typeof paddingBottom === "number" ? paddingBottom : 56,
        }}
      >
        {/* ⛔ ONE COLUMN ON A PHONE, COLUMNS FROM md UP. This is the fix for the email running off
            the right edge — and the fix has to be a BREAKPOINT, not a cleverer track definition.

            Two earlier attempts were wrong and are worth naming so they aren't retried:
            • Wrapping the text. The track FLOOR sets the column width, not the string, so a
              140px floor stays 140px wide and still overflows.
            • `minmax(min(140px, 100%), 1fr)`. `100%` resolves against the whole grid CONTAINER,
              not per track — with four tracks that is still 4x140 + gaps ≈ 680px. min() only
              rescues a grid whose SINGLE track is wider than the screen.

            An auto-fit grid cannot drop below its track count on its own, so on a 390px iPhone the
            footer stayed ~680px wide and `mx-auto` centred the overflow — which is why the first
            column was clipped on BOTH sides, not just the right.

            Tailwind's md: prefix is a real media query, so the column definition simply does not
            exist below 768px and the grid falls back to a single stacked column. */}
        {/* ⛔ EQUAL COLUMNS THAT COLLAPSE 4 → 2 → 1. NO auto-fit.
            `repeat(auto-fit, minmax(140px, 1fr))` asks the browser "how many 140px columns fit?"
            and collapses the extras — so the real column count was being GUESSED from the viewport
            rather than set from the content. With three columns in a 1152px canvas the leftovers
            collapsed but the space did not redistribute, and everything bunched left with ~250px
            of dead air on the right. Steven caught it against the divider line, which spans the
            full canvas because it is a plain border and not part of the grid.

            Explicit steps instead, so each column always fills its share of the row:
              1 column  on a phone
              2 columns from sm  (brand+divisions / company+contact)
              4 columns from lg  (brand · divisions · company · contact)
            ⚠️ No 3-column step: with four children, three columns strands the fourth on a row of
            its own — the exact lopsidedness this is fixing. */}
        <div className="mb-12 max-w-xl">
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
                  {brandMark}
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
                <span className="text-lg font-semibold">{brandMark}</span>
              </div>
            )}
            {blurb ? <p className="mt-6 text-sm leading-relaxed text-white/80">{blurb}</p> : null}
          </div>
        {/* ⛔ THREE COLUMNS, MATCHING THE MENU: Divisions · Company · Contact.
            Steven: "if we do three columns in both places... then the header and the footer will
            match, and as the screen collapses, the three columns go to two columns on a tablet,
            and they go to one column on a phone."
            The brand block moved ABOVE this grid rather than being a fourth column, which is what
            makes the footer's lower half structurally identical to the menu overlay. */}
        {/* ⛔ PROPORTIONAL, NOT EQUAL. Equal thirds held wildly unequal content: Divisions has
            two-line entries and wants the room, Company has one-word links that floated in ~500px
            of empty column, and Contact's buttons stretched to ~450px because the COLUMN was 450px.
            Steven read the middle one as "too narrow" — it was not narrow, it was cavernous, so the
            words looked stranded.

            ⚠️ Contact is a FIXED 300px, and that is the piece that matters: the buttons stop
            stretching because their column stops stretching. Every earlier attempt capped the
            button and left the column wide, which is why they kept looking wrong.

            sm and single-column stacking are untouched, so the phone view does not move. */}
        <div
          className={`grid gap-10 ${
            // ⚠️ 1fr / 1fr, was 1.5fr / 1fr. The old ratio was right for a Company column of three
            // BARE links — and wrong the moment that column started deriving from NAV_EXTRA, which
            // gave it four links WITH descriptions. At 1fr those wrapped to two lines while
            // Divisions' fit on one. Both columns are title + description now, so they want the
            // same width.
            // ⛔ Not a repeat of the equal-thirds mistake: that was equal widths over genuinely
            // unequal content. This is the reverse — the content became equal, so the widths did.
            groupEls.length ? "sm:grid-cols-2 lg:grid-cols-[1fr_1fr_var(--sjc-contact-w)]" : ""
          }`}
          // ⛔ A CSS VARIABLE, NOT AN INLINE WIDTH. An inline style beats a Tailwind class at
          // EVERY breakpoint, so styling the width directly would pin one value across all of
          // them and the responsive classes would silently stop working. Feeding a variable that
          // the class consumes keeps the breakpoints in charge.
          style={{ "--sjc-contact-w": `${contactWidth || 300}px` } as React.CSSProperties}
        >

          {groupEls.map((g, gi) => (
            <div key={`g${gi}`} className="text-center sm:text-left">
              <p className="text-sm font-semibold uppercase tracking-wide text-white/90">{g.heading}</p>
              {/* ⛔ PROXIMITY, NOT SIZE — space-y-3 → space-y-6 plus a hairline between items.
                  The gap between a description and the NEXT title used to be about the same as the
                  gap between a title and ITS OWN description (12px between, 2px within). With
                  one-line notes that read fine; with the three-line copy Steven wrote, the four
                  entries merged into one block of text.
                  The divider is the menu overlay's own treatment at footer scale — the two are
                  meant to match now, and one having lines while the other didn't was the second
                  thing his eye caught. */}
              <ul className="mt-4 space-y-6 text-sm">
                {g.links.map((l, i) => (
                  <li
                    key={i}
                    // ⛔ THE MENU'S OWN VALUE, NOT A GUESS AT ONE. Three rounds went to nudging
                    // this — white/10, /25, /50 — each a guess at "tasteful" when the instruction
                    // was simply "match the header". The menu draws its dividers in currentColor at
                    // 0.95, so that is what this uses.
                    // Steven: "why don't we go to what's in the header? What would it be too
                    // fucking white?" Correct question. There was no reason.
                    className={i ? "border-t pt-6" : undefined}
                    style={i ? { borderColor: "currentColor", borderTopWidth: 1, opacity: 0.95 } : undefined}
                  >
                    <a href={l.target || "#"} {...(l.newTab ? { target: "_blank", rel: "noopener noreferrer" } : {})} className="group block text-white/80 hover:text-white">
                      <span className="block">{l.label}</span>
                      {/* ⛔ UNDER THE LABEL, NOT ON HOVER. These four lines are the pitch — what
                          each division actually does — not a detail worth hiding. Hover does not
                          exist on a phone, which is where most of this footer gets read. */}
                      {l.note ? (
                        <span className="mt-0.5 block text-xs leading-snug text-white/50">
                          {l.note}
                        </span>
                      ) : null}
                    </a>
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
                  <a href={l.target || "#"} {...(l.newTab ? { target: "_blank", rel: "noopener noreferrer" } : {})} className="text-white/80 hover:text-white">{l.label}</a>
                </li>
              ))}
              {/* ⛔ THE EMAIL AND PHONE USED TO BE PRINTED HERE AS PLAIN LINES, AND THEY ARE GONE.
                  They now live on the three contact buttons, where the value sits under the verb —
                  so a visitor taps on a phone or reads and keys it in anywhere else. Listing them
                  in both places meant the same two facts in two spots, drifting apart the first
                  time one was edited, and it is what pushed the address off the right edge on a
                  phone in the first place. */}
            </ul>
          </div>
          )}

          {/* MOBILE ONLY — the contact block, last, under every link column.
              Stacked on a phone, two full-width blue buttons sitting up in the identity block put
              a call-to-action between the visitor and the entire sitemap: you scroll past "Call
              Us" to reach the links. At the bottom they are the last thing before the legal line,
              which is where a phone user expects to find them. Desktop is untouched — the copy in
              the brand column is `hidden md:flex`, this one is `md:hidden`, so exactly one renders
              at any width. */}
          {/* ⛔ CONTACT IS ITS OWN COLUMN NOW, AND THAT REPLACES A HACK.
              The buttons used to live inside the brand column, which made the left column tall
              while the link columns sat short beside it — the footer read bottom-heavy on the left.
              Worse, getting them below the links on a phone needed the SAME buttons rendered TWICE
              (`hidden md:flex` in the brand block, `md:hidden` at the end), because CSS `order`
              only sorts siblings and could not lift them out of that column.

              As a column of its own they are simply the LAST grid child: fourth across on a wide
              screen, last in the stack on a phone. One render, no duplication, and "contact at the
              bottom on mobile" falls out of the layout instead of being arranged.

              items-stretch: the buttons fill their column at every width. That is what closes the
              ragged empty space left-alignment opened up on a phone — the block gets a hard right
              edge instead of a jagged one. */}
          <div className="text-center sm:text-left">
            <p className="text-sm font-semibold uppercase tracking-wide text-white/90">Contact</p>
            {/* ⛔ FOUR BUTTONS NOW, AND THE SAME ARTWORK THE MENU USES. The footer had Call / Text /
                Email while the menu had those plus Book a Call, and the footer's still rendered the
                flat drawn glyphs — the same block showing two different things in two places, which
                is the exact drift the shared component was created to end. Book a Call and the icon
                URLs are props, so a client site sets its own or gets none. */}
            {/* ⛔ 75% WHEN STACKED, FULL COLUMN ON DESKTOP.
                Steven: "on the mobile phone it still looks stupid because it's too wide."
                On a phone the button was 100% of the column — the viewport minus 48px of padding,
                so ~342px on a 390px iPhone. The desktop fix (a fixed 300px column) does nothing
                below `lg`, because there the column IS the screen.
                max-w-[75%] caps it while stacked; lg:max-w-none hands control back to the 300px
                track so the two sizes can be tuned independently. */}
            {/* ⛔ WITH NO LINK COLUMNS THERE IS NO GRID TO SIT IN, AND THE BUTTONS RAN THE WHOLE BAND.
                `sm:max-w-none` hands the width back to the grid track — correct when Divisions and
                Company are beside it, and meaningless on a stripped footer where the contact block
                IS the row. Three blue bars 1400px wide is what Steven was looking at.
                So when there are no groups the block keeps an explicit width and stays left: the
                same ~300px column it would have occupied, which is the proportion he pointed at on
                his own site. Dialled from `contactWidth`, the field that already exists for it. */}
            {/* ⛔ ONE ROW ACROSS THE BAND when `contactLayout` is "row" — call · text · email, side
                by side, stacking under `sm` with no media query of its own. `items-stretch` is what
                holds the three pills to the same height when one label wraps and the others don't;
                without it a long email address makes its own column taller and the row goes ragged.
                No width cap in this mode: the columns ARE the width. */}
            <div
              className={`mt-4 gap-3 ${
                contactRow
                  ? "grid items-stretch sm:grid-cols-3"
                  : groupEls.length
                    ? "mx-auto flex max-w-[var(--sjc-btn-w)] flex-col items-stretch sm:mx-0 sm:max-w-none"
                    : "mx-auto flex max-w-[var(--sjc-btn-w)] flex-col items-stretch sm:mx-0 sm:max-w-[var(--sjc-contact-w)]"
              }`}
              style={
                {
                  "--sjc-btn-w": `${buttonWidthMobile || 50}%`,
                  "--sjc-contact-w": `${contactWidth || 300}px`,
                } as React.CSSProperties
              }
            >
              <ContactButtons
                phone={phone}
                phoneDisplay={phoneDisplay}
                email={email}
                iconCall={iconCall}
                iconText={iconText}
                iconEmail={iconEmail}
                bookHref={bookHref}
                bookLabel={bookLabel}
                bookIcon={bookIcon}
                bookNote={bookHref ? "(Click Here)" : ""}
                variant={pillVariant}
                // Left-aligned only on the outline pill: a bordered pill at a fixed width reads as
                // a list of actions, and a centred label in a wide bordered box reads as a gap.
                align={pillVariant === "outline" ? "left" : "center"}
              />
            </div>
          </div>
        </div>

        <div
          className="flex flex-col gap-4 border-t border-white/10 pt-6 text-xs text-white/70 sm:flex-row sm:items-center sm:justify-between"
          style={{ marginTop: typeof legalGap === "number" ? legalGap : 48 }}
        >
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
