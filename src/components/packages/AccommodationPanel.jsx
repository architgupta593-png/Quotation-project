"use client";

import { Building2, Star } from "lucide-react";

const MEAL_PLANS = [
  { value: "", label: "Select meal plan" },
  { value: "EP", label: "EP — Room Only" },
  { value: "CP", label: "CP — Bed & Breakfast" },
  { value: "MAP", label: "MAP — Breakfast + Dinner" },
  { value: "AP", label: "AP — All Meals" },
];

/**
 * AccommodationPanel — hotel/stay entry per night.
 *
 * Props:
 *   nights   {number}  - number of nights (determines rows)
 *   value    {Array}   - Array of accommodation objects:
 *                        { night, hotelName, location, roomType, mealPlan, starRating, notes }
 *   onChange {fn}      - Called with the full updated array
 */
export default function AccommodationPanel({ nights, value = [], onChange }) {
  // Normalise: ensure one entry per night
  const normalised = Array.from({ length: nights }, (_, i) => {
    const existing = value.find((a) => a.night === i + 1);
    return (
      existing || {
        night: i + 1,
        hotelName: "",
        location: "",
        roomType: "",
        mealPlan: "",
        starRating: null,
        notes: "",
      }
    );
  });

  function update(nightIdx, patch) {
    const updated = normalised.map((a, i) =>
      i === nightIdx ? { ...a, ...patch } : a
    );
    onChange(updated);
  }

  const inputCls =
    "w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-[13px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all bg-white";

  return (
    <div className="space-y-4">
      {normalised.map((acc, nightIdx) => (
        <div
          key={nightIdx}
          className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
        >
          {/* Night Badge */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-[14px] font-semibold text-gray-900">
                Night {acc.night}
              </p>
              <p className="text-[12px] text-gray-400">
                {acc.hotelName || "No hotel added yet"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Hotel Name */}
            <div>
              <label className="block text-[12px] font-medium text-gray-500 mb-1.5">
                Hotel / Property Name
              </label>
              <input
                type="text"
                value={acc.hotelName}
                onChange={(e) => update(nightIdx, { hotelName: e.target.value })}
                placeholder="e.g. The Himalayan Resort"
                className={inputCls}
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-[12px] font-medium text-gray-500 mb-1.5">
                Location / Area
              </label>
              <input
                type="text"
                value={acc.location}
                onChange={(e) => update(nightIdx, { location: e.target.value })}
                placeholder="e.g. Old Manali"
                className={inputCls}
              />
            </div>

            {/* Room Type */}
            <div>
              <label className="block text-[12px] font-medium text-gray-500 mb-1.5">
                Room Type
              </label>
              <input
                type="text"
                value={acc.roomType}
                onChange={(e) => update(nightIdx, { roomType: e.target.value })}
                placeholder="e.g. Deluxe Double, Suite"
                className={inputCls}
              />
            </div>

            {/* Meal Plan */}
            <div>
              <label className="block text-[12px] font-medium text-gray-500 mb-1.5">
                Meal Plan
              </label>
              <select
                value={acc.mealPlan}
                onChange={(e) => update(nightIdx, { mealPlan: e.target.value })}
                className={inputCls}
              >
                {MEAL_PLANS.map((mp) => (
                  <option key={mp.value} value={mp.value}>
                    {mp.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Star Rating */}
            <div>
              <label className="block text-[12px] font-medium text-gray-500 mb-1.5">
                Star Rating
              </label>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() =>
                      update(nightIdx, {
                        starRating: acc.starRating === star ? null : star,
                      })
                    }
                    aria-label={`${star} star${star > 1 ? "s" : ""}`}
                    className="focus:outline-none"
                  >
                    <Star
                      className={`w-5 h-5 transition-colors ${
                        (acc.starRating ?? 0) >= star
                          ? "fill-amber-400 text-amber-400"
                          : "text-gray-300"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="sm:col-span-2">
              <label className="block text-[12px] font-medium text-gray-500 mb-1.5">
                Notes (optional)
              </label>
              <input
                type="text"
                value={acc.notes}
                onChange={(e) => update(nightIdx, { notes: e.target.value })}
                placeholder="e.g. Mountain-view room, early check-in requested"
                className={inputCls}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
