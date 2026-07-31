"use client";

import { useState, useEffect } from "react";
import { IndianRupee, Plus, Trash2, Percent, Calculator } from "lucide-react";

const CURRENCIES = ["INR", "USD", "EUR", "GBP", "AED"];

/**
 * PricingPanel — auto-calculated pricing with margin.
 *
 * Props:
 *   value               {Object} - pricing state
 *   onChange             {fn}     - Called with updated pricing object
 *   accommodationTotal   {number} - Sum of accommodation prices from AccommodationPanel
 *   vehicleTotal         {number} - Vehicle price from VehiclePanel
 */
export default function PricingPanel({
  value = {},
  onChange,
  accommodationTotal = 0,
  vehicleTotal = 0,
}) {
  const pricing = {
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

  // Recalculate whenever accommodation/vehicle totals or margin changes
  useEffect(() => {
    const subtotal = accommodationTotal + vehicleTotal;
    let marginAmount = 0;
    if (pricing.marginType === "absolute") {
      marginAmount = pricing.margin || 0;
    } else {
      marginAmount = subtotal * ((pricing.margin || 0) / 100);
    }
    const finalPrice = subtotal + marginAmount;
    const perPersonPrice = pricing.numberOfPersons > 0
      ? Math.round(finalPrice / pricing.numberOfPersons)
      : finalPrice;

    // Only update if values actually changed to avoid infinite loop
    if (
      pricing.accommodationTotal !== accommodationTotal ||
      pricing.vehicleTotal !== vehicleTotal ||
      pricing.subtotal !== subtotal ||
      pricing.finalPrice !== finalPrice ||
      pricing.perPersonPrice !== perPersonPrice
    ) {
      onChange({
        ...pricing,
        accommodationTotal,
        vehicleTotal,
        subtotal,
        finalPrice,
        perPersonPrice,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accommodationTotal, vehicleTotal, pricing.margin, pricing.marginType, pricing.numberOfPersons]);

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

  // Calculate display values
  const subtotal = accommodationTotal + vehicleTotal;
  let marginAmount = 0;
  if (pricing.marginType === "absolute") {
    marginAmount = pricing.margin || 0;
  } else {
    marginAmount = subtotal * ((pricing.margin || 0) / 100);
  }
  const finalPrice = subtotal + marginAmount;
  const perPersonPrice = pricing.numberOfPersons > 0
    ? Math.round(finalPrice / pricing.numberOfPersons)
    : finalPrice;

  const inputCls =
    "w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-[13px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all bg-white";

  return (
    <div className="space-y-5">
      {/* Cost Breakdown Card */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center">
            <Calculator className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-[14px] font-semibold text-gray-900">Cost Breakdown</p>
            <p className="text-[12px] text-gray-400">Auto-calculated from accommodation & vehicle</p>
          </div>
        </div>

        {/* Breakdown Table */}
        <div className="rounded-xl border border-gray-100 overflow-hidden mb-5">
          <div className="divide-y divide-gray-100">
            {/* Accommodation */}
            <div className="flex items-center justify-between px-4 py-3 bg-violet-50/50">
              <span className="text-[13px] text-gray-700 font-medium">🏨 Accommodation Total</span>
              <span className="text-[14px] font-semibold text-gray-900">
                ₹{accommodationTotal.toLocaleString()}
              </span>
            </div>
            {/* Vehicle */}
            <div className="flex items-center justify-between px-4 py-3 bg-sky-50/50">
              <span className="text-[13px] text-gray-700 font-medium">🚗 Vehicle Total</span>
              <span className="text-[14px] font-semibold text-gray-900">
                ₹{vehicleTotal.toLocaleString()}
              </span>
            </div>
            {/* Subtotal */}
            <div className="flex items-center justify-between px-4 py-3 bg-gray-50">
              <span className="text-[13px] text-gray-700 font-semibold">Subtotal</span>
              <span className="text-[14px] font-bold text-gray-900">
                ₹{subtotal.toLocaleString()}
              </span>
            </div>
            {/* Margin */}
            <div className="flex items-center justify-between px-4 py-3 bg-amber-50/50">
              <span className="text-[13px] text-gray-700 font-medium">
                📈 Margin ({pricing.marginType === "percentage" ? `${pricing.margin}%` : "Absolute"})
              </span>
              <span className="text-[14px] font-semibold text-amber-700">
                + ₹{Math.round(marginAmount).toLocaleString()}
              </span>
            </div>
            {/* Final Price */}
            <div className="flex items-center justify-between px-4 py-3.5"
              style={{ background: "linear-gradient(135deg, #ecfdf5, #d1fae5)" }}>
              <span className="text-[14px] text-emerald-900 font-bold">Final Price</span>
              <span className="text-[18px] font-black text-emerald-700">
                ₹{Math.round(finalPrice).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Editable Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Currency */}
          <div>
            <label className="block text-[12px] font-medium text-gray-500 mb-1.5">
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
            <label className="block text-[12px] font-medium text-gray-500 mb-1.5">
              Margin Type
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => update({ marginType: "absolute" })}
                className={`flex-1 py-2.5 rounded-xl border text-[12px] font-medium transition-all flex items-center justify-center gap-1.5 ${
                  pricing.marginType === "absolute"
                    ? "bg-amber-50 border-amber-400 text-amber-700"
                    : "bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300"
                }`}
              >
                <IndianRupee className="w-3 h-3" />
                Absolute
              </button>
              <button
                type="button"
                onClick={() => update({ marginType: "percentage" })}
                className={`flex-1 py-2.5 rounded-xl border text-[12px] font-medium transition-all flex items-center justify-center gap-1.5 ${
                  pricing.marginType === "percentage"
                    ? "bg-amber-50 border-amber-400 text-amber-700"
                    : "bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300"
                }`}
              >
                <Percent className="w-3 h-3" />
                Percentage
              </button>
            </div>
          </div>

          {/* Margin Value */}
          <div>
            <label className="block text-[12px] font-medium text-gray-500 mb-1.5">
              Margin {pricing.marginType === "percentage" ? "(%)" : "(₹)"}
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[13px] text-gray-400">
                {pricing.marginType === "percentage" ? "%" : "₹"}
              </span>
              <input
                type="number"
                min={0}
                value={pricing.margin}
                onChange={(e) => update({ margin: parseFloat(e.target.value) || 0 })}
                placeholder="0"
                className={`${inputCls} pl-8`}
              />
            </div>
          </div>
        </div>

        {/* Number of Persons + Per Person */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-[12px] font-medium text-gray-500 mb-1.5">
              Number of Persons
            </label>
            <input
              type="number"
              min={1}
              max={100}
              value={pricing.numberOfPersons}
              onChange={(e) => update({ numberOfPersons: parseInt(e.target.value, 10) || 1 })}
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-[12px] font-medium text-gray-500 mb-1.5">
              Price Per Person
            </label>
            <div className="flex items-center gap-2 h-[42px] px-3.5 rounded-xl border border-emerald-200 bg-emerald-50">
              <span className="text-[13px] text-emerald-500">₹</span>
              <span className="text-[15px] font-bold text-emerald-700">
                {perPersonPrice.toLocaleString()}
              </span>
              <span className="text-[10px] text-emerald-500 ml-auto">per person</span>
            </div>
          </div>
        </div>
      </div>

      {/* Includes / Excludes */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
            <IndianRupee className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-[14px] font-semibold text-gray-900">Inclusions & Exclusions</p>
            <p className="text-[12px] text-gray-400">What&apos;s included and excluded in the package</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Includes */}
          <div>
            <label className="block text-[12px] font-medium text-gray-500 mb-2">
              ✅ Inclusions
            </label>
            <div className="space-y-2 mb-2">
              {pricing.includes.map((item, i) => (
                <div key={i} className="flex items-center gap-2 group">
                  <span className="flex-1 text-[13px] text-gray-700 bg-emerald-50 rounded-lg px-3 py-1.5 border border-emerald-100">
                    {item}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeItem("includes", i)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                    aria-label="Remove inclusion"
                  >
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
                placeholder="e.g. Accommodation, Meals…"
                className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-[13px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
              />
              <button
                type="button"
                onClick={() => addItem("includes", newInclude, setNewInclude)}
                className="px-3 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                aria-label="Add inclusion"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Excludes */}
          <div>
            <label className="block text-[12px] font-medium text-gray-500 mb-2">
              ❌ Exclusions
            </label>
            <div className="space-y-2 mb-2">
              {pricing.excludes.map((item, i) => (
                <div key={i} className="flex items-center gap-2 group">
                  <span className="flex-1 text-[13px] text-gray-700 bg-red-50 rounded-lg px-3 py-1.5 border border-red-100">
                    {item}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeItem("excludes", i)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                    aria-label="Remove exclusion"
                  >
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
                placeholder="e.g. Airfare, Personal expenses…"
                className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-[13px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
              />
              <button
                type="button"
                onClick={() => addItem("excludes", newExclude, setNewExclude)}
                className="px-3 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
                aria-label="Add exclusion"
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
