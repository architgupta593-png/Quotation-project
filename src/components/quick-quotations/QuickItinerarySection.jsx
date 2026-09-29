"use client";

import { useState } from "react";
import {
  Compass, Plus, Trash2, ChevronDown, ChevronUp,
  Clock, Check, Utensils, Tag, MapPin,
  Calendar, Layers, CheckCheck, Sun, Moon, Coffee,
  Camera, Navigation, Flag, ShieldCheck, Edit3, X,
  FileText, CheckCircle2, ArrowUp, ArrowDown, Copy,
  Hotel, ChevronsUpDown,
} from "lucide-react";
import DescriptionEditorDialog from "@/components/packages/DescriptionEditorDialog";

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

export function getActivityIcon(text = "") {
  const t = (text || "").toLowerCase();
  if (t.includes("pickup") || t.includes("drop") || t.includes("transfer") || t.includes("cab") || t.includes("drive")) return "🚗";
  if (t.includes("check-in") || t.includes("check-out") || t.includes("hotel") || t.includes("resort") || t.includes("stay")) return "🏨";
  if (t.includes("boat") || t.includes("cruise") || t.includes("shikara") || t.includes("ferry") || t.includes("water") || t.includes("snorkel")) return "🚤";
  if (t.includes("sightseeing") || t.includes("monument") || t.includes("temple") || t.includes("fort") || t.includes("photo") || t.includes("point")) return "📸";
  if (t.includes("dinner") || t.includes("lunch") || t.includes("breakfast") || t.includes("food") || t.includes("meal")) return "🍽️";
  if (t.includes("tea") || t.includes("spice") || t.includes("market") || t.includes("shop") || t.includes("bazaar")) return "🛍️";
  if (t.includes("sunset") || t.includes("sunrise")) return "🌅";
  if (t.includes("trek") || t.includes("mountain") || t.includes("hill") || t.includes("safari")) return "🏔️";
  if (t.includes("beach") || t.includes("island") || t.includes("sea")) return "🏖️";
  if (t.includes("spa") || t.includes("wellness") || t.includes("candlelight")) return "🕯️";
  return "✨";
}

export const MEAL_PLAN_DESCRIPTIONS = {
  EP: {
    code: "EP",
    name: "Room Only",
    industryTerm: "European Plan",
    meaning: "Room Only (No Meals Included)",
    shortMeaning: "Room Only (No Meals)",
    tag: "Room Only",
    badge: "EP • Room Only (No Meals)",
    clientExplanation: "Accommodation only. No meals (Breakfast, Lunch or Dinner) are included in this stay.",
  },
  CP: {
    code: "CP",
    name: "Bed & Breakfast",
    industryTerm: "Continental Plan",
    meaning: "Daily Breakfast Included (Bed & Breakfast)",
    shortMeaning: "Breakfast Included",
    tag: "Breakfast Included",
    badge: "CP • Breakfast Included",
    clientExplanation: "Daily delicious morning breakfast included at the hotel.",
  },
  MAP: {
    code: "MAP",
    name: "Half Board",
    industryTerm: "Modified American Plan",
    meaning: "Breakfast + Dinner Included (Half Board)",
    shortMeaning: "Breakfast & Dinner Included",
    tag: "Breakfast + Dinner",
    badge: "MAP • Breakfast & Dinner Included",
    clientExplanation: "Both daily morning breakfast and evening dinner included at the hotel.",
  },
  AP: {
    code: "AP",
    name: "Full Board",
    industryTerm: "American Plan",
    meaning: "All Meals Included (Breakfast, Lunch & Dinner)",
    shortMeaning: "All Meals Included (B+L+D)",
    tag: "All Meals Included",
    badge: "AP • All Meals Included",
    clientExplanation: "All 3 daily meals included: Breakfast, Lunch, and Dinner at the hotel.",
  },
};

export function getMealPlanLabel(planCode) {
  const p = String(planCode || "CP").toUpperCase().trim();
  return MEAL_PLAN_DESCRIPTIONS[p] || {
    code: p,
    name: "Custom Plan",
    industryTerm: `${p} Plan`,
    meaning: `${p} Meal Plan`,
    shortMeaning: `${p} Plan`,
    tag: `${p} Plan`,
    badge: `${p} Plan`,
    clientExplanation: `${p} meal plan assigned by hotel.`,
  };
}

/**
 * Resolves the corresponding hotel stay leg for a given itinerary day index.
 * Accounts for variable stay night counts (e.g. 2 nights Munnar, 1 night Thekkady).
 */
export function getStayForDay(dayIndex, hotelStays = []) {
  if (!hotelStays || hotelStays.length === 0) return null;
  let currentDay = 0;
  for (let i = 0; i < hotelStays.length; i++) {
    const stay = hotelStays[i];
    const nights = Math.max(1, parseInt(stay.nights, 10) || 1);
    if (dayIndex >= currentDay && dayIndex < currentDay + nights) {
      return { ...stay, stayIndex: i, stayNight: dayIndex - currentDay + 1, isDepartureDay: false };
    }
    currentDay += nights;
  }
  // For the final departure day (dayIndex >= currentDay), guest checks out from the last stay
  const lastStay = hotelStays[hotelStays.length - 1];
  return lastStay ? { ...lastStay, stayIndex: hotelStays.length - 1, stayNight: lastStay.nights || 1, isDepartureDay: true } : null;
}

/**
 * Derives the exact meal inclusions according to the hotel's selected meal plan.
 */
export function getMealsFromStay(stay, dayIndex, totalDays) {
  const isFirstDay = dayIndex === 0;
  const isLastDay = dayIndex === totalDays - 1;
  const hasHotel = Boolean(stay && (stay.hotelName?.trim() || stay.hotelId));

  if (!hasHotel) {
    return {
      hasHotel: false,
      hotelName: "",
      roomType: "",
      mealPlan: null,
      mealPlanLabel: "",
      mealPlanMeaning: "",
      planDesc: null,
      meals: { breakfast: false, lunch: false, dinner: false },
    };
  }

  const plan = String(stay.mealPlan || "CP").toUpperCase().trim();
  const planDesc = getMealPlanLabel(plan);
  let meals = { breakfast: false, lunch: false, dinner: false };

  switch (plan) {
    case "EP":
      meals = { breakfast: false, lunch: false, dinner: false };
      break;

    case "CP":
      meals = {
        breakfast: totalDays === 1 ? true : !isFirstDay,
        lunch: false,
        dinner: false,
      };
      break;

    case "MAP":
      meals = {
        breakfast: totalDays === 1 ? true : !isFirstDay,
        lunch: false,
        dinner: totalDays === 1 ? true : !isLastDay,
      };
      break;

    case "AP":
      meals = {
        breakfast: totalDays === 1 ? true : !isFirstDay,
        lunch: !isLastDay,
        dinner: !isLastDay,
      };
      break;

    default:
      meals = {
        breakfast: !isFirstDay,
        lunch: false,
        dinner: false,
      };
      break;
  }

  return {
    hasHotel: true,
    hotelName: stay.hotelName,
    roomType: stay.roomType,
    mealPlan: plan,
    mealPlanLabel: planDesc.badge,
    mealPlanMeaning: planDesc.meaning,
    planDesc,
    meals,
  };
}

/**
 * Synchronizes an itinerary array's meals with the current hotel stays.
 */
export function syncItineraryWithHotelStays(itinerary = [], hotelStays = [], totalDays = null) {
  const daysCount = totalDays || itinerary.length || (hotelStays.reduce((acc, s) => acc + (Math.max(1, parseInt(s.nights, 10) || 1)), 0) + 1);

  return itinerary.map((dayItem, idx) => {
    const stayInfo = getStayForDay(idx, hotelStays);
    const mealInfo = getMealsFromStay(stayInfo, idx, daysCount);

    return {
      ...dayItem,
      city: dayItem.city || stayInfo?.cityName || "",
      meals: mealInfo.meals,
    };
  });
}

export default function QuickItinerarySection({
  itinerary = [],
  onChange,
  daysCount = 5,
  destination = "",
  hotelStays = [],
}) {
  // Accordion State: Track which day card indices are expanded
  const [openDays, setOpenDays] = useState(() => new Set([0]));
  const [editingDayIndex, setEditingDayIndex] = useState(null); // index of day being edited in modal
  const [richEditorDayIdx, setRichEditorDayIdx] = useState(null); // index of day being edited in TipTap rich text modal
  const [newActivityInput, setNewActivityInput] = useState("");

  const areAllOpen = itinerary.length > 0 && openDays.size === itinerary.length;

  function toggleDayAccordion(index) {
    setOpenDays((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }

  function handleToggleAllAccordions() {
    if (areAllOpen) {
      setOpenDays(new Set());
    } else {
      setOpenDays(new Set(itinerary.map((_, i) => i)));
    }
  }

  function handleDayChange(index, field, value) {
    const updated = [...itinerary];
    updated[index] = {
      ...updated[index],
      [field]: value,
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
    const nextIndex = itinerary.length;
    onChange([...itinerary, newDay]);
    
    // Auto expand the new day
    setOpenDays((prev) => new Set([...prev, nextIndex]));
    setEditingDayIndex(nextIndex);
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
    // Update openDays set
    setOpenDays((prev) => {
      const next = new Set();
      prev.forEach((i) => {
        if (i < index) next.add(i);
        else if (i > index) next.add(i - 1);
      });
      return next;
    });
  }

  const editingDay = editingDayIndex !== null ? itinerary[editingDayIndex] : null;

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 hover:border-amber-400/50 shadow-xs p-5 sm:p-7 space-y-5 transition-all">
      {/* ── Section Header with Accordion Controls ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black shadow-xs flex-shrink-0">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-[16px] font-black text-slate-900">Day-by-Day Tour Itinerary</h3>
              <span className="text-[10.5px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200 shadow-2xs">
                {itinerary.length} {itinerary.length === 1 ? "Day" : "Days"} Planned
              </span>
            </div>
            <p className="text-[11.5px] text-slate-400 font-medium">
              Daily sightseeing route, transfer schedule, meals &amp; activities
            </p>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap self-end sm:self-auto">
          {itinerary.length > 0 && (
            <button
              type="button"
              onClick={handleToggleAllAccordions}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/90 text-[11.5px] font-black transition-all shadow-2xs active:scale-95"
              title={areAllOpen ? "Collapse all day cards" : "Expand all day cards"}
            >
              <ChevronsUpDown className="w-3.5 h-3.5 text-indigo-600" />
              <span>{areAllOpen ? "Collapse All" : "Expand All"}</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleAddDay}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-[11.5px] font-black transition-all shadow-2xs active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 text-amber-400" />
            <span>Add Day</span>
          </button>
        </div>
      </div>

      {/* ── Empty State ── */}
      {itinerary.length === 0 ? (
        <div className="text-center py-10 bg-slate-50/70 rounded-3xl border-2 border-dashed border-slate-200 p-6 space-y-3">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center">
            <Compass className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[14px] font-black text-slate-800">No Day-by-Day Itinerary Added Yet</p>
            <p className="text-[12px] text-slate-400 font-medium max-w-md mx-auto mt-0.5">
              Build a structured daily sightseeing and transfer plan for this quotation proposal.
            </p>
          </div>
          <button
            type="button"
            onClick={handleAddDay}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-[12.5px] shadow-xs active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>Add Day 1 Plan</span>
          </button>
        </div>
      ) : (
        /* ── Day-by-Day Accordion Stream Layout ── */
        <div className="space-y-3.5">
          {itinerary.map((dayItem, idx) => {
            const isOpen = openDays.has(idx);
            const matchingStay = getStayForDay(idx, hotelStays);
            const mealInfo = getMealsFromStay(matchingStay, idx, daysCount || itinerary.length);
            const cityLeg = dayItem.city || matchingStay?.cityName || destination;

            return (
              <div
                key={idx}
                className={`group relative rounded-3xl bg-white border transition-all duration-200 overflow-hidden ${
                  isOpen
                    ? "border-indigo-300 shadow-md ring-2 ring-indigo-500/10"
                    : "border-slate-200/90 hover:border-amber-400/80 shadow-xs hover:shadow-sm"
                }`}
              >
                {/* Top ambient accent gradient line */}
                <div
                  className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-indigo-500 to-purple-500 transition-opacity ${
                    isOpen ? "opacity-100" : "opacity-40 group-hover:opacity-100"
                  }`}
                />

                {/* ── Interactive Accordion Header Bar ── */}
                <div
                  onClick={() => toggleDayAccordion(idx)}
                  className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 cursor-pointer select-none transition-colors ${
                    isOpen ? "bg-slate-50/60 border-b border-slate-100" : "bg-white hover:bg-slate-50/40"
                  }`}
                >
                  {/* Left Column: Hero Day Badge + Title + Location / Meal Pills */}
                  <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
                    {/* Hero Day Number Squircle Tile */}
                    <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-amber-400 flex flex-col items-center justify-center flex-shrink-0 shadow-md ring-2 ring-amber-400/20">
                      <span className="font-mono font-black text-[15px] sm:text-[17px] leading-none">
                        {String(dayItem.day || idx + 1).padStart(2, "0")}
                      </span>
                      <span className="text-[8px] font-black tracking-widest text-slate-400 uppercase mt-0.5">
                        DAY
                      </span>
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Meal Plan Connection Badge (Only shown when a meal plan is selected) */}
                        {mealInfo.mealPlan && (
                          <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 text-emerald-950 border border-emerald-200/90 font-black text-[10.5px] flex items-center gap-1.5 shadow-2xs">
                            <Utensils className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                            <span className="text-emerald-900 font-extrabold">{mealInfo.planDesc?.badge || `${mealInfo.mealPlan} Plan`}</span>
                          </span>
                        )}

                        {!isOpen && dayItem.activities && dayItem.activities.length > 0 && (
                          <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                            {dayItem.activities.length} {dayItem.activities.length === 1 ? "Activity" : "Activities"}
                          </span>
                        )}
                      </div>

                      <h4 className="text-[15px] font-black text-slate-900 group-hover:text-indigo-600 transition-colors leading-snug truncate">
                        {dayItem.title || `Day ${idx + 1} Sightseeing & Experience`}
                      </h4>
                    </div>
                  </div>

                  {/* Right Column: Actions & Accordion Toggle Icon */}
                  <div
                    className="flex items-center gap-1.5 flex-shrink-0 self-start sm:self-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() => setEditingDayIndex(idx)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 font-black text-[11.5px] transition-all shadow-2xs active:scale-95"
                      title="Edit Day Details in Studio Modal"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Edit</span>
                    </button>

                    <div className="flex items-center bg-slate-50 p-0.5 rounded-xl border border-slate-200">
                      <button
                        type="button"
                        onClick={() => handleMoveDay(idx, -1)}
                        disabled={idx === 0}
                        className="p-1.5 text-slate-400 hover:text-slate-800 disabled:opacity-20 transition-colors"
                        title="Move Day Up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveDay(idx, 1)}
                        disabled={idx === itinerary.length - 1}
                        className="p-1.5 text-slate-400 hover:text-slate-800 disabled:opacity-20 transition-colors"
                        title="Move Day Down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      {itinerary.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveDay(idx)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                          title="Delete Day"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Accordion Expand/Collapse Chevron Button */}
                    <button
                      type="button"
                      onClick={() => toggleDayAccordion(idx)}
                      className={`p-1.5 rounded-xl border transition-all ${
                        isOpen
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-2xs"
                          : "bg-white text-slate-500 hover:bg-slate-100 border-slate-200"
                      }`}
                      title={isOpen ? "Collapse day" : "Expand day"}
                    >
                      {isOpen ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* ── Collapsible Accordion Body ── */}
                {isOpen && (
                  <div className="p-4 sm:p-6 space-y-4 bg-white animate-in slide-in-from-top-2 duration-200">
                    {/* Narrative Story Description */}
                    <div
                      onClick={() => setEditingDayIndex(idx)}
                      className="p-3.5 sm:p-4 rounded-2xl bg-slate-50/70 hover:bg-amber-50/40 border border-slate-200/80 hover:border-amber-300 transition-all cursor-pointer space-y-1"
                    >
                      {dayItem.description ? (
                        <div
                          className="text-[13px] text-slate-700 leading-relaxed font-normal itinerary-rich-content [&_p]:mb-1.5 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_strong]:font-bold [&_b]:font-bold"
                          dangerouslySetInnerHTML={{ __html: dayItem.description }}
                        />
                      ) : (
                        <p className="text-[13px] text-slate-400 italic">
                          Click to add a detailed morning-to-evening sightseeing narrative for this day...
                        </p>
                      )}
                    </div>

                    {/* Visual Activity Chips */}
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10.5px] font-black uppercase tracking-wider text-slate-400">
                          Planned Highlights &amp; Activities:
                        </span>
                        <button
                          type="button"
                          onClick={() => setEditingDayIndex(idx)}
                          className="text-[11px] font-bold text-indigo-600 hover:underline"
                        >
                          + Add Custom
                        </button>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5">
                        {dayItem.activities && dayItem.activities.length > 0 ? (
                          dayItem.activities.map((act, actIdx) => (
                            <span
                              key={actIdx}
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gradient-to-r from-indigo-50/90 to-purple-50/80 text-indigo-950 border border-indigo-200/90 text-[11.5px] font-bold shadow-2xs transition-all hover:scale-102"
                            >
                              <span className="text-[12px]">{getActivityIcon(act)}</span>
                              <span>{act}</span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveActivity(idx, actIdx);
                                }}
                                className="text-slate-400 hover:text-rose-600 ml-0.5 rounded-full hover:bg-rose-50 p-0.5 transition-colors"
                                title="Remove activity"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))
                        ) : (
                          <span className="text-[11.5px] text-slate-400 italic">No activity tags added yet</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Dedicated Day Itinerary Studio Modal Dialog (Opens when clicking Edit) ── */}
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

              {/* Hotel & Meal Plan Inclusions - Automatically Filled from Selected Hotel */}
              {(() => {
                const stay = getStayForDay(editingDayIndex, hotelStays);
                const minfo = getMealsFromStay(stay, editingDayIndex, daysCount || itinerary.length);

                if (!minfo.hasHotel) return null;

                const hasAnyMeal = minfo.meals.breakfast || minfo.meals.lunch || minfo.meals.dinner;

                return (
                  <div className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100/60 border border-slate-200/90 space-y-2.5">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <Hotel className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-[12px] font-extrabold text-slate-900">
                            {minfo.hotelName}
                          </span>
                          {minfo.roomType && (
                            <span className="text-[11px] text-slate-500 font-medium">
                              ({minfo.roomType})
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 font-medium">
                          {minfo.planDesc?.clientExplanation || minfo.mealPlanMeaning}
                        </p>
                      </div>

                      <span className="text-[11px] font-bold text-emerald-900 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200 shadow-2xs">
                        {minfo.planDesc?.badge || `${minfo.mealPlan} • ${minfo.planDesc?.shortMeaning}`}
                      </span>
                    </div>

                    {/* Auto-filled Meal Inclusion Status Badges */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {minfo.meals.breakfast ? (
                        <span className="px-3 py-1 rounded-xl text-[11.5px] font-bold bg-amber-50 text-amber-950 border border-amber-200 shadow-2xs flex items-center gap-1.5">
                          <span>🌅</span>
                          <span>Breakfast Included</span>
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-xl text-[11.5px] font-medium bg-white text-slate-400 border border-slate-200/80 flex items-center gap-1.5 opacity-70">
                          <span className="grayscale">🌅</span>
                          <span>No Breakfast</span>
                        </span>
                      )}

                      {minfo.meals.lunch ? (
                        <span className="px-3 py-1 rounded-xl text-[11.5px] font-bold bg-orange-50 text-orange-950 border border-orange-200 shadow-2xs flex items-center gap-1.5">
                          <span>☀️</span>
                          <span>Lunch Included</span>
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-xl text-[11.5px] font-medium bg-white text-slate-400 border border-slate-200/80 flex items-center gap-1.5 opacity-70">
                          <span className="grayscale">☀️</span>
                          <span>No Lunch</span>
                        </span>
                      )}

                      {minfo.meals.dinner ? (
                        <span className="px-3 py-1 rounded-xl text-[11.5px] font-bold bg-purple-50 text-purple-950 border border-purple-200 shadow-2xs flex items-center gap-1.5">
                          <span>🌙</span>
                          <span>Dinner Included</span>
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-xl text-[11.5px] font-medium bg-white text-slate-400 border border-slate-200/80 flex items-center gap-1.5 opacity-70">
                          <span className="grayscale">🌙</span>
                          <span>No Dinner</span>
                        </span>
                      )}

                      {!hasAnyMeal && minfo.mealPlan === "EP" && (
                        <span className="px-3 py-1 rounded-xl text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs flex items-center gap-1">
                          <span>🍽️</span>
                          <span>Room Only (No Meals)</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Day Description Narrative */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11.5px] font-bold text-slate-700">
                    Sightseeing Schedule &amp; Narrative *
                  </label>
                  <button
                    type="button"
                    onClick={() => setRichEditorDayIdx(editingDayIndex)}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 text-[11.5px] font-black hover:bg-indigo-100 transition-all shadow-2xs"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Open Rich Text Editor (Bold, Lists)</span>
                  </button>
                </div>

                {editingDay.description ? (
                  <div
                    onClick={() => setRichEditorDayIdx(editingDayIndex)}
                    className="w-full min-h-[90px] p-3.5 rounded-xl border border-slate-300 bg-slate-50/70 text-[13px] text-slate-800 leading-relaxed cursor-pointer hover:bg-white hover:border-indigo-400 transition-all itinerary-rich-content [&_p]:mb-1.5 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_strong]:font-bold [&_b]:font-bold shadow-2xs"
                    title="Click to edit with rich formatting toolbar"
                    dangerouslySetInnerHTML={{ __html: editingDay.description }}
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => setRichEditorDayIdx(editingDayIndex)}
                    className="w-full p-4 rounded-xl border border-dashed border-slate-300 text-[12.5px] text-slate-400 text-center hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50/40 transition-all"
                  >
                    + Click to add rich narrative description — bold headings, bullet points (•), daily timings, etc.
                  </button>
                )}
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

      {/* ── TipTap Rich Description Editor Dialog Modal ── */}
      <DescriptionEditorDialog
        isOpen={richEditorDayIdx !== null}
        dayLabel={richEditorDayIdx !== null ? `Day ${itinerary[richEditorDayIdx]?.day || richEditorDayIdx + 1}` : ""}
        value={richEditorDayIdx !== null ? (itinerary[richEditorDayIdx]?.description || "") : ""}
        onSave={(html) => {
          if (richEditorDayIdx !== null) {
            handleDayChange(richEditorDayIdx, "description", html);
          }
        }}
        onClose={() => setRichEditorDayIdx(null)}
      />
    </div>
  );
}
