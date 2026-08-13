"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import type { DesignText } from "@/components/blocks/DesignSection";
import { useSizeScale, type SizeIndex } from "./SizeScaleContext";
import { onTextFocus, takePendingFocus } from "@/lib/designFocus";
import ColorField from "./ColorField";
import SizeStepper from "./SizeStepper";

// The "Words on this section" list, rendered by us instead of by Puck's array field.
//
// ── WHY NOT PUCK'S ARRAY FIELD ────────────────────────────────────────────────────────────────
// Two reasons, and the second is the one that forced it.
//
// A bought design lands as forty-odd text rows in one section. Scrolling a flat list of forty to
// find the headline you are looking straight at is the single worst part of editing an imported
// page — so this needs a filter box, which an array field has no room for.
//
// And clicking a word on the canvas has to OPEN that word's row. Doing that through Puck's array
// field means selecting its DOM, whose class names are content-hashed (`_ArrayField_14u8o_5`) —
// a selector that works today and breaks silently on the next Puck upgrade, in a way nobody
// notices until they click a headline and nothing happens. Owning the markup makes the link
// between canvas and sidebar something we can actually keep working.
//
// ⚠️ NO ADD / REMOVE / REORDER, on purpose. These rows are not authored, they are DISCOVERED —
// one per text node in the markup someone bought. A row with no token behind it edits nothing,
// and deleting one leaves a hole in the design that can only be repaired by re-importing.

const ROW_LIMIT_BEFORE_FILTER = 8;

/**
 * ── THE LINES, GROUPED THE WAY THE PAGE IS ───────────────────────────────────────────────────
 *
 * Steven, looking at fourteen flat rows for a six-card section: *"there's so much shit in that
 * right sidebar, it gets overwhelming… whatever I click on is the only thing that I'm looking at."*
 *
 * ⛔ THE DESIGN ALREADY WROTE THE LABELS AND WE WERE NOT USING THEM. His own realisation: the six
 * feature cards are called "1 · Custom Websites", "2 · Five Star Reviews", and so on. Those words
 * are sitting in the rows. Naming a group after its heading turns an anonymous list of "Heading:" /
 * "Text:" into the six things he can see on the canvas.
 *
 * ⚠️ INFERRED, NOT MARKED. A sealed design carries no card boundaries — that is the trade that
 * keeps the look intact — so the rule is: a heading starts a new group, everything after it joins
 * that group until the next heading. That is exactly right for cards, headline-plus-paragraph
 * bands and feature lists, which is nearly everything. Where a section has no headings at all it
 * yields ONE group, which is the flat list we already had, so the fallback costs nothing.
 *
 * ⚠️ Rows before the first heading are the section's own eyebrow and headline — the two lines
 * Steven took for another section's content, because they sit above the cards and off-screen.
 * They get their own group, named for what they are.
 */
const isHeadingRow = (r: DesignText) => /^Heading\b/.test(r.label || "");

type RowGroup = { key: string; name: string; rows: DesignText[] };

function buildGroups(rows: DesignText[]): RowGroup[] {
  const out: RowGroup[] = [];
  for (const r of rows) {
    if (isHeadingRow(r) || !out.length) {
      out.push({
        key: r.key,
        name: isHeadingRow(r) ? r.value || "Untitled heading" : "Top of the section",
        rows: [r],
      });
    } else {
      out[out.length - 1].rows.push(r);
    }
  }
  return out;
}

/** Which group holds a row — so clicking a word on the canvas opens the group as well as the row. */
function groupKeyFor(rows: DesignText[], key: string): string | null {
  const groups = buildGroups(rows);
  return groups.find((g) => g.rows.some((r) => r.key === key))?.key ?? null;
}


/**
 * Which SITE-WIDE size governs this line — asked of the canvas, not of the markup.
 *
 * ⛔ THE BROWSER HAS ALREADY DONE THE HARD PART. Working out which rule wins for an element means
 * implementing CSS specificity over a 30KB stylesheet; the canvas has a real DOM where that is
 * already resolved. So this walks UP from the marked span and matches ancestors against the size
 * index — the same shape as lib/typeScaleMap.governingSize, but on real elements with real classes
 * instead of a string, which is both simpler and more accurate.
 *
 * ⚠️ CLASS BEFORE TAG, at every level. A design names its own decisions in classes (`.big`,
 * `.eyebrow`, `.lede`); a bare `p` rule is the category default underneath them. Checking the tag
 * first would report the fallback and quietly resize every paragraph on the website when the
 * person meant one headline.
 *
 * Returns "" when nothing matches, and the panel then offers only the per-line control — the same
 * promise made everywhere else here: no guess is better than a wrong one.
 */
function governingSizeInCanvas(key: string, index: SizeIndex): string {
  if (typeof document === "undefined" || !key || !index.length) return "";
  const start = document.querySelector(`[data-sjc-text="${CSS.escape(key)}"]`);
  if (!start) return "";

  const matches = (el: Element, sel: string): boolean => {
    const cls = (sel.match(/\.([A-Za-z0-9_-]+)$/) || [])[1];
    const tag = (sel.match(/^([a-z][a-z0-9]*)/i) || [])[1];
    if (tag && el.tagName.toLowerCase() !== tag.toLowerCase()) return false;
    if (cls && !el.classList.contains(cls)) return false;
    return !!(tag || cls);
  };

  for (let el: Element | null = start; el; el = el.parentElement) {
    // Never leave this section — the wrapper carries the design's scope class.
    if (el.hasAttribute?.("data-sjc-sheet")) break;
    for (const pass of [true, false]) {
      for (const z of index) {
        for (const sel of z.selectors) {
          const hasClass = /\.[A-Za-z0-9_-]+$/.test(sel);
          if (hasClass !== pass) continue;
          if (matches(el, sel)) return z.value;
        }
      }
    }
  }
  return "";
}


/**
 * "…and everywhere else this size is used." The other half of the size control.
 *
 * ⛔ WHY THIS EXISTS AT ALL. The stepper above writes an inline style on ONE line, in ONE section,
 * on ONE page. On a ten-page site built from imported designs the same size governs the same band
 * on all ten — so matching a headline meant repeating the edit sixty times, which is what Steven
 * was staring down: *"I have to go back through this website… that'll take me all fucking day."*
 *
 * The global list built first solved the propagation and not the identification: thirty-six rows of
 * numbers, and *"how in the fuck do I know in the global panel what I'm adjusting."* The answer is
 * to stop asking him to identify text by its font size and let him point at it. His model, which is
 * better than mine: *"I set the home page from top to bottom, the rest of the pages should follow."*
 *
 * So: click the words on the canvas, and change that size for the whole website from right here.
 *
 * ⚠️ SHOWS NOTHING WHEN THE GOVERNING SIZE CANNOT BE RESOLVED. A control that silently edits the
 * wrong size is worse than one that is absent — the per-line stepper above still works, and it is
 * the honest fallback.
 */
function GlobalSize({ textKey }: { textKey: string }) {
  const { index, scale, setGlobal, status, places } = useSizeScale();
  const [declared, setDeclared] = useState("");

  // Resolved after paint: the canvas has to have rendered this section for the DOM walk to find
  // the marked span. Re-runs when the panel opens a different row.
  useEffect(() => {
    setDeclared(governingSizeInCanvas(textKey, index));
  }, [textKey, index]);

  if (!declared) return null;
  const current = scale[declared] || declared;
  const px = /^-?[\d.]+px$/.test(current);
  const n = places(declared);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", padding: "6px 0 2px" }}>
      <span style={{ fontSize: 11.5, color: "var(--color-sjc-mute)" }}>
        Everywhere{n > 1 ? ` · ${n} places` : ""}
      </span>
      {px ? (
        <input
          type="number"
          min={6}
          step={1}
          value={parseFloat(current)}
          onChange={(e) => setGlobal(declared, e.target.value ? `${e.target.value}px` : "")}
          style={{ width: 68, padding: "4px 6px", fontSize: 12.5, borderRadius: 6, border: "1px solid var(--color-sjc-line)" }}
        />
      ) : (
        // clamp() and friends stay editable as text — a responsive headline is exactly the size
        // somebody most wants to change, and hiding it because it is not a plain number would put
        // the biggest text on the page out of reach.
        <input
          type="text"
          value={current}
          onChange={(e) => setGlobal(declared, e.target.value.trim())}
          style={{ width: 168, padding: "4px 6px", fontSize: 11.5, borderRadius: 6, border: "1px solid var(--color-sjc-line)" }}
        />
      )}
      {scale[declared] ? (
        <button
          type="button"
          onClick={() => setGlobal(declared, "")}
          style={{ fontSize: 11, background: "none", border: "none", textDecoration: "underline", cursor: "pointer", color: "var(--color-sjc-mute)" }}
        >
          reset
        </button>
      ) : null}
      {status ? <span style={{ fontSize: 11, color: "var(--color-sjc-mute)" }}>{status}</span> : null}
    </div>
  );
}

export default function DesignTextField({
  value,
  onChange,
}: {
  value?: DesignText[];
  onChange: (v: DesignText[]) => void;
}) {
  const rows = useMemo(() => (Array.isArray(value) ? value : []), [value]);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const hostRef = useRef<HTMLDivElement | null>(null);
  // ⚠️ The focus subscription is set up once, so it would otherwise close over the first render's
  // rows and stop finding groups the moment a word is edited.
  const rowsRef = useRef(rows);
  rowsRef.current = rows;

  const set = (key: string, patch: Partial<DesignText>) =>
    onChange(rows.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  // Open + scroll to a row, whether the request arrived before this field existed (the latch) or
  // while it was already on screen (the subscription). See lib/designFocus.ts for why both.
  const focusRow = (key: string) => {
    if (!key) return;
    setOpen(key);
    // ⛔ OPEN THE GROUP TOO, or clicking a word on the canvas selects a row inside a collapsed
    // group and nothing appears to happen — the exact failure the canvas-to-sidebar link exists
    // to prevent.
    setOpenGroup(groupKeyFor(rowsRef.current, key));
    setQ("");
    // After the row has rendered open.
    requestAnimationFrame(() => {
      const el = hostRef.current?.querySelector<HTMLElement>(`[data-row="${CSS.escape(key)}"]`);
      if (!el) return;
      el.scrollIntoView({ block: "center", behavior: "smooth" });
      el.querySelector("textarea")?.focus();
    });
  };

  useEffect(() => {
    const pending = takePendingFocus();
    if (pending) focusRow(pending);
    return onTextFocus(focusRow);
    // Subscribing once is right: focusRow only reads refs and setters, both stable enough here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const needle = q.trim().toLowerCase();
  const shown = needle
    ? rows.filter(
        (r) =>
          (r.value || "").toLowerCase().includes(needle) ||
          (r.label || "").toLowerCase().includes(needle)
      )
    : rows;

  const groups = useMemo(() => buildGroups(rows), [rows]);
  // ⚠️ ONLY WHEN IT EARNS ITS KEEP. Grouping a short section, or one that yields a single group,
  // adds a click and buys nothing — so the flat list stays for those. And a search always goes
  // flat: if you typed it, you already know what you want.
  const groupsOn = !needle && groups.length > 1 && rows.length > ROW_LIMIT_BEFORE_FILTER;

  // ⛔ ONE ROW RENDERER, USED BY BOTH VIEWS. The grouped list and the search results draw the
  // identical row; defining it twice is how the two would quietly diverge.
  const renderRow = (row: DesignText) => {
        const isOpen = open === row.key;
        const touched = !!row.size || !!row.color || row.bold === true || row.bold === false;
        return (
          <div
            key={row.key}
            data-row={row.key}
            style={{
              border: "1px solid var(--color-sjc-line)",
              borderRadius: 6,
              background: isOpen ? "var(--color-sjc-bg-soft)" : "transparent",
            }}
          >
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : row.key)}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                padding: "7px 9px",
                background: "none",
                border: 0,
                cursor: "pointer",
                font: "inherit",
              }}
            >
              <span style={{ display: "block", fontSize: 11, color: "#6b7280" }}>
                {row.label || "Text"}
                {touched ? " · styled" : ""}
              </span>
              <span
                style={{
                  display: "block",
                  fontSize: 13,
                  fontWeight: 600,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {row.value || <em style={{ color: "#9ca3af" }}>(empty)</em>}
              </span>
            </button>

            {isOpen && (
              <div style={{ padding: "0 9px 9px", display: "grid", gap: 8 }}>
                <textarea
                  value={row.value || ""}
                  onChange={(e) => set(row.key, { value: e.target.value })}
                  rows={Math.min(6, Math.max(2, Math.ceil((row.value || "").length / 40)))}
                  style={{
                    width: "100%",
                    padding: "6px 8px",
                    border: "1px solid var(--color-sjc-line)",
                    borderRadius: 6,
                    fontSize: 13,
                    fontFamily: "inherit",
                    resize: "vertical",
                  }}
                />
                <SizeStepper
                  label="Size — this line only"
                  value={row.size || 0}
                  onChange={(v) => set(row.key, { size: v as number })}
                  fallback={0}
                  step={2}
                  min={0}
                />
                <GlobalSize textKey={row.key} />
                <ColorField value={row.color} onChange={(v) => set(row.key, { color: v })} />
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {[
                    { label: "As designed", v: null },
                    { label: "Bold", v: true },
                    { label: "Normal", v: false },
                  ].map((o) => (
                    <button
                      key={String(o.v)}
                      type="button"
                      onClick={() => set(row.key, { bold: o.v as boolean | null })}
                      style={{
                        // `1 1 auto` + minWidth 0 lets a button wrap to the next line instead of
                        // widening the panel; nowrap keeps a label from breaking mid-word.
                        flex: "1 1 auto",
                        minWidth: 0,
                        whiteSpace: "nowrap",
                        padding: "4px 6px",
                        fontSize: 12,
                        borderRadius: 6,
                        cursor: "pointer",
                        border: "1px solid var(--color-sjc-line)",
                        background:
                          (row.bold ?? null) === o.v ? "var(--color-sjc-blue)" : "transparent",
                        color: (row.bold ?? null) === o.v ? "#fff" : "inherit",
                      }}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
  };

  if (!rows.length) {
    return <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>No editable words in this section.</p>;
  }

  return (
    <div ref={hostRef}>
      {rows.length > ROW_LIMIT_BEFORE_FILTER && (
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={`Search ${rows.length} lines…`}
          style={{
            width: "100%",
            padding: "6px 8px",
            marginBottom: 8,
            border: "1px solid var(--color-sjc-line)",
            borderRadius: 6,
            fontSize: 13,
          }}
        />
      )}

      {/* Said out loud rather than left for someone to wonder about: a filtered list that looks
          complete is how you conclude a line isn't editable when it is just filtered out. */}
      {needle && (
        <p style={{ fontSize: 12, color: "#6b7280", margin: "0 0 8px" }}>
          {shown.length} of {rows.length} shown
        </p>
      )}

      {/* ⚠️ SEARCH CUTS STRAIGHT THROUGH THE GROUPS. Typing means you already know what you want;
          making you guess which group it is in would be the flat list's problem with extra steps.
          A filtered result is shown flat, exactly as before. */}
      {groupsOn && (
        <div style={{ display: "grid", gap: 4 }}>
          {groups.map((g) => {
            const isOpen = openGroup === g.key;
            const styled = g.rows.filter(
              (r) => !!r.size || !!r.color || r.bold === true || r.bold === false
            ).length;
            return (
              <div
                key={g.key}
                style={{
                  border: "1px solid var(--color-sjc-line)",
                  borderRadius: 6,
                  background: isOpen ? "var(--color-sjc-bg-soft)" : "transparent",
                }}
              >
                <button
                  type="button"
                  onClick={() => setOpenGroup(isOpen ? null : g.key)}
                  style={{
                    display: "block",
                    width: "100%",
                    textAlign: "left",
                    padding: "8px 9px",
                    background: "none",
                    border: 0,
                    cursor: "pointer",
                    font: "inherit",
                  }}
                >
                  <span style={{ display: "block", fontSize: 11, color: "#6b7280" }}>
                    {g.rows.length} line{g.rows.length === 1 ? "" : "s"}
                    {styled ? ` · ${styled} styled` : ""}
                  </span>
                  <span
                    style={{
                      display: "block",
                      fontSize: 13,
                      fontWeight: 700,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {isOpen ? "▾ " : "▸ "}
                    {g.name}
                  </span>
                </button>
                {isOpen && (
                  <div style={{ display: "grid", gap: 4, padding: "0 6px 6px" }}>
                    {g.rows.map(renderRow)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div style={{ display: groupsOn ? "none" : "grid", gap: 4 }}>
        {shown.map(renderRow)}
      </div>
    </div>
  );
}
