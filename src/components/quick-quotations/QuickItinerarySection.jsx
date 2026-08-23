"use client";

import { useState } from "react";
import {
  Compass, Plus, Trash2, ChevronDown, ChevronUp,
  Sparkles, Clock, Check, Utensils, Tag, MapPin,
  Calendar, Layers, CheckCheck, Sun, Moon, Coffee,
  Camera, Navigation, Flag, ShieldCheck, Edit3, X,
  FileText, CheckCircle2, ArrowUp, ArrowDown, Copy,
  Eye, EyeOff,
} from "lucide-react";

const THEME_PRESETS = {
  honeymoon: [
    { title: "Romantic Arrival, Flower Bed & Candlelight Welcome", activities: ["Airport Pickup", "Candlelight Dinner", "Flower Bed Decor", "Sunset Walk"] },
    { title: "Private Scenic Valleys, Tea Gardens & Viewpoints", activities: ["Private Cab Sightseeing", "Tea Plantation Walk", "Photo Point", "Sunset View"] },
    { title: "Serene Backwaters, Houseboat Cruise & Lagoon Stay", activities: ["Houseboat Check-in", "Backwater Cruise", "Traditional Lunch", "Sunset on Deck"] },
    { title: "Beachfront Candlelight Dinner & Spa Relaxation", activities: ["Couples Spa", "Beach Walk", "Seafood Dinner", "Sunset Photography"] },
    { title: "Cherished Farewell & Departure Transfer", activities: ["Breakfast", "Souvenir Shopping", "Airport Drop"] },
  ],
  mountain: [
    { title: "Arrival in Misty Hills & Mountain Resort Check-in", activities: ["Mountain Drive", "Resort Check-in", "Bonfire Evening", "Leisure Walk"] },
    { title: "Full-Day Peak Viewpoints, Waterfalls & Pine Forests", activities: ["Waterfall Visit", "Pine Forest Trail", "Valley View", "Local Market"] },
    { title: "Adventure Valley, Cable Car / Ropeway & Trekking", activities: ["Ropeway Ride", "Nature Trek", "Adventure Activities", "Cafe Hop"] },
    { title: "High-Altitude Pass Excursion & Snow/River Spot", activities: ["High Pass Visit", "River Crossing", "Photo Spot", "Local Snacks"] },
    { title: "Scenic Return Drive & Departure Transfer", activities: ["Breakfast", "Check-out", "Scenic Return Drive", "Departure Drop"] },
  ],
  beach: [
    { title: "Arrival in Coastal Paradise & Beach Resort Check-in", activities: ["Airport Pickup", "Resort Check-in", "Beach Sunset Walk", "Welcome Drink"] },
    { title: "Island Hopping, Watersports & Snorkeling / Scuba", activities: ["Speedboat Ride", "Watersports", "Snorkeling", "Seafood Lunch"] },
    { title: "Heritage Forts, Coastal Cafes & Sunset Cruise", activities: ["Coastal Fort Visit", "Beach Shacks", "Sunset Cruise", "Live Music"] },
    { title: "Leisure Beach Day, Spa & Night Flea Market", activities: ["Beach Lounging", "Ayurvedic Massage", "Flea Market", "Beach Dining"] },
    { title: "Tropical Farewell & Airport Departure", activities: ["Beach Walk", "Breakfast Buffet", "Hotel Check-out", "Airport Transfer"] },
  ],
  general: [
    { title: "Arrival & Scenic Hotel Check-in", activities: ["Airport Pickup", "Hotel Check-in", "Evening Leisure Walk"] },
    { title: "Full-Day Iconic Landmarks & City Sightseeing", activities: ["Full-Day Sightseeing", "Heritage Monuments", "Scenic Valley View", "Local Market"] },
    { title: "Cultural Heritage, Nature Exploration & Bazaars", activities: ["Local Culture", "Plantation Walk", "Sunset Photography"] },
    { title: "Scenic Excursion, Local Cuisine & Leisure Delights", activities: ["Scenic Excursion", "Regional Cuisine", "Sunset Point"] },
    { title: "Departure Transfer with Wonderful Memories", activities: ["Morning Breakfast", "Hotel Check-out", "Departure Transfer"] },
  ],
};

const ACTIVITY_SUGGESTIONS = [
  "Airport / Station Pickup",
  "Hotel Check-in & Welcome",
  "Full-Day Guided Sightseeing",
  "Heritage Fort / Monument Visit",
  "Scenic Sunset Viewpoint",
  "Boating / Shikara Cruise",
  "Tea / Spice Plantation Walk",
  "Jeep Safari & Wildlife Trail",
  "Watersports & Island Hopping",
  "Couples Candlelight Dinner",
  "Local Street Food & Bazaars",
  "Evening Cultural Dance Show",
  "Ayurvedic Spa & Wellness",
  "Departure Airport Drop",
];

export default function QuickItinerarySection({
  itinerary = [],
  onChange,
  showItinerary = true,
  onToggleShowItinerary,
  daysCount = 5,
  destination = "",
  theme = "honeymoon",
  hotelStays = [],
}) {
  const [activeTabDay, setActiveTabDay] = useState("all"); // "all" | number (0-indexed)
  const [editingDayIndex, setEditingDayIndex] = useState(null); // index of day being edited in modal
  const [newActivityInput, setNewActivityInput] = useState("");

  // Auto-generate realistic itinerary based on destination, duration and theme
  function generateDefaultItinerary() {
    const dest = destination.trim() || "Destination";
    const themeKey = THEME_PRESETS[theme] ? theme : "general";
    const templates = THEME_PRESETS[themeKey];
    const generated = [];

    for (let i = 1; i <= daysCount; i++) {
      const matchingStay = hotelStays[Math.min(i - 1, hotelStays.length - 1)];
      const city = matchingStay?.cityName || dest;
      const template = templates[Math.min(i - 1, templates.length - 1)];

      let title = "";
      let description = "";
      let activities = [];

      if (i === 1) {
        title = `Day 1: Arrival in ${city} • ${template.title}`;
        description = `Arrive at the airport / railway station. Meet and greet with our private representative and transfer smoothly to your booked hotel in ${city}. Complete check-in formalities and enjoy leisure time exploring local surroundings and markets.`;
        activities = template.activities || ["Airport Pickup", "Hotel Check-in", "Evening Leisure Walk"];
      } else if (i === daysCount) {
        title = `Day ${i}: Departure from ${city} with Wonderful Memories`;
        description = `Relish a delicious breakfast at the hotel, complete check-out formalities, and transfer comfortably in your private vehicle to the airport/station for onward journey.`;
        activities = ["Morning Breakfast", "Hotel Check-out", "Departure Transfer"];
      } else {
        title = `Day ${i}: ${city} • ${template.title.replace(/^Day \d+[:\s-]*/i, "")}`;
        description = `After breakfast, embark on a curated full-day sightseeing tour of ${city} exploring scenic viewpoints, famous landmarks, and cultural highlights.`;
        activities = template.activities || ["Full-Day Sightseeing", "Monument Visits", "Scenic Viewpoint"];
      }

      generated.push({
        day: i,
        city: city,
        title,
        description,
        activities,
        meals: {
          breakfast: true,
          lunch: false,
          dinner: i === 1 || theme === "honeymoon",
        },
      });
    }

    onChange(generated);
  }

  function handleDayChange(index, field, value) {
    const updated = [...itinerary];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    onChange(updated);
  }

  function handleMealToggle(index, mealType) {
    const updated = [...itinerary];
    const currentMeals = updated[index]?.meals || { breakfast: true, lunch: false, dinner: false };
    updated[index] = {
      ...updated[index],
      meals: {
        ...currentMeals,
        [mealType]: !currentMeals[mealType],
      },
    };
    onChange(updated);
  }

  function handleAddActivityToDay(index, text) {
    const act = (text || newActivityInput).trim();
    if (!act) return;

    const updated = [...itinerary];
    const currentActivities = updated[index]?.activities || [];
    if (!currentActivities.includes(act)) {
      updated[index] = {
        ...updated[index],
        activities: [...currentActivities, act],
      };
      onChange(updated);
    }
    setNewActivityInput("");
  }

  function handleRemoveActivity(dayIndex, actIndex) {
    const updated = [...itinerary];
    const currentActivities = updated[dayIndex]?.activities || [];
    updated[dayIndex] = {
      ...updated[dayIndex],
      activities: currentActivities.filter((_, idx) => idx !== actIndex),
    };
    onChange(updated);
  }

  function handleAddDay() {
    const nextDay = itinerary.length + 1;
    const matchingStay = hotelStays[Math.min(nextDay - 1, hotelStays.length - 1)];
    const city = matchingStay?.cityName || destination || "Destination";

    const newDay = {
      day: nextDay,
      city: city,
      title: `Day ${nextDay}: Sightseeing & Exploration in ${city}`,
      description: `Explore local attractions and enjoy leisure sightseeing.`,
      activities: ["Local Sightseeing", "Leisure Time"],
      meals: { breakfast: true, lunch: false, dinner: false },
    };
    onChange([...itinerary, newDay]);
    setEditingDayIndex(itinerary.length);
  }

  function handleMoveDay(index, direction) {
    const target = index + direction;
    if (target < 0 || target >= itinerary.length) return;

    const updated = [...itinerary];
    const [moved] = updated.splice(index, 1);
    updated.splice(target, 0, moved);

    const reindexed = updated.map((d, i) => ({ ...d, day: i + 1 }));
    onChange(reindexed);
  }

  
  function handleRemoveDay(index) {
    if (itinerary.length <= 1) return;
    const updated = itinerary
      .filter((_, i) => i !== index)
      .map((d, i) => ({ ...d, day: i + 1 }));
    onChange(updated);
    if (editingDayIndex === index) {
      setEditingDayIndex(null);
    }
  }

  const displayedDays = activeTabDay === "all"
    ? itinerary
    : itinerary.filter((_, idx) => idx === activeTabDay);

  const editingDay = editingDayIndex !== null ? itinerary[editingDayIndex] : null;

  return (
    <div className={`bg-white rounded-3xl border transition-all ${
      showItinerary ? "border-slate-200/90 shadow-xs" : "border-slate-200/60 bg-slate-50/50"
    } p-5 sm:p-7 space-y-5`}>
      {/* ── Minimalist Clean Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black transition-colors ${
            showItinerary
              ? "bg-indigo-600 text-white shadow-xs"
              : "bg-slate-200 text-slate-500"
          }`}>
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-[16px] font-black text-slate-900">Day-by-Day Tour Itinerary</h3>
              {showItinerary ? (
                <span className="text-[10.5px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.2 rounded-md border border-indigo-200">
                  {itinerary.length} Days Planned
                </span>
              ) : (
                <span className="text-[10px] font-black uppercase text-slate-400 bg-slate-100 px-2 py-0.2 rounded-md border border-slate-200">
                  Hidden from Proposal
                </span>
              )}
            </div>
            <p className="text-[11.5px] text-slate-400 font-medium">
              Daily sightseeing route, transfer schedule, meals &amp; activities
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap self-end sm:self-auto">
          {/* Hide / Show Switch */}
          {onToggleShowItinerary && (
            <button
              type="button"
              onClick={onToggleShowItinerary}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11.5px] font-black transition-all ${
                showItinerary
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100 shadow-2xs"
                  : "bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200"
              }`}
              title={showItinerary ? "Click to hide itinerary from proposal" : "Click to include itinerary in proposal"}
            >
              {showItinerary ? (
                <>
                  <Eye className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Visible in Proposal</span>
                </>
              ) : (
                <>
                  <EyeOff className="w-3.5 h-3.5 text-slate-500" />
                  <span>Hidden in Proposal</span>
                </>
              )}
            </button>
          )}

          {showItinerary && (
            <>
              <button
                type="button"
                onClick={generateDefaultItinerary}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-[11.5px] font-black transition-all shadow-2xs"
                title="Auto-fill itinerary days based on destination & theme"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Auto-Generate</span>
              </button>

              <button
                type="button"
                onClick={handleAddDay}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-[11.5px] font-black transition-all shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5 text-amber-400" />
                <span>Add Day</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* When Hidden Banner */}
      {!showItinerary ? (
        <div className="py-3 px-4 rounded-2xl bg-slate-100/90 border border-slate-200 flex items-center justify-between gap-3 text-[12px] text-slate-600">
          <div className="flex items-center gap-2">
            <EyeOff className="w-4 h-4 text-slate-400" />
            <span className="font-semibold">Day-by-Day Itinerary is currently hidden from the client's quotation proposal.</span>
          </div>
          {onToggleShowItinerary && (
            <button
              type="button"
              onClick={onToggleShowItinerary}
              className="text-[11.5px] font-black text-indigo-600 hover:underline"
            >
              Show Itinerary
            </button>
          )}
        </div>
      ) : itinerary.length === 0 ? (
        /* Empty State */
        <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-4 space-y-2">
          <p className="text-[13px] font-bold text-slate-700">No Day-by-Day Itinerary Added Yet</p>
          <p className="text-[11.5px] text-slate-400">Click Auto-Generate to build a realistic {daysCount}-day sightseeing plan in 1 click.</p>
          <button
            type="button"
            onClick={generateDefaultItinerary}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[12px] shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Generate {daysCount}-Day Plan</span>
          </button>
        </div>
      ) : (
        <>
          {/* ── Day Navigation Pill Bar (Minimalist) ── */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11.5px]">
            <button
              type="button"
              onClick={() => setActiveTabDay("all")}
              className={`px-3 py-1 rounded-xl font-bold transition-all whitespace-nowrap border ${
                activeTabDay === "all"
                  ? "bg-slate-900 text-white border-slate-900 shadow-2xs"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200"
              }`}
            >
              All Days ({itinerary.length})
            </button>

            {itinerary.map((dayItem, idx) => {
              const matchingStay = hotelStays[Math.min(idx, hotelStays.length - 1)];
              const city = dayItem.city || matchingStay?.cityName;

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveTabDay(idx)}
                  className={`px-2.5 py-1 rounded-xl font-medium transition-all whitespace-nowrap border flex items-center gap-1.5 ${
                    activeTabDay === idx
                      ? "bg-indigo-600 text-white border-indigo-600 font-bold shadow-2xs"
                      : "bg-white text-slate-700 hover:bg-indigo-50 border-slate-200"
                  }`}
                >
                  <span className="font-mono text-[10.5px] opacity-80 font-bold">D{dayItem.day || idx + 1}</span>
                  <span className="truncate max-w-[110px]">
                    {city ? `${city}` : `Day ${idx + 1}`}
                  </span>
                </button>
              );
            })}
          </div>

          {/* ── Minimalist Timeline Stream Layout ── */}
          <div className="relative pl-6 sm:pl-7 before:absolute before:left-3 before:top-3 before:bottom-3 before:w-0.5 before:bg-gradient-to-b before:from-indigo-600 before:via-amber-400 before:to-purple-600 space-y-4">
            {displayedDays.map((dayItem, realIdx) => {
              const idx = activeTabDay === "all" ? realIdx : activeTabDay;
              const meals = dayItem.meals || { breakfast: true, lunch: false, dinner: false };
              const matchingStay = hotelStays[Math.min(idx, hotelStays.length - 1)];
              const cityLeg = dayItem.city || matchingStay?.cityName || destination;

              return (
                <div
                  key={idx}
                  className="relative group"
                >
                  {/* Timeline Milestone Circular Node */}
                  <div className="absolute -left-[29px] sm:-left-[33px] top-3.5 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-slate-950 border-2 border-white text-amber-400 font-mono font-black text-[10px] sm:text-[11px] flex items-center justify-center shadow-xs ring-2 ring-indigo-100 z-10">
                    {dayItem.day || idx + 1}
                  </div>

                  {/* Day Content Card (Minimalist) */}
                  <div className="bg-slate-50/70 hover:bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 hover:border-indigo-300 transition-all shadow-2xs space-y-2.5">
                    {/* Top Row: Title, City, Meals & Edit Button */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-900 font-mono font-black text-[10.5px] whitespace-nowrap">
                          DAY {dayItem.day || idx + 1}
                        </span>

                        {cityLeg && (
                          <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-200/80 font-bold text-[10.5px] flex items-center gap-1 flex-shrink-0">
                            <MapPin className="w-2.5 h-2.5 text-amber-600" />
                            <span>{cityLeg}</span>
                          </span>
                        )}

                        <h4
                          onClick={() => setEditingDayIndex(idx)}
                          className="text-[14px] font-black text-slate-900 truncate cursor-pointer hover:text-indigo-600 transition-colors"
                          title="Click to edit day details"
                        >
                          {dayItem.title || `Day ${idx + 1} Sightseeing & Experience`}
                        </h4>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-auto">
                        {/* Compact Meals Badge */}
                        <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200 text-[10.5px] font-bold">
                          <button
                            type="button"
                            onClick={() => handleMealToggle(idx, "breakfast")}
                            className={`px-1.5 py-0.5 rounded transition-all flex items-center gap-0.5 ${
                              meals.breakfast ? "bg-amber-100 text-amber-950 font-bold" : "text-slate-300 hover:text-slate-600"
                            }`}
                            title="Breakfast"
                          >
                            <span>🌅</span> <span>BF</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMealToggle(idx, "lunch")}
                            className={`px-1.5 py-0.5 rounded transition-all flex items-center gap-0.5 ${
                              meals.lunch ? "bg-orange-100 text-orange-950 font-bold" : "text-slate-300 hover:text-slate-600"
                            }`}
                            title="Lunch"
                          >
                            <span>☀️</span> <span>LN</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMealToggle(idx, "dinner")}
                            className={`px-1.5 py-0.5 rounded transition-all flex items-center gap-0.5 ${
                              meals.dinner ? "bg-purple-100 text-purple-950 font-bold" : "text-slate-300 hover:text-slate-600"
                            }`}
                            title="Dinner"
                          >
                            <span>🌙</span> <span>DN</span>
                          </button>
                        </div>

                        {/* ✏️ Minimalist Edit Day Button */}
                        <button
                          type="button"
                          onClick={() => setEditingDayIndex(idx)}
                          className="flex items-center gap-1 px-3 py-1 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 font-black text-[11.5px] transition-all shadow-2xs active:scale-95"
                          title="Click to edit day title, schedule narrative & activities"
                        >
                          <Edit3 className="w-3 h-3 text-indigo-600" />
                          <span>Edit</span>
                        </button>

                        {/* Reorder / Delete */}
                        <div className="flex items-center bg-white p-0.5 rounded-lg border border-slate-200">
                          <button
                            type="button"
                            onClick={() => handleMoveDay(idx, -1)}
                            disabled={idx === 0}
                            className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20"
                            title="Move Up"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveDay(idx, 1)}
                            disabled={idx === itinerary.length - 1}
                            className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20"
                            title="Move Down"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                          {itinerary.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveDay(idx)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded"
                              title="Delete Day"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Day Narrative Description (Minimalist Line-clamp Preview) */}
                    {dayItem.description ? (
                      <p
                        onClick={() => setEditingDayIndex(idx)}
                        className="text-[12.5px] text-slate-600 leading-relaxed font-normal cursor-pointer hover:text-slate-900 transition-colors pl-0.5 line-clamp-2"
                        title="Click to edit narrative"
                      >
                        {dayItem.description}
                      </p>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setEditingDayIndex(idx)}
                        className="text-[11.5px] font-bold text-slate-400 hover:text-indigo-600 p-2 rounded-xl border border-dashed border-slate-200 w-full text-left bg-white/60"
                      >
                        + Click to write Day {dayItem.day || idx + 1} schedule details...
                      </button>
                    )}

                    {/* Activity Chips (Minimalist) */}
                    {dayItem.activities && dayItem.activities.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1 pl-0.5 border-t border-slate-100">
                        {dayItem.activities.map((act, actIdx) => (
                          <span
                            key={actIdx}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white text-indigo-950 border border-slate-200 text-[10.5px] font-semibold"
                          >
                            <Check className="w-2.5 h-2.5 text-indigo-600" />
                            <span>{act}</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveActivity(idx, actIdx);
                              }}
                              className="text-slate-400 hover:text-rose-600 ml-0.5"
                              title="Remove activity"
                            >
                              <X className="w-2.5 h-2.5" />
                            </button>
                          </span>
                        ))}
                        <button
                          type="button"
                          onClick={() => setEditingDayIndex(idx)}
                          className="text-[10.5px] font-bold text-indigo-600 hover:underline px-1"
                        >
                          + Add
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ── 🌟 Dedicated Day Itinerary Studio Modal Dialog (Opens when clicking Edit) ── */}
      {editingDayIndex !== null && editingDay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm"
            onClick={() => setEditingDayIndex(null)}
          />

          {/* Modal Container */}
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh] animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="bg-slate-950 p-4 px-6 text-white flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-mono font-black text-[13px]">
                  D{editingDay.day || editingDayIndex + 1}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2 py-0.2 rounded-md">
                      Day Editor
                    </span>
                    {editingDay.city && (
                      <span className="text-[10px] font-bold text-indigo-300 bg-indigo-500/20 px-2 py-0.2 rounded-md">
                        📍 {editingDay.city}
                      </span>
                    )}
                  </div>
                  <h3 className="text-[16px] font-black text-white leading-tight mt-0.5">
                    Edit Day {editingDay.day || editingDayIndex + 1} Itinerary
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setEditingDayIndex(null)}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4">
              {/* Day Title & City */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-8">
                  <label className="block text-[11.5px] font-bold text-slate-700 mb-1">
                    Day Title / Route *
                  </label>
                  <input
                    type="text"
                    value={editingDay.title || ""}
                    onChange={(e) => handleDayChange(editingDayIndex, "title", e.target.value)}
                    placeholder="e.g. Arrival in Munnar & Hotel Check-in"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-bold text-[13.5px] text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs"
                  />
                </div>

                <div className="sm:col-span-4">
                  <label className="block text-[11.5px] font-bold text-slate-700 mb-1">
                    City / Leg
                  </label>
                  <input
                    type="text"
                    value={editingDay.city || ""}
                    onChange={(e) => handleDayChange(editingDayIndex, "city", e.target.value)}
                    placeholder="e.g. Munnar"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-[13px] text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs"
                  />
                </div>
              </div>

              {/* Meal Plan Included Toggles */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-700">
                  Included Meals for Day {editingDay.day || editingDayIndex + 1}
                </label>
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleMealToggle(editingDayIndex, "breakfast")}
                    className={`flex-1 py-1.5 rounded-xl text-[11.5px] font-black transition-all flex items-center justify-center gap-1 border ${
                      editingDay.meals?.breakfast
                        ? "bg-amber-500 text-white border-amber-600 shadow-2xs"
                        : "bg-white text-slate-600 hover:bg-slate-100 border-slate-200"
                    }`}
                  >
                    <span>🌅</span> <span>Breakfast</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleMealToggle(editingDayIndex, "lunch")}
                    className={`flex-1 py-1.5 rounded-xl text-[11.5px] font-black transition-all flex items-center justify-center gap-1 border ${
                      editingDay.meals?.lunch
                        ? "bg-orange-500 text-white border-orange-600 shadow-2xs"
                        : "bg-white text-slate-600 hover:bg-slate-100 border-slate-200"
                    }`}
                  >
                    <span>☀️</span> <span>Lunch</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleMealToggle(editingDayIndex, "dinner")}
                    className={`flex-1 py-1.5 rounded-xl text-[11.5px] font-black transition-all flex items-center justify-center gap-1 border ${
                      editingDay.meals?.dinner
                        ? "bg-purple-600 text-white border-purple-700 shadow-2xs"
                        : "bg-white text-slate-600 hover:bg-slate-100 border-slate-200"
                    }`}
                  >
                    <span>🌙</span> <span>Dinner</span>
                  </button>
                </div>
              </div>

              {/* Day Description Narrative */}
              <div>
                <label className="block text-[11.5px] font-bold text-slate-700 mb-1">
                  Sightseeing Schedule &amp; Narrative *
                </label>
                <textarea
                  rows={4}
                  value={editingDay.description || ""}
                  onChange={(e) => handleDayChange(editingDayIndex, "description", e.target.value)}
                  placeholder="Describe pickup time, transfer routes, sightseeing spots, viewpoints, leisure time..."
                  className="w-full p-3.5 rounded-xl border border-slate-300 font-medium text-[13px] text-slate-800 leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs"
                />
              </div>

              {/* Activities / Experiences */}
              <div className="space-y-2">
                <label className="block text-[11.5px] font-bold text-slate-700">
                  Featured Experiences &amp; Activity Badges
                </label>

                <div className="flex flex-wrap items-center gap-1.5">
                  {(editingDay.activities || []).map((act, actIdx) => (
                    <span
                      key={actIdx}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-950 border border-indigo-200 font-bold text-[11.5px]"
                    >
                      <Check className="w-3 h-3 text-indigo-600" />
                      <span>{act}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveActivity(editingDayIndex, actIdx)}
                        className="text-indigo-400 hover:text-rose-600 ml-1"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={newActivityInput}
                    onChange={(e) => setNewActivityInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddActivityToDay(editingDayIndex, newActivityInput);
                      }
                    }}
                    placeholder="Type custom activity & press Enter..."
                    className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 text-[12.5px] bg-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddActivityToDay(editingDayIndex, newActivityInput)}
                    className="px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-[12px]"
                  >
                    + Add
                  </button>
                </div>

                {/* 1-Click Suggestions */}
                <div className="pt-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Suggestions:
                  </p>
                  <div className="flex flex-wrap items-center gap-1">
                    {ACTIVITY_SUGGESTIONS.map((sug, sIdx) => {
                      const alreadyAdded = (editingDay.activities || []).includes(sug);
                      return (
                        <button
                          key={sIdx}
                          type="button"
                          disabled={alreadyAdded}
                          onClick={() => handleAddActivityToDay(editingDayIndex, sug)}
                          className={`px-2 py-0.5 rounded-md text-[10.5px] font-medium transition-all border ${
                            alreadyAdded
                              ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                              : "bg-white text-slate-700 hover:bg-indigo-50 border-slate-200"
                          }`}
                        >
                          + {sug}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 border-t border-slate-200 p-3 px-6 flex items-center justify-between flex-shrink-0">
              <button
                type="button"
                onClick={() => setEditingDayIndex(null)}
                className="px-4 py-1.5 rounded-xl border border-slate-300 bg-white text-slate-700 font-bold text-[12px]"
              >
                Close
              </button>

              <button
                type="button"
                onClick={() => setEditingDayIndex(null)}
                className="flex items-center gap-1.5 px-5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[12.5px] shadow-xs"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Apply Day {editingDay.day || editingDayIndex + 1} Changes</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
