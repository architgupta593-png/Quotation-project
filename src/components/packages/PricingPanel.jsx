"use client";

import { useState, useEffect } from "react";
import {
  IndianRupee, Plus, Trash2, Percent, Calculator, Layers, CheckCircle2, XCircle, Users, HeartHandshake, Receipt,
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
  accommodationOptions = [],
  vehicleTotal = 0,
  vehiclePrice = 0,
}) {
  const inputPricing = propPricing || value || {};
  const vTotal = vehicleTotal || vehiclePrice || 0;
  const pricing = {
    selectedOptionIndex: 0,
    accommodationTotal: 0,
    vehicleTotal: vTotal,
    subtotal: 0,
    marginType: "absolute",
    margin: 0,
    includeGst: false,
    gstPercentage: 5,
    rateBasis: "per_couple", // "per_couple" (default) or "per_person"
    finalPrice: 0,
    perPersonPrice: 0,
    perCouplePrice: 0,
    numberOfPersons: 2, // default 2 persons (1 couple)
    currency: "INR",
    includes: [],
    excludes: [],
    ...inputPricing,
  };

  const [newInclude, setNewInclude] = useState("");
  const [newExclude, setNewExclude] = useState("");

  const pax = Math.max(1, parseInt(pricing.numberOfPersons, 10) || 1);
  const maxPerRoom = Math.max(1, parseInt(pricing.maxPersonsPerRoom, 10) || 2);
  const isPerPerson = pricing.rateBasis === "per_person";

  // Calculate required rooms based on max persons per room:
  // e.g. 5 persons with max 2 per room = Math.ceil(5 / 2) = 3 rooms.
  const roomsRequired = isPerPerson
    ? Math.max(1, Math.ceil(pax / maxPerRoom))
    : Math.max(1, Math.ceil(pax / 2));

  const couples = isPerPerson ? roomsRequired : Math.max(1, Math.ceil(pax / 2));

  const selectedIdx = Math.min(
    pricing.selectedOptionIndex || 0,
    Math.max(0, accommodationOptions.length - 1)
  );

  const selectedOption = accommodationOptions[selectedIdx];
  const baseAccomTotal = selectedOption
    ? (selectedOption.nights || []).reduce((s, n) => s + (n.pricePerNight || 0), 0)
    : 0;

  const effectiveAccomTotal = baseAccomTotal * roomsRequired;

  const subtotal = effectiveAccomTotal + vTotal;
  let marginAmount = 0;
  if (pricing.marginType === "absolute") {
    marginAmount = pricing.margin || 0;
  } else {
    marginAmount = subtotal * ((pricing.margin || 0) / 100);
  }

  const preTaxTotal = subtotal + marginAmount;
  const gstAmount = pricing.includeGst ? Math.round(preTaxTotal * ((pricing.gstPercentage || 5) / 100)) : 0;
  const finalPrice = Math.round(preTaxTotal + gstAmount);

  const perPersonPrice = Math.round(finalPrice / pax);
  const perCouplePrice = Math.round(finalPrice / roomsRequired);

  useEffect(() => {
    if (
      pricing.accommodationTotal !== effectiveAccomTotal ||
      pricing.vehicleTotal !== vTotal ||
      pricing.subtotal !== subtotal ||
      pricing.finalPrice !== finalPrice ||
      pricing.perPersonPrice !== perPersonPrice ||
      pricing.perCouplePrice !== perCouplePrice ||
      pricing.selectedOptionIndex !== selectedIdx
    ) {
      onChange({
        ...pricing,
        selectedOptionIndex: selectedIdx,
        accommodationTotal: effectiveAccomTotal,
        vehicleTotal: vTotal,
        subtotal,
        finalPrice,
        perPersonPrice,
        perCouplePrice,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    effectiveAccomTotal,
    vTotal,
    pricing.margin,
    pricing.marginType,
    pricing.includeGst,
    pricing.gstPercentage,
    pricing.numberOfPersons,
    pricing.maxPersonsPerRoom,
    pricing.rateBasis,
    selectedIdx,
  ]);

  function update(patch) {
    onChange({ ...pricing, ...patch });
  }

  function addItem(field, val, setter) {
    const trimmed = val.trim();
    if (!trimmed) return;
    update({ [field]: [...pricing[field], trimmed] });
    setter("");
  }

  function removeItem(field, idx) {
    update({ [field]: pricing[field].filter((_, i) => i !== idx) });
  }

  const inputCls =
    "w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-[13.5px] font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all shadow-xs";

  return (
    <div className="space-y-6">
      {/* Cost Calculation Card */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-7 shadow-xs space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-xs">
            <Calculator className="w-4.5 h-4.5" />
          </div>
          <div>
            <h3 className="text-[16px] font-extrabold text-slate-900">Cost & Margin Calculator</h3>
            <p className="text-[12.5px] text-slate-500">Auto-calculated from accommodation & vehicle pricing</p>
          </div>
        </div>

        {/* Accommodation Tier Selector */}
        {accommodationOptions.length > 1 && (
          <div className="p-4 rounded-2xl border border-indigo-100 bg-indigo-50/50 space-y-2">
            <label className="text-[12px] font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              Select Base Accommodation Category Tier:
            </label>
            <div className="flex gap-2.5 overflow-x-auto">
              {accommodationOptions.map((opt, i) => {
                const optTotal = (opt.nights || []).reduce((s, n) => s + (n.pricePerNight || 0), 0);
                const isSelected = i === selectedIdx;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => update({ selectedOptionIndex: i })}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-[12.5px] font-bold border transition-all ${
                      isSelected
                        ? "bg-gradient-to-r from-indigo-600 to-violet-600 border-indigo-600 text-white shadow-sm"
                        : "bg-white border-slate-200 text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    <span>{opt.label}</span>
                    <span
                      className={`text-[11px] font-extrabold px-2 py-0.5 rounded-full ${
                        isSelected ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      ₹{optTotal.toLocaleString("en-IN")}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Financial Breakdown Table */}
        <div className="rounded-2xl border border-slate-200/80 overflow-hidden divide-y divide-slate-100 text-[13.5px] shadow-xs">
          <div className="flex items-center justify-between px-5 py-3.5 bg-violet-50/40">
            <span className="text-slate-700 font-semibold flex items-center gap-2">
              🏨 Accommodation ({selectedOption?.label || "Option 1"})
              <span className="text-[11px] font-bold text-violet-700 bg-violet-100 px-2 py-0.5 rounded-full">
                {isPerPerson
                  ? `${pax} Persons → ${roomsRequired} ${roomsRequired === 1 ? "Room" : "Rooms"} (${roomsRequired} × ₹${baseAccomTotal.toLocaleString("en-IN")})`
                  : `${couples} ${couples === 1 ? "Couple (1 Room)" : "Couples (" + couples + " Rooms)"} × ₹${baseAccomTotal.toLocaleString("en-IN")}`}
              </span>
            </span>
            <span className="font-extrabold text-slate-900">₹{effectiveAccomTotal.toLocaleString("en-IN")}</span>
          </div>
          <div className="flex items-center justify-between px-5 py-3.5 bg-sky-50/40">
            <span className="text-slate-700 font-semibold flex items-center gap-2">🚗 Vehicle Transport</span>
            <span className="font-extrabold text-slate-900">₹{vTotal.toLocaleString("en-IN")}</span>
          </div>
          <div className="flex items-center justify-between px-5 py-3.5 bg-slate-100/70">
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
            <span className="font-black text-[15px]">Grand Package Total</span>
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
            <label className="block text-[12px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Margin Type
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => update({ marginType: "absolute" })}
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
                onClick={() => update({ marginType: "percentage" })}
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
                    update({ margin: 0 });
                  } else {
                    const parsed = parseFloat(val);
                    update({ margin: isNaN(parsed) ? 0 : parsed });
                  }
                }}
                placeholder="0"
                className={`${inputCls} pl-9 font-bold`}
              />
            </div>
          </div>
        </div>

        {/* ── Optional GST Tax Section ── */}
        <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 space-y-3">
          <div className="flex items-center justify-between">
            <label htmlFor="toggle-gst-chk" className="flex items-center gap-2 cursor-pointer">
              <input
                id="toggle-gst-chk"
                type="checkbox"
                checked={Boolean(pricing.includeGst)}
                onChange={(e) => update({ includeGst: e.target.checked })}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <span className="text-[13px] font-extrabold text-blue-950 flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-blue-600" />
                Add Optional GST Tax to Price
              </span>
            </label>
            {pricing.includeGst && (
              <span className="text-[11.5px] font-black text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-full">
                GST Included (+₹{gstAmount.toLocaleString("en-IN")})
              </span>
            )}
          </div>

          {pricing.includeGst && (
            <div className="flex items-center gap-3 pt-1">
              <span className="text-[12px] font-bold text-slate-600">GST Rate (%):</span>
              {[5, 12, 18, 28].map((rate) => (
                <button
                  key={rate}
                  type="button"
                  onClick={() => update({ gstPercentage: rate })}
                  className={`px-3 py-1 rounded-xl text-[12px] font-bold transition-all ${
                    (pricing.gstPercentage || 5) === rate
                      ? "bg-blue-600 text-white shadow-xs"
                      : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {rate}% GST
                </button>
              ))}
              <div className="w-24">
                <input
                  type="number"
                  min={0}
                  max={50}
                  value={pricing.gstPercentage === 0 ? "" : pricing.gstPercentage}
                  onWheel={(e) => e.target.blur()}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "") update({ gstPercentage: 0 });
                    else update({ gstPercentage: parseFloat(val) || 0 });
                  }}
                  placeholder="5"
                  className="w-full px-3 py-1 rounded-xl border border-slate-200 text-[12px] font-bold bg-white text-center"
                />
              </div>
            </div>
          )}
        </div>

        {/* ── Rate Basis (Per Couple vs Per Person) & Pax/Couple Controls ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {/* Rate Calculation Basis */}
          <div>
            <label className="block text-[12px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Rate Calculation Basis
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => update({ rateBasis: "per_couple" })}
                className={`flex-1 py-3 rounded-xl border text-[12.5px] font-extrabold transition-all flex items-center justify-center gap-1.5 ${
                  !isPerPerson
                    ? "bg-gradient-to-r from-purple-600 to-indigo-600 border-purple-600 text-white shadow-sm"
                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                <HeartHandshake className="w-4 h-4" />
                Per Couple (2 Pax)
              </button>
              <button
                type="button"
                onClick={() => update({ rateBasis: "per_person" })}
                className={`flex-1 py-3 rounded-xl border text-[12.5px] font-extrabold transition-all flex items-center justify-center gap-1.5 ${
                  isPerPerson
                    ? "bg-gradient-to-r from-purple-600 to-indigo-600 border-purple-600 text-white shadow-sm"
                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                <Users className="w-4 h-4" />
                Per Person
              </button>
            </div>
          </div>

          {/* Number of Couples OR Persons Input */}
          <div>
            <label className="block text-[12px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              {!isPerPerson ? "Number of Couples" : "Number of Persons (Pax)"}
            </label>
            {!isPerPerson ? (
              <div className="relative">
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={couples}
                  onWheel={(e) => e.target.blur()}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "") {
                      update({ numberOfPersons: 2 });
                    } else {
                      const c = Math.max(1, parseInt(val, 10) || 1);
                      update({ numberOfPersons: c * 2 });
                    }
                  }}
                  className={`${inputCls} font-bold pr-20`}
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[11.5px] font-extrabold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-md pointer-events-none">
                  = {couples * 2} Pax
                </span>
              </div>
            ) : (
              <div className="relative">
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={pax}
                  onWheel={(e) => e.target.blur()}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "") {
                      update({ numberOfPersons: 1 });
                    } else {
                      const p = Math.max(1, parseInt(val, 10) || 1);
                      update({ numberOfPersons: p });
                    }
                  }}
                  className={`${inputCls} font-bold pr-24`}
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[11.5px] font-extrabold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-md pointer-events-none">
                  = {roomsRequired} {roomsRequired === 1 ? "Room" : "Rooms"}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Max Persons per Room selector when in Per Person mode */}
        {isPerPerson && (
          <div className="p-3.5 rounded-2xl bg-indigo-50/50 border border-indigo-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <span className="text-[12.5px] font-extrabold text-indigo-950 block">
                Max Allowed Occupancy per Room
              </span>
              <span className="text-[11.5px] text-indigo-700 font-medium">
                {pax} Persons ÷ {maxPerRoom} Max per Room = <strong className="font-black text-indigo-900">{roomsRequired} {roomsRequired === 1 ? "Room allocated" : "Rooms allocated"}</strong>
              </span>
            </div>
            <div className="flex gap-1.5 w-full sm:w-auto">
              {[
                { val: 1, label: "1 (Single)" },
                { val: 2, label: "2 (Double)" },
                { val: 3, label: "3 (Triple)" },
                { val: 4, label: "4 (Quad)" },
              ].map((opt) => (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => update({ maxPersonsPerRoom: opt.val })}
                  className={`px-3 py-1.5 rounded-xl text-[12px] font-bold border transition-all ${
                    maxPerRoom === opt.val
                      ? "bg-indigo-600 border-indigo-600 text-white shadow-xs"
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Calculated Rate Box */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-indigo-50 border border-emerald-200/80 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-black uppercase tracking-wider text-emerald-900">Per Couple Rate ({couples} {couples === 1 ? "Couple" : "Couples"})</p>
              <p className="text-[20px] font-black text-emerald-700 leading-tight">
                {pricing.currency} {perCouplePrice.toLocaleString("en-IN")}
                <span className="text-[12px] font-semibold text-emerald-600"> / couple</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 border-t sm:border-t-0 sm:border-l border-emerald-200/80 pt-3 sm:pt-0 sm:pl-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-xs">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-black uppercase tracking-wider text-indigo-900">Per Person Rate ({pax} Pax)</p>
              <p className="text-[20px] font-black text-indigo-700 leading-tight">
                {pricing.currency} {perPersonPrice.toLocaleString("en-IN")}
                <span className="text-[12px] font-semibold text-indigo-600"> / person</span>
              </p>
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
