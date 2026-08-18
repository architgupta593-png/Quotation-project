"use client";

import { Car, Users, Check, Sparkles, ShieldCheck } from "lucide-react";

export const VEHICLE_TYPES = [
  { type: "Sedan", label: "Sedan", defaultSeats: 4, dailyRate: 2500, image: "/vehicle-sedan.png", models: "Dzire, Etios, Amaze" },
  { type: "SUV", label: "SUV", defaultSeats: 6, dailyRate: 3500, image: "/vehicle-suv.png", models: "Innova, Ertiga, Scorpio" },
  { type: "MUV", label: "MUV", defaultSeats: 7, dailyRate: 4000, image: "/vehicle-muv.png", models: "Innova Crysta, Carens" },
  { type: "Tempo Traveller", label: "Tempo (12S)", defaultSeats: 12, dailyRate: 5500, image: "/vehicle-tempo.png", models: "Force Traveller 12-17 Seater" },
  { type: "Mini Bus", label: "Mini Bus", defaultSeats: 21, dailyRate: 8500, image: "/vehicle-minibus.png", models: "21-27 Seater Coach" },
  { type: "Bus", label: "Bus", defaultSeats: 40, dailyRate: 14000, image: "/vehicle-bus.png", models: "40-50 Seater Luxury Coach" },
  { type: "Other", label: "Other", defaultSeats: 4, dailyRate: 3000, image: "/vehicle-sedan.png", models: "Custom Vehicle" },
];

export function getVehicleImage(vehicleType = "") {
  const type = (vehicleType || "").toLowerCase();
  if (type.includes("sedan") || type.includes("dzire") || type.includes("etios")) return "/vehicle-sedan.png";
  if (type.includes("suv") || type.includes("innova") || type.includes("crysta")) return "/vehicle-suv.png";
  if (type.includes("muv") || type.includes("ertiga") || type.includes("carens")) return "/vehicle-muv.png";
  if (type.includes("tempo") || type.includes("traveller") || type.includes("van")) return "/vehicle-tempo.png";
  if (type.includes("mini bus") || type.includes("minibus") || type.includes("coach")) return "/vehicle-minibus.png";
  if (type.includes("bus")) return "/vehicle-bus.png";
  return "/vehicle-sedan.png";
}

const PRESET_INCLUSIONS = [
  "Fuel Included",
  "Driver Allowance Included",
  "Tolls & Parking Included",
  "Permit Taxes Included",
];

/**
 * VehiclePanel — Lightweight, Compact & Visual Transport Panel with Vehicle PNGs
 */
export default function VehiclePanel({ vehicle: propVehicle, value = {}, days = 1, onChange }) {
  const inputVehicle = propVehicle || value || {};
  const vehicle = {
    vehicleType: inputVehicle.vehicleType || "Sedan",
    model: inputVehicle.model || "",
    seats: inputVehicle.seats || 4,
    acType: inputVehicle.acType || "AC",
    vehiclePrice: inputVehicle.vehiclePrice || 0,
    notes: inputVehicle.notes || "",
  };

  const currentTypeConfig =
    VEHICLE_TYPES.find((v) => v.type === vehicle.vehicleType) || VEHICLE_TYPES[0];

  function update(patch) {
    onChange({ ...vehicle, ...patch });
  }

  function handleTypeSelect(opt) {
    const estPrice = (days || 1) * (opt.dailyRate || 2500);
    update({
      vehicleType: opt.type,
      seats: opt.defaultSeats,
      model: vehicle.model || opt.models,
      vehiclePrice: vehicle.vehiclePrice === 0 ? estPrice : vehicle.vehiclePrice,
    });
  }

  function autoCalcStandardPrice() {
    const estPrice = (days || 1) * (currentTypeConfig.dailyRate || 2500);
    update({ vehiclePrice: estPrice });
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
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 space-y-5 shadow-xs">
      {/* ── Category Pill Group with Vehicle Thumbnails ── */}
      <div>
        <label className="block text-[11.5px] font-bold text-slate-600 uppercase tracking-wider mb-2.5">
          Vehicle Category &amp; Fleet Model
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {VEHICLE_TYPES.slice(0, 6).map((opt) => {
            const isSelected = vehicle.vehicleType === opt.type;
            return (
              <button
                key={opt.type}
                type="button"
                onClick={() => handleTypeSelect(opt)}
                className={`p-2.5 rounded-2xl border-2 flex flex-col items-center justify-between text-center transition-all ${
                  isSelected
                    ? "border-indigo-600 bg-indigo-50/70 shadow-sm ring-2 ring-indigo-500/20"
                    : "border-slate-200 hover:border-slate-300 bg-slate-50/50 hover:bg-white"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={opt.image}
                  alt={opt.label}
                  className="h-12 w-auto object-contain my-1 transition-transform group-hover:scale-105"
                />
                <span className={`text-[12px] font-black ${isSelected ? "text-indigo-950" : "text-slate-800"}`}>
                  {opt.label}
                </span>
                <span className="text-[10px] text-slate-500 font-semibold mt-0.5">
                  ₹{opt.dailyRate.toLocaleString("en-IN")}/day
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Visual Vehicle Showcase Banner ── */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-50 via-indigo-50/50 to-sky-50 border border-sky-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-20 h-16 rounded-xl bg-white p-1 border border-sky-100 flex items-center justify-center shadow-xs flex-shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentTypeConfig.image}
              alt={vehicle.vehicleType}
              className="h-14 w-auto object-contain"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[14.5px] font-black text-sky-950">
                AC {vehicle.vehicleType} ({vehicle.model || currentTypeConfig.models})
              </span>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-sky-100 text-sky-800 border border-sky-200">
                {vehicle.acType}
              </span>
            </div>
            <p className="text-[12px] text-sky-800 font-semibold mt-0.5">
              Standard Seating: Up to {vehicle.seats} Guests • Chauffeur Driven
            </p>
          </div>
        </div>

        <div className="text-[11.5px] text-sky-900 font-bold sm:text-right">
          <p>Standard Rate: ₹{currentTypeConfig.dailyRate.toLocaleString("en-IN")} / day</p>
          <p className="text-slate-500 font-medium">Estimated {days || 1} Days Tour Total</p>
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
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <label className="block text-[12px] font-bold text-slate-700">
              Total Transport Rate (₹)
            </label>
            <p className="text-[11px] text-slate-500">
              Total calculated vehicle &amp; driver cost for {days || 1} tour days
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={autoCalcStandardPrice}
              className="px-3 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[11.5px] transition-colors flex items-center gap-1 shadow-2xs"
            >
              <Sparkles className="w-3.5 h-3.5" /> Auto-Calculate Rate
            </button>

            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-[13px]">
                ₹
              </span>
              <input
                type="number"
                min={0}
                value={vehicle.vehiclePrice === 0 ? "" : vehicle.vehiclePrice}
                onWheel={(e) => e.target.blur()}
                onChange={(e) => update({ vehiclePrice: parseFloat(e.target.value) || 0 })}
                placeholder="0"
                className="w-36 pl-7 pr-3 py-1.5 rounded-xl border border-slate-300 bg-white text-[14px] font-black text-slate-900 focus:outline-none focus:border-indigo-600 shadow-xs"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Fast Inclusions Quick Pills ── */}
      <div>
        <label className="block text-[11px] font-semibold text-slate-500 mb-1.5">
          Quick Inclusions (Click to toggle)
        </label>
        <div className="flex flex-wrap gap-1.5">
          {PRESET_INCLUSIONS.map((preset) => {
            const hasPreset = (vehicle.notes || "").includes(preset);
            return (
              <button
                key={preset}
                type="button"
                onClick={() => togglePresetNote(preset)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all ${
                  hasPreset
                    ? "bg-emerald-50 border-emerald-300 text-emerald-800 shadow-2xs"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-white"
                }`}
              >
                {hasPreset ? "✓ " : "+ "}
                {preset}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
