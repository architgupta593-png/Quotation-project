"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  X, Search, Building2, Star, Check, Sparkles, MapPin,
  Utensils, BedDouble, ArrowRight, IndianRupee, AlertCircle,
  Tag, Info, ExternalLink, SlidersHorizontal, Plus, RefreshCw,
  Sliders, ChevronRight, CheckCircle2
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
 * Extracts room rate for chosen meal plan with seasonal priority
 */
function getRoomRateForPlan(room, mealPlan = "CP", startDateStr = null, hotelMinPrice = 2500) {
  if (!room) return { rate: hotelMinPrice, isSeasonal: false };
  let targetRate = 0;
  let isSeasonal = false;

  // 1. Seasonal date range match
  if (startDateStr && room.pricing?.seasons && room.pricing.seasons.length > 0) {
    const travelDate = new Date(startDateStr);
    const matchingSeason = room.pricing.seasons.find((s) => {
      if (!s.startDate || !s.endDate) return false;
      const sStart = new Date(s.startDate);
      const sEnd = new Date(s.endDate);
      return travelDate >= sStart && travelDate <= sEnd;
    });

    if (matchingSeason) {
      if (matchingSeason.rates && matchingSeason.rates[mealPlan] !== undefined && Number(matchingSeason.rates[mealPlan]) > 0) {
        targetRate = Number(matchingSeason.rates[mealPlan]);
        isSeasonal = true;
      } else if (matchingSeason.baseRate && Number(matchingSeason.baseRate) > 0) {
        const diffMap = { EP: -300, CP: 0, MAP: 700, AP: 1400 };
        targetRate = Math.max(0, Number(matchingSeason.baseRate) + (diffMap[mealPlan] || 0));
        isSeasonal = true;
      }
    }
  }

  // 2. Base room rate
  if (targetRate === 0 && room.pricing?.rates && room.pricing.rates[mealPlan] !== undefined && Number(room.pricing.rates[mealPlan]) > 0) {
    targetRate = Number(room.pricing.rates[mealPlan]);
  } else if (targetRate === 0 && room.pricing?.baseRate && Number(room.pricing.baseRate) > 0) {
    const baseCP = Number(room.pricing.baseRate);
    const diffMap = { EP: -300, CP: 0, MAP: 700, AP: 1400 };
    targetRate = Math.max(0, baseCP + (diffMap[mealPlan] || 0));
  }

  // 3. Fallback to hotel minPrice
  if (targetRate === 0) {
    const base = Number(hotelMinPrice) || 2500;
    const diffMap = { EP: -300, CP: 0, MAP: 700, AP: 1400 };
    targetRate = Math.max(0, base + (diffMap[mealPlan] || 0));
  }

  return { rate: targetRate, isSeasonal };
}

/**
 * Minimalist Smart Hotel Rate Finder Dialog
 */
export default function HotelRateFinderDialog({
  isOpen,
  onClose,
  cityName = "",
  category = "Deluxe",
  stayNights = 1,
  startDate = "",
  totalRooms = 1,
  currentMealPlan = "CP",
  onSelectHotel,
}) {
  const [activeTab, setActiveTab] = useState("catalog"); // "catalog" | "manual"
  const [searchCity, setSearchCity] = useState(cityName || "");
  const [selectedCategory, setSelectedCategory] = useState(category || "Deluxe");
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
      setSelectedCategory(category || "Deluxe");
      setSelectedMealPlan(currentMealPlan || "CP");
      setSelectedStarFilter("all");
      setActiveTab("catalog");
    }
  }, [isOpen, cityName, category, currentMealPlan]);

  const fetchHotelsForCity = useCallback((targetCity) => {
    if (!targetCity) return;
    setLoading(true);
    fetch(`/api/accommodation/hotels?search=${encodeURIComponent(targetCity.trim())}`)
      .then((r) => r.json())
      .then(async (data) => {
        const cityHotels = data.hotels || [];
        setHotels(cityHotels);

        const roomsMap = {};
        await Promise.all(
          cityHotels.map(async (h) => {
            try {
              const res = await fetch(`/api/accommodation/rooms?hotelId=${h._id}`);
              const rData = await res.json();
              roomsMap[h._id] = rData.rooms || [];
            } catch (err) {
              roomsMap[h._id] = [];
            }
          })
        );
        setHotelRoomsMap(roomsMap);
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

  // Filter & rank top 5 lowest price hotels
  const rankedHotels = useMemo(() => {
    if (!hotels || hotels.length === 0) return [];

    const catNormalized = (selectedCategory || "None").toLowerCase().trim();

    let matchingHotels = hotels.filter((h) => {
      if (catNormalized === "none") return true;
      const hCat = (h.category || "None").toLowerCase().trim();
      return hCat === catNormalized;
    });

    if (matchingHotels.length === 0) {
      matchingHotels = [...hotels];
    }

    if (selectedStarFilter !== "all") {
      const targetStar = parseInt(selectedStarFilter, 10);
      const starFiltered = matchingHotels.filter((h) => (parseInt(h.starRating, 10) || 3) >= targetStar);
      if (starFiltered.length > 0) matchingHotels = starFiltered;
    }

    const processed = matchingHotels.map((h) => {
      const rooms = hotelRoomsMap[h._id] || [];
      const chosenRoomIdx = selectedRoomIndexMap[h._id] || 0;
      const selectedRoom = rooms[chosenRoomIdx] || rooms[0] || null;

      const { rate: nightlyRate, isSeasonal } = getRoomRateForPlan(
        selectedRoom,
        selectedMealPlan,
        startDate,
        h.minPrice || 2500
      );

      const totalCost = nightlyRate * nights * roomsCount;

      return {
        hotel: h,
        rooms,
        selectedRoom,
        nightlyRate,
        isSeasonal,
        totalCost,
      };
    });

    processed.sort((a, b) => a.nightlyRate - b.nightlyRate);
    return processed.slice(0, 5);
  }, [hotels, hotelRoomsMap, selectedCategory, selectedMealPlan, selectedStarFilter, startDate, nights, roomsCount, selectedRoomIndexMap]);

  const lowestRate = rankedHotels[0]?.nightlyRate || 0;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* ── 1. Minimalist Clean Header ── */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-slate-900 leading-tight">
                Rate Finder &amp; Hotel Selector
              </h3>
              <p className="text-[11.5px] text-slate-400 font-medium">
                {nights}N in {searchCity || cityName || "Destination"} • {roomsCount} {roomsCount === 1 ? "Room" : "Rooms"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-slate-100 p-0.5 rounded-xl text-[11px] font-bold text-slate-600">
              <button
                type="button"
                onClick={() => setActiveTab("catalog")}
                className={`px-3 py-1 rounded-lg transition-all ${
                  activeTab === "catalog" ? "bg-white text-slate-900 shadow-2xs" : "hover:text-slate-900"
                }`}
              >
                Top 5 Catalog
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("manual")}
                className={`px-3 py-1 rounded-lg transition-all ${
                  activeTab === "manual" ? "bg-white text-slate-900 shadow-2xs" : "hover:text-slate-900"
                }`}
              >
                + Custom
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── 2. Compact Search & Filter Toolbar ── */}
        <div className="px-6 py-3.5 bg-slate-50/70 border-b border-slate-100 space-y-3 flex-shrink-0">
          {/* City Input & Stars Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="relative flex-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchCity}
                onChange={(e) => setSearchCity(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") fetchHotelsForCity(searchCity);
                }}
                placeholder="Search city (e.g. Munnar, Kochi)..."
                className="w-full pl-8 pr-7 py-1.5 text-[12px] font-medium rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-slate-400 shadow-2xs"
              />
              <button
                type="button"
                onClick={() => fetchHotelsForCity(searchCity)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-0.5"
                title="Refresh"
              >
                <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin text-amber-500" : ""}`} />
              </button>
            </div>

            {/* Clean Stars Filter */}
            <div className="flex items-center gap-1">
              {["all", "3", "4", "5"].map((sf) => (
                <button
                  key={sf}
                  type="button"
                  onClick={() => setSelectedStarFilter(sf)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                    selectedStarFilter === sf
                      ? "bg-slate-900 text-white font-bold"
                      : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80"
                  }`}
                >
                  {sf === "all" ? "All Stars" : `${sf}★+`}
                </button>
              ))}
            </div>
          </div>

          {/* Category Horizontal Scroll Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
            <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider mr-1 flex-shrink-0">
              Category:
            </span>
            {HOTEL_CATEGORIES.map((cat) => {
              const isSel = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-0.5 rounded-lg text-[11px] font-medium transition-all whitespace-nowrap border ${
                    isSel
                      ? "bg-amber-500 text-slate-950 font-bold border-amber-500 shadow-2xs"
                      : "bg-white text-slate-600 hover:bg-slate-100 border-slate-200"
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Minimalist Meal Plan Segmented Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-slate-200/60">
            {MEAL_PLANS.map((plan) => {
              const isSel = selectedMealPlan === plan.id;
              return (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => setSelectedMealPlan(plan.id)}
                  className={`px-3 py-2 rounded-xl border text-left transition-all flex items-center justify-between ${
                    isSel
                      ? "bg-slate-900 border-slate-900 text-white shadow-2xs"
                      : "bg-white border-slate-200/90 text-slate-700 hover:bg-slate-50"
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
              <div className="w-6 h-6 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
              <p className="text-[11.5px] font-medium">Scanning lowest available room rates...</p>
            </div>
          ) : activeTab === "catalog" ? (
            rankedHotels.length === 0 ? (
              <div className="py-10 text-center rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
                <AlertCircle className="w-6 h-6 text-slate-400 mx-auto" />
                <h4 className="text-[13px] font-bold text-slate-700">No matching catalog hotels</h4>
                <p className="text-[11.5px] text-slate-400 max-w-sm mx-auto">
                  No properties found in {searchCity || cityName} for {selectedCategory} category.
                </p>
                <div className="flex items-center justify-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setSelectedCategory("None")}
                    className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-[11.5px] font-semibold hover:bg-slate-50"
                  >
                    View All Categories
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("manual")}
                    className="px-3 py-1.5 bg-slate-900 text-white rounded-xl text-[11.5px] font-semibold"
                  >
                    + Enter Manual Hotel
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5">
                {rankedHotels.map((item, idx) => {
                  const isLowest = idx === 0;
                  const diff = item.nightlyRate - lowestRate;

                  return (
                    <div
                      key={item.hotel._id}
                      className={`p-3.5 sm:p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isLowest
                          ? "bg-amber-50/30 border-amber-300/80 hover:border-amber-400"
                          : "bg-white border-slate-200/80 hover:border-slate-300"
                      }`}
                    >
                      {/* Left info */}
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          {isLowest && (
                            <span className="px-1.5 py-0.5 rounded-md bg-amber-500 text-slate-950 font-black text-[9.5px] uppercase tracking-wider">
                              Lowest Price
                            </span>
                          )}

                          <span className={`text-[9.5px] font-semibold px-1.5 py-0.5 rounded ${getCategoryBadgeClass(item.hotel.category || "None")}`}>
                            {item.hotel.category || "None"}
                          </span>

                          <div className="flex text-amber-400 text-[10px]">
                            {[...Array(item.hotel.starRating || 3)].map((_, i) => (
                              <span key={i}>★</span>
                            ))}
                          </div>

                          {item.isSeasonal && (
                            <span className="text-[9.5px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                              Seasonal
                            </span>
                          )}
                        </div>

                        <h4 className="text-[14px] font-bold text-slate-900 truncate">
                          {item.hotel.name}
                        </h4>

                        <div className="flex items-center gap-2 text-[11px] text-slate-500 flex-wrap">
                          <span className="font-medium text-slate-700">
                            {item.selectedRoom?.roomType || "Standard Room"}
                          </span>

                          {item.rooms.length > 1 && (
                            <select
                              value={selectedRoomIndexMap[item.hotel._id] || 0}
                              onChange={(e) =>
                                setSelectedRoomIndexMap((prev) => ({
                                  ...prev,
                                  [item.hotel._id]: parseInt(e.target.value, 10) || 0,
                                }))
                              }
                              className="text-[10px] font-medium bg-slate-100 border border-slate-200 rounded px-1.5 py-0.5 focus:outline-none"
                            >
                              {item.rooms.map((r, rIdx) => (
                                <option key={r._id || rIdx} value={rIdx}>
                                  {r.roomType}
                                </option>
                              ))}
                            </select>
                          )}

                          <span className="text-slate-300">•</span>
                          <span>{selectedMealPlan} Plan</span>
                        </div>
                      </div>

                      {/* Right rate & select action */}
                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                        <div className="text-left sm:text-right">
                          <div className="flex items-baseline gap-1 justify-end">
                            <span className="text-[15px] font-black text-slate-900 font-mono">
                              ₹{item.nightlyRate.toLocaleString("en-IN")}
                            </span>
                            <span className="text-[10px] text-slate-400">/ night</span>
                          </div>

                          <span className="text-[10px] text-slate-400 block">
                            Total: ₹{item.totalCost.toLocaleString("en-IN")}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleApplyHotel(item)}
                          className={`px-3 py-1.5 rounded-xl font-bold text-[11.5px] transition-all flex items-center gap-1.5 ${
                            isLowest
                              ? "bg-amber-500 hover:bg-amber-600 text-slate-950 font-black shadow-2xs"
                              : "bg-slate-900 hover:bg-slate-800 text-white"
                          }`}
                        >
                          <Check className="w-3 h-3" />
                          <span>Apply</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            /* ── Manual Hotel Entry Tab ── */
            <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-3">
              <h4 className="text-[12.5px] font-bold text-slate-800">Enter Custom Property Details</h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10.5px] font-bold text-slate-500 uppercase mb-1">Property Name</label>
                  <input
                    type="text"
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                    placeholder="e.g. Hilltop Cottage Munnar"
                    className="w-full px-3 py-1.5 text-[12px] font-medium rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-[10.5px] font-bold text-slate-500 uppercase mb-1">Room Type</label>
                  <input
                    type="text"
                    value={manualRoom}
                    onChange={(e) => setManualRoom(e.target.value)}
                    placeholder="e.g. Deluxe Mountain View"
                    className="w-full px-3 py-1.5 text-[12px] font-medium rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-[10.5px] font-bold text-slate-500 uppercase mb-1">Stars</label>
                  <select
                    value={manualStars}
                    onChange={(e) => setManualStars(parseInt(e.target.value, 10) || 3)}
                    className="w-full px-3 py-1.5 text-[12px] font-medium rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-slate-400"
                  >
                    {[1, 2, 3, 4, 5].map((s) => (
                      <option key={s} value={s}>
                        {s} Star Rating
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10.5px] font-bold text-slate-500 uppercase mb-1">Rate (₹ / Night)</label>
                  <input
                    type="number"
                    min={0}
                    value={manualRate}
                    onChange={(e) => setManualRate(parseFloat(e.target.value) || 0)}
                    placeholder="3000"
                    className="w-full px-3 py-1.5 text-[12px] font-bold rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-slate-400 font-mono"
                  />
                </div>
              </div>

              <div className="pt-1 flex justify-end">
                <button
                  type="button"
                  onClick={handleApplyManual}
                  className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[12px] rounded-xl shadow-2xs"
                >
                  Apply Property
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
