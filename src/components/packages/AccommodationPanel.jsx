"use client";

import { useState, useEffect, useCallback } from "react";
import { Building2, Star, ChevronDown, Copy, Loader2 } from "lucide-react";

const MEAL_PLANS = [
  { value: "", label: "Select meal plan" },
  { value: "EP", label: "EP — Room Only" },
  { value: "CP", label: "CP — Bed & Breakfast" },
  { value: "MAP", label: "MAP — Breakfast + Dinner" },
  { value: "AP", label: "AP — All Meals" },
];

/**
 * AccommodationPanel — smart hotel/room lookup per night.
 *
 * Props:
 *   nights   {number}  - number of nights (determines rows)
 *   value    {Array}   - Array of accommodation objects
 *   onChange {fn}      - Called with the full updated array
 */
export default function AccommodationPanel({ nights, value = [], onChange }) {
  const [cities, setCities] = useState([]);
  const [hotelsMap, setHotelsMap] = useState({});   // { cityId: [hotels] }
  const [roomsMap, setRoomsMap] = useState({});     // { hotelId: [rooms] }
  const [loadingCities, setLoadingCities] = useState(true);
  const [loadingHotels, setLoadingHotels] = useState({});
  const [loadingRooms, setLoadingRooms] = useState({});

  // Normalise: ensure one entry per night
  const normalised = Array.from({ length: nights }, (_, i) => {
    const existing = value.find((a) => a.night === i + 1);
    return (
      existing || {
        night: i + 1,
        cityId: "",
        hotelId: "",
        roomId: "",
        hotelName: "",
        location: "",
        roomType: "",
        mealPlan: "",
        starRating: null,
        pricePerNight: 0,
        notes: "",
      }
    );
  });

  // Fetch cities on mount
  useEffect(() => {
    async function fetchCities() {
      try {
        const res = await fetch("/api/accommodation/cities");
        const data = await res.json();
        setCities(data.cities || []);
      } catch (err) {
        console.error("Failed to fetch cities:", err);
      } finally {
        setLoadingCities(false);
      }
    }
    fetchCities();
  }, []);

  // Fetch hotels for a city
  const fetchHotels = useCallback(async (cityId) => {
    if (!cityId || hotelsMap[cityId]) return;
    setLoadingHotels(prev => ({ ...prev, [cityId]: true }));
    try {
      const res = await fetch(`/api/accommodation/hotels?cityId=${cityId}`);
      const data = await res.json();
      setHotelsMap(prev => ({ ...prev, [cityId]: data.hotels || [] }));
    } catch (err) {
      console.error("Failed to fetch hotels:", err);
    } finally {
      setLoadingHotels(prev => ({ ...prev, [cityId]: false }));
    }
  }, [hotelsMap]);

  // Fetch rooms for a hotel
  const fetchRooms = useCallback(async (hotelId) => {
    if (!hotelId || roomsMap[hotelId]) return;
    setLoadingRooms(prev => ({ ...prev, [hotelId]: true }));
    try {
      const res = await fetch(`/api/accommodation/rooms?hotelId=${hotelId}`);
      const data = await res.json();
      setRoomsMap(prev => ({ ...prev, [hotelId]: data.rooms || [] }));
    } catch (err) {
      console.error("Failed to fetch rooms:", err);
    } finally {
      setLoadingRooms(prev => ({ ...prev, [hotelId]: false }));
    }
  }, [roomsMap]);

  // Auto-fetch hotels/rooms for any pre-populated data
  useEffect(() => {
    normalised.forEach(acc => {
      if (acc.cityId) fetchHotels(acc.cityId);
      if (acc.hotelId) fetchRooms(acc.hotelId);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function update(nightIdx, patch) {
    const updated = normalised.map((a, i) =>
      i === nightIdx ? { ...a, ...patch } : a
    );
    onChange(updated);
  }

  function handleCityChange(nightIdx, cityId) {
    const city = cities.find(c => c._id === cityId);
    update(nightIdx, {
      cityId,
      hotelId: "",
      roomId: "",
      hotelName: "",
      location: city ? `${city.name}${city.state ? `, ${city.state}` : ""}` : "",
      roomType: "",
      mealPlan: "",
      starRating: null,
      pricePerNight: 0,
    });
    if (cityId) fetchHotels(cityId);
  }

  function handleHotelChange(nightIdx, hotelId) {
    const acc = normalised[nightIdx];
    const hotels = hotelsMap[acc.cityId] || [];
    const hotel = hotels.find(h => h._id === hotelId);
    update(nightIdx, {
      hotelId,
      roomId: "",
      hotelName: hotel ? hotel.name : "",
      roomType: "",
      mealPlan: "",
      starRating: hotel ? hotel.starRating : null,
      pricePerNight: 0,
    });
    if (hotelId) fetchRooms(hotelId);
  }

  function handleRoomChange(nightIdx, roomId) {
    const acc = normalised[nightIdx];
    const rooms = roomsMap[acc.hotelId] || [];
    const room = rooms.find(r => r._id === roomId);
    update(nightIdx, {
      roomId,
      roomType: room ? room.roomType : "",
      mealPlan: "",
      pricePerNight: 0,
    });
  }

  function handleMealPlanChange(nightIdx, mealPlan) {
    const acc = normalised[nightIdx];
    const rooms = roomsMap[acc.hotelId] || [];
    const room = rooms.find(r => r._id === acc.roomId);
    let price = 0;

    if (room && mealPlan) {
      // Find the price from seasonal pricing
      // Use the first season that has a price for this meal plan
      for (const season of (room.seasonalPricing || [])) {
        const meal = (season.meals || []).find(m => m.plan === mealPlan);
        if (meal) {
          price = meal.price || 0;
          break;
        }
      }
    }

    update(nightIdx, { mealPlan, pricePerNight: price });
  }

  function copyToAllNights(sourceIdx) {
    const source = normalised[sourceIdx];
    const updated = normalised.map((a, i) => ({
      ...a,
      cityId: source.cityId,
      hotelId: source.hotelId,
      roomId: source.roomId,
      hotelName: source.hotelName,
      location: source.location,
      roomType: source.roomType,
      mealPlan: source.mealPlan,
      starRating: source.starRating,
      pricePerNight: source.pricePerNight,
    }));
    onChange(updated);
  }

  // Calculate total
  const accommodationTotal = normalised.reduce((sum, a) => sum + (a.pricePerNight || 0), 0);

  const selectCls =
    "w-full px-3 py-2.5 rounded-xl border border-gray-200 text-[13px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all bg-white appearance-none cursor-pointer";

  return (
    <div className="space-y-4">
      {normalised.map((acc, nightIdx) => {
        const hotels = hotelsMap[acc.cityId] || [];
        const rooms = roomsMap[acc.hotelId] || [];
        const isLoadingH = loadingHotels[acc.cityId];
        const isLoadingR = loadingRooms[acc.hotelId];

        return (
          <div
            key={nightIdx}
            className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
          >
            {/* Night Badge + Copy */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-[14px] font-semibold text-gray-900">
                    Night {acc.night}
                  </p>
                  <p className="text-[12px] text-gray-400">
                    {acc.hotelName || "Select accommodation below"}
                  </p>
                </div>
              </div>
              {acc.cityId && (
                <button
                  type="button"
                  onClick={() => copyToAllNights(nightIdx)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium text-violet-700 bg-violet-50 hover:bg-violet-100 border border-violet-200 transition-colors"
                >
                  <Copy className="w-3 h-3" />
                  Copy to all nights
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* City */}
              <div>
                <label className="block text-[12px] font-medium text-gray-500 mb-1.5">
                  City / Destination
                </label>
                {loadingCities ? (
                  <div className="flex items-center gap-2 h-10 px-3 text-[12px] text-gray-400">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading cities…
                  </div>
                ) : (
                  <select
                    value={acc.cityId || ""}
                    onChange={(e) => handleCityChange(nightIdx, e.target.value)}
                    className={selectCls}
                  >
                    <option value="">Select city…</option>
                    {cities.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}{c.state ? `, ${c.state}` : ""}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Hotel */}
              <div>
                <label className="block text-[12px] font-medium text-gray-500 mb-1.5">
                  Hotel / Property
                </label>
                {isLoadingH ? (
                  <div className="flex items-center gap-2 h-10 px-3 text-[12px] text-gray-400">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading hotels…
                  </div>
                ) : (
                  <select
                    value={acc.hotelId || ""}
                    onChange={(e) => handleHotelChange(nightIdx, e.target.value)}
                    disabled={!acc.cityId}
                    className={`${selectCls} ${!acc.cityId ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <option value="">{acc.cityId ? "Select hotel…" : "Select a city first"}</option>
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
                <label className="block text-[12px] font-medium text-gray-500 mb-1.5">
                  Room Type
                </label>
                {isLoadingR ? (
                  <div className="flex items-center gap-2 h-10 px-3 text-[12px] text-gray-400">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading rooms…
                  </div>
                ) : (
                  <select
                    value={acc.roomId || ""}
                    onChange={(e) => handleRoomChange(nightIdx, e.target.value)}
                    disabled={!acc.hotelId}
                    className={`${selectCls} ${!acc.hotelId ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <option value="">{acc.hotelId ? "Select room type…" : "Select a hotel first"}</option>
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
                <label className="block text-[12px] font-medium text-gray-500 mb-1.5">
                  Meal Plan
                </label>
                <select
                  value={acc.mealPlan}
                  onChange={(e) => handleMealPlanChange(nightIdx, e.target.value)}
                  disabled={!acc.roomId}
                  className={`${selectCls} ${!acc.roomId ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  {MEAL_PLANS.map((mp) => (
                    <option key={mp.value} value={mp.value}>
                      {mp.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Star Rating (auto-filled, read-only) */}
              <div>
                <label className="block text-[12px] font-medium text-gray-500 mb-1.5">
                  Star Rating
                </label>
                <div className="flex gap-1.5 h-10 items-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-5 h-5 transition-colors ${
                        (acc.starRating ?? 0) >= star
                          ? "fill-amber-400 text-amber-400"
                          : "text-gray-200"
                      }`}
                    />
                  ))}
                  {!acc.starRating && (
                    <span className="text-[11px] text-gray-400 ml-1">Auto-filled from hotel</span>
                  )}
                </div>
              </div>

              {/* Price Per Night (auto-filled) */}
              <div>
                <label className="block text-[12px] font-medium text-gray-500 mb-1.5">
                  Price Per Night
                </label>
                <div className="flex items-center gap-2 h-10 px-3.5 rounded-xl border border-gray-200 bg-gray-50">
                  <span className="text-[13px] text-gray-500">₹</span>
                  <span className={`text-[14px] font-semibold ${acc.pricePerNight > 0 ? "text-emerald-700" : "text-gray-400"}`}>
                    {acc.pricePerNight > 0 ? acc.pricePerNight.toLocaleString() : "—"}
                  </span>
                  {acc.pricePerNight > 0 && (
                    <span className="text-[10px] text-gray-400 ml-auto">per night</span>
                  )}
                </div>
              </div>

              {/* Notes */}
              <div className="sm:col-span-2">
                <label className="block text-[12px] font-medium text-gray-500 mb-1.5">
                  Notes (optional)
                </label>
                <input
                  type="text"
                  value={acc.notes}
                  onChange={(e) => update(nightIdx, { notes: e.target.value })}
                  placeholder="e.g. Mountain-view room, early check-in requested"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-[13px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all bg-white"
                />
              </div>
            </div>
          </div>
        );
      })}

      {/* Total */}
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 flex items-center justify-between">
        <span className="text-[13px] font-medium text-emerald-800">
          Total Accommodation Cost ({nights} night{nights > 1 ? "s" : ""})
        </span>
        <span className="text-[18px] font-bold text-emerald-700">
          ₹{accommodationTotal.toLocaleString()}
        </span>
      </div>
    </div>
  );
}
