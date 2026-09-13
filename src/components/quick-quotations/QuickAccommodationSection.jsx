"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Building2, Star, Plus, Trash2, MapPin, Hotel,
  Search, Sparkles, CheckCircle2, AlertCircle, Copy
} from "lucide-react";
import {
  HOTEL_CATEGORIES,
  CATEGORY_THEMES,
  getCategoryBadgeClass,
  getHotelAllPrices,
} from "@/components/packages/AccommodationPanel";
import HotelMealSelectionDialog, { getHotelAllPricesForDate } from "./HotelMealSelectionDialog";

const MEAL_PLANS = [
  { id: "EP", label: "EP", title: "Room Only", sub: "No Meals (Breakfast Deducted)" },
  { id: "CP", label: "CP", title: "Bed & Breakfast", sub: "Standard Breakfast Included" },
  { id: "MAP", label: "MAP", title: "Half Board", sub: "Breakfast + Dinner Included" },
  { id: "AP", label: "AP", title: "Full Board", sub: "All Meals (B+L+D) Included" },
];

/**
 * Calculate relative price difference for a meal plan (Base ₹0, +₹1,000/n, etc.)
 */
function getMealDiff(planId, starRating = 3, mealPrices = null) {
  const planInfo = MEAL_PLANS.find((p) => p.id === planId) || { title: planId, label: planId };

  // 1. Exact meal prices from room / catalog rates
  if (mealPrices && typeof mealPrices === "object" && Object.keys(mealPrices).length > 0) {
    const basePlanKey = mealPrices["CP"] !== undefined && Number(mealPrices["CP"]) > 0
      ? "CP"
      : Object.keys(mealPrices)[0];

    const baseVal = Number(mealPrices[basePlanKey] || 0);
    const thisVal = mealPrices[planId] !== undefined ? Number(mealPrices[planId]) : baseVal;
    const diff = thisVal - baseVal;

    let diffLabel = "Base (₹0)";
    if (diff > 0) diffLabel = `+₹${diff.toLocaleString("en-IN")}/n`;
    else if (diff < 0) diffLabel = `-₹${Math.abs(diff).toLocaleString("en-IN")}/n`;

    return {
      diff,
      diffLabel,
      price: thisVal,
      name: planInfo.title,
    };
  }

  // 2. Standard fallback differences by star rating
  const diffMap = {
    EP: -400,
    CP: 0,
    MAP: starRating >= 5 ? 800 : 600,
    AP: starRating >= 5 ? 1600 : 1200,
  };

  const diff = diffMap[planId] !== undefined ? diffMap[planId] : 0;
  let diffLabel = "Base (₹0)";
  if (diff > 0) diffLabel = `+₹${diff.toLocaleString("en-IN")}/n`;
  else if (diff < 0) diffLabel = `-₹${Math.abs(diff).toLocaleString("en-IN")}/n`;

  const basePrice = starRating >= 5 ? 6500 : starRating === 4 ? 4500 : 3000;

  return {
    diff,
    diffLabel,
    price: Math.max(0, basePrice + diff),
    name: planInfo.title,
  };
}

const ROOM_PRESETS = [
  "Deluxe Room",
  "Super Deluxe Room",
  "Executive Suite",
  "Luxury Villa",
];

/**
 * Group sequential raw stays by cityName if legacy single-night array was provided
 */
function normalizeStays(rawStays, defaultDest, defaultNights) {
  const fallback = [
    {
      cityName: defaultDest || "",
      nights: Math.max(1, defaultNights || 1),
      hotelId: null,
      hotelName: "",
      category: "Deluxe",
      roomId: null,
      starRating: 3,
      roomType: "Deluxe AC Room",
      mealPlan: "CP",
      pricePerNight: 0,
      notes: "",
    },
  ];

  if (!rawStays || rawStays.length === 0) return fallback;

  const mapStay = (s) => ({
    ...s,
    cityName: s.cityName || defaultDest || "",
    nights: Math.max(1, parseInt(s.nights, 10) || 1),
    hotelId: s.hotelId || null,
    hotelName: s.hotelName || "",
    category: s.category || "Deluxe",
    roomId: s.roomId || null,
    starRating: Math.max(1, Math.min(5, parseInt(s.starRating, 10) || 3)),
    roomType: s.roomType || "Deluxe AC Room",
    mealPlan: (s.mealPlan && ["EP", "CP", "MAP", "AP"].includes(String(s.mealPlan).toUpperCase())) ? String(s.mealPlan).toUpperCase() : "CP",
    availableMealPlans: (s.availableMealPlans && s.availableMealPlans.length > 0) ? s.availableMealPlans : (s.mealPrices ? Object.keys(s.mealPrices) : undefined),
    mealPrices: s.mealPrices || undefined,
    pricePerNight: Number(s.pricePerNight) || 0,
    notes: s.notes || "",
  });

  const hasExplicitNights = rawStays.some((s) => s.nights !== undefined && s.nights > 1);
  if (hasExplicitNights) {
    return rawStays.map(mapStay);
  }

  const grouped = [];
  rawStays.forEach((s) => {
    const city = s.cityName || defaultDest || "";
    const last = grouped[grouped.length - 1];

    if (last && last.cityName && city && last.cityName.toLowerCase() === city.toLowerCase() && (last.hotelName === s.hotelName || !last.hotelName || !s.hotelName)) {
      last.nights += 1;
      if (!last.hotelName && s.hotelName) last.hotelName = s.hotelName;
      if (!last.hotelId && s.hotelId) last.hotelId = s.hotelId;
      if (!last.category && s.category) last.category = s.category;
      if (!last.mealPrices && s.mealPrices) last.mealPrices = s.mealPrices;
      if (!last.availableMealPlans && s.availableMealPlans) last.availableMealPlans = s.availableMealPlans;
    } else {
      grouped.push(mapStay(s));
    }
  });

  return grouped.length > 0 ? grouped : fallback;
}

export default function QuickAccommodationSection({
  accommodationOptions: propOptions = [],
  onOptionsChange,
  hotelStays = [],
  onChange,
  totalNights = 4,
  primaryDestination = "",
  startDate = "",
  totalRooms = 1,
  onPriceAdjustment,
}) {
  const [catalogHotels, setCatalogHotels] = useState([]);
  const [roomsMap, setRoomsMap] = useState({});
  const [loadingHotels, setLoadingHotels] = useState(false);
  const [activeOptIdx, setActiveOptIdx] = useState(0);

  // Dialog State for Meal Plan & Room Category Lowest Price Modal
  const [mealDialogState, setMealDialogState] = useState({
    isOpen: false,
    legIdx: 0,
    cityName: "",
    stayNights: 1,
    category: "Deluxe",
    roomType: "Deluxe AC Room",
    mealPlan: "CP",
  });

  const openHotelMealDialog = (legIdx, mealPlan = "CP", roomType = null, category = null) => {
    const stay = (activeOption.hotelStays && activeOption.hotelStays[legIdx]) || (hotelStays && hotelStays[legIdx]) || {};
    setMealDialogState({
      isOpen: true,
      legIdx,
      cityName: stay.cityName || primaryDestination || "Destination",
      stayNights: stay.nights || 1,
      category: category || stay.category || activeOption.category || "Deluxe",
      roomType: roomType || stay.roomType || "Deluxe AC Room",
      mealPlan: mealPlan || stay.mealPlan || "CP",
    });
  };

  // Initialize or synchronize accommodation options array
  const rawOptions = useMemo(() => {
    if (propOptions && propOptions.length > 0) return propOptions;
    return [
      {
        label: "Deluxe Tier (3★ - 4★)",
        category: "Deluxe",
        hotelStays: hotelStays && hotelStays.length > 0 ? hotelStays : [],
        totalPrice: 0,
      },
    ];
  }, [propOptions, hotelStays]);

  const activeOption = rawOptions[activeOptIdx] || rawOptions[0] || {
    label: "Deluxe Tier (3★ - 4★)",
    category: "Deluxe",
    hotelStays: hotelStays,
    totalPrice: 0,
  };

  // Fetch catalog hotels
  useEffect(() => {
    setLoadingHotels(true);
    fetch(`/api/accommodation/hotels`)
      .then((r) => r.json())
      .then((data) => {
        setCatalogHotels(data.hotels || []);
      })
      .catch((err) => console.error("Failed to load catalog hotels", err))
      .finally(() => setLoadingHotels(false));
  }, []);

  // Fetch rooms for all catalog hotels
  const fetchRooms = useCallback(async (hotelId) => {
    if (!hotelId || roomsMap[hotelId]) return;
    try {
      const res = await fetch(`/api/accommodation/rooms?hotelId=${hotelId}`);
      const data = await res.json();
      setRoomsMap((prev) => ({ ...prev, [hotelId]: data.rooms || [] }));
    } catch (err) {
      console.error("Failed to fetch rooms:", err);
    }
  }, [roomsMap]);

  useEffect(() => {
    catalogHotels.forEach((h) => {
      if (h._id && !roomsMap[h._id]) {
        fetchRooms(h._id);
      }
    });
  }, [catalogHotels, fetchRooms, roomsMap]);

  // Normalized City Stay Legs for the active tier
  const currentStays = useMemo(() => {
    const staysForOption = activeOption.hotelStays && activeOption.hotelStays.length > 0 ? activeOption.hotelStays : hotelStays;
    return normalizeStays(staysForOption, primaryDestination, totalNights);
  }, [activeOption.hotelStays, hotelStays, primaryDestination, totalNights]);

  // Total nights allocated across all city stays
  const allocatedNights = useMemo(() => {
    return currentStays.reduce((acc, s) => acc + (Math.max(1, parseInt(s.nights, 10) || 1)), 0);
  }, [currentStays]);

  // Synchronize when totalRooms changes in parent
  useEffect(() => {
    const roomMultiplier = Math.max(1, parseInt(totalRooms, 10) || 1);
    const totalStayCost = currentStays.reduce(
      (s, st) => s + ((Number(st.pricePerNight) || 0) * (st.nights || 1) * roomMultiplier),
      0
    );
    if (onPriceAdjustment) {
      onPriceAdjustment(totalStayCost, activeOptIdx);
    }
  }, [totalRooms]);

  function syncOptions(updatedActiveStays, updatedOptionsArray = null, optIdx = activeOptIdx) {
    const optionsToUpdate = updatedOptionsArray || [...rawOptions];
    const roomMultiplier = Math.max(1, parseInt(totalRooms, 10) || 1);
    const totalStayCost = updatedActiveStays.reduce(
      (s, st) => s + ((Number(st.pricePerNight) || 0) * (st.nights || 1) * roomMultiplier),
      0
    );
    optionsToUpdate[optIdx] = {
      ...optionsToUpdate[optIdx],
      hotelStays: updatedActiveStays,
      totalPrice: totalStayCost,
    };
    if (onOptionsChange) {
      onOptionsChange(optionsToUpdate);
    }
    if (onChange) {
      onChange(updatedActiveStays);
    }
    if (onPriceAdjustment) {
      onPriceAdjustment(totalStayCost, optIdx);
    }
  }

  function handleStayChange(idx, field, value) {
    const updated = [...currentStays];
    updated[idx] = {
      ...updated[idx],
      [field]: value,
    };

    // If user changes roomType and stay has hotelId, update room & meal prices from loaded roomsMap with seasonal awareness
    if (field === "roomType" && updated[idx].hotelId) {
      const rooms = roomsMap[updated[idx].hotelId] || [];
      if (rooms.length > 0) {
        const hotel = catalogHotels.find((h) => h._id === updated[idx].hotelId) || { _id: updated[idx].hotelId };
        const pricing = getHotelAllPricesForDate(hotel, rooms, startDate);
        const targetNorm = String(value).toLowerCase().trim();
        const matched = pricing.roomOptions.find((r) => r.name.toLowerCase().includes(targetNorm) || targetNorm.includes(r.name.toLowerCase())) || pricing.roomOptions[0];
        if (matched) {
          const curPlan = updated[idx].mealPlan || "CP";
          const newRate = matched.meals?.[curPlan] || matched.minPrice || 0;
          updated[idx].roomId = matched.id;
          updated[idx].mealPrices = matched.meals;
          updated[idx].availableMealPlans = Object.keys(matched.meals || {});
          if (newRate > 0) updated[idx].pricePerNight = newRate;
        }
      }
    }

    syncOptions(updated);
  }

  function handleNightsChange(idx, newNights) {
    const validNights = Math.max(1, parseInt(newNights, 10) || 1);
    const updated = [...currentStays];
    updated[idx] = {
      ...updated[idx],
      nights: validNights,
    };
    syncOptions(updated);
  }

  // Handle direct click from Matrix or Tab views to set hotel, room & meal plan
  function handleSelectHotelAndMealRate(legIdx, hotel, room, mealPlan, rate, category = null) {
    const selectedRate = Number(rate) || 0;
    const currentStay = currentStays[legIdx] || {};

    const updatedStay = {
      ...currentStay,
      hotelId: hotel._id,
      hotelName: hotel.name,
      cityName: hotel.city?.name || currentStay.cityName || primaryDestination,
      category: category || hotel.category || currentStay.category || "Deluxe",
      starRating: hotel.starRating || currentStay.starRating || 3,
      roomId: room?.id || room?._id || currentStay.roomId,
      roomType: room?.name || room?.roomType || "Standard Room",
      mealPlan: mealPlan || "CP",
      mealPrices: room?.meals || currentStay.mealPrices,
      availableMealPlans: room?.meals ? Object.keys(room.meals) : ["EP", "CP", "MAP", "AP"],
      pricePerNight: selectedRate,
    };

    const updatedStays = [...currentStays];
    updatedStays[legIdx] = updatedStay;
    syncOptions(updatedStays);
  }

  function handleAddCityStay() {
    const remaining = Math.max(1, totalNights - allocatedNights);
    const newStay = {
      cityName: "",
      nights: remaining,
      hotelId: null,
      hotelName: "",
      category: "Deluxe",
      roomId: null,
      starRating: 3,
      roomType: "Deluxe AC Room",
      mealPlan: "CP",
      pricePerNight: 0,
      notes: "",
    };
    syncOptions([...currentStays, newStay]);
  }

  function handleRemoveStay(idx) {
    if (currentStays.length <= 1) return;
    const updated = currentStays.filter((_, i) => i !== idx);
    syncOptions(updated);
  }

  // ── Option Tier Handlers (Add, Duplicate, Remove, Rename, Generate 6 Categories) ──
  function handleAddOption() {
    const newIdx = rawOptions.length;
    const catName = HOTEL_CATEGORIES[newIdx % HOTEL_CATEGORIES.length];
    const defaultLabel = `${catName} Tier (${CATEGORY_THEMES[catName]?.starDefault || "4★"})`;

    const newOptionStays = currentStays.map((s) => ({
      ...s,
      hotelName: "",
      category: catName,
      starRating: catName.includes("Luxury") ? 5 : catName.includes("Premium") ? 4 : 3,
      roomType: catName.includes("Luxury") ? "Luxury Suite / Villa" : "Deluxe AC Room",
      mealPlan: "CP",
      pricePerNight: 0,
    }));

    const updated = [
      ...rawOptions,
      {
        label: defaultLabel,
        category: catName,
        hotelStays: newOptionStays,
        totalPrice: 0,
      },
    ];

    if (onOptionsChange) onOptionsChange(updated);
    if (onChange) onChange(newOptionStays);
    if (onPriceAdjustment) onPriceAdjustment(0, newIdx);
    setActiveOptIdx(newIdx);
  }

  function handleGenerate6StandardTiers() {
    const roomMultiplier = Math.max(1, parseInt(totalRooms, 10) || 1);
    const generated = HOTEL_CATEGORIES.map((catName) => {
      const newStays = currentStays.map((stay) => {
        const cityHotels = catalogHotels.filter(
          (h) => h.category && h.category.toLowerCase() === catName.toLowerCase()
        );
        const cleanCity = (stay.cityName || "").split(",")[0].split("/")[0].trim().toLowerCase();
        const matched = cityHotels.find((h) => {
          const hc = (h.city?.name || "").toLowerCase();
          return cleanCity && (hc.includes(cleanCity) || cleanCity.includes(hc));
        }) || cityHotels[0];

        const rooms = matched ? (roomsMap[matched._id] || []) : [];
        const pricing = matched ? getHotelAllPricesForDate(matched, rooms, startDate) : null;
        const defaultRoom = pricing?.roomOptions?.[0];
        const defaultPlan = "CP";
        const rate = defaultRoom?.meals?.[defaultPlan] || defaultRoom?.minPrice || pricing?.minPrice || 0;

        return {
          ...stay,
          hotelId: matched ? matched._id : null,
          hotelName: matched ? matched.name : `${catName} Hotel`,
          category: catName,
          starRating: matched ? matched.starRating : (catName.includes("Luxury") ? 5 : catName.includes("Premium") ? 4 : 3),
          roomId: defaultRoom?.id || null,
          roomType: defaultRoom?.name || "Standard Room",
          mealPlan: defaultPlan,
          mealPrices: defaultRoom?.meals || undefined,
          availableMealPlans: defaultRoom?.meals ? Object.keys(defaultRoom.meals) : ["EP", "CP", "MAP", "AP"],
          pricePerNight: rate,
        };
      });

      const tierTotal = newStays.reduce((sum, s) => sum + ((Number(s.pricePerNight) || 0) * (s.nights || 1) * roomMultiplier), 0);

      return {
        label: `${catName} Tier`,
        category: catName,
        hotelStays: newStays,
        totalPrice: tierTotal,
      };
    });

    if (onOptionsChange) onOptionsChange(generated);
    const defaultIdx = Math.min(1, generated.length - 1); // Select Deluxe by default
    if (onChange && generated[defaultIdx]) onChange(generated[defaultIdx].hotelStays);
    if (onPriceAdjustment && generated[defaultIdx]) onPriceAdjustment(generated[defaultIdx].totalPrice, defaultIdx);
    setActiveOptIdx(defaultIdx);
  }

  function handleDuplicateOption(idx) {
    const source = rawOptions[idx] || rawOptions[0];
    const newIdx = rawOptions.length;
    const duplicatedStays = (source.hotelStays || currentStays).map((s) => ({ ...s }));
    const roomMultiplier = Math.max(1, parseInt(totalRooms, 10) || 1);
    const dupCost = duplicatedStays.reduce(
      (s, st) => s + ((Number(st.pricePerNight) || 0) * (st.nights || 1) * roomMultiplier),
      0
    );

    const updated = [
      ...rawOptions,
      {
        label: `${source.label || `Option ${idx + 1}`} (Copy)`,
        category: source.category || "Deluxe",
        hotelStays: duplicatedStays,
        totalPrice: dupCost,
      },
    ];

    if (onOptionsChange) onOptionsChange(updated);
    if (onChange) onChange(duplicatedStays);
    if (onPriceAdjustment) onPriceAdjustment(dupCost, newIdx);
    setActiveOptIdx(newIdx);
  }

  function handleRemoveOption(idx) {
    if (rawOptions.length <= 1) return;
    const updated = rawOptions.filter((_, i) => i !== idx);
    const nextIdx = Math.min(activeOptIdx >= updated.length ? updated.length - 1 : activeOptIdx, updated.length - 1);
    if (onOptionsChange) onOptionsChange(updated);
    setActiveOptIdx(nextIdx);

    const targetStays = updated[nextIdx]?.hotelStays || currentStays;
    const roomMultiplier = Math.max(1, parseInt(totalRooms, 10) || 1);
    const nextCost = targetStays.reduce(
      (s, st) => s + ((Number(st.pricePerNight) || 0) * (st.nights || 1) * roomMultiplier),
      0
    );
    if (onChange) onChange(targetStays);
    if (onPriceAdjustment) onPriceAdjustment(nextCost, nextIdx);
  }

  function handleRenameOption(idx, newLabel) {
    const updated = rawOptions.map((opt, i) => (i === idx ? { ...opt, label: newLabel } : opt));
    if (onOptionsChange) onOptionsChange(updated);
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-5">
      {/* ── 1. Top Section Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900">Hotel Accommodation Portfolio</h3>
              <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                {rawOptions.length} {rawOptions.length === 1 ? "Option" : "Options"}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Multi-category hotel packages with real-time rate calculator
            </p>
          </div>
        </div>

        {/* Top Controls: Nights Indicator & Add Stay */}
        <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${
              allocatedNights === totalNights
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-amber-50 text-amber-700 border-amber-200"
            }`}
          >
            {allocatedNights === totalNights ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
            )}
            <span>{allocatedNights}/{totalNights} Nights</span>
          </div>

          <button
            type="button"
            onClick={handleAddCityStay}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5 text-amber-400" />
            <span>Add Stay</span>
          </button>
        </div>
      </div>

      {/* ── 2. Minimalist Tier Options Tabs Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
          {rawOptions.map((opt, idx) => {
            const isActive = idx === activeOptIdx;
            return (
              <div
                key={idx}
                onClick={() => {
                  setActiveOptIdx(idx);
                  const targetOption = rawOptions[idx] || rawOptions[0];
                  const targetStays = (targetOption?.hotelStays && targetOption.hotelStays.length > 0)
                    ? targetOption.hotelStays
                    : currentStays;
                  const roomMultiplier = Math.max(1, parseInt(totalRooms, 10) || 1);
                  const totalCost = targetStays.reduce(
                    (s, st) => s + ((Number(st.pricePerNight) || 0) * (st.nights || 1) * roomMultiplier),
                    0
                  );
                  if (onChange) onChange(targetStays);
                  if (onPriceAdjustment) onPriceAdjustment(totalCost, idx);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs cursor-pointer select-none transition-all ${
                  isActive
                    ? "bg-white border-slate-900 text-slate-900 shadow-xs font-bold"
                    : "bg-transparent border-transparent text-slate-600 hover:bg-white/60 font-medium"
                }`}
              >
                <span className={`w-4 h-4 rounded text-[10px] flex items-center justify-center font-bold ${
                  isActive ? "bg-slate-900 text-white" : "bg-slate-200 text-slate-600"
                }`}>
                  {idx + 1}
                </span>

                <input
                  type="text"
                  value={opt.label || `Option ${idx + 1}`}
                  onChange={(e) => handleRenameOption(idx, e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  className={`bg-transparent focus:outline-none text-xs font-semibold border-b ${
                    isActive ? "border-slate-900 text-slate-900" : "border-transparent text-slate-600 focus:border-slate-400"
                  }`}
                  style={{ width: `${Math.max((opt.label || "").length, 9)}ch` }}
                />

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDuplicateOption(idx);
                  }}
                  className="p-0.5 text-slate-400 hover:text-slate-700 transition-colors"
                  title="Duplicate Option"
                >
                  <Copy className="w-3 h-3" />
                </button>

                {rawOptions.length > 1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveOption(idx);
                    }}
                    className="p-0.5 text-slate-400 hover:text-rose-600 transition-colors"
                    title="Remove Option"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-auto">
          <button
            type="button"
            onClick={handleGenerate6StandardTiers}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-slate-200"
            title="Generate Budget to Luxury 6 Tiers"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>6 Tiers</span>
          </button>
          <button
            type="button"
            onClick={handleAddOption}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-amber-800 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors border border-amber-200/80"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Option</span>
          </button>
        </div>
      </div>

      {/* ── 3. Minimalist Accommodation Stay Cards ── */}
      <div className="space-y-3.5">
        {currentStays.map((stay, idx) => {
          const stayNights = stay.nights || 1;

          return (
            <div
              key={idx}
              className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 hover:border-amber-400/80 transition-all space-y-3.5 shadow-2xs"
            >
              {/* Card Header: Stay Identifier & Actions */}
              <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <div className="px-2.5 py-0.5 rounded-lg bg-slate-900 text-amber-400 font-mono font-bold text-[11px] flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    <span>STAY {idx + 1}</span>
                  </div>

                  {stay.cityName && (
                    <span className="text-xs font-bold text-slate-800">
                      {stay.cityName}
                    </span>
                  )}

                  {stay.category && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getCategoryBadgeClass(stay.category)}`}>
                      {stay.category}
                    </span>
                  )}

                  {/* Night Stepper */}
                  <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50 text-xs font-semibold overflow-hidden">
                    <button
                      type="button"
                      onClick={() => handleNightsChange(idx, Math.max(1, stayNights - 1))}
                      className="px-2 py-0.5 hover:bg-slate-200 text-slate-600 transition-colors"
                      title="Decrease 1 Night"
                    >
                      -
                    </button>
                    <span className="px-2 text-slate-800 text-[11.5px]">
                      {stayNights}N
                    </span>
                    <button
                      type="button"
                      onClick={() => handleNightsChange(idx, stayNights + 1)}
                      className="px-2 py-0.5 hover:bg-slate-200 text-slate-600 transition-colors"
                      title="Increase 1 Night"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openHotelMealDialog(idx, stay.mealPlan, stay.roomType, stay.category)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200/80 transition-colors"
                    title="Browse verified hotels with all meal prices"
                  >
                    <Search className="w-3.5 h-3.5 text-amber-600" />
                    <span>Browse Hotels</span>
                  </button>

                  {currentStays.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveStay(idx)}
                      className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                      title="Remove stay"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Card Inputs Grid: Destination, Hotel & Stars, Room Category */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                {/* Destination City */}
                <div className="md:col-span-3">
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Destination / City
                  </label>
                  <div className="relative">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={stay.cityName || ""}
                      onChange={(e) => handleStayChange(idx, "cityName", e.target.value)}
                      placeholder="e.g. Munnar"
                      className="w-full pl-7 pr-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50/40 hover:bg-white focus:bg-white text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-colors"
                    />
                  </div>
                </div>

                {/* Hotel Name & Star Rating */}
                <div className="md:col-span-5">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-slate-600">
                      Hotel / Resort Name
                    </label>
                    {/* Star Rating Inline */}
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => handleStayChange(idx, "starRating", star)}
                          className="focus:outline-none transition-transform hover:scale-110"
                        >
                          <Star
                            className={`w-3.5 h-3.5 ${
                              star <= (stay.starRating || 3)
                                ? "fill-amber-400 text-amber-400"
                                : "text-slate-200 hover:text-amber-300"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="relative">
                    <Hotel className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={stay.hotelName || ""}
                      onChange={(e) => handleStayChange(idx, "hotelName", e.target.value)}
                      placeholder="e.g. Tea County Resort"
                      className="w-full pl-7 pr-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50/40 hover:bg-white focus:bg-white text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-colors"
                    />
                  </div>
                </div>

                {/* Room Category */}
                <div className="md:col-span-4">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-slate-600">
                      Room Category
                    </label>
                    <div className="flex items-center gap-1">
                      {ROOM_PRESETS.map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => {
                            handleStayChange(idx, "roomType", preset);
                            openHotelMealDialog(idx, stay.mealPlan, preset, stay.category);
                          }}
                          className={`text-[10px] px-1.5 py-0.5 rounded transition-colors ${
                            (stay.roomType || "").toLowerCase() === preset.toLowerCase()
                              ? "bg-amber-500 text-white font-bold"
                              : "text-slate-500 hover:text-amber-800 bg-slate-100 hover:bg-amber-50"
                          }`}
                        >
                          {preset.replace(" Room", "")}
                        </button>
                      ))}
                    </div>
                  </div>
                  <input
                    type="text"
                    value={stay.roomType || ""}
                    onChange={(e) => handleStayChange(idx, "roomType", e.target.value)}
                    placeholder="e.g. Deluxe AC Room"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50/40 hover:bg-white focus:bg-white text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-colors"
                  />
                </div>
              </div>

              {/* Minimalist Meal Plan Pill Bar & Stay Total */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Meal Plan:
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {MEAL_PLANS.map((mp) => {
                      const isSel = (stay.mealPlan || "CP") === mp.id;
                      const planMeal = getMealDiff(mp.id, stay.starRating, stay.mealPrices);
                      const planRate = stay.mealPrices?.[mp.id] !== undefined
                        ? Number(stay.mealPrices[mp.id])
                        : (isSel && stay.pricePerNight ? stay.pricePerNight : planMeal.price);

                      return (
                        <button
                          key={mp.id}
                          type="button"
                          onClick={() => openHotelMealDialog(idx, mp.id, stay.roomType, stay.category)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all border ${
                            isSel
                              ? "bg-amber-500 text-white border-amber-600 shadow-2xs"
                              : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300"
                          }`}
                          title={`${mp.title} - ${mp.sub}. Click to view Top 5 lowest price hotels.`}
                        >
                          <span>{mp.id}</span>
                          {planRate > 0 && (
                            <span className={`text-[11px] font-normal ${isSel ? "text-amber-100" : "text-slate-400"}`}>
                              ₹{planRate.toLocaleString("en-IN")}/n
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Stay Rate Summary */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2 text-xs text-slate-700 self-end sm:self-auto text-right sm:text-left">
                  <div className="flex items-center gap-1.5 justify-end sm:justify-start">
                    <span className="text-slate-400 font-medium">Stay Total:</span>
                    <span className="font-bold text-slate-900 text-sm">
                      ₹{(((stay.pricePerNight || 0) * stayNights) * Math.max(1, parseInt(totalRooms, 10) || 1)).toLocaleString("en-IN")}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    ({stayNights}N{Math.max(1, parseInt(totalRooms, 10) || 1) > 1 ? ` × ${Math.max(1, parseInt(totalRooms, 10) || 1)} Rooms` : ""} × ₹{(stay.pricePerNight || 0).toLocaleString("en-IN")}/n)
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Lowest Price & Full Catalog Hotel / Meal Selection Dialog ── */}
      <HotelMealSelectionDialog
        isOpen={mealDialogState.isOpen}
        onClose={() => setMealDialogState((prev) => ({ ...prev, isOpen: false }))}
        cityName={mealDialogState.cityName}
        stayNights={mealDialogState.stayNights}
        category={mealDialogState.category}
        roomType={mealDialogState.roomType}
        mealPlan={mealDialogState.mealPlan}
        catalogHotels={catalogHotels}
        roomsMap={roomsMap}
        startDate={startDate}
        totalRooms={totalRooms}
        onSelectHotel={({ hotel, room, mealPlan, rate, category }) => {
          if (mealDialogState.legIdx !== null && mealDialogState.legIdx !== undefined) {
            handleSelectHotelAndMealRate(mealDialogState.legIdx, hotel, room, mealPlan, rate, category);
          }
          setMealDialogState((prev) => ({ ...prev, isOpen: false }));
        }}
      />
    </div>
  );
}
