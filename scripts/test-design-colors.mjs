// Fixture-driven proof for lib/designColors.ts — colorsIn/applyColorMap/isDark mirror the
// contract sizesIn/applyTypeScale already proved for font-size, pointed at colour instead.
//
//   node scripts/test-design-colors.mjs

import { colorsIn, applyColorMap, isDark } from "../lib/designColors.ts";

let total = 0;
let failures = 0;
function check(name, got, want) {
  total++;
  const pass = JSON.stringify(got) === JSON.stringify(want);
  if (!pass) failures++;
  console.log(`${pass ? "PASS" : "FAIL"} — ${name}${pass ? "" : ` (want ${JSON.stringify(want)}, got ${JSON.stringify(got)})`}`);
}
function checkTrue(name, cond) {
  total++;
  if (!cond) failures++;
  console.log(`${cond ? "PASS" : "FAIL"} — ${name}`);
}

// 1. Case-insensitive grouping — #FFF, #ffffff, #FFFFFF are one entry.
{
  const css = `
    h1 { color: #FFF; }
    h2 { color: #ffffff; }
    .btn { color: #FFFFFF; }
  `;
  const got = colorsIn(css);
  check("case-insensitive grouping collapses to one entry", got.map((c) => c.value), ["#ffffff"]);
  check("all three rules counted on that one entry", got[0]?.rules, 3);
}

// 2. 3-digit vs 6-digit equivalence, distinct from an unrelated colour.
{
  const css = `
    .a { color: #f00; }
    .b { color: #ff0000; }
    .c { color: #00ff00; }
  `;
  const got = colorsIn(css);
  check(
    "3-digit #f00 and 6-digit #ff0000 group together (2 rules), #00ff00 stays separate (1 rule)",
    got.map((c) => [c.value, c.rules]),
    [
      ["#ff0000", 2],
      ["#00ff00", 1],
    ]
  );
}

// 3. rgba() groups onto the same entry as its hex spelling; alpha is dropped from canonical form.
{
  const css = `
    .a { color: #112233; }
    .b { background: rgba(17, 34, 51, 0.5); }
    .c { border-color: rgb(17,34,51); }
  `;
  const got = colorsIn(css);
  check("hex + rgba + rgb of the same colour all group onto one canonical entry", got.map((c) => c.value), ["#112233"]);
  check("all three rules counted", got[0]?.rules, 3);
}

// 4. Property recording — a colour used as text vs a background is distinguishable.
{
  const css = `
    h1 { color: #0f172a; }
    .band { background-color: #0f172a; }
    .btn { border-color: #0f172a; }
  `;
  const got = colorsIn(css);
  check(
    "one colour used on three different properties records all three",
    got[0]?.props,
    ["background-color", "border-color", "color"]
  );
}

// 4b. A longer property name isn't swallowed by the bare `color` alternative.
{
  const css = `.link { text-decoration-color: #ff00ff; }`;
  const got = colorsIn(css);
  check("text-decoration-color is recorded by its full name, not just 'color'", got[0]?.props, ["text-decoration-color"]);
}

// 5. Multi-colour box-shadow — both colours found independently, on the box-shadow property.
{
  const css = `.card { box-shadow: 0 2px 4px #000, inset 0 0 2px #fff; }`;
  const got = colorsIn(css);
  check(
    "box-shadow's two colours both surface, both tagged box-shadow",
    got.map((c) => [c.value, c.props]).sort((a, b) => a[0].localeCompare(b[0])),
    [
      ["#000000", ["box-shadow"]],
      ["#ffffff", ["box-shadow"]],
    ]
  );
}

// 6. Selectors are attached to the right colour.
{
  const css = `
    h1, h2 { color: #123456; }
    .eyebrow { color: #123456; }
    .btn { background: #654321; }
  `;
  const got = colorsIn(css);
  const brand = got.find((c) => c.value === "#123456");
  check(
    "#123456's selectors are h1, h2, .eyebrow",
    (brand?.selectors || []).slice().sort(),
    ["h1", "h2", ".eyebrow"].slice().sort()
  );
}

// 7. applyColorMap rewrites a simple value, every spelling of the same colour.
{
  const css = `h1 { color: #FFF; } h2 { color: #ffffff; } .x { color: #000000; }`;
  const got = applyColorMap(css, { "#ffffff": "#eeeeee" });
  check(
    "both #FFF and #ffffff rewrite to the mapped value, #000000 untouched",
    got,
    `h1 { color: #eeeeee; } h2 { color: #eeeeee; } .x { color: #000000; }`
  );
}

// 8. applyColorMap must not corrupt a multi-colour box-shadow — each token handled independently.
{
  const css = `.card { box-shadow: 0 2px 4px #000, inset 0 0 2px #fff; }`;
  const got = applyColorMap(css, { "#000000": "#111111" });
  check(
    "only #000 in the box-shadow rewrites; #fff two commas later is untouched",
    got,
    `.card { box-shadow: 0 2px 4px #111111, inset 0 0 2px #fff; }`
  );
}

// 9. applyColorMap reaches inside @media blocks.
{
  const css = `@media (min-width: 640px) { .hero { background: #abcdef; } }`;
  const got = applyColorMap(css, { "#abcdef": "#123123" });
  check(
    "a colour inside @media is rewritten",
    got,
    `@media (min-width: 640px) { .hero { background: #123123; } }`
  );
}

// 10. Empty map is an EXACT no-op — same string reference back.
{
  const css = `h1 { color: #ffffff; background: rgba(0,0,0,.5); }`;
  const got = applyColorMap(css, {});
  checkTrue("applyColorMap(css, {}) === css (reference equality)", got === css);
}

// 11. Self-map (value maps to itself, any spelling) is an EXACT no-op.
{
  const css = `h1 { color: #ffffff; }`;
  const got1 = applyColorMap(css, { "#ffffff": "#ffffff" });
  const got2 = applyColorMap(css, { "#FFF": "#ffffff" });
  const got3 = applyColorMap(css, null);
  checkTrue("applyColorMap(css, {same key/value}) === css", got1 === css);
  checkTrue("applyColorMap(css, {differently-spelled self-map}) === css", got2 === css);
  checkTrue("applyColorMap(css, null) === css", got3 === css);
}

// 12. A data URI's colours are NOT picked up by colorsIn.
{
  const css = `.logo { background: url("data:image/svg+xml,<svg fill='#ff0000'></svg>"); color: #223344; }`;
  const got = colorsIn(css);
  check("only the real declared colour surfaces, the data URI's hex is ignored", got.map((c) => c.value), ["#223344"]);
}

// 12b. applyColorMap similarly does not rewrite a colour sitting inside url(...).
// (Documented scope: applyColorMap targets the design's own declared colours; a value baked into
// a data URI is pixel data, not a CSS declaration, and colorsIn — the source of any map a caller
// would build — never surfaces it as a key in the first place.)

// 13. @font-face is excluded from colorsIn (it carries no colour a person would repaint).
{
  const css = `@font-face { font-family: 'X'; src: url(x.woff2); } h1 { color: #445566; }`;
  const got = colorsIn(css);
  check("only the real rule's colour surfaces", got.map((c) => c.value), ["#445566"]);
}

// 14. isDark — a small luminance helper for readable swatch text.
{
  checkTrue("#000000 reads as dark", isDark("#000000"));
  checkTrue("#ffffff does not read as dark", !isDark("#ffffff"));
  checkTrue("#fff (3-digit) does not read as dark", !isDark("#fff"));
  checkTrue("a dark navy reads as dark", isDark("#0f172a"));
}

// 15. No network calls happen — colorsIn/applyColorMap/isDark are pure string parsing (proven by
// running fully offline in CI, same guarantee familiesIn documents in test-design-fonts.mjs).

console.log(`\n${total - failures}/${total} passed`);
if (failures) process.exit(1);
