"use client";

import { useState, useMemo, useCallback } from "react";
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

function createDefaultStay(cityName = "", nights = 1, category = "Deluxe") {
  return {
    cityName: cityName || "",
    nights: Math.max(1, parseInt(nights, 10) || 1),
    hotelId: null,
    hotelName: "",
    category: category || "Deluxe",
    roomId: null,
    starRating: 3,
    roomType: "Deluxe AC Room",
    mealPlan: "CP",
    availableMealPlans: ["EP", "CP", "MAP", "AP"],
    pricePerNight: 0,
    notes: "",
  };
}

function createDefaultOption(label = "Standard Option", category = "Deluxe", defaultStays = []) {
  return {
    label,
    category,
    hotelStays: defaultStays.length > 0 ? defaultStays.map((s) => ({ ...s })) : [createDefaultStay("", 1, category)],
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
    category: "Deluxe",
    stayNights: 1,
    currentMealPlan: "CP",
  });

  // Options normalization
  const options = useMemo(() => {
    if (Array.isArray(propOptions) && propOptions.length > 0) {
      return propOptions;
    }
    if (Array.isArray(propStays) && propStays.length > 0) {
      return [createDefaultOption("Standard Option", "Deluxe", propStays)];
    }
    return [createDefaultOption("Standard Option", "Deluxe", [createDefaultStay(primaryDestination, totalNights, "Deluxe")])];
  }, [propOptions, propStays, primaryDestination, totalNights]);

  const safeOptIdx = Math.min(Math.max(0, activeOptIdx), Math.max(0, options.length - 1));
  const activeOption = options[safeOptIdx] || options[0];
  const currentStays = activeOption.hotelStays && activeOption.hotelStays.length > 0
    ? activeOption.hotelStays
    : [createDefaultStay(primaryDestination, totalNights, activeOption.category || "Deluxe")];

  const roomMultiplier = Math.max(1, parseInt(totalRooms, 10) || 1);

  // Total allocated nights
  const allocatedNights = useMemo(() => {
    return currentStays.reduce((sum, s) => sum + (Math.max(1, parseInt(s.nights, 10) || 1)), 0);
  }, [currentStays]);

  const nightsProgressPct = Math.min(100, Math.round((allocatedNights / Math.max(1, totalNights)) * 100));

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
    setDialogState({
      isOpen: true,
      stayIndex: idx,
      cityName: stay.cityName || primaryDestination,
      category: stay.category || activeOption.category || "Deluxe",
      stayNights: stay.nights || 1,
      currentMealPlan: stay.mealPlan || "CP",
    });
  }

  function handleHotelSelected(selectedData) {
    const idx = dialogState.stayIndex;
    const updated = currentStays.map((s, i) => {
      if (i === idx) {
        return {
          ...s,
          hotelId: selectedData.hotelId,
          hotelName: selectedData.hotelName,
          cityName: selectedData.cityName || s.cityName,
          category: selectedData.category || s.category,
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
    const newStay = createDefaultStay(lastCity, remainingNights, activeOption.category || "Deluxe");
    updateOptionStays([...currentStays, newStay]);
  }

  function handleRemoveStay(idx) {
    if (currentStays.length <= 1) return;
    const updated = currentStays.filter((_, i) => i !== idx);
    updateOptionStays(updated);
  }

  function handleAddOption() {
    const newIdx = options.length;
    const defaultLabels = ["Standard Tier", "Premium Tier", "Luxury Tier", "Budget Tier"];
    const label = defaultLabels[newIdx % defaultLabels.length] || `Option ${newIdx + 1}`;
    const cat = newIdx === 1 ? "Premium" : newIdx === 2 ? "Luxury" : "Deluxe";
    const newOption = createDefaultOption(label, cat, currentStays);
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
      label: `${source.label || `Option ${idx + 1}`} (Copy)`,
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
    <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-5">
      {/* ── 1. Minimalist Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center font-bold">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-[15px] font-bold text-slate-900 leading-tight">
              Accommodation &amp; Hotels
            </h3>
            <p className="text-[12px] text-slate-400 font-medium">
              Multi-tier hotel packages with real-time rate comparison
            </p>
          </div>
        </div>

        {/* Night Allocation Pill & Add Stay Button */}
        <div className="flex items-center gap-2">
          <div
            className={`px-2.5 py-1 rounded-xl text-[11.5px] font-bold flex items-center gap-1.5 border ${
              allocatedNights === totalNights
                ? "bg-emerald-50 text-emerald-700 border-emerald-200/80"
                : "bg-amber-50 text-amber-700 border-amber-200/80"
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
            className="px-3 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[11.5px] transition-colors flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Stay</span>
          </button>
        </div>
      </div>

      {/* Hairline Night Allocation Progress Bar */}
      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 rounded-full ${
            allocatedNights === totalNights ? "bg-emerald-500" : "bg-amber-500"
          }`}
          style={{ width: `${nightsProgressPct}%` }}
        />
      </div>

      {/* ── 2. Minimalist Option Tiers Segmented Tabs ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-1.5 rounded-2xl bg-slate-50 border border-slate-200/70">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
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
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] cursor-pointer transition-all ${
                  isAct
                    ? "bg-white text-slate-900 font-bold shadow-2xs border border-slate-200"
                    : "text-slate-500 hover:text-slate-800 hover:bg-white/50 font-medium"
                }`}
              >
                <span className={`w-4 h-4 rounded-md text-[10px] flex items-center justify-center font-bold ${
                  isAct ? "bg-slate-900 text-amber-400" : "bg-slate-200 text-slate-600"
                }`}>
                  {idx + 1}
                </span>

                <input
                  type="text"
                  value={opt.label || `Option ${idx + 1}`}
                  onChange={(e) => handleRenameOption(idx, e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  placeholder="Tier Name"
                  className="bg-transparent focus:outline-none text-[12px] font-bold w-28 truncate"
                />

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDuplicateOption(idx);
                  }}
                  className="p-0.5 text-slate-300 hover:text-slate-600"
                  title="Duplicate"
                >
                  <Copy className="w-3 h-3" />
                </button>

                {options.length > 1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveOption(idx);
                    }}
                    className="p-0.5 text-slate-300 hover:text-rose-600"
                    title="Delete"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={handleAddOption}
          className="px-2.5 py-1 text-[11px] font-bold text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition-colors flex items-center gap-1 self-end sm:self-auto"
        >
          <Plus className="w-3 h-3" />
          <span>New Option</span>
        </button>
      </div>

      {/* ── 3. Quick Bulk Meal Plan Bar ── */}
      <div className="flex items-center justify-between text-[11px] bg-slate-50/70 px-3.5 py-2 rounded-xl border border-slate-100 flex-wrap gap-2">
        <span className="text-slate-500 font-medium flex items-center gap-1">
          <Utensils className="w-3 h-3 text-amber-600" />
          <span>Apply to all stays in this tier:</span>
        </span>

        <div className="flex items-center gap-1">
          {MEAL_PLANS.map((mp) => (
            <button
              key={mp.id}
              type="button"
              onClick={() => handleApplyMealPlanToAll(mp.id)}
              className="px-2 py-0.5 rounded-md bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold transition-colors"
            >
              {mp.id} ({mp.title})
            </button>
          ))}
        </div>
      </div>

      {/* ── 4. Minimalist Stay Cards ── */}
      <div className="space-y-3">
        {currentStays.map((stay, idx) => {
          const stayNights = Math.max(1, parseInt(stay.nights, 10) || 1);
          const stayPrice = Number(stay.pricePerNight) || 0;
          const staySubtotal = stayPrice * stayNights * roomMultiplier;
          const activePlan = stay.mealPlan || "CP";

          return (
            <div
              key={idx}
              className="p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-slate-300 transition-all space-y-3"
            >
              {/* Top Row: Stay Pill, City, Nights Stepper, Category, Stars, Stay Total */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-slate-100">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded-md bg-slate-900 text-amber-400 font-mono font-bold text-[10.5px]">
                    Leg {idx + 1}
                  </span>

                  {/* City Input */}
                  <div className="flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-200">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    <input
                      type="text"
                      value={stay.cityName || ""}
                      onChange={(e) => handleStayChange(idx, "cityName", e.target.value)}
                      placeholder="Destination City"
                      className="bg-transparent text-[12px] font-bold text-slate-800 focus:outline-none w-28"
                    />
                  </div>

                  {/* Nights Stepper */}
                  <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50 text-[11.5px] font-bold overflow-hidden">
                    <button
                      type="button"
                      onClick={() => handleStayChange(idx, "nights", Math.max(1, stayNights - 1))}
                      className="px-1.5 py-0.5 hover:bg-slate-200 text-slate-600"
                    >
                      -
                    </button>
                    <span className="px-2 py-0.5 text-slate-800">
                      {stayNights}N
                    </span>
                    <button
                      type="button"
                      onClick={() => handleStayChange(idx, "nights", stayNights + 1)}
                      className="px-1.5 py-0.5 hover:bg-slate-200 text-slate-600"
                    >
                      +
                    </button>
                  </div>

                  {/* Category Dropdown */}
                  <select
                    value={stay.category || activeOption.category || "Deluxe"}
                    onChange={(e) => handleStayChange(idx, "category", e.target.value)}
                    className={`text-[10.5px] font-bold px-2 py-0.5 rounded-md border focus:outline-none ${getCategoryBadgeClass(stay.category || "Deluxe")}`}
                  >
                    {HOTEL_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>

                  {/* Stars */}
                  <div className="flex items-center text-amber-400 text-[11px]">
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
                <div className="flex items-center gap-2.5 self-end sm:self-auto">
                  <div className="text-right">
                    <span className="text-[13px] font-black text-slate-900 font-mono">
                      ₹{staySubtotal.toLocaleString("en-IN")}
                    </span>
                  </div>

                  {currentStays.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveStay(idx)}
                      className="p-1 rounded text-slate-300 hover:text-rose-600 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Middle Row: Selected Hotel Card & Smart Rate Finder Trigger Button */}
              <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5 min-w-0">
                  <h4 className="text-[13.5px] font-bold text-slate-900 truncate">
                    {stay.hotelName || "No hotel selected (Click find rates)"}
                  </h4>
                  <p className="text-[11px] text-slate-500 flex items-center gap-1.5 flex-wrap">
                    <span>{stay.roomType || "Standard Room"}</span>
                    <span>•</span>
                    <span className="text-amber-700 font-semibold">{activePlan} Plan</span>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenFinderDialog(idx)}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-[11.5px] font-bold flex items-center gap-1.5 transition-all shadow-2xs flex-shrink-0"
                >
                  <Search className="w-3 h-3 text-amber-400" />
                  <span>Find Lowest Rates</span>
                </button>
              </div>

              {/* Meal Plan In-Line Tabs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {MEAL_PLANS.map((plan) => {
                  const isSel = activePlan === plan.id;
                  return (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => handleMealPlanChange(idx, plan.id)}
                      className={`px-2.5 py-1.5 rounded-lg border text-left text-[11px] transition-all flex items-center justify-between ${
                        isSel
                          ? "bg-slate-900 border-slate-900 text-white font-bold shadow-2xs"
                          : "bg-white border-slate-200/80 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <span>{plan.id} • {plan.title}</span>
                      {isSel && <Check className="w-3 h-3 text-amber-400 flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {/* Bottom Row: Rate per Night & Stay Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-0.5">
                <div className="relative">
                  <span className="text-slate-400 font-bold text-[11px] absolute left-3 top-1/2 -translate-y-1/2">₹</span>
                  <input
                    type="number"
                    min={0}
                    value={stay.pricePerNight === 0 ? "" : stay.pricePerNight}
                    onChange={(e) => handleStayChange(idx, "pricePerNight", Math.max(0, parseFloat(e.target.value) || 0))}
                    placeholder="Rate per night"
                    className="w-full pl-7 pr-3 py-1.5 text-[12px] font-bold rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-slate-400 font-mono"
                  />
                </div>

                <div>
                  <input
                    type="text"
                    value={stay.notes || ""}
                    onChange={(e) => handleStayChange(idx, "notes", e.target.value)}
                    placeholder="Room preferences / notes..."
                    className="w-full px-3 py-1.5 text-[11.5px] font-medium rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-slate-400"
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
