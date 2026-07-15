"use client";

import { useState, useEffect } from "react";
import { X, Plus, Trash2, Loader2, AlertCircle, BedDouble } from "lucide-react";

const DEFAULT_FORM = {
  roomType: "",
  basePrice: "",
  maxOccupancy: 2,
  meals: [],
  features: [],
  activities: [],
};

/**
 * RoomFormModal — create / edit a room.
 *
 * Props:
 *   hotelId  {string}       - Hotel this room belongs to
 *   room     {Object|null}  - Existing room for edit, null for create
 *   onClose  {fn}
 *   onSaved  {fn(room)}
 */
export default function RoomFormModal({ hotelId, room, onClose, onSaved }) {
  const isEdit = Boolean(room);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [newFeature, setNewFeature] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (room) {
      setForm({
        roomType: room.roomType || "",
        basePrice: room.basePrice ?? "",
        maxOccupancy: room.maxOccupancy ?? 2,
        meals: room.meals || [],
        features: room.features || [],
        activities: room.activities || [],
      });
    } else {
      setForm(DEFAULT_FORM);
    }
  }, [room]);

  function update(patch) {
    setForm((prev) => ({ ...prev, ...patch }));
  }

  // ── Features ──────────────────────────────────────────────────────────────
  function addFeature() {
    const f = newFeature.trim();
    if (!f || form.features.includes(f)) return;
    update({ features: [...form.features, f] });
    setNewFeature("");
  }

  function removeFeature(i) {
    update({ features: form.features.filter((_, idx) => idx !== i) });
  }

  // ── Meals ─────────────────────────────────────────────────────────────────
  function addMeal() {
    update({ meals: [...form.meals, { name: "", price: "" }] });
  }

  function updateMeal(i, patch) {
    const updated = form.meals.map((m, idx) => (idx === i ? { ...m, ...patch } : m));
    update({ meals: updated });
  }

  function removeMeal(i) {
    update({ meals: form.meals.filter((_, idx) => idx !== i) });
  }

  // ── Activities ────────────────────────────────────────────────────────────
  function addActivity() {
    update({ activities: [...form.activities, { name: "", price: "" }] });
  }

  function updateActivity(i, patch) {
    const updated = form.activities.map((a, idx) =>
      idx === i ? { ...a, ...patch } : a
    );
    update({ activities: updated });
  }

  function removeActivity(i) {
    update({ activities: form.activities.filter((_, idx) => idx !== i) });
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);

    const payload = {
      ...form,
      hotel: hotelId,
      basePrice: parseFloat(form.basePrice) || 0,
      maxOccupancy: parseInt(form.maxOccupancy, 10) || 2,
      meals: form.meals
        .filter((m) => m.name.trim())
        .map((m) => ({ name: m.name.trim(), price: parseFloat(m.price) || 0 })),
      activities: form.activities
        .filter((a) => a.name.trim())
        .map((a) => ({ name: a.name.trim(), price: parseFloat(a.price) || 0 })),
    };

    try {
      const url = isEdit
        ? `/api/accommodation/rooms/${room._id}`
        : "/api/accommodation/rooms";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      onSaved(data.room);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const inputCls =
    "w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-[13px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all bg-white";
  const labelCls = "block text-[12px] font-medium text-gray-500 mb-1.5";
  const addRowBtn =
    "flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-[12px] font-medium hover:bg-indigo-100 transition-colors";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center">
              <BedDouble className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-[16px] font-bold text-gray-900">
              {isEdit ? "Edit Room" : "Add Room"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            id="close-room-modal"
            aria-label="Close"
            className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
          {error && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-[13px]">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Room type + Occupancy */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="room-type" className={labelCls}>Room Type *</label>
              <input
                id="room-type"
                type="text"
                required
                value={form.roomType}
                onChange={(e) => update({ roomType: e.target.value })}
                placeholder="e.g. Deluxe Double, Suite"
                className={inputCls}
              />
            </div>
            <div>
              <label htmlFor="room-occupancy" className={labelCls}>Max Occupancy</label>
              <input
                id="room-occupancy"
                type="number"
                min={1}
                max={20}
                value={form.maxOccupancy}
                onChange={(e) => update({ maxOccupancy: e.target.value })}
                className={inputCls}
              />
            </div>
          </div>

          {/* Base price */}
          <div>
            <label htmlFor="room-price" className={labelCls}>Base Price / Night (₹)</label>
            <input
              id="room-price"
              type="number"
              min={0}
              value={form.basePrice}
              onChange={(e) => update({ basePrice: e.target.value })}
              placeholder="e.g. 2500"
              className={inputCls}
            />
          </div>

          {/* Meal options */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className={`${labelCls} mb-0`}>Meal Options</label>
              <button type="button" id="add-meal-btn" onClick={addMeal} className={addRowBtn}>
                <Plus className="w-3.5 h-3.5" /> Add Meal
              </button>
            </div>
            {form.meals.length === 0 ? (
              <p className="text-[12px] text-gray-400 italic">
                No meals added. Click "Add Meal" to include meal plans with pricing.
              </p>
            ) : (
              <div className="space-y-2">
                {form.meals.map((m, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={m.name}
                      onChange={(e) => updateMeal(i, { name: e.target.value })}
                      placeholder="e.g. Breakfast, All Meals"
                      className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-[12px] bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
                    />
                    <span className="text-[12px] text-gray-500 flex-shrink-0">₹</span>
                    <input
                      type="number"
                      min={0}
                      value={m.price}
                      onChange={(e) => updateMeal(i, { price: e.target.value })}
                      placeholder="Price"
                      aria-label="Meal price"
                      className="w-24 px-2.5 py-2 rounded-lg border border-gray-200 text-[12px] bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
                    />
                    <span className="text-[11px] text-gray-400 flex-shrink-0">/person</span>
                    <button
                      type="button"
                      onClick={() => removeMeal(i)}
                      aria-label="Remove meal"
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Room features */}
          <div>
            <label className={labelCls}>Room Features</label>
            {form.features.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {form.features.map((f, i) => (
                  <span
                    key={i}
                    className="flex items-center gap-1.5 px-3 py-1 bg-violet-50 border border-violet-200 rounded-full text-[12px] text-violet-700 font-medium"
                  >
                    {f}
                    <button
                      type="button"
                      onClick={() => removeFeature(i)}
                      aria-label={`Remove ${f}`}
                      className="text-violet-400 hover:text-violet-700"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                id="new-room-feature"
                value={newFeature}
                onChange={(e) => setNewFeature(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && (e.preventDefault(), addFeature())
                }
                placeholder="e.g. AC, Mountain View, King Bed…"
                className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-[13px] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
              />
              <button
                type="button"
                id="add-room-feature-btn"
                onClick={addFeature}
                className="px-3 py-2 rounded-lg bg-violet-600 text-white hover:bg-violet-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Activities */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className={`${labelCls} mb-0`}>Activities / Add-ons</label>
              <button
                type="button"
                id="add-activity-btn"
                onClick={addActivity}
                className={addRowBtn}
              >
                <Plus className="w-3.5 h-3.5" /> Add Activity
              </button>
            </div>
            {form.activities.length === 0 ? (
              <p className="text-[12px] text-gray-400 italic">
                No activities added. e.g. Room Decoration, Candlelight Dinner.
              </p>
            ) : (
              <div className="space-y-2">
                {form.activities.map((a, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={a.name}
                      onChange={(e) => updateActivity(i, { name: e.target.value })}
                      placeholder="e.g. Room Decoration"
                      className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-[12px] bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
                    />
                    <span className="text-[12px] text-gray-500 flex-shrink-0">₹</span>
                    <input
                      type="number"
                      min={0}
                      value={a.price}
                      onChange={(e) => updateActivity(i, { price: e.target.value })}
                      placeholder="Price"
                      aria-label="Activity price"
                      className="w-24 px-2.5 py-2 rounded-lg border border-gray-200 text-[12px] bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => removeActivity(i)}
                      aria-label="Remove activity"
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
          <button
            type="button"
            onClick={onClose}
            id="cancel-room-modal"
            className="px-4 py-2 rounded-xl border border-gray-200 text-[13px] font-medium text-gray-600 hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            id="save-room-btn"
            onClick={handleSubmit}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-violet-600 text-white text-[13px] font-semibold hover:bg-violet-700 transition-colors disabled:opacity-50"
          >
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {saving ? "Saving…" : isEdit ? "Save Changes" : "Add Room"}
          </button>
        </div>
      </div>
    </div>
  );
}
