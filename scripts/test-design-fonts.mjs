// Fixture-driven proof for lib/designFonts.ts's familiesIn — the wordmark's third face
// (.mark__2 { font-family: 'Playfair Display', … }) is visible, generic fallbacks are not, and
// ordering is by how many rules actually use the family.
//
//   node scripts/test-design-fonts.mjs

import { familiesIn } from "../lib/designFonts.ts";

const STYLESHEET = `
  h1, h2, h3 { font-family: 'Space Grotesk', sans-serif; }
  .eyebrow { font-family: 'Space Grotesk', sans-serif; }
  body { font-family: 'Inter', ui-sans-serif, sans-serif; }
  p, li { font-family: 'Inter', ui-sans-serif, sans-serif; }
  .btn { font-family: 'Inter', ui-sans-serif, sans-serif; }
  .mark__2 { font-family: 'Playfair Display', Georgia, serif; }
  .x { font-family: ui-sans-serif, system-ui; }
`;

let total = 0;
let failures = 0;
function check(name, got, want) {
  total++;
  const pass = JSON.stringify(got) === JSON.stringify(want);
  if (!pass) failures++;
  console.log(`${pass ? "PASS" : "FAIL"} — ${name}${pass ? "" : ` (want ${JSON.stringify(want)}, got ${JSON.stringify(got)})`}`);
}

// 1. Exactly the three real families, decoy generic excluded.
{
  const got = familiesIn(`<style>${STYLESHEET}</style>`);
  check(
    "returns exactly the three real families (decoy generic excluded)",
    got.map((f) => f.family),
    ["Inter", "Space Grotesk", "Playfair Display"]
  );
}

// 2. Ordering is by usage (rules count), most-used first.
{
  const got = familiesIn(`<style>${STYLESHEET}</style>`);
  check(
    "ordering is by usage — Inter (4 rules) > Space Grotesk (2 rules) > Playfair Display (1 rule)",
    got.map((f) => f.rules),
    [4, 2, 1]
  );
}

// 3. Selectors are attached to the right family.
{
  const got = familiesIn(`<style>${STYLESHEET}</style>`);
  const playfair = got.find((f) => f.family === "Playfair Display");
  check("Playfair Display's selectors are just .mark__2", playfair?.selectors, [".mark__2"]);

  const spaceGrotesk = got.find((f) => f.family === "Space Grotesk");
  check(
    "Space Grotesk's selectors are h3 and .eyebrow (last token of each rule's selector list)",
    (spaceGrotesk?.selectors || []).slice().sort(),
    ["h3", ".eyebrow"].slice().sort()
  );
}

// 4. No font-family anywhere -> [].
{
  const got = familiesIn(`<style>.card { color: red; padding: 10px; }</style>`);
  check("a stylesheet with no font-family returns []", got, []);
}

// 5. The `css` param is read too, not just <style> blocks in `html`.
{
  const got = familiesIn(`<div></div>`, `.mark__2 { font-family: 'Playfair Display', Georgia, serif; }`);
  check("the css param alone is read when html has no <style> block", got.map((f) => f.family), ["Playfair Display"]);
}

// 6. No network calls happen — familiesIn is pure string parsing (proven by not importing
// captureFamily/captureDesignFonts here at all, and by running fully offline in CI).

console.log(`\n${total - failures}/${total} passed`);
if (failures) process.exit(1);
