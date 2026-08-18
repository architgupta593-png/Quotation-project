"use client";

import { useState, useMemo } from "react";
import {
  Calendar as CalendarIcon, Moon, Sun, ChevronLeft, ChevronRight,
  Sparkles, Plus, Minus, Check, Plane, X, ChevronDown, ChevronUp,
} from "lucide-react";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DAYS_OF_WEEK = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

export default function DateRangeSelector({
  startDate = "",
  endDate = "",
  nights = 4,
  days = 5,
  onChange,
}) {
  // Calendar View Month State (Defaults to startDate or Today)
  const initialDate = startDate ? new Date(startDate + "T00:00:00") : new Date();
  const [currentYear, setCurrentYear] = useState(initialDate.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(initialDate.getMonth()); // 0-indexed
  const [hoveredDate, setHoveredDate] = useState(null);
  const [selectingStep, setSelectingStep] = useState(null); // null | 'start' | 'end'
  const [calendarOpen, setCalendarOpen] = useState(false);

  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }, []);

  const startObj = startDate ? new Date(startDate + "T00:00:00") : null;
  const endObj = endDate ? new Date(endDate + "T00:00:00") : null;

  const validStart = startObj && !isNaN(startObj.getTime());
  const validEnd = endObj && !isNaN(endObj.getTime());

  function formatDateFriendly(d) {
    if (!d || isNaN(d.getTime())) return "Select Date";
    return d.toLocaleDateString("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  // Calendar Grid Construction for currentMonth
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);

    // Monday-based day of week (0 = Mon, 6 = Sun)
    let startDayOfWeek = firstDayOfMonth.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6;

    const daysInMonth = lastDayOfMonth.getDate();
    const daysArray = [];

    // Previous month padding
    const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      daysArray.push({
        dayNumber: prevMonthLastDay - i,
        isCurrentMonth: false,
        dateStr: null,
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      daysArray.push({
        dayNumber: d,
        isCurrentMonth: true,
        dateStr,
        isPast: dateStr < todayStr,
      });
    }

    // Next month padding (complete grid to 35 or 42 cells)
    const remaining = (7 - (daysArray.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      daysArray.push({
        dayNumber: i,
        isCurrentMonth: false,
        dateStr: null,
      });
    }

    return daysArray;
  }, [currentYear, currentMonth, todayStr]);

  function prevMonth() {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  }

  function nextMonth() {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  }

  // Handle Date Click on Custom Calendar
  function handleCellClick(dateStr) {
    if (!dateStr || dateStr < todayStr) return;

    if (!startDate || selectingStep === "start" || (startDate && endDate && selectingStep !== "end")) {
      // Set Start Date and open End Date selection
      const newStart = new Date(dateStr + "T00:00:00");
      const defaultEnd = new Date(newStart.getTime() + (nights || 4) * 86400000);
      const newEndStr = defaultEnd.toISOString().split("T")[0];
      const diffDays = Math.max(1, Math.ceil((defaultEnd.getTime() - newStart.getTime()) / 86400000));

      onChange({
        startDate: dateStr,
        endDate: newEndStr,
        nights: diffDays,
        days: diffDays + 1,
      });
      setSelectingStep("end");
      // Keep open so user can pick End Date
    } else {
      // Setting End Date -> auto hide calendar on completion!
      if (dateStr <= startDate) {
        // If user picked a date earlier than start date, make it the new start date
        const newStart = new Date(dateStr + "T00:00:00");
        const defaultEnd = new Date(newStart.getTime() + (nights || 4) * 86400000);
        onChange({
          startDate: dateStr,
          endDate: defaultEnd.toISOString().split("T")[0],
          nights: nights || 4,
          days: (nights || 4) + 1,
        });
        setSelectingStep("end");
        return;
      }

      const sObj = new Date(startDate + "T00:00:00");
      const eObj = new Date(dateStr + "T00:00:00");
      const diffDays = Math.max(1, Math.ceil((eObj.getTime() - sObj.getTime()) / 86400000));

      onChange({
        startDate,
        endDate: dateStr,
        nights: diffDays,
        days: diffDays + 1,
      });
      setSelectingStep(null);
      setCalendarOpen(false); // AUTO-HIDE CALENDAR ON COMPLETION
    }
  }

  function handleAdjustNights(delta) {
    const currentNights = Math.max(1, (nights || 1) + delta);
    const baseStart = validStart ? startObj : new Date();
    const newEnd = new Date(baseStart.getTime() + currentNights * 86400000);

    onChange({
      startDate: startDate || baseStart.toISOString().split("T")[0],
      endDate: newEnd.toISOString().split("T")[0],
      nights: currentNights,
      days: currentNights + 1,
    });
  }

  function applyPreset(offsetDays, tourNights) {
    const today = new Date();
    const targetStart = new Date(today.getTime() + offsetDays * 86400000);
    const targetEnd = new Date(targetStart.getTime() + tourNights * 86400000);

    const sStr = targetStart.toISOString().split("T")[0];
    const eStr = targetEnd.toISOString().split("T")[0];

    setCurrentYear(targetStart.getFullYear());
    setCurrentMonth(targetStart.getMonth());

    onChange({
      startDate: sStr,
      endDate: eStr,
      nights: tourNights,
      days: tourNights + 1,
    });
    setSelectingStep(null);
    setCalendarOpen(false); // AUTO-HIDE ON PRESET SELECTION
  }

  const PRESETS = [
    { label: "This Weekend (3N/4D)", offset: 2, n: 3 },
    { label: "Next Week (4N/5D)", offset: 7, n: 4 },
    { label: "7-Day Escape (6N/7D)", offset: 10, n: 6 },
    { label: "Next Month Tour (9N/10D)", offset: 30, n: 9 },
  ];

  return (
    <div className="space-y-4">
      {/* ── Modern Date Range Dashboard Card ── */}
      <div className="rounded-3xl border-2 border-indigo-100/90 bg-white p-5 sm:p-6 shadow-sm space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-[15px] font-black text-slate-900 leading-tight">
                Tour Dates &amp; Calendar Schedule
              </h4>
              <p className="text-[12px] text-slate-500 font-semibold">
                {calendarOpen ? "Select departure then return date to finish" : "Click cards below to open calendar"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Night / Day duration pill */}
            <div className="flex items-center gap-2 bg-slate-950 text-white px-3.5 py-1.5 rounded-2xl shadow-xs">
              <span className="flex items-center gap-1 text-[12px] font-black text-indigo-300">
                <Moon className="w-3.5 h-3.5 text-indigo-400" /> {nights}N
              </span>
              <span className="text-white/30">•</span>
              <span className="flex items-center gap-1 text-[12px] font-black text-amber-300">
                <Sun className="w-3.5 h-3.5 text-amber-400" /> {days}D
              </span>
            </div>

            {/* Toggle Open/Hide Calendar Button */}
            <button
              type="button"
              onClick={() => {
                setCalendarOpen((prev) => !prev);
                if (!calendarOpen) setSelectingStep("start");
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-extrabold text-[12px] transition-colors"
            >
              {calendarOpen ? (
                <>
                  <ChevronUp className="w-3.5 h-3.5 text-slate-500" /> Hide
                </>
              ) : (
                <>
                  <ChevronDown className="w-3.5 h-3.5 text-indigo-600" /> Open Calendar
                </>
              )}
            </button>
          </div>
        </div>

        {/* ── Visual Start & Return Interactive Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-11 gap-3 items-center">
          {/* Start Date Card */}
          <div
            onClick={() => {
              setSelectingStep("start");
              setCalendarOpen(true);
              if (validStart) {
                setCurrentYear(startObj.getFullYear());
                setCurrentMonth(startObj.getMonth());
              }
            }}
            className={`sm:col-span-5 rounded-2xl p-4 transition-all cursor-pointer border-2 ${
              calendarOpen && selectingStep === "start"
                ? "border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-500/20 shadow-sm"
                : "border-slate-200 hover:border-indigo-400 bg-slate-50/60 hover:bg-white shadow-2xs"
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-black uppercase tracking-wider text-indigo-700 flex items-center gap-1.5">
                <Plane className="w-3.5 h-3.5 text-indigo-600 rotate-[-45deg]" /> Departure Date
              </span>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                Day 1
              </span>
            </div>
            <p className="text-[17px] font-black text-slate-900 font-serif leading-snug">
              {validStart ? formatDateFriendly(startObj) : "Pick Departure Date"}
            </p>
            <p className="text-[11px] font-semibold text-slate-400 mt-1">
              {calendarOpen && selectingStep === "start"
                ? "👉 Click a departure date in calendar below"
                : "Click card to change departure"}
            </p>
          </div>

          {/* Middle Duration Bumper */}
          <div className="sm:col-span-1 flex sm:flex-col items-center justify-center gap-1.5 py-1">
            <button
              type="button"
              onClick={() => handleAdjustNights(1)}
              title="Add 1 Night"
              className="p-2 rounded-xl bg-indigo-100 hover:bg-indigo-200 text-indigo-800 transition-all hover:scale-105 active:scale-95 shadow-2xs"
            >
              <Plus className="w-4 h-4" />
            </button>
            <span className="text-[11.5px] font-black text-slate-700 font-mono hidden sm:block">
              {nights}N
            </span>
            <button
              type="button"
              onClick={() => handleAdjustNights(-1)}
              disabled={nights <= 1}
              title="Reduce 1 Night"
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all hover:scale-105 active:scale-95 disabled:opacity-30 shadow-2xs"
            >
              <Minus className="w-4 h-4" />
            </button>
          </div>

          {/* End Date Card */}
          <div
            onClick={() => {
              setSelectingStep("end");
              setCalendarOpen(true);
              if (validEnd) {
                setCurrentYear(endObj.getFullYear());
                setCurrentMonth(endObj.getMonth());
              }
            }}
            className={`sm:col-span-5 rounded-2xl p-4 transition-all cursor-pointer border-2 ${
              calendarOpen && selectingStep === "end"
                ? "border-purple-600 bg-purple-50/70 ring-2 ring-purple-500/20 shadow-sm"
                : "border-slate-200 hover:border-purple-400 bg-slate-50/60 hover:bg-white shadow-2xs"
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-black uppercase tracking-wider text-purple-700 flex items-center gap-1.5">
                <Plane className="w-3.5 h-3.5 text-purple-600 rotate-[45deg]" /> Return Date
              </span>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                Day {days}
              </span>
            </div>
            <p className="text-[17px] font-black text-slate-900 font-serif leading-snug">
              {validEnd ? formatDateFriendly(endObj) : "Pick Return Date"}
            </p>
            <p className="text-[11px] font-semibold text-slate-400 mt-1">
              {calendarOpen && selectingStep === "end"
                ? "👉 Click a return date in calendar below"
                : "Click card to change return"}
            </p>
          </div>
        </div>

        {/* ── Interactive Custom Calendar Matrix (Collapsible) ── */}
        {calendarOpen && (
          <div className="pt-2 border-t border-slate-100 animate-in fade-in duration-200 space-y-3">
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/90 border border-slate-200/90 space-y-4">
              {/* Month & Navigation Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h5 className="text-[16px] font-black text-slate-900 font-serif">
                    {MONTH_NAMES[currentMonth]} {currentYear}
                  </h5>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
                    {selectingStep === "start" ? "Step 1: Pick Departure" : "Step 2: Pick Return Date"}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={prevMonth}
                    className="p-1.5 rounded-xl bg-white hover:bg-slate-200 text-slate-700 border border-slate-200 shadow-2xs transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={nextMonth}
                    className="p-1.5 rounded-xl bg-white hover:bg-slate-200 text-slate-700 border border-slate-200 shadow-2xs transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Weekday Headers */}
              <div className="grid grid-cols-7 gap-1 text-center">
                {DAYS_OF_WEEK.map((dw) => (
                  <span key={dw} className="text-[11px] font-extrabold uppercase text-slate-400 py-1">
                    {dw}
                  </span>
                ))}
              </div>

              {/* Day Grid */}
              <div className="grid grid-cols-7 gap-1.5 text-center">
                {calendarDays.map((cell, idx) => {
                  if (!cell.isCurrentMonth) {
                    return (
                      <div
                        key={idx}
                        className="h-10 flex items-center justify-center text-[12px] text-slate-300 font-medium select-none"
                      >
                        {cell.dayNumber}
                      </div>
                    );
                  }

                  const isStart = cell.dateStr === startDate;
                  const isEnd = cell.dateStr === endDate;
                  const inRange =
                    startDate &&
                    endDate &&
                    cell.dateStr > startDate &&
                    cell.dateStr < endDate;
                  const isToday = cell.dateStr === todayStr;
                  const inHoverRange =
                    startDate &&
                    !endDate &&
                    hoveredDate &&
                    cell.dateStr > startDate &&
                    cell.dateStr <= hoveredDate;

                  let cellStyle = "bg-white text-slate-800 hover:bg-indigo-50 border border-slate-200/80";
                  if (cell.isPast) {
                    cellStyle = "bg-transparent text-slate-300 cursor-not-allowed";
                  } else if (isStart) {
                    cellStyle = "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-black shadow-md shadow-indigo-500/25 ring-2 ring-indigo-400";
                  } else if (isEnd) {
                    cellStyle = "bg-gradient-to-r from-purple-600 to-purple-700 text-white font-black shadow-md shadow-purple-500/25 ring-2 ring-purple-400";
                  } else if (inRange || inHoverRange) {
                    cellStyle = "bg-indigo-100 text-indigo-950 font-bold border border-indigo-200";
                  } else if (isToday) {
                    cellStyle = "bg-white text-indigo-600 font-black border-2 border-indigo-400";
                  }

                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={cell.isPast}
                      onClick={() => handleCellClick(cell.dateStr)}
                      onMouseEnter={() => !cell.isPast && setHoveredDate(cell.dateStr)}
                      onMouseLeave={() => setHoveredDate(null)}
                      className={`h-10 rounded-xl flex items-center justify-center text-[13px] font-bold transition-all ${cellStyle} ${
                        !cell.isPast ? "hover:scale-105 active:scale-95" : ""
                      }`}
                    >
                      <span>{cell.dayNumber}</span>
                    </button>
                  );
                })}
              </div>

              {/* Close / Done Button */}
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setCalendarOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-[12px] flex items-center gap-1.5 transition-all shadow-xs"
                >
                  <Check className="w-3.5 h-3.5 text-emerald-400" /> Done / Close Calendar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Quick Duration & Date Presets ── */}
        <div className="pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Quick Travel Presets (1-Click):
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {PRESETS.map((preset, i) => (
              <button
                key={i}
                type="button"
                onClick={() => applyPreset(preset.offset, preset.n)}
                className="px-3.5 py-2.5 rounded-xl bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 text-slate-800 text-[12px] font-bold text-left transition-all shadow-2xs hover:scale-[1.02] active:scale-[0.98]"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
