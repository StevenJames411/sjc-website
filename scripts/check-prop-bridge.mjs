// Every Puck component names its props THREE times. This finds the ones that disagree.
//
//   node scripts/check-prop-bridge.mjs
//
// ── WHY ───────────────────────────────────────────────────────────────────────────────────────
// components/puck/config.tsx is an explicit prop bridge, not a spread:
//
//     fields: { sheet: {…}, html: {…} }                      <- what the sidebar shows
//     render: ({ html, text, … }) => <DesignSection html={html} … />
//              ^ destructured                      ^ forwarded
//
// A prop can be declared in `fields`, given a default, and stamped correctly in the stored data,
// and still reach the component as `undefined` — because it is missing from the destructure or the
// forward. Nothing warns. The page renders; it just quietly loses whatever that prop controlled.
//
// That is how `sheet` went missing on 2026-08-12. The stylesheet id was on the type, the field, the
// defaults and in the data, and the block still rendered without its per-sheet class. It cost six
// production deploys to find, in a file already read twice, because the symptom (a page that
// renders) looks nothing like the cause (a prop never passed).
//
// A mechanical mistake gets a mechanical check rather than more care.
//
// ⚠️ IT REPORTS; IT DOES NOT MOSTLY FAIL. Two earlier drafts of this file were useless in opposite
// directions — one flagged 24 defects on a component that works perfectly, the other excluded so
// much that it would have missed the very bug it exists for. Static analysis cannot tell "read off
// the data on purpose" from "declared and never wired", so it shows the evidence, and fails only on
// the unambiguous case: a field connected to nothing, anywhere.
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const src = readFileSync(new URL("../components/puck/config.tsx", import.meta.url), "utf8");

/** Every file outside the config that mentions this prop name. */
function usedIn(name) {
  const out = spawnSync(
    "grep",
    ["-rlE", `\\b${name}\\b`, "--include=*.ts", "--include=*.tsx", "lib", "app", "components"],
    { encoding: "utf8" }
  );
  return (out.stdout || "")
    .split("\n")
    .filter(Boolean)
    .filter((f) => !f.endsWith("components/puck/config.tsx"));
}

const COMPONENT = /^ {4}(\w+): \{$/gm;
const starts = [...src.matchAll(COMPONENT)].map((m) => ({ name: m[1], at: m.index }));

let dead = 0;
const review = [];

for (let i = 0; i < starts.length; i++) {
  const name = starts[i].name;
  const body = src.slice(starts[i].at, starts[i + 1]?.at ?? src.length);

  const fieldsAt = body.indexOf("fields: {");
  if (fieldsAt < 0) continue;
  const fieldNames = [...body.slice(fieldsAt).matchAll(/^ {8}(\w+): \{$/gm)].map((m) => m[1]);
  if (!fieldNames.length) continue;

  // ⚠️ The COMPONENT-level render, anchored by its indentation. Not just /render:/ — every custom
  // FIELD has its own `render: ({ onChange, value })` nested inside `fields`, and matching one of
  // those is what produced the 24 false positives on the first run.
  const render = body.match(/^ {6}render:\s*\(\{([^}]*)\}\)/m);
  if (!render) continue;
  const taken = new Set(
    render[1]
      .split(",")
      .map((s) => s.trim().split(":")[0].trim())
      .filter(Boolean)
  );

  for (const f of fieldNames.filter((x) => !taken.has(x))) {
    const where = usedIn(f);
    if (!where.length) {
      dead++;
      console.error(
        `\n⛔ ${name}.${f} — declared as a field and referenced NOWHERE else.` +
          `\n   A control in the sidebar wired to nothing. Pass it through render(), or delete it.`
      );
    } else {
      review.push(`${name}.${f}  ->  ${where.join(", ")}`);
    }
  }
}

if (review.length) {
  console.log(
    `\nEYEBALL THESE — declared but not passed through render(). CORRECT when the value is read off` +
      `\nthe saved data on the server (lib/formPointer resolves formId; lib/publicSitePage reads` +
      `\nfooterBlk.props.mirrorHeaderLinks). A silent bug when it is not:\n\n` +
      review.map((r) => `    ${r}`).join("\n") +
      `\n`
  );
}

console.log(`prop bridge: ${dead} dead control(s), ${review.length} to eyeball.`);
if (dead) process.exit(1);
