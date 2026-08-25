"use client";

import { useState, useRef, useEffect } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Check } from "lucide-react";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const WEEKDAY_NAMES = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export default function CustomDatePicker({ value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Initialize view year & month from current value or today
  const selectedDate = value ? new Date(value + "T00:00:00") : new Date();
  const [viewYear, setViewYear] = useState(
    !isNaN(selectedDate.getFullYear()) ? selectedDate.getFullYear() : new Date().getFullYear()
  );
  const [viewMonth, setViewMonth] = useState(
    !isNaN(selectedDate.getMonth()) ? selectedDate.getMonth() : new Date().getMonth()
  );

  // Sync internal view when value changes externally
  useEffect(() => {
    if (value) {
      const d = new Date(value + "T00:00:00");
      if (!isNaN(d.getTime())) {
        setViewYear(d.getFullYear());
        setViewMonth(d.getMonth());
      }
    }
  }, [value]);

  // Close calendar popover on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handlePrevMonth = (e) => {
    e.stopPropagation();
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = (e) => {
    e.stopPropagation();
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleSelectDay = (dayNum) => {
    const mm = String(viewMonth + 1).padStart(2, "0");
    const dd = String(dayNum).padStart(2, "0");
    const iso = `${viewYear}-${mm}-${dd}`;
    onChange(iso);
    setIsOpen(false);
  };

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay();

  const calendarCells = [];
  for (let i = 0; i < firstDayIndex; i++) {
    calendarCells.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calendarCells.push(d);
  }

  // Display details for the active value
  let displayDay = "--";
  let displayMonthYear = "SELECT DATE";
  let displayWeekday = "Click to pick departure date";

  if (value) {
    try {
      const parts = value.split("-");
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        displayDay = String(d.getDate()).padStart(2, "0");
        displayMonthYear = d.toLocaleDateString("en-US", { month: "short", year: "numeric" }).toUpperCase();
        displayWeekday = d.toLocaleDateString("en-US", { weekday: "long" });
      }
    } catch {}
  }

  const todayIso = new Date().toISOString().split("T")[0];

  return (
    <div ref={containerRef} className="relative select-none">
      {/* ── 🌟 The Interactive Departure Date Tile ── */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`cursor-pointer p-4 rounded-2xl border-2 transition-all shadow-xs flex flex-col justify-between gap-3 ${
          isOpen
            ? "bg-amber-50/40 border-amber-500 ring-4 ring-amber-500/15"
            : "bg-white hover:bg-slate-50/80 border-slate-200/90 hover:border-amber-400"
        }`}
      >
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 cursor-pointer">
            Departure Date
          </label>
          <span className="text-[10.5px] font-black text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-md border border-amber-200">
            {displayMonthYear}
          </span>
        </div>

        {/* Big Day & Weekday Display */}
        <div className="flex items-center gap-3.5">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200/90 flex flex-col items-center justify-center text-amber-950 shadow-2xs group-hover:scale-105 transition-transform flex-shrink-0">
            <span className="text-[22px] font-black leading-none font-mono">
              {displayDay}
            </span>
            <span className="text-[9px] font-black uppercase tracking-wider text-amber-800 mt-0.5">
              Day
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <span className="text-[14.5px] font-black text-slate-900 block leading-tight truncate">
              {displayWeekday}
            </span>
            <span className="text-[11.5px] font-semibold text-slate-500 block mt-0.5 font-mono">
              {value || "No date selected"}
            </span>
          </div>

          <div className="w-8 h-8 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 flex items-center justify-center flex-shrink-0 transition-colors">
            <CalendarIcon className="w-4 h-4" />
          </div>
        </div>

        {/* Bottom Helper Bar */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
          <span className="text-amber-700 font-bold flex items-center gap-1">
            <span>✨</span> Click to open calendar picker
          </span>
          <span className={`text-[11px] font-bold ${isOpen ? "text-amber-600 font-black" : "text-slate-400"}`}>
            {isOpen ? "Close ▲" : "Select ▼"}
          </span>
        </div>
      </div>

      {/* ── 📅 Luxury Custom Month Calendar Dropdown ── */}
      {isOpen && (
        <div className="absolute top-[102%] left-0 z-50 w-full sm:w-[320px] bg-white rounded-3xl border-2 border-amber-300 shadow-2xl p-4 sm:p-5 animate-in fade-in zoom-in-95 duration-150">
          {/* Header Month / Year Switcher */}
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-900 flex items-center justify-center font-black text-[14px] transition-colors"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="text-center">
              <span className="text-[14px] font-black text-slate-900 block leading-tight">
                {MONTH_NAMES[viewMonth]} {viewYear}
              </span>
              <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">
                Select Departure
              </span>
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-900 flex items-center justify-center font-black text-[14px] transition-colors"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-black text-slate-400 mb-2">
            {WEEKDAY_NAMES.map((w, idx) => (
              <span key={idx} className={idx === 0 || idx === 6 ? "text-amber-600/80" : ""}>
                {w}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarCells.map((d, idx) => {
              if (!d) return <div key={idx} className="h-9" />;

              const mm = String(viewMonth + 1).padStart(2, "0");
              const dd = String(d).padStart(2, "0");
              const cellIso = `${viewYear}-${mm}-${dd}`;
              const isSelected = value === cellIso;
              const isToday = cellIso === todayIso;

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectDay(d)}
                  className={`h-9 rounded-xl text-[12.5px] font-bold transition-all flex flex-col items-center justify-center relative ${
                    isSelected
                      ? "bg-gradient-to-br from-amber-500 to-amber-600 text-white font-black shadow-md ring-2 ring-amber-400 scale-105 z-10"
                      : isToday
                      ? "bg-amber-50 hover:bg-amber-100 text-amber-900 font-black border border-amber-300"
                      : "hover:bg-slate-100 text-slate-800 hover:text-slate-900"
                  }`}
                >
                  <span>{d}</span>
                  {isToday && !isSelected && (
                    <span className="w-1 h-1 rounded-full bg-amber-500 mt-0.5" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Footer Quick Actions */}
          <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => {
                const tom = new Date();
                tom.setDate(tom.getDate() + 1);
                onChange(tom.toISOString().split("T")[0]);
                setIsOpen(false);
              }}
              className="text-[11px] font-bold text-amber-800 hover:text-amber-950 hover:underline"
            >
              Pick Tomorrow
            </button>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-3 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-extrabold transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
