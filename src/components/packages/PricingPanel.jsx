"use client";

import { useState, useEffect } from "react";
import { IndianRupee, Plus, Trash2, Percent, Calculator, Layers, CheckCircle2, XCircle } from "lucide-react";

const CURRENCIES = ["INR", "USD", "EUR", "GBP", "AED"];

/**
 * PricingPanel — Vibrant & High-Contrast Pricing Panel
 */
export default function PricingPanel({
  value = {},
  onChange,
  accommodationOptions = [],
  vehicleTotal = 0,
}) {
  const pricing = {
    selectedOptionIndex: 0,
    accommodationTotal: 0,
    vehicleTotal: 0,
    subtotal: 0,
    marginType: "absolute",
    margin: 0,
    finalPrice: 0,
    perPersonPrice: 0,
    numberOfPersons: 1,
    currency: "INR",
    includes: [],
    excludes: [],
    ...value,
  };

  const [newInclude, setNewInclude] = useState("");
  const [newExclude, setNewExclude] = useState("");

  const selectedIdx = Math.min(
    pricing.selectedOptionIndex || 0,
    Math.max(0, accommodationOptions.length - 1)
  );

  const selectedOption = accommodationOptions[selectedIdx];
  const accommodationTotal = selectedOption
    ? (selectedOption.nights || []).reduce((s, n) => s + (n.pricePerNight || 0), 0)
    : 0;

  useEffect(() => {
    const subtotal = accommodationTotal + vehicleTotal;
    let marginAmount = 0;
    if (pricing.marginType === "absolute") {
      marginAmount = pricing.margin || 0;
    } else {
      marginAmount = subtotal * ((pricing.margin || 0) / 100);
    }
    const finalPrice = subtotal + marginAmount;
    const perPersonPrice =
      pricing.numberOfPersons > 0
        ? Math.round(finalPrice / pricing.numberOfPersons)
        : finalPrice;

    if (
      pricing.accommodationTotal !== accommodationTotal ||
      pricing.vehicleTotal !== vehicleTotal ||
      pricing.subtotal !== subtotal ||
      pricing.finalPrice !== finalPrice ||
      pricing.perPersonPrice !== perPersonPrice ||
      pricing.selectedOptionIndex !== selectedIdx
    ) {
      onChange({
        ...pricing,
        selectedOptionIndex: selectedIdx,
        accommodationTotal,
        vehicleTotal,
        subtotal,
        finalPrice,
        perPersonPrice,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accommodationTotal, vehicleTotal, pricing.margin, pricing.marginType, pricing.numberOfPersons, selectedIdx]);

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

  const subtotal = accommodationTotal + vehicleTotal;
  let marginAmount = 0;
  if (pricing.marginType === "absolute") {
    marginAmount = pricing.margin || 0;
  } else {
    marginAmount = subtotal * ((pricing.margin || 0) / 100);
  }
  const finalPrice = subtotal + marginAmount;
  const perPersonPrice =
    pricing.numberOfPersons > 0
      ? Math.round(finalPrice / pricing.numberOfPersons)
      : finalPrice;

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
            <h3 className="text-[16px] font-extrabold text-slate-900">Cost & Margin Calculation</h3>
            <p className="text-[12.5px] text-slate-500">Auto-calculated from accommodation & vehicle</p>
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
                      ₹{optTotal.toLocaleString()}
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
            </span>
            <span className="font-extrabold text-slate-900">₹{accommodationTotal.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between px-5 py-3.5 bg-sky-50/40">
            <span className="text-slate-700 font-semibold flex items-center gap-2">🚗 Vehicle Transport</span>
            <span className="font-extrabold text-slate-900">₹{vehicleTotal.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between px-5 py-3.5 bg-slate-100/70">
            <span className="text-slate-900 font-extrabold">Subtotal Base Cost</span>
            <span className="font-extrabold text-slate-900 text-[15px]">₹{subtotal.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between px-5 py-3.5 bg-amber-50/60">
            <span className="text-amber-900 font-bold">
              📈 Added Profit Margin ({pricing.marginType === "percentage" ? `${pricing.margin}%` : "Absolute"})
            </span>
            <span className="font-extrabold text-amber-700 text-[14.5px]">+ ₹{Math.round(marginAmount).toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
            <span className="font-black text-[15px]">Grand Package Price</span>
            <span className="font-black text-[20px]">₹{Math.round(finalPrice).toLocaleString()}</span>
          </div>
        </div>

        {/* Inputs */}
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
                value={pricing.margin}
                onWheel={(e) => e.target.blur()}
                onChange={(e) => update({ margin: parseFloat(e.target.value) || 0 })}
                placeholder="0"
                className={`${inputCls} pl-9 font-bold`}
              />
            </div>
          </div>
        </div>

        {/* Persons & Per Person */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[12px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Number of Persons
            </label>
            <input
              type="number"
              min={1}
              max={100}
              value={pricing.numberOfPersons}
              onWheel={(e) => e.target.blur()}
              onChange={(e) => update({ numberOfPersons: parseInt(e.target.value, 10) || 1 })}
              className={`${inputCls} font-bold`}
            />
          </div>
          <div>
            <label className="block text-[12px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Price Per Person (Calculated)
            </label>
            <div className="flex items-center gap-2 h-[46px] px-4 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-900">
              <span className="text-[14px] font-bold text-emerald-600">₹</span>
              <span className="text-[17px] font-black text-emerald-800">
                {perPersonPrice.toLocaleString()}
              </span>
              <span className="text-[11.5px] font-bold text-emerald-600 ml-auto">/ person</span>
            </div>
          </div>
        </div>
      </div>

      {/* Inclusions & Exclusions */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-7 shadow-xs space-y-5">
        <h3 className="text-[16px] font-extrabold text-slate-900">Inclusions & Exclusions</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Includes */}
          <div>
            <label className="block text-[12.5px] font-bold text-slate-700 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Inclusions
            </label>
            <div className="space-y-2 mb-3">
              {pricing.includes.map((item, i) => (
                <div key={i} className="flex items-center gap-2 group">
                  <span className="flex-1 text-[13px] text-emerald-900 bg-emerald-50 rounded-xl px-3.5 py-2 border border-emerald-100 font-bold">
                    ✓ {item}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeItem("includes", i)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newInclude}
                onChange={(e) => setNewInclude(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && (e.preventDefault(), addItem("includes", newInclude, setNewInclude))
                }
                placeholder="e.g. Daily Breakfast, Sightseeing transfer…"
                className={inputCls}
              />
              <button
                type="button"
                onClick={() => addItem("includes", newInclude, setNewInclude)}
                className="px-4 py-3 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition-colors shadow-xs"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Excludes */}
          <div>
            <label className="block text-[12.5px] font-bold text-slate-700 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <XCircle className="w-4 h-4 text-rose-500" /> Exclusions
            </label>
            <div className="space-y-2 mb-3">
              {pricing.excludes.map((item, i) => (
                <div key={i} className="flex items-center gap-2 group">
                  <span className="flex-1 text-[13px] text-rose-900 bg-rose-50 rounded-xl px-3.5 py-2 border border-rose-100 font-bold">
                    ✕ {item}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeItem("excludes", i)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newExclude}
                onChange={(e) => setNewExclude(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && (e.preventDefault(), addItem("excludes", newExclude, setNewExclude))
                }
                placeholder="e.g. Airfare, Personal expenses…"
                className={inputCls}
              />
              <button
                type="button"
                onClick={() => addItem("excludes", newExclude, setNewExclude)}
                className="px-4 py-3 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition-colors shadow-xs"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
