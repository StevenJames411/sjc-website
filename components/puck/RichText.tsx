"use client";
import { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TextStyle, Color } from "@tiptap/extension-text-style";

// A real in-block word processor for the Puck "Text box" block. This is what lets Steven
// select ONE word and bold/italic/underline/color/link it — without splitting the paragraph
// into separate blocks (the limitation he hit on other builders). StarterKit already brings
// Bold/Italic/Underline/Link; TextStyle + Color add per-word color. The editor emits HTML,
// which the block renders verbatim, so the public page shows exactly what he formatted.
const COLORS = ["#111827", "#2563eb", "#22c55e", "#dc2626", "#ffffff"];

export default function RichText({
  value,
  onChange,
}: {
  value?: string;
  onChange: (v: string) => void;
}) {
  const editor = useEditor({
    immediatelyRender: false, // avoid Next SSR hydration mismatch
    extensions: [StarterKit, TextStyle, Color],
    content: value || "",
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: { attributes: { class: "rt rt-input" } },
  });

  // If Puck hands us a different value (e.g. switching to another Text block), reseed —
  // but never mid-type (guard on getHTML) so the cursor never jumps.
  useEffect(() => {
    if (editor && value !== undefined && value !== editor.getHTML()) {
      editor.commands.setContent(value || "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, editor]);

  if (!editor) return null;

  const link = () => {
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Link URL (https://…)", prev || "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().setLink({ href: url }).run();
  };

  const tBtn = (active: boolean): React.CSSProperties => ({
    border: "1px solid #d1d5db",
    background: active ? "#111827" : "#fff",
    color: active ? "#fff" : "#111827",
    borderRadius: 5,
    padding: "4px 9px",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    lineHeight: 1,
  });

  return (
    <div>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 4,
          marginBottom: 6,
          alignItems: "center",
        }}
      >
        <button type="button" style={tBtn(editor.isActive("bold"))} onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().toggleBold().run()}>
          B
        </button>
        <button type="button" style={{ ...tBtn(editor.isActive("italic")), fontStyle: "italic" }} onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().toggleItalic().run()}>
          I
        </button>
        <button type="button" style={{ ...tBtn(editor.isActive("underline")), textDecoration: "underline" }} onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().toggleUnderline().run()}>
          U
        </button>
        <button type="button" style={tBtn(editor.isActive("link"))} onMouseDown={(e) => e.preventDefault()} onClick={link}>
          Link
        </button>
        {COLORS.map((c) => (
          <button
            key={c}
            type="button"
            aria-label={`Color ${c}`}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().setColor(c).run()}
            style={{
              width: 20,
              height: 20,
              borderRadius: 4,
              border: "1px solid #d1d5db",
              background: c,
              cursor: "pointer",
              padding: 0,
            }}
          />
        ))}
        <button type="button" style={tBtn(false)} onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().unsetColor().unsetAllMarks().run()}>
          Clear
        </button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
