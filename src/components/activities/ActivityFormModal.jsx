"use client";

import { useState, useEffect } from "react";
import { X, Loader2, AlertCircle, MapPin, Zap } from "lucide-react";

import AccommodationImageUploader from "@/components/accommodation/AccommodationImageUploader";

const CATEGORIES = [
  { value: "sightseeing", label: "🔭 Sightseeing" },
  { value: "adventure",   label: "⛰ Adventure"   },
  { value: "cultural",    label: "🎭 Cultural"    },
  { value: "leisure",     label: "🌿 Leisure"     },
];

const DURATION_PRESETS = [
  "30 mins", "1 hour", "1-2 hours", "2-3 hours",
  "Half Day", "Full Day", "Overnight",
];

const DEFAULT_FORM = {
  name:                 "",
  description:          "",
  category:             "sightseeing",
  duration:             "",
  price:                0,
  adultPrice:           0,
  childPrice:           0,
  isStandaloneSaleable: true,
  slots:                "09:00 AM, 02:00 PM",
  inclusions:           "Safety Gear, Entry Ticket",
  isHighlight:          false,
  hotel:                "",
  images:               [],
};

const inputCls =
  "w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-[13.5px] " +
  "font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none " +
  "focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all bg-white";

/**
 * ActivityFormModal — Create / Edit an activity for a city.
 *
 * Props:
 *   cityId    {string}   - City this activity belongs to
 *   cityName  {string}   - For display purposes
 *   activity  {Object|null} - null = create mode, object = edit mode
 *   onClose   {fn}
 *   onSaved   {fn(savedActivity)}
 */
export default function ActivityFormModal({
  cityId,
  cityName,
  activity,
  onClose,
  onSaved,
}) {
  const isEdit = Boolean(activity);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [hotels, setHotels] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Populate form when editing
  useEffect(() => {
    if (activity) {
      setForm({
        name:                 activity.name                 || "",
        description:          activity.description          || "",
        category:             activity.category             || "sightseeing",
        duration:             activity.duration             || "",
        price:                activity.price                ?? 0,
        adultPrice:           activity.pricingTiers?.adultPrice ?? activity.price ?? 0,
        childPrice:           activity.pricingTiers?.childPrice ?? 0,
        isStandaloneSaleable: activity.isStandaloneSaleable ?? true,
        slots:                (activity.availableSlots || []).map((s) => s.time).join(", ") || "09:00 AM, 02:00 PM",
        inclusions:           (activity.inclusions || []).join(", ") || "",
        isHighlight:          activity.isHighlight          || false,
        hotel:                activity.hotel?._id           || activity.hotel || "",
        images:               activity.images               || [],
      });
    } else {
      setForm(DEFAULT_FORM);
    }
  }, [activity]);

  // Fetch hotels for optional hotel association
  useEffect(() => {
    if (!cityId) return;
    fetch(`/api/accommodation/hotels?cityId=${cityId}`)
      .then((r) => r.json())
      .then((data) => setHotels(data.hotels || []))
      .catch(() => {});
  }, [cityId]);

  function patch(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!form.name.trim()) {
      setError("Activity name is required.");
      return;
    }

    setSaving(true);
    try {
      const parsedPrice = parseFloat(form.price) || 0;
      const parsedAdultPrice = parseFloat(form.adultPrice) || parsedPrice;
      const parsedChildPrice = parseFloat(form.childPrice) || 0;

      const slotArray = (form.slots || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .map((t) => ({ time: t, capacity: 20 }));

      const inclusionArray = (form.inclusions || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const payload = {
        ...form,
        price: parsedPrice,
        pricingTiers: {
          adultPrice: parsedAdultPrice,
          childPrice: parsedChildPrice,
        },
        availableSlots: slotArray,
        inclusions: inclusionArray,
        city:  cityId,
        hotel: form.hotel || null,
      };

      const url    = isEdit ? `/api/activities/${activity._id}` : "/api/activities";
      const method = isEdit ? "PUT" : "POST";

      const res  = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to save");

      onSaved(data.activity);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-700 px-6 py-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-200 mb-0.5">
                {isEdit ? "Edit Activity" : "New Activity"}
              </p>
              <h2 className="text-[18px] font-black leading-tight">
                {cityName || "Activity"}
              </h2>
            </div>
            <button
              type="button"
              id="close-activity-modal"
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-[13px]">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-[11.5px] font-extrabold text-gray-700 uppercase tracking-wider mb-1.5">
              Activity Name *
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => patch("name", e.target.value)}
              placeholder="e.g. Tea Plantation Tour"
              className={inputCls}
              required
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-[11.5px] font-extrabold text-gray-700 uppercase tracking-wider mb-1.5">
              Category
            </label>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => patch("category", cat.value)}
                  className={`px-3.5 py-2.5 rounded-xl border text-[12.5px] font-bold text-left transition-all ${
                    form.category === cat.value
                      ? "bg-indigo-50 border-indigo-400 text-indigo-800 shadow-sm"
                      : "bg-white border-gray-200 text-gray-600 hover:border-indigo-200"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-[11.5px] font-extrabold text-gray-700 uppercase tracking-wider mb-1.5">
              Duration
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {DURATION_PRESETS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => patch("duration", d)}
                  className={`px-3 py-1 rounded-full text-[11px] font-semibold border transition-all ${
                    form.duration === d
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-gray-50 text-gray-600 border-gray-200 hover:border-indigo-300"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={form.duration}
              onChange={(e) => patch("duration", e.target.value)}
              placeholder="Or type custom duration…"
              className={inputCls}
            />
          </div>

          {/* Price & Standalone Tiers */}
          <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[12px] font-extrabold text-indigo-950 uppercase tracking-wider">
                🛒 Standalone Direct Ticket Selling
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isStandaloneSaleable}
                  onChange={(e) => patch("isStandaloneSaleable", e.target.checked)}
                  className="w-4 h-4 rounded accent-indigo-600"
                />
                <span className="text-[11.5px] font-bold text-indigo-700">Enable Direct Sales</span>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                  Adult Ticket Rate (₹)
                </label>
                <input
                  type="number"
                  min={0}
                  step={50}
                  value={form.adultPrice || form.price}
                  onChange={(e) => {
                    const val = e.target.value;
                    patch("adultPrice", val);
                    patch("price", val);
                  }}
                  onWheel={(e) => e.target.blur()}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                  Child Ticket Rate (₹)
                </label>
                <input
                  type="number"
                  min={0}
                  step={50}
                  value={form.childPrice}
                  onChange={(e) => patch("childPrice", e.target.value)}
                  onWheel={(e) => e.target.blur()}
                  placeholder="e.g. 300"
                  className={inputCls}
                />
              </div>
            </div>

            {/* Time slots */}
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">
                Available Booking Time Slots (Comma-separated)
              </label>
              <input
                type="text"
                value={form.slots}
                onChange={(e) => patch("slots", e.target.value)}
                placeholder="e.g. 09:00 AM, 11:30 AM, 03:00 PM"
                className={inputCls}
              />
            </div>

            {/* Inclusions */}
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">
                Ticket Inclusions (Comma-separated)
              </label>
              <input
                type="text"
                value={form.inclusions}
                onChange={(e) => patch("inclusions", e.target.value)}
                placeholder="e.g. Entry Ticket, Safety Gear, Tea Tasting"
                className={inputCls}
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-[11.5px] font-extrabold text-gray-700 uppercase tracking-wider mb-1.5">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => patch("description", e.target.value)}
              placeholder="What's included, highlights, tips…"
              rows={3}
              className={`${inputCls} resize-none`}
            />
          </div>

          {/* Hotel (optional) */}
          {hotels.length > 0 && (
            <div>
              <label className="block text-[11.5px] font-extrabold text-gray-700 uppercase tracking-wider mb-1.5">
                Hotel (optional — for hotel-specific activity)
              </label>
              <select
                value={form.hotel}
                onChange={(e) => patch("hotel", e.target.value)}
                className={inputCls}
              >
                <option value="">No specific hotel — city-wide activity</option>
                {hotels.map((h) => (
                  <option key={h._id} value={h._id}>
                    {h.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Optional Images */}
          <div>
            <AccommodationImageUploader
              images={form.images || []}
              onChange={(imgs) => patch("images", imgs)}
              maxImages={4}
              label="Activity Photos (Optional)"
              required={false}
            />
          </div>

          {/* Highlight */}
          <label className="flex items-center gap-3 cursor-pointer select-none p-3.5 rounded-xl border border-gray-200 hover:border-amber-300 hover:bg-amber-50/40 transition-all">
            <input
              type="checkbox"
              checked={form.isHighlight}
              onChange={(e) => patch("isHighlight", e.target.checked)}
              className="w-4 h-4 rounded accent-amber-500"
            />
            <div>
              <p className="text-[13px] font-bold text-gray-800">Mark as Package Highlight</p>
              <p className="text-[11px] text-gray-400">This activity will appear in the package highlights list.</p>
            </div>
          </label>

          {/* Submit */}
          <button
            type="submit"
            id="save-activity-btn"
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-[14px] font-extrabold shadow-md shadow-indigo-500/25 transition-all disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Zap className="w-4 h-4" />
            )}
            {saving ? "Saving…" : isEdit ? "Update Activity" : "Create Activity"}
          </button>
        </form>
      </div>
    </div>
  );
}
