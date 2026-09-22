"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import {
  Building2, Plus, Trash2, MapPin, Search,
  CheckCircle2, AlertCircle, Copy, IndianRupee,
  BedDouble, Utensils, Check, ArrowRight, Zap,
  SlidersHorizontal, Sparkles
} from "lucide-react";
import {
  HOTEL_CATEGORIES,
  getCategoryBadgeClass,
} from "@/components/packages/AccommodationPanel";
import HotelRateFinderDialog, { MEAL_PLANS } from "./HotelRateFinderDialog";

function createDefaultStay(cityName = "", nights = 1, category = "None") {
  return {
    cityName: cityName || "",
    nights: Math.max(1, parseInt(nights, 10) || 1),
    hotelId: null,
    hotelName: "",
    category: category || "None",
    roomId: null,
    starRating: 3,
    roomType: "Deluxe AC Room",
    mealPlan: "CP",
    availableMealPlans: ["EP", "CP", "MAP", "AP"],
    pricePerNight: 0,
    notes: "",
  };
}

function createDefaultOption(label = "", defaultStays = []) {
  return {
    label: label || "",
    hotelStays: defaultStays.length > 0 ? defaultStays.map((s) => ({ ...s })) : [createDefaultStay("", 1, "None")],
    totalPrice: 0,
    marginType: "absolute",
    margin: 0,
  };
}

export default function QuickAccommodationSection({
  accommodationOptions: propOptions = [],
  onOptionsChange,
  hotelStays: propStays = [],
  onChange,
  totalNights = 4,
  primaryDestination = "",
  startDate = "",
  totalRooms = 1,
  adults = 2,
  passengers = null,
  onPriceAdjustment,
}) {
  const [activeOptIdx, setActiveOptIdx] = useState(0);
  const [dialogState, setDialogState] = useState({
    isOpen: false,
    stayIndex: 0,
    cityName: "",
    category: "None",
    stayNights: 1,
    currentMealPlan: "CP",
  });

  // Options normalization
  const options = useMemo(() => {
    if (Array.isArray(propOptions) && propOptions.length > 0) {
      return propOptions;
    }
    if (Array.isArray(propStays) && propStays.length > 0) {
      return [createDefaultOption("", propStays)];
    }
    return [createDefaultOption("", [createDefaultStay(primaryDestination, totalNights, "None")])];
  }, [propOptions, propStays, primaryDestination, totalNights]);

  const safeOptIdx = Math.min(Math.max(0, activeOptIdx), Math.max(0, options.length - 1));
  const activeOption = options[safeOptIdx] || options[0];
  const currentStays = activeOption.hotelStays && activeOption.hotelStays.length > 0
    ? activeOption.hotelStays
    : [createDefaultStay(primaryDestination, totalNights, "None")];

  const roomMultiplier = Math.max(1, parseInt(totalRooms, 10) || 1);

  // Total allocated nights
  const allocatedNights = useMemo(() => {
    return currentStays.reduce((sum, s) => sum + (Math.max(1, parseInt(s.nights, 10) || 1)), 0);
  }, [currentStays]);

  const nightsProgressPct = Math.min(100, Math.round((allocatedNights / Math.max(1, totalNights)) * 100));

  // Testing Logger
  useEffect(() => {
    console.log(
      `%c[QuickQuote Accommodation] 📑 Current Active Option: "${activeOption.label || `Option ${safeOptIdx + 1}`}" with ${currentStays.length} stay(s):`,
      "color: #0d9488; font-weight: bold;",
      currentStays
    );
  }, [activeOption, safeOptIdx, currentStays]);

  // Centralized State Update & Emitter
  const updateOptionStays = useCallback((updatedStays, targetOptIdx = safeOptIdx) => {
    const newOptions = options.map((opt, i) => {
      if (i === targetOptIdx) {
        const totalCost = updatedStays.reduce(
          (sum, s) => sum + ((Number(s.pricePerNight) || 0) * (Math.max(1, parseInt(s.nights, 10) || 1)) * roomMultiplier),
          0
        );
        const mVal = Number(opt.margin) || 0;
        const mType = opt.marginType || "absolute";
        const mAmt = mType === "percentage" ? (totalCost * mVal) / 100 : mVal;

        return {
          ...opt,
          hotelStays: updatedStays,
          totalPrice: totalCost + mAmt,
        };
      }
      return opt;
    });

    if (typeof onOptionsChange === "function") {
      onOptionsChange(newOptions);
    }
    if (typeof onChange === "function") {
      onChange(updatedStays);
    }
    if (typeof onPriceAdjustment === "function") {
      const activeCost = updatedStays.reduce(
        (sum, s) => sum + ((Number(s.pricePerNight) || 0) * (Math.max(1, parseInt(s.nights, 10) || 1)) * roomMultiplier),
        0
      );
      onPriceAdjustment(activeCost, targetOptIdx);
    }
  }, [options, safeOptIdx, roomMultiplier, onOptionsChange, onChange, onPriceAdjustment]);

  function handleStayChange(idx, field, val) {
    const updated = currentStays.map((s, i) => (i === idx ? { ...s, [field]: val } : s));
    updateOptionStays(updated);
  }

  function handleOpenFinderDialog(idx) {
    const stay = currentStays[idx];
    const targetCity = stay.cityName || primaryDestination;
    console.log(
      `%c[QuickQuote Accommodation] 🛎️ Opening Hotel Finder for Stay #${idx + 1} (City: "${targetCity}", Category: "${stay.category || 'None'}", Nights: ${stay.nights || 1})`,
      "color: #8b5cf6; font-weight: bold; font-size: 12px;",
      stay
    );
    setDialogState({
      isOpen: true,
      stayIndex: idx,
      cityName: targetCity,
      category: stay.category || "None",
      stayNights: stay.nights || 1,
      currentMealPlan: stay.mealPlan || "CP",
    });
  }

  function handleHotelSelected(selectedData) {
    const idx = dialogState.stayIndex;
    console.log(
      `%c[QuickQuote Accommodation] 🏨 Hotel Selected for Stay #${idx + 1}:`,
      "color: #10b981; font-weight: bold; font-size: 13px;",
      selectedData
    );
    const updated = currentStays.map((s, i) => {
      if (i === idx) {
        return {
          ...s,
          hotelId: selectedData.hotelId,
          hotelName: selectedData.hotelName,
          cityName: selectedData.cityName || s.cityName,
          category: selectedData.category || s.category || "None",
          starRating: selectedData.starRating || s.starRating,
          roomId: selectedData.roomId,
          roomType: selectedData.roomType || s.roomType,
          mealPlan: selectedData.mealPlan || s.mealPlan,
          pricePerNight: selectedData.pricePerNight || s.pricePerNight,
        };
      }
      return s;
    });
    updateOptionStays(updated);
  }

  function handleMealPlanChange(idx, newPlan) {
    const stay = currentStays[idx];
    const oldPlan = stay.mealPlan || "CP";
    let newRate = Number(stay.pricePerNight) || 0;

    const planDiffMap = {
      EP: -300,
      CP: 0,
      MAP: stay.starRating >= 5 ? 1000 : 700,
      AP: stay.starRating >= 5 ? 1800 : 1400,
    };

    if (newRate > 0) {
      const oldDiff = planDiffMap[oldPlan] !== undefined ? planDiffMap[oldPlan] : 0;
      const newDiff = planDiffMap[newPlan] !== undefined ? planDiffMap[newPlan] : 0;
      newRate = Math.max(0, newRate - oldDiff + newDiff);
    }

    const updated = currentStays.map((s, i) => (i === idx ? { ...s, mealPlan: newPlan, pricePerNight: newRate } : s));
    updateOptionStays(updated);
  }

  function handleApplyMealPlanToAll(targetPlan) {
    const updated = currentStays.map((stay) => {
      const oldPlan = stay.mealPlan || "CP";
      let newRate = Number(stay.pricePerNight) || 0;

      const planDiffMap = {
        EP: -300,
        CP: 0,
        MAP: stay.starRating >= 5 ? 1000 : 700,
        AP: stay.starRating >= 5 ? 1800 : 1400,
      };

      if (newRate > 0) {
        const oldDiff = planDiffMap[oldPlan] !== undefined ? planDiffMap[oldPlan] : 0;
        const newDiff = planDiffMap[targetPlan] !== undefined ? planDiffMap[targetPlan] : 0;
        newRate = Math.max(0, newRate - oldDiff + newDiff);
      }

      return {
        ...stay,
        mealPlan: targetPlan,
        pricePerNight: newRate,
      };
    });

    updateOptionStays(updated);
  }

  function handleAddStay() {
    const remainingNights = Math.max(1, totalNights - allocatedNights);
    const lastCity = currentStays[currentStays.length - 1]?.cityName || primaryDestination;
    const lastCat = currentStays[currentStays.length - 1]?.category || "None";
    const newStay = createDefaultStay(lastCity, remainingNights, lastCat);
    updateOptionStays([...currentStays, newStay]);
  }

  function handleRemoveStay(idx) {
    if (currentStays.length <= 1) return;
    const updated = currentStays.filter((_, i) => i !== idx);
    updateOptionStays(updated);
  }

  function handleAddOption() {
    const newIdx = options.length;
    const newOption = createDefaultOption("", currentStays);
    const newOptions = [...options, newOption];

    if (typeof onOptionsChange === "function") onOptionsChange(newOptions);
    setActiveOptIdx(newIdx);
  }

  function handleDuplicateOption(idx) {
    const source = options[idx] || options[0];
    const newIdx = options.length;
    const duplicatedStays = (source.hotelStays || currentStays).map((s) => ({ ...s }));
    const newOption = {
      ...source,
      label: source.label ? `${source.label} (Copy)` : "",
      hotelStays: duplicatedStays,
    };
    const newOptions = [...options, newOption];

    if (typeof onOptionsChange === "function") onOptionsChange(newOptions);
    setActiveOptIdx(newIdx);
  }

  function handleRemoveOption(idx) {
    if (options.length <= 1) return;
    const newOptions = options.filter((_, i) => i !== idx);
    const nextIdx = Math.min(safeOptIdx >= newOptions.length ? newOptions.length - 1 : safeOptIdx, newOptions.length - 1);
    if (typeof onOptionsChange === "function") onOptionsChange(newOptions);
    setActiveOptIdx(nextIdx);
  }

  function handleRenameOption(idx, newLabel) {
    const newOptions = options.map((opt, i) => (i === idx ? { ...opt, label: newLabel } : opt));
    if (typeof onOptionsChange === "function") onOptionsChange(newOptions);
  }

  return (
    <div className="bg-white rounded-3xl border-2 border-slate-200/90 hover:border-amber-400/60 p-5 sm:p-7 shadow-xs transition-all space-y-6 overflow-hidden min-w-0">
      {/* ── 1. Luxury Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 min-w-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 text-slate-950 flex items-center justify-center font-black shadow-md shadow-amber-500/20 flex-shrink-0">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-[17px] font-black text-slate-900 truncate">
                Accommodation &amp; Hotels
              </h3>
              <span className="text-[10px] font-black text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 flex-shrink-0">
                {allocatedNights} / {totalNights} Nights • {options.length} Option Tier{options.length === 1 ? "" : "s"}
              </span>
            </div>
            <p className="text-[12px] text-slate-400 font-medium truncate">
              Multi-tier hotel packages with real-time rate comparison &amp; meal plans
            </p>
          </div>
        </div>

        {/* Night Allocation Pill & Add Stay Button */}
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <div
            className={`px-3 py-1.5 rounded-xl text-[11.5px] font-black flex items-center gap-1.5 border shadow-2xs ${
              allocatedNights === totalNights
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : "bg-amber-50 text-amber-900 border-amber-200"
            }`}
          >
            {allocatedNights === totalNights ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
            )}
            <span>{allocatedNights} / {totalNights} Nights</span>
          </div>

          <button
            type="button"
            onClick={handleAddStay}
            className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-gradient-to-r from-slate-950 to-indigo-950 hover:from-slate-900 hover:to-indigo-900 text-white font-black text-[12px] shadow-sm transition-all hover:scale-105 active:scale-95 border border-indigo-900/50"
          >
            <Plus className="w-3.5 h-3.5 text-amber-400" />
            <span>Add Stay</span>
          </button>
        </div>
      </div>

      {/* Hairline Night Allocation Progress Bar */}
      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/60 shadow-inner">
        <div
          className={`h-full transition-all duration-300 rounded-full ${
            allocatedNights === totalNights
              ? "bg-gradient-to-r from-emerald-500 to-teal-500"
              : "bg-gradient-to-r from-amber-500 to-orange-500"
          }`}
          style={{ width: `${nightsProgressPct}%` }}
        />
      </div>

      {/* ── 2. Option Tiers Segmented Tabs (Custom User Labels e.g. "Masti Option", "Ocean Option") ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2 rounded-2xl bg-gradient-to-r from-slate-50 via-amber-50/20 to-slate-50 border border-slate-200/90 shadow-2xs">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1 sm:pb-0">
          {options.map((opt, idx) => {
            const isAct = idx === safeOptIdx;
            return (
              <div
                key={idx}
                onClick={() => {
                  setActiveOptIdx(idx);
                  const targetStays = options[idx]?.hotelStays || currentStays;
                  if (typeof onChange === "function") onChange(targetStays);
                  if (typeof onPriceAdjustment === "function") {
                    const cost = targetStays.reduce(
                      (sum, s) => sum + ((Number(s.pricePerNight) || 0) * (Math.max(1, parseInt(s.nights, 10) || 1)) * roomMultiplier),
                      0
                    );
                    onPriceAdjustment(cost, idx);
                  }
                }}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-[12.5px] cursor-pointer transition-all ${
                  isAct
                    ? "bg-white text-slate-950 font-black shadow-xs border-2 border-amber-400 ring-2 ring-amber-500/20 scale-[1.02]"
                    : "bg-white/60 hover:bg-white text-slate-600 hover:text-slate-900 border border-slate-200 font-bold"
                }`}
              >
                <span className={`w-5 h-5 rounded-md text-[10.5px] flex items-center justify-center font-mono font-black flex-shrink-0 ${
                  isAct ? "bg-slate-900 text-amber-400" : "bg-slate-200 text-slate-700"
                }`}>
                  {idx + 1}
                </span>

                <input
                  type="text"
                  value={opt.label || ""}
                  onChange={(e) => handleRenameOption(idx, e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  placeholder={`Option ${idx + 1}`}
                  className="bg-transparent focus:bg-amber-50/80 focus:px-1.5 focus:rounded-md focus:outline-none focus:ring-1 focus:ring-amber-400 text-[12.5px] font-black min-w-[80px] max-w-[160px] text-slate-900 placeholder:text-slate-400 transition-all"
                />

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDuplicateOption(idx);
                  }}
                  className="p-1 text-slate-400 hover:text-amber-600 transition-colors"
                  title="Duplicate Option"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>

                {options.length > 1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveOption(idx);
                    }}
                    className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                    title="Delete Option"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={handleAddOption}
          className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-amber-50 text-slate-800 hover:text-amber-950 border border-slate-200 hover:border-amber-400 font-bold text-[11.5px] transition-all flex items-center gap-1.5 shadow-2xs self-end sm:self-auto active:scale-95"
        >
          <Plus className="w-3.5 h-3.5 text-amber-600" />
          <span>New Option Tier</span>
        </button>
      </div>

      {/* ── 3. Quick Bulk Meal Plan Bar ── */}
      <div className="flex items-center justify-between text-[11.5px] bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-amber-500/10 px-4 py-2.5 rounded-2xl border border-amber-200/80 flex-wrap gap-2">
        <span className="text-amber-950 font-bold flex items-center gap-1.5">
          <Utensils className="w-3.5 h-3.5 text-amber-600" />
          <span>Quick Apply Meal Plan to all stays in this tier:</span>
        </span>

        <div className="flex items-center gap-1.5 flex-wrap">
          {MEAL_PLANS.map((mp) => (
            <button
              key={mp.id}
              type="button"
              onClick={() => handleApplyMealPlanToAll(mp.id)}
              className="px-2.5 py-1 rounded-xl bg-white hover:bg-amber-50 text-slate-800 hover:text-amber-950 border border-slate-200 hover:border-amber-400 font-black text-[11px] shadow-2xs transition-all active:scale-95"
            >
              {mp.id} ({mp.title})
            </button>
          ))}
        </div>
      </div>

      {/* ── 4. Stay Cards with Independent Category Selection ── */}
      <div className="space-y-4">
        {currentStays.map((stay, idx) => {
          const stayNights = Math.max(1, parseInt(stay.nights, 10) || 1);
          const stayPrice = Number(stay.pricePerNight) || 0;
          const staySubtotal = stayPrice * stayNights * roomMultiplier;
          const activePlan = stay.mealPlan || "CP";

          return (
            <div
              key={idx}
              className="group relative bg-gradient-to-br from-slate-50 via-white to-amber-50/20 p-5 rounded-2xl border border-slate-200/90 hover:border-amber-300 transition-all shadow-2xs space-y-3.5"
            >
              {/* Top Row: Stay Pill, City, Nights Stepper, Category, Stars, Stay Total */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-900 font-mono font-black text-[11px] flex items-center justify-center">
                    {idx + 1}
                  </span>

                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                    Stay Leg {idx + 1}
                  </span>

                  {/* City Input */}
                  <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-xl border border-slate-200 shadow-2xs">
                    <MapPin className="w-3.5 h-3.5 text-amber-600" />
                    <input
                      type="text"
                      value={stay.cityName || ""}
                      onChange={(e) => handleStayChange(idx, "cityName", e.target.value)}
                      placeholder="Destination City"
                      className="bg-transparent text-[12.5px] font-black text-slate-900 focus:outline-none w-28"
                    />
                  </div>

                  {/* Nights Stepper */}
                  <div className="flex items-center border border-slate-200 rounded-xl bg-white text-[12px] font-black overflow-hidden shadow-2xs">
                    <button
                      type="button"
                      onClick={() => handleStayChange(idx, "nights", Math.max(1, stayNights - 1))}
                      className="px-2 py-1 hover:bg-amber-50 text-slate-700 transition-colors"
                    >
                      -
                    </button>
                    <span className="px-2.5 py-1 text-slate-900 font-mono">
                      {stayNights} Night{stayNights === 1 ? "" : "s"}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleStayChange(idx, "nights", stayNights + 1)}
                      className="px-2 py-1 hover:bg-amber-50 text-slate-700 transition-colors"
                    >
                      +
                    </button>
                  </div>

                  {/* Hotel Category Dropdown for this Specific Stay */}
                  <select
                    value={stay.category || "None"}
                    onChange={(e) => handleStayChange(idx, "category", e.target.value)}
                    className={`text-[11px] font-black px-2.5 py-1 rounded-xl border focus:outline-none shadow-2xs cursor-pointer ${getCategoryBadgeClass(stay.category || "None")}`}
                  >
                    {HOTEL_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>

                  {/* Stars */}
                  <div className="flex items-center text-amber-400 text-[13px] bg-white px-2 py-0.5 rounded-xl border border-slate-200 shadow-2xs">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => handleStayChange(idx, "starRating", s)}
                        className={s <= (stay.starRating || 3) ? "text-amber-400" : "text-slate-200"}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>

                {/* Stay Subtotal & Delete */}
                <div className="flex items-center gap-3 self-end sm:self-auto">
                  <div className="text-right">
                    <span className="text-[14px] font-black text-slate-900 font-mono bg-amber-50/80 px-2.5 py-1 rounded-xl border border-amber-200">
                      ₹{staySubtotal.toLocaleString("en-IN")}
                    </span>
                  </div>

                  {currentStays.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveStay(idx)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Delete Stay Leg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Middle Row: Selected Hotel Card & Smart Rate Finder Trigger Button */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    <h4 className="text-[14.5px] font-black text-slate-900 truncate">
                      {stay.hotelName || "No hotel selected (Click Find Rates)"}
                    </h4>
                  </div>
                  <p className="text-[11.5px] text-slate-500 flex items-center gap-2 flex-wrap font-medium">
                    <span>{stay.roomType || "Standard Room"}</span>
                    <span>•</span>
                    <span className="text-amber-800 font-bold">{activePlan} Plan ({MEAL_PLANS.find(p => p.id === activePlan)?.title || activePlan})</span>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenFinderDialog(idx)}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-slate-950 to-indigo-950 hover:from-slate-900 hover:to-indigo-900 text-white text-[12px] font-black flex items-center gap-2 transition-all hover:scale-105 active:scale-95 shadow-sm border border-indigo-900/50 flex-shrink-0"
                >
                  <Search className="w-3.5 h-3.5 text-amber-400" />
                  <span>Find Lowest Rates</span>
                </button>
              </div>

              {/* Meal Plan In-Line Tabs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {MEAL_PLANS.map((plan) => {
                  const isSel = activePlan === plan.id;
                  return (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => handleMealPlanChange(idx, plan.id)}
                      className={`p-2 rounded-xl border text-left text-[11.5px] transition-all flex items-center justify-between ${
                        isSel
                          ? "bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black shadow-xs border-amber-500 ring-2 ring-amber-500/20"
                          : "bg-white hover:bg-amber-50/50 border-slate-200 text-slate-700 font-bold hover:border-amber-300"
                      }`}
                    >
                      <div className="truncate">
                        <span className="block font-black">{plan.id}</span>
                        <span className={`block text-[10px] ${isSel ? "text-slate-900 font-bold" : "text-slate-400"}`}>
                          {plan.title}
                        </span>
                      </div>
                      {isSel && <Check className="w-3.5 h-3.5 text-slate-950 flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {/* Bottom Row: Rate per Night & Stay Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="relative">
                  <span className="text-amber-600 font-black text-[12px] absolute left-3 top-1/2 -translate-y-1/2">₹</span>
                  <input
                    type="number"
                    min={0}
                    value={stay.pricePerNight === 0 ? "" : stay.pricePerNight}
                    onChange={(e) => handleStayChange(idx, "pricePerNight", Math.max(0, parseFloat(e.target.value) || 0))}
                    placeholder="Rate per night (₹)"
                    className="w-full pl-8 pr-3 py-2 text-[13px] font-black rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 font-mono shadow-2xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>

                <div>
                  <input
                    type="text"
                    value={stay.notes || ""}
                    onChange={(e) => handleStayChange(idx, "notes", e.target.value)}
                    placeholder="Room preferences / extra bed / notes..."
                    className="w-full px-3.5 py-2 text-[12px] font-semibold rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 shadow-2xs text-slate-800"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── 5. Smart Hotel Rate Finder Dialog ── */}
      <HotelRateFinderDialog
        isOpen={dialogState.isOpen}
        onClose={() => setDialogState((p) => ({ ...p, isOpen: false }))}
        cityName={dialogState.cityName}
        category={dialogState.category}
        stayNights={dialogState.stayNights}
        startDate={startDate}
        totalRooms={totalRooms}
        currentMealPlan={dialogState.currentMealPlan}
        onSelectHotel={handleHotelSelected}
      />
    </div>
  );
}
