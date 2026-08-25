"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Building2, Star, Plus, Trash2, MapPin, Hotel, Check,
  Search, X, Sparkles, BedDouble, Utensils, Info, CheckCircle2,
  Calendar, Layers, ChevronRight, AlertCircle, Copy,
} from "lucide-react";

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
  "Deluxe AC Room",
  "Super Deluxe AC Room",
  "Premium Valley View Room",
  "Executive Suite",
  "Luxury Pool Villa",
  "Houseboat AC Cabin",
  "Heritage Cottage",
];

/**
 * Group sequential raw stays by cityName if legacy single-night array was provided
 */
function normalizeStays(rawStays, defaultDest, defaultNights) {
  if (!rawStays || rawStays.length === 0) {
    return [
      {
        cityName: defaultDest || "",
        nights: Math.max(1, defaultNights || 1),
        hotelName: "",
        starRating: 3,
        roomType: "",
        mealPlan: "CP",
        pricePerNight: 0,
        notes: "",
      },
    ];
  }

  // Check if stays already have explicit `nights` property
  const hasExplicitNights = rawStays.some((s) => s.nights !== undefined && s.nights > 1);
  if (hasExplicitNights) {
    return rawStays.map((s, i) => ({
      ...s,
      cityName: s.cityName || defaultDest || "",
      nights: Math.max(1, parseInt(s.nights, 10) || 1),
      hotelId: s.hotelId || null,
      hotelName: s.hotelName || "",
      roomId: s.roomId || null,
      starRating: Math.max(1, Math.min(5, parseInt(s.starRating, 10) || 3)),
      roomType: s.roomType || "",
      mealPlan: (s.mealPlan && ["EP", "CP", "MAP", "AP"].includes(String(s.mealPlan).toUpperCase())) ? String(s.mealPlan).toUpperCase() : "CP",
      availableMealPlans: (s.availableMealPlans && s.availableMealPlans.length > 0) ? s.availableMealPlans : (s.mealPrices ? Object.keys(s.mealPrices) : undefined),
      mealPrices: s.mealPrices || undefined,
      pricePerNight: s.pricePerNight || 0,
      notes: s.notes || "",
    }));
  }

  // Otherwise, group continuous nights in the same city into one stay leg
  const grouped = [];
  rawStays.forEach((s) => {
    const city = s.cityName || defaultDest || "";
    const last = grouped[grouped.length - 1];

    if (last && last.cityName && city && last.cityName.toLowerCase() === city.toLowerCase() && (last.hotelName === s.hotelName || !last.hotelName || !s.hotelName)) {
      last.nights += 1;
      if (!last.hotelName && s.hotelName) last.hotelName = s.hotelName;
      if (!last.hotelId && s.hotelId) last.hotelId = s.hotelId;
      if (!last.mealPrices && s.mealPrices) last.mealPrices = s.mealPrices;
      if (!last.availableMealPlans && s.availableMealPlans) last.availableMealPlans = s.availableMealPlans;
    } else {
      grouped.push({
        ...s,
        cityName: city,
        nights: Math.max(1, parseInt(s.nights, 10) || 1),
        hotelId: s.hotelId || null,
        hotelName: s.hotelName || "",
        roomId: s.roomId || null,
        starRating: Math.max(1, Math.min(5, parseInt(s.starRating, 10) || 3)),
        roomType: s.roomType || "",
        mealPlan: (s.mealPlan && ["EP", "CP", "MAP", "AP"].includes(String(s.mealPlan).toUpperCase())) ? String(s.mealPlan).toUpperCase() : "CP",
        availableMealPlans: (s.availableMealPlans && s.availableMealPlans.length > 0) ? s.availableMealPlans : (s.mealPrices ? Object.keys(s.mealPrices) : undefined),
        mealPrices: s.mealPrices || undefined,
        pricePerNight: s.pricePerNight || 0,
        notes: s.notes || "",
      });
    }
  });

  return grouped.length > 0 ? grouped : [
    {
      cityName: defaultDest || "",
      nights: Math.max(1, defaultNights || 1),
      hotelId: null,
      hotelName: "",
      roomId: null,
      starRating: 3,
      roomType: "",
      mealPlan: "CP",
      pricePerNight: 0,
      notes: "",
    },
  ];
}

function mmdd(dateIn) {
  if (!dateIn) return -1;
  const d = dateIn instanceof Date ? dateIn : new Date(dateIn);
  if (isNaN(d.getTime())) return -1;
  return (d.getUTCMonth() + 1) * 100 + d.getUTCDate();
}

function getMatchingSeason(seasonalPricing = [], checkDate = null) {
  if (!seasonalPricing || seasonalPricing.length === 0) return null;
  if (!checkDate) return seasonalPricing[0];

  const md = mmdd(checkDate);
  if (md === -1) return seasonalPricing[0];

  const matched = seasonalPricing.find((s) =>
    (s.dateRanges || []).some((r) => {
      if (!r.startDate || !r.endDate) return false;
      const s0 = mmdd(r.startDate), e0 = mmdd(r.endDate);
      if (s0 === -1 || e0 === -1) return false;
      return s0 <= e0 ? md >= s0 && md <= e0 : md >= s0 || md <= e0;
    })
  );

  return matched || seasonalPricing[0];
}

async function fetchRoomsForHotel(hotelId) {
  if (!hotelId) return [];
  try {
    const res = await fetch(`/api/accommodation/rooms?hotelId=${hotelId}`);
    const data = await res.json();
    return data.rooms || [];
  } catch (err) {
    console.error("Error fetching rooms", err);
    return [];
  }
}

function resolveRoomPricing(rooms = [], targetRoomType = "", travelDate = null) {
  if (!rooms || rooms.length === 0) return null;

  // 1. Find matching room by roomType (exact or fuzzy)
  let matchedRoom = null;
  if (targetRoomType) {
    const targetNorm = targetRoomType.toLowerCase().trim();
    matchedRoom = rooms.find(
      (r) => (r.roomType || "").toLowerCase().trim() === targetNorm
    );
    if (!matchedRoom) {
      matchedRoom = rooms.find(
        (r) =>
          (r.roomType || "").toLowerCase().includes(targetNorm) ||
          targetNorm.includes((r.roomType || "").toLowerCase())
      );
    }
  }
  if (!matchedRoom) {
    matchedRoom = rooms[0];
  }

  // 2. Find matching season for travel date
  const season = getMatchingSeason(matchedRoom.seasonalPricing || [], travelDate);
  if (!season || !season.meals || season.meals.length === 0) {
    const fallbackPrices = {};
    (matchedRoom.seasonalPricing || []).forEach((s) => {
      (s.meals || []).forEach((m) => {
        if (m.plan && Number(m.price) > 0 && !fallbackPrices[m.plan]) {
          fallbackPrices[m.plan] = Number(m.price);
        }
      });
    });
    const plans = Object.keys(fallbackPrices);
    return plans.length > 0
      ? { mealPrices: fallbackPrices, availableMealPlans: plans, roomType: matchedRoom.roomType }
      : null;
  }

  const mealPrices = {};
  (season.meals || []).forEach((m) => {
    if (m.plan && Number(m.price) > 0) {
      mealPrices[m.plan] = Number(m.price);
    }
  });

  const availableMealPlans = Object.keys(mealPrices);
  if (availableMealPlans.length === 0) return null;

  return {
    mealPrices,
    availableMealPlans,
    roomType: matchedRoom.roomType || targetRoomType,
  };
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
  const [loadingHotels, setLoadingHotels] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [starFilter, setStarFilter] = useState("ALL");
  const [selectingLegIdx, setSelectingLegIdx] = useState(null);
  const [activeOptIdx, setActiveOptIdx] = useState(0);

  // Initialize or synchronize accommodation options array
  const rawOptions = useMemo(() => {
    if (propOptions && propOptions.length > 0) return propOptions;
    return [
      {
        label: "Option 1 (Standard 3★)",
        hotelStays: hotelStays && hotelStays.length > 0 ? hotelStays : [],
        totalPrice: 0,
      },
    ];
  }, [propOptions, hotelStays]);

  const activeOption = rawOptions[activeOptIdx] || rawOptions[0] || {
    label: "Option 1 (Standard 3★)",
    hotelStays: hotelStays,
    totalPrice: 0,
  };

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

  // Normalized City Stay Legs for the active tier
  const currentStays = useMemo(() => {
    const staysForOption = activeOption.hotelStays && activeOption.hotelStays.length > 0 ? activeOption.hotelStays : hotelStays;
    return normalizeStays(staysForOption, primaryDestination, totalNights);
  }, [activeOption.hotelStays, hotelStays, primaryDestination, totalNights]);

  // Auto-resolve catalog hotel room pricing when catalog hotels or startDate are ready
  useEffect(() => {
    if (!catalogHotels || catalogHotels.length === 0) return;

    let changed = false;
    let totalSeasonalDelta = 0;
    const updated = [...currentStays];

    const promises = updated.map(async (stay, idx) => {
      if (!stay.hotelName) return;

      const foundHotel = catalogHotels.find(
        (h) => (h._id && h._id === stay.hotelId) || (h.name && h.name.toLowerCase().trim() === stay.hotelName.toLowerCase().trim())
      );

      if (foundHotel && foundHotel._id) {
        const rooms = await fetchRoomsForHotel(foundHotel._id);
        if (rooms.length > 0) {
          const resolved = resolveRoomPricing(rooms, stay.roomType, startDate);
          if (resolved && resolved.availableMealPlans.length > 0) {
            const curMealPlan = stay.mealPlan || "CP";
            const newMealPlan = resolved.availableMealPlans.includes(curMealPlan)
              ? curMealPlan
              : resolved.availableMealPlans.includes("CP")
              ? "CP"
              : resolved.availableMealPlans[0];

            const newPrice = resolved.mealPrices[newMealPlan] || stay.pricePerNight || 0;
            const oldPrice = stay.pricePerNight || 0;

            if (
              JSON.stringify(stay.mealPrices) !== JSON.stringify(resolved.mealPrices) ||
              stay.pricePerNight !== newPrice
            ) {
              changed = true;
              const stayNights = Math.max(1, parseInt(stay.nights, 10) || 1);
              const roomsCount = Math.max(1, parseInt(totalRooms, 10) || 1);

              if (oldPrice > 0 && newPrice > 0 && oldPrice !== newPrice) {
                totalSeasonalDelta += (newPrice - oldPrice) * stayNights * roomsCount;
              }

              updated[idx] = {
                ...stay,
                hotelId: foundHotel._id,
                starRating: foundHotel.starRating || stay.starRating || 3,
                roomType: resolved.roomType || stay.roomType,
                mealPrices: resolved.mealPrices,
                availableMealPlans: resolved.availableMealPlans,
                mealPlan: newMealPlan,
                pricePerNight: newPrice,
              };
            }
          }
        }
      }
    });

    Promise.all(promises).then(() => {
      if (changed) {
        syncOptions(updated);
        if (onPriceAdjustment && totalSeasonalDelta !== 0) {
          onPriceAdjustment(totalSeasonalDelta);
        }
      }
    });
  }, [catalogHotels, startDate]);

  // Total nights allocated across all city stays
  const allocatedNights = useMemo(() => {
    return currentStays.reduce((acc, s) => acc + (Math.max(1, parseInt(s.nights, 10) || 1)), 0);
  }, [currentStays]);

  function syncOptions(updatedActiveStays, updatedOptionsArray = null) {
    const optionsToUpdate = updatedOptionsArray || [...rawOptions];
    optionsToUpdate[activeOptIdx] = {
      ...optionsToUpdate[activeOptIdx],
      hotelStays: updatedActiveStays,
    };
    if (onOptionsChange) {
      onOptionsChange(optionsToUpdate);
    }
    if (onChange) {
      onChange(updatedActiveStays);
    }
  }

  function handleStayChange(idx, field, value) {
    const updated = [...currentStays];
    updated[idx] = {
      ...updated[idx],
      [field]: value,
    };
    syncOptions(updated);

    // If roomType was changed, try resolving prices for the new room type
    if (field === "roomType" && updated[idx].hotelId) {
      fetchRoomsForHotel(updated[idx].hotelId).then((rooms) => {
        if (rooms.length > 0) {
          const resolved = resolveRoomPricing(rooms, value, startDate);
          if (resolved) {
            const curMealPlan = updated[idx].mealPlan || "CP";
            const newMealPlan = resolved.availableMealPlans.includes(curMealPlan)
              ? curMealPlan
              : resolved.availableMealPlans.includes("CP")
              ? "CP"
              : resolved.availableMealPlans[0];

            const reUpdated = [...currentStays];
            reUpdated[idx] = {
              ...reUpdated[idx],
              roomType: resolved.roomType || value,
              mealPrices: resolved.mealPrices,
              availableMealPlans: resolved.availableMealPlans,
              mealPlan: newMealPlan,
              pricePerNight: resolved.mealPrices[newMealPlan] || 0,
            };
            syncOptions(reUpdated);
          }
        }
      });
    }
  }

  function handleMealPlanSelect(idx, newPlanId) {
    const stay = currentStays[idx];
    if (!stay) return;
    const oldPlanId = stay.mealPlan || "CP";
    if (oldPlanId === newPlanId) return;

    const oldMealInfo = getMealDiff(oldPlanId, stay.starRating, stay.mealPrices);
    const newMealInfo = getMealDiff(newPlanId, stay.starRating, stay.mealPrices);

    const oldNightlyPrice = stay.pricePerNight || oldMealInfo.price || 0;
    const newNightlyPrice = newMealInfo.price || 0;

    const stayNights = Math.max(1, parseInt(stay.nights, 10) || 1);
    const roomsCount = Math.max(1, parseInt(totalRooms, 10) || 1);

    // Calculate price delta for this stay upgrade
    const diffPerNight = (newMealInfo.diff !== undefined && oldMealInfo.diff !== undefined)
      ? (newMealInfo.diff - oldMealInfo.diff)
      : (newNightlyPrice - oldNightlyPrice);

    const totalDelta = diffPerNight * stayNights * roomsCount;

    const updated = [...currentStays];
    updated[idx] = {
      ...updated[idx],
      mealPlan: newPlanId,
      pricePerNight: newNightlyPrice,
    };
    syncOptions(updated);

    if (onPriceAdjustment && totalDelta !== 0) {
      onPriceAdjustment(totalDelta);
    }
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

  async function handleSelectCatalogHotel(legIdx, hotelObj) {
    if (!hotelObj) return;

    const currentStay = currentStays[legIdx] || {};
    let updatedStay = {
      ...currentStay,
      hotelId: hotelObj._id,
      hotelName: hotelObj.name || currentStay.hotelName,
      cityName: hotelObj.city?.name || currentStay.cityName || primaryDestination,
      starRating: hotelObj.starRating || currentStay.starRating || 3,
    };

    if (hotelObj._id) {
      const rooms = await fetchRoomsForHotel(hotelObj._id);
      if (rooms.length > 0) {
        const resolved = resolveRoomPricing(rooms, updatedStay.roomType, startDate);
        if (resolved) {
          const curMealPlan = updatedStay.mealPlan || "CP";
          const newMealPlan = resolved.availableMealPlans.includes(curMealPlan)
            ? curMealPlan
            : resolved.availableMealPlans.includes("CP")
            ? "CP"
            : resolved.availableMealPlans[0];

          updatedStay = {
            ...updatedStay,
            roomType: resolved.roomType || updatedStay.roomType,
            mealPrices: resolved.mealPrices,
            availableMealPlans: resolved.availableMealPlans,
            mealPlan: newMealPlan,
            pricePerNight: resolved.mealPrices[newMealPlan] || 0,
          };
        }
      }
    }

    const updatedStays = [...currentStays];
    updatedStays[legIdx] = updatedStay;
    syncOptions(updatedStays);
    setSelectingLegIdx(null);
  }

  function handleAddCityStay() {
    const remaining = Math.max(1, totalNights - allocatedNights);
    const newStay = {
      cityName: "",
      nights: remaining,
      hotelName: "",
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

  // ── Option Tier Handlers (Add, Duplicate, Remove, Rename) ──
  function handleAddOption() {
    const newIdx = rawOptions.length;
    const defaultLabel =
      newIdx === 1 ? "Option 2 (Deluxe 4★)" : newIdx === 2 ? "Option 3 (Luxury 5★)" : `Option ${newIdx + 1}`;

    const newOptionStays = currentStays.map((s) => ({
      ...s,
      hotelName: "",
      starRating: newIdx === 1 ? 4 : newIdx === 2 ? 5 : s.starRating,
      roomType: newIdx >= 1 ? "Super Deluxe / Suite" : "Deluxe AC Room",
      mealPlan: "CP",
      pricePerNight: 0,
    }));

    const updated = [
      ...rawOptions,
      {
        label: defaultLabel,
        hotelStays: newOptionStays,
        totalPrice: 0,
      },
    ];

    if (onOptionsChange) onOptionsChange(updated);
    setActiveOptIdx(newIdx);
  }

  function handleDuplicateOption(idx) {
    const source = rawOptions[idx] || rawOptions[0];
    const newIdx = rawOptions.length;
    const duplicatedStays = (source.hotelStays || currentStays).map((s) => ({ ...s }));

    const updated = [
      ...rawOptions,
      {
        label: `${source.label || `Option ${idx + 1}`} (Copy)`,
        hotelStays: duplicatedStays,
        totalPrice: source.totalPrice || 0,
      },
    ];

    if (onOptionsChange) onOptionsChange(updated);
    setActiveOptIdx(newIdx);
  }

  function handleRemoveOption(idx) {
    if (rawOptions.length <= 1) return;
    const updated = rawOptions.filter((_, i) => i !== idx);
    if (onOptionsChange) onOptionsChange(updated);
    if (activeOptIdx >= updated.length) {
      setActiveOptIdx(Math.max(0, updated.length - 1));
    }
  }

  function handleRenameOption(idx, newLabel) {
    const updated = rawOptions.map((opt, i) => (i === idx ? { ...opt, label: newLabel } : opt));
    if (onOptionsChange) onOptionsChange(updated);
  }

  const filteredCatalogHotels = catalogHotels.filter((h) => {
    const matchesSearch =
      searchQuery.trim() === "" ||
      h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (h.city?.name && h.city.name.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStar = starFilter === "ALL" || String(h.starRating) === String(starFilter);
    return matchesSearch && matchesStar;
  });

  return (
    <div className="bg-white rounded-3xl border-2 border-slate-200/90 hover:border-amber-400/70 p-6 sm:p-8 shadow-xs transition-all space-y-6">
      {/* ── Section Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500 via-amber-600 to-orange-600 text-white flex items-center justify-center font-black shadow-md shadow-amber-500/25">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-[17px] font-black text-slate-900">Hotel Accommodation Portfolio</h3>
              <span className="text-[10.5px] font-black text-amber-900 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 shadow-2xs">
                {rawOptions.length} {rawOptions.length === 1 ? "Hotel Tier" : "Hotel Tiers (Multi-Option)"}
              </span>
            </div>
            <p className="text-[12px] text-slate-400 font-semibold mt-0.5">
              Create multi-category hotel packages (Standard, Deluxe, Luxury) for client selection
            </p>
          </div>
        </div>

        {/* Live Nights Allocation Badge & Add City Button */}
        <div className="flex items-center gap-2.5 flex-wrap self-start sm:self-auto">
          {/* Nights Tracker Pill */}
          <div
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl font-black text-[12px] border transition-all ${
              allocatedNights === totalNights
                ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                : allocatedNights < totalNights
                ? "bg-amber-50 text-amber-900 border-amber-300"
                : "bg-purple-50 text-purple-900 border-purple-300"
            }`}
          >
            {allocatedNights === totalNights ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-600" />
            )}
            <span>
              {allocatedNights} of {totalNights} Nights Allocated
            </span>
          </div>

          <button
            type="button"
            onClick={handleAddCityStay}
            className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-[12.5px] transition-all shadow-2xs hover:scale-105 active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 text-amber-400" />
            <span>Add City Stay</span>
          </button>
        </div>
      </div>

      {/* ── 🌟 Multi-Tier Accommodation Options Tabs Bar ── */}
      <div className="p-4 rounded-3xl bg-slate-50/90 border border-slate-200/80 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-600" />
            <span className="text-[12px] font-black uppercase tracking-wider text-slate-700">
              Accommodation Tier Options ({rawOptions.length})
            </span>
          </div>

          <button
            type="button"
            onClick={handleAddOption}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-[12px] font-black text-amber-900 bg-amber-100/80 hover:bg-amber-200/80 border border-amber-300 transition-all shadow-2xs self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5 text-amber-800" />
            <span>+ Add Hotel Category Option</span>
          </button>
        </div>

        {/* Options Tabs Stream */}
        <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-none">
          {rawOptions.map((opt, idx) => {
            const isActive = idx === activeOptIdx;
            return (
              <div
                key={idx}
                onClick={() => setActiveOptIdx(idx)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border transition-all cursor-pointer select-none flex-shrink-0 ${
                  isActive
                    ? "bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950 border-amber-500 text-white shadow-md shadow-amber-950/20 ring-2 ring-amber-500/20"
                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-lg flex items-center justify-center font-black text-[10px] ${
                    isActive ? "bg-amber-400 text-slate-950" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {idx + 1}
                </div>

                <input
                  type="text"
                  value={opt.label || `Option ${idx + 1}`}
                  onChange={(e) => handleRenameOption(idx, e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  className={`text-[12.5px] font-black bg-transparent focus:outline-none border-b ${
                    isActive ? "border-amber-400/60 text-white focus:border-amber-300" : "border-transparent text-slate-800 focus:border-slate-400"
                  }`}
                  style={{ width: `${Math.max((opt.label || "").length, 10)}ch` }}
                />

                {/* Duplicate Option Icon */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDuplicateOption(idx);
                  }}
                  className={`p-1 rounded-lg transition-colors ${
                    isActive ? "text-slate-400 hover:text-amber-300" : "text-slate-400 hover:text-slate-700"
                  }`}
                  title="Duplicate this hotel category option"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>

                {/* Remove Option Button */}
                {rawOptions.length > 1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveOption(idx);
                    }}
                    className={`p-1 rounded-lg transition-colors ${
                      isActive ? "text-slate-400 hover:text-rose-400" : "text-slate-400 hover:text-rose-600"
                    }`}
                    title="Remove this option"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Destination / City Stay Cards Stream ── */}
      <div className="space-y-4">
        {currentStays.map((stay, idx) => {
          const stayNights = stay.nights || 1;

          return (
            <div
              key={idx}
              className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/90 hover:border-amber-400/90 hover:shadow-md transition-all space-y-4 relative group"
            >
              {/* 1. Header Bar: Stay Badge, Duration Stepper & Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-100">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <div className="px-3 py-1 rounded-xl bg-slate-950 text-amber-400 font-mono font-black text-[11.5px] shadow-xs flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                    <span>STAY {idx + 1}{stay.cityName ? ` • ${stay.cityName.toUpperCase()}` : ""}</span>
                  </div>

                  {/* Duration Stepper */}
                  <div className="flex items-center bg-slate-50 px-2 py-0.5 rounded-xl border border-slate-200 shadow-2xs">
                    <button
                      type="button"
                      onClick={() => handleNightsChange(idx, Math.max(1, stayNights - 1))}
                      className="w-5 h-5 rounded-lg bg-white hover:bg-slate-200 text-slate-700 font-black text-[12px] flex items-center justify-center transition-colors border border-slate-200"
                      title="Decrease 1 Night"
                    >
                      -
                    </button>
                    <span className="px-2 text-[12px] font-black text-slate-800 font-mono">
                      {stayNights} {stayNights > 1 ? "Nights" : "Night"}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleNightsChange(idx, stayNights + 1)}
                      className="w-5 h-5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-black text-[12px] flex items-center justify-center transition-colors shadow-2xs"
                      title="Increase 1 Night"
                    >
                      +
                    </button>
                  </div>

                  {/* Duration Quick Preset Chips */}
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => handleNightsChange(idx, n)}
                        className={`px-2 py-0.5 rounded-lg text-[10.5px] font-black transition-all border ${
                          stayNights === n
                            ? "bg-slate-900 text-white border-slate-900 shadow-2xs"
                            : "bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200"
                        }`}
                      >
                        {n}N
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setSelectingLegIdx(idx)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/90 hover:border-amber-300 font-extrabold text-[11.5px] transition-all shadow-2xs"
                    title="Browse verified hotels from master database"
                  >
                    <Search className="w-3.5 h-3.5 text-amber-600" />
                    <span>Catalog Hotel</span>
                  </button>

                  {currentStays.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveStay(idx)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-rose-600 hover:bg-rose-50 font-bold text-[11.5px] transition-colors"
                      title="Remove destination stay"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  )}
                </div>
              </div>

              {/* 2. Hotel Details Grid (City, Hotel, Star Rating) */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
                <div className="md:col-span-4">
                  <label className="block text-[11px] font-extrabold text-slate-700 mb-1">
                    Destination / City Name *
                  </label>
                  <div className="relative">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={stay.cityName || ""}
                      onChange={(e) => handleStayChange(idx, "cityName", e.target.value)}
                      placeholder="e.g. Munnar, Thekkady, Alleppey"
                      className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white font-bold text-[13px] text-slate-900 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 shadow-2xs transition-colors"
                    />
                  </div>
                </div>

                <div className="md:col-span-5">
                  <label className="block text-[11px] font-extrabold text-slate-700 mb-1">
                    Hotel Name / Resort *
                  </label>
                  <div className="relative">
                    <Hotel className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={stay.hotelName || ""}
                      onChange={(e) => handleStayChange(idx, "hotelName", e.target.value)}
                      placeholder="e.g. Tea County Resort / Grand Hyatt"
                      className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white font-bold text-[13px] text-slate-900 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 shadow-2xs transition-colors"
                    />
                  </div>
                </div>

                <div className="md:col-span-3">
                  <label className="block text-[11px] font-extrabold text-slate-700 mb-1">
                    Star Category
                  </label>
                  <div className="flex items-center justify-between bg-slate-50/50 p-2 rounded-xl border border-slate-200 shadow-2xs">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => handleStayChange(idx, "starRating", star)}
                          className="focus:outline-none transition-transform hover:scale-125"
                        >
                          <Star
                            className={`w-4 h-4 ${
                              star <= (stay.starRating || 3)
                                ? "fill-amber-400 text-amber-400"
                                : "text-slate-200 hover:text-amber-300"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                    <span className="text-[11.5px] font-black text-slate-800 ml-1">{stay.starRating || 3}★</span>
                  </div>
                </div>
              </div>

              {/* 3. Room Category Row */}
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <label className="block text-[11px] font-extrabold text-slate-700">Room Category / Type</label>
                  <div className="flex items-center gap-1 flex-wrap">
                    <span className="text-[10px] font-black uppercase text-slate-400 mr-1">Fast Presets:</span>
                    {ROOM_PRESETS.slice(0, 5).map((preset, pIdx) => (
                      <button
                        key={pIdx}
                        type="button"
                        onClick={() => handleStayChange(idx, "roomType", preset)}
                        className={`px-2.5 py-0.5 rounded-lg text-[10.5px] font-bold transition-all border ${
                          (stay.roomType || "") === preset
                            ? "bg-amber-500 text-white border-amber-600 shadow-2xs font-black"
                            : "bg-slate-50 hover:bg-amber-50 text-slate-600 hover:text-amber-900 border-slate-200"
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>
                <input
                  type="text"
                  value={stay.roomType || ""}
                  onChange={(e) => handleStayChange(idx, "roomType", e.target.value)}
                  placeholder="e.g. Deluxe AC Room, Premium Valley View, Suite"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white text-[13px] font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 shadow-2xs transition-colors"
                />
              </div>

              {/* 4. Included Meal Plan & Exact Meal Prices */}
              <div className="pt-3.5 border-t border-slate-100 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-[11px]">
                      <Utensils className="w-3.5 h-3.5 text-amber-700" />
                    </div>
                    <label className="text-[12px] font-black text-slate-900">
                      Included Meal Plan &amp; Meal Price
                    </label>
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium">
                    Select meal plan to apply its nightly accommodation rate
                  </span>
                </div>

                {/* Conditional Rendering: Real Fetched Cards vs Manual "Add Meal Plan" */}
                {(() => {
                  const hasFetchedPlans = (stay.availableMealPlans && stay.availableMealPlans.length > 0) ||
                                         (stay.mealPrices && Object.keys(stay.mealPrices).length > 0);

                  // CASE 1: Hotel / Package was fetched with verified rate card
                  if (hasFetchedPlans) {
                    const availablePlans = (stay.availableMealPlans && stay.availableMealPlans.length > 0)
                      ? MEAL_PLANS.filter((mp) => stay.availableMealPlans.includes(mp.id))
                      : MEAL_PLANS.filter((mp) => Object.keys(stay.mealPrices).includes(mp.id));

                    const gridColsClass = availablePlans.length === 1
                      ? "grid-cols-1"
                      : availablePlans.length === 2
                      ? "grid-cols-1 sm:grid-cols-2"
                      : availablePlans.length === 3
                      ? "grid-cols-1 sm:grid-cols-3"
                      : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4";

                    return (
                      <div className={`grid ${gridColsClass} gap-3`}>
                        {availablePlans.map((mp) => {
                          const isSel = (stay.mealPlan || "CP") === mp.id;
                          const planMeal = getMealDiff(mp.id, stay.starRating, stay.mealPrices);
                          return (
                            <div
                              key={mp.id}
                              onClick={() => handleMealPlanSelect(idx, mp.id)}
                              className={`p-3.5 rounded-2xl cursor-pointer transition-all border flex flex-col justify-between gap-3 relative ${
                                isSel
                                  ? "bg-gradient-to-b from-amber-50/90 to-amber-100/40 border-amber-500 ring-2 ring-amber-500/25 shadow-xs"
                                  : "bg-white hover:bg-slate-50/80 border-slate-200/90 hover:border-slate-300"
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <span className={`text-[15px] font-black leading-tight ${isSel ? "text-amber-950" : "text-slate-900"}`}>
                                      {mp.label}
                                    </span>
                                    <span className={`text-[11.5px] font-bold ${isSel ? "text-amber-900" : "text-slate-600"}`}>
                                      • {mp.title}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                                    {mp.sub}
                                  </p>
                                </div>

                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                                  isSel ? "border-amber-500 bg-amber-500 text-white" : "border-slate-300 bg-white"
                                }`}>
                                  {isSel && <Check className="w-3 h-3 stroke-[3]" />}
                                </div>
                              </div>

                              <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2 text-[11px]">
                                <span className="text-slate-400 font-semibold text-[10px] uppercase tracking-wider">Plan Diff:</span>
                                <span
                                  className={`px-2.5 py-1 rounded-xl font-black text-[12px] font-mono border transition-all ${
                                    isSel
                                      ? "bg-amber-500 text-white border-amber-600 shadow-xs"
                                      : planMeal.diff > 0
                                      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                      : planMeal.diff < 0
                                      ? "bg-rose-50 text-rose-800 border-rose-200"
                                      : "bg-slate-50 text-slate-700 border-slate-200"
                                  }`}
                                >
                                  {planMeal.diffLabel}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  }

                  // CASE 2: No data fetched yet -> Show clean "+ Add Meal Plan" selector
                  return (
                    <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/90 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[12px] font-black text-slate-800">
                            {stay.mealPlan ? `Active Plan: ${stay.mealPlan}` : "No Meal Plan Selected"}
                          </span>
                          {stay.mealPlan && (
                            <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-200">
                              {MEAL_PLANS.find((p) => p.id === stay.mealPlan)?.title || stay.mealPlan}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-black uppercase text-slate-400 mr-1">
                            + Add Meal Plan:
                          </span>
                          {MEAL_PLANS.map((mp) => {
                            const isSel = stay.mealPlan === mp.id;
                            return (
                              <button
                                key={mp.id}
                                type="button"
                                onClick={() => handleMealPlanSelect(idx, mp.id)}
                                className={`flex items-center gap-1 px-3 py-1 rounded-xl text-[11px] font-bold transition-all border ${
                                  isSel
                                    ? "bg-amber-500 text-white border-amber-600 shadow-2xs font-black"
                                    : "bg-white hover:bg-amber-50 text-slate-700 hover:text-amber-900 border-slate-200"
                                }`}
                              >
                                <span>{isSel ? "✓" : "+"}</span>
                                <span>{mp.label} ({mp.title})</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Stay Accommodation Meal Plan Status Bar */}
                {(() => {
                  const activeMeal = getMealDiff(stay.mealPlan || "CP", stay.starRating, stay.mealPrices);
                  return (
                    <div className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-white border border-slate-200 text-[11.5px] shadow-2xs">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                        <span className="text-slate-600 font-medium">Selected Meal Plan:</span>
                        <span className="font-black text-slate-900 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                          {stay.mealPlan || "CP"} • {activeMeal.name}
                        </span>
                        <span className="text-[10.5px] font-bold text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded-md">
                          {activeMeal.diffLabel}
                        </span>
                      </div>

                      <span className="text-[11px] font-bold text-slate-500">
                        {stayNights} Night{stayNights > 1 ? "s" : ""} Included
                      </span>
                    </div>
                  );
                })()}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── 🌟 Hotel Catalog Browser Modal ── */}
      {selectingLegIdx !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5">
          <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm" onClick={() => setSelectingLegIdx(null)} />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden border border-slate-200 flex flex-col max-h-[88vh] animate-in zoom-in-95">
            <div className="bg-slate-950 p-4 px-6 text-white flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-[16px] font-black text-white leading-tight">
                    Select Hotel for {currentStays[selectingLegIdx]?.cityName || `Stay ${selectingLegIdx + 1}`}
                  </h3>
                  <p className="text-[11.5px] text-slate-400">Search and pick from verified catalog hotels</p>
                </div>
              </div>
              <button type="button" onClick={() => setSelectingLegIdx(null)} className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 border-b border-slate-100 bg-slate-50 flex flex-col sm:flex-row sm:items-center gap-3 flex-shrink-0">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search hotel by name or city..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 bg-white font-medium text-[13px] text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>
              <div className="flex items-center gap-1">
                {["ALL", "3", "4", "5"].map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStarFilter(st)}
                    className={`px-3 py-1.5 rounded-xl text-[11.5px] font-bold transition-all border ${
                      starFilter === st ? "bg-slate-900 text-white border-slate-900 shadow-2xs" : "bg-white text-slate-600 hover:bg-slate-100 border-slate-200"
                    }`}
                  >
                    {st === "ALL" ? "All Stars" : `${st}★`}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-5 overflow-y-auto flex-1 space-y-2.5">
              {filteredCatalogHotels.length === 0 ? (
                <div className="text-center py-12 space-y-2">
                  <Hotel className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-[14px] font-bold text-slate-700">No matching hotels found</p>
                </div>
              ) : (
                filteredCatalogHotels.map((h) => (
                  <div
                    key={h._id}
                    onClick={() => handleSelectCatalogHotel(selectingLegIdx, h)}
                    className="p-4 rounded-2xl border border-slate-200 hover:border-amber-400 bg-white hover:bg-amber-50/30 transition-all cursor-pointer flex items-center justify-between gap-3 shadow-2xs group"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[14.5px] font-black text-slate-900 group-hover:text-amber-900">
                          {h.name}
                        </span>
                        <span className="text-[11px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                          {h.starRating}★
                        </span>
                      </div>
                      <p className="text-[12px] text-slate-500 font-medium flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{h.city?.name || "Destination City"}</span>
                        {h.address && <span className="text-slate-400">• {h.address}</span>}
                      </p>
                    </div>

                    <button
                      type="button"
                      className="px-3.5 py-1.5 rounded-xl bg-slate-900 group-hover:bg-amber-500 text-white font-bold text-[12px] transition-colors"
                    >
                      Select
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="p-3 px-6 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[12px] text-slate-500 flex-shrink-0">
              <span>Showing {filteredCatalogHotels.length} hotels</span>
              <button
                type="button"
                onClick={() => setSelectingLegIdx(null)}
                className="px-4 py-1.5 rounded-xl border border-slate-300 bg-white font-bold text-slate-700 hover:bg-slate-100"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
