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

// Optional path argument so this can be run against an OLD config (git show <rev>:path > /tmp/x)
// and proved to fail where it should. A guard nobody has watched fail is not known to work.
const CONFIG = process.argv[2] || new URL("../components/puck/config.tsx", import.meta.url);
const src = readFileSync(CONFIG, "utf8");

// ⛔ THE WORD-GREP BELOW WAS TOO LOOSE TO CATCH THIS CHECK'S OWN FLAGSHIP CASE (fixed 2026-08-13).
//
// `DesignSection.columns` was declared as a field, typed, defaulted, given a CSS generator and read
// by the component — and never forwarded by the bridge. The control saved, said "Saved", and moved
// nothing. This script ran clean, because `usedIn("columns")` found the word in thirty unrelated
// files (`grid-template-columns`, a SQL column, a Columns block) and filed it under "eyeball this".
//
// A name that common can never be evidence. The precise question is not "does this word appear
// somewhere" but "does the component this bridge feeds ASK FOR this prop" — and if it does, and the
// bridge does not pass it, that is a dead control with no judgement call left in it.
const componentSrc = new Map();
/** The props the receiving component actually declares, read from its own file. */
function declaredBy(tag) {
  if (!tag) return null;
  if (componentSrc.has(tag)) return componentSrc.get(tag);
  const found = spawnSync("grep", ["-rl", `^export default function ${tag}\\b\\|^function ${tag}\\b`, "--include=*.tsx", "components"], { encoding: "utf8" });
  const file = (found.stdout || "").split("\n").filter(Boolean)[0];
  let props = null;
  if (file) {
    const text = readFileSync(file, "utf8");
    props = new Set();
    // A prop declared in a type/props object: `columns?: number | null;`
    for (const m of text.matchAll(/^\s{2}(\w+)\??:\s/gm)) props.add(m[1]);
    // …or destructured straight out of props in the signature.
    for (const m of text.matchAll(/^\s{2}(\w+),?\s*$/gm)) props.add(m[1]);
  }
  componentSrc.set(tag, props);
  return props;
}

/** Read off the stored data server-side (`n.props.formId`) rather than passed as a prop. */
function readFromStoredProps(name) {
  const out = spawnSync(
    "grep",
    ["-rnE", `props[?]?\\.${name}\\b`, "lib", "app"],
    { encoding: "utf8" }
  );
  return (out.stdout || "").split("\n").filter((l) => /\.tsx?:/.test(l));
}

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

  // Which component this bridge feeds — the first JSX tag after render().
  const tag = body.slice(body.indexOf(render[0]))?.match(/<([A-Z]\w+)/)?.[1] || null;
  const wants = declaredBy(tag);

  for (const f of fieldNames.filter((x) => !taken.has(x))) {
    // THE UNAMBIGUOUS CASE: the receiving component declares this prop and the bridge drops it.
    // No judgement call — the component asked, and it will get `undefined` forever.
    if (wants && wants.has(f)) {
      // ⚠️ UNLESS IT IS RESOLVED OFF THE STORED DATA. lib/formPointer rewrites `props.formId` into
      // real fields before render ever runs, so that prop is CORRECTLY not forwarded — and a check
      // that cried wolf on it would be turned off within a week.
      //
      // `props.<name>` is the precise test, and it is precise where a word-grep is useless: the
      // word `columns` appears in ten lib/app files (a SQL column, a grid column, a form column)
      // and `props.columns` appears in none.
      const server = readFromStoredProps(f);
      if (server.length) {
        review.push(`${name}.${f}  ->  resolved server-side: ${server[0].split(":")[0]}`);
        continue;
      }
      dead++;
      console.error(
        `\n⛔ ${name}.${f} — <${tag}> declares this prop and render() never forwards it.` +
          `\n   The control saves and does nothing. Add it to the destructure AND the forward.`
      );
      continue;
    }
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
