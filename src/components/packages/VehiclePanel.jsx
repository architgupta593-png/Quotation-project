"use client";

import { Car, Users, Check } from "lucide-react";

const VEHICLE_TYPES = [
  { type: "Sedan", label: "Sedan", defaultSeats: 4 },
  { type: "SUV", label: "SUV", defaultSeats: 6 },
  { type: "MUV", label: "MUV", defaultSeats: 7 },
  { type: "Tempo Traveller", label: "Tempo", defaultSeats: 12 },
  { type: "Mini Bus", label: "Mini Bus", defaultSeats: 21 },
  { type: "Bus", label: "Bus", defaultSeats: 40 },
  { type: "Other", label: "Other", defaultSeats: 4 },
];

const PRESET_INCLUSIONS = [
  "Fuel Included",
  "Driver Allowance Included",
  "Tolls & Parking Included",
  "Permit Taxes Included",
];

/**
 * VehiclePanel — Lightweight, Compact & Non-Bulky Transport Panel
 */
export default function VehiclePanel({ vehicle: propVehicle, value = {}, onChange }) {
  const inputVehicle = propVehicle || value || {};
  const vehicle = {
    vehicleType: "SUV",
    model: "",
    seats: 6,
    acType: "AC",
    vehiclePrice: 0,
    notes: "",
    ...inputVehicle,
  };

  function update(patch) {
    onChange({ ...vehicle, ...patch });
  }

  function handleTypeSelect(opt) {
    update({
      vehicleType: opt.type,
      seats: vehicle.seats || opt.defaultSeats,
    });
  }

  function togglePresetNote(preset) {
    const currentNotes = vehicle.notes || "";
    if (currentNotes.includes(preset)) {
      const updated = currentNotes
        .split("\n")
        .filter((line) => line.trim() !== preset)
        .join("\n")
        .trim();
      update({ notes: updated });
    } else {
      const updated = currentNotes ? `${currentNotes}\n${preset}` : preset;
      update({ notes: updated });
    }
  }

  const inputCls =
    "w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-[13px] font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 transition-all shadow-xs";

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 space-y-4 shadow-xs">
      {/* ── Compact Category Pill Group ── */}
      <div>
        <label className="block text-[11.5px] font-bold text-slate-600 uppercase tracking-wider mb-2">
          Vehicle Category
        </label>
        <div className="flex flex-wrap gap-2">
          {VEHICLE_TYPES.map((opt) => {
            const isSelected = vehicle.vehicleType === opt.type;
            return (
              <button
                key={opt.type}
                type="button"
                onClick={() => handleTypeSelect(opt)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12.5px] font-bold border transition-all ${
                  isSelected
                    ? "bg-slate-900 border-slate-900 text-white shadow-xs"
                    : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-white hover:border-slate-300"
                }`}
              >
                <Car className={`w-3.5 h-3.5 ${isSelected ? "text-white" : "text-slate-400"}`} />
                <span>{opt.label}</span>
                {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Compact Inputs Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Model */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 mb-1">
            Model / Make (optional)
          </label>
          <input
            type="text"
            value={vehicle.model}
            onChange={(e) => update({ model: e.target.value })}
            placeholder="e.g. Innova Crysta"
            className={inputCls}
          />
        </div>

        {/* Seats */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 mb-1">
            Seats Capacity
          </label>
          <input
            type="number"
            min={1}
            max={60}
            value={vehicle.seats}
            onWheel={(e) => e.target.blur()}
            onChange={(e) => update({ seats: parseInt(e.target.value, 10) || 1 })}
            className={`${inputCls} font-bold`}
          />
        </div>

        {/* AC / Non-AC Switch */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 mb-1">
            Air Conditioning
          </label>
          <div className="flex gap-1.5">
            {["AC", "Non-AC"].map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => update({ acType: opt })}
                className={`flex-1 py-2 rounded-xl border text-[12.5px] font-bold transition-all ${
                  vehicle.acType === opt
                    ? "bg-indigo-600 border-indigo-600 text-white shadow-xs"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-white"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Total Transport Price ── */}
      <div className="pt-1">
        <label className="block text-[11.5px] font-bold text-slate-600 uppercase tracking-wider mb-1">
          Total Transport Price (₹) *
        </label>
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[13px] font-bold text-slate-400">
            ₹
          </span>
          <input
            type="number"
            min={0}
            value={vehicle.vehiclePrice === 0 ? "" : vehicle.vehiclePrice}
            onWheel={(e) => e.target.blur()}
            onChange={(e) => {
              const val = e.target.value;
              if (val === "") {
                update({ vehiclePrice: 0 });
              } else {
                const parsed = parseFloat(val);
                update({ vehiclePrice: isNaN(parsed) ? 0 : parsed });
              }
            }}
            placeholder="0"
            className={`${inputCls} pl-8 text-[14px] font-extrabold text-slate-900`}
          />
        </div>
      </div>

      {/* ── Preset Inclusions Tags ── */}
      <div className="pt-1">
        <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
          Transport Inclusions & Notes
        </label>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {PRESET_INCLUSIONS.map((preset) => {
            const isChecked = (vehicle.notes || "").includes(preset);
            return (
              <button
                key={preset}
                type="button"
                onClick={() => togglePresetNote(preset)}
                className={`px-2.5 py-1 rounded-lg text-[11.5px] font-medium border transition-all ${
                  isChecked
                    ? "bg-indigo-50 border-indigo-200 text-indigo-800 font-bold"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-white"
                }`}
              >
                {isChecked ? "✓ " : "+ "}
                {preset}
              </button>
            );
          })}
        </div>

        <textarea
          value={vehicle.notes || ""}
          onChange={(e) => update({ notes: e.target.value })}
          placeholder="Additional transport notes..."
          rows={2}
          className={`${inputCls} resize-y text-[12px]`}
        />
      </div>
    </div>
  );
}
