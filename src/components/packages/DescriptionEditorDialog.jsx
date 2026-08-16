"use client";

import { useEffect, useCallback, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold, Italic, Underline as UnderlineIcon, List, ListOrdered,
  X, Check, Type, AlignLeft, Indent, Outdent, ChevronRight,
  Sparkles, HelpCircle,
} from "lucide-react";

/* ── Toolbar button ──────────────────────────────────────────────────────── */
function ToolBtn({ onClick, active, disabled, title, children }) {
  return (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault();
        if (!disabled && onClick) onClick();
      }}
      disabled={disabled}
      title={title}
      className={`p-1.5 px-2 rounded-lg border text-[12px] transition-all flex items-center justify-center gap-1 font-semibold ${
        disabled
          ? "opacity-35 cursor-not-allowed border-slate-200 text-slate-400 bg-slate-50"
          : active
          ? "bg-indigo-600 border-indigo-600 text-white shadow-xs"
          : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300"
      }`}
    >
      {children}
    </button>
  );
}

/* ── Rich-text editor dialog with Nested Sub-Bullets & Roman/Alpha Lists ── */
export default function DescriptionEditorDialog({
  isOpen,
  dayLabel,      // e.g. "Day 3"
  value = "",    // current HTML string stored in form
  onSave,        // fn(htmlString)
  onClose,
}) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: false,
        codeBlock: false,
        code: false,
        horizontalRule: false,
        blockquote: false,
        bulletList: {
          keepMarks: true,
          keepAttributes: true,
          HTMLAttributes: {
            class: "itinerary-bullet-list",
          },
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: true,
          HTMLAttributes: {
            class: "itinerary-ordered-list",
          },
        },
      }),
      Placeholder.configure({
        placeholder:
          "Describe the day's plan… Paste paragraphs, bullet points (•), numerical points (1, 2, 3), roman numerals (i, ii, iii), or sub-points. Use Tab/Indent to create sub-bullets!",
      }),
    ],
    content: value || "",
    editorProps: {
      attributes: {
        class:
          "itinerary-rich-content min-h-[260px] px-5 py-4 focus:outline-none text-[13.5px] leading-relaxed text-slate-800",
      },
    },
  });

  // Sync content when dialog opens
  useEffect(() => {
    if (editor && isOpen) {
      const current = editor.getHTML();
      const incoming = value || "";
      if (current !== incoming) {
        editor.commands.setContent(incoming, false);
      }
      setTimeout(() => editor.commands.focus("end"), 60);
    }
  }, [isOpen, value, editor]);

  // Save & close
  const handleSave = useCallback(() => {
    if (!editor) return;
    const html = editor.getText().trim() ? editor.getHTML() : "";
    onSave(html);
    onClose();
  }, [editor, onSave, onClose]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/65 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">

        {/* ── Header ── */}
        <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-700 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-200">
              Itinerary Description Editor
            </p>
            <h3 className="text-[17px] font-black text-white leading-tight">
              {dayLabel} — Day Description &amp; Points
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Formatting Toolbar ── */}
        <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50 flex items-center gap-1.5 flex-wrap flex-shrink-0">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1 flex items-center gap-1">
            <Type className="w-3 h-3" /> Text
          </span>

          <ToolBtn
            onClick={() => editor?.chain().focus().toggleBold().run()}
            active={editor?.isActive("bold")}
            title="Bold (Ctrl+B)"
          >
            <Bold className="w-3.5 h-3.5" />
          </ToolBtn>
          <ToolBtn
            onClick={() => editor?.chain().focus().toggleItalic().run()}
            active={editor?.isActive("italic")}
            title="Italic (Ctrl+I)"
          >
            <Italic className="w-3.5 h-3.5" />
          </ToolBtn>
          <ToolBtn
            onClick={() => editor?.chain().focus().toggleUnderline().run()}
            active={editor?.isActive("underline")}
            title="Underline (Ctrl+U)"
          >
            <UnderlineIcon className="w-3.5 h-3.5" />
          </ToolBtn>

          <div className="w-px h-5 bg-slate-200 mx-1" />

          {/* List Styles */}
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1 flex items-center gap-1">
            <List className="w-3 h-3" /> Lists &amp; Points
          </span>

          {/* Bullet List */}
          <ToolBtn
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
            active={editor?.isActive("bulletList")}
            title="Bullet Points (•)"
          >
            <List className="w-3.5 h-3.5 text-indigo-600" />
            <span className="text-[11.5px]">Bullet (•)</span>
          </ToolBtn>

          {/* Numbered List (1, 2, 3) */}
          <ToolBtn
            onClick={() => editor?.chain().focus().toggleOrderedList().run()}
            active={editor?.isActive("orderedList")}
            title="Numbered List (1, 2, 3)"
          >
            <ListOrdered className="w-3.5 h-3.5 text-indigo-600" />
            <span className="text-[11.5px]">Numbered (1, 2, 3)</span>
          </ToolBtn>

          <div className="w-px h-5 bg-slate-200 mx-1" />

          {/* Sub-Point / Indentation controls */}
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1 flex items-center gap-1">
            Sub-Points
          </span>

          <ToolBtn
            onClick={() => editor?.chain().focus().sinkListItem("listItem").run()}
            disabled={!editor?.can().sinkListItem("listItem")}
            title="Make Sub-Point / Indent (Tab)"
          >
            <Indent className="w-3.5 h-3.5 text-purple-600" />
            <span className="text-[11.5px]">Indent / Sub-Point</span>
          </ToolBtn>

          <ToolBtn
            onClick={() => editor?.chain().focus().liftListItem("listItem").run()}
            disabled={!editor?.can().liftListItem("listItem")}
            title="Outdent / Main Point (Shift+Tab)"
          >
            <Outdent className="w-3.5 h-3.5 text-purple-600" />
            <span className="text-[11.5px]">Outdent</span>
          </ToolBtn>

          <div className="w-px h-5 bg-slate-200 mx-1" />

          <ToolBtn
            onClick={() => editor?.chain().focus().setParagraph().run()}
            active={editor?.isActive("paragraph") && !editor?.isActive("bulletList") && !editor?.isActive("orderedList")}
            title="Normal paragraph"
          >
            <AlignLeft className="w-3.5 h-3.5" />
            <span className="text-[11.5px]">Paragraph</span>
          </ToolBtn>
        </div>

        {/* ── Editor body ── */}
        <div className="flex-1 overflow-y-auto bg-white flex flex-col">
          {/* Paste & Nested Points Hint Banner */}
          <div className="px-5 pt-3 pb-1 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-slate-50/50">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
              <Check className="w-3.5 h-3.5" />
              Direct Paste Supported: Paste bullet points (•, -, *), numbered points (1., 2.), Roman numerals (i., ii.), or sub-bullets
            </span>
            <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              Press <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-300 text-[10px] font-mono font-bold">Tab</kbd> for sub-point, <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-300 text-[10px] font-mono font-bold">Shift+Tab</kbd> to un-indent
            </span>
          </div>

          <div className="flex-1 p-2">
            <EditorContent editor={editor} />
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 font-bold text-[13px] hover:bg-slate-100 transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-2 px-7 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-extrabold text-[13px] hover:from-indigo-700 hover:to-violet-700 transition-all shadow-md shadow-indigo-500/20"
          >
            <Check className="w-4 h-4" />
            Save Description &amp; Points
          </button>
        </div>
      </div>

      {/* ── Embedded CSS for Nested Lists, Sub-bullets, Roman Numerals & Paragraphs ── */}
      <style>{`
        /* Container styles */
        .itinerary-rich-content { outline: none; }
        .itinerary-rich-content p { margin: 0 0 0.5em; }

        /* Level 1 Bullet list (Disc) */
        .itinerary-rich-content ul,
        .itinerary-bullet-list {
          list-style-type: disc !important;
          padding-left: 1.6em !important;
          margin: 0.5em 0 !important;
        }

        /* Level 2 Nested Sub-Bullet list (Circle) */
        .itinerary-rich-content ul ul,
        .itinerary-bullet-list ul {
          list-style-type: circle !important;
          padding-left: 1.5em !important;
          margin: 0.25em 0 !important;
        }

        /* Level 3 Nested Sub-Bullet list (Square) */
        .itinerary-rich-content ul ul ul,
        .itinerary-bullet-list ul ul {
          list-style-type: square !important;
          padding-left: 1.5em !important;
          margin: 0.25em 0 !important;
        }

        /* Level 1 Ordered list (Decimal: 1, 2, 3) */
        .itinerary-rich-content ol,
        .itinerary-ordered-list {
          list-style-type: decimal !important;
          padding-left: 1.6em !important;
          margin: 0.5em 0 !important;
        }

        /* Level 2 Nested Ordered list (Alphabetical: a, b, c) */
        .itinerary-rich-content ol ol,
        .itinerary-ordered-list ol {
          list-style-type: lower-alpha !important;
          padding-left: 1.5em !important;
          margin: 0.25em 0 !important;
        }

        /* Level 3 Nested Ordered list (Roman Numerals: i, ii, iii) */
        .itinerary-rich-content ol ol ol,
        .itinerary-ordered-list ol ol {
          list-style-type: lower-roman !important;
          padding-left: 1.5em !important;
          margin: 0.25em 0 !important;
        }

        /* Support mixed nesting (e.g. ol inside ul, or ul inside ol) */
        .itinerary-rich-content ul ol {
          list-style-type: lower-alpha !important;
          padding-left: 1.5em !important;
          margin: 0.25em 0 !important;
        }
        .itinerary-rich-content ol ul {
          list-style-type: circle !important;
          padding-left: 1.5em !important;
          margin: 0.25em 0 !important;
        }

        /* List item spacing */
        .itinerary-rich-content li {
          margin: 0.2em 0 !important;
          line-height: 1.6 !important;
        }
        .itinerary-rich-content li > p {
          margin: 0 !important;
          display: inline !important;
        }

        /* Formatting */
        .itinerary-rich-content strong { font-weight: 700 !important; color: #0f172a; }
        .itinerary-rich-content em { font-style: italic !important; }
        .itinerary-rich-content u { text-decoration: underline !important; }

        /* Empty placeholder */
        .itinerary-rich-content p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #94a3b8;
          pointer-events: none;
          height: 0;
          font-style: italic;
        }
      `}</style>
    </div>
  );
}
