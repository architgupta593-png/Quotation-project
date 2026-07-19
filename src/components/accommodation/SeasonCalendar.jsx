"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Sparkles, Utensils } from "lucide-react";

// ── Rich palette ──────────────────────────────────────────────────────────────
const PALETTE = [
  { id: "amber",   strip: "#f59e0b", light: "#fef3c7", text: "#78350f", ring: "#fbbf24", grad: "linear-gradient(135deg,#fbbf24,#f59e0b)" },
  { id: "blue",    strip: "#3b82f6", light: "#dbeafe", text: "#1e3a8a", ring: "#60a5fa", grad: "linear-gradient(135deg,#60a5fa,#3b82f6)" },
  { id: "emerald", strip: "#10b981", light: "#d1fae5", text: "#064e3b", ring: "#34d399", grad: "linear-gradient(135deg,#34d399,#10b981)" },
  { id: "rose",    strip: "#f43f5e", light: "#ffe4e6", text: "#881337", ring: "#fb7185", grad: "linear-gradient(135deg,#fb7185,#f43f5e)" },
  { id: "violet",  strip: "#8b5cf6", light: "#ede9fe", text: "#3b0764", ring: "#a78bfa", grad: "linear-gradient(135deg,#a78bfa,#8b5cf6)" },
  { id: "teal",    strip: "#14b8a6", light: "#ccfbf1", text: "#134e4a", ring: "#2dd4bf", grad: "linear-gradient(135deg,#2dd4bf,#14b8a6)" },
];

const MEAL_LABELS = { EP: "Room Only", CP: "Bed & Breakfast", MAP: "Breakfast + Dinner", AP: "All Meals" };
const MON_S = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const MON_F = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const WDAY  = ["Su","Mo","Tu","We","Th","Fr","Sa"];

// ── Helpers ───────────────────────────────────────────────────────────────────
function mmdd(dateIn) {
  if (!dateIn) return -1;
  const d = dateIn instanceof Date ? dateIn : new Date(dateIn);
  if (isNaN(d)) return -1;
  return (d.getUTCMonth() + 1) * 100 + d.getUTCDate();
}

function getSeasonIdx(checkDate, seasons) {
  const md = mmdd(checkDate);
  if (md === -1) return -1;
  return seasons.findIndex(s =>
    (s.dateRanges || []).some(r => {
      if (!r.startDate || !r.endDate) return false;
      const s0 = mmdd(r.startDate), e0 = mmdd(r.endDate);
      if (s0 === -1 || e0 === -1) return false;
      return s0 <= e0 ? md >= s0 && md <= e0 : md >= s0 || md <= e0;
    })
  );
}

function fmtDMY(dateIn) {
  if (!dateIn) return "";
  const d = dateIn instanceof Date ? dateIn : new Date(dateIn);
  if (isNaN(d)) return "";
  return `${String(d.getUTCDate()).padStart(2,"0")}-${String(d.getUTCMonth()+1).padStart(2,"0")}-${d.getUTCFullYear()}`;
}

/** Get the EP price (cheapest) for a season, or 0 if not set */
function getEpPrice(season) {
  if (!season?.meals?.length) return null;
  const ep = season.meals.find(m => m.plan === "EP");
  return ep ? Number(ep.price) : Number(season.meals[0].price);
}

// ── Component ─────────────────────────────────────────────────────────────────
/**
 * SeasonCalendar
 * Props:
 *   seasonalPricing  [{label, dateRanges:[{startDate,endDate}], meals:[{plan,price}]}]
 *   roomType         string  optional label shown in price panel
 *   compact          bool    smaller header, used inside form preview
 */
export default function SeasonCalendar({ seasonalPricing = [], roomType = "", compact = false }) {
  const todayDate = useMemo(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }, []);

  const [viewYear,  setViewYear]  = useState(todayDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(todayDate.getMonth());
  const [selected,  setSelected]  = useState(null);
  const [hovered,   setHovered]   = useState(null);

  function prev() {
    if (viewMonth === 0) { setViewYear(y => y-1); setViewMonth(11); }
    else setViewMonth(m => m-1);
    setSelected(null);
  }
  function next() {
    if (viewMonth === 11) { setViewYear(y => y+1); setViewMonth(0); }
    else setViewMonth(m => m+1);
    setSelected(null);
  }

  const firstDOW    = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const isToday = d => todayDate.getFullYear()===viewYear && todayDate.getMonth()===viewMonth && todayDate.getDate()===d;
  const isPast  = d => new Date(viewYear, viewMonth, d) < todayDate;
  const isSel   = d => selected && selected.getFullYear()===viewYear && selected.getMonth()===viewMonth && selected.getDate()===d;

  // 12-month strip
  const strip = MON_S.map((_, mi) => {
    const idx = getSeasonIdx(new Date(Date.UTC(viewYear, mi, 15)), seasonalPricing);
    return { idx, pal: idx >= 0 ? PALETTE[idx % PALETTE.length] : null };
  });

  // Selected date info
  const selInfo = useMemo(() => {
    if (!selected) return null;
    const idx = getSeasonIdx(selected, seasonalPricing);
    if (idx < 0) return { label: "No rate configured", meals: [], pal: null };
    const s = seasonalPricing[idx];
    return {
      label: s.label || `Season ${idx+1}`,
      meals: s.meals || [],
      pal:   PALETTE[idx % PALETTE.length],
    };
  }, [selected, seasonalPricing]);

  // Active season for the current view month
  const viewMonthSeasonIdx = getSeasonIdx(new Date(Date.UTC(viewYear, viewMonth, 15)), seasonalPricing);
  const viewMonthPal = viewMonthSeasonIdx >= 0 ? PALETTE[viewMonthSeasonIdx % PALETTE.length] : null;

  return (
    <div className="w-full rounded-2xl overflow-hidden shadow-lg border border-gray-100"
      style={{ background: "linear-gradient(180deg, #fafbff 0%, #fff 100%)" }}>

      {/* ── Top: season strip + legend ──────────────────────────────────── */}
      <div className="px-4 pt-3 pb-3 border-b border-gray-100/80"
        style={{ background: "linear-gradient(135deg, #f8faff 0%, #f0f4ff 100%)" }}>

        {!compact && (
          <div className="flex items-center gap-1.5 mb-2">
            <Sparkles className="w-3 h-3 text-indigo-400" />
            <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.15em]">
              Seasonal Price Map
            </p>
          </div>
        )}

        {/* 12-month mosaic strip */}
        <div className="flex rounded-xl overflow-hidden" style={{ height: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
          {strip.map(({ idx, pal }, mi) => {
            const isCur = mi === viewMonth;
            const epPrice = idx >= 0 ? getEpPrice(seasonalPricing[idx]) : null;
            const tooltip = idx >= 0
              ? `${MON_S[mi]}: ${seasonalPricing[idx].label || "Season"}${epPrice !== null ? ` · from ₹${epPrice.toLocaleString("en-IN")}` : ""}`
              : `${MON_S[mi]}: No rate`;
            return (
              <div
                key={mi}
                title={tooltip}
                style={{
                  flex: 1,
                  background: pal ? pal.grad : "linear-gradient(135deg,#e5e7eb,#d1d5db)",
                  position: "relative",
                  transition: "filter 0.15s",
                }}
                className={`flex items-center justify-center cursor-default select-none
                  ${isCur ? "brightness-110" : "brightness-90 hover:brightness-105"}
                `}
              >
                {isCur && (
                  <div style={{
                    position: "absolute", inset: 0,
                    border: "2.5px solid white",
                    borderRadius: 2,
                    pointerEvents: "none",
                    zIndex: 1,
                  }} />
                )}
                <span style={{ fontSize: 8, fontWeight: 900, color: pal ? "rgba(255,255,255,0.9)" : "#9ca3af", zIndex: 2, position: "relative" }}>
                  {MON_S[mi][0]}
                </span>
              </div>
            );
          })}
        </div>

        {/* Legend chips — each season shows date ranges + meal prices */}
        {seasonalPricing.length > 0 ? (
          <div className="flex flex-col gap-2 mt-2.5">
            {seasonalPricing.map((s, i) => {
              const pal    = PALETTE[i % PALETTE.length];
              const ranges = (s.dateRanges || [])
                .map(r => `${fmtDMY(r.startDate)} – ${fmtDMY(r.endDate)}`)
                .filter(Boolean);
              const meals  = s.meals || [];
              return (
                <div key={i} className="rounded-xl overflow-hidden border"
                  style={{ borderColor: pal.strip + "30", background: pal.light }}>
                  {/* Season header */}
                  <div className="flex items-center gap-1.5 px-3 py-1.5">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: pal.grad }} />
                    <span className="text-[11px] font-bold" style={{ color: pal.text }}>
                      {s.label || `Season ${i+1}`}
                    </span>
                    {ranges.length > 0 && (
                      <span className="text-[10px] opacity-60 font-normal ml-1" style={{ color: pal.text }}>
                        {ranges.join("  &  ")}
                      </span>
                    )}
                  </div>
                  {/* Meal price grid */}
                  {meals.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-white/30 border-t"
                      style={{ borderColor: pal.strip + "20" }}>
                      {meals.map(m => (
                        <div key={m.plan} className="flex flex-col items-center py-1.5 px-2 bg-white/60">
                          <span className="text-[9px] font-black uppercase tracking-wider" style={{ color: pal.strip }}>{m.plan}</span>
                          <span className="text-[10px] font-normal opacity-60" style={{ color: pal.text }}>{MEAL_LABELS[m.plan] || m.plan}</span>
                          <span className="text-[13px] font-black mt-0.5" style={{ color: pal.text }}>
                            ₹{Number(m.price).toLocaleString("en-IN")}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            <div className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] text-gray-400 bg-gray-100/80 border border-gray-200 w-fit">
              <span className="w-1.5 h-1.5 rounded-full bg-gray-300 flex-shrink-0" />
              No rate
            </div>
          </div>
        ) : (
          <p className="text-[10px] text-gray-400 italic mt-1.5">Add season pricing → colors will appear here.</p>
        )}
      </div>

      {/* ── Month navigation ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-2.5"
        style={{
          background: viewMonthPal
            ? `linear-gradient(135deg, ${viewMonthPal.strip}15 0%, ${viewMonthPal.strip}05 100%)`
            : "transparent",
          borderBottom: `1px solid ${viewMonthPal ? viewMonthPal.strip+"20" : "#f3f4f6"}`,
        }}>
        <button type="button" onClick={prev}
          className="w-7 h-7 rounded-lg border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:border-indigo-300 hover:text-indigo-600 hover:shadow-sm transition-all">
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        <div className="text-center">
          <p className="text-[14px] font-black text-gray-900 tracking-tight">{MON_F[viewMonth]}</p>
          <p className="text-[10px] text-gray-400 -mt-0.5">{viewYear}</p>
        </div>

        <button type="button" onClick={next}
          className="w-7 h-7 rounded-lg border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:border-indigo-300 hover:text-indigo-600 hover:shadow-sm transition-all">
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ── Calendar grid ────────────────────────────────────────────────── */}
      <div className="px-3 pt-2 pb-3">

        {/* Weekday headers */}
        <div className="grid grid-cols-7 mb-1">
          {WDAY.map((wd, wi) => (
            <div key={wd}
              className="h-7 flex items-center justify-center"
              style={{ fontSize: 10, fontWeight: 700, color: wi === 0 ? "#f43f5e" : "#d1d5db" }}>
              {wd}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7" style={{ gap: 2 }}>
          {Array.from({ length: firstDOW }).map((_, i) => <div key={`g${i}`} style={{ height: 34 }} />)}

          {Array.from({ length: daysInMonth }, (_, i) => {
            const day  = i + 1;
            const date = new Date(viewYear, viewMonth, day);
            const past = isPast(day);
            const tod  = isToday(day);
            const sel  = isSel(day);
            const isSun = (firstDOW + i) % 7 === 0;

            const idx = past ? -1 : getSeasonIdx(date, seasonalPricing);
            const pal = idx >= 0 ? PALETTE[idx % PALETTE.length] : null;

            // Tooltip: show season + EP (from) price
            const epPrice = idx >= 0 ? getEpPrice(seasonalPricing[idx]) : null;
            const dayTitle = past ? "Past"
              : idx >= 0
                ? `${seasonalPricing[idx].label || "Season"}${epPrice !== null ? ` · from ₹${epPrice.toLocaleString("en-IN")}` : ""}`
                : "No rate";

            let bg, fg, shadow = "none";
            if (sel) {
              bg = pal ? pal.grad : "linear-gradient(135deg,#818cf8,#6366f1)";
              fg = "#ffffff";
              shadow = pal ? `0 4px 12px ${pal.strip}50` : "0 4px 12px #6366f150";
            } else if (past) {
              bg = "transparent";
              fg = "#d1d5db";
            } else if (pal) {
              bg = pal.light;
              fg = pal.text;
            } else {
              bg = "#f9fafb";
              fg = isSun ? "#fca5a5" : "#6b7280";
            }

            return (
              <button
                key={day}
                type="button"
                disabled={past}
                title={dayTitle}
                onClick={() => !past && setSelected(sel ? null : date)}
                onMouseEnter={() => !past && setHovered(day)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  height: 34,
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 10,
                  fontSize: 12,
                  fontWeight: sel ? 800 : tod ? 800 : 600,
                  background: bg,
                  color: fg,
                  boxShadow: shadow,
                  cursor: past ? "not-allowed" : "pointer",
                  transition: "all 0.12s ease",
                  transform: sel ? "scale(1.1)" : (hovered === day && !past ? "scale(1.05)" : "scale(1)"),
                  outline: tod && !sel ? `2.5px solid ${pal ? pal.ring : "#818cf8"}` : "none",
                  outlineOffset: tod ? 1 : 0,
                  opacity: past ? 0.3 : 1,
                  position: "relative",
                }}
              >
                {day}
                {tod && (
                  <span style={{
                    position: "absolute",
                    bottom: 3,
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: 4,
                    height: 4,
                    borderRadius: "50%",
                    background: sel ? "#fff" : (pal ? pal.strip : "#818cf8"),
                  }} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Selected date — meal plan price table ────────────────────────── */}
      {selInfo && selected && (
        <div className="mx-3 mb-3 rounded-xl overflow-hidden"
          style={{
            background: selInfo.pal
              ? `linear-gradient(135deg, ${selInfo.pal.strip}10, ${selInfo.pal.strip}05)`
              : "linear-gradient(135deg,#f8fafc,#f1f5f9)",
            border: `1px solid ${selInfo.pal ? selInfo.pal.strip+"30" : "#e2e8f0"}`,
            boxShadow: selInfo.pal ? `0 4px 16px ${selInfo.pal.strip}18` : "0 2px 8px rgba(0,0,0,0.05)",
          }}>
          {/* Accent bar */}
          <div style={{ height: 3, background: selInfo.pal ? selInfo.pal.grad : "linear-gradient(135deg,#818cf8,#6366f1)" }} />

          {/* Date + season label */}
          <div className="px-4 pt-3 pb-2 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[10px] text-gray-500 font-medium truncate">
                {selected.toLocaleDateString("en-IN", { weekday:"long", day:"2-digit", month:"long", year:"numeric" })}
                {roomType && <span className="ml-1.5 text-gray-400 font-normal">· {roomType}</span>}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: selInfo.pal ? selInfo.pal.grad : "linear-gradient(135deg,#818cf8,#6366f1)" }} />
                <p className="text-[13px] font-bold" style={{ color: selInfo.pal ? selInfo.pal.strip : "#6366f1" }}>
                  {selInfo.label}
                </p>
              </div>
            </div>
            <Utensils className="w-4 h-4 flex-shrink-0" style={{ color: selInfo.pal ? selInfo.pal.strip : "#6366f1", opacity: 0.6 }} />
          </div>

          {/* Meal plan price grid */}
          {selInfo.meals.length > 0 ? (
            <div className="grid grid-cols-2 gap-px mx-3 mb-3 rounded-xl overflow-hidden border"
              style={{ borderColor: selInfo.pal ? selInfo.pal.strip+"25" : "#e2e8f0" }}>
              {selInfo.meals.map((m, mi) => (
                <div key={m.plan}
                  className="flex flex-col items-center py-3 px-2"
                  style={{ background: mi % 2 === 0 ? "white" : "#fafbff" }}>
                  <span className="text-[9px] font-black uppercase tracking-widest mb-0.5"
                    style={{ color: selInfo.pal ? selInfo.pal.strip : "#6366f1" }}>{m.plan}</span>
                  <span className="text-[9px] text-gray-400 text-center leading-tight mb-1">{MEAL_LABELS[m.plan] || m.plan}</span>
                  <div className="flex items-baseline gap-0.5">
                    <span className="text-[10px] font-semibold text-gray-500">₹</span>
                    <span className="text-[20px] font-black leading-none text-gray-900">
                      {Number(m.price).toLocaleString("en-IN")}
                    </span>
                  </div>
                  <p className="text-[8px] text-gray-400 mt-0.5">/night</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-[11px] text-gray-400 italic pb-3 px-4">No meal plans configured for this season.</p>
          )}
        </div>
      )}

      {/* Hint when nothing selected */}
      {!selInfo && seasonalPricing.length > 0 && (
        <p className="text-center text-[10px] text-gray-400 pb-3" style={{ fontStyle: "italic" }}>
          ✦ Tap any coloured date to see meal plan prices
        </p>
      )}
    </div>
  );
}
