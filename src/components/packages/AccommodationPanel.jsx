"use client";

import { useState, useEffect, useCallback } from "react";
import { Building2, Star, Copy, Loader2, Plus, Trash2, Layers, Calendar } from "lucide-react";

const MEAL_PLANS = [
  { value: "", label: "Select meal plan" },
  { value: "EP", label: "EP — Room Only" },
  { value: "CP", label: "CP — Bed & Breakfast" },
  { value: "MAP", label: "MAP — Breakfast + Dinner" },
  { value: "AP", label: "AP — All Meals" },
];

/**
 * AccommodationPanel — Continuous Stay Leg Accommodation Builder
 * Groups continuous nights in the same city into ONE single hotel stay card.
 */
export default function AccommodationPanel({
  destinations = [],
  accommodationOptions = [],
  onChange,
}) {
  const [activeOptIdx, setActiveOptIdx] = useState(0);
  const [hotelsMap, setHotelsMap] = useState({});
  const [roomsMap, setRoomsMap] = useState({});
  const [loadingHotels, setLoadingHotels] = useState({});
  const [loadingRooms, setLoadingRooms] = useState({});

  // ── Build Stay Legs from destinations ──
  // Each destination entry represents a continuous stay in that city.
  let nightCounter = 1;
  const stayLegs = destinations.map((dest, legIdx) => {
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

  // Build full list of individual night slots for schema compatibility
  const nightSlots = [];
  stayLegs.forEach((leg) => {
    leg.nightNumbers.forEach((n) => {
      nightSlots.push({
        night: n,
        cityId: leg.cityId,
        cityName: leg.cityName,
      });
    });
  });

  // Initialize default option if empty
  useEffect(() => {
    if (destinations.length > 0 && accommodationOptions.length === 0) {
      const defaultNights = nightSlots.map((slot) => ({
        night: slot.night,
        cityId: slot.cityId,
        cityName: slot.cityName,
        hotelId: "",
        hotelName: "",
        roomId: "",
        roomType: "",
        mealPlan: "",
        starRating: null,
        pricePerNight: 0,
        notes: "",
      }));
      onChange([
        {
          label: "Option 1 (Premium)",
          nights: defaultNights,
          totalPrice: 0,
        },
      ]);
    }
  }, [destinations]);

  // Fetch hotels for cities
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

  // Fetch rooms for hotels
  const fetchRooms = useCallback(async (hotelId) => {
    if (!hotelId || roomsMap[hotelId]) return;
    setLoadingRooms((prev) => ({ ...prev, [hotelId]: true }));
    try {
      const res = await fetch(`/api/accommodation/rooms?hotelId=${hotelId}`);
      const data = await res.json();
      setRoomsMap((prev) => ({ ...prev, [hotelId]: data.rooms || [] }));
    } catch (err) {
      console.error("Failed to fetch rooms:", err);
    } finally {
      setLoadingRooms((prev) => ({ ...prev, [hotelId]: false }));
    }
  }, [roomsMap]);

  useEffect(() => {
    destinations.forEach((d) => {
      if (d.cityId) fetchHotels(d.cityId);
    });
  }, [destinations, fetchHotels]);

  useEffect(() => {
    accommodationOptions.forEach((opt) => {
      (opt.nights || []).forEach((n) => {
        if (n.hotelId) fetchRooms(n.hotelId);
      });
    });
  }, [accommodationOptions, fetchRooms]);

  if (destinations.length === 0 || !destinations.some((d) => d.cityId)) {
    return (
      <div className="rounded-3xl border border-amber-200 bg-amber-50/80 p-8 text-center shadow-xs">
        <Building2 className="w-9 h-9 text-amber-500 mx-auto mb-2" />
        <p className="text-[16px] text-amber-950 font-black">
          No Route Destinations Added
        </p>
        <p className="text-[13px] text-amber-700 mt-1 max-w-sm mx-auto font-medium">
          Please add destination cities in the Basics step first. Hotels for each city stay will automatically be loaded here!
        </p>
      </div>
    );
  }

  const currentOption = accommodationOptions[activeOptIdx] || accommodationOptions[0];

  // Map individual night objects for current active option
  const optionNights = nightSlots.map((slot) => {
    const existing = currentOption?.nights?.find((n) => n.night === slot.night);
    return (
      existing || {
        night: slot.night,
        cityId: slot.cityId,
        cityName: slot.cityName,
        hotelId: "",
        hotelName: "",
        roomId: "",
        roomType: "",
        mealPlan: "",
        starRating: null,
        pricePerNight: 0,
        notes: "",
      }
    );
  });

  function updateActiveOptionNights(updatedNights) {
    const total = updatedNights.reduce((s, n) => s + (n.pricePerNight || 0), 0);
    const updatedOptions = accommodationOptions.map((opt, i) =>
      i === activeOptIdx
        ? { ...opt, nights: updatedNights, totalPrice: total }
        : opt
    );
    onChange(updatedOptions);
  }

  function addOption() {
    const newIdx = accommodationOptions.length;
    const defaultNights = nightSlots.map((slot) => ({
      night: slot.night,
      cityId: slot.cityId,
      cityName: slot.cityName,
      hotelId: "",
      hotelName: "",
      roomId: "",
      roomType: "",
      mealPlan: "",
      starRating: null,
      pricePerNight: 0,
      notes: "",
    }));

    const optionLabel =
      newIdx === 1 ? "Option 2 (Deluxe)" : newIdx === 2 ? "Option 3 (Standard)" : `Option ${newIdx + 1}`;
    onChange([
      ...accommodationOptions,
      {
        label: optionLabel,
        nights: defaultNights,
        totalPrice: 0,
      },
    ]);
    setActiveOptIdx(newIdx);
  }

  function removeOption(idx) {
    if (accommodationOptions.length <= 1) return;
    const updated = accommodationOptions.filter((_, i) => i !== idx);
    onChange(updated);
    if (activeOptIdx >= updated.length) {
      setActiveOptIdx(updated.length - 1);
    }
  }

  function updateOptionLabel(idx, label) {
    const updated = accommodationOptions.map((opt, i) =>
      i === idx ? { ...opt, label } : opt
    );
    onChange(updated);
  }

  // Helper to update all nights in a continuous stay leg
  function updateLegFields(leg, patch) {
    const updatedNights = optionNights.map((n) => {
      if (leg.nightNumbers.includes(n.night)) {
        return { ...n, ...patch };
      }
      return n;
    });
    updateActiveOptionNights(updatedNights);
  }

  function handleLegHotelChange(leg, hotelId) {
    const hotels = hotelsMap[leg.cityId] || [];
    const hotel = hotels.find((h) => h._id === hotelId);

    updateLegFields(leg, {
      hotelId,
      hotelName: hotel ? hotel.name : "",
      roomId: "",
      roomType: "",
      mealPlan: "",
      starRating: hotel ? hotel.starRating : null,
      pricePerNight: 0,
    });
    if (hotelId) fetchRooms(hotelId);
  }

  function handleLegRoomChange(leg, roomId, primaryNight) {
    const rooms = roomsMap[primaryNight.hotelId] || [];
    const room = rooms.find((r) => r._id === roomId);

    updateLegFields(leg, {
      roomId,
      roomType: room ? room.roomType : "",
      mealPlan: "",
      pricePerNight: 0,
    });
  }

  function handleLegMealPlanChange(leg, mealPlan, primaryNight) {
    const rooms = roomsMap[primaryNight.hotelId] || [];
    const room = rooms.find((r) => r._id === primaryNight.roomId);
    let price = 0;

    if (room && mealPlan) {
      for (const season of room.seasonalPricing || []) {
        const meal = (season.meals || []).find((m) => m.plan === mealPlan);
        if (meal) {
          price = meal.price || 0;
          break;
        }
      }
    }

    updateLegFields(leg, { mealPlan, pricePerNight: price });
  }

  function copyHotelToSameCityLegs(sourceLeg) {
    const primaryNight = optionNights.find((n) => n.night === sourceLeg.startNight);
    if (!primaryNight || !primaryNight.hotelId) return;

    const updated = optionNights.map((n) => {
      if (n.cityId === sourceLeg.cityId) {
        return {
          ...n,
          hotelId: primaryNight.hotelId,
          hotelName: primaryNight.hotelName,
          roomId: primaryNight.roomId,
          roomType: primaryNight.roomType,
          mealPlan: primaryNight.mealPlan,
          starRating: primaryNight.starRating,
          pricePerNight: primaryNight.pricePerNight,
        };
      }
      return n;
    });

    updateActiveOptionNights(updated);
  }

  const optionTotal = optionNights.reduce((s, n) => s + (n.pricePerNight || 0), 0);

  const selectCls =
    "w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white text-[13.5px] font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all appearance-none shadow-xs";

  const inputCls =
    "w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white text-[13.5px] font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all shadow-xs";

  return (
    <div className="space-y-6">
      {/* Category Option Tabs Bar */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-4.5 shadow-xs space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-[12px] font-black uppercase tracking-wider text-slate-400">
            Accommodation Tier Options
          </span>
          <button
            type="button"
            onClick={addOption}
            className="flex items-center gap-1.5 px-4 py-2 rounded-2xl text-[12.5px] font-extrabold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-all shadow-xs"
          >
            <Plus className="w-4 h-4" /> Add Accommodation Option
          </button>
        </div>

        <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-none">
          {accommodationOptions.map((opt, idx) => {
            const isActive = idx === activeOptIdx;
            const optTotal = (opt.nights || []).reduce((s, n) => s + (n.pricePerNight || 0), 0);

            return (
              <div
                key={idx}
                className={`flex items-center gap-2.5 px-4.5 py-3 rounded-2xl border transition-all cursor-pointer ${
                  isActive
                    ? "bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 border-indigo-600 text-white shadow-md shadow-indigo-500/25 font-bold scale-[1.02]"
                    : "bg-slate-50 border-slate-200/80 text-slate-800 hover:bg-white hover:border-slate-300"
                }`}
                onClick={() => setActiveOptIdx(idx)}
              >
                <Layers className={`w-4 h-4 ${isActive ? "text-indigo-200" : "text-slate-400"}`} />
                <input
                  type="text"
                  value={opt.label}
                  onChange={(e) => updateOptionLabel(idx, e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  className={`text-[13.5px] font-extrabold bg-transparent focus:outline-none border-b ${
                    isActive ? "border-indigo-300 text-white" : "border-transparent text-slate-900"
                  }`}
                  style={{ width: `${Math.max(opt.label.length, 8)}ch` }}
                />
                <span
                  className={`text-[11.5px] font-black px-2.5 py-1 rounded-full ${
                    isActive ? "bg-white/20 text-white" : "bg-white text-slate-800 shadow-xs"
                  }`}
                >
                  ₹{optTotal.toLocaleString()}
                </span>

                {accommodationOptions.length > 1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeOption(idx);
                    }}
                    className={`p-1 rounded-lg transition-colors ${
                      isActive ? "text-indigo-200 hover:text-white" : "text-slate-400 hover:text-rose-600"
                    }`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Continuous Stay Leg Cards ── */}
      <div className="space-y-5">
        {stayLegs.map((leg) => {
          const primaryNight =
            optionNights.find((n) => n.night === leg.startNight) || {};
          const hotels = hotelsMap[leg.cityId] || [];
          const rooms = roomsMap[primaryNight.hotelId] || [];
          const isLoadingH = loadingHotels[leg.cityId];
          const isLoadingR = loadingRooms[primaryNight.hotelId];

          const legTotalCost = (primaryNight.pricePerNight || 0) * leg.nightsCount;

          return (
            <div
              key={leg.legIdx}
              className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-5"
            >
              {/* Card Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 text-white text-[13px] font-black flex items-center justify-center shadow-xs">
                    {leg.nightsCount > 1
                      ? `N${leg.startNight}–${leg.endNight}`
                      : `N${leg.startNight}`}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-[16px] font-extrabold text-slate-900">
                        {leg.cityName}
                      </h3>
                      <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-[11px] font-extrabold">
                        {leg.nightsCount} {leg.nightsCount === 1 ? "Night Stay" : "Nights Stay (Continuous)"}
                      </span>
                    </div>
                    <p className="text-[12.5px] text-slate-500 font-medium mt-0.5">
                      {primaryNight.hotelName || `Select hotel for ${leg.cityName}`}
                    </p>
                  </div>
                </div>

                {primaryNight.hotelId && destinations.filter((d) => d.cityId === leg.cityId).length > 1 && (
                  <button
                    type="button"
                    onClick={() => copyHotelToSameCityLegs(leg)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 transition-all shadow-xs"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Copy to other {leg.cityName} stays
                  </button>
                )}
              </div>

              {/* Form Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Hotel */}
                <div>
                  <label className="block text-[12px] font-extrabold text-slate-800 uppercase tracking-wider mb-2">
                    Hotel ({leg.cityName})
                  </label>
                  {isLoadingH ? (
                    <div className="flex items-center gap-2 h-11 px-3 text-[12px] text-slate-400">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading hotels in {leg.cityName}…
                    </div>
                  ) : (
                    <select
                      value={primaryNight.hotelId || ""}
                      onChange={(e) => handleLegHotelChange(leg, e.target.value)}
                      className={selectCls}
                    >
                      <option value="">Select hotel in {leg.cityName}…</option>
                      {hotels.map((h) => (
                        <option key={h._id} value={h._id}>
                          {h.name} {h.starRating ? `(${h.starRating}★)` : ""}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Room Type */}
                <div>
                  <label className="block text-[12px] font-extrabold text-slate-800 uppercase tracking-wider mb-2">
                    Room Type
                  </label>
                  {isLoadingR ? (
                    <div className="flex items-center gap-2 h-11 px-3 text-[12px] text-slate-400">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading room types…
                    </div>
                  ) : (
                    <select
                      value={primaryNight.roomId || ""}
                      onChange={(e) => handleLegRoomChange(leg, e.target.value, primaryNight)}
                      disabled={!primaryNight.hotelId}
                      className={`${selectCls} ${!primaryNight.hotelId ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      <option value="">{primaryNight.hotelId ? "Select room type…" : "Select hotel first"}</option>
                      {rooms.map((r) => (
                        <option key={r._id} value={r._id}>
                          {r.roomType} (Max: {r.maxOccupancy} pax)
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Meal Plan */}
                <div>
                  <label className="block text-[12px] font-extrabold text-slate-800 uppercase tracking-wider mb-2">
                    Meal Plan
                  </label>
                  <select
                    value={primaryNight.mealPlan || ""}
                    onChange={(e) => handleLegMealPlanChange(leg, e.target.value, primaryNight)}
                    disabled={!primaryNight.roomId}
                    className={`${selectCls} ${!primaryNight.roomId ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    {MEAL_PLANS.map((mp) => (
                      <option key={mp.value} value={mp.value}>
                        {mp.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Star Rating */}
                <div>
                  <label className="block text-[12px] font-extrabold text-slate-800 uppercase tracking-wider mb-2">
                    Star Rating
                  </label>
                  <div className="flex gap-2 h-12 items-center bg-slate-50/70 px-4 rounded-2xl border border-slate-200/90">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4.5 h-4.5 transition-colors ${
                          (primaryNight.starRating ?? 0) >= star
                            ? "fill-amber-400 text-amber-400 drop-shadow-sm"
                            : "text-slate-300"
                        }`}
                      />
                    ))}
                    {!primaryNight.starRating && (
                      <span className="text-[11.5px] text-slate-400 ml-2 font-bold">Auto-filled</span>
                    )}
                  </div>
                </div>

                {/* Rate Per Night */}
                <div>
                  <label className="block text-[12px] font-extrabold text-slate-800 uppercase tracking-wider mb-2">
                    Price Per Night
                  </label>
                  <div className="flex items-center gap-2 h-12 px-4 rounded-2xl border border-slate-200 bg-slate-50">
                    <span className="text-[14px] text-slate-500 font-bold">₹</span>
                    <span className={`text-[16px] font-black ${primaryNight.pricePerNight > 0 ? "text-emerald-700" : "text-slate-400"}`}>
                      {primaryNight.pricePerNight > 0 ? primaryNight.pricePerNight.toLocaleString() : "—"}
                    </span>
                    <span className="text-[11px] text-slate-400 ml-auto font-medium">/ night</span>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-[12px] font-extrabold text-slate-800 uppercase tracking-wider mb-2">
                    Notes for {leg.cityName} Stay
                  </label>
                  <input
                    type="text"
                    value={primaryNight.notes || ""}
                    onChange={(e) => updateLegFields(leg, { notes: e.target.value })}
                    placeholder="e.g. Mountain-view suite, honeymoon setup"
                    className={inputCls}
                  />
                </div>
              </div>

              {/* Leg Cost Footer */}
              {leg.nightsCount > 1 && (
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-100 text-[13px]">
                  <span className="font-extrabold text-indigo-900">
                    Total for this {leg.nightsCount}-Night Stay in {leg.cityName}:
                  </span>
                  <span className="text-[15px] font-black text-indigo-900">
                    ₹{legTotalCost.toLocaleString()}{" "}
                    <span className="text-[11.5px] font-semibold text-indigo-600">
                      (₹{primaryNight.pricePerNight?.toLocaleString() || 0} × {leg.nightsCount} nights)
                    </span>
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Option Total Summary Banner */}
      <div className="rounded-3xl border border-emerald-300 bg-gradient-to-r from-emerald-500 via-teal-600 to-emerald-700 text-white p-5.5 flex items-center justify-between shadow-md shadow-emerald-500/20">
        <span className="text-[14.5px] font-extrabold text-emerald-50">
          Total for {currentOption?.label || "Option"} ({optionNights.length} Nights Total)
        </span>
        <span className="text-[22px] font-black text-white">
          ₹{optionTotal.toLocaleString()}
        </span>
      </div>
    </div>
  );
}
