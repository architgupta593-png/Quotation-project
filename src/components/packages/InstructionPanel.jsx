"use client";

import { useState } from "react";
import {
  List, ListOrdered, AlignLeft, Plus, Trash2, ChevronUp, ChevronDown, FileText, Clipboard,
  X, Check, Sparkles, Layers, ArrowRight, CornerDownRight, Copy, Wand2, Type
} from "lucide-react";

const FORMAT_OPTIONS = [
  { value: "bullet", label: "Bullet Points", icon: List },
  { value: "numbered", label: "Numbered (1. 2.)", icon: ListOrdered },
  { value: "alphabetic", label: "Alphabetic (a. b.)", icon: Type },
  { value: "paragraph", label: "Paragraph / Mixed", icon: AlignLeft },
];

const PRESET_TEMPLATES = [
  {
    title: "Standard Guidelines & Advisory",
    format: "bullet",
    items: [
      "Please carry valid government-issued photo ID cards (Aadhaar/Passport/Voter ID) during travel.",
      "Hotel check-in time is standard 12:00 PM and check-out time is 11:00 AM.",
      "Rates are subject to availability at the time of final booking confirmation.",
      "Personal expenses such as laundry, room service, and telephone calls are not included.",
    ],
  },
  {
    title: "Booking & Payment Terms",
    format: "alphabetic",
    items: [
      "50% advance deposit is required to confirm the package booking.",
      "Balance 50% payment must be cleared 7 days prior to travel departure date.",
      "In case of non-payment by due date, bookings are subject to automatic cancellation.",
    ],
  },
  {
    title: "Cancellation Policy",
    format: "numbered",
    items: [
      "Cancellation 30 days prior to departure: 100% refund of advance deposit.",
      "Cancellation 15–29 days prior: 50% cancellation fee applicable.",
      "Cancellation within 14 days of departure: 100% cancellation charge (non-refundable).",
    ],
  },
  {
    title: "Transport & Driver Rules",
    format: "bullet",
    items: [
      "Vehicle usage is provided as per the fixed itinerary itinerary plan.",
      "Driver duty hours are limited to 8:00 AM – 8:00 PM as per transport guidelines.",
      "   a. Night driving allowance applies for travel beyond 8:00 PM.",
      "   b. AC will be switched off in hill stations and parked conditions.",
    ],
  },
];

/**
 * InstructionPanel — Redesigned High-Performance Instruction & Terms Panel
 * Supports exact copy-pasting of paragraphs, bullet points, numbers, alpha points (a, b), and nested sub-points.
 */
export default function InstructionPanel({ instructions: propInstructions, value = [], onChange }) {
  const [newItemTexts, setNewItemTexts] = useState({});
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [openFormatPopoverIdx, setOpenFormatPopoverIdx] = useState(null);
  const [targetBlockIndex, setTargetBlockIndex] = useState(null);
  const [rawPastedText, setRawPastedText] = useState("");
  const [bulkHeading, setBulkHeading] = useState("Terms & Conditions");
  const [bulkFormat, setBulkFormat] = useState("paragraph");
  const [splitSections, setSplitSections] = useState(true);

  const inputList = (propInstructions && propInstructions.length > 0) ? propInstructions : value;
  const instructions = inputList.length > 0 ? inputList : [
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
      title: defaultHeading,
      format,
      items: format === "paragraph" ? [] : ["Sample instruction item"],
      content: format === "paragraph" ? "Enter your detailed instruction paragraph here." : "",
    };
    updateBlocks([...instructions, newBlock]);
  }

  function updateBlock(index, patch) {
    const updated = instructions.map((blk, i) => {
      if (i !== index) return blk;
      const merged = { ...blk, ...patch };
      if (patch.heading !== undefined || patch.title !== undefined) {
        const text = patch.heading !== undefined ? patch.heading : patch.title;
        merged.heading = text;
        merged.title = text;
      }
      return merged;
    });
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
    return str.replace(/^[\s•\-\*\>]+/g, "").trim();
  }

  function parseMultilineText(text, preservePrefixes = true) {
    if (!text) return [];
    return text
      .split(/\r?\n/)
      .filter((line) => line.trim().length > 0)
      .map((line) => {
        if (preservePrefixes) {
          return line.trimEnd();
        }
        return cleanLineText(line);
      });
  }

  function addItem(blockIndex) {
    const text = (newItemTexts[blockIndex] || "").trim();
    if (!text) return;

    const block = instructions[blockIndex];
    const parsedLines = parseMultilineText(text, true);

    if (block.format === "paragraph") {
      const existing = block.content ? `${block.content}\n${text}` : text;
      updateBlock(blockIndex, { content: existing });
    } else if (parsedLines.length > 1) {
      updateBlock(blockIndex, { items: [...(block.items || []), ...parsedLines] });
    } else {
      updateBlock(blockIndex, { items: [...(block.items || []), text] });
    }

    setNewItemTexts((prev) => ({ ...prev, [blockIndex]: "" }));
  }

  function handlePasteInput(e, blockIndex) {
    const pasted = e.clipboardData.getData("text");
    if (pasted && (pasted.includes("\n") || pasted.includes("\r"))) {
      e.preventDefault();
      const block = instructions[blockIndex];
      const parsedLines = parseMultilineText(pasted, true);

      if (block.format === "paragraph") {
        const existing = block.content ? `${block.content}\n\n${pasted}` : pasted;
        updateBlock(blockIndex, { content: existing });
      } else if (parsedLines.length > 0) {
        updateBlock(blockIndex, { items: [...(block.items || []), ...parsedLines] });
      }
      setNewItemTexts((prev) => ({ ...prev, [blockIndex]: "" }));
    }
  }

  function updateItem(blockIndex, itemIndex, newText) {
    const block = instructions[blockIndex];
    const updatedItems = (block.items || []).map((item, i) => (i === itemIndex ? newText : item));
    updateBlock(blockIndex, { items: updatedItems });
  }

  function removeItem(blockIndex, itemIndex) {
    const block = instructions[blockIndex];
    const updatedItems = (block.items || []).filter((_, i) => i !== itemIndex);
    updateBlock(blockIndex, { items: updatedItems });
  }

  function toggleItemIndent(blockIndex, itemIndex) {
    const block = instructions[blockIndex];
    const item = (block.items || [])[itemIndex];
    if (!item) return;

    let updatedItem = item;
    if (item.startsWith("   ")) {
      updatedItem = item.slice(3); // Outdent
    } else {
      updatedItem = `   ${item}`; // Indent
    }
    updateItem(blockIndex, itemIndex, updatedItem);
  }

  function applyPresetTemplate(tpl) {
    const newBlock = {
      heading: tpl.title,
      format: tpl.format,
      items: tpl.items || [],
      content: tpl.content || "",
    };
    updateBlocks([...instructions, newBlock]);
  }

  function openBulkModal(blockIdx = null) {
    setTargetBlockIndex(blockIdx);
    setRawPastedText("");
    if (blockIdx !== null && instructions[blockIdx]) {
      setBulkHeading(instructions[blockIdx].heading || "Instructions");
      setBulkFormat(instructions[blockIdx].format || "paragraph");
    } else {
      setBulkHeading("Terms & Conditions");
      setBulkFormat("paragraph");
    }
    setBulkModalOpen(true);
  }

  function executeSmartImport() {
    const raw = rawPastedText.trim();
    if (!raw) return;

    // Check if pasted text contains multi-section headings (e.g. "Cancellation Policy:", "General Terms:")
    const sectionMatches = Array.from(raw.matchAll(/(?:^|\n)([A-Z0-9\s&–-]{3,60}:)(?=\n|$)/g));

    if (splitSections && sectionMatches.length > 1) {
      // Split into multiple section blocks automatically
      const newBlocks = [];
      let lastIndex = 0;
      let lastHeading = bulkHeading || "General Instructions";

      sectionMatches.forEach((match, idx) => {
        const textChunk = raw.slice(lastIndex, match.index).trim();
        if (textChunk) {
          newBlocks.push({
            heading: lastHeading,
            format: bulkFormat,
            content: bulkFormat === "paragraph" ? textChunk : "",
            items: bulkFormat !== "paragraph" ? parseMultilineText(textChunk, true) : [],
          });
        }
        lastHeading = match[1].replace(":", "").trim();
        lastIndex = match.index + match[0].length;
      });

      const remainingText = raw.slice(lastIndex).trim();
      if (remainingText) {
        newBlocks.push({
          heading: lastHeading,
          format: bulkFormat,
          content: bulkFormat === "paragraph" ? remainingText : "",
          items: bulkFormat !== "paragraph" ? parseMultilineText(remainingText, true) : [],
        });
      }

      updateBlocks([...instructions, ...newBlocks]);
    } else {
      // Single block import
      if (bulkFormat === "paragraph") {
        if (targetBlockIndex !== null && instructions[targetBlockIndex]) {
          const existing = instructions[targetBlockIndex].content;
          updateBlock(targetBlockIndex, {
            heading: bulkHeading,
            format: "paragraph",
            content: existing ? `${existing}\n\n${raw}` : raw,
          });
        } else {
          updateBlocks([
            ...instructions,
            {
              heading: bulkHeading,
              format: "paragraph",
              content: raw,
              items: [],
            },
          ]);
        }
      } else {
        const parsedItems = parseMultilineText(raw, true);
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
    }

    setBulkModalOpen(false);
    setRawPastedText("");
  }

  const inputCls =
    "w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white text-[13.5px] font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all shadow-xs";

  return (
    <div className="space-y-6">
      {/* Executive Header Banner */}
      <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-violet-700 flex items-center justify-center text-white shadow-xs">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-[16px] font-extrabold text-slate-900">
                Package Instructions & Policy Builder
              </h3>
              <p className="text-[12.5px] text-slate-500 font-medium mt-0.5">
                Paste multi-line text, paragraphs, numbered list (1. 2.), alpha points (a. b.), or sub-bullets directly!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-stretch sm:self-auto">
            <button
              type="button"
              onClick={() => openBulkModal(null)}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl text-[12.5px] font-black text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 transition-all shadow-xs"
            >
              <Clipboard className="w-4 h-4" /> Smart Import / Paste Text
            </button>
            <button
              type="button"
              onClick={() => addBlock("paragraph")}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl text-[12.5px] font-black text-white bg-slate-900 hover:bg-slate-800 transition-all shadow-xs"
            >
              <Plus className="w-4 h-4" /> Add Custom Section
            </button>
          </div>
        </div>

        {/* Preset Template Library Chips */}
        <div>
          <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2.5 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Quick Insert Ready Templates:
          </p>
          <div className="flex flex-wrap gap-2">
            {PRESET_TEMPLATES.map((tpl, i) => (
              <button
                key={i}
                type="button"
                onClick={() => applyPresetTemplate(tpl)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-50 hover:bg-purple-50 border border-slate-200/80 hover:border-purple-200 text-slate-700 hover:text-purple-900 text-[12px] font-extrabold transition-all shadow-xs"
              >
                <Plus className="w-3 h-3 text-purple-600" />
                {tpl.title}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Instruction Section Cards */}
      <div className="space-y-6">
        {instructions.map((block, blkIdx) => {
          return (
            <div
              key={blkIdx}
              className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-5"
            >
              {/* Header Controls Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="w-7 h-7 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-[12px] font-black flex items-center justify-center shadow-xs flex-shrink-0">
                    {blkIdx + 1}
                  </span>
                  <input
                    type="text"
                    value={block.heading || block.title || ""}
                    onChange={(e) => updateBlock(blkIdx, { heading: e.target.value, title: e.target.value })}
                    placeholder="Section Title (e.g. Important Advisory & Guidelines)"
                    className="flex-1 text-[15px] font-extrabold text-slate-900 placeholder:text-slate-300 bg-transparent border-b border-transparent focus:border-purple-600 focus:outline-none px-1 py-1 transition-all"
                  />
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => openBulkModal(blkIdx)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-[11.5px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                  >
                    <Clipboard className="w-3.5 h-3.5 text-purple-600" /> Paste Raw
                  </button>

                  {/* Format Selector Popover Component */}
                  {(() => {
                    const currentOpt = FORMAT_OPTIONS.find((o) => o.value === block.format) || FORMAT_OPTIONS[0];
                    const CurrentIcon = currentOpt.icon;
                    const isOpen = openFormatPopoverIdx === blkIdx;

                    return (
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setOpenFormatPopoverIdx(isOpen ? null : blkIdx)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-[12px] font-extrabold hover:bg-slate-50 transition-all shadow-2xs"
                        >
                          <CurrentIcon className="w-3.5 h-3.5 text-purple-600" />
                          <span>{currentOpt.label}</span>
                          <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                        </button>

                        {/* Floating Popover Menu */}
                        {isOpen && (
                          <>
                            <div
                              className="fixed inset-0 z-40"
                              onClick={() => setOpenFormatPopoverIdx(null)}
                            />

                            <div className="absolute right-0 top-full mt-1.5 z-50 w-56 bg-white rounded-2xl border border-slate-200 shadow-xl p-1.5 space-y-0.5 animate-in fade-in zoom-in-95 duration-100">
                              <div className="px-3 py-1.5 border-b border-slate-100 mb-1">
                                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                                  Format Style
                                </p>
                              </div>

                              {FORMAT_OPTIONS.map((opt) => {
                                const Icon = opt.icon;
                                const isSelected = block.format === opt.value;
                                return (
                                  <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => {
                                      updateBlock(blkIdx, { format: opt.value });
                                      setOpenFormatPopoverIdx(null);
                                    }}
                                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-[12px] font-bold text-left transition-all ${
                                      isSelected
                                        ? "bg-purple-50 text-purple-900 border border-purple-200/80 font-black shadow-2xs"
                                        : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                                    }`}
                                  >
                                    <div className="flex items-center gap-2.5">
                                      <Icon className={`w-4 h-4 ${isSelected ? "text-purple-600" : "text-slate-400"}`} />
                                      <span>{opt.label}</span>
                                    </div>
                                    {isSelected && <Check className="w-3.5 h-3.5 text-purple-600 stroke-[3]" />}
                                  </button>
                                );
                              })}
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })()}

                  {/* Reorder & Action controls */}
                  <div className="flex items-center gap-1 pl-1 border-l border-slate-200">
                    <button
                      type="button"
                      disabled={blkIdx === 0}
                      onClick={() => moveBlock(blkIdx, -1)}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-slate-800 disabled:opacity-30 transition-colors"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      disabled={blkIdx === instructions.length - 1}
                      onClick={() => moveBlock(blkIdx, 1)}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-slate-800 disabled:opacity-30 transition-colors"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeBlock(blkIdx)}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Block Content Body */}
              {block.format === "paragraph" ? (
                <div className="space-y-2">
                  <textarea
                    rows={6}
                    value={block.content || ""}
                    onChange={(e) => updateBlock(blkIdx, { content: e.target.value })}
                    placeholder="Type or paste any text (paragraphs, bullet points, numbers 1. 2., alpha a. b., or sub-points)..."
                    className={`${inputCls} resize-y text-[13.5px] font-mono leading-relaxed bg-slate-50/50`}
                  />
                  <p className="text-[11px] text-slate-400 font-semibold italic flex items-center gap-1.5">
                    💡 Tip: Text in paragraph mode preserves line breaks, indentation, numbers, and alpha sub-points exactly as pasted!
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-2">
                    {(block.items || []).map((item, itemIdx) => {
                      const isIndented = item.startsWith("   ");
                      const charCodeA = 97; // 'a'

                      let bulletPrefix = "•";
                      if (block.format === "numbered") {
                        bulletPrefix = `${itemIdx + 1}.`;
                      } else if (block.format === "alphabetic") {
                        bulletPrefix = `${String.fromCharCode(charCodeA + (itemIdx % 26))}.`;
                      }

                      return (
                        <div key={itemIdx} className="flex items-center gap-2 group">
                          {/* Indent Indicator */}
                          <button
                            type="button"
                            onClick={() => toggleItemIndent(blkIdx, itemIdx)}
                            title={isIndented ? "Outdent Sub-point" : "Indent as Sub-point"}
                            className={`p-1.5 rounded-xl text-[11px] font-bold border transition-all ${
                              isIndented
                                ? "bg-purple-100 border-purple-300 text-purple-800"
                                : "bg-slate-100 border-slate-200 text-slate-400 hover:text-slate-700"
                            }`}
                          >
                            <CornerDownRight className="w-3.5 h-3.5" />
                          </button>

                          <span className={`text-[12.5px] font-extrabold text-slate-500 min-w-[24px] text-right flex-shrink-0 ${isIndented ? "pl-4 text-purple-700" : ""}`}>
                            {isIndented ? "└" : bulletPrefix}
                          </span>

                          <input
                            type="text"
                            value={item}
                            onChange={(e) => updateItem(blkIdx, itemIdx, e.target.value)}
                            placeholder="Instruction or sub-point text..."
                            className={`flex-1 px-4 py-2.5 rounded-2xl border border-slate-200 text-[13.5px] font-bold text-slate-900 bg-white focus:outline-none focus:border-purple-600 transition-all ${
                              isIndented ? "bg-purple-50/40 border-purple-200" : ""
                            }`}
                          />

                          <button
                            type="button"
                            onClick={() => removeItem(blkIdx, itemIdx)}
                            className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex gap-2.5 pt-2">
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
                      placeholder={`Paste or type new line (or multi-line block)...`}
                      className={inputCls}
                    />
                    <button
                      type="button"
                      onClick={() => addItem(blkIdx)}
                      className="px-5 py-3 rounded-2xl bg-slate-900 text-white text-[13px] font-extrabold hover:bg-slate-800 transition-all shadow-xs flex-shrink-0"
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

      {/* Smart Paste & Document Import Modal */}
      {bulkModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl max-w-2xl w-full p-7 space-y-5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-xs">
                  <Clipboard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-[17px] font-extrabold text-slate-900">
                    Smart Paste & Document Import
                  </h3>
                  <p className="text-[12px] text-slate-500 font-medium">
                    Paste paragraphs, bullet points, numbered lists (1. 2.), alpha points (a. b.), or sub-items!
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setBulkModalOpen(false)}
                className="p-2 rounded-2xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
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
                  <label className="block text-[12px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Format Mode
                  </label>
                  <select
                    value={bulkFormat}
                    onChange={(e) => setBulkFormat(e.target.value)}
                    className={inputCls}
                  >
                    <option value="paragraph">Paragraph / Preserved Format (Exact Copy)</option>
                    <option value="bullet">Bullet Points List (•)</option>
                    <option value="numbered">Numbered List (1. 2. 3.)</option>
                    <option value="alphabetic">Alphabetic List (a. b. c.)</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[12px] font-bold text-slate-700 uppercase tracking-wider">
                    Paste Raw Copied Document Text
                  </label>
                  <label className="flex items-center gap-1.5 text-[12px] text-purple-700 font-bold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={splitSections}
                      onChange={(e) => setSplitSections(e.target.checked)}
                      className="rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                    />
                    Auto-split multi-headings (e.g. Terms:, Cancellation:)
                  </label>
                </div>
                <textarea
                  rows={8}
                  value={rawPastedText}
                  onChange={(e) => setRawPastedText(e.target.value)}
                  placeholder="Paste copied text here (PDF, Word, or Email text)..."
                  className={`${inputCls} font-mono text-[13px] resize-y leading-relaxed bg-slate-50/50`}
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <span className="text-[11.5px] text-slate-400 font-semibold italic">
                {rawPastedText ? `${rawPastedText.split("\n").filter(Boolean).length} lines detected` : "Ready for paste"}
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setBulkModalOpen(false)}
                  className="px-5 py-2.5 rounded-2xl text-[13px] font-bold text-slate-600 border border-slate-200 hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={executeSmartImport}
                  disabled={!rawPastedText.trim()}
                  className="px-6 py-2.5 rounded-2xl text-[13px] font-black text-white bg-gradient-to-r from-purple-600 via-indigo-600 to-violet-700 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-md shadow-purple-500/20 disabled:opacity-40"
                >
                  Import Text Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
