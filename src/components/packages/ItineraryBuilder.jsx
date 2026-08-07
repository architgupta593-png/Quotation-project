"use client";

import { useState, useEffect } from "react";
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  MapPin,
  Zap,
  IndianRupee,
  X,
  Clock,
} from "lucide-react";
import ImageUploader from "./ImageUploader";

/**
 * ItineraryBuilder — builds a day-by-day itinerary.
 *
 * Props:
 *   days         {number}   - Total number of days
 *   value        {Array}    - Array of day objects:
 *                             { day, title, description, activities[], meals:{...}, images[] }
 *   onChange     {fn}       - Called with the full updated array
 *   packageId    {string}   - Required for image upload (null for new packages)
 *   destinations {Array}    - Optional: form.destinations for city-aware activity suggestions
 */
export default function ItineraryBuilder({ days, itinerary, value, onChange, packageId, destinations }) {
  const [openDay, setOpenDay] = useState(0);
  const [dialogDayIdx, setDialogDayIdx] = useState(null);
  // Suggested activities per cityId: { cityId -> Activity[] }
  const [suggestedMap, setSuggestedMap] = useState({});

  const list = itinerary || value || [];

  // Determine which city covers each day based on destination nights
  function getCityForDay(dayNum) {
    if (!destinations || destinations.length === 0) return null;
    let cumulative = 0;
    for (const dest of destinations) {
      cumulative += dest.nights || 0;
      if (dayNum <= cumulative) return dest;
    }
    return destinations[destinations.length - 1];
  }

  // Fetch suggested activities for any city not yet fetched
  useEffect(() => {
    if (!destinations) return;
    const uniqueCities = [...new Map(destinations.filter((d) => d.cityId).map((d) => [d.cityId, d])).values()];
    for (const dest of uniqueCities) {
      if (suggestedMap[dest.cityId] !== undefined) continue;
      fetch(`/api/activities?city=${dest.cityId}`)
        .then((r) => r.json())
        .then((data) => {
          setSuggestedMap((prev) => ({ ...prev, [dest.cityId]: data.activities || [] }));
        })
        .catch(() => {
          setSuggestedMap((prev) => ({ ...prev, [dest.cityId]: [] }));
        });
    }
  }, [destinations]);

  // Ensure we always have exactly `days` entries (auto-fill gaps)
  const normalised = Array.from({ length: days }, (_, i) => {
    const existing = list.find((d) => d.day === i + 1);
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

  function toggleActivityForDay(dayIdx, act) {
    const dayObj = normalised[dayIdx];
    const isSelected = dayObj.activities.some((a) =>
      (typeof a === "string" ? a : a.name) === act.name
    );

    let updatedActs;
    if (isSelected) {
      updatedActs = dayObj.activities.filter((a) =>
        (typeof a === "string" ? a : a.name) !== act.name
      );
    } else {
      updatedActs = [
        ...dayObj.activities,
        {
          name: act.name,
          price: act.price || 0,
          activityId: act._id,
          category: act.category || "",
        },
      ];
    }
    update(dayIdx, { activities: updatedActs });
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

                {/* Activities Section */}
                <div>
                  {(() => {
                    const cityDest = getCityForDay(dayObj.day);
                    return (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-[12px] font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                            <Zap className="w-3.5 h-3.5 text-rose-500" />
                            Day Activities {cityDest ? `(${cityDest.cityName})` : ""}
                          </label>
                          <button
                            type="button"
                            onClick={() => setDialogDayIdx(dayIdx)}
                            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 text-[12px] font-extrabold hover:bg-indigo-100 transition-all shadow-2xs"
                          >
                            <Zap className="w-3.5 h-3.5 text-rose-500" />
                            + Select Activities
                          </button>
                        </div>

                        {/* Selected Activities Badges */}
                        {dayObj.activities.length === 0 ? (
                          <p className="text-[12px] text-gray-400 italic">
                            No activities selected for Day {dayObj.day}. Click "+ Select Activities" to choose.
                          </p>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {dayObj.activities.map((act, actIdx) => {
                              const actName = typeof act === "string" ? act : (act?.name || "");
                              const actPrice = typeof act === "string" ? 0 : (act?.price ?? 0);
                              return (
                                <span
                                  key={actIdx}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-950 text-[12.5px] font-extrabold shadow-2xs"
                                >
                                  <Zap className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />
                                  <span>{actName}</span>
                                  {actPrice > 0 && (
                                    <span className="text-[11px] text-emerald-700 font-black">
                                      (₹{actPrice.toLocaleString("en-IN")})
                                    </span>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => removeActivity(dayIdx, actIdx)}
                                    className="ml-1 text-slate-400 hover:text-rose-600 transition-colors"
                                    aria-label="Remove activity"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })()}
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

      {/* ── Activity Selection Dialog Modal ── */}
      {dialogDayIdx !== null && (() => {
        const dayObj = normalised[dialogDayIdx];
        const cityDest = getCityForDay(dayObj.day);
        const suggested = cityDest ? (suggestedMap[cityDest.cityId] || []) : [];

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
              onClick={() => setDialogDayIdx(null)}
            />

            {/* Modal Box */}
            <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200">
              {/* Header */}
              <div className="bg-gradient-to-r from-indigo-600 to-violet-700 px-6 py-5 text-white flex items-center justify-between">
                <div>
                  <p className="text-[10.5px] font-extrabold uppercase tracking-widest text-indigo-200">
                    Day {dayObj.day} Activities
                  </p>
                  <h3 className="text-[18px] font-black leading-tight">
                    {cityDest?.cityName ? `Activities in ${cityDest.cityName}` : `Select Activities`}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setDialogDayIdx(null)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                <p className="text-[12px] text-slate-500 font-medium">
                  Click any activity to add or remove it from Day {dayObj.day}.
                </p>

                {suggested.length === 0 ? (
                  <div className="py-8 text-center space-y-2">
                    <Zap className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="text-[13px] text-slate-500 font-semibold">
                      No activities found for {cityDest?.cityName || "this city"}.
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Add activities under Dashboard → Activities for {cityDest?.cityName || "this city"}.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {suggested.map((act) => {
                      const isSelected = dayObj.activities.some((a) =>
                        (typeof a === "string" ? a : a.name) === act.name
                      );
                      const coverImage = act.images?.[0]?.url;

                      return (
                        <button
                          key={act._id}
                          type="button"
                          onClick={() => toggleActivityForDay(dialogDayIdx, act)}
                          className={`w-full flex items-start justify-between gap-3 p-4 rounded-2xl border text-left transition-all ${
                            isSelected
                              ? "bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-700 border-indigo-600 text-white shadow-md"
                              : "bg-white border-slate-200 text-slate-800 hover:border-indigo-300 hover:shadow-xs"
                          }`}
                        >
                          {/* Left: Checkbox + Photo + Details */}
                          <div className="flex items-start gap-3 min-w-0 flex-1">
                            <span
                              className={`mt-1 w-5 h-5 rounded-lg border flex items-center justify-center text-[11px] font-black flex-shrink-0 ${
                                isSelected
                                  ? "bg-white text-indigo-600 border-white shadow-xs"
                                  : "border-slate-300 bg-slate-50 text-transparent"
                              }`}
                            >
                              ✓
                            </span>

                            {/* Activity Thumbnail */}
                            {coverImage && (
                              <img
                                src={coverImage}
                                alt={act.name}
                                className="w-12 h-12 rounded-xl object-cover flex-shrink-0 border border-slate-200/60 shadow-2xs"
                              />
                            )}

                            <div className="min-w-0 flex-1 space-y-1">
                              <p className="text-[13.5px] leading-tight font-extrabold truncate">{act.name}</p>

                              {/* Category & Duration */}
                              <div className="flex items-center gap-2 flex-wrap text-[10.5px]">
                                {act.category && (
                                  <span className={`px-2 py-0.5 rounded-md font-bold uppercase tracking-wider ${
                                    isSelected ? "bg-white/20 text-white" : "bg-indigo-50 text-indigo-700"
                                  }`}>
                                    {act.category}
                                  </span>
                                )}
                                {act.duration && (
                                  <span className={`flex items-center gap-1 font-semibold ${
                                    isSelected ? "text-indigo-200" : "text-slate-500"
                                  }`}>
                                    <Clock className="w-3 h-3" /> {act.duration}
                                  </span>
                                )}
                              </div>

                              {/* Description Preview */}
                              {act.description && (
                                <p className={`text-[11.5px] line-clamp-2 leading-relaxed ${
                                  isSelected ? "text-indigo-100" : "text-slate-500"
                                }`}>
                                  {act.description}
                                </p>
                              )}

                              {/* Inclusions */}
                              {act.inclusions?.length > 0 && (
                                <div className="flex items-center gap-1 flex-wrap pt-0.5">
                                  {act.inclusions.slice(0, 3).map((inc, i) => (
                                    <span
                                      key={i}
                                      className={`text-[9.5px] px-1.5 py-0.5 rounded font-bold ${
                                        isSelected ? "bg-white/15 text-indigo-100" : "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                      }`}
                                    >
                                      ✓ {inc}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Right: Price */}
                          <div className="flex flex-col items-end flex-shrink-0 pt-0.5">
                            {act.price > 0 ? (
                              <span
                                className={`text-[13px] font-black px-3 py-1 rounded-full whitespace-nowrap ${
                                  isSelected
                                    ? "bg-white/20 text-white border border-white/30"
                                    : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                }`}
                              >
                                ₹{act.price.toLocaleString("en-IN")}
                              </span>
                            ) : (
                              <span className={`text-[11px] font-bold ${isSelected ? "text-indigo-200" : "text-slate-400"}`}>
                                Free
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                <span className="text-[12px] font-bold text-slate-600">
                  {dayObj.activities.length} activity selected
                </span>
                <button
                  type="button"
                  onClick={() => setDialogDayIdx(null)}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-extrabold text-[13px] hover:bg-indigo-700 transition-colors shadow-sm"
                >
                  Done & Save
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
