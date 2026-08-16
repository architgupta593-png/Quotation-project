"use client";

import { useEffect, useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import {
  Bold, Italic, Underline as UnderlineIcon, List, ListOrdered,
  X, Check, Type, AlignLeft,
} from "lucide-react";

/* ── Toolbar button ──────────────────────────────────────────────────────── */
function ToolBtn({ onClick, active, title, children }) {
  return (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      title={title}
      className={`p-1.5 rounded-lg border text-[12px] transition-all flex items-center justify-center ${
        active
          ? "bg-indigo-600 border-indigo-600 text-white shadow-xs"
          : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300"
      }`}
    >
      {children}
    </button>
  );
}

/* ── Rich-text editor dialog ─────────────────────────────────────────────── */
export default function DescriptionEditorDialog({
  isOpen,
  dayLabel,      // e.g. "Day 3"
  value = "",    // current HTML string stored in form
  onSave,        // fn(htmlString)
  onClose,
}) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        codeBlock: false,
        code: false,
        horizontalRule: false,
        blockquote: false,
      }),
      Underline,
      Placeholder.configure({
        placeholder:
          "Describe the day's plan… Paste from Word, Google Docs, WhatsApp — bullet points & bold text preserved automatically.",
      }),
    ],
    content: value || "",
    editorProps: {
      attributes: {
        class:
          "prose prose-sm prose-slate max-w-none min-h-[220px] px-4 py-3.5 focus:outline-none text-[13.5px] leading-relaxed",
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
    const handler = (e) => { if (e.key === "Escape") onClose(); };
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
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">

        {/* ── Header ── */}
        <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-700 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-200">
              Description Editor
            </p>
            <h3 className="text-[17px] font-black text-white leading-tight">
              {dayLabel} — Day Description
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
            <Type className="w-3 h-3" /> Format
          </span>

          <div className="w-px h-4 bg-slate-200 mx-0.5" />

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

          <div className="w-px h-4 bg-slate-200 mx-0.5" />

          <ToolBtn
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
            active={editor?.isActive("bulletList")}
            title="Bullet list"
          >
            <List className="w-3.5 h-3.5" />
          </ToolBtn>
          <ToolBtn
            onClick={() => editor?.chain().focus().toggleOrderedList().run()}
            active={editor?.isActive("orderedList")}
            title="Numbered list"
          >
            <ListOrdered className="w-3.5 h-3.5" />
          </ToolBtn>

          <div className="w-px h-4 bg-slate-200 mx-0.5" />

          <ToolBtn
            onClick={() => editor?.chain().focus().setParagraph().run()}
            active={editor?.isActive("paragraph")}
            title="Normal paragraph"
          >
            <AlignLeft className="w-3.5 h-3.5" />
          </ToolBtn>
        </div>

        {/* ── Editor body ── */}
        <div className="flex-1 overflow-y-auto bg-white">
          {/* Paste hint */}
          <div className="flex items-center gap-2 px-4 pt-3 pb-0">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
              <Check className="w-3 h-3" />
              Paste from Word, Google Docs, WhatsApp — formatting preserved automatically
            </span>
          </div>

          <EditorContent editor={editor} />
        </div>

        {/* ── Footer ── */}
        <div className="px-5 py-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 font-bold text-[13px] hover:bg-slate-100 transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-extrabold text-[13px] hover:from-indigo-700 hover:to-violet-700 transition-all shadow-md shadow-indigo-500/20"
          >
            <Check className="w-4 h-4" />
            Save Description
          </button>
        </div>
      </div>

      {/* Tiptap prose styles */}
      <style>{`
        .tiptap.ProseMirror { outline: none; }
        .tiptap.ProseMirror p { margin: 0 0 0.5em; }
        .tiptap.ProseMirror ul { list-style: disc; padding-left: 1.4em; margin: 0.4em 0; }
        .tiptap.ProseMirror ol { list-style: decimal; padding-left: 1.4em; margin: 0.4em 0; }
        .tiptap.ProseMirror li { margin: 0.15em 0; }
        .tiptap.ProseMirror strong { font-weight: 700; }
        .tiptap.ProseMirror em { font-style: italic; }
        .tiptap.ProseMirror u { text-decoration: underline; }
        .tiptap.ProseMirror p.is-editor-empty:first-child::before {
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
