"use client";

import { useState, useEffect } from "react";
import {
  IndianRupee, Percent, Calculator, Layers, Users, Car,
  Sparkles, CheckCircle2, AlertCircle, XCircle, Trash2, Plus, Check,
  Tag, Ticket, Timer, Clock, Flame, Zap, Copy, Calendar, AlertTriangle,
} from "lucide-react";

function getFutureDateTimeLocal(hours) {
  const d = new Date(Date.now() + hours * 60 * 60 * 1000);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function useTimerCountdown(targetDate) {
  const [timeLeft, setTimeLeft] = useState({ expired: false, days: 0, hours: 0, minutes: 0, seconds: 0, text: "" });

  useEffect(() => {
    if (!targetDate) {
      setTimeLeft({ expired: false, days: 0, hours: 0, minutes: 0, seconds: 0, text: "" });
      return;
    }
    const calculate = () => {
      const diff = +new Date(targetDate) - +new Date();
      if (diff <= 0) {
        setTimeLeft({ expired: true, days: 0, hours: 0, minutes: 0, seconds: 0, text: "Offer Expired" });
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / 1000 / 60) % 60);
      const seconds = Math.floor((diff / 1000) % 60);
      const text = `${days > 0 ? `${days}d ` : ""}${String(hours).padStart(2, "0")}h ${String(minutes).padStart(2, "0")}m ${String(seconds).padStart(2, "0")}s`;
      setTimeLeft({ expired: false, days, hours, minutes, seconds, text });
    };
    calculate();
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  return timeLeft;
}

const CURRENCIES = ["INR", "USD", "EUR", "GBP", "AED"];

const INCLUSION_PRESETS = [
  "Accommodation on CP (Daily Breakfast) basis",
  "Private AC vehicle for all transfers and sightseeing",
  "All fuel charges, toll taxes, parking fees & driver allowances",
  "Airport / Railway station pickup & drop transfers",
  "Assistance upon arrival and departure",
  "24x7 On-trip operations & concierge support",
  "Welcome drink on arrival (non-alcoholic)",
  "Interstate road permits & border vehicle taxes",
  "Complimentary hotel Wi-Fi access",
];

const EXCLUSION_PRESETS = [
  "Airfare / Train tickets",
  "Entry tickets to monuments, museums & national parks",
  "Personal expenses (laundry, room service, telephone)",
  "Lunch & Dinner (unless explicitly specified)",
  "Optional adventure activities & water sports",
  "Early check-in and late check-out charges",
  "Camera / Video fees at sightseeing points",
  "Guide / Tour escort services",
  "Travel insurance coverage",
];

/**
 * PricingPanel — Vibrant & High-Contrast Pricing Panel
 * Supports Rate Basis (Per Couple vs Per Person) & Optional GST Tax calculation.
 */
export default function PricingPanel({
  pricing: propPricing,
  value = {},
  onChange,
  onAccommodationOptionsChange,
  accommodationOptions = [],
  vehiclePeriods = [],
  vehicles = [],
  vehicle = {},
  vehicleTotal = 0,
  vehiclePrice = 0,
  activitiesTotal = 0,
  activityTotal = 0,
}) {
  const [selectedPeriodIdx, setSelectedPeriodIdx] = useState(0);
  const [selectedVehicleIdx, setSelectedVehicleIdx] = useState(0);
  const [newInclusion, setNewInclusion] = useState("");
  const [newExclusion, setNewExclusion] = useState("");

  const activePeriodsList = (Array.isArray(vehiclePeriods) && vehiclePeriods.length > 0)
    ? vehiclePeriods
    : [{
        name: "Standard Season",
        startDate: "",
        endDate: "",
        vehicles: (Array.isArray(vehicles) && vehicles.length > 0) ? vehicles : (vehicle?.vehicleType ? [vehicle] : []),
      }];

  const safePeriodIdx = Math.min(Math.max(0, selectedPeriodIdx), Math.max(0, activePeriodsList.length - 1));
  const currentPeriod = activePeriodsList[safePeriodIdx] || activePeriodsList[0];
  const currentPeriodVehicles = (currentPeriod?.vehicles && currentPeriod.vehicles.length > 0)
    ? currentPeriod.vehicles
    : ((Array.isArray(vehicles) && vehicles.length > 0) ? vehicles : (vehicle?.vehicleType ? [vehicle] : []));

  const currentPeriodTotal = currentPeriodVehicles.reduce(
    (sum, v) => sum + ((Number(v?.vehiclePrice ?? v?.price) || 0) * (parseInt(v?.quantity, 10) || 1)),
    0
  );

  // Determine active vehicle cost based on user selection
  const safeVehIdx = typeof selectedVehicleIdx === "number"
    ? Math.min(Math.max(0, selectedVehicleIdx), Math.max(0, currentPeriodVehicles.length - 1))
    : "all";

  const chosenVehicle = safeVehIdx !== "all" && currentPeriodVehicles[safeVehIdx]
    ? currentPeriodVehicles[safeVehIdx]
    : currentPeriodVehicles[0];

  const chosenVehicleSubtotal = chosenVehicle
    ? (Number(chosenVehicle.vehiclePrice ?? chosenVehicle.price) || 0) * (parseInt(chosenVehicle.quantity, 10) || 1)
    : 0;

  const inputPricing = propPricing || value || {};
  const vTotal = safeVehIdx === "all" ? currentPeriodTotal : (chosenVehicleSubtotal || vehicleTotal || vehiclePrice || 0);
  const actTotal = activitiesTotal || activityTotal || inputPricing.activitiesTotal || inputPricing.activityTotal || 0;

  const selectedIdx = Math.min(
    inputPricing.selectedOptionIndex || 0,
    Math.max(0, accommodationOptions.length - 1)
  );

  const selectedOption = accommodationOptions[selectedIdx];
  const activeMarginType = selectedOption?.marginType || "absolute";
  const activeMargin = selectedOption?.margin ?? 0;

  const pricing = {
    selectedOptionIndex: selectedIdx,
    selectedVehicleIndex: safeVehIdx,
    accommodationTotal: 0,
    vehicleTotal: vTotal,
    activitiesTotal: actTotal,
    activityTotal: actTotal,
    subtotal: 0,
    marginType: activeMarginType,
    margin: activeMargin,
    includeGst: Boolean(inputPricing.includeGst),
    gstPercentage: Number(inputPricing.gstPercentage) || 5,
    rateBasis: "per_couple",
    discountType: inputPricing.discountType || "fixed",
    discountValue: Number(inputPricing.discountValue !== undefined ? inputPricing.discountValue : (inputPricing.discountAmount || 0)),
    discountAmount: 0,
    discountReason: inputPricing.discountReason || "",
    couponCode: (inputPricing.couponCode || "").toUpperCase(),
    hasTimerDiscount: Boolean(inputPricing.hasTimerDiscount),
    discountValidUntil: inputPricing.discountValidUntil || "",
    finalPrice: 0,
    perPersonPrice: 0,
    perCouplePrice: 0,
    numberOfPersons: 2,
    currency: "INR",
    includes: [],
    excludes: [],
    ...inputPricing,
    marginType: activeMarginType,
    margin: activeMargin,
  };

  const timerStatus = useTimerCountdown(pricing.hasTimerDiscount ? pricing.discountValidUntil : null);

  const numPersons = Math.max(1, parseInt(pricing.numberOfPersons, 10) || 2);
  const autoRooms = Math.max(1, Math.ceil(numPersons / 2));
  const numRooms = pricing.numberOfRooms ? Math.max(1, parseInt(pricing.numberOfRooms, 10)) : autoRooms;

  const singleRoomAccomTotal = selectedOption
    ? (selectedOption.nights || []).reduce((s, n) => s + (n.pricePerNight || 0), 0)
    : 0;
  const baseAccomTotal = singleRoomAccomTotal * numRooms;

  const subtotal = baseAccomTotal + vTotal + actTotal;
  let marginAmount = 0;
  if (activeMarginType === "absolute") {
    marginAmount = activeMargin;
  } else {
    marginAmount = subtotal * (activeMargin / 100);
  }

  const preTaxTotal = subtotal + marginAmount;
  const includeGst = Boolean(pricing.includeGst);
  const gstPercentage = Number(pricing.gstPercentage) || 5;
  const liveGstAmount = includeGst ? Math.round((preTaxTotal * gstPercentage) / 100) : 0;
  const preDiscountTotal = preTaxTotal + liveGstAmount;

  const discountType = pricing.discountType || "fixed";
  const discountVal = Number(pricing.discountValue !== undefined ? pricing.discountValue : (pricing.discountAmount || 0));
  let calculatedDiscount = 0;
  if (discountType === "percentage") {
    calculatedDiscount = Math.round((preDiscountTotal * discountVal) / 100);
  } else {
    calculatedDiscount = discountVal;
  }
  const discountAmount = Math.min(preDiscountTotal, Math.max(0, calculatedDiscount));
  const rawFinalPrice = Math.max(0, preDiscountTotal - discountAmount);
  const finalPrice = Math.round(rawFinalPrice / 100) * 100;

  const perPersonPriceCalc = Math.round(finalPrice / numPersons);
  const perCouplePriceCalc = Math.round(perPersonPriceCalc * 2);

  useEffect(() => {
    if (
      pricing.accommodationTotal !== baseAccomTotal ||
      pricing.vehicleTotal !== vTotal ||
      pricing.activitiesTotal !== actTotal ||
      pricing.subtotal !== subtotal ||
      pricing.finalPrice !== finalPrice ||
      pricing.discountAmount !== discountAmount ||
      pricing.selectedOptionIndex !== selectedIdx ||
      pricing.marginType !== activeMarginType ||
      pricing.margin !== activeMargin ||
      pricing.perPersonPrice !== perPersonPriceCalc ||
      pricing.perCouplePrice !== perCouplePriceCalc ||
      pricing.numberOfRooms !== numRooms
    ) {
      onChange({
        ...pricing,
        selectedOptionIndex: selectedIdx,
        selectedVehicleIndex: safeVehIdx,
        accommodationTotal: baseAccomTotal,
        vehicleTotal: vTotal,
        activitiesTotal: actTotal,
        activityTotal: actTotal,
        subtotal,
        marginType: activeMarginType,
        margin: activeMargin,
        discountAmount,
        finalPrice,
        perPersonPrice: perPersonPriceCalc,
        perCouplePrice: perCouplePriceCalc,
        numberOfRooms: numRooms,
      });
    }
  }, [
    baseAccomTotal,
    vTotal,
    actTotal,
    subtotal,
    activeMargin,
    activeMarginType,
    pricing.numberOfPersons,
    pricing.discountType,
    pricing.discountValue,
    discountAmount,
    pricing.discountReason,
    pricing.couponCode,
    pricing.hasTimerDiscount,
    pricing.discountValidUntil,
    pricing.includeGst,
    pricing.gstPercentage,
    numRooms,
    selectedIdx,
    safeVehIdx,
    finalPrice,
    perPersonPriceCalc,
    perCouplePriceCalc,
  ]);

  function update(patch) {
    onChange({
      ...pricing,
      ...patch,
    });
  }

  function updateMargin(patch) {
    const newMarginType = patch.marginType !== undefined ? patch.marginType : activeMarginType;
    const newMargin = patch.margin !== undefined ? patch.margin : activeMargin;

    if (accommodationOptions.length > 0 && typeof onAccommodationOptionsChange === "function") {
      const updatedOptions = accommodationOptions.map((opt, i) => {
        if (i === selectedIdx) {
          return {
            ...opt,
            marginType: newMarginType,
            margin: newMargin,
          };
        }
        return opt;
      });
      onAccommodationOptionsChange(updatedOptions);
    }

    onChange({
      ...pricing,
      marginType: newMarginType,
      margin: newMargin,
    });
  }

  function selectOptionTier(idx) {
    const targetOption = accommodationOptions[idx];
    const targetMarginType = targetOption?.marginType || "absolute";
    const targetMargin = targetOption?.margin ?? 0;

    onChange({
      ...pricing,
      selectedOptionIndex: idx,
      marginType: targetMarginType,
      margin: targetMargin,
    });
  }

  const inputCls =
    "w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-[13.5px] font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all shadow-xs";

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200/80 bg-white p-7 shadow-xs space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-xs">
            <Calculator className="w-4.5 h-4.5" />
          </div>
          <div>
            <h3 className="text-[16px] font-extrabold text-slate-900">Cost & Margin Calculator</h3>
            <p className="text-[12.5px] text-slate-500">Choose accommodation option and vehicle to calculate exact package rates</p>
          </div>
        </div>

        {/* Accommodation Tier Selector */}
        {accommodationOptions.length > 0 && (
          <div className="p-4.5 rounded-2xl border border-indigo-100 bg-indigo-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[12px] font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600" />
                1. Select Accommodation Tier ({accommodationOptions.length} Options):
              </label>
              <span className="text-[11px] text-indigo-700 font-semibold">
                Click an option to calculate with its margin
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {accommodationOptions.map((opt, i) => {
                const optSingleAccom = (opt.nights || []).reduce((s, n) => s + (n.pricePerNight || 0), 0);
                const optBaseAccom = optSingleAccom * numRooms;
                const optSubtotal = optBaseAccom + vTotal + actTotal;
                const optMarginType = opt.marginType || "absolute";
                const optMargin = opt.margin || 0;
                const optMarginAmount = optMarginType === "absolute" ? optMargin : optSubtotal * (optMargin / 100);
                const optRawFinal = optSubtotal + optMarginAmount;
                const optFinal = Math.round(optRawFinal / 100) * 100;
                const isSelected = i === selectedIdx;

                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => selectOptionTier(i)}
                    className={`flex flex-col justify-between p-3.5 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? "bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700 border-indigo-600 text-white shadow-md shadow-indigo-500/20 scale-[1.01]"
                        : "bg-white border-slate-200/90 text-slate-800 hover:border-indigo-300 hover:bg-white/80"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className="text-[13px] font-black">{opt.label}</span>
                      {isSelected && (
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      )}
                    </div>

                    <div className="space-y-0.5 text-[11px]">
                      <div className="flex justify-between">
                        <span className={isSelected ? "text-indigo-200" : "text-slate-500"}>Base Accom:</span>
                        <span className="font-bold">₹{optBaseAccom.toLocaleString("en-IN")}{numRooms > 1 ? ` (${numRooms}R)` : ""}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className={isSelected ? "text-indigo-200" : "text-slate-500"}>
                          Margin ({optMarginType === "percentage" ? `${optMargin}%` : "₹"}):
                        </span>
                        <span className={`font-extrabold ${isSelected ? "text-emerald-300" : "text-emerald-700"}`}>
                          +₹{Math.round(optMarginAmount).toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 mt-2 border-t border-white/20 flex items-center justify-between">
                      <span className={`text-[10px] font-bold uppercase ${isSelected ? "text-indigo-200" : "text-slate-400"}`}>
                        Option Total
                      </span>
                      <span className="text-[14px] font-black">₹{optFinal.toLocaleString("en-IN")}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 2. Clickable Vehicle Option Selector */}
        {currentPeriodVehicles.length > 0 && (
          <div className="p-4.5 rounded-2xl border border-sky-100 bg-sky-50/50 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <label className="text-[12px] font-bold text-sky-900 uppercase tracking-wider flex items-center gap-2">
                <Car className="w-4 h-4 text-sky-600" />
                2. Select Vehicle Option ({currentPeriodVehicles.length} Available):
              </label>
              {activePeriodsList.length > 1 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10.5px] font-bold text-slate-500">Season:</span>
                  {activePeriodsList.map((p, pIdx) => (
                    <button
                      key={pIdx}
                      type="button"
                      onClick={() => {
                        setSelectedPeriodIdx(pIdx);
                        setSelectedVehicleIdx(0);
                      }}
                      className={`px-2.5 py-1 rounded-xl text-[11px] font-black border transition-all ${
                        safePeriodIdx === pIdx
                          ? "bg-sky-600 text-white border-sky-600 shadow-2xs"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {p.name || `Period ${pIdx + 1}`}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {currentPeriodVehicles.map((veh, vi) => {
                const qty = Math.max(1, parseInt(veh?.quantity, 10) || 1);
                const unitRate = Number(veh?.vehiclePrice ?? veh?.price) || 0;
                const rowTot = unitRate * qty;
                const isSelected = safeVehIdx === vi;

                return (
                  <button
                    key={vi}
                    type="button"
                    onClick={() => setSelectedVehicleIdx(vi)}
                    className={`flex flex-col justify-between p-3.5 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? "bg-gradient-to-br from-sky-600 via-sky-700 to-blue-700 border-sky-600 text-white shadow-md shadow-sky-500/20 scale-[1.01]"
                        : "bg-white border-slate-200/90 text-slate-800 hover:border-sky-300 hover:bg-white/80"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[13px] font-black">
                          {qty > 1 ? `${qty}x ` : ""}{veh?.vehicleType || "Sedan"}
                        </span>
                        {veh?.model && (
                          <span className={`text-[10.5px] font-bold px-1.5 py-0.5 rounded ${
                            isSelected ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                          }`}>
                            {veh.model}
                          </span>
                        )}
                      </div>
                      {isSelected && (
                        <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
                      )}
                    </div>

                    <div className="space-y-0.5 text-[11px] my-1">
                      <div className="flex justify-between">
                        <span className={isSelected ? "text-sky-100" : "text-slate-500"}>Rate:</span>
                        <span className="font-bold">₹{unitRate.toLocaleString("en-IN")} / cab</span>
                      </div>
                      <div className="flex justify-between">
                        <span className={isSelected ? "text-sky-100" : "text-slate-500"}>Capacity:</span>
                        <span className="font-bold">{veh?.seats || 4} Seats • {veh?.acType || "AC"}</span>
                      </div>
                    </div>

                    <div className="pt-2 mt-1 border-t border-white/20 flex items-center justify-between">
                      <span className={`text-[10px] font-bold uppercase ${isSelected ? "text-sky-100" : "text-slate-400"}`}>
                        Transport Cost
                      </span>
                      <span className="text-[14px] font-black">₹{rowTot.toLocaleString("en-IN")}</span>
                    </div>
                  </button>
                );
              })}

              {currentPeriodVehicles.length > 1 && (
                <button
                  type="button"
                  onClick={() => setSelectedVehicleIdx("all")}
                  className={`flex flex-col justify-between p-3.5 rounded-2xl border text-left transition-all ${
                    safeVehIdx === "all"
                      ? "bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 border-indigo-600 text-white shadow-md shadow-indigo-500/20 scale-[1.01]"
                      : "bg-white border-slate-200/90 text-slate-800 hover:border-indigo-300 hover:bg-white/80"
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="text-[13px] font-black">All Fleet Combined</span>
                    {safeVehIdx === "all" && (
                      <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
                    )}
                  </div>
                  <p className={`text-[11px] my-1 ${safeVehIdx === "all" ? "text-indigo-100" : "text-slate-500"}`}>
                    Total for all {currentPeriodVehicles.length} cabs
                  </p>
                  <div className="pt-2 mt-1 border-t border-white/20 flex items-center justify-between">
                    <span className={`text-[10px] font-bold uppercase ${safeVehIdx === "all" ? "text-indigo-100" : "text-slate-400"}`}>
                      Combined Total
                    </span>
                    <span className="text-[14px] font-black">₹{currentPeriodTotal.toLocaleString("en-IN")}</span>
                  </div>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Financial Breakdown Table */}
        <div className="rounded-2xl border border-slate-200/80 overflow-hidden divide-y divide-slate-100 text-[13.5px] shadow-xs">
          {accommodationOptions.length > 0 && (
            <div className="flex items-center justify-between px-5 py-3.5 bg-violet-50/40">
              <span className="text-slate-700 font-semibold flex items-center gap-2">
                🏨 Accommodation ({selectedOption?.label || "Option 1"})
                {numRooms > 1 && (
                  <span className="text-[11px] font-bold text-violet-700 bg-violet-100 px-2 py-0.5 rounded-full">
                    {numRooms} Rooms
                  </span>
                )}
              </span>
              <div className="text-right">
                <span className="font-extrabold text-slate-900">₹{baseAccomTotal.toLocaleString("en-IN")}</span>
                {numRooms > 1 && (
                  <span className="block text-[10.5px] text-slate-400 font-medium">
                    (₹{singleRoomAccomTotal.toLocaleString("en-IN")} × {numRooms} rooms)
                  </span>
                )}
              </div>
            </div>
          )}
          <div className="flex items-center justify-between px-5 py-3.5 bg-sky-50/40">
            <span className="text-slate-700 font-semibold flex items-center gap-2">
              🚗 Vehicle Transport ({safeVehIdx === "all" ? "All Fleet" : (chosenVehicle?.vehicleType || "Sedan")})
            </span>
            <span className="font-extrabold text-slate-900">₹{vTotal.toLocaleString("en-IN")}</span>
          </div>
          {actTotal > 0 && (
            <div className="flex items-center justify-between px-5 py-3.5 bg-rose-50/40">
              <span className="text-slate-700 font-semibold flex items-center gap-2">
                ⚡ Day Activities Cost
                <span className="text-[11px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
                  Included in Itinerary
                </span>
              </span>
              <span className="font-extrabold text-slate-900">₹{actTotal.toLocaleString("en-IN")}</span>
            </div>
          )}
          <div className="flex items-center justify-between px-5 py-3.5 bg-slate-100 font-extrabold border-t border-slate-200">
            <span className="text-slate-900">Subtotal Base Cost</span>
            <span className="text-slate-900 text-[15px]">₹{subtotal.toLocaleString("en-IN")}</span>
          </div>
          <div className="flex items-center justify-between px-5 py-3.5 bg-amber-50/60">
            <span className="text-amber-900 font-bold">
              📈 Profit Margin ({pricing.marginType === "percentage" ? `${pricing.margin}%` : "Absolute"})
            </span>
            <span className="font-extrabold text-amber-700 text-[14.5px]">+ ₹{Math.round(marginAmount).toLocaleString("en-IN")}</span>
          </div>
          {includeGst && (
            <div className="flex items-center justify-between px-5 py-3.5 bg-indigo-50/50">
              <span className="text-indigo-900 font-bold flex items-center gap-1.5">
                🏛️ Goods &amp; Services Tax (GST {gstPercentage}%)
              </span>
              <span className="font-extrabold text-indigo-700 text-[14.5px]">+ ₹{liveGstAmount.toLocaleString("en-IN")}</span>
            </div>
          )}
          {discountAmount > 0 && (
            <div className="flex items-center justify-between px-5 py-3.5 bg-rose-50/70 border-l-4 border-rose-500">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-rose-900 font-bold flex items-center gap-1.5">
                  <Percent className="w-4 h-4 text-rose-600" />
                  Special Discount {pricing.discountReason ? `(${pricing.discountReason})` : ""}
                </span>
                {pricing.couponCode && (
                  <span className="px-2 py-0.5 rounded-md bg-rose-200 text-rose-950 font-black text-[10.5px] font-mono flex items-center gap-1 border border-rose-300">
                    <Ticket className="w-3 h-3 text-rose-700" />
                    {pricing.couponCode}
                  </span>
                )}
                {pricing.hasTimerDiscount && (
                  <span className="px-2 py-0.5 rounded-md bg-amber-200 text-amber-950 font-black text-[10.5px] flex items-center gap-1 border border-amber-300 animate-pulse">
                    <Flame className="w-3 h-3 text-amber-700" />
                    Flash Deal
                  </span>
                )}
              </div>
              <span className="font-black text-rose-700 text-[14.5px]">- ₹{discountAmount.toLocaleString("en-IN")}</span>
            </div>
          )}
          <div className="px-5 py-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <span className="font-black text-[16px]">Grand Package Total</span>
                <span className="text-[10.5px] font-extrabold bg-white/20 px-2.5 py-0.5 rounded-full text-emerald-100 border border-white/20">
                  Rounded to nearest ₹100
                </span>
              </div>
              <span className="font-black text-[22px]">₹{finalPrice.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-white/20 flex-wrap gap-2 text-[12px]">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-emerald-100 font-semibold">
                  Retail Rates:
                </span>
                <span className="bg-white/15 px-2.5 py-0.5 rounded-lg font-black text-white">
                  ₹{perPersonPriceCalc.toLocaleString("en-IN")} / Person ({numPersons} Pax)
                </span>
                <span className="bg-white/15 px-2.5 py-0.5 rounded-lg font-black text-white">
                  ₹{perCouplePriceCalc.toLocaleString("en-IN")} / Couple
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing Configuration Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
          {/* Card 1: Currency & Guest Capacity */}
          <div className="p-4 rounded-2xl border border-slate-200/90 bg-white shadow-2xs space-y-3.5">
            <div>
              <label className="block text-[11.5px] font-black text-slate-700 uppercase tracking-wider mb-1.5">
                Currency
              </label>
              <select
                value={pricing.currency}
                onChange={(e) => update({ currency: e.target.value })}
                className={inputCls}
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11.5px] font-black text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>Pricing Basis (Pax Count)</span>
                <span className="text-[11px] font-extrabold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                  {numPersons === 2 ? "Per Couple (2 Guests)" : `${numPersons} Guests`}
                </span>
              </label>
              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200 shadow-2xs flex-1 min-w-[140px]">
                  <button
                    type="button"
                    onClick={() => update({ numberOfPersons: Math.max(1, numPersons - 1) })}
                    disabled={numPersons <= 1}
                    className="w-8 h-8 rounded-lg hover:bg-white disabled:opacity-20 flex items-center justify-center font-black text-[15px] text-slate-700 transition-all shadow-2xs"
                    title="Decrease Pax"
                  >
                    -
                  </button>
                  <div className="flex items-center justify-center flex-1">
                    <Users className="w-3.5 h-3.5 text-indigo-600 mr-1.5" />
                    <span className="font-black text-[13px] text-slate-900">{numPersons} Pax</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => update({ numberOfPersons: Math.min(50, numPersons + 1) })}
                    className="w-8 h-8 rounded-lg hover:bg-white flex items-center justify-center font-black text-[15px] text-slate-700 transition-all shadow-2xs"
                    title="Increase Pax"
                  >
                    +
                  </button>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {[2, 4, 6, 8].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => update({ numberOfPersons: p })}
                      className={`px-2.5 py-1.5 rounded-xl text-[11px] font-black border transition-all ${
                        numPersons === p
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-2xs"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {p}P
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Room Multiplier Stepper */}
            <div>
              <label className="block text-[11.5px] font-black text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>Rooms Multiplier</span>
                <span className="text-[11px] font-bold text-slate-500">
                  {numRooms === autoRooms ? `Auto: ${autoRooms} Room${autoRooms > 1 ? "s" : ""}` : `Manual: ${numRooms} Room${numRooms > 1 ? "s" : ""}`}
                </span>
              </label>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200 shadow-2xs flex-1 min-w-[140px]">
                  <button
                    type="button"
                    onClick={() => update({ numberOfRooms: Math.max(1, numRooms - 1) })}
                    disabled={numRooms <= 1}
                    className="w-8 h-8 rounded-lg hover:bg-white disabled:opacity-20 flex items-center justify-center font-black text-[15px] text-slate-700 transition-all shadow-2xs"
                    title="Decrease Rooms"
                  >
                    -
                  </button>
                  <div className="flex items-center justify-center flex-1">
                    <span className="text-[13px] mr-1.5">🏨</span>
                    <span className="font-black text-[13px] text-slate-900">{numRooms} Room{numRooms > 1 ? "s" : ""}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => update({ numberOfRooms: Math.min(25, numRooms + 1) })}
                    className="w-8 h-8 rounded-lg hover:bg-white flex items-center justify-center font-black text-[15px] text-slate-700 transition-all shadow-2xs"
                    title="Increase Rooms"
                  >
                    +
                  </button>
                </div>
                {pricing.numberOfRooms && pricing.numberOfRooms !== autoRooms && (
                  <button
                    type="button"
                    onClick={() => update({ numberOfRooms: null })}
                    className="px-2.5 py-2 rounded-xl text-[10.5px] font-bold border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-all flex-shrink-0"
                    title="Reset to Auto (Math.ceil(Pax / 2))"
                  >
                    Reset Auto ({autoRooms}R)
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Card 2: Profit Margin Configuration */}
          <div className="p-4 rounded-2xl border border-slate-200/90 bg-white shadow-2xs space-y-3.5">
            <div>
              <label className="block text-[11.5px] font-black text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>Profit Margin Type</span>
                {selectedOption?.label && (
                  <span className="text-[10.5px] font-semibold text-indigo-600 truncate max-w-[120px]">({selectedOption.label})</span>
                )}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => updateMargin({ marginType: "absolute" })}
                  className={`py-2.5 px-3 rounded-xl border text-[12.5px] font-black transition-all flex items-center justify-center gap-1.5 ${
                    pricing.marginType === "absolute"
                      ? "bg-slate-900 border-slate-900 text-white shadow-xs"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <IndianRupee className="w-3.5 h-3.5" />
                  Absolute (₹)
                </button>
                <button
                  type="button"
                  onClick={() => updateMargin({ marginType: "percentage" })}
                  className={`py-2.5 px-3 rounded-xl border text-[12.5px] font-black transition-all flex items-center justify-center gap-1.5 ${
                    pricing.marginType === "percentage"
                      ? "bg-slate-900 border-slate-900 text-white shadow-xs"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <Percent className="w-3.5 h-3.5" />
                  Percentage (%)
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[11.5px] font-black text-slate-700 uppercase tracking-wider mb-1.5">
                Margin Value {pricing.marginType === "percentage" ? "(%)" : "(₹)"}
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[14px] font-bold text-slate-400">
                  {pricing.marginType === "percentage" ? "%" : "₹"}
                </span>
                <input
                  type="number"
                  min={0}
                  value={pricing.margin === 0 ? "" : pricing.margin}
                  onWheel={(e) => e.target.blur()}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "") {
                      updateMargin({ margin: 0 });
                    } else {
                      const parsed = parseFloat(val);
                      updateMargin({ margin: isNaN(parsed) ? 0 : parsed });
                    }
                  }}
                  placeholder="0"
                  className={`${inputCls} pl-9 font-bold`}
                />
              </div>
              {/* Quick Presets */}
              <div className="flex items-center gap-1.5 pt-1.5 flex-wrap">
                <span className="text-[10px] font-bold text-slate-400 mr-0.5">Quick:</span>
                {pricing.marginType === "percentage" ? (
                  [10, 15, 20, 25].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => updateMargin({ margin: pct })}
                      className={`px-2 py-0.5 rounded-md text-[10.5px] font-black border transition-all ${
                        pricing.margin === pct
                          ? "bg-amber-500 text-white border-amber-500 shadow-2xs"
                          : "bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200"
                      }`}
                    >
                      +{pct}%
                    </button>
                  ))
                ) : (
                  [2000, 5000, 10000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => updateMargin({ margin: amt })}
                      className={`px-2 py-0.5 rounded-md text-[10.5px] font-black border transition-all ${
                        pricing.margin === amt
                          ? "bg-amber-500 text-white border-amber-500 shadow-2xs"
                          : "bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200"
                      }`}
                    >
                      +₹{(amt / 1000)}k
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Card 3: 🏷️ Discounts, Coupons & Flash Timer */}
          <div className="p-4 rounded-2xl border-2 border-rose-200/90 bg-gradient-to-br from-rose-50/60 via-white to-amber-50/30 shadow-2xs space-y-3.5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <label className="text-[12px] font-black text-rose-950 uppercase tracking-wider flex items-center gap-1.5">
                <Tag className="w-4 h-4 text-rose-600" />
                <span>Discounts &amp; Offers</span>
              </label>
              {discountAmount > 0 && (
                <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200 font-mono">
                  -₹{discountAmount.toLocaleString("en-IN")} Off
                </span>
              )}
            </div>

            {/* Mode Switcher: Fixed ₹ vs Percentage % */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => update({ discountType: "fixed" })}
                className={`py-2 px-3 rounded-xl border text-[12px] font-black transition-all flex items-center justify-center gap-1.5 ${
                  (pricing.discountType || "fixed") === "fixed"
                    ? "bg-rose-600 border-rose-600 text-white shadow-xs"
                    : "bg-white border-rose-200 text-rose-900 hover:bg-rose-50"
                }`}
              >
                <IndianRupee className="w-3.5 h-3.5" />
                Flat Discount (₹)
              </button>
              <button
                type="button"
                onClick={() => update({ discountType: "percentage" })}
                className={`py-2 px-3 rounded-xl border text-[12px] font-black transition-all flex items-center justify-center gap-1.5 ${
                  pricing.discountType === "percentage"
                    ? "bg-rose-600 border-rose-600 text-white shadow-xs"
                    : "bg-white border-rose-200 text-rose-900 hover:bg-rose-50"
                }`}
              >
                <Percent className="w-3.5 h-3.5" />
                Percentage (%)
              </button>
            </div>

            {/* Discount Value Input */}
            <div className="space-y-1.5">
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[14px] font-black text-rose-600">
                  {pricing.discountType === "percentage" ? "%" : "₹"}
                </span>
                <input
                  type="number"
                  min={0}
                  max={pricing.discountType === "percentage" ? 100 : undefined}
                  value={discountVal === 0 ? "" : discountVal}
                  onWheel={(e) => e.target.blur()}
                  onChange={(e) => {
                    const val = e.target.value;
                    const parsed = parseFloat(val);
                    const safeNum = isNaN(parsed) ? 0 : Math.max(0, parsed);
                    update({ discountValue: safeNum, discountAmount: safeNum });
                  }}
                  placeholder={pricing.discountType === "percentage" ? "Enter % Off (e.g. 10)" : "0 (Enter Discount Amount in ₹)"}
                  className={`${inputCls} pl-8 font-black text-rose-950 font-mono border-rose-200 focus:border-rose-500 focus:ring-rose-500/20`}
                />
              </div>

              {/* Quick Presets */}
              <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                {pricing.discountType === "percentage" ? (
                  [5, 10, 15, 20, 25].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => update({ discountValue: pct, discountAmount: pct })}
                      className={`px-2 py-0.5 rounded-lg text-[10.5px] font-bold border transition-all ${
                        discountVal === pct
                          ? "bg-rose-600 text-white border-rose-700 font-black shadow-2xs"
                          : "bg-white hover:bg-rose-50 text-rose-900 border-rose-200"
                      }`}
                    >
                      -{pct}%
                    </button>
                  ))
                ) : (
                  [1000, 2000, 3000, 5000, 10000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => update({ discountValue: amt, discountAmount: amt })}
                      className={`px-2 py-0.5 rounded-lg text-[10.5px] font-bold border transition-all ${
                        discountVal === amt
                          ? "bg-rose-600 text-white border-rose-700 font-black shadow-2xs"
                          : "bg-white hover:bg-rose-50 text-rose-900 border-rose-200"
                      }`}
                    >
                      -₹{amt >= 1000 ? `${amt / 1000}k` : amt}
                    </button>
                  ))
                )}
                {discountVal > 0 && (
                  <button
                    type="button"
                    onClick={() => update({ discountValue: 0, discountAmount: 0 })}
                    className="px-2 py-0.5 rounded-lg text-[10.5px] font-bold bg-slate-100 hover:bg-rose-100 text-slate-600 hover:text-rose-800 border border-slate-200"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* 🎟️ Coupon Code Field */}
            <div className="pt-2 border-t border-rose-100 space-y-1.5">
              <label className="block text-[11px] font-black text-rose-950 uppercase tracking-wider flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Ticket className="w-3.5 h-3.5 text-rose-600" />
                  Promo / Coupon Code (Optional)
                </span>
                {pricing.couponCode && (
                  <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Active: {pricing.couponCode}
                  </span>
                )}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={pricing.couponCode || ""}
                  onChange={(e) => update({ couponCode: e.target.value.toUpperCase() })}
                  placeholder="e.g. SUMMER20, EARLYBIRD, HOLIDAY10"
                  className="w-full px-3 py-2 rounded-xl border border-rose-200 bg-white text-[12px] font-mono font-black text-slate-900 uppercase tracking-wider placeholder:normal-case placeholder:font-normal placeholder:tracking-normal focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                />
                {pricing.couponCode && (
                  <button
                    type="button"
                    onClick={() => update({ couponCode: "" })}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-600 text-[11px] font-bold"
                  >
                    ×
                  </button>
                )}
              </div>

              {/* Quick Coupon Presets */}
              <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                <span className="text-[10px] font-bold text-slate-400">Presets:</span>
                {[
                  { code: "EARLYBIRD", reason: "Early Bird Booking Offer", type: "percentage", val: 10 },
                  { code: "SUMMER20", reason: "Summer Vacation Deal", type: "percentage", val: 20 },
                  { code: "FESTIVE5K", reason: "Special Festive Discount", type: "fixed", val: 5000 },
                  { code: "WEEKENDDEAL", reason: "Weekend Getaway Deal", type: "fixed", val: 2000 },
                ].map((c) => (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() =>
                      update({
                        couponCode: c.code,
                        discountReason: c.reason,
                        discountType: c.type,
                        discountValue: c.val,
                        discountAmount: c.val,
                      })
                    }
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold font-mono border transition-all ${
                      pricing.couponCode === c.code
                        ? "bg-rose-600 text-white border-rose-700 font-black shadow-2xs"
                        : "bg-white hover:bg-rose-50 text-rose-900 border-rose-200"
                    }`}
                  >
                    {c.code}
                  </button>
                ))}
              </div>
            </div>

            {/* ⏱️ Limited Time / Countdown Timer Discount */}
            <div className="pt-2 border-t border-rose-100 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-black text-rose-950 uppercase tracking-wider flex items-center gap-1.5 cursor-pointer">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span>Countdown Timer Discount</span>
                </label>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(pricing.hasTimerDiscount)}
                    onChange={(e) => {
                      const enabled = e.target.checked;
                      update({
                        hasTimerDiscount: enabled,
                        discountValidUntil: enabled && !pricing.discountValidUntil ? getFutureDateTimeLocal(72) : pricing.discountValidUntil,
                      });
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
                </label>
              </div>

              {pricing.hasTimerDiscount && (
                <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200 space-y-2.5">
                  <div>
                    <label className="block text-[10.5px] font-extrabold text-amber-950 mb-1 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-amber-700" />
                        Offer Valid Until (Date &amp; Time)
                      </span>
                      <span className="text-[10px] text-amber-700 font-bold">Auto-expires after time</span>
                    </label>
                    <input
                      type="datetime-local"
                      value={pricing.discountValidUntil || ""}
                      onChange={(e) => update({ discountValidUntil: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg border border-amber-300 bg-white text-[12px] font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    />
                  </div>

                  {/* Expiry Presets */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[9.5px] font-bold text-amber-800">Presets:</span>
                    {[
                      { label: "+24 Hours", hours: 24 },
                      { label: "+3 Days", hours: 72 },
                      { label: "+7 Days", hours: 168 },
                      { label: "+14 Days", hours: 336 },
                    ].map((p) => (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() => update({ discountValidUntil: getFutureDateTimeLocal(p.hours) })}
                        className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white text-amber-900 border border-amber-300 hover:bg-amber-100 transition-all"
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>

                  {/* Live Timer Preview Badge */}
                  {pricing.discountValidUntil && (
                    <div className="pt-1.5 border-t border-amber-200/80 flex items-center justify-between">
                      <span className="text-[10.5px] font-extrabold text-amber-950 flex items-center gap-1">
                        <Flame className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
                        Live Timer Preview:
                      </span>
                      <span
                        className={`text-[11px] font-black px-2.5 py-0.5 rounded-full font-mono border ${
                          timerStatus.expired
                            ? "bg-rose-100 text-rose-800 border-rose-300"
                            : "bg-amber-100 text-amber-900 border-amber-300"
                        }`}
                      >
                        {timerStatus.expired ? "⚠️ Offer Expired" : `⏳ ${timerStatus.text}`}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Discount Reason */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Discount Reason / Offer Tag (Optional)
              </label>
              <input
                type="text"
                value={pricing.discountReason || ""}
                onChange={(e) => update({ discountReason: e.target.value })}
                placeholder="e.g. Early Bird Offer, Seasonal Deal, Group Discount"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-[12px] font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              />

              {/* Quick Offer Tags */}
              <div className="flex items-center gap-1.5 flex-wrap pt-1.5">
                {["Early Bird Offer", "Festival Deal", "Special Group Discount", "Corporate Deal", "Limited Flash Sale"].map((reason) => (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => update({ discountReason: reason })}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition-all ${
                      pricing.discountReason === reason
                        ? "bg-rose-100 text-rose-900 border-rose-300 font-black"
                        : "bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200"
                    }`}
                  >
                    {reason}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Package Inclusions & Exclusions Section ── */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-[14.5px] font-black text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                Package Inclusions &amp; Exclusions
              </h3>
              <p className="text-[11.5px] text-slate-400 font-medium mt-0.5">
                Included services vs client out-of-pocket expenses for this package
              </p>
            </div>
            <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
              {(pricing.includes || []).length} Included • {(pricing.excludes || []).length} Excluded
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* INCLUSIONS */}
            <div className="space-y-3 p-4 rounded-xl bg-emerald-50/40 border border-emerald-100">
              <div className="flex items-center justify-between">
                <span className="text-[12.5px] font-black text-emerald-950 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  What's Included ({(pricing.includes || []).length})
                </span>
              </div>

              {/* 1-Click Presets */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">Quick Presets:</span>
                <div className="flex flex-wrap gap-1">
                  {INCLUSION_PRESETS.map((p) => {
                    const exists = (pricing.includes || []).includes(p);
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => {
                          const list = pricing.includes || [];
                          const updated = exists ? list.filter((x) => x !== p) : [...list, p];
                          update({ includes: updated });
                        }}
                        className={`text-[10.5px] font-bold px-2 py-0.5 rounded-md border transition-all ${
                          exists
                            ? "bg-emerald-600 text-white border-emerald-700 shadow-2xs"
                            : "bg-white text-emerald-900 border-emerald-200 hover:bg-emerald-100"
                        }`}
                      >
                        {exists ? "✓ " : "+ "}{p.length > 25 ? `${p.slice(0, 25)}…` : p}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Inclusions List */}
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {(pricing.includes || []).map((inc, i) => (
                  <div key={i} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-white border border-emerald-200/70 text-[12px] font-semibold text-slate-800 shadow-2xs">
                    <span className="truncate flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                      {inc}
                    </span>
                    <button
                      type="button"
                      onClick={() => update({ includes: (pricing.includes || []).filter((_, idx) => idx !== i) })}
                      className="text-slate-400 hover:text-rose-600 p-0.5 rounded transition-colors flex-shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Custom Add */}
              <div className="flex gap-1.5 pt-1">
                <input
                  type="text"
                  value={newInclusion}
                  onChange={(e) => setNewInclusion(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (newInclusion.trim()) {
                        update({ includes: [...(pricing.includes || []), newInclusion.trim()] });
                        setNewInclusion("");
                      }
                    }
                  }}
                  placeholder="Add custom inclusion..."
                  className="flex-1 px-3 py-1.5 text-[12px] rounded-lg border border-emerald-200 bg-white focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newInclusion.trim()) {
                      update({ includes: [...(pricing.includes || []), newInclusion.trim()] });
                      setNewInclusion("");
                    }
                  }}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold"
                >
                  Add
                </button>
              </div>
            </div>

            {/* EXCLUSIONS */}
            <div className="space-y-3 p-4 rounded-xl bg-rose-50/40 border border-rose-100">
              <div className="flex items-center justify-between">
                <span className="text-[12.5px] font-black text-rose-950 flex items-center gap-1.5">
                  <XCircle className="w-4 h-4 text-rose-600" />
                  What's Excluded ({(pricing.excludes || []).length})
                </span>
              </div>

              {/* 1-Click Presets */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800">Quick Presets:</span>
                <div className="flex flex-wrap gap-1">
                  {EXCLUSION_PRESETS.map((p) => {
                    const exists = (pricing.excludes || []).includes(p);
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => {
                          const list = pricing.excludes || [];
                          const updated = exists ? list.filter((x) => x !== p) : [...list, p];
                          update({ excludes: updated });
                        }}
                        className={`text-[10.5px] font-bold px-2 py-0.5 rounded-md border transition-all ${
                          exists
                            ? "bg-rose-600 text-white border-rose-700 shadow-2xs"
                            : "bg-white text-rose-900 border-rose-200 hover:bg-rose-100"
                        }`}
                      >
                        {exists ? "✓ " : "+ "}{p.length > 25 ? `${p.slice(0, 25)}…` : p}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Exclusions List */}
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {(pricing.excludes || []).map((exc, i) => (
                  <div key={i} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-white border border-rose-200/70 text-[12px] font-semibold text-slate-800 shadow-2xs">
                    <span className="truncate flex items-center gap-1.5">
                      <XCircle className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />
                      {exc}
                    </span>
                    <button
                      type="button"
                      onClick={() => update({ excludes: (pricing.excludes || []).filter((_, idx) => idx !== i) })}
                      className="text-slate-400 hover:text-rose-600 p-0.5 rounded transition-colors flex-shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Custom Add */}
              <div className="flex gap-1.5 pt-1">
                <input
                  type="text"
                  value={newExclusion}
                  onChange={(e) => setNewExclusion(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (newExclusion.trim()) {
                        update({ excludes: [...(pricing.excludes || []), newExclusion.trim()] });
                        setNewExclusion("");
                      }
                    }
                  }}
                  placeholder="Add custom exclusion..."
                  className="flex-1 px-3 py-1.5 text-[12px] rounded-lg border border-rose-200 bg-white focus:outline-none focus:border-rose-500"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newExclusion.trim()) {
                      update({ excludes: [...(pricing.excludes || []), newExclusion.trim()] });
                      setNewExclusion("");
                    }
                  }}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[11px] font-bold"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
