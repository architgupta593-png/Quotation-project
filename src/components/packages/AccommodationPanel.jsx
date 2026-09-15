"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  Building2, Star, Loader2, MapPin, Search, Sparkles, BedDouble,
  Table, LayoutGrid, CheckCircle2, ChevronRight, X, Info, IndianRupee,
  Utensils, Calculator, Check, MousePointerClick, Shield
} from "lucide-react";

export const HOTEL_CATEGORIES = [
  "Budget",
  "Deluxe",
  "Deluxe Plus",
  "Premium",
  "Premium Plus",
  "Luxury",
];

export const CATEGORY_THEMES = {
  Budget: {
    name: "Budget",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    headerBg: "bg-emerald-600 text-white",
    cardBorder: "border-emerald-200 hover:border-emerald-400",
    accentText: "text-emerald-700",
    chipBg: "bg-emerald-50 text-emerald-800 border-emerald-200",
    priceBg: "bg-emerald-50 text-emerald-800 border-emerald-200",
    starDefault: "2★ - 3★",
  },
  Deluxe: {
    name: "Deluxe",
    badge: "bg-sky-50 text-sky-700 border-sky-200",
    headerBg: "bg-sky-600 text-white",
    cardBorder: "border-sky-200 hover:border-sky-400",
    accentText: "text-sky-700",
    chipBg: "bg-sky-50 text-sky-800 border-sky-200",
    priceBg: "bg-sky-50 text-sky-800 border-sky-200",
    starDefault: "3★ - 4★",
  },
  "Deluxe Plus": {
    name: "Deluxe Plus",
    badge: "bg-teal-50 text-teal-700 border-teal-200",
    headerBg: "bg-teal-600 text-white",
    cardBorder: "border-teal-200 hover:border-teal-400",
    accentText: "text-teal-700",
    chipBg: "bg-teal-50 text-teal-800 border-teal-200",
    priceBg: "bg-teal-50 text-teal-800 border-teal-200",
    starDefault: "4★",
  },
  Premium: {
    name: "Premium",
    badge: "bg-indigo-50 text-indigo-700 border-indigo-200",
    headerBg: "bg-indigo-600 text-white",
    cardBorder: "border-indigo-200 hover:border-indigo-400",
    accentText: "text-indigo-700",
    chipBg: "bg-indigo-50 text-indigo-800 border-indigo-200",
    priceBg: "bg-indigo-50 text-indigo-800 border-indigo-200",
    starDefault: "4★ - 5★",
  },
  "Premium Plus": {
    name: "Premium Plus",
    badge: "bg-purple-50 text-purple-700 border-purple-200",
    headerBg: "bg-purple-600 text-white",
    cardBorder: "border-purple-200 hover:border-purple-400",
    accentText: "text-purple-700",
    chipBg: "bg-purple-50 text-purple-800 border-purple-200",
    priceBg: "bg-purple-50 text-purple-800 border-purple-200",
    starDefault: "5★",
  },
  Luxury: {
    name: "Luxury",
    badge: "bg-amber-50 text-amber-800 border-amber-200",
    headerBg: "bg-gradient-to-r from-amber-500 to-orange-600 text-white",
    cardBorder: "border-amber-200 hover:border-amber-400",
    accentText: "text-amber-800",
    chipBg: "bg-amber-50 text-amber-900 border-amber-200",
    priceBg: "bg-amber-50 text-amber-900 border-amber-200",
    starDefault: "5★ Luxury",
  },
};

export function getCategoryBadgeClass(category) {
  if (!category) return "bg-slate-100 text-slate-700 border-slate-200";
  const normalized = category.charAt(0).toUpperCase() + category.slice(1);
  return CATEGORY_THEMES[category]?.badge || CATEGORY_THEMES[normalized]?.badge || "bg-slate-100 text-slate-700 border-slate-200";
}

/**
 * Extract all room types & all meal plans (EP, CP, MAP, AP) with their exact rates.
 */
export function getHotelAllPrices(hotel, rooms = []) {
  if (!rooms || rooms.length === 0) {
    return {
      hasPrice: false,
      minPrice: 0,
      roomOptions: [],
    };
  }

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

    (r.seasonalPricing || []).forEach((season) => {
      (season.meals || []).forEach((m) => {
        if (m.plan && Number(m.price) > 0) {
          mealPrices[m.plan] = Number(m.price);
        }
      });
    });

    const validPrices = Object.values(mealPrices).filter((p) => p > 0);
    const roomMin = validPrices.length > 0 ? Math.min(...validPrices) : (r.basePrice || 0);

    if (roomMin > 0 && roomMin < overallMinPrice) {
      overallMinPrice = roomMin;
    }

    roomOptions.push({
      id: r._id,
      name: r.roomType || "Standard Room",
      minPrice: roomMin,
      meals: mealPrices,
    });
  });

  const finalMin = overallMinPrice === Infinity ? (rooms[0]?.basePrice || 0) : overallMinPrice;

  return {
    hasPrice: finalMin > 0,
    minPrice: finalMin,
    roomOptions,
  };
}

/**
 * AccommodationPanel — Shows All Hotel Prices, Room Types, Meal Plans (EP, CP, MAP, AP),
 * Live Interactive Rate Calculator, while preserving Price-Neutral database saving.
 */
export default function AccommodationPanel({
  destinations = [],
  accommodationOptions = [],
  selectedCategory,
  onSelectOptionIndex,
  onChange,
}) {
  const [viewMode, setViewMode] = useState("matrix"); // "matrix" | "tabs"
  const [selectedCategoryTab, setSelectedCategoryTab] = useState(selectedCategory || "Deluxe Plus");
  const [searchQuery, setSearchQuery] = useState("");
  const [hotelsMap, setHotelsMap] = useState({});
  const [roomsMap, setRoomsMap] = useState({});
  const fetchedHotelIdsRef = useRef(new Set());
  const [loadingHotels, setLoadingHotels] = useState({});
  const [loadingRooms, setLoadingRooms] = useState({});

  // Active selections for live calculation (per category, per destination leg)
  const [liveSelections, setLiveSelections] = useState({});

  // Sync with prop if selectedCategory changes externally
  useEffect(() => {
    if (selectedCategory && selectedCategory !== selectedCategoryTab) {
      setSelectedCategoryTab(selectedCategory);
    }
  }, [selectedCategory]);

  // ── Build Stay Legs from destinations ──
  let nightCounter = 1;
  const stayLegs = useMemo(() => {
    return destinations.map((dest, legIdx) => {
      const nightsCount = Math.max(1, parseInt(dest.nights, 10) || 1);
      const startNight = nightCounter;
      const endNight = startNight + nightsCount - 1;
      const nightNumbers = Array.from({ length: nightsCount }, (_, i) => startNight + i);
      nightCounter = endNight + 1;

      return {
        legIdx,
        cityId: dest.cityId,
        cityName: dest.cityName || "Destination",
        nightsCount,
        startNight,
        endNight,
        nightNumbers,
      };
    });
  }, [destinations]);

  // Fetch hotels for each destination city
  const fetchHotels = useCallback(async (cityId) => {
    if (!cityId || hotelsMap[cityId]) return;
    setLoadingHotels((prev) => ({ ...prev, [cityId]: true }));
    try {
      const res = await fetch(`/api/accommodation/hotels?cityId=${cityId}`);
      const data = await res.json();
      setHotelsMap((prev) => ({ ...prev, [cityId]: data.hotels || [] }));
    } catch (err) {
      console.error("Failed to fetch hotels:", err);
    } finally {
      setLoadingHotels((prev) => ({ ...prev, [cityId]: false }));
    }
  }, [hotelsMap]);

  // Fetch rooms for all loaded hotels
  const fetchRooms = useCallback(async (hotelId) => {
    if (!hotelId || fetchedHotelIdsRef.current.has(hotelId)) return;
    fetchedHotelIdsRef.current.add(hotelId);
    setLoadingRooms((prev) => ({ ...prev, [hotelId]: true }));
    try {
      const res = await fetch(`/api/accommodation/rooms?hotelId=${hotelId}`);
      const data = await res.json();
      setRoomsMap((prev) => ({ ...prev, [hotelId]: data.rooms || [] }));
    } catch (err) {
      console.error("Failed to fetch rooms:", err);
      fetchedHotelIdsRef.current.delete(hotelId);
    } finally {
      setLoadingRooms((prev) => ({ ...prev, [hotelId]: false }));
    }
  }, []);

  useEffect(() => {
    destinations.forEach((d) => {
      if (d.cityId) fetchHotels(d.cityId);
    });
  }, [destinations, fetchHotels]);

  // Once hotels are fetched, fetch their rooms
  useEffect(() => {
    Object.values(hotelsMap).forEach((hotelList) => {
      (hotelList || []).forEach((h) => {
        if (h._id && !fetchedHotelIdsRef.current.has(h._id)) {
          fetchRooms(h._id);
        }
      });
    });
  }, [hotelsMap, fetchRooms]);

  // Synchronize category options to parent form state with live calculation rates
  useEffect(() => {
    if (destinations.length === 0) return;

    const categoryOptions = HOTEL_CATEGORIES.map((catName) => {
      const nights = [];

      stayLegs.forEach((leg) => {
        const cityHotels = hotelsMap[leg.cityId] || [];
        const matchingHotels = cityHotels.filter(
          (h) => h.category && h.category.toLowerCase() === catName.toLowerCase()
        );

        // Check if user already had a selected hotel for this category and leg
        const existingOpt = accommodationOptions.find(
          (o) => o.category?.toLowerCase() === catName.toLowerCase() || o.label === `${catName} Tier`
        );
        const existingNight = existingOpt?.nights?.find((n) => n.night === leg.startNight || leg.nightNumbers.includes(n.night));
        const activeHotelId = existingNight?.hotelId;
        const selectedHotel = matchingHotels.find((h) => h._id === activeHotelId) || matchingHotels[0] || cityHotels[0];

        const hotelRooms = selectedHotel ? (roomsMap[selectedHotel._id] || []) : [];
        const pricing = selectedHotel ? getHotelAllPrices(selectedHotel, hotelRooms) : null;
        
        // Match existing selected room if any, else default room
        const activeRoomId = existingNight?.roomId;
        const selectedRoom = (pricing?.roomOptions || []).find((r) => r.id === activeRoomId) || pricing?.roomOptions?.[0];
        
        // Match existing meal plan if any, else default plan
        const activeMealPlan = existingNight?.mealPlan || "CP";
        const roomMealPrices = selectedRoom?.meals || {};
        let selectedRate = Number(existingNight?.pricePerNight) || 0;
        
        if (selectedRate === 0 && selectedRoom) {
          selectedRate = roomMealPrices[activeMealPlan] || selectedRoom.minPrice || pricing?.minPrice || 0;
        }

        leg.nightNumbers.forEach((nightNum) => {
          nights.push({
            night: nightNum,
            cityId: leg.cityId,
            cityName: leg.cityName,
            hotelId: selectedHotel ? selectedHotel._id : null,
            hotelName: selectedHotel ? selectedHotel.name : `${catName} Hotel`,
            category: catName,
            roomId: selectedRoom?.id || hotelRooms[0]?._id || null,
            roomType: selectedRoom?.name || hotelRooms[0]?.roomType || "Standard Room",
            mealPlan: activeMealPlan,
            starRating: selectedHotel ? selectedHotel.starRating : null,
            pricePerNight: selectedRate, // Live preview rate
            notes: `${catName} Category stay in ${leg.cityName}`,
          });
        });
      });

      const optTotal = nights.reduce((s, n) => s + (n.pricePerNight || 0), 0);

      return {
        label: `${catName} Tier`,
        category: catName,
        nights,
        totalPrice: optTotal,
        marginType: "absolute",
        margin: 0,
      };
    });

    if (typeof onChange === "function") {
      const merged = categoryOptions.map((newOpt) => {
        const existing = accommodationOptions.find(
          (o) => o.category?.toLowerCase() === newOpt.category.toLowerCase() || o.label === newOpt.label
        );
        if (existing && existing.nights && existing.nights.length === newOpt.nights.length) {
          return {
            ...newOpt,
            margin: existing.margin ?? newOpt.margin,
            marginType: existing.marginType ?? newOpt.marginType,
          };
        }
        return newOpt;
      });

      const isDiff = JSON.stringify(merged) !== JSON.stringify(accommodationOptions);
      if (isDiff) {
        onChange(merged);
      }
    }
  }, [destinations, stayLegs, hotelsMap, roomsMap]);

  // Handle switching category tab & notify parent Live Preview
  const handleSelectCategory = useCallback(
    (cat) => {
      setSelectedCategoryTab(cat);
      const catIdx = HOTEL_CATEGORIES.findIndex((c) => c.toLowerCase() === cat.toLowerCase());
      if (catIdx !== -1 && typeof onSelectOptionIndex === "function") {
        onSelectOptionIndex(catIdx);
      }
    },
    [onSelectOptionIndex]
  );

  // Group hotels by category and destination
  const hotelsData = useMemo(() => {
    const data = {};
    HOTEL_CATEGORIES.forEach((cat) => {
      data[cat] = {};
      stayLegs.forEach((leg) => {
        const cityHotels = hotelsMap[leg.cityId] || [];
        const filtered = cityHotels.filter((h) => {
          const matchCat = h.category && h.category.toLowerCase() === cat.toLowerCase();
          const matchSearch =
            !searchQuery.trim() ||
            h.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            h.address?.toLowerCase().includes(searchQuery.toLowerCase());
          return matchCat && matchSearch;
        });
        data[cat][leg.cityName] = {
          leg,
          hotels: filtered,
        };
      });
    });
    return data;
  }, [hotelsMap, stayLegs, searchQuery]);

  // Handle user clicking on a hotel / room / meal plan to live calculate prices
  const handleSelectHotelForLiveCalc = (cat, leg, hotel, room, mealPlan, rate) => {
    const key = `${cat}_${leg.legIdx}`;
    const selectedRate = Number(rate) || 0;
    const rId = room?.id || room?._id || null;
    const rType = room?.name || "Standard Room";
    const mPlan = mealPlan || "CP";

    // Switch active category tab and notify parent Live Preview
    handleSelectCategory(cat);

    const catIdx = HOTEL_CATEGORIES.findIndex((c) => c.toLowerCase() === cat.toLowerCase());

    setLiveSelections((prev) => ({
      ...prev,
      [key]: {
        cat,
        cityName: leg.cityName,
        nightsCount: leg.nightsCount,
        hotelId: hotel._id,
        hotelName: hotel.name,
        roomId: rId,
        roomType: rType,
        mealPlan: mPlan,
        pricePerNight: selectedRate,
        legTotal: selectedRate * leg.nightsCount,
      },
    }));

    // Update parent accommodation options in client state for Live Preview
    if (typeof onChange === "function") {
      const baseOptions = (Array.isArray(accommodationOptions) && accommodationOptions.length > 0)
        ? accommodationOptions
        : HOTEL_CATEGORIES.map((catName) => ({
            label: `${catName} Tier`,
            category: catName,
            nights: [],
            totalPrice: 0,
            marginType: "absolute",
            margin: 0,
          }));

      const updatedOptions = baseOptions.map((opt, idx) => {
        if (
          opt.category?.toLowerCase() === cat.toLowerCase() ||
          opt.label?.toLowerCase().includes(cat.toLowerCase()) ||
          idx === catIdx
        ) {
          let updatedNights = Array.isArray(opt.nights) && opt.nights.length > 0 ? [...opt.nights] : [];
          
          stayLegs.forEach((l) => {
            l.nightNumbers.forEach((nightNum) => {
              const nightIdx = updatedNights.findIndex((n) => n.night === nightNum);
              const isThisLeg = l.legIdx === leg.legIdx;

              if (nightIdx !== -1) {
                if (isThisLeg) {
                  updatedNights[nightIdx] = {
                    ...updatedNights[nightIdx],
                    hotelId: hotel._id,
                    hotelName: hotel.name,
                    roomId: rId,
                    roomType: rType,
                    mealPlan: mPlan,
                    starRating: hotel.starRating || null,
                    pricePerNight: selectedRate,
                  };
                }
              } else {
                updatedNights.push({
                  night: nightNum,
                  cityId: l.cityId,
                  cityName: l.cityName,
                  hotelId: isThisLeg ? hotel._id : null,
                  hotelName: isThisLeg ? hotel.name : `${cat} Hotel`,
                  category: cat,
                  roomId: isThisLeg ? rId : null,
                  roomType: isThisLeg ? rType : "Standard Room",
                  mealPlan: isThisLeg ? mPlan : "CP",
                  starRating: isThisLeg ? (hotel.starRating || null) : null,
                  pricePerNight: isThisLeg ? selectedRate : 0,
                  notes: `${cat} Category stay in ${l.cityName}`,
                });
              }
            });
          });

          const optTotal = updatedNights.reduce((s, n) => s + (Number(n.pricePerNight) || 0), 0);
          return {
            ...opt,
            category: cat,
            nights: updatedNights,
            totalPrice: optTotal,
          };
        }
        return opt;
      });
      onChange(updatedOptions);
    }
  };

  // Calculate live stay total for the active category
  const activeCategoryLiveTotal = useMemo(() => {
    let total = 0;
    stayLegs.forEach((leg) => {
      const key = `${selectedCategoryTab}_${leg.legIdx}`;
      const selection = liveSelections[key];
      if (selection) {
        total += selection.legTotal;
      } else {
        const cityHotels = hotelsData[selectedCategoryTab]?.[leg.cityName]?.hotels || [];
        if (cityHotels.length > 0) {
          const first = cityHotels[0];
          const rooms = roomsMap[first._id] || [];
          const pricing = getHotelAllPrices(first, rooms);
          total += (pricing.minPrice || 0) * leg.nightsCount;
        }
      }
    });
    return total;
  }, [selectedCategoryTab, stayLegs, liveSelections, hotelsData, roomsMap]);

  // Category stats for headers (respects liveSelections when chosen)
  const categoryStats = useMemo(() => {
    const stats = {};
    HOTEL_CATEGORIES.forEach((cat) => {
      let hotelCount = 0;
      let estTotalCost = 0;

      stayLegs.forEach((leg) => {
        const cityHotels = hotelsMap[leg.cityId] || [];
        const match = cityHotels.filter(
          (h) => h.category && h.category.toLowerCase() === cat.toLowerCase()
        );
        hotelCount += match.length;

        const key = `${cat}_${leg.legIdx}`;
        const selection = liveSelections[key];
        if (selection) {
          estTotalCost += selection.legTotal;
        } else if (match.length > 0) {
          const first = match[0];
          const rooms = roomsMap[first._id] || [];
          const pricing = getHotelAllPrices(first, rooms);
          estTotalCost += (pricing.minPrice || 0) * leg.nightsCount;
        }
      });

      stats[cat] = { hotelCount, estTotalCost };
    });
    return stats;
  }, [hotelsMap, roomsMap, stayLegs, liveSelections]);

  if (destinations.length === 0 || !destinations.some((d) => d.cityId)) {
    return (
      <div className="rounded-3xl border border-amber-200 bg-amber-50/70 p-8 text-center shadow-xs">
        <Building2 className="w-9 h-9 text-amber-600 mx-auto mb-2" />
        <p className="text-[16px] text-amber-950 font-black">
          No Route Destinations Added
        </p>
        <p className="text-[13px] text-amber-700 mt-1 max-w-md mx-auto font-medium">
          Please add destination cities in the <strong>Basics</strong> step first. Registered hotels will automatically organize across all hotel category tiers with all prices.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* ── Top Bar: Route Summary, Search & View Switcher ── */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-pulse" />
            <h3 className="text-[16px] font-black text-slate-900">
              Accommodation All Hotel Rates
            </h3>
            <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-600" />
              All Meal Prices (EP / CP / MAP / AP)
            </span>
          </div>
          <p className="text-[12px] text-slate-500 font-medium flex items-center gap-1.5 flex-wrap">
            <MapPin className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />
            {stayLegs.map((l) => `${l.cityName} (${l.nightsCount}N)`).join(" → ")}
            <span className="text-slate-400">• Click any hotel or meal plan to live calculate rates</span>
          </p>
        </div>

        {/* Controls: Search + View Switcher */}
        <div className="flex items-center gap-2.5 w-full md:w-auto flex-wrap sm:flex-nowrap">
          <div className="relative flex-1 sm:w-60">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search hotel name or meal…"
              className="w-full pl-9 pr-8 py-2 rounded-2xl border border-slate-200 bg-slate-50 text-[12.5px] font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:bg-white transition-all shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200/80">
            <button
              type="button"
              onClick={() => setViewMode("matrix")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-extrabold transition-all ${
                viewMode === "matrix"
                  ? "bg-white text-indigo-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>Matrix Table</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("tabs")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-extrabold transition-all ${
                viewMode === "tabs"
                  ? "bg-white text-indigo-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Category Tabs</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Live Calculator Banner ── */}
      <div className="p-4 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-indigo-900/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[14.5px] font-black text-white">
                Live Hotel Accommodation Calculator
              </span>
              <span className="text-[10.5px] font-bold text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded-full border border-indigo-500/30">
                {selectedCategoryTab} Tier
              </span>
            </div>
            <p className="text-[11.5px] text-slate-300 font-medium mt-0.5">
              Click any hotel or meal plan (EP, CP, MAP, AP) to live calculate stay cost. <em>(Rates calculated dynamically & not saved in DB)</em>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto bg-white/10 px-4 py-2 rounded-2xl border border-white/15 backdrop-blur-xs">
          <div className="text-right">
            <p className="text-[9.5px] font-bold text-indigo-200 uppercase tracking-wider">Live Est. Accommodation Total</p>
            <p className="text-[18px] font-black text-emerald-400">
              {activeCategoryLiveTotal > 0 ? `₹${activeCategoryLiveTotal.toLocaleString("en-IN")}` : "₹0"}
            </p>
          </div>
        </div>
      </div>

      {/* ── Category Tier Quick Tabs ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {HOTEL_CATEGORIES.map((cat) => {
          const theme = CATEGORY_THEMES[cat] || CATEGORY_THEMES.Deluxe;
          const stat = categoryStats[cat] || { hotelCount: 0, estTotalCost: 0 };
          const isSelectedTab = selectedCategoryTab === cat;

          return (
            <div
              key={cat}
              onClick={() => handleSelectCategory(cat)}
              className={`p-3.5 rounded-2xl border bg-white cursor-pointer transition-all ${
                isSelectedTab
                  ? "ring-2 ring-indigo-600 border-indigo-600 shadow-sm scale-102"
                  : "border-slate-200/80 hover:border-indigo-300 shadow-2xs"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${theme.badge}`}>
                  {cat}
                </span>
                <span className="text-[10.5px] font-bold text-slate-400">
                  {stat.hotelCount} {stat.hotelCount === 1 ? "Hotel" : "Hotels"}
                </span>
              </div>

              <div className="mt-2.5">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Est. Stay Total</p>
                <p className="text-[14px] font-black text-slate-900">
                  {stat.estTotalCost > 0 ? `₹${stat.estTotalCost.toLocaleString("en-IN")}` : "—"}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* ── VIEW 1: MATRIX TABLE VIEW (All Prices & Click to Calculate) ── */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      {viewMode === "matrix" && (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Table className="w-4 h-4 text-indigo-400" />
              <h4 className="text-[14px] font-black text-white">
                Destination Hotels Matrix & All Meal Prices (EP / CP / MAP / AP)
              </h4>
            </div>
            <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
              <MousePointerClick className="w-3.5 h-3.5 text-amber-300" /> Click any meal rate to live calculate
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1050px]">
              <thead>
                <tr className="bg-slate-50/90 border-b border-slate-200 text-[12px] font-black text-slate-700 uppercase tracking-wider">
                  <th className="p-4 w-44 border-r border-slate-200/80">
                    Destination City
                  </th>
                  {HOTEL_CATEGORIES.map((cat) => {
                    const theme = CATEGORY_THEMES[cat];
                    return (
                      <th key={cat} className="p-3.5 border-r border-slate-200/80 last:border-0 text-center">
                        <div className="flex flex-col items-center gap-0.5">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-black border ${theme.badge}`}>
                            {cat}
                          </span>
                          <span className="text-[9.5px] text-slate-400 font-semibold normal-case">
                            {categoryStats[cat]?.hotelCount || 0} Hotels
                          </span>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 text-[12.5px]">
                {stayLegs.map((leg) => {
                  return (
                    <tr key={leg.legIdx} className="hover:bg-slate-50/40 transition-colors">
                      {/* Destination Column */}
                      <td className="p-4 bg-slate-50/50 border-r border-slate-200/80 align-top">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="w-6 h-6 rounded-lg bg-slate-900 text-white text-[11px] font-black flex items-center justify-center">
                              {leg.nightsCount}N
                            </span>
                            <span className="text-[14px] font-black text-slate-900">
                              {leg.cityName}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 font-semibold">
                            Nights {leg.startNight}–{leg.endNight}
                          </p>
                        </div>
                      </td>

                      {/* Hotel Category Cells with All Meal Prices */}
                      {HOTEL_CATEGORIES.map((cat) => {
                        const cityHotels = hotelsData[cat]?.[leg.cityName]?.hotels || [];
                        const isLoading = loadingHotels[leg.cityId];
                        const activeKey = `${cat}_${leg.legIdx}`;
                        const currentLiveSel = liveSelections[activeKey];

                        return (
                          <td
                            key={cat}
                            className="p-2.5 border-r border-slate-200/80 last:border-0 align-top bg-white"
                          >
                            {isLoading ? (
                              <div className="flex items-center justify-center p-3 text-slate-400">
                                <Loader2 className="w-4 h-4 animate-spin" />
                              </div>
                            ) : cityHotels.length === 0 ? (
                              <div className="p-3 text-center text-[10.5px] text-slate-400 italic bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                                No {cat} hotel
                              </div>
                            ) : (
                              <div className="space-y-2.5">
                                {cityHotels.map((hotel) => {
                                  const rooms = roomsMap[hotel._id] || [];
                                  const pricing = getHotelAllPrices(hotel, rooms);
                                  const isHotelSelected = currentLiveSel?.hotelId === hotel._id;

                                  return (
                                    <div
                                      key={hotel._id}
                                      onClick={() => {
                                        const defaultRoom = pricing.roomOptions[0];
                                        const defaultPlan = Object.entries(defaultRoom?.meals || {}).find(([_, p]) => p > 0)?.[0] || "CP";
                                        const rate = defaultRoom?.meals?.[defaultPlan] || defaultRoom?.minPrice || pricing.minPrice || 0;
                                        handleSelectHotelForLiveCalc(cat, leg, hotel, defaultRoom, defaultPlan, rate);
                                      }}
                                      className={`p-2.5 rounded-xl border transition-all cursor-pointer space-y-2 ${
                                        isHotelSelected
                                          ? "border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/40 shadow-xs"
                                          : "border-slate-200/90 bg-white hover:border-indigo-300 hover:shadow-xs"
                                      }`}
                                    >
                                      {/* Hotel Name & Stars */}
                                      <div className="flex items-start justify-between gap-1">
                                        <h5 className="font-extrabold text-[12px] text-slate-900 leading-tight line-clamp-1">
                                          {hotel.name}
                                        </h5>
                                        {hotel.starRating && (
                                          <span className="flex items-center text-amber-700 text-[9px] font-bold bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200 flex-shrink-0">
                                            {hotel.starRating}★
                                          </span>
                                        )}
                                      </div>

                                      {/* All Meal Prices Display (EP, CP, MAP, AP) */}
                                      {pricing.roomOptions.length > 0 && (
                                        <div className="space-y-1.5">
                                          {pricing.roomOptions.map((r) => (
                                            <div key={r.id} className="space-y-1">
                                              <p className="text-[10px] font-bold text-slate-500 truncate">
                                                🛏️ {r.name}
                                              </p>
                                              <div className="grid grid-cols-2 gap-1 text-[10px]">
                                                {Object.entries(r.meals).map(([plan, p]) => {
                                                  if (p <= 0) return null;
                                                  // Exact match on hotelId, roomId, and mealPlan so only 1 price is active per leg
                                                  const isPlanActive = isHotelSelected && currentLiveSel?.roomId === r.id && currentLiveSel?.mealPlan === plan;
                                                  return (
                                                    <button
                                                      key={plan}
                                                      type="button"
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleSelectHotelForLiveCalc(cat, leg, hotel, r, plan, p);
                                                      }}
                                                      className={`px-1.5 py-1 rounded-md text-left transition-all border ${
                                                        isPlanActive
                                                          ? "bg-indigo-600 text-white border-indigo-600 font-black shadow-2xs scale-102"
                                                          : "bg-slate-50 hover:bg-emerald-50 text-slate-700 border-slate-200 hover:border-emerald-300"
                                                      }`}
                                                    >
                                                      <span className="font-bold text-[9px] opacity-80">{plan}:</span>{" "}
                                                      <span className="font-black">₹{p.toLocaleString("en-IN")}</span>
                                                    </button>
                                                  );
                                                })}
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      )}

                                      {/* Live Calculated Stay Total */}
                                      {isHotelSelected && currentLiveSel && (
                                        <div className="p-1.5 rounded-lg bg-emerald-100/70 border border-emerald-300 text-emerald-950 flex items-center justify-between text-[10.5px]">
                                          <span className="font-bold text-emerald-800">{leg.nightsCount}N ({currentLiveSel.mealPlan}):</span>
                                          <span className="font-black text-emerald-900">
                                            ₹{currentLiveSel.legTotal.toLocaleString("en-IN")}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* ── VIEW 2: CATEGORY TABS VIEW (All Prices & Click to Calculate) ── */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      {viewMode === "tabs" && (
        <div className="space-y-4">
          {/* Category Tabs Header */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {HOTEL_CATEGORIES.map((cat) => {
              const theme = CATEGORY_THEMES[cat];
              const isSelected = selectedCategoryTab === cat;
              const count = categoryStats[cat]?.hotelCount || 0;

              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => handleSelectCategory(cat)}
                  className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl text-[13px] font-extrabold border transition-all whitespace-nowrap shadow-2xs ${
                    isSelected
                      ? `${theme.headerBg} border-transparent shadow-sm scale-102`
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span>{cat}</span>
                  <span
                    className={`text-[10.5px] font-black px-2 py-0.5 rounded-full ${
                      isSelected ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {count} {count === 1 ? "Hotel" : "Hotels"}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Active Category Content */}
          {(() => {
            const cat = selectedCategoryTab;
            const theme = CATEGORY_THEMES[cat];
            const cityGroups = hotelsData[cat] || {};

            return (
              <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
                  <div>
                    <h4 className="text-[17px] font-black text-slate-900">
                      {cat} Hotel Options & All Meal Prices (EP / CP / MAP / AP)
                    </h4>
                    <p className="text-[12px] text-slate-500 font-medium">
                      Click any meal plan to calculate real-time stay price for {cat} tier.
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[11px] font-black border ${theme.badge}`}>
                    {cat} Category
                  </span>
                </div>

                {/* Cities Grid */}
                <div className="space-y-6">
                  {stayLegs.map((leg) => {
                    const cityHotels = cityGroups[leg.cityName]?.hotels || [];
                    const isLoading = loadingHotels[leg.cityId];
                    const activeKey = `${cat}_${leg.legIdx}`;
                    const currentLiveSel = liveSelections[activeKey];

                    return (
                      <div key={leg.legIdx} className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <span className="w-7 h-7 rounded-xl bg-slate-900 text-white text-[11px] font-black flex items-center justify-center">
                              {leg.nightsCount}N
                            </span>
                            <h5 className="text-[15px] font-black text-slate-900">
                              {leg.cityName}
                            </h5>
                            <span className="text-[11.5px] font-semibold text-slate-500">
                              (Nights {leg.startNight}–{leg.endNight})
                            </span>
                          </div>

                          {currentLiveSel && (
                            <span className="text-[11.5px] font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
                              Selected: {currentLiveSel.hotelName} ({currentLiveSel.roomType} • {currentLiveSel.mealPlan}) • ₹{currentLiveSel.legTotal.toLocaleString("en-IN")}
                            </span>
                          )}
                        </div>

                        {isLoading ? (
                          <div className="p-6 text-center text-slate-400">
                            <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                          </div>
                        ) : cityHotels.length === 0 ? (
                          <div className="p-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-[12px] text-slate-500 text-center">
                            No {cat} hotels registered in {leg.cityName}
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {cityHotels.map((hotel) => {
                              const rooms = roomsMap[hotel._id] || [];
                              const pricing = getHotelAllPrices(hotel, rooms);
                              const cover = hotel.images?.[0]?.url;
                              const isHotelSelected = currentLiveSel?.hotelId === hotel._id;

                              return (
                                <div
                                  key={hotel._id}
                                  onClick={() => {
                                    const defaultRoom = pricing.roomOptions[0];
                                    const defaultPlan = Object.entries(defaultRoom?.meals || {}).find(([_, p]) => p > 0)?.[0] || "CP";
                                    const rate = defaultRoom?.meals?.[defaultPlan] || defaultRoom?.minPrice || pricing.minPrice || 0;
                                    handleSelectHotelForLiveCalc(cat, leg, hotel, defaultRoom, defaultPlan, rate);
                                  }}
                                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-3.5 shadow-2xs ${
                                    isHotelSelected
                                      ? "border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/30 shadow-xs"
                                      : "border-slate-200/90 bg-white hover:border-indigo-400 hover:shadow-md"
                                  }`}
                                >
                                  <div className="space-y-3">
                                    {/* Thumbnail & Title */}
                                    <div className="flex items-start gap-3.5">
                                      {cover ? (
                                        <img
                                          src={cover}
                                          alt={hotel.name}
                                          className="w-16 h-16 rounded-xl object-cover border border-slate-200 flex-shrink-0"
                                        />
                                      ) : (
                                        <div className="w-16 h-16 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0 border border-indigo-100">
                                          <Building2 className="w-7 h-7" />
                                        </div>
                                      )}

                                      <div className="min-w-0 flex-1 space-y-1">
                                        <div className="flex items-start justify-between gap-1">
                                          <h6 className="text-[13.5px] font-black text-slate-900 leading-snug truncate">
                                            {hotel.name}
                                          </h6>
                                          {hotel.starRating && (
                                            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200 flex-shrink-0">
                                              {hotel.starRating}★
                                            </span>
                                          )}
                                        </div>

                                        {hotel.address && (
                                          <p className="text-[11px] text-slate-500 truncate">
                                            📍 {hotel.address}
                                          </p>
                                        )}
                                      </div>
                                    </div>

                                    {/* All Room Meal Options (EP, CP, MAP, AP) */}
                                    {pricing.roomOptions.length > 0 && (
                                      <div className="space-y-2 pt-2 border-t border-slate-100">
                                        {pricing.roomOptions.map((r) => (
                                          <div key={r.id} className="space-y-1.5 bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
                                            <div className="flex items-center justify-between text-[11px] font-extrabold text-slate-800">
                                              <span>🛏️ {r.name}</span>
                                            </div>

                                            {/* Meal Plan Price Pills */}
                                            <div className="grid grid-cols-2 gap-1.5 text-[10.5px]">
                                              {Object.entries(r.meals).map(([plan, p]) => {
                                                if (p <= 0) return null;
                                                // Exact match on hotelId, roomId, and mealPlan so only 1 price is active
                                                const isPlanActive = isHotelSelected && currentLiveSel?.roomId === r.id && currentLiveSel?.mealPlan === plan;
                                                return (
                                                  <button
                                                    key={plan}
                                                    type="button"
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      handleSelectHotelForLiveCalc(cat, leg, hotel, r, plan, p);
                                                    }}
                                                    className={`px-2 py-1.5 rounded-lg text-left transition-all border ${
                                                      isPlanActive
                                                        ? "bg-indigo-600 text-white border-indigo-600 font-black shadow-xs scale-102"
                                                        : "bg-white hover:bg-emerald-50 text-slate-700 border-slate-200 hover:border-emerald-300"
                                                    }`}
                                                  >
                                                    <span className="font-bold text-[9.5px] opacity-80">{plan}:</span>{" "}
                                                    <span className="font-black">₹{p.toLocaleString("en-IN")}</span>
                                                  </button>
                                                );
                                              })}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>

                                  {/* Calculation footer */}
                                  {isHotelSelected && currentLiveSel && (
                                    <div className="p-2.5 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 flex items-center justify-between text-[11.5px] text-emerald-950">
                                      <div>
                                        <p className="text-[9.5px] font-bold text-emerald-700 uppercase">Live {leg.nightsCount}N ({currentLiveSel.mealPlan})</p>
                                        <p className="text-[14px] font-black text-emerald-900">
                                          ₹{currentLiveSel.legTotal.toLocaleString("en-IN")}
                                        </p>
                                      </div>
                                      <span className="text-[10px] font-extrabold text-emerald-700 bg-white px-2 py-0.5 rounded-md border border-emerald-200">
                                        Active in Live Total
                                      </span>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
