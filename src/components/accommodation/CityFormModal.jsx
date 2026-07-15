"use client";

import { useState, useEffect } from "react";
import { X, Loader2, AlertCircle, MapPin } from "lucide-react";

const DEFAULT_FORM = { name: "", state: "", country: "India", description: "" };

/**
 * CityFormModal — create / edit a city.
 *
 * Props:
 *   city    {Object|null}  - Existing city for edit, null for create
 *   onClose {fn}
 *   onSaved {fn(city)}
 */
export default function CityFormModal({ city, onClose, onSaved }) {
  const isEdit = Boolean(city);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (city) {
      setForm({
        name: city.name || "",
        state: city.state || "",
        country: city.country || "India",
        description: city.description || "",
      });
    } else {
      setForm(DEFAULT_FORM);
    }
  }, [city]);

  function update(patch) {
    setForm((prev) => ({ ...prev, ...patch }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      const url = isEdit
        ? `/api/accommodation/cities/${city._id}`
        : "/api/accommodation/cities";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      onSaved(data.city);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const inputCls =
    "w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-[13px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all bg-white";
  const labelCls = "block text-[12px] font-medium text-gray-500 mb-1.5";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center">
              <MapPin className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-[16px] font-bold text-gray-900">
              {isEdit ? "Edit City" : "Add City"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            id="close-city-modal"
            aria-label="Close"
            className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-[13px]">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <div>
            <label htmlFor="city-name" className={labelCls}>City Name *</label>
            <input
              id="city-name"
              type="text"
              required
              value={form.name}
              onChange={(e) => update({ name: e.target.value })}
              placeholder="e.g. Manali"
              className={inputCls}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="city-state" className={labelCls}>State</label>
              <input
                id="city-state"
                type="text"
                value={form.state}
                onChange={(e) => update({ state: e.target.value })}
                placeholder="e.g. Himachal Pradesh"
                className={inputCls}
              />
            </div>
            <div>
              <label htmlFor="city-country" className={labelCls}>Country</label>
              <input
                id="city-country"
                type="text"
                value={form.country}
                onChange={(e) => update({ country: e.target.value })}
                placeholder="India"
                className={inputCls}
              />
            </div>
          </div>

          <div>
            <label htmlFor="city-description" className={labelCls}>Description (optional)</label>
            <textarea
              id="city-description"
              rows={2}
              value={form.description}
              onChange={(e) => update({ description: e.target.value })}
              placeholder="A brief note about this city…"
              className={`${inputCls} resize-none`}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              id="cancel-city-modal"
              className="px-4 py-2 rounded-xl border border-gray-200 text-[13px] font-medium text-gray-600 hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="save-city-btn"
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-violet-600 text-white text-[13px] font-semibold hover:bg-violet-700 transition-colors disabled:opacity-50"
            >
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {saving ? "Saving…" : isEdit ? "Save Changes" : "Add City"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
