"use client";

import { useState } from "react";
import { IndianRupee, Plus, Trash2 } from "lucide-react";

const CURRENCIES = ["INR", "USD", "EUR", "GBP", "AED"];

/**
 * PricingPanel — per-person/total price, currency, includes/excludes.
 *
 * Props:
 *   value    {Object} - { pricePerPerson, totalPrice, currency, includes[], excludes[] }
 *   onChange {fn}     - Called with updated pricing object
 *   people   {number} - Optional: number of people (for auto-calc total)
 */
export default function PricingPanel({ value = {}, onChange, people = 1 }) {
  const pricing = {
    pricePerPerson: 0,
    totalPrice: 0,
    currency: "INR",
    includes: [],
    excludes: [],
    ...value,
  };

  const [newInclude, setNewInclude] = useState("");
  const [newExclude, setNewExclude] = useState("");

  function update(patch) {
    const updated = { ...pricing, ...patch };
    // Auto-calculate total when pricePerPerson changes
    if (patch.pricePerPerson !== undefined) {
      updated.totalPrice = patch.pricePerPerson * people;
    }
    onChange(updated);
  }

  function addItem(field, value, setter) {
    const trimmed = value.trim();
    if (!trimmed) return;
    update({ [field]: [...pricing[field], trimmed] });
    setter("");
  }

  function removeItem(field, idx) {
    update({ [field]: pricing[field].filter((_, i) => i !== idx) });
  }

  const inputCls =
    "w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-[13px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all bg-white";

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center">
          <IndianRupee className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-[14px] font-semibold text-gray-900">Pricing</p>
          <p className="text-[12px] text-gray-400">Package cost & inclusions</p>
        </div>
      </div>

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

        {/* Price Per Person */}
        <div>
          <label className="block text-[12px] font-medium text-gray-500 mb-1.5">
            Price Per Person
          </label>
          <input
            type="number"
            min={0}
            value={pricing.pricePerPerson}
            onChange={(e) =>
              update({ pricePerPerson: parseFloat(e.target.value) || 0 })
            }
            placeholder="0"
            className={inputCls}
          />
        </div>

        {/* Total Price */}
        <div>
          <label className="block text-[12px] font-medium text-gray-500 mb-1.5">
            Total Price ({people} pax)
          </label>
          <input
            type="number"
            min={0}
            value={pricing.totalPrice}
            onChange={(e) =>
              update({ totalPrice: parseFloat(e.target.value) || 0 })
            }
            placeholder="0"
            className={inputCls}
          />
        </div>
      </div>

      {/* Includes / Excludes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-5">
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
  );
}
