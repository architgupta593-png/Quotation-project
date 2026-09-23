"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Star, MapPin, Hotel, Search, X, Sparkles, ListFilter, Calendar
} from "lucide-react";
import {
  HOTEL_CATEGORIES,
} from "@/components/packages/AccommodationPanel";

export function matchRoomType(roomOptions = [], targetType = "") {
  if (!roomOptions || roomOptions.length === 0) return null;
  if (!targetType) return roomOptions[0];

  const cleanTarget = String(targetType)
    .toLowerCase()
    .replace(/\b(ac|non-ac|room|rooms)\b/gi, "")
    .replace(/[^a-z0-9]/g, " ")
    .trim();

  // 1. Exact clean match
  const exactMatch = roomOptions.find((r) => {
    const cleanRName = (r.name || "")
      .toLowerCase()
      .replace(/\b(ac|non-ac|room|rooms)\b/gi, "")
      .replace(/[^a-z0-9]/g, " ")
      .trim();
    return cleanRName === cleanTarget;
  });
  if (exactMatch) return exactMatch;

  // 2. Token overlap score
  const targetTokens = cleanTarget.split(/\s+/).filter((t) => t.length >= 3);
  let bestMatch = null;
  let bestScore = -1;

  roomOptions.forEach((r) => {
    const cleanRName = (r.name || "")
      .toLowerCase()
      .replace(/\b(ac|non-ac|room|rooms)\b/gi, "")
      .replace(/[^a-z0-9]/g, " ")
      .trim();
    const rTokens = cleanRName.split(/\s+/).filter((t) => t.length >= 3);

    // Count target tokens inside this room
    let score = 0;
    targetTokens.forEach((tt) => {
      if (rTokens.includes(tt)) score += 10;
      else if (rTokens.some((rt) => rt.includes(tt) || tt.includes(rt))) score += 4;
    });

    // Small penalty for extra tokens to prefer tight matches
    const tokenDiff = Math.abs(rTokens.length - targetTokens.length);
    score -= tokenDiff;

    if (score > bestScore && score > 0) {
      bestScore = score;
      bestMatch = r;
    }
  });

  return bestMatch || roomOptions[0];
}

export function getHotelAllPricesForDate(hotel, rooms = [], travelDate = "") {
  if (!rooms || rooms.length === 0) {
    return {
      hasPrice: false,
      minPrice: 0,
      roomOptions: [],
    };
  }

  const tripDate = travelDate ? new Date(travelDate) : null;
  const isValidDate = tripDate && !isNaN(tripDate.getTime());

  let overallMinPrice = Infinity;
  const roomOptions = [];

  rooms.forEach((r) => {
    const mealPrices = {
      EP: 0,
      CP: 0,
      MAP: 0,
      AP: 0,
    };

    if (r.basePrice && Number(r.basePrice) > 0) {
      mealPrices.CP = Number(r.basePrice);
    }

    let matchedSeason = null;
    if (isValidDate && Array.isArray(r.seasonalPricing) && r.seasonalPricing.length > 0) {
      const tripTime = tripDate.getTime();
      const tripMonth = tripDate.getMonth();
      const tripDay = tripDate.getDate();
      const tripMMDD = (tripMonth + 1) * 100 + tripDay;

      matchedSeason = r.seasonalPricing.find((season) => {
        return (season.dateRanges || []).some((range) => {
          if (!range.startDate || !range.endDate) return false;
          const start = new Date(range.startDate);
          const end = new Date(range.endDate);
          if (isNaN(start.getTime()) || isNaN(end.getTime())) return false;

          // Direct timestamp window check
          if (tripTime >= start.getTime() && tripTime <= end.getTime()) {
            return true;
          }

          // Annual month/day match for recurring seasons
          const startMMDD = (start.getMonth() + 1) * 100 + start.getDate();
          const endMMDD = (end.getMonth() + 1) * 100 + end.getDate();
          if (startMMDD <= endMMDD) {
            return tripMMDD >= startMMDD && tripMMDD <= endMMDD;
          } else {
            // Season spans across new year (e.g. Nov 1 to Jan 15)
            return tripMMDD >= startMMDD || tripMMDD <= endMMDD;
          }
        });
      });
    }

    if (matchedSeason && Array.isArray(matchedSeason.meals) && matchedSeason.meals.length > 0) {
      matchedSeason.meals.forEach((m) => {
        if (m.plan && Number(m.price) > 0) {
          mealPrices[m.plan] = Number(m.price);
        }
      });
    } else {
      // Fallback: collect first valid rates
      (r.seasonalPricing || []).forEach((season) => {
        (season.meals || []).forEach((m) => {
          if (m.plan && Number(m.price) > 0 && !mealPrices[m.plan]) {
            mealPrices[m.plan] = Number(m.price);
          }
        });
      });
    }

    const validPrices = Object.values(mealPrices).filter((p) => p > 0);
    const roomMin = validPrices.length > 0 ? Math.min(...validPrices) : (r.basePrice || 0);

    if (roomMin > 0 && roomMin < overallMinPrice) {
      overallMinPrice = roomMin;
    }

    roomOptions.push({
      id: String(r._id || r.id || ""),
      name: r.roomType || "Standard Room",
      maxOccupancy: Number(r.maxOccupancy) || 2,
      minPrice: roomMin,
      meals: mealPrices,
      seasonLabel: matchedSeason?.label || "",
    });
  });

  // Sort roomOptions by minPrice ascending so index 0 is always the base/cheapest room
  roomOptions.sort((a, b) => {
    if (a.minPrice <= 0 && b.minPrice > 0) return 1;
    if (b.minPrice <= 0 && a.minPrice > 0) return -1;
    return a.minPrice - b.minPrice;
  });

  const finalMin = overallMinPrice === Infinity ? (rooms[0]?.basePrice || 0) : overallMinPrice;

  return {
    hasPrice: finalMin > 0,
    minPrice: finalMin,
    roomOptions,
  };
}

const MEAL_PLANS = [
  { id: "EP", label: "EP", title: "Room Only", desc: "No meals included" },
  { id: "CP", label: "CP", title: "Bed & Breakfast", desc: "Breakfast included" },
  { id: "MAP", label: "MAP", title: "Half Board", desc: "Breakfast + Dinner" },
  { id: "AP", label: "AP", title: "Full Board", desc: "Breakfast + Lunch + Dinner" },
];

export default function HotelMealSelectionDialog({
  isOpen,
  onClose,
  cityName = "Destination",
  stayNights = 1,
  category: initialCategory = "None",
  roomType: initialRoomType = "Deluxe AC Room",
  mealPlan: initialMealPlan = "CP",
  catalogHotels = [],
  roomsMap = {},
  startDate = "",
  totalRooms = 1,
  adults = 2,
  initialHotelId = null,
  initialRoomId = null,
  onSelectHotel,
}) {
  const [activeCategory, setActiveCategory] = useState(initialCategory || "None");
  const [activeMealPlan, setActiveMealPlan] = useState(initialMealPlan || "CP");
  const [showAllHotels, setShowAllHotels] = useState(false); // Default: Top 5 Lowest Price
  const [searchQuery, setSearchQuery] = useState("");
  const [starFilter, setStarFilter] = useState("ALL");
  const [selectedRoomsByHotel, setSelectedRoomsByHotel] = useState({});
  const [selectedMealPlansByHotel, setSelectedMealPlansByHotel] = useState({});

  const roomMultiplier = Math.max(1, parseInt(totalRooms, 10) || 1);

  // Clean lifecycle hook: sync state when modal is opened
  useEffect(() => {
    if (isOpen) {
      if (initialCategory) setActiveCategory(initialCategory);
      if (initialMealPlan) setActiveMealPlan(initialMealPlan);
      setShowAllHotels(false);
      setSearchQuery("");
      setStarFilter("ALL");

      // Pre-populate previously selected hotel & room if provided
      const initRooms = {};
      if (initialHotelId && initialRoomId) {
        initRooms[initialHotelId] = String(initialRoomId);
      }
      setSelectedRoomsByHotel(initRooms);
      setSelectedMealPlansByHotel({});
    }
  }, [isOpen, initialCategory, initialMealPlan, initialHotelId, initialRoomId]);

  // Compute all matching hotels for the city and category with exact price for the meal plan
  const { allMatchingHotels, sortedHotels, top5Hotels } = useMemo(() => {
    const cleanCity = (cityName || "").split(",")[0].split("/")[0].trim().toLowerCase();

    const list = catalogHotels.filter((h) => {
      const hotelCity = (h.city?.name || "").toLowerCase();
      const matchCity =
        !cleanCity ||
        hotelCity.includes(cleanCity) ||
        cleanCity.includes(hotelCity);

      const matchCat =
        activeCategory.toLowerCase() === "none"
          ? (!h.category || h.category.toLowerCase() === "none" || h.category === "")
          : (h.category && h.category.toLowerCase() === activeCategory.toLowerCase());

      const matchSearch =
        !searchQuery.trim() ||
        h.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        h.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (hotelCity && hotelCity.includes(searchQuery.toLowerCase()));

      const matchStar = starFilter === "ALL" || String(h.starRating) === String(starFilter);

      return matchCity && matchCat && matchSearch && matchStar;
    });

    // Enrich each hotel with exact room & selected meal plan price for the travel date
    const enriched = list.map((hotel) => {
      const rooms = roomsMap[hotel._id] || [];
      const pricing = getHotelAllPricesForDate(hotel, rooms, startDate);

      // Find user-selected room or closest room matching initialRoomType via matchRoomType
      const activeRoomId = selectedRoomsByHotel[hotel._id];
      let activeRoom = activeRoomId ? pricing.roomOptions.find((r) => String(r.id) === String(activeRoomId)) : null;
      if (!activeRoom) {
        activeRoom = matchRoomType(pricing.roomOptions, initialRoomType);
      }
      if (!activeRoom) {
        activeRoom = pricing.roomOptions[0];
      }

      // Re-validate meal plan: user's explicit card choice || global activeMealPlan || fallback
      let currentPlan = selectedMealPlansByHotel[hotel._id] || activeMealPlan;
      if (!activeRoom?.meals?.[currentPlan] || Number(activeRoom.meals[currentPlan]) <= 0) {
        const validPlans = Object.keys(activeRoom?.meals || {}).filter((p) => Number(activeRoom.meals[p]) > 0);
        if (validPlans.length > 0) {
          currentPlan = validPlans.includes("CP") ? "CP" : validPlans[0];
        }
      }

      // Calculate meal rate for the validated plan
      const mealRate = activeRoom?.meals?.[currentPlan] || activeRoom?.minPrice || pricing.minPrice || 0;

      // Base reference price for sorting (independent of user's temporary room selection)
      const baseRefPrice = pricing.minPrice || pricing.roomOptions[0]?.minPrice || 0;

      return {
        hotel,
        matchedRoom: activeRoom,
        roomOptions: pricing.roomOptions,
        effectiveMealPlan: currentPlan,
        calculatedPrice: Number(mealRate) || 0,
        baseRefPrice: Number(baseRefPrice) || 0,
        hasPrice: mealRate > 0,
        seasonLabel: activeRoom?.seasonLabel || "",
      };
    });

    // Sort by baseRefPrice ascending so card order remains STABLE when user switches rooms
    const sorted = [...enriched].sort((a, b) => {
      if (a.baseRefPrice <= 0 && b.baseRefPrice > 0) return 1;
      if (b.baseRefPrice <= 0 && a.baseRefPrice > 0) return -1;
      return a.baseRefPrice - b.baseRefPrice;
    });

    const top5 = sorted.slice(0, 5);

    return {
      allMatchingHotels: enriched,
      sortedHotels: sorted,
      top5Hotels: top5,
    };
  }, [
    catalogHotels,
    roomsMap,
    cityName,
    activeCategory,
    activeMealPlan,
    initialRoomType,
    searchQuery,
    starFilter,
    startDate,
    selectedRoomsByHotel,
    selectedMealPlansByHotel,
  ]);

  if (!isOpen) return null;

  const currentDisplayList = showAllHotels ? sortedHotels : top5Hotels;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity" onClick={onClose} />

      {/* Dialog Shell */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden border border-slate-200 flex flex-col max-h-[88vh] animate-in zoom-in-95">
        
        {/* ── Dialog Header ── */}
        <div className="p-4 px-5 bg-white border-b border-slate-100 flex items-center justify-between flex-shrink-0">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-slate-900">
                Hotels in {cityName}
              </h3>
              <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                {activeCategory}
              </span>
              <span className="text-[11px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                {activeMealPlan} Plan
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {showAllHotels
                ? `Showing all ${allMatchingHotels.length} ${activeCategory} hotels in ${cityName}`
                : `Top 5 lowest price ${activeCategory} hotels for ${activeMealPlan} meal plan`}
            </p>
          </div>

          {/* Top Right Controls: Toggle Top 5 / All & Close */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={() => setShowAllHotels(!showAllHotels)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                showAllHotels
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200"
              }`}
            >
              {showAllHotels ? (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Show Top 5</span>
                </>
              ) : (
                <>
                  <ListFilter className="w-3.5 h-3.5" />
                  <span>All Hotels ({allMatchingHotels.length})</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── Compact Filter Bar ── */}
        <div className="px-5 py-2.5 bg-slate-50/80 border-b border-slate-200/70 space-y-2 text-xs flex-shrink-0">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            {/* Category Pills */}
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-1 flex-shrink-0">
                Category:
              </span>
              {HOTEL_CATEGORIES.map((cat) => {
                const isSel = activeCategory.toLowerCase() === cat.toLowerCase();
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveCategory(cat)}
                    className={`px-2.5 py-1 rounded-md text-xs transition-colors flex-shrink-0 font-medium ${
                      isSel
                        ? "bg-white text-slate-900 border border-slate-300 shadow-2xs font-bold"
                        : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>

            {/* Meal Plan Pills */}
            <div className="flex items-center gap-1 flex-shrink-0">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-1">
                Meal:
              </span>
              {MEAL_PLANS.map((mp) => {
                const isSel = activeMealPlan === mp.id;
                return (
                  <button
                    key={mp.id}
                    type="button"
                    onClick={() => setActiveMealPlan(mp.id)}
                    className={`px-2.5 py-0.5 rounded text-xs font-semibold transition-colors ${
                      isSel
                        ? "bg-amber-500 text-white"
                        : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                    }`}
                    title={`${mp.title} (${mp.desc})`}
                  >
                    {mp.id}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Search & Star Filter in All Hotels Mode */}
          {showAllHotels && (
            <div className="flex items-center gap-2 pt-1 border-t border-slate-200/60">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`Search hotel name or address in ${cityName}...`}
                  className="w-full pl-8 pr-3 py-1 text-xs rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                {["ALL", "3", "4", "5"].map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStarFilter(st)}
                    className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                      starFilter === st
                        ? "bg-slate-900 text-white"
                        : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                    }`}
                  >
                    {st === "ALL" ? "All Stars" : `${st}★`}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Hotel Cards Stream ── */}
        <div className="p-4 overflow-y-auto flex-1 space-y-2.5 bg-slate-50/30">
          {currentDisplayList.length === 0 ? (
            <div className="text-center py-10 space-y-2.5 bg-white rounded-xl border border-dashed border-slate-200 p-6">
              <Hotel className="w-8 h-8 text-slate-300 mx-auto" />
              <div>
                <p className="text-sm font-bold text-slate-800">No {activeCategory} hotels found in {cityName}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Try another category or clear search filters.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAllHotels(true)}
                className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-medium shadow-2xs hover:bg-slate-800"
              >
                Browse All Hotels
              </button>
            </div>
          ) : (
            currentDisplayList.map((item, idx) => {
              const { hotel, matchedRoom, calculatedPrice, seasonLabel } = item;
              const stayTotal = calculatedPrice * stayNights * roomMultiplier;

              return (
                <div
                  key={hotel._id}
                  className="p-3.5 rounded-xl border border-slate-200 hover:border-amber-400 bg-white hover:shadow-xs transition-all space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {!showAllHotels && (
                          <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            #{idx + 1} Lowest
                          </span>
                        )}

                        <h4 className="text-sm font-bold text-slate-900 truncate">
                          {hotel.name}
                        </h4>

                        {hotel.starRating && (
                          <span className="text-[11px] font-medium text-amber-600 flex items-center">
                            {hotel.starRating}★
                          </span>
                        )}

                        {seasonLabel && (
                          <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            {seasonLabel} Season
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-500 mt-0.5 truncate">
                        {hotel.city?.name || cityName}
                        {hotel.address ? ` • ${hotel.address}` : ""}
                      </p>

                      {item.roomOptions && item.roomOptions.length > 1 ? (
                        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                          <span className="text-[11px] font-bold text-slate-600">Room:</span>
                          <select
                            value={matchedRoom?.id || ""}
                            onChange={(e) => {
                              e.stopPropagation();
                              setSelectedRoomsByHotel((prev) => ({ ...prev, [hotel._id]: e.target.value }));
                            }}
                            className="text-xs font-semibold text-slate-800 bg-slate-50 hover:bg-white border border-slate-300 rounded-lg px-2 py-0.5 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 cursor-pointer max-w-[260px] truncate shadow-2xs"
                          >
                            {item.roomOptions.map((ro) => {
                              const planPrice = ro.meals?.[item.effectiveMealPlan] || ro.minPrice || 0;
                              return (
                                <option key={ro.id} value={ro.id}>
                                  {ro.name} {ro.maxOccupancy ? `[Max ${ro.maxOccupancy}] ` : ""}{planPrice > 0 ? `(₹${planPrice.toLocaleString("en-IN")})` : ""}
                                </option>
                              );
                            })}
                          </select>
                        </div>
                      ) : (
                        matchedRoom?.name && (
                          <p className="text-[11px] font-medium text-slate-600 mt-0.5">
                            Room: <span className="font-semibold text-slate-800">{matchedRoom.name}</span>
                            {matchedRoom.maxOccupancy && (
                              <span className="text-[10px] text-slate-400 ml-1.5">(Max {matchedRoom.maxOccupancy} Adults)</span>
                            )}
                          </p>
                        )
                      )}

                      {/* In-Dialog Occupancy Warning */}
                      {(() => {
                        const totalRoomsCount = Math.max(1, parseInt(totalRooms, 10) || 1);
                        const adultsCount = Math.max(1, parseInt(adults, 10) || 2);
                        const roomMaxOcc = matchedRoom?.maxOccupancy || 2;
                        const maxCapacity = roomMaxOcc * totalRoomsCount;
                        const isOverCapacity = adultsCount > maxCapacity;
                        if (!isOverCapacity) return null;
                        return (
                          <div className="mt-1 flex items-center gap-1.5 px-2 py-0.5 rounded bg-rose-50 border border-rose-200 text-rose-800 text-[10.5px] font-medium">
                            <span className="font-bold">⚠️</span>
                            <span>{adultsCount} Adults exceeds {maxCapacity} Max Capacity ({totalRoomsCount}R × {roomMaxOcc}).</span>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Price & Select Button */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="text-right">
                        <div className="text-sm font-bold text-slate-900 flex items-center justify-end gap-1.5">
                          <span>{calculatedPrice > 0 ? `₹${calculatedPrice.toLocaleString("en-IN")}` : "On Request"}</span>
                          <span className="text-[11px] font-normal text-slate-400">/n</span>
                          {item.effectiveMealPlan && calculatedPrice > 0 && (
                            <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                              {item.effectiveMealPlan}
                            </span>
                          )}
                        </div>
                        {calculatedPrice > 0 && (
                          <div className="text-[10px] text-slate-500">
                            <span className="font-semibold">Total: ₹{stayTotal.toLocaleString("en-IN")}</span>
                            <span className="block text-[9px] text-slate-400">
                              ({stayNights}N{roomMultiplier > 1 ? ` × ${roomMultiplier}R` : ""})
                            </span>
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          if (typeof onSelectHotel === "function") {
                            onSelectHotel({
                              hotel,
                              room: matchedRoom,
                              mealPlan: item.effectiveMealPlan || activeMealPlan,
                              rate: calculatedPrice,
                              category: hotel.category || activeCategory,
                            });
                          }
                          onClose();
                        }}
                        className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-amber-500 text-white hover:text-slate-950 font-semibold text-xs transition-colors shadow-2xs"
                      >
                        Select
                      </button>
                    </div>
                  </div>

                  {/* All meal rates for this hotel as sleek mini pills (click updates rate in-place) */}
                  {matchedRoom?.meals && Object.keys(matchedRoom.meals).length > 1 && (
                    <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-slate-100">
                      <span className="text-[10.5px] text-slate-400 font-medium mr-1">All Plans:</span>
                      {Object.entries(matchedRoom.meals).map(([plan, rate]) => {
                        if (rate <= 0) return null;
                        const isCur = item.effectiveMealPlan === plan;
                        return (
                          <button
                            key={plan}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedMealPlansByHotel((prev) => ({ ...prev, [hotel._id]: plan }));
                            }}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition-colors border cursor-pointer ${
                              isCur
                                ? "bg-amber-500 text-white border-amber-600 font-bold shadow-2xs"
                                : "bg-slate-50 hover:bg-amber-50 text-slate-700 border-slate-200"
                            }`}
                            title={`Switch to ${plan} meal plan for this hotel (₹${Number(rate).toLocaleString("en-IN")}/n)`}
                          >
                            <span>{plan}:</span>
                            <span>₹{Number(rate).toLocaleString("en-IN")}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* ── Dialog Footer ── */}
        <div className="p-3 px-5 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500 flex-shrink-0">
          <span>
            Showing <strong>{currentDisplayList.length}</strong> of <strong>{allMatchingHotels.length}</strong> {activeCategory} hotels
          </span>

          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 font-medium text-xs transition-colors shadow-2xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
