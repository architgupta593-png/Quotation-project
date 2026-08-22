"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Building2, Star, Plus, Trash2, MapPin, Hotel, Check,
  Search, X, Sparkles, BedDouble, Utensils, Info, CheckCircle2,
  Calendar, Layers,
} from "lucide-react";

const MEAL_PLANS = [
  { id: "CP", label: "CP", title: "Bed & Breakfast", sub: "Breakfast Included" },
  { id: "MAP", label: "MAP", title: "Half Board", sub: "Bfast + Dinner" },
  { id: "AP", label: "AP", title: "Full Board", sub: "All Meals (B+L+D)" },
  { id: "EP", label: "EP", title: "Room Only", sub: "No Meals" },
];

const ROOM_PRESETS = [
  "Deluxe AC Room",
  "Super Deluxe AC Room",
  "Premium Valley View Room",
  "Executive Suite",
  "Luxury Pool Villa",
  "Houseboat AC Cabin",
  "Heritage Cottage",
];

export default function QuickAccommodationSection({
  hotelStays = [],
  onChange,
  totalNights = 4,
  primaryDestination = "",
}) {
  const [catalogHotels, setCatalogHotels] = useState([]);
  const [loadingHotels, setLoadingHotels] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [starFilter, setStarFilter] = useState("ALL");
  const [selectingLegIdx, setSelectingLegIdx] = useState(null); // When set, opens catalog picker modal

  // Fetch catalog hotels for quick search
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

  // Helper to calculate total allocated nights across stays
  const currentStays = hotelStays.length > 0 ? hotelStays : [
    {
      nightNumber: 1,
      cityName: primaryDestination || "",
      hotelName: "",
      starRating: 3,
      roomType: "Deluxe AC Room",
      mealPlan: "CP",
      pricePerNight: 0,
      notes: "",
    },
  ];

  function handleStayChange(idx, field, value) {
    const updated = [...currentStays];
    updated[idx] = {
      ...updated[idx],
      [field]: value,
    };
    onChange(updated);
  }

  function handleSelectCatalogHotel(legIdx, hotelObj) {
    if (!hotelObj) return;

    const updated = [...currentStays];
    updated[legIdx] = {
      ...updated[legIdx],
      hotelName: hotelObj.name || updated[legIdx].hotelName,
      cityName: hotelObj.city?.name || updated[legIdx].cityName || primaryDestination,
      starRating: hotelObj.starRating || updated[legIdx].starRating || 3,
    };
    onChange(updated);
    setSelectingLegIdx(null);
  }

  function handleAddStay() {
    const nextNight = currentStays.length + 1;
    const lastStay = currentStays[currentStays.length - 1];

    const newStay = {
      nightNumber: nextNight,
      cityName: lastStay?.cityName || primaryDestination || "",
      hotelName: "",
      starRating: 3,
      roomType: "Deluxe AC Room",
      mealPlan: "CP",
      pricePerNight: 0,
      notes: "",
    };
    onChange([...currentStays, newStay]);
  }

  function handleRemoveStay(idx) {
    if (currentStays.length <= 1) return;
    const updated = currentStays
      .filter((_, i) => i !== idx)
      .map((st, i) => ({ ...st, nightNumber: i + 1 }));
    onChange(updated);
  }

  function handleAutoDistributeNights() {
    // Generate night-by-night breakdown matching totalNights
    const generated = [];
    for (let i = 1; i <= totalNights; i++) {
      const existing = currentStays[i - 1];
      generated.push({
        nightNumber: i,
        cityName: existing?.cityName || primaryDestination || "Destination",
        hotelName: existing?.hotelName || "",
        starRating: existing?.starRating || 3,
        roomType: existing?.roomType || "Deluxe AC Room",
        mealPlan: existing?.mealPlan || "CP",
        pricePerNight: existing?.pricePerNight || 0,
        notes: existing?.notes || "",
      });
    }
    onChange(generated);
  }

  // Filtered hotels in catalog modal
  const filteredCatalogHotels = catalogHotels.filter((h) => {
    const matchesSearch = searchQuery.trim() === "" ||
      h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (h.city?.name && h.city.name.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStar = starFilter === "ALL" || String(h.starRating) === String(starFilter);
    return matchesSearch && matchesStar;
  });

  return (
    <div className="bg-white rounded-3xl border-2 border-slate-200/90 hover:border-amber-400/70 p-6 sm:p-8 shadow-xs transition-all space-y-5">
      {/* ── Section Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500 via-amber-600 to-orange-600 text-white flex items-center justify-center font-black shadow-md shadow-amber-500/25">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-[17px] font-black text-slate-900">Hotel Accommodation Portfolio</h3>
              <span className="text-[10.5px] font-black text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 shadow-2xs">
                {currentStays.length} Stays Logged
              </span>
            </div>
            <p className="text-[12px] text-slate-400 font-semibold mt-0.5">
              Night-by-night luxury &amp; standard stay options, room types &amp; meal plans
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap self-end sm:self-auto">
          {currentStays.length < totalNights && (
            <button
              type="button"
              onClick={handleAutoDistributeNights}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-200 text-[12px] font-black transition-all shadow-2xs"
              title="Auto-fill stay legs to cover all trip nights"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Fill {totalNights} Nights</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleAddStay}
            className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-[12.5px] transition-all shadow-2xs hover:scale-105 active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 text-amber-400" />
            <span>Add Night Stay</span>
          </button>
        </div>
      </div>

      {/* ── Modern Stay Cards Stream ── */}
      <div className="space-y-4">
        {currentStays.map((stay, idx) => (
          <div
            key={idx}
            className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-slate-50/90 via-white to-amber-50/20 border-2 border-slate-200/90 hover:border-amber-400 transition-all shadow-xs space-y-4"
          >
            {/* Top Bar: Night Badge, Leg Count & Catalog Picker Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="px-3 py-1 rounded-xl bg-slate-900 text-amber-400 font-mono font-black text-[12px] shadow-xs">
                  NIGHT {stay.nightNumber || idx + 1}
                </div>
                <span className="text-[12px] font-bold text-slate-500">
                  Stay Leg {idx + 1} of {currentStays.length}
                </span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* 1-Click Catalog Hotel Browser */}
                <button
                  type="button"
                  onClick={() => setSelectingLegIdx(idx)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-amber-50 text-slate-700 hover:text-amber-900 border border-slate-200 hover:border-amber-300 font-bold text-[11.5px] transition-all shadow-2xs"
                  title="Browse verified hotels from master database"
                >
                  <Search className="w-3.5 h-3.5 text-amber-600" />
                  <span>Choose from Hotel Catalog</span>
                </button>

                {currentStays.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveStay(idx)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-rose-600 hover:bg-rose-50 font-bold text-[11.5px] transition-colors"
                    title="Remove stay"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Remove</span>
                  </button>
                )}
              </div>
            </div>

            {/* City, Hotel Name & Star Rating Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
              {/* Destination / City */}
              <div className="sm:col-span-4">
                <label className="block text-[11.5px] font-bold text-slate-600 mb-1">
                  Destination / City *
                </label>
                <div className="relative">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={stay.cityName || ""}
                    onChange={(e) => handleStayChange(idx, "cityName", e.target.value)}
                    placeholder="e.g. Munnar"
                    className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 bg-white font-bold text-[13px] text-slate-900 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 shadow-2xs"
                  />
                </div>
              </div>

              {/* Hotel / Resort Name */}
              <div className="sm:col-span-5">
                <label className="block text-[11.5px] font-bold text-slate-600 mb-1">
                  Hotel Name / Resort *
                </label>
                <div className="relative">
                  <Hotel className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={stay.hotelName || ""}
                    onChange={(e) => handleStayChange(idx, "hotelName", e.target.value)}
                    placeholder="e.g. Tea County Resort / Grand Hyatt"
                    className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 bg-white font-bold text-[13px] text-slate-900 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 shadow-2xs"
                  />
                </div>
              </div>

              {/* Interactive Star Rating */}
              <div className="sm:col-span-3">
                <label className="block text-[11.5px] font-bold text-slate-600 mb-1">
                  Star Category
                </label>
                <div className="flex items-center justify-between bg-white p-1.5 px-2.5 rounded-xl border border-slate-200 shadow-2xs">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => handleStayChange(idx, "starRating", star)}
                        className="focus:outline-none transition-transform hover:scale-125"
                        title={`${star} Star Hotel`}
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
                  <span className="text-[11.5px] font-black text-slate-700 ml-1">
                    {stay.starRating || 3}★
                  </span>
                </div>
              </div>
            </div>

            {/* Meal Plan Pills & Room Category */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2 border-t border-slate-100 items-start">
              {/* Meal Plan Selectors */}
              <div className="sm:col-span-6 space-y-1.5">
                <label className="block text-[11.5px] font-bold text-slate-600">
                  Included Meal Plan
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {MEAL_PLANS.map((mp) => {
                    const isSel = (stay.mealPlan || "CP") === mp.id;
                    return (
                      <button
                        key={mp.id}
                        type="button"
                        onClick={() => handleStayChange(idx, "mealPlan", mp.id)}
                        className={`p-2 rounded-xl text-left transition-all border ${
                          isSel
                            ? "bg-amber-500 text-white border-amber-600 shadow-2xs"
                            : "bg-white text-slate-700 hover:bg-slate-50 border-slate-200"
                        }`}
                      >
                        <div className="font-black text-[12px] leading-tight">{mp.label}</div>
                        <div className={`text-[9.5px] ${isSel ? "text-amber-100" : "text-slate-400"} font-medium leading-tight truncate`}>
                          {mp.sub}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Room Category with Fast Presets */}
              <div className="sm:col-span-6 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-[11.5px] font-bold text-slate-600">
                    Room Category / Type
                  </label>
                </div>
                <input
                  type="text"
                  value={stay.roomType || ""}
                  onChange={(e) => handleStayChange(idx, "roomType", e.target.value)}
                  placeholder="e.g. Deluxe AC Room"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-[12.5px] font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 shadow-2xs"
                />

                {/* 1-Click Room Presets */}
                <div className="flex items-center gap-1 overflow-x-auto pt-1">
                  <span className="text-[10px] font-black uppercase text-slate-400 whitespace-nowrap">Presets:</span>
                  {ROOM_PRESETS.slice(0, 4).map((preset, pIdx) => (
                    <button
                      key={pIdx}
                      type="button"
                      onClick={() => handleStayChange(idx, "roomType", preset)}
                      className="px-2 py-0.5 rounded-md bg-white hover:bg-amber-50 text-slate-600 hover:text-amber-900 border border-slate-200 text-[10.5px] font-medium whitespace-nowrap transition-colors"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── 🌟 Hotel Catalog Browser Modal ── */}
      {selectingLegIdx !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm"
            onClick={() => setSelectingLegIdx(null)}
          />

          {/* Modal Container */}
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden border border-slate-200 flex flex-col max-h-[88vh] animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="bg-slate-950 p-4 px-6 text-white flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-[16px] font-black text-white leading-tight">
                    Select Hotel for Night {selectingLegIdx + 1}
                  </h3>
                  <p className="text-[11.5px] text-slate-400">
                    Search and pick from verified catalog hotels
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectingLegIdx(null)}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Filter Bar */}
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

              {/* Star Filter Pills */}
              <div className="flex items-center gap-1">
                {["ALL", "3", "4", "5"].map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStarFilter(st)}
                    className={`px-3 py-1.5 rounded-xl text-[11.5px] font-bold transition-all border ${
                      starFilter === st
                        ? "bg-slate-900 text-white border-slate-900 shadow-2xs"
                        : "bg-white text-slate-600 hover:bg-slate-100 border-slate-200"
                    }`}
                  >
                    {st === "ALL" ? "All Stars" : `${st}★`}
                  </button>
                ))}
              </div>
            </div>

            {/* Hotels List */}
            <div className="p-5 overflow-y-auto flex-1 space-y-2.5">
              {filteredCatalogHotels.length === 0 ? (
                <div className="text-center py-12 space-y-2">
                  <Hotel className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-[14px] font-bold text-slate-700">No matching hotels found</p>
                  <p className="text-[12px] text-slate-400">You can also type any custom hotel name directly in the field.</p>
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
                        {h.starRating && (
                          <span className="px-2 py-0.2 rounded-md bg-amber-100 text-amber-900 font-black text-[10.5px]">
                            {h.starRating}★
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-[12px] text-slate-500 font-medium">
                        {h.city?.name && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            {h.city.name}
                          </span>
                        )}
                        {h.address && <span className="truncate max-w-xs">{h.address}</span>}
                      </div>
                    </div>

                    <button
                      type="button"
                      className="px-4 py-1.5 rounded-xl bg-amber-50 group-hover:bg-amber-500 text-amber-900 group-hover:text-white border border-amber-200 group-hover:border-amber-600 font-black text-[12px] transition-all flex-shrink-0"
                    >
                      Select
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Modal Footer */}
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
