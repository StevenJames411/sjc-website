# tools/ — getting a bought design ready for `/edit/import`

We rent the design and own the last 10%. SiteDrop and LandingSite both sell the same thing —
plain `<section>` blocks with Tailwind classes and CSS variables — which is why the sealed
importer eats either one unchanged. These scripts cover the gap between "the design exists over
there" and "paste this into the import box".

Nothing here runs in production. They're hand tools.

## SiteDrop

Nothing needed. Paste the published address (`whatever.sitedrop.ai`) straight into the URL box
on `/edit/import` — it's server-rendered, so fetching it server-side gets the real page.

## LandingSite

The URL box **cannot** work here. `app.landingsite.ai/website-preview?id=…` is a React app;
fetching it server-side returns a 2.6KB loading shell with no site in it. Their GraphQL API
answers unauthenticated, so we pull the sections out ourselves:

```sh
python3 tools/pull_landingsite.py "<preview URL>" site.html
python3 tools/inline_icons.py site.html
# then paste site.html into /edit/import
```

`pull_landingsite.py` stitches header + sections + footer into one document and — this is the
part that matters — writes the design's colour palette into a `:root` block and its fonts into
`body{}` / `h1..h6{}`. The markup only ever says `var(--primary-color)` and never a hex, so
without that block the importer's palette and font detection both come back empty.

`inline_icons.py` replaces their empty `<i class="fa-solid fa-star">` tags with real inline SVG
from Font Awesome **Free**. LandingSite fills those tags at runtime from their Font Awesome
**Pro** kit; we strip `<script>` and `<link>` at import, so untouched they'd arrive as empty
boxes — 104 of them across the first two designs. Inlining also means we're not leaning on
somebody else's Pro licence.

Both are idempotent. Re-running the puller re-fetches from scratch, so run the icon inliner
after it, not before.

## What to check after any import

- `remainingForeign: 0` from `/api/adopt-images` — photos are on our storage, not the vendor's
- the mobile menu opens (`components/blocks/DesignMenu.tsx` wires it; the design's own script
  is stripped)
- icons are visible, not empty gaps

⚠️ Driving `/api/import-html` with `SITE_EDIT_TOKEN` instead of a browser session leaves every
photo on the source's server — the bearer isn't forwarded to the internal adopt step, which comes
back `unauthorized`. Call `/api/adopt-images` yourself afterwards.
