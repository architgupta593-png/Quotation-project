"use client";

import { useState } from "react";
import {
  List, ListOrdered, AlignLeft, Plus, Trash2, ChevronUp, ChevronDown, FileText, Clipboard, X, Check,
} from "lucide-react";

const FORMAT_OPTIONS = [
  { value: "bullet", label: "Bullet Points", icon: List },
  { value: "numbered", label: "Numbered List", icon: ListOrdered },
  { value: "paragraph", label: "Paragraph", icon: AlignLeft },
];

/**
 * InstructionPanel — Minimalist Instruction & Terms Panel
 */
export default function InstructionPanel({ value = [], onChange }) {
  const [newItemTexts, setNewItemTexts] = useState({});
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [targetBlockIndex, setTargetBlockIndex] = useState(null);
  const [rawPastedText, setRawPastedText] = useState("");
  const [bulkHeading, setBulkHeading] = useState("Terms & Conditions");
  const [bulkFormat, setBulkFormat] = useState("bullet");

  const instructions = value.length > 0 ? value : [
    {
      heading: "Important Guidelines & Instructions",
      format: "bullet",
      items: [
        "Please carry valid government-issued photo ID cards during travel.",
        "Hotel check-in time is usually 12:00 PM and check-out time is 11:00 AM.",
        "Rates are subject to availability at the time of booking confirmation.",
      ],
      content: "",
    },
  ];

  function updateBlocks(updated) {
    onChange(updated);
  }

  function addBlock(format = "bullet", heading = "") {
    const defaultHeading =
      heading || (format === "paragraph" ? "General Information" : "Travel Instructions");
    const newBlock = {
      heading: defaultHeading,
      format,
      items: format === "paragraph" ? [] : ["Sample instruction item"],
      content: format === "paragraph" ? "Enter your detailed instruction paragraph here." : "",
    };
    updateBlocks([...instructions, newBlock]);
  }

  function updateBlock(index, patch) {
    const updated = instructions.map((blk, i) => (i === index ? { ...blk, ...patch } : blk));
    updateBlocks(updated);
  }

  function removeBlock(index) {
    const updated = instructions.filter((_, i) => i !== index);
    updateBlocks(updated);
  }

  function moveBlock(index, direction) {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= instructions.length) return;
    const updated = [...instructions];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    updateBlocks(updated);
  }

  function cleanLineText(str) {
    return str.replace(/^[\s•\-\*\d+\.\)\>]+/g, "").trim();
  }

  function parseMultilineText(text) {
    if (!text) return [];
    return text
      .split(/\r?\n/)
      .map((line) => cleanLineText(line))
      .filter((line) => line.length > 0);
  }

  function addItem(blockIndex) {
    const text = (newItemTexts[blockIndex] || "").trim();
    if (!text) return;

    const parsedLines = parseMultilineText(text);
    if (parsedLines.length > 1) {
      const block = instructions[blockIndex];
      updateBlock(blockIndex, { items: [...(block.items || []), ...parsedLines] });
    } else {
      const block = instructions[blockIndex];
      const singleText = cleanLineText(text) || text;
      updateBlock(blockIndex, { items: [...(block.items || []), singleText] });
    }

    setNewItemTexts((prev) => ({ ...prev, [blockIndex]: "" }));
  }

  function handlePasteInput(e, blockIndex) {
    const pasted = e.clipboardData.getData("text");
    if (pasted && (pasted.includes("\n") || pasted.includes("\r"))) {
      e.preventDefault();
      const parsedLines = parseMultilineText(pasted);
      if (parsedLines.length > 0) {
        const block = instructions[blockIndex];
        updateBlock(blockIndex, { items: [...(block.items || []), ...parsedLines] });
        setNewItemTexts((prev) => ({ ...prev, [blockIndex]: "" }));
      }
    }
  }

  function updateItem(blockIndex, itemIndex, newText) {
    const block = instructions[blockIndex];
    const updatedItems = block.items.map((item, i) => (i === itemIndex ? newText : item));
    updateBlock(blockIndex, { items: updatedItems });
  }

  function removeItem(blockIndex, itemIndex) {
    const block = instructions[blockIndex];
    const updatedItems = block.items.filter((_, i) => i !== itemIndex);
    updateBlock(blockIndex, { items: updatedItems });
  }

  function openBulkModal(blockIdx = null) {
    setTargetBlockIndex(blockIdx);
    setRawPastedText("");
    if (blockIdx !== null && instructions[blockIdx]) {
      setBulkHeading(instructions[blockIdx].heading || "Instructions");
      setBulkFormat(instructions[blockIdx].format || "bullet");
    } else {
      setBulkHeading("Pasted Instructions");
      setBulkFormat("bullet");
    }
    setBulkModalOpen(true);
  }

  function executeBulkImport() {
    if (!rawPastedText.trim()) return;

    if (bulkFormat === "paragraph") {
      if (targetBlockIndex !== null && instructions[targetBlockIndex]) {
        updateBlock(targetBlockIndex, {
          heading: bulkHeading,
          format: "paragraph",
          content: rawPastedText.trim(),
        });
      } else {
        updateBlocks([
          ...instructions,
          {
            heading: bulkHeading,
            format: "paragraph",
            content: rawPastedText.trim(),
            items: [],
          },
        ]);
      }
    } else {
      const parsedItems = parseMultilineText(rawPastedText);
      if (targetBlockIndex !== null && instructions[targetBlockIndex]) {
        updateBlock(targetBlockIndex, {
          heading: bulkHeading,
          format: bulkFormat,
          items: [...(instructions[targetBlockIndex].items || []), ...parsedItems],
        });
      } else {
        updateBlocks([
          ...instructions,
          {
            heading: bulkHeading,
            format: bulkFormat,
            items: parsedItems,
            content: "",
          },
        ]);
      }
    }

    setBulkModalOpen(false);
    setRawPastedText("");
  }

  const inputCls =
    "w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-[13px] text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5 transition-all outline-none";

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center text-white flex-shrink-0">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-[14px] font-bold text-slate-900">Custom Package Instructions</h3>
            <p className="text-[12px] text-slate-500">
              Add rules or paste multi-line instructions directly into any input field.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <button
            type="button"
            onClick={() => openBulkModal(null)}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-[12px] font-medium text-slate-800 bg-slate-100 hover:bg-slate-200/70 border border-slate-200/80 transition-colors"
          >
            <Clipboard className="w-3.5 h-3.5" /> Quick Bulk Paste
          </button>
          <button
            type="button"
            onClick={() => addBlock("bullet")}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-[12px] font-semibold text-white bg-slate-900 hover:bg-slate-800 transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" /> Add Section
          </button>
        </div>
      </div>

      {/* Instruction Blocks */}
      <div className="space-y-5">
        {instructions.map((block, blkIdx) => {
          return (
            <div
              key={blkIdx}
              className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-4"
            >
              {/* Header Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 flex-1">
                  <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-bold flex items-center justify-center">
                    #{blkIdx + 1}
                  </span>
                  <input
                    type="text"
                    value={block.heading}
                    onChange={(e) => updateBlock(blkIdx, { heading: e.target.value })}
                    placeholder="Section Title (e.g. Terms & Conditions)"
                    className="flex-1 text-[14px] font-bold text-slate-900 placeholder:text-slate-300 bg-transparent border-b border-transparent focus:border-slate-900 focus:outline-none px-1 py-0.5 transition-all"
                  />
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={() => openBulkModal(blkIdx)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium text-slate-700 bg-slate-100 hover:bg-slate-200/70 transition-colors"
                  >
                    <Clipboard className="w-3 h-3" /> Paste
                  </button>

                  {/* Format Selector Pills */}
                  <div className="flex items-center bg-slate-100 p-0.5 rounded-xl gap-0.5">
                    {FORMAT_OPTIONS.map((opt) => {
                      const Icon = opt.icon;
                      const isSelected = block.format === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => updateBlock(blkIdx, { format: opt.value })}
                          title={opt.label}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                            isSelected
                              ? "bg-slate-900 text-white font-semibold shadow-xs"
                              : "text-slate-500 hover:text-slate-900"
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                        </button>
                      );
                    })}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 pl-1">
                    <button
                      type="button"
                      disabled={blkIdx === 0}
                      onClick={() => moveBlock(blkIdx, -1)}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-800 disabled:opacity-30"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={blkIdx === instructions.length - 1}
                      onClick={() => moveBlock(blkIdx, 1)}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-800 disabled:opacity-30"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeBlock(blkIdx)}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-600 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Block Content */}
              {block.format === "paragraph" ? (
                <div>
                  <textarea
                    rows={3}
                    value={block.content || ""}
                    onChange={(e) => updateBlock(blkIdx, { content: e.target.value })}
                    placeholder="Type or paste paragraph text..."
                    className={inputCls}
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-2">
                    {(block.items || []).map((item, itemIdx) => (
                      <div key={itemIdx} className="flex items-center gap-2 group">
                        <span className="text-[12px] font-bold text-slate-400 w-5 text-center flex-shrink-0">
                          {block.format === "bullet" ? "•" : `${itemIdx + 1}.`}
                        </span>
                        <input
                          type="text"
                          value={item}
                          onChange={(e) => updateItem(blkIdx, itemIdx, e.target.value)}
                          placeholder="Instruction point..."
                          className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 text-[13px] text-slate-900 bg-white focus:outline-none focus:border-slate-900 transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => removeItem(blkIdx, itemIdx)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newItemTexts[blkIdx] || ""}
                      onChange={(e) =>
                        setNewItemTexts((prev) => ({ ...prev, [blkIdx]: e.target.value }))
                      }
                      onPaste={(e) => handlePasteInput(e, blkIdx)}
                      onKeyDown={(e) =>
                        e.key === "Enter" && (e.preventDefault(), addItem(blkIdx))
                      }
                      placeholder={`Paste or type ${block.format === "bullet" ? "bullet point" : "numbered point"}...`}
                      className={inputCls}
                    />
                    <button
                      type="button"
                      onClick={() => addItem(blkIdx)}
                      className="px-4 py-2.5 rounded-xl bg-slate-900 text-white text-[12px] font-medium hover:bg-slate-800 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bulk Paste Modal */}
      {bulkModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Clipboard className="w-4 h-4 text-slate-900" />
                <h3 className="text-[15px] font-bold text-slate-900">
                  {targetBlockIndex !== null ? "Paste into Section" : "Bulk Paste Instructions"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setBulkModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[12px] font-medium text-slate-600 mb-1">
                  Section Title
                </label>
                <input
                  type="text"
                  value={bulkHeading}
                  onChange={(e) => setBulkHeading(e.target.value)}
                  className={inputCls}
                />
              </div>

              <div>
                <label className="block text-[12px] font-medium text-slate-600 mb-1">
                  Format As
                </label>
                <div className="flex gap-2">
                  {FORMAT_OPTIONS.map((opt) => {
                    const isSelected = bulkFormat === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setBulkFormat(opt.value)}
                        className={`flex-1 py-2 rounded-xl text-[12px] font-medium border flex items-center justify-center gap-1.5 transition-all ${
                          isSelected
                            ? "bg-slate-900 border-slate-900 text-white font-semibold shadow-xs"
                            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-medium text-slate-600 mb-1">
                  Paste Raw Text
                </label>
                <textarea
                  rows={5}
                  value={rawPastedText}
                  onChange={(e) => setRawPastedText(e.target.value)}
                  placeholder="Paste multi-line text here..."
                  className={`${inputCls} font-mono text-[12px] resize-y`}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setBulkModalOpen(false)}
                className="px-4 py-2 rounded-xl text-[12px] font-medium text-slate-600 border border-slate-200 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeBulkImport}
                disabled={!rawPastedText.trim()}
                className="px-4 py-2 rounded-xl text-[12px] font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-40"
              >
                Import
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
