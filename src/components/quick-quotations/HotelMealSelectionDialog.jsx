"use client";

import { useState, useMemo } from "react";
import {
  Star, MapPin, Hotel, Search, X, Sparkles, ListFilter
} from "lucide-react";
import {
  HOTEL_CATEGORIES,
  getHotelAllPrices,
} from "@/components/packages/AccommodationPanel";

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
  category: initialCategory = "Deluxe",
  roomType: initialRoomType = "Deluxe AC Room",
  mealPlan: initialMealPlan = "CP",
  catalogHotels = [],
  roomsMap = {},
  onSelectHotel,
}) {
  const [activeCategory, setActiveCategory] = useState(initialCategory || "Deluxe");
  const [activeMealPlan, setActiveMealPlan] = useState(initialMealPlan || "CP");
  const [showAllHotels, setShowAllHotels] = useState(false); // Default: Top 5 Lowest Price
  const [searchQuery, setSearchQuery] = useState("");
  const [starFilter, setStarFilter] = useState("ALL");

  // Keep state synced when modal is reopened
  useMemo(() => {
    if (isOpen) {
      if (initialCategory) setActiveCategory(initialCategory);
      if (initialMealPlan) setActiveMealPlan(initialMealPlan);
      setShowAllHotels(false);
      setSearchQuery("");
      setStarFilter("ALL");
    }
  }, [isOpen, initialCategory, initialMealPlan]);

  // Compute all matching hotels for the city and category with exact price for the meal plan
  const { allMatchingHotels, sortedHotels, top5Hotels } = useMemo(() => {
    const list = catalogHotels.filter((h) => {
      const matchCity =
        !cityName ||
        (h.city?.name && h.city.name.toLowerCase().includes(cityName.toLowerCase())) ||
        (cityName.toLowerCase().includes(h.city?.name?.toLowerCase() || ""));

      const matchCat = h.category && h.category.toLowerCase() === activeCategory.toLowerCase();

      const matchSearch =
        !searchQuery.trim() ||
        h.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        h.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (h.city?.name && h.city.name.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchStar = starFilter === "ALL" || String(h.starRating) === String(starFilter);

      return matchCity && matchCat && matchSearch && matchStar;
    });

    // Enrich each hotel with exact room & selected meal plan price
    const enriched = list.map((hotel) => {
      const rooms = roomsMap[hotel._id] || [];
      const pricing = getHotelAllPrices(hotel, rooms);

      // Find closest room matching initialRoomType
      let matchedRoom = pricing.roomOptions.find(
        (r) => r.name.toLowerCase().includes((initialRoomType || "").toLowerCase()) ||
               (initialRoomType || "").toLowerCase().includes(r.name.toLowerCase())
      );
      if (!matchedRoom) {
        matchedRoom = pricing.roomOptions[0];
      }

      // Calculate meal rate
      const mealRate = matchedRoom?.meals?.[activeMealPlan] || matchedRoom?.minPrice || pricing.minPrice || 0;

      return {
        hotel,
        matchedRoom,
        roomOptions: pricing.roomOptions,
        calculatedPrice: Number(mealRate) || 0,
        hasPrice: mealRate > 0,
      };
    });

    // Sort by price ascending (Lowest Price first)
    const sorted = [...enriched].sort((a, b) => {
      if (a.calculatedPrice <= 0 && b.calculatedPrice > 0) return 1;
      if (b.calculatedPrice <= 0 && a.calculatedPrice > 0) return -1;
      return a.calculatedPrice - b.calculatedPrice;
    });

    const top5 = sorted.slice(0, 5);

    return {
      allMatchingHotels: enriched,
      sortedHotels: sorted,
      top5Hotels: top5,
    };
  }, [catalogHotels, roomsMap, cityName, activeCategory, activeMealPlan, initialRoomType, searchQuery, starFilter]);

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
              const { hotel, matchedRoom, calculatedPrice } = item;
              const stayTotal = calculatedPrice * stayNights;

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
                      </div>

                      <p className="text-xs text-slate-500 mt-0.5 truncate">
                        {hotel.city?.name || cityName}
                        {hotel.address ? ` • ${hotel.address}` : ""}
                        {matchedRoom?.name ? ` • Room: ${matchedRoom.name}` : ""}
                      </p>
                    </div>

                    {/* Price & Select Button */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="text-right">
                        <div className="text-sm font-bold text-slate-900">
                          {calculatedPrice > 0 ? `₹${calculatedPrice.toLocaleString("en-IN")}` : "On Request"}
                          <span className="text-[11px] font-normal text-slate-400">/n</span>
                        </div>
                        {calculatedPrice > 0 && stayNights > 1 && (
                          <p className="text-[10px] text-slate-400">
                            Total: ₹{stayTotal.toLocaleString("en-IN")}
                          </p>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          if (typeof onSelectHotel === "function") {
                            onSelectHotel({
                              hotel,
                              room: matchedRoom,
                              mealPlan: activeMealPlan,
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

                  {/* All meal rates for this hotel as sleek mini pills */}
                  {matchedRoom?.meals && Object.keys(matchedRoom.meals).length > 1 && (
                    <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-slate-100">
                      <span className="text-[10.5px] text-slate-400 font-medium mr-1">All Plans:</span>
                      {Object.entries(matchedRoom.meals).map(([plan, rate]) => {
                        if (rate <= 0) return null;
                        const isCur = activeMealPlan === plan;
                        return (
                          <button
                            key={plan}
                            type="button"
                            onClick={() => {
                              if (typeof onSelectHotel === "function") {
                                onSelectHotel({
                                  hotel,
                                  room: matchedRoom,
                                  mealPlan: plan,
                                  rate: Number(rate),
                                  category: hotel.category || activeCategory,
                                });
                              }
                              onClose();
                            }}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition-colors border ${
                              isCur
                                ? "bg-amber-500 text-white border-amber-600 font-bold"
                                : "bg-slate-50 hover:bg-amber-50 text-slate-700 border-slate-200"
                            }`}
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
