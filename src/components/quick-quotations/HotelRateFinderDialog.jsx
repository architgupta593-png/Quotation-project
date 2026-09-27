"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  X, Search, Building2, Star, Check, Sparkles, MapPin,
  Utensils, BedDouble, ArrowRight, IndianRupee, AlertCircle,
  Tag, Info, ExternalLink, SlidersHorizontal, Plus, RefreshCw,
  Sliders, ChevronRight, CheckCircle2, ArrowUpDown, Layers, ListFilter
} from "lucide-react";
import {
  HOTEL_CATEGORIES,
  getCategoryBadgeClass,
} from "@/components/packages/AccommodationPanel";

export const MEAL_PLANS = [
  {
    id: "EP",
    label: "EP",
    title: "Room Only",
    sub: "No meals",
    meaning: "Room Only (No Meals)",
    clientDesc: "Accommodation only. Meals payable at hotel.",
  },
  {
    id: "CP",
    label: "CP",
    title: "Bed & Breakfast",
    sub: "Breakfast incl.",
    meaning: "Daily Breakfast Included",
    clientDesc: "Daily breakfast buffet included.",
  },
  {
    id: "MAP",
    label: "MAP",
    title: "Half Board",
    sub: "Breakfast + Dinner",
    meaning: "Breakfast & Dinner Included",
    clientDesc: "Daily breakfast & dinner included.",
  },
  {
    id: "AP",
    label: "AP",
    title: "Full Board",
    sub: "All Meals (B+L+D)",
    meaning: "All 3 Meals Included",
    clientDesc: "All 3 meals included daily.",
  },
];

/**
 * Resolves the rate for a single night against room's seasonal pricing
 */
function getSingleNightRate(room, mealPlan = "CP", targetDate = null) {
  if (!room) return { rate: 0, isSeasonal: false, seasonLabel: "" };

  let targetRate = 0;
  let isSeasonal = false;
  let seasonLabel = "";

  const tripDate = targetDate instanceof Date ? targetDate : (targetDate ? new Date(targetDate) : null);
  const isValidDate = tripDate && !isNaN(tripDate.getTime());
  const seasons = Array.isArray(room.seasonalPricing) ? room.seasonalPricing : [];

  // 1. Check Date-Matched Season in room.seasonalPricing
  if (isValidDate && seasons.length > 0) {
    const tripTime = tripDate.getTime();
    const tripMonth = tripDate.getMonth();
    const tripDay = tripDate.getDate();
    const tripMMDD = (tripMonth + 1) * 100 + tripDay;

    const matchedSeason = seasons.find((season) => {
      return (season.dateRanges || []).some((range) => {
        if (!range.startDate || !range.endDate) return false;
        const start = new Date(range.startDate);
        const end = new Date(range.endDate);
        if (isNaN(start.getTime()) || isNaN(end.getTime())) return false;

        // Exact timestamp window check
        if (tripTime >= start.getTime() && tripTime <= end.getTime()) {
          return true;
        }

        // Annual recurring month/day matching
        const startMMDD = (start.getMonth() + 1) * 100 + start.getDate();
        const endMMDD = (end.getMonth() + 1) * 100 + end.getDate();
        if (startMMDD <= endMMDD) {
          return tripMMDD >= startMMDD && tripMMDD <= endMMDD;
        } else {
          return tripMMDD >= startMMDD || tripMMDD <= endMMDD;
        }
      });
    });

    if (matchedSeason && Array.isArray(matchedSeason.meals) && matchedSeason.meals.length > 0) {
      const mealObj = matchedSeason.meals.find((m) => m.plan === mealPlan);
      if (mealObj && Number(mealObj.price) > 0) {
        targetRate = Number(mealObj.price);
        isSeasonal = true;
        seasonLabel = matchedSeason.label || "Seasonal";
      }
    }
  }

  // 2. If no season matched by date (or no travel date), check all seasons for the exact meal plan
  if (targetRate === 0 && seasons.length > 0) {
    for (const season of seasons) {
      if (Array.isArray(season.meals)) {
        const mealObj = season.meals.find((m) => m.plan === mealPlan);
        if (mealObj && Number(mealObj.price) > 0) {
          targetRate = Number(mealObj.price);
          seasonLabel = season.label || "Standard";
          break;
        }
      }
    }
  }

  return {
    rate: targetRate,
    isSeasonal,
    seasonLabel,
  };
}

/**
 * Calculates night-by-night pricing across multi-night stays spanning different seasons.
 * e.g. 2 Nights @ ₹1,200 (Sep 29, 30) + 1 Night @ ₹2,000 (Oct 1) = ₹4,400 Total
 */
function calculateMultiNightRoomRates(room, mealPlan = "CP", startDateStr = null, totalNights = 1) {
  if (!room) {
    return {
      totalCost: 0,
      avgRate: 0,
      breakdown: [],
      isAvailable: false,
      hasSplitSeasons: false,
      splitSummary: "",
    };
  }

  const nightsCount = Math.max(1, parseInt(totalNights, 10) || 1);
  const baseDate = startDateStr ? new Date(startDateStr) : null;
  const isValidBaseDate = baseDate && !isNaN(baseDate.getTime());

  let totalCost = 0;
  const breakdown = [];
  const rateCounts = {};

  for (let n = 0; n < nightsCount; n++) {
    const currentNightDate = isValidBaseDate ? new Date(baseDate.getTime() + n * 86400000) : null;
    const { rate, isSeasonal, seasonLabel } = getSingleNightRate(room, mealPlan, currentNightDate);

    totalCost += rate;
    if (rate > 0) {
      rateCounts[rate] = (rateCounts[rate] || 0) + 1;
    }

    breakdown.push({
      nightNumber: n + 1,
      date: currentNightDate ? currentNightDate.toISOString().slice(0, 10) : "",
      dateLabel: currentNightDate
        ? currentNightDate.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })
        : `Night ${n + 1}`,
      rate,
      isSeasonal,
      seasonLabel: seasonLabel || "Standard",
    });
  }

  const isAvailable = breakdown.length > 0 && breakdown.every((b) => b.rate > 0);
  const avgRate = nightsCount > 0 && isAvailable ? totalCost / nightsCount : 0;
  const uniqueRates = Object.keys(rateCounts).map(Number);
  const hasSplitSeasons = uniqueRates.length > 1;

  // Group consecutive nights with the same rate and season
  const rateGroups = [];
  breakdown.forEach((b) => {
    const lastGroup = rateGroups[rateGroups.length - 1];
    if (lastGroup && lastGroup.rate === b.rate && lastGroup.seasonLabel === b.seasonLabel) {
      lastGroup.nightsCount += 1;
      lastGroup.endDateLabel = b.dateLabel;
      lastGroup.subtotal += b.rate;
    } else {
      rateGroups.push({
        rate: b.rate,
        seasonLabel: b.seasonLabel,
        nightsCount: 1,
        startDateLabel: b.dateLabel,
        endDateLabel: b.dateLabel,
        subtotal: b.rate,
      });
    }
  });

  // Build a clean split summary: e.g. "2N @ ₹1,200 + 1N @ ₹2,000"
  const splitSummary = rateGroups
    .map((g) => (g.nightsCount > 1 ? `${g.nightsCount}N (${g.startDateLabel}–${g.endDateLabel}) @ ₹${g.rate.toLocaleString("en-IN")}` : `${g.startDateLabel} (1N) @ ₹${g.rate.toLocaleString("en-IN")}`))
    .join(" + ");

  return {
    totalCost: isAvailable ? totalCost : 0,
    avgRate: isAvailable ? avgRate : 0,
    breakdown,
    rateGroups,
    isAvailable,
    hasSplitSeasons,
    splitSummary,
  };
}

/**
 * Minimalist Smart Hotel Rate Finder Dialog
 * Supports both "Top 5 Lowest Price" mode and "All Category Hotels" mode
 */
export default function HotelRateFinderDialog({
  isOpen,
  onClose,
  cityName = "",
  category = "None",
  stayNights = 1,
  startDate = "",
  totalRooms = 1,
  currentMealPlan = "CP",
  onSelectHotel,
}) {
  const [activeTab, setActiveTab] = useState("catalog"); // "catalog" | "manual"
  const [viewMode, setViewMode] = useState("top5"); // "top5" | "all"
  const [sortBy, setSortBy] = useState("price_asc"); // "price_asc" | "price_desc" | "stars_desc" | "name_asc"
  const [nameSearch, setNameSearch] = useState("");
  const [searchCity, setSearchCity] = useState(cityName || "");
  const [selectedCategory, setSelectedCategory] = useState(category || "None");
  const [selectedMealPlan, setSelectedMealPlan] = useState(currentMealPlan || "CP");
  const [selectedStarFilter, setSelectedStarFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [hotels, setHotels] = useState([]);
  const [hotelRoomsMap, setHotelRoomsMap] = useState({});
  const [selectedRoomIndexMap, setSelectedRoomIndexMap] = useState({});

  // Manual inputs
  const [manualName, setManualName] = useState("");
  const [manualRoom, setManualRoom] = useState("Deluxe AC Room");
  const [manualStars, setManualStars] = useState(4);
  const [manualRate, setManualRate] = useState(3000);

  useEffect(() => {
    if (isOpen) {
      setSearchCity(cityName || "");
      setSelectedCategory(category || "None");
      setSelectedMealPlan(currentMealPlan || "CP");
      setSelectedStarFilter("all");
      setViewMode("top5");
      setSortBy("price_asc");
      setNameSearch("");
      setActiveTab("catalog");
    }
  }, [isOpen, cityName, category, currentMealPlan]);

// In-memory cache to prevent redundant HTTP network requests when opening dialog
const cityHotelsCache = new Map();

  const fetchHotelsForCity = useCallback((targetCity, force = false) => {
    if (!targetCity) return;
    const cacheKey = targetCity.trim().toLowerCase();
    if (!force && cityHotelsCache.has(cacheKey)) {
      const cached = cityHotelsCache.get(cacheKey);
      setHotels(cached.hotels || []);
      setHotelRoomsMap(cached.roomsMap || {});
      return;
    }

    setLoading(true);
    fetch(`/api/accommodation/hotels?search=${encodeURIComponent(targetCity.trim())}&includeRooms=true`)
      .then((r) => r.json())
      .then((data) => {
        const cityHotels = data.hotels || [];
        const roomsMap = data.roomsByHotel || {};
        setHotels(cityHotels);
        setHotelRoomsMap(roomsMap);
        cityHotelsCache.set(cacheKey, { hotels: cityHotels, roomsMap });
      })
      .catch((err) => console.error("Failed to load hotels:", err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (isOpen && searchCity) {
      fetchHotelsForCity(searchCity);
    }
  }, [isOpen, searchCity, fetchHotelsForCity]);

  const nights = Math.max(1, parseInt(stayNights, 10) || 1);
  const roomsCount = Math.max(1, parseInt(totalRooms, 10) || 1);

  // 1. Process and rank all matching hotels for the selected criteria
  const allMatchingHotels = useMemo(() => {
    if (!hotels || hotels.length === 0) return [];

    const catNormalized = (selectedCategory || "None").toLowerCase().trim();

    let matchingHotels = hotels.filter((h) => {
      // Category match (if None, match all)
      if (catNormalized !== "none") {
        const hCat = (h.category || "None").toLowerCase().trim();
        if (hCat !== catNormalized) return false;
      }
      // Name search match if typed
      if (nameSearch.trim()) {
        const q = nameSearch.toLowerCase().trim();
        const matchesName = (h.name || "").toLowerCase().includes(q);
        const matchesLoc = (h.location || "").toLowerCase().includes(q);
        if (!matchesName && !matchesLoc) return false;
      }
      return true;
    });

    if (matchingHotels.length === 0 && !nameSearch.trim() && catNormalized !== "none") {
      matchingHotels = [];
    } else if (matchingHotels.length === 0 && !nameSearch.trim()) {
      matchingHotels = [...hotels];
    }

    if (selectedStarFilter !== "all") {
      const targetStar = parseInt(selectedStarFilter, 10);
      const starFiltered = matchingHotels.filter((h) => (parseInt(h.starRating, 10) || 3) >= targetStar);
      if (starFiltered.length > 0) matchingHotels = starFiltered;
    }

    const processed = matchingHotels
      .map((h) => {
        const rooms = hotelRoomsMap[h._id] || [];

        // Calculate multi-night rates for every room
        const roomRates = rooms.map((r, rIdx) => {
          const multi = calculateMultiNightRoomRates(
            r,
            selectedMealPlan,
            startDate,
            nights
          );
          return { roomIndex: rIdx, room: r, ...multi };
        });

        // Find lowest valid room (> 0 and available for all nights)
        const validRates = roomRates.filter((item) => item.isAvailable && item.totalCost > 0);
        if (validRates.length === 0) {
          // This hotel does NOT offer the selected meal plan on any room for these dates
          return null;
        }

        validRates.sort((a, b) => a.totalCost - b.totalCost);
        const lowestRoomIdx = validRates[0].roomIndex;

        // If user has explicitly selected a room index for this hotel AND it is available for all nights
        const userSelectedIdx = selectedRoomIndexMap[h._id];
        const isUserSelectionValid =
          userSelectedIdx !== undefined &&
          userSelectedIdx >= 0 &&
          userSelectedIdx < rooms.length &&
          (roomRates[userSelectedIdx]?.isAvailable || false);

        const activeRoomIdx = isUserSelectionValid ? userSelectedIdx : lowestRoomIdx;
        const activeRoomData = roomRates[activeRoomIdx] || validRates[0];
        const selectedRoom = rooms[activeRoomIdx] || rooms[lowestRoomIdx] || null;

        const totalCost = activeRoomData.totalCost * roomsCount;
        const nightlyRate = activeRoomData.avgRate;
        const isSeasonal = activeRoomData.breakdown.some((b) => b.isSeasonal);

        return {
          hotel: h,
          rooms,
          selectedRoom,
          activeRoomIdx,
          lowestRoomIdx,
          validRoomIndices: validRates.map((v) => v.roomIndex),
          roomRates,
          activeRoomData,
          nightlyRate,
          isSeasonal,
          hasSplitSeasons: activeRoomData.hasSplitSeasons,
          splitSummary: activeRoomData.splitSummary,
          breakdown: activeRoomData.breakdown,
          totalCost,
        };
      })
      .filter(Boolean);

    // Sorting
    if (sortBy === "price_asc") {
      processed.sort((a, b) => a.totalCost - b.totalCost);
    } else if (sortBy === "price_desc") {
      processed.sort((a, b) => b.totalCost - a.totalCost);
    } else if (sortBy === "stars_desc") {
      processed.sort((a, b) => (parseInt(b.hotel.starRating, 10) || 3) - (parseInt(a.hotel.starRating, 10) || 3));
    } else if (sortBy === "name_asc") {
      processed.sort((a, b) => (a.hotel.name || "").localeCompare(b.hotel.name || ""));
    }

    return processed;
  }, [hotels, hotelRoomsMap, selectedCategory, selectedMealPlan, selectedStarFilter, nameSearch, sortBy, startDate, nights, roomsCount, selectedRoomIndexMap]);

  // 2. Display slice depending on viewMode (top5 vs all)
  const displayedHotels = useMemo(() => {
    if (viewMode === "top5") {
      return allMatchingHotels.slice(0, 5);
    }
    return allMatchingHotels;
  }, [allMatchingHotels, viewMode]);

  const totalMatchingCount = allMatchingHotels.length;
  const lowestRate = displayedHotels[0]?.nightlyRate || 0;

  function handleApplyHotel(item) {
    if (typeof onSelectHotel === "function") {
      onSelectHotel({
        hotelId: item.hotel._id,
        hotelName: item.hotel.name,
        cityName: item.hotel.city?.name || searchCity || cityName,
        category: item.hotel.category || selectedCategory,
        starRating: Math.max(1, Math.min(5, parseInt(item.hotel.starRating, 10) || 3)),
        roomId: item.selectedRoom?._id || null,
        roomType: item.selectedRoom?.roomType || "Deluxe AC Room",
        mealPlan: selectedMealPlan,
        pricePerNight: item.nightlyRate,
        totalCost: item.totalCost,
        hasSplitSeasons: item.hasSplitSeasons,
        splitSummary: item.splitSummary,
        rateGroups: item.activeRoomData?.rateGroups || [],
        breakdown: item.breakdown,
      });
    }
    onClose();
  }

  function handleApplyManual() {
    if (typeof onSelectHotel === "function") {
      onSelectHotel({
        hotelId: null,
        hotelName: manualName || `${selectedCategory} Hotel (${searchCity || cityName})`,
        cityName: searchCity || cityName,
        category: selectedCategory,
        starRating: manualStars,
        roomId: null,
        roomType: manualRoom,
        mealPlan: selectedMealPlan,
        pricePerNight: Number(manualRate) || 0,
        totalCost: (Number(manualRate) || 0) * nights * roomsCount,
      });
    }
    onClose();
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95">
        
        {/* ── 1. Luxury Header ── */}
        <div className="bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 p-5 sm:p-6 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 flex-shrink-0 border-b border-white/10 relative overflow-hidden">
          <div className="flex items-center gap-3.5 relative z-10">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-amber-500/20">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
                  Rate Finder
                </span>
                <span className="text-[10px] font-black text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  Live Rates
                </span>
              </div>
              <h3 className="text-[17px] font-black text-white leading-snug mt-0.5">
                Hotel Rate Finder &amp; Catalog
              </h3>
              <p className="text-[11.5px] text-slate-300 font-medium">
                {nights}N in {searchCity || cityName || "Destination"} • {roomsCount} {roomsCount === 1 ? "Room" : "Rooms"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 relative z-10">
            {/* View Mode Switcher: Top 5 vs All Hotels */}
            <div className="bg-white/10 p-1 rounded-2xl flex items-center gap-1 border border-white/15 text-[11.5px] font-bold">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("catalog");
                  setViewMode("top5");
                }}
                className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                  activeTab === "catalog" && viewMode === "top5" ? "bg-amber-500 text-slate-950 shadow-sm font-black" : "text-white/80 hover:text-white"
                }`}
              >
                <span>🏆 Top 5 Lowest</span>
                {totalMatchingCount > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${activeTab === "catalog" && viewMode === "top5" ? "bg-slate-900 text-amber-300" : "bg-white/20 text-white"}`}>
                    {Math.min(5, totalMatchingCount)}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab("catalog");
                  setViewMode("all");
                }}
                className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                  activeTab === "catalog" && viewMode === "all" ? "bg-amber-500 text-slate-950 shadow-sm font-black" : "text-white/80 hover:text-white"
                }`}
              >
                <span>📋 All {selectedCategory !== "None" ? selectedCategory : "Hotels"}</span>
                {totalMatchingCount > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${activeTab === "catalog" && viewMode === "all" ? "bg-slate-900 text-amber-300" : "bg-white/20 text-white"}`}>
                    {totalMatchingCount}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("manual")}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  activeTab === "manual" ? "bg-amber-500 text-slate-950 shadow-sm font-black" : "text-white/80 hover:text-white"
                }`}
              >
                + Custom
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── 2. Search & Filter Toolbar ── */}
        <div className="px-6 py-3.5 bg-gradient-to-r from-slate-50 via-amber-50/20 to-slate-50 border-b border-slate-200/80 space-y-3 flex-shrink-0">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
            {/* City Search */}
            <div className="sm:col-span-4 relative">
              <MapPin className="w-3.5 h-3.5 text-amber-600 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchCity}
                onChange={(e) => setSearchCity(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") fetchHotelsForCity(searchCity);
                }}
                placeholder="City (e.g. Munnar)..."
                className="w-full pl-8 pr-7 py-1.5 text-[12.5px] font-bold rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 shadow-2xs"
              />
              <button
                type="button"
                onClick={() => fetchHotelsForCity(searchCity, true)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-0.5"
                title="Refresh"
              >
                <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin text-amber-500" : ""}`} />
              </button>
            </div>

            {/* In-Line Hotel Name Filter */}
            <div className="sm:col-span-4 relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={nameSearch}
                onChange={(e) => setNameSearch(e.target.value)}
                placeholder="Filter hotel by name..."
                className="w-full pl-8 pr-3 py-1.5 text-[12.5px] font-bold rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 shadow-2xs"
              />
            </div>

            {/* Sort Dropdown */}
            <div className="sm:col-span-4 flex items-center gap-1.5">
              <div className="relative flex-1">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-3 py-1.5 text-[11.5px] font-black rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:border-amber-500 shadow-2xs cursor-pointer"
                >
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="stars_desc">Star Rating: 5★ to 1★</option>
                  <option value="name_asc">Alphabetical (A - Z)</option>
                </select>
              </div>

              {/* Star Filters */}
              <div className="flex items-center gap-0.5">
                {["all", "3", "4", "5"].map((sf) => (
                  <button
                    key={sf}
                    type="button"
                    onClick={() => setSelectedStarFilter(sf)}
                    className={`px-2 py-1 rounded-xl text-[10.5px] font-bold transition-all ${
                      selectedStarFilter === sf
                        ? "bg-slate-900 text-amber-400 font-black shadow-2xs"
                        : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80"
                    }`}
                  >
                    {sf === "all" ? "All" : `${sf}★+`}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Category Horizontal Scroll Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
            <span className="text-[10.5px] font-black text-slate-500 uppercase tracking-wider mr-1 flex-shrink-0">
              Category:
            </span>
            {HOTEL_CATEGORIES.map((cat) => {
              const isSel = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(cat);
                    setSelectedRoomIndexMap({});
                    setViewMode("top5");
                  }}
                  className={`px-3 py-1 rounded-xl text-[11.5px] font-bold transition-all whitespace-nowrap border ${
                    isSel
                      ? "bg-amber-500 text-slate-950 font-black border-amber-500 shadow-xs scale-[1.02]"
                      : "bg-white text-slate-700 hover:bg-amber-50/60 border-slate-200"
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Meal Plan Segmented Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-slate-200/80">
            {MEAL_PLANS.map((plan) => {
              const isSel = selectedMealPlan === plan.id;
              return (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => {
                    setSelectedMealPlan(plan.id);
                    setSelectedRoomIndexMap({});
                  }}
                  className={`px-3 py-1.5 rounded-xl border text-left transition-all flex items-center justify-between ${
                    isSel
                      ? "bg-gradient-to-r from-slate-950 to-indigo-950 border-slate-900 text-white shadow-xs"
                      : "bg-white border-slate-200 text-slate-700 hover:bg-amber-50/50"
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[12px] font-black ${isSel ? "text-amber-400" : "text-slate-900"}`}>
                        {plan.id}
                      </span>
                      <span className={`text-[10.5px] font-medium ${isSel ? "text-slate-300" : "text-slate-500"}`}>
                        • {plan.title}
                      </span>
                    </div>
                  </div>
                  {isSel && <Check className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── 3. Content Area: Ranked Cards or Manual ── */}
        <div className="p-5 overflow-y-auto flex-1 space-y-3">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
              <div className="w-7 h-7 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
              <p className="text-[12px] font-bold">Scanning catalog hotels and live room rates...</p>
            </div>
          ) : activeTab === "catalog" ? (
            displayedHotels.length === 0 ? (
              <div className="py-10 text-center rounded-3xl bg-slate-50 border border-slate-200/80 space-y-3">
                <AlertCircle className="w-7 h-7 text-slate-400 mx-auto" />
                <h4 className="text-[14px] font-black text-slate-800">No matching hotels found</h4>
                <p className="text-[12px] text-slate-500 max-w-sm mx-auto font-medium">
                  No properties found in {searchCity || cityName} with {selectedMealPlan} meal plan {selectedCategory !== "None" ? `for ${selectedCategory} category` : ""}.
                </p>
                <div className="flex items-center justify-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory("None");
                      setNameSearch("");
                      setViewMode("top5");
                    }}
                    className="px-4 py-2 bg-white border border-slate-300 text-slate-800 rounded-xl text-[12px] font-bold hover:bg-slate-50 shadow-2xs"
                  >
                    View All Categories
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("manual")}
                    className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[12px] font-bold shadow-2xs"
                  >
                    + Enter Manual Hotel
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Result header info */}
                <div className="flex items-center justify-between text-[11.5px] text-slate-500 px-1">
                  <div className="flex items-center gap-1.5">
                    <span>
                      Showing <strong className="text-slate-900 font-black">{displayedHotels.length}</strong> {viewMode === "top5" ? "top lowest-price hotels" : "hotels"} in {searchCity || cityName}
                    </span>
                    <span className="text-[10.5px] font-black text-amber-800 bg-amber-50 px-2 py-0.2 rounded-md border border-amber-200">
                      {selectedCategory} • {selectedMealPlan} Plan
                    </span>
                  </div>
                  {viewMode === "top5" && totalMatchingCount > 5 ? (
                    <button
                      type="button"
                      onClick={() => setViewMode("all")}
                      className="text-amber-700 font-black hover:underline flex items-center gap-1"
                    >
                      <span>View all {totalMatchingCount} hotels &rarr;</span>
                    </button>
                  ) : viewMode === "all" && totalMatchingCount > 5 ? (
                    <button
                      type="button"
                      onClick={() => setViewMode("top5")}
                      className="text-slate-600 font-bold hover:text-slate-900 hover:underline"
                    >
                      Show Top 5 Only
                    </button>
                  ) : null}
                </div>

                {displayedHotels.map((item, idx) => {
                  const isLowest = idx === 0 && sortBy === "price_asc";
                  const rankNumber = idx + 1;

                  return (
                    <div
                      key={item.hotel._id}
                      className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isLowest
                          ? "bg-gradient-to-br from-amber-50 via-white to-amber-50/40 border-amber-400/90 shadow-xs ring-2 ring-amber-500/20"
                          : "bg-gradient-to-br from-slate-50 via-white to-amber-50/10 border-slate-200/90 hover:border-amber-300 shadow-2xs"
                      }`}
                    >
                      {/* Left info */}
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          {isLowest ? (
                            <span className="px-2 py-0.5 rounded-md bg-amber-500 text-slate-950 font-black text-[10px] uppercase tracking-wider shadow-2xs">
                              🏆 #1 Lowest Price
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md bg-slate-900 text-amber-300 font-mono font-black text-[10px] shadow-2xs">
                              #{rankNumber}
                            </span>
                          )}

                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border shadow-2xs ${getCategoryBadgeClass(item.hotel.category || "None")}`}>
                            {item.hotel.category || "None"}
                          </span>

                          <div className="flex text-amber-400 text-[12px] bg-white px-1.5 py-0.5 rounded-lg border border-slate-200 shadow-2xs">
                            {[...Array(item.hotel.starRating || 3)].map((_, i) => (
                              <span key={i}>★</span>
                            ))}
                          </div>

                          {item.hasSplitSeasons ? (
                            <span className="text-[10px] font-black text-amber-900 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-300 shadow-2xs" title={item.splitSummary}>
                              ⚡ Split Season ({item.splitSummary})
                            </span>
                          ) : item.isSeasonal ? (
                            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                              Seasonal Rate
                            </span>
                          ) : null}
                        </div>

                        <h4 className="text-[15px] font-black text-slate-900 truncate">
                          {item.hotel.name}
                        </h4>

                        <div className="flex items-center gap-2 text-[11.5px] text-slate-600 flex-wrap font-medium">
                          {item.validRoomIndices?.length > 1 ? (
                            <div className="flex items-center gap-1.5">
                              <span className="text-[11px] font-bold text-slate-700">Room:</span>
                              <select
                                value={item.activeRoomIdx}
                                onChange={(e) =>
                                  setSelectedRoomIndexMap((prev) => ({
                                    ...prev,
                                    [item.hotel._id]: parseInt(e.target.value, 10) || 0,
                                  }))
                                }
                                className="text-[11.5px] font-bold text-slate-800 bg-white border border-slate-300 rounded-lg px-2 py-0.5 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 shadow-2xs cursor-pointer"
                              >
                                {item.rooms.map((r, rIdx) => {
                                  const rMulti = calculateMultiNightRoomRates(
                                    r,
                                    selectedMealPlan,
                                    startDate,
                                    nights
                                  );
                                  if (!rMulti.isAvailable || rMulti.totalCost <= 0) return null;
                                  const isLowest = rIdx === item.lowestRoomIdx && item.validRoomIndices.length > 1;
                                  return (
                                    <option key={r._id || rIdx} value={rIdx}>
                                      {r.roomType || "Standard Room"} {r.maxOccupancy ? `[Max ${r.maxOccupancy}] ` : ""}(₹{rMulti.totalCost.toLocaleString("en-IN")}{nights > 1 ? ` • ₹${Math.round(rMulti.avgRate)}/n` : ""}){isLowest ? " • Lowest" : ""}
                                    </option>
                                  );
                                })}
                              </select>
                            </div>
                          ) : (
                            <span className="font-bold text-slate-800">
                              {item.selectedRoom?.roomType || "Standard Room"}
                              {item.selectedRoom?.maxOccupancy ? ` (Max ${item.selectedRoom.maxOccupancy})` : ""}
                            </span>
                          )}

                          <span className="text-slate-300">•</span>
                          <span className="text-amber-800 font-bold">{selectedMealPlan} Plan</span>
                        </div>
                      </div>

                      {/* Right rate & select action */}
                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                        {item.hasSplitSeasons && item.activeRoomData?.rateGroups?.length > 1 ? (
                          <div className="text-left sm:text-right space-y-1">
                            <div className="space-y-0.5">
                              {item.activeRoomData.rateGroups.map((g, gIdx) => (
                                <div key={gIdx} className="text-[11px] font-bold text-slate-700 flex sm:justify-end items-center gap-1.5 font-mono">
                                  <span className="text-[10px] text-slate-500 font-sans">
                                    {g.nightsCount > 1 ? `${g.startDateLabel}–${g.endDateLabel} (${g.nightsCount}N)` : `${g.startDateLabel} (1N)`}:
                                  </span>
                                  <span className="text-slate-900 font-black">
                                    ₹{g.rate.toLocaleString("en-IN")}/n
                                  </span>
                                  {g.nightsCount > 1 && (
                                    <span className="text-slate-400 text-[10px]">
                                      (= ₹{g.subtotal.toLocaleString("en-IN")})
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>

                            <div className="pt-0.5 border-t border-slate-200/80">
                              <span className="text-[13.5px] font-black text-slate-950 font-mono bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-300 inline-block shadow-2xs">
                                Total: ₹{item.totalCost.toLocaleString("en-IN")}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="text-left sm:text-right">
                            <div className="flex items-baseline gap-1 justify-end">
                              <span className="text-[16px] font-black text-slate-900 font-mono">
                                ₹{Math.round(item.nightlyRate).toLocaleString("en-IN")}
                              </span>
                              <span className="text-[11px] text-slate-400 font-bold">/ night</span>
                            </div>

                            <span className="text-[11px] font-black text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 inline-block font-mono">
                              Total: ₹{item.totalCost.toLocaleString("en-IN")}
                            </span>
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => handleApplyHotel(item)}
                          className={`px-4 py-2 rounded-xl font-black text-[12px] transition-all flex items-center gap-1.5 shadow-2xs hover:scale-105 active:scale-95 ${
                            isLowest
                              ? "bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black shadow-amber-500/25 shadow-md"
                              : "bg-gradient-to-r from-slate-950 to-indigo-950 hover:from-slate-900 hover:to-indigo-900 text-white"
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Apply</span>
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* Prominent "View All Hotels" Expansion Banner */}
                {viewMode === "top5" && totalMatchingCount > 5 && (
                  <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 text-white border border-indigo-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        <h4 className="text-[14px] font-black text-white">
                          Looking for more hotel options?
                        </h4>
                      </div>
                      <p className="text-[12px] text-slate-300 font-medium">
                        There are <strong className="text-amber-400">{totalMatchingCount - 5} more</strong> {selectedCategory !== "None" ? selectedCategory : ""} hotels available in {searchCity || cityName} with <strong className="text-amber-400">{selectedMealPlan} Plan</strong>.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setViewMode("all")}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 hover:from-amber-500 hover:to-orange-600 text-slate-950 font-black text-[12.5px] shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95 flex-shrink-0"
                    >
                      <span>View All {totalMatchingCount} Hotels</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* If in "All" mode, option to collapse back */}
                {viewMode === "all" && totalMatchingCount > 5 && (
                  <div className="text-center py-3">
                    <button
                      type="button"
                      onClick={() => setViewMode("top5")}
                      className="text-[12px] font-black text-amber-800 hover:text-amber-950 bg-amber-50 hover:bg-amber-100 px-4 py-2 rounded-xl border border-amber-200 transition-all shadow-2xs"
                    >
                      ▲ Show Top 5 Lowest Price Only
                    </button>
                  </div>
                )}
              </div>
            )
          ) : (
            /* ── Manual Hotel Entry Tab ── */
            <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-50 via-white to-amber-50/20 border border-slate-200/90 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <Building2 className="w-4 h-4 text-amber-600" />
                <h4 className="text-[14px] font-black text-slate-900">Enter Custom Property Details</h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11px] font-black text-slate-600 uppercase tracking-wider mb-1.5">Property Name</label>
                  <input
                    type="text"
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                    placeholder="e.g. Hilltop Cottage Munnar"
                    className="w-full px-3.5 py-2 text-[12.5px] font-bold rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black text-slate-600 uppercase tracking-wider mb-1.5">Room Type</label>
                  <input
                    type="text"
                    value={manualRoom}
                    onChange={(e) => setManualRoom(e.target.value)}
                    placeholder="e.g. Deluxe Mountain View"
                    className="w-full px-3.5 py-2 text-[12.5px] font-bold rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black text-slate-600 uppercase tracking-wider mb-1.5">Stars</label>
                  <select
                    value={manualStars}
                    onChange={(e) => setManualStars(parseInt(e.target.value, 10) || 3)}
                    className="w-full px-3.5 py-2 text-[12.5px] font-bold rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 shadow-2xs cursor-pointer"
                  >
                    {[1, 2, 3, 4, 5].map((s) => (
                      <option key={s} value={s}>
                        {s} Star Rating
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-black text-slate-600 uppercase tracking-wider mb-1.5">Rate (₹ / Night)</label>
                  <div className="relative">
                    <span className="text-amber-600 font-black text-[12px] absolute left-3 top-1/2 -translate-y-1/2">₹</span>
                    <input
                      type="number"
                      min={0}
                      value={manualRate}
                      onChange={(e) => setManualRate(parseFloat(e.target.value) || 0)}
                      placeholder="3000"
                      className="w-full pl-8 pr-3 py-2 text-[12.5px] font-black rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 font-mono shadow-2xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleApplyManual}
                  className="px-5 py-2.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black text-[12.5px] rounded-xl shadow-md shadow-amber-500/25 transition-all hover:scale-105 active:scale-95"
                >
                  Apply Property to Stay
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
