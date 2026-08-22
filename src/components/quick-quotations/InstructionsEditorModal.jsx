"use client";

import { useState, useEffect, useRef } from "react";
import {
  X, Plus, Trash2, ShieldCheck, Check, Sparkles, BookOpen,
  RotateCcw, Info, CheckCircle2, ChevronRight, FileText,
  Bold, Italic, List, ListOrdered, Indent, Outdent, Code,
  Eye, Edit3, Copy, Sparkle, Shield, Clock, Award, Compass,
  Layers, CheckCheck, HelpCircle, ArrowUp, ArrowDown, Type,
} from "lucide-react";

const PRESET_POLICIES = [
  {
    title: "Hotel Check-In & Check-Out",
    icon: Clock,
    badge: "Hotel",
    badgeColor: "bg-amber-100 text-amber-900 border-amber-200",
    content: `<p><strong>Standard Hotel Timings:</strong></p><ul><li>Standard Hotel Check-In time: <strong>12:00 PM</strong></li><li>Standard Hotel Check-Out time: <strong>10:00 AM</strong><ul><li>Early check-in or late check-out is strictly subject to hotel room availability and may incur nominal hotel charges.</li></ul></li></ul>`,
  },
  {
    title: "Mandatory Government Photo ID",
    icon: ShieldCheck,
    badge: "ID Proof",
    badgeColor: "bg-emerald-100 text-emerald-900 border-emerald-200",
    content: `<p><strong>Mandatory Government Identity:</strong></p><ul><li>Valid Govt. Photo ID (Aadhaar Card / Passport / Voter ID / Driving License) is mandatory for all adult guests at hotel check-in.<ul><li>PAN cards are strictly not accepted by hotels as address identity proof.</li></ul></li></ul>`,
  },
  {
    title: "Dedicated Chauffeur & Cab Guidelines",
    icon: Compass,
    badge: "Transport",
    badgeColor: "bg-sky-100 text-sky-900 border-sky-200",
    content: `<p><strong>Private Dedicated Chauffeur &amp; Cab:</strong></p><ul><li>Driver contact details and vehicle registration number will be dispatched on WhatsApp <strong>24 hours prior</strong> to departure.</li><li>Dedicated vehicle disposal available for transfers and sightseeing as per itinerary.<ul><li>AC will be switched off while driving in hilly/ghat terrains or when parked stationary.</li></ul></li></ul>`,
  },
  {
    title: "Luggage Boot Space Allowance",
    icon: Award,
    badge: "Baggage",
    badgeColor: "bg-purple-100 text-purple-900 border-purple-200",
    content: `<p><strong>Luggage Guidelines:</strong></p><ul><li>Luggage allowance is strictly <strong>1 medium suitcase (up to 20kg)</strong> and <strong>1 handbag</strong> per passenger to comfortably fit vehicle boot capacity.</li></ul>`,
  },
  {
    title: "Commercial & Payment Terms",
    icon: Sparkles,
    badge: "Payments",
    badgeColor: "bg-rose-100 text-rose-900 border-rose-200",
    content: `<p><strong>Booking Milestones &amp; Payments:</strong></p><ol><li><strong>25% Advance Token</strong> required for instant hotel &amp; vehicle voucher confirmation.</li><li><strong>Balance 75%</strong> payable prior to departure or upon arrival as confirmed.</li></ol>`,
  },
];

const DEFAULT_SECTIONS = [
  {
    id: "sec_1",
    title: "Hotel Check-In & Check-Out",
    content: `<p><strong>Standard Hotel Timings:</strong></p><ul><li>Standard Check-In time: <strong>12:00 PM</strong> | Check-Out time: <strong>10:00 AM</strong>.<ul><li>Early check-in or late check-out is strictly subject to hotel room availability.</li></ul></li></ul>`,
  },
  {
    id: "sec_2",
    title: "Mandatory Government Photo ID",
    content: `<p><strong>Guest Identification:</strong></p><ul><li>Valid Photo ID (Aadhaar / Passport / Voter ID) is mandatory for all adult guests at hotel check-in.<ul><li>PAN cards are not accepted by hotels as valid address identity proof.</li></ul></li></ul>`,
  },
  {
    id: "sec_3",
    title: "Dedicated Chauffeur & Transport",
    content: `<p><strong>Private Cab Guidelines:</strong></p><ul><li>Driver contact details and vehicle registration will be dispatched on WhatsApp <strong>24 hours prior</strong> to departure.</li><li>AC will be switched off while driving in uphill/ghat sections or when parked stationary.</li></ul>`,
  },
];

// Advanced state-machine parser for mixed paragraphs, main bullets, sub-bullets, numbers, and sub-numbers
function parseMixedContent(html, plainText) {
  // If HTML is provided, sanitize it and check if it contains semantic tags
  if (html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    // Remove unwanted non-text elements
    doc.querySelectorAll("script, style, meta, link, noscript, svg, img, iframe, object").forEach((el) => el.remove());

    // Clean all inline styles, classes, and backgrounds to prevent dark theme leakage
    doc.querySelectorAll("*").forEach((el) => {
      // If element is a span or font with no semantic meaning, replace with its text/children
      if (el.tagName === "SPAN" || el.tagName === "FONT") {
        const parent = el.parentNode;
        while (el.firstChild) parent.insertBefore(el.firstChild, el);
        parent.removeChild(el);
        return;
      }

      el.removeAttribute("class");
      el.removeAttribute("id");
      el.removeAttribute("style");
      el.removeAttribute("bgcolor");
      el.removeAttribute("color");
      el.removeAttribute("align");
    });

    const cleanedHtml = doc.body.innerHTML.trim();
    if (cleanedHtml && (cleanedHtml.includes("<p") || cleanedHtml.includes("<ul") || cleanedHtml.includes("<ol") || cleanedHtml.includes("<li") || cleanedHtml.includes("<br"))) {
      return cleanedHtml;
    }
  }

  // Hierarchical parser for plain text / mixed inputs
  const lines = (plainText || "").split(/\r?\n/);
  let resultHtml = "";

  // Stack to track list nesting: array of { type: 'ul'|'ol', level: 0|1 }
  let listStack = [];

  function closeListsToLevel(targetLevel) {
    while (listStack.length > targetLevel) {
      const top = listStack.pop();
      resultHtml += `</li></${top.type}>`;
    }
  }

  function closeAllLists() {
    closeListsToLevel(0);
  }

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    if (!trimmed) {
      closeAllLists();
      continue;
    }

    // Determine line type and indentation level
    const leadingSpaces = rawLine.match(/^(\s*)/)[1].length;
    const isIndented = leadingSpaces >= 2 || rawLine.startsWith("\t") || trimmed.startsWith("↳") || trimmed.startsWith(">");
    const isBullet = /^[•\-*▪▫●■◆]\s*/.test(trimmed) || /^[↳>]\s*/.test(trimmed);
    const isAlphaSub = /^[a-z][\.\)]\s+/i.test(trimmed);
    const isRomanSub = /^(?:i|ii|iii|iv|v|vi|vii|viii|ix|x)[\.\)]\s+/i.test(trimmed);
    const isNumeric = /^\d+[\.\)]\s*/.test(trimmed);

    if (isBullet) {
      const level = isIndented || trimmed.startsWith("↳") || trimmed.startsWith(">") ? 2 : 1;
      const cleanText = trimmed.replace(/^[•\-*▪▫●■◆↳>]\s*/, "");

      if (level === 1) {
        closeListsToLevel(0);
        if (listStack.length === 0) {
          resultHtml += `<ul><li>${cleanText}`;
          listStack.push({ type: "ul", level: 1 });
        } else {
          resultHtml += `</li><li>${cleanText}`;
        }
      } else {
        // Level 2 Sub-bullet
        if (listStack.length === 0) {
          resultHtml += `<ul><li><ul><li>${cleanText}`;
          listStack.push({ type: "ul", level: 1 });
          listStack.push({ type: "ul", level: 2 });
        } else if (listStack.length === 1) {
          resultHtml += `<ul><li>${cleanText}`;
          listStack.push({ type: "ul", level: 2 });
        } else {
          resultHtml += `</li><li>${cleanText}`;
        }
      }
    } else if (isNumeric || isAlphaSub || isRomanSub) {
      const level = isAlphaSub || isRomanSub || (isNumeric && isIndented) ? 2 : 1;
      const cleanText = trimmed.replace(/^\d+[\.\)]\s*/, "").replace(/^[a-z][\.\)]\s+/i, "").replace(/^(?:i|ii|iii|iv|v|vi|vii|viii|ix|x)[\.\)]\s+/i, "");

      if (level === 1) {
        closeListsToLevel(0);
        if (listStack.length === 0) {
          resultHtml += `<ol><li>${cleanText}`;
          listStack.push({ type: "ol", level: 1 });
        } else {
          resultHtml += `</li><li>${cleanText}`;
        }
      } else {
        // Level 2 Sub-numbered item
        if (listStack.length === 0) {
          resultHtml += `<ol><li><ol type="a"><li>${cleanText}`;
          listStack.push({ type: "ol", level: 1 });
          listStack.push({ type: "ol", level: 2 });
        } else if (listStack.length === 1) {
          resultHtml += `<ol type="a"><li>${cleanText}`;
          listStack.push({ type: "ol", level: 2 });
        } else {
          resultHtml += `</li><li>${cleanText}`;
        }
      }
    } else {
      // Normal Paragraph
      closeAllLists();
      resultHtml += `<p>${trimmed}</p>`;
    }
  }

  closeAllLists();
  return resultHtml || plainText;
}

export default function InstructionsEditorModal({
  isOpen,
  onClose,
  instructions = [],
  onSave,
}) {
  const [sections, setSections] = useState([]);
  const [activeSectionId, setActiveSectionId] = useState(null);
  const [activeTab, setActiveTab] = useState("editor"); // "editor" | "preview"
  const editorRef = useRef(null);

  // Initialize sections from instructions prop
  useEffect(() => {
    if (isOpen) {
      if (Array.isArray(instructions) && instructions.length > 0) {
        // Map instructions into section items
        const loaded = instructions.map((item, idx) => {
          let title = `Policy Section ${idx + 1}`;
          let content = item;

          // If content has a strong tag or header, extract title
          const titleMatch = item.match(/<strong>([^<]+)<\/strong>/i) || item.match(/•\s*([^:\n]+):/);
          if (titleMatch && titleMatch[1]) {
            title = titleMatch[1].replace(/^[🏨🪪🚗🧳💳📌\s]+/, "").trim();
          }

          return {
            id: `sec_${Date.now()}_${idx}`,
            title: title || `Policy Section ${idx + 1}`,
            content: content,
          };
        });
        setSections(loaded);
        setActiveSectionId(loaded[0]?.id || null);
      } else {
        setSections(DEFAULT_SECTIONS);
        setActiveSectionId(DEFAULT_SECTIONS[0]?.id);
      }
      setActiveTab("editor");
    }
  }, [isOpen, instructions]);

  // Sync active section content into contentEditable surface
  const activeSection = sections.find((s) => s.id === activeSectionId) || sections[0];

  useEffect(() => {
    if (editorRef.current && activeSection) {
      editorRef.current.innerHTML = activeSection.content || "<p><br></p>";
    }
  }, [activeSectionId]);

  if (!isOpen) return null;

  function updateActiveSectionContent() {
    if (!editorRef.current || !activeSection) return;
    const newHtml = editorRef.current.innerHTML;
    setSections((prev) =>
      prev.map((s) => (s.id === activeSection.id ? { ...s, content: newHtml } : s))
    );
  }

  function handleTitleChange(newTitle) {
    if (!activeSection) return;
    setSections((prev) =>
      prev.map((s) => (s.id === activeSection.id ? { ...s, title: newTitle } : s))
    );
  }

  function handleAddSection(preset = null) {
    updateActiveSectionContent();
    const newId = `sec_${Date.now()}`;
    const newSec = preset
      ? {
          id: newId,
          title: preset.title,
          content: preset.content,
        }
      : {
          id: newId,
          title: `New Policy Section ${sections.length + 1}`,
          content: `<p><strong>Section Title:</strong></p><ul><li>Enter your policy or guideline point here...</li></ul>`,
        };

    setSections((prev) => [...prev, newSec]);
    setActiveSectionId(newId);
  }

  function handleDeleteSection(secId) {
    if (sections.length <= 1) {
      alert("Quotation must have at least one instruction section.");
      return;
    }
    const remaining = sections.filter((s) => s.id !== secId);
    setSections(remaining);
    if (activeSectionId === secId) {
      setActiveSectionId(remaining[0]?.id || null);
    }
  }

  function handleMoveSection(idx, dir) {
    updateActiveSectionContent();
    const targetIdx = idx + dir;
    if (targetIdx < 0 || targetIdx >= sections.length) return;
    const updated = [...sections];
    const [moved] = updated.splice(idx, 1);
    updated.splice(targetIdx, 0, moved);
    setSections(updated);
  }

  function executeCommand(command, value = null) {
    if (!editorRef.current) return;
    editorRef.current.focus();
    document.execCommand(command, false, value);
    updateActiveSectionContent();
  }

  // Intercept paste & clean background styles completely
  function handlePaste(e) {
    e.preventDefault();
    const clipboardData = e.clipboardData || window.clipboardData;
    const pastedHtml = clipboardData.getData("text/html");
    const pastedText = clipboardData.getData("text/plain");

    const cleanHtml = parseMixedContent(pastedHtml, pastedText);
    document.execCommand("insertHTML", false, cleanHtml);
    updateActiveSectionContent();
  }

  function handleResetAllDefaults() {
    if (confirm("Reset all instructions to default agency policies?")) {
      setSections(DEFAULT_SECTIONS);
      setActiveSectionId(DEFAULT_SECTIONS[0]?.id);
      if (editorRef.current) {
        editorRef.current.innerHTML = DEFAULT_SECTIONS[0].content;
      }
    }
  }

  function handleSaveAndClose() {
    updateActiveSectionContent();
    const cleaned = sections
      .map((s) => (s.id === activeSection?.id && editorRef.current ? editorRef.current.innerHTML.trim() : s.content.trim()))
      .filter((c) => c && c !== "<p><br></p>");

    onSave(cleaned);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={onClose} />

      {/* Modal Container */}
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-5xl overflow-hidden border border-slate-200 flex flex-col max-h-[92vh] animate-in zoom-in-95">
        {/* Luxury Top Header */}
        <div className="bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 p-5 sm:p-6 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 flex-shrink-0 border-b border-white/10 relative overflow-hidden">
          <div className="flex items-center gap-3.5 relative z-10">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-amber-500/20">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
                  Multi-Policy Studio
                </span>
                <span className="text-[10px] font-black text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  Clean Paste (No Dark Theme)
                </span>
              </div>
              <h3 className="text-[18px] font-black text-white leading-snug mt-0.5">
                Trip Instructions &amp; Policies Manager ({sections.length} Sections)
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2.5 relative z-10">
            {/* View Switchers */}
            <div className="bg-white/10 p-1 rounded-2xl flex items-center gap-1 border border-white/15 text-[12px] font-bold">
              <button
                type="button"
                onClick={() => {
                  updateActiveSectionContent();
                  setActiveTab("editor");
                }}
                className={`px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 transition-all ${
                  activeTab === "editor"
                    ? "bg-amber-500 text-slate-950 font-black shadow-sm"
                    : "text-white/80 hover:text-white"
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" /> Section Studio
              </button>

              <button
                type="button"
                onClick={() => {
                  updateActiveSectionContent();
                  setActiveTab("preview");
                }}
                className={`px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 transition-all ${
                  activeTab === "preview"
                    ? "bg-amber-500 text-slate-950 font-black shadow-sm"
                    : "text-white/80 hover:text-white"
                }`}
              >
                <Eye className="w-3.5 h-3.5" /> All Sections Preview
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 1-Click Policy Presets Toolbar */}
        <div className="bg-gradient-to-r from-slate-50 via-amber-50/20 to-slate-50 px-6 py-2.5 border-b border-slate-200/80 flex items-center justify-between gap-3 overflow-x-auto flex-shrink-0">
          <div className="flex items-center gap-2 flex-nowrap text-[11.5px]">
            <span className="font-black text-slate-700 uppercase tracking-wider whitespace-nowrap flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Insert Preset as New Section:
            </span>
            {PRESET_POLICIES.map((p, i) => {
              const Icon = p.icon;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleAddSection(p)}
                  className="px-3 py-1 rounded-xl bg-white hover:bg-amber-50 text-slate-800 hover:text-amber-950 border border-slate-200 hover:border-amber-400 font-bold whitespace-nowrap transition-all shadow-2xs text-[11px] flex items-center gap-1.5 active:scale-95"
                >
                  <Icon className="w-3.5 h-3.5 text-amber-600" />
                  <span>{p.title}</span>
                  <span className="text-[9px] font-black text-amber-700 bg-amber-100 px-1 py-0.2 rounded">+ Add</span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={handleResetAllDefaults}
            className="text-[11px] font-bold text-slate-500 hover:text-slate-900 flex items-center gap-1 whitespace-nowrap flex-shrink-0"
          >
            <RotateCcw className="w-3 h-3" /> Reset Standard
          </button>
        </div>

        {/* Main Body Grid */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {activeTab === "editor" ? (
            <>
              {/* Left Sidebar: Policy Sections Manager List */}
              <div className="w-full md:w-72 bg-slate-50 border-r border-slate-200/90 p-4 flex flex-col flex-shrink-0 space-y-3 overflow-y-auto">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                    Policy Sections ({sections.length})
                  </span>
                  <button
                    type="button"
                    onClick={() => handleAddSection(null)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-[11px] transition-all shadow-2xs"
                  >
                    <Plus className="w-3 h-3" /> Add Section
                  </button>
                </div>

                <div className="space-y-2 flex-1">
                  {sections.map((sec, idx) => {
                    const isSelected = sec.id === (activeSection?.id || activeSectionId);
                    return (
                      <div
                        key={sec.id}
                        onClick={() => {
                          updateActiveSectionContent();
                          setActiveSectionId(sec.id);
                        }}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer space-y-1.5 ${
                          isSelected
                            ? "bg-white border-amber-400 shadow-sm ring-2 ring-amber-500/20"
                            : "bg-white/60 hover:bg-white border-slate-200"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="w-5 h-5 rounded-md bg-slate-900 text-amber-400 font-mono font-black text-[10px] flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => handleMoveSection(idx, -1)}
                              disabled={idx === 0}
                              className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                              title="Move Up"
                            >
                              <ArrowUp className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveSection(idx, 1)}
                              disabled={idx === sections.length - 1}
                              className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                              title="Move Down"
                            >
                              <ArrowDown className="w-3 h-3" />
                            </button>
                            {sections.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleDeleteSection(sec.id)}
                                className="p-1 text-slate-400 hover:text-rose-600"
                                title="Delete Section"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>

                        <p className="text-[12.5px] font-black text-slate-900 truncate">
                          {sec.title || `Section ${idx + 1}`}
                        </p>
                      </div>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => handleAddSection(null)}
                  className="w-full py-2.5 rounded-xl border-2 border-dashed border-slate-300 hover:border-amber-500 hover:bg-amber-50/50 text-slate-700 hover:text-amber-900 font-bold text-[11.5px] transition-all flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add New Policy Section</span>
                </button>
              </div>

              {/* Right Main Editor Surface */}
              <div className="flex-1 flex flex-col overflow-hidden bg-white">
                {/* Active Section Title Bar */}
                <div className="p-4 px-6 border-b border-slate-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/60">
                  <div className="flex items-center gap-2 flex-1">
                    <Type className="w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={activeSection?.title || ""}
                      onChange={(e) => handleTitleChange(e.target.value)}
                      placeholder="Enter Section Title (e.g. Hotel Check-in Policy)..."
                      className="w-full bg-white px-3.5 py-1.5 rounded-xl border border-slate-300 font-black text-[14px] text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* Rich Text Toolbar */}
                <div className="bg-slate-100/90 px-6 py-2 border-b border-slate-200 flex items-center justify-between gap-2 flex-wrap text-[12px]">
                  <div className="flex items-center gap-1 flex-wrap">
                    <div className="flex items-center gap-0.5 bg-white p-1 rounded-xl border border-slate-200">
                      <button
                        type="button"
                        onClick={() => executeCommand("bold")}
                        className="p-1.5 px-2 rounded-lg hover:bg-slate-100 text-slate-700 font-black text-[11.5px]"
                        title="Bold (Ctrl+B)"
                      >
                        <Bold className="w-3.5 h-3.5" /> Bold
                      </button>
                      <button
                        type="button"
                        onClick={() => executeCommand("italic")}
                        className="p-1.5 px-2 rounded-lg hover:bg-slate-100 text-slate-700 italic text-[11.5px]"
                        title="Italic (Ctrl+I)"
                      >
                        <Italic className="w-3.5 h-3.5" /> Italic
                      </button>
                    </div>

                    <div className="flex items-center gap-0.5 bg-white p-1 rounded-xl border border-slate-200">
                      <button
                        type="button"
                        onClick={() => executeCommand("insertUnorderedList")}
                        className="p-1.5 px-2.5 rounded-lg hover:bg-slate-100 text-slate-700 font-bold flex items-center gap-1 text-[11.5px]"
                      >
                        <List className="w-3.5 h-3.5 text-amber-600" /> Bullet List
                      </button>
                      <button
                        type="button"
                        onClick={() => executeCommand("insertOrderedList")}
                        className="p-1.5 px-2.5 rounded-lg hover:bg-slate-100 text-slate-700 font-bold flex items-center gap-1 text-[11.5px]"
                      >
                        <ListOrdered className="w-3.5 h-3.5 text-sky-600" /> Numbered List
                      </button>
                    </div>

                    <div className="flex items-center gap-0.5 bg-white p-1 rounded-xl border border-slate-200">
                      <button
                        type="button"
                        onClick={() => executeCommand("indent")}
                        className="p-1.5 px-2.5 rounded-lg hover:bg-slate-100 text-slate-700 font-bold flex items-center gap-1 text-[11.5px]"
                        title="Indent / Sub-point (Tab)"
                      >
                        <Indent className="w-3.5 h-3.5 text-emerald-600" /> Sub-point
                      </button>
                      <button
                        type="button"
                        onClick={() => executeCommand("outdent")}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600"
                        title="Outdent"
                      >
                        <Outdent className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    Clean Paste: No Dark BG
                  </span>
                </div>

                {/* ContentEditable Canvas */}
                <div className="p-6 overflow-y-auto flex-1 space-y-2">
                  <div
                    ref={editorRef}
                    contentEditable
                    onPaste={handlePaste}
                    onInput={updateActiveSectionContent}
                    className="w-full min-h-[300px] p-5 rounded-2xl border-2 border-slate-300 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/20 bg-white font-sans text-[14px] leading-relaxed text-slate-900 focus:outline-none transition-all shadow-inner [&>ul]:list-disc [&>ul]:pl-6 [&>ol]:list-decimal [&>ol]:pl-6 [&>ul>li>ul]:list-circle [&>ul>li>ul]:pl-6 [&>p]:mb-2.5 [&>ul]:mb-2.5 [&>ol]:mb-2.5 [&>p>strong]:text-slate-950"
                    style={{
                      backgroundColor: "#ffffff",
                      color: "#0f172a",
                      lineHeight: "1.75",
                    }}
                  />

                  <div className="flex items-center justify-between text-[11.5px] text-slate-500 px-1 pt-1">
                    <span className="flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5 text-amber-500" />
                      Paste anything: All dark background styles and dark theme colors are automatically stripped cleanly.
                    </span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* Live Proposal Preview of ALL Sections */
            <div className="p-7 overflow-y-auto flex-1 bg-slate-50 space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-indigo-600" />
                  <h4 className="text-[15px] font-black text-slate-900">All Policy Sections Client Proposal Preview</h4>
                </div>
                <span className="text-[11px] font-black text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  {sections.length} Sections
                </span>
              </div>

              <div className="space-y-4">
                {sections.map((sec, i) => (
                  <div
                    key={sec.id}
                    className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3"
                  >
                    <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
                      <span className="w-6 h-6 rounded-lg bg-slate-900 text-amber-400 font-mono font-black text-[11px] flex items-center justify-center">
                        {i + 1}
                      </span>
                      <h5 className="text-[14.5px] font-black text-slate-900">
                        {sec.title}
                      </h5>
                    </div>

                    <div
                      className="prose prose-base max-w-none text-slate-800 leading-relaxed font-medium [&>ul]:list-disc [&>ul]:pl-6 [&>ol]:list-decimal [&>ol]:pl-6 [&>ul>li>ul]:list-circle [&>ul>li>ul]:pl-6 [&>p]:mb-2 [&>ul]:mb-2 [&>ol]:mb-2 [&>p>strong]:text-slate-950 [&>p>strong]:font-black"
                      dangerouslySetInnerHTML={{ __html: sec.id === activeSection?.id && editorRef.current ? editorRef.current.innerHTML : sec.content }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 px-6 flex items-center justify-between gap-3 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-2xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold text-[13px] transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSaveAndClose}
            className="flex items-center gap-2 px-7 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-white font-black text-[13.5px] shadow-md shadow-amber-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Apply {sections.length} Policy Sections to Quote</span>
          </button>
        </div>
      </div>
    </div>
  );
}
