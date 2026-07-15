"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  GripVertical,
  MapPin,
} from "lucide-react";
import ImageUploader from "./ImageUploader";

/**
 * ItineraryBuilder — builds a day-by-day itinerary.
 *
 * Props:
 *   days       {number}   - Total number of days (determines how many day cards exist)
 *   value      {Array}    - Array of day objects:
 *                           { day, title, description, activities[], meals:{breakfast,lunch,dinner}, images[] }
 *   onChange   {fn}       - Called with the full updated array
 *   packageId  {string}   - Required for image upload (null for new packages)
 */
export default function ItineraryBuilder({ days, value = [], onChange, packageId }) {
  const [openDay, setOpenDay] = useState(0); // which accordion is open

  // Ensure we always have exactly `days` entries (auto-fill gaps)
  const normalised = Array.from({ length: days }, (_, i) => {
    const existing = value.find((d) => d.day === i + 1);
    return (
      existing || {
        day: i + 1,
        title: "",
        description: "",
        activities: [],
        meals: { breakfast: false, lunch: false, dinner: false },
        images: [],
      }
    );
  });

  function update(dayIdx, patch) {
    const updated = normalised.map((d, i) =>
      i === dayIdx ? { ...d, ...patch } : d
    );
    onChange(updated);
  }

  function addActivity(dayIdx) {
    const acts = [...(normalised[dayIdx].activities || []), ""];
    update(dayIdx, { activities: acts });
  }

  function updateActivity(dayIdx, actIdx, val) {
    const acts = normalised[dayIdx].activities.map((a, i) =>
      i === actIdx ? val : a
    );
    update(dayIdx, { activities: acts });
  }

  function removeActivity(dayIdx, actIdx) {
    const acts = normalised[dayIdx].activities.filter((_, i) => i !== actIdx);
    update(dayIdx, { activities: acts });
  }

  function toggleMeal(dayIdx, meal) {
    update(dayIdx, {
      meals: {
        ...normalised[dayIdx].meals,
        [meal]: !normalised[dayIdx].meals[meal],
      },
    });
  }

  return (
    <div className="space-y-3">
      {normalised.map((dayObj, dayIdx) => {
        const isOpen = openDay === dayIdx;
        return (
          <div
            key={dayIdx}
            className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm"
          >
            {/* ── Accordion Header ── */}
            <button
              type="button"
              onClick={() => setOpenDay(isOpen ? -1 : dayIdx)}
              className="w-full flex items-center gap-3 px-5 py-4 hover:bg-gray-50 transition-colors text-left"
              aria-expanded={isOpen}
            >
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-[13px] font-bold">
                {dayObj.day}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-semibold text-gray-900 truncate">
                  {dayObj.title || `Day ${dayObj.day} — Add title`}
                </p>
                <p className="text-[12px] text-gray-400">
                  {dayObj.activities.filter(Boolean).length} activities ·{" "}
                  {Object.values(dayObj.meals).filter(Boolean).length} meals included
                </p>
              </div>
              {isOpen ? (
                <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
              )}
            </button>

            {/* ── Accordion Body ── */}
            {isOpen && (
              <div className="px-5 pb-5 space-y-5 border-t border-gray-100">
                {/* Day Title */}
                <div className="pt-4">
                  <label className="block text-[12px] font-medium text-gray-500 mb-1.5">
                    Day Title
                  </label>
                  <input
                    type="text"
                    value={dayObj.title}
                    onChange={(e) => update(dayIdx, { title: e.target.value })}
                    placeholder={`e.g. Arrival in Manali & Local Sightseeing`}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-[14px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-[12px] font-medium text-gray-500 mb-1.5">
                    Description
                  </label>
                  <textarea
                    value={dayObj.description}
                    onChange={(e) => update(dayIdx, { description: e.target.value })}
                    placeholder="Describe the day's plan in detail…"
                    rows={3}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-[14px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all resize-none"
                  />
                </div>

                {/* Activities */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[12px] font-medium text-gray-500">
                      Activities
                    </label>
                    <button
                      type="button"
                      onClick={() => addActivity(dayIdx)}
                      className="flex items-center gap-1 text-[12px] text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add
                    </button>
                  </div>
                  <div className="space-y-2">
                    {dayObj.activities.length === 0 && (
                      <p className="text-[12px] text-gray-400 italic">No activities yet — click Add.</p>
                    )}
                    {dayObj.activities.map((act, actIdx) => (
                      <div key={actIdx} className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                        <input
                          type="text"
                          value={act}
                          onChange={(e) => updateActivity(dayIdx, actIdx, e.target.value)}
                          placeholder={`Activity ${actIdx + 1}`}
                          className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-[13px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => removeActivity(dayIdx, actIdx)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                          aria-label="Remove activity"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Meals */}
                <div>
                  <label className="block text-[12px] font-medium text-gray-500 mb-2">
                    Meals Included
                  </label>
                  <div className="flex gap-3">
                    {["breakfast", "lunch", "dinner"].map((meal) => (
                      <button
                        key={meal}
                        type="button"
                        onClick={() => toggleMeal(dayIdx, meal)}
                        className={`px-3.5 py-1.5 rounded-full text-[12px] font-medium border transition-all ${
                          dayObj.meals[meal]
                            ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                            : "bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300"
                        }`}
                      >
                        {meal.charAt(0).toUpperCase() + meal.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Images */}
                <div>
                  <ImageUploader
                    packageId={packageId}
                    dayIndex={dayIdx}
                    existingImages={dayObj.images || []}
                    onUploaded={(img) =>
                      update(dayIdx, { images: [...(dayObj.images || []), img] })
                    }
                    onDeleted={(publicId) =>
                      update(dayIdx, {
                        images: dayObj.images.filter((i) => i.publicId !== publicId),
                      })
                    }
                    maxImages={4}
                    label="Day Photos (optional)"
                    localMode={!packageId}
                  />
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
