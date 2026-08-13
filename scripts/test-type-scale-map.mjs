// Fixture-driven proof for lib/typeScaleMap.ts's governingSize — nested elements, the innermost
// wins, and an unmatched token returns "" rather than guessing.
//
//   node scripts/test-type-scale-map.mjs

import { governingSize } from "../lib/typeScaleMap.ts";

const INDEX = [
  { value: "clamp(40px,6vw,68px)", selectors: ["h1.big"] },
  { value: "24px", selectors: ["h2", ".hl"] },
  { value: "11px", selectors: [".eyebrow"] },
  { value: "15px", selectors: ["p"] },
];

const cases = [
  {
    name: "class-and-tag selector on the direct parent (h1.big)",
    html: `<section><h1 class="big">{{t:t3}}</h1></section>`,
    key: "t3",
    want: "clamp(40px,6vw,68px)",
  },
  {
    name: "token inside <h2><span class=\"hl\">…</span></h2> — the class wins over the h2 tag",
    html: `<h2><span class="hl">{{t:t4}}</span></h2>`,
    key: "t4",
    want: "24px",
  },
  {
    name: "bare <p>, no class anywhere on the chain",
    html: `<div class="card"><p>{{t:t5}}</p></div>`,
    key: "t5",
    want: "15px",
  },
  {
    name: "unmatched token — no selector in the index applies",
    html: `<footer class="legal">{{t:t9}}</footer>`,
    key: "t9",
    want: "",
  },
  {
    name: "key not present in html at all",
    html: `<h1 class="big">{{t:t3}}</h1>`,
    key: "tX",
    want: "",
  },
  {
    name: "class-bearing ancestor two levels up wins over an unmatched inner span",
    html: `<span class="eyebrow"><em>{{t:t1}}</em></span>`,
    key: "t1",
    want: "11px",
  },
  {
    name: "innermost classed match wins over an outer classed match",
    html: `<div class="eyebrow"><h2 class="hl">{{t:t6}}</h2></div>`,
    key: "t6",
    want: "24px",
  },
  {
    name: "mismatched closing tags don't crash the stack unwind",
    html: `<div class="wrap"><span class="eyebrow">{{t:t7}}</span></div>`,
    key: "t7",
    want: "11px",
  },
  {
    name: "void element before the token is not pushed onto the stack",
    html: `<p><img src="x.png">{{t:t8}}</p>`,
    key: "t8",
    want: "15px",
  },
  {
    name: "self-closing element before the token is not pushed onto the stack",
    html: `<div class="row"><br/>{{t:t2}}</div>`,
    key: "t2",
    want: "",
  },
];

let failures = 0;
for (const c of cases) {
  const got = governingSize(c.html, c.key, INDEX);
  const pass = got === c.want;
  if (!pass) failures++;
  console.log(`${pass ? "PASS" : "FAIL"} — ${c.name}${pass ? "" : ` (want ${JSON.stringify(c.want)}, got ${JSON.stringify(got)})`}`);
}

console.log(`\n${cases.length - failures}/${cases.length} passed`);
if (failures) process.exit(1);
