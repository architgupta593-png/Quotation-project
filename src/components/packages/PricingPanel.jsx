"use client";

import { useState, useEffect } from "react";
import {
  IndianRupee, Plus, Trash2, Percent, Calculator, Layers, CheckCircle2, XCircle, Users, HeartHandshake, Receipt, Car,
} from "lucide-react";

const CURRENCIES = ["INR", "USD", "EUR", "GBP", "AED"];

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
    subtotal: 0,
    marginType: activeMarginType,
    margin: activeMargin,
    includeGst: false,
    gstPercentage: 5,
    rateBasis: "per_couple",
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

  const [newInclude, setNewInclude] = useState("");
  const [newExclude, setNewExclude] = useState("");

  const baseAccomTotal = selectedOption
    ? (selectedOption.nights || []).reduce((s, n) => s + (n.pricePerNight || 0), 0)
    : 0;

  const subtotal = baseAccomTotal + vTotal + actTotal;
  let marginAmount = 0;
  if (activeMarginType === "absolute") {
    marginAmount = activeMargin;
  } else {
    marginAmount = subtotal * (activeMargin / 100);
  }

  const preTaxTotal = subtotal + marginAmount;
  const gstAmount = pricing.includeGst ? Math.round(preTaxTotal * ((pricing.gstPercentage || 5) / 100)) : 0;
  const discountAmount = pricing.discountAmount || 0;
  const rawFinalPrice = Math.max(0, preTaxTotal + gstAmount - discountAmount);
  const finalPrice = Math.round(rawFinalPrice / 100) * 100;

  useEffect(() => {
    if (
      pricing.accommodationTotal !== baseAccomTotal ||
      pricing.vehicleTotal !== vTotal ||
      pricing.activitiesTotal !== actTotal ||
      pricing.subtotal !== subtotal ||
      pricing.finalPrice !== finalPrice ||
      pricing.selectedOptionIndex !== selectedIdx ||
      pricing.marginType !== activeMarginType ||
      pricing.margin !== activeMargin
    ) {
      const numPersons = Math.max(1, parseInt(pricing.numberOfPersons, 10) || 2);
      const perPersonPriceCalc = Math.round(finalPrice / numPersons);
      const perCouplePriceCalc = Math.round(perPersonPriceCalc * 2);
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
        finalPrice,
        perPersonPrice: perPersonPriceCalc,
        perCouplePrice: perCouplePriceCalc,
      });
    }
  }, [
    baseAccomTotal,
    vTotal,
    actTotal,
    subtotal,
    activeMargin,
    activeMarginType,
    pricing.includeGst,
    pricing.gstPercentage,
    pricing.numberOfPersons,
    pricing.discountAmount,
    selectedIdx,
    safeVehIdx,
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
                const optBaseAccom = (opt.nights || []).reduce((s, n) => s + (n.pricePerNight || 0), 0);
                const optSubtotal = optBaseAccom + vTotal + actTotal;
                const optMarginType = opt.marginType || "absolute";
                const optMargin = opt.margin || 0;
                const optMarginAmount = optMarginType === "absolute" ? optMargin : optSubtotal * (optMargin / 100);
                const optPreTax = optSubtotal + optMarginAmount;
                const optGst = pricing.includeGst ? Math.round(optPreTax * ((pricing.gstPercentage || 5) / 100)) : 0;
                const optRawFinal = optPreTax + optGst;
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
                        <span className="font-bold">₹{optBaseAccom.toLocaleString("en-IN")}</span>
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
                        <span className={isSelected ? "text-sky-100" : "text-slate-500"}>AC Type:</span>
                        <span className="font-bold">{veh?.acType || "AC"}</span>
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
          <div className="flex items-center justify-between px-5 py-3.5 bg-violet-50/40">
            <span className="text-slate-700 font-semibold flex items-center gap-2">
              🏨 Accommodation ({selectedOption?.label || "Option 1"})
            </span>
            <span className="font-extrabold text-slate-900">₹{baseAccomTotal.toLocaleString("en-IN")}</span>
          </div>
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
          <br/>
          <div className="flex items-center justify-between px-5 py-3.5 bg-slate-200">
            <span className="text-slate-900 font-extrabold">Subtotal Base Cost</span>
            <span className="font-extrabold text-slate-900 text-[15px]">₹{subtotal.toLocaleString("en-IN")}</span>
          </div>
          <div className="flex items-center justify-between px-5 py-3.5 bg-amber-50/60">
            <span className="text-amber-900 font-bold">
              📈 Profit Margin ({pricing.marginType === "percentage" ? `${pricing.margin}%` : "Absolute"})
            </span>
            <span className="font-extrabold text-amber-700 text-[14.5px]">+ ₹{Math.round(marginAmount).toLocaleString("en-IN")}</span>
          </div>
          {pricing.includeGst && (
            <div className="flex items-center justify-between px-5 py-3.5 bg-blue-50/60">
              <span className="text-blue-900 font-bold flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-blue-600" />
                GST Tax ({pricing.gstPercentage || 5}%)
              </span>
              <span className="font-extrabold text-blue-800 text-[14.5px]">+ ₹{gstAmount.toLocaleString("en-IN")}</span>
            </div>
          )}
          <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white">
            <div className="flex items-center gap-2.5">
              <span className="font-black text-[15px]">Grand Package Total</span>
              <span className="text-[10.5px] font-extrabold bg-white/20 px-2.5 py-0.5 rounded-full text-emerald-100 border border-white/20">
                Rounded to nearest ₹100
              </span>
            </div>
            <span className="font-black text-[21px]">₹{finalPrice.toLocaleString("en-IN")}</span>
          </div>
        </div>

        {/* Controls Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          {/* Currency */}
          <div>
            <label className="block text-[12px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
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

          {/* Margin Type */}
          <div>
            <label className="block text-[12px] font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>Margin Type</span>
              {selectedOption?.label && (
                <span className="text-[10.5px] font-semibold text-indigo-600">({selectedOption.label})</span>
              )}
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => updateMargin({ marginType: "absolute" })}
                className={`flex-1 py-2.5 rounded-xl border text-[13px] font-extrabold transition-all flex items-center justify-center gap-1.5 ${
                  pricing.marginType === "absolute"
                    ? "bg-slate-900 border-slate-900 text-white shadow-xs"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <IndianRupee className="w-3.5 h-3.5" />
                Absolute
              </button>
              <button
                type="button"
                onClick={() => updateMargin({ marginType: "percentage" })}
                className={`flex-1 py-2.5 rounded-xl border text-[13px] font-extrabold transition-all flex items-center justify-center gap-1.5 ${
                  pricing.marginType === "percentage"
                    ? "bg-slate-900 border-slate-900 text-white shadow-xs"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Percent className="w-3.5 h-3.5" />
                Percentage
              </button>
            </div>
          </div>

          {/* Margin Value */}
          <div>
            <label className="block text-[12px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Margin Value {pricing.marginType === "percentage" ? "(%)" : "(₹)"}
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[14px] font-bold text-slate-400">
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
          </div>
        </div>

        {/* ── Optional Discount & Promo Offers Section ── */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-50 via-pink-50/60 to-rose-50 border border-rose-200/80 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-extrabold text-rose-950 flex items-center gap-1.5">
                <Percent className="w-4 h-4 text-rose-600" />
                Promotional Discount &amp; Special Offer
              </span>
            </div>
            {discountAmount > 0 && (
              <span className="text-[11.5px] font-black text-rose-700 bg-rose-100 px-3 py-0.5 rounded-full border border-rose-200 animate-pulse">
                🎉 SAVE ₹{discountAmount.toLocaleString("en-IN")} DISCOUNT
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Discount Amount (₹)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-[13px]">
                  ₹
                </span>
                <input
                  type="number"
                  min={0}
                  value={pricing.discountAmount === 0 ? "" : pricing.discountAmount}
                  onWheel={(e) => e.target.blur()}
                  onChange={(e) => {
                    const val = e.target.value;
                    update({ discountAmount: val === "" ? 0 : parseFloat(val) || 0 });
                  }}
                  placeholder="e.g. 2000"
                  className="w-full pl-8 pr-3 py-2 rounded-xl border border-rose-200 bg-white text-[13px] font-black text-slate-900 focus:outline-none focus:border-rose-500 shadow-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Offer Tag / Reason (optional)
              </label>
              <input
                type="text"
                value={pricing.discountReason || ""}
                onChange={(e) => update({ discountReason: e.target.value })}
                placeholder="e.g. Early Bird Offer, Honeymoon Special"
                className="w-full px-3 py-2 rounded-xl border border-rose-200 bg-white text-[12.5px] font-semibold text-slate-900 focus:outline-none focus:border-rose-500 shadow-xs"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Inclusions & Exclusions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Inclusions */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-emerald-700 font-extrabold text-[14px]">
            <CheckCircle2 className="w-4.5 h-4.5" />
            Inclusions
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {pricing.includes.map((inc, i) => (
              <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-100 text-[12.5px] font-bold text-slate-800">
                <span>{inc}</span>
                <button type="button" onClick={() => removeItem("includes", i)} className="text-slate-400 hover:text-rose-600">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newInclude}
              onChange={(e) => setNewInclude(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addItem("includes", newInclude, setNewInclude))}
              placeholder="e.g. Welcome drink on arrival"
              className={inputCls}
            />
            <button type="button" onClick={() => addItem("includes", newInclude, setNewInclude)} className="px-4 py-2.5 bg-emerald-600 text-white rounded-xl font-extrabold hover:bg-emerald-700">
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Exclusions */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-rose-600 font-extrabold text-[14px]">
            <XCircle className="w-4.5 h-4.5" />
            Exclusions
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {pricing.excludes.map((exc, i) => (
              <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-rose-50/60 border border-rose-100 text-[12.5px] font-bold text-slate-800">
                <span>{exc}</span>
                <button type="button" onClick={() => removeItem("excludes", i)} className="text-slate-400 hover:text-rose-600">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newExclude}
              onChange={(e) => setNewExclude(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addItem("excludes", newExclude, setNewExclude))}
              placeholder="e.g. Personal expenses"
              className={inputCls}
            />
            <button type="button" onClick={() => addItem("excludes", newExclude, setNewExclude)} className="px-4 py-2.5 bg-rose-600 text-white rounded-xl font-extrabold hover:bg-rose-700">
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
