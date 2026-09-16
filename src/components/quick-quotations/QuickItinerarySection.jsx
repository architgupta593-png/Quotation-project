"use client";

import { useState } from "react";
import {
  Compass, Plus, Trash2, ChevronDown, ChevronUp,
  Sparkles, Clock, Check, Utensils, Tag, MapPin,
  Calendar, Layers, CheckCheck, Sun, Moon, Coffee,
  Camera, Navigation, Flag, ShieldCheck, Edit3, X,
  FileText, CheckCircle2, ArrowUp, ArrowDown, Copy,
  Eye, EyeOff, Hotel,
} from "lucide-react";
import DescriptionEditorDialog from "@/components/packages/DescriptionEditorDialog";

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
 * EP: Room Only (No meals)
 * CP: Bed & Breakfast (Morning Breakfast only; on arrival day check-in is afternoon so no breakfast)
 * MAP: Half Board (Breakfast + Dinner; arrival day has dinner, departure day has breakfast)
 * AP: Full Board (All Meals: Breakfast + Lunch + Dinner; arrival day has lunch/dinner, departure day has breakfast)
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
  showItinerary = true,
  onToggleShowItinerary,
  daysCount = 5,
  destination = "",
  theme = "honeymoon",
  hotelStays = [],
}) {
  const [activeTabDay, setActiveTabDay] = useState("all"); // "all" | number (0-indexed)
  const [editingDayIndex, setEditingDayIndex] = useState(null); // index of day being edited in modal
  const [richEditorDayIdx, setRichEditorDayIdx] = useState(null); // index of day being edited in TipTap rich text modal
  const [newActivityInput, setNewActivityInput] = useState("");

  // Auto-generate realistic itinerary based on destination, duration, theme and hotel meal plans
  function generateDefaultItinerary() {
    const dest = destination.trim() || "Destination";
    const themeKey = THEME_PRESETS[theme] ? theme : "general";
    const templates = THEME_PRESETS[themeKey];
    const generated = [];

    for (let i = 1; i <= daysCount; i++) {
      const matchingStay = getStayForDay(i - 1, hotelStays);
      const mealInfo = getMealsFromStay(matchingStay, i - 1, daysCount);
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
        meals: mealInfo.meals,
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

          {/* ── Luxury Journey Stream Layout ── */}
          <div className="space-y-4">
            {displayedDays.map((dayItem, realIdx) => {
              const idx = activeTabDay === "all" ? realIdx : activeTabDay;
              const matchingStay = getStayForDay(idx, hotelStays);
              const mealInfo = getMealsFromStay(matchingStay, idx, daysCount || itinerary.length);
              const meals = dayItem.meals || mealInfo.meals || { breakfast: false, lunch: false, dinner: false };
              const cityLeg = dayItem.city || matchingStay?.cityName || destination;

              return (
                <div
                  key={idx}
                  className="group relative rounded-3xl bg-white border border-slate-200/90 hover:border-amber-400/80 p-4 sm:p-6 shadow-xs hover:shadow-md transition-all space-y-4 overflow-hidden"
                >
                  {/* Subtle top ambient gradient line */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-indigo-500 to-purple-500 opacity-60 group-hover:opacity-100 transition-opacity" />

                  {/* Header Row: Hero Day Tile + Title + Location + Actions */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 pb-3 border-b border-slate-100">
                    <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
                      {/* Hero Day Number Squircle Tile */}
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-amber-400 flex flex-col items-center justify-center flex-shrink-0 shadow-md ring-2 ring-amber-400/20">
                        <span className="font-mono font-black text-[16px] sm:text-[18px] leading-none">
                          {String(dayItem.day || idx + 1).padStart(2, "0")}
                        </span>
                        <span className="text-[8.5px] font-black tracking-widest text-slate-400 uppercase mt-0.5">
                          DAY
                        </span>
                      </div>

                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          {cityLeg && (
                            <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-50 to-amber-100/60 text-amber-900 border border-amber-200/90 font-black text-[11px] flex items-center gap-1 shadow-2xs">
                              <MapPin className="w-3 h-3 text-amber-600" />
                              <span>{cityLeg}</span>
                            </span>
                          )}

                          {/* Hotel & Meal Plan Connection Badge - Only shown when hotel is selected */}
                          {mealInfo.hasHotel && (
                            <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 text-emerald-950 border border-emerald-200/90 font-black text-[11px] flex items-center gap-1.5 shadow-2xs">
                              <Hotel className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                              <span className="truncate max-w-[170px]">{mealInfo.hotelName}</span>
                              <span className="text-emerald-400">•</span>
                              <span className="text-emerald-800 font-extrabold">{mealInfo.planDesc?.badge || `${mealInfo.mealPlan} • ${mealInfo.planDesc?.shortMeaning}`}</span>
                            </span>
                          )}

                          <span className="text-[10.5px] font-bold text-slate-400">
                            Milestone #{dayItem.day || idx + 1}
                          </span>
                        </div>

                        <h4
                          onClick={() => setEditingDayIndex(idx)}
                          className="text-[15px] sm:text-[16px] font-black text-slate-900 hover:text-indigo-600 transition-colors cursor-pointer leading-snug"
                          title="Click to edit day title & narrative"
                        >
                          {dayItem.title || `Day ${idx + 1} Sightseeing & Experience`}
                        </h4>
                      </div>
                    </div>

                    {/* Day Action Buttons */}
                    <div className="flex items-center gap-1.5 flex-shrink-0 self-start sm:self-center">
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
                    </div>
                  </div>

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

              {/* Meal Plan Included Toggles - Connected to Hotel Selection */}
              {(() => {
                const stay = getStayForDay(editingDayIndex, hotelStays);
                const minfo = getMealsFromStay(stay, editingDayIndex, daysCount || itinerary.length);

                if (!minfo.hasHotel) {
                  return (
                    <div className="p-3 rounded-2xl bg-slate-50 border border-dashed border-slate-200 flex items-center justify-between text-[11.5px] text-slate-500">
                      <span className="flex items-center gap-1.5 font-medium">
                        <Hotel className="w-3.5 h-3.5 text-slate-400" />
                        <span>Meal plan automatically activates when a hotel is selected for this stay.</span>
                      </span>
                    </div>
                  );
                }

                return (
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <label className="block text-[11.5px] font-bold text-slate-800">
                          Included Meals for Day {editingDay.day || editingDayIndex + 1}
                        </label>
                        <p className="text-[11px] text-slate-500 font-medium">
                          {minfo.planDesc?.clientExplanation || minfo.mealPlanMeaning}
                        </p>
                      </div>
                      <span className="text-[11px] font-bold text-emerald-900 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200 flex items-center gap-1.5 shadow-2xs">
                        <Hotel className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="font-extrabold">{minfo.hotelName}</span>
                        <span>•</span>
                        <span className="text-emerald-700">{minfo.planDesc?.badge || `${minfo.mealPlan} (${minfo.mealPlanMeaning})`}</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => handleMealToggle(editingDayIndex, "breakfast")}
                        className={`flex-1 py-1.5 rounded-xl text-[11.5px] font-black transition-all flex items-center justify-center gap-1 border ${
                          editingDay.meals?.breakfast
                            ? "bg-amber-500 text-white border-amber-600 shadow-2xs"
                            : "bg-white text-slate-600 hover:bg-slate-100 border-slate-200"
                        }`}
                        title="Toggle Breakfast inclusion"
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
                        title="Toggle Lunch inclusion"
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
                        title="Toggle Dinner inclusion"
                      >
                        <span>🌙</span> <span>Dinner</span>
                      </button>
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
