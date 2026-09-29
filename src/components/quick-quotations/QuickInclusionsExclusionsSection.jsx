"use client";

import { useState } from "react";
import {
  CheckCircle2, XCircle, Plus, Trash2, Edit2, Check, X,
  Sparkles, ArrowUp, ArrowDown, ShieldCheck, Layers, ChevronDown, ChevronUp
} from "lucide-react";

export const COMMON_INCLUSION_PRESETS = [
  "Daily Breakfast at Hotels (CP Plan)",
  "Private AC Vehicle for all Transfers & Sightseeing",
  "All Fuel, Toll Taxes, Parking & Driver Allowances",
  "Assistance upon Arrival & Departure",
  "24x7 On-Trip Concierge & Operations Support",
  "Interstate Permit Charges & Road Taxes",
  "Welcome Drink on Hotel Arrival",
  "Romantic Candlelight Dinner & Flower Bed Decor",
  "All Applicable Hotel Taxes & Service Charges",
];

export const COMMON_EXCLUSION_PRESETS = [
  "Airfare / Train Tickets (Domestic & International)",
  "Entry Tickets for Monuments, Forts, Museums & Parks",
  "Personal Expenses (Laundry, Phone Calls, Minibar)",
  "Optional Water Sports & Adventure Activity Fees",
  "5% GST (unless explicitly included in pricing)",
  "Early Hotel Check-in / Late Hotel Check-out",
  "Lunch & Dinner (unless explicitly stated in meal plan)",
  "Camera / Video Photography Permits",
  "Travel Insurance & Medical Expenses",
];

export default function QuickInclusionsExclusionsSection({
  inclusions = [],
  exclusions = [],
  onChangeInclusions,
  onChangeExclusions,
}) {
  const [newIncText, setNewIncText] = useState("");
  const [newExcText, setNewExcText] = useState("");
  const [editingIncIdx, setEditingIncIdx] = useState(null);
  const [editingIncVal, setEditingIncVal] = useState("");
  const [editingExcIdx, setEditingExcIdx] = useState(null);
  const [editingExcVal, setEditingExcVal] = useState("");
  const [showIncSuggestions, setShowIncSuggestions] = useState(false);
  const [showExcSuggestions, setShowExcSuggestions] = useState(false);

  // Inclusions handlers
  function handleAddInclusion(text) {
    const val = (text || newIncText).trim();
    if (!val) return;
    if (!inclusions.includes(val)) {
      onChangeInclusions([...inclusions, val]);
    }
    setNewIncText("");
  }

  function handleRemoveInclusion(index) {
    onChangeInclusions(inclusions.filter((_, i) => i !== index));
    if (editingIncIdx === index) setEditingIncIdx(null);
  }

  function handleMoveInclusion(index, direction) {
    const target = index + direction;
    if (target < 0 || target >= inclusions.length) return;
    const updated = [...inclusions];
    const [moved] = updated.splice(index, 1);
    updated.splice(target, 0, moved);
    onChangeInclusions(updated);
  }

  function handleSaveEditInclusion(index) {
    const val = editingIncVal.trim();
    if (val) {
      const updated = [...inclusions];
      updated[index] = val;
      onChangeInclusions(updated);
    }
    setEditingIncIdx(null);
    setEditingIncVal("");
  }

  // Exclusions handlers
  function handleAddExclusion(text) {
    const val = (text || newExcText).trim();
    if (!val) return;
    if (!exclusions.includes(val)) {
      onChangeExclusions([...exclusions, val]);
    }
    setNewExcText("");
  }

  function handleRemoveExclusion(index) {
    onChangeExclusions(exclusions.filter((_, i) => i !== index));
    if (editingExcIdx === index) setEditingExcIdx(null);
  }

  function handleMoveExclusion(index, direction) {
    const target = index + direction;
    if (target < 0 || target >= exclusions.length) return;
    const updated = [...exclusions];
    const [moved] = updated.splice(index, 1);
    updated.splice(target, 0, moved);
    onChangeExclusions(updated);
  }

  function handleSaveEditExclusion(index) {
    const val = editingExcVal.trim();
    if (val) {
      const updated = [...exclusions];
      updated[index] = val;
      onChangeExclusions(updated);
    }
    setEditingExcIdx(null);
    setEditingExcVal("");
  }

  return (
    <div className="bg-white rounded-3xl border-2 border-slate-200/90 hover:border-amber-400/60 p-5 sm:p-7 shadow-xs transition-all space-y-6 overflow-hidden min-w-0">
      {/* ── Section Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 min-w-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-600 to-indigo-600 text-white flex items-center justify-center font-black shadow-md shadow-emerald-500/20 flex-shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-[17px] font-black text-slate-900 truncate">
                Package Inclusions &amp; Exclusions
              </h3>
              <span className="text-[10px] font-black text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex-shrink-0">
                {inclusions.length} Included
              </span>
              <span className="text-[10px] font-black text-rose-800 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200 flex-shrink-0">
                {exclusions.length} Excluded
              </span>
            </div>
            <p className="text-[12px] text-slate-400 font-medium truncate">
              Specify complimentary services vs out-of-pocket guest expenses for this proposal
            </p>
          </div>
        </div>
      </div>

      {/* ── Responsive 2-Column Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ═══ INCLUSIONS COLUMN (Emerald Theme) ═══ */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-emerald-50/60 via-white to-emerald-50/30 border border-emerald-200/90 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-emerald-100">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <h4 className="text-[14px] font-black text-emerald-950">
                What's Included ({inclusions.length})
              </h4>
            </div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md">
              Complimentary
            </span>
          </div>

          {/* 1-Click Fast Presets (Accordion Layout) */}
          <div className="rounded-xl border border-emerald-200/90 bg-white/80 overflow-hidden shadow-2xs">
            <button
              type="button"
              onClick={() => setShowIncSuggestions((p) => !p)}
              className="w-full px-3 py-2 flex items-center justify-between text-left hover:bg-emerald-50/60 transition-colors"
            >
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-[11px] font-black uppercase tracking-wider text-emerald-900">
                  Quick Suggestions &amp; Presets
                </span>
                <span className="text-[10px] font-black text-emerald-700 bg-emerald-100/90 px-1.5 py-0.2 rounded-md">
                  {COMMON_INCLUSION_PRESETS.length}
                </span>
              </div>
              <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                <span>{showIncSuggestions ? "Hide" : "Show"}</span>
                {showIncSuggestions ? (
                  <ChevronUp className="w-3.5 h-3.5 text-emerald-700" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-emerald-700" />
                )}
              </div>
            </button>

            {showIncSuggestions && (
              <div className="p-2.5 pt-1.5 border-t border-emerald-100 bg-emerald-50/20">
                <div className="flex flex-wrap gap-1">
                  {COMMON_INCLUSION_PRESETS.map((preset, pIdx) => {
                    const isAdded = inclusions.includes(preset);
                    return (
                      <button
                        key={pIdx}
                        type="button"
                        onClick={() => {
                          if (isAdded) {
                            onChangeInclusions(inclusions.filter((x) => x !== preset));
                          } else {
                            handleAddInclusion(preset);
                          }
                        }}
                        className={`text-[10.5px] font-bold px-2.5 py-1 rounded-xl border transition-all ${
                          isAdded
                            ? "bg-emerald-600 text-white border-emerald-700 shadow-2xs"
                            : "bg-white text-emerald-950 hover:bg-emerald-100/70 border-emerald-200"
                        }`}
                      >
                        {isAdded ? "✓ " : "+ "}
                        <span className="truncate max-w-[200px] inline-block align-bottom">{preset}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Active Inclusions List */}
          <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
            {inclusions.length === 0 ? (
              <p className="text-[12px] text-slate-400 italic py-2">
                No inclusions added yet. Click a suggestion above or type below.
              </p>
            ) : (
              inclusions.map((inc, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-white border border-emerald-200/80 text-[12.5px] font-semibold text-slate-800 shadow-2xs group hover:border-emerald-400 transition-all"
                >
                  {editingIncIdx === i ? (
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                      <input
                        type="text"
                        value={editingIncVal}
                        onChange={(e) => setEditingIncVal(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleSaveEditInclusion(i);
                          } else if (e.key === "Escape") {
                            setEditingIncIdx(null);
                          }
                        }}
                        autoFocus
                        className="flex-1 px-2.5 py-1 rounded-lg border border-emerald-400 text-[12px] font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveEditInclusion(i)}
                        className="p-1 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingIncIdx(null)}
                        className="p-1 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="truncate flex items-center gap-2 flex-1">
                        <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                        <span>{inc}</span>
                      </span>

                      <div className="flex items-center gap-1 flex-shrink-0 opacity-80 group-hover:opacity-100">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingIncIdx(i);
                            setEditingIncVal(inc);
                          }}
                          className="p-1 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded transition-colors"
                          title="Edit Inclusion"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveInclusion(i, -1)}
                          disabled={i === 0}
                          className="p-1 text-slate-400 hover:text-slate-800 disabled:opacity-20 rounded"
                          title="Move Up"
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveInclusion(i, 1)}
                          disabled={i === inclusions.length - 1}
                          className="p-1 text-slate-400 hover:text-slate-800 disabled:opacity-20 rounded"
                          title="Move Down"
                        >
                          <ArrowDown className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveInclusion(i)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                          title="Delete Inclusion"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Custom Inclusion Input Bar */}
          <div className="flex gap-2 pt-1">
            <input
              type="text"
              value={newIncText}
              onChange={(e) => setNewIncText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddInclusion();
                }
              }}
              placeholder="Add custom inclusion item & press Enter..."
              className="flex-1 px-3.5 py-2 rounded-xl border border-emerald-200 bg-white text-[12.5px] font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-2xs"
            />
            <button
              type="button"
              onClick={() => handleAddInclusion()}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[12px] font-black shadow-xs active:scale-95 transition-all flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </div>
        </div>

        {/* ═══ EXCLUSIONS COLUMN (Rose Theme) ═══ */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-rose-50/60 via-white to-rose-50/30 border border-rose-200/90 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-rose-100">
            <div className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <h4 className="text-[14px] font-black text-rose-950">
                What's Excluded ({exclusions.length})
              </h4>
            </div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-700 bg-rose-100/80 px-2 py-0.5 rounded-md">
              Client Out-of-Pocket
            </span>
          </div>

          {/* 1-Click Fast Presets (Accordion Layout) */}
          <div className="rounded-xl border border-rose-200/90 bg-white/80 overflow-hidden shadow-2xs">
            <button
              type="button"
              onClick={() => setShowExcSuggestions((p) => !p)}
              className="w-full px-3 py-2 flex items-center justify-between text-left hover:bg-rose-50/60 transition-colors"
            >
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-rose-600" />
                <span className="text-[11px] font-black uppercase tracking-wider text-rose-900">
                  Quick Suggestions &amp; Presets
                </span>
                <span className="text-[10px] font-black text-rose-700 bg-rose-100/90 px-1.5 py-0.2 rounded-md">
                  {COMMON_EXCLUSION_PRESETS.length}
                </span>
              </div>
              <div className="flex items-center gap-1 text-[11px] font-bold text-rose-700">
                <span>{showExcSuggestions ? "Hide" : "Show"}</span>
                {showExcSuggestions ? (
                  <ChevronUp className="w-3.5 h-3.5 text-rose-700" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-rose-700" />
                )}
              </div>
            </button>

            {showExcSuggestions && (
              <div className="p-2.5 pt-1.5 border-t border-rose-100 bg-rose-50/20">
                <div className="flex flex-wrap gap-1">
                  {COMMON_EXCLUSION_PRESETS.map((preset, pIdx) => {
                    const isAdded = exclusions.includes(preset);
                    return (
                      <button
                        key={pIdx}
                        type="button"
                        onClick={() => {
                          if (isAdded) {
                            onChangeExclusions(exclusions.filter((x) => x !== preset));
                          } else {
                            handleAddExclusion(preset);
                          }
                        }}
                        className={`text-[10.5px] font-bold px-2.5 py-1 rounded-xl border transition-all ${
                          isAdded
                            ? "bg-rose-600 text-white border-rose-700 shadow-2xs"
                            : "bg-white text-rose-950 hover:bg-rose-100/70 border-rose-200"
                        }`}
                      >
                        {isAdded ? "✓ " : "+ "}
                        <span className="truncate max-w-[200px] inline-block align-bottom">{preset}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Active Exclusions List */}
          <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
            {exclusions.length === 0 ? (
              <p className="text-[12px] text-slate-400 italic py-2">
                No exclusions added yet. Click a suggestion above or type below.
              </p>
            ) : (
              exclusions.map((exc, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-white border border-rose-200/80 text-[12.5px] font-semibold text-slate-800 shadow-2xs group hover:border-rose-400 transition-all"
                >
                  {editingExcIdx === i ? (
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                      <input
                        type="text"
                        value={editingExcVal}
                        onChange={(e) => setEditingExcVal(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleSaveEditExclusion(i);
                          } else if (e.key === "Escape") {
                            setEditingExcIdx(null);
                          }
                        }}
                        autoFocus
                        className="flex-1 px-2.5 py-1 rounded-lg border border-rose-400 text-[12px] font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveEditExclusion(i)}
                        className="p-1 rounded-lg bg-rose-600 text-white hover:bg-rose-700"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingExcIdx(null)}
                        className="p-1 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="truncate flex items-center gap-2 flex-1">
                        <X className="w-3.5 h-3.5 text-rose-600 flex-shrink-0" />
                        <span>{exc}</span>
                      </span>

                      <div className="flex items-center gap-1 flex-shrink-0 opacity-80 group-hover:opacity-100">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingExcIdx(i);
                            setEditingExcVal(exc);
                          }}
                          className="p-1 text-slate-400 hover:text-rose-700 hover:bg-rose-50 rounded transition-colors"
                          title="Edit Exclusion"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveExclusion(i, -1)}
                          disabled={i === 0}
                          className="p-1 text-slate-400 hover:text-slate-800 disabled:opacity-20 rounded"
                          title="Move Up"
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveExclusion(i, 1)}
                          disabled={i === exclusions.length - 1}
                          className="p-1 text-slate-400 hover:text-slate-800 disabled:opacity-20 rounded"
                          title="Move Down"
                        >
                          <ArrowDown className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveExclusion(i)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                          title="Delete Exclusion"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Custom Exclusion Input Bar */}
          <div className="flex gap-2 pt-1">
            <input
              type="text"
              value={newExcText}
              onChange={(e) => setNewExcText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddExclusion();
                }
              }}
              placeholder="Add custom exclusion item & press Enter..."
              className="flex-1 px-3.5 py-2 rounded-xl border border-rose-200 bg-white text-[12.5px] font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 shadow-2xs"
            />
            <button
              type="button"
              onClick={() => handleAddExclusion()}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-[12px] font-black shadow-xs active:scale-95 transition-all flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
