"use client";

import { Car } from "lucide-react";

const VEHICLE_TYPES = [
  "Sedan",
  "SUV",
  "MUV",
  "Tempo Traveller",
  "Mini Bus",
  "Bus",
  "Other",
];

/**
 * VehiclePanel — transport details for the package.
 *
 * Props:
 *   value    {Object} - { vehicleType, model, seats, acType, notes }
 *   onChange {fn}     - Called with the updated vehicle object
 */
export default function VehiclePanel({ value = {}, onChange }) {
  const vehicle = {
    vehicleType: "SUV",
    model: "",
    seats: 4,
    acType: "AC",
    notes: "",
    ...value,
  };

  function update(patch) {
    onChange({ ...vehicle, ...patch });
  }

  const inputCls =
    "w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-[13px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all bg-white";

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-8 h-8 rounded-lg bg-sky-600 flex items-center justify-center">
          <Car className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-[14px] font-semibold text-gray-900">Vehicle Details</p>
          <p className="text-[12px] text-gray-400">Primary transport for the package</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Vehicle Type */}
        <div>
          <label className="block text-[12px] font-medium text-gray-500 mb-1.5">
            Vehicle Type
          </label>
          <select
            value={vehicle.vehicleType}
            onChange={(e) => update({ vehicleType: e.target.value })}
            className={inputCls}
          >
            {VEHICLE_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        {/* Model */}
        <div>
          <label className="block text-[12px] font-medium text-gray-500 mb-1.5">
            Model / Make (optional)
          </label>
          <input
            type="text"
            value={vehicle.model}
            onChange={(e) => update({ model: e.target.value })}
            placeholder="e.g. Toyota Innova Crysta"
            className={inputCls}
          />
        </div>

        {/* Seats */}
        <div>
          <label className="block text-[12px] font-medium text-gray-500 mb-1.5">
            Seating Capacity
          </label>
          <input
            type="number"
            min={1}
            max={60}
            value={vehicle.seats}
            onChange={(e) => update({ seats: parseInt(e.target.value, 10) || 1 })}
            className={inputCls}
          />
        </div>

        {/* AC Type */}
        <div>
          <label className="block text-[12px] font-medium text-gray-500 mb-1.5">
            Air Conditioning
          </label>
          <div className="flex gap-3">
            {["AC", "Non-AC"].map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => update({ acType: opt })}
                className={`flex-1 py-2.5 rounded-xl border text-[13px] font-medium transition-all ${
                  vehicle.acType === opt
                    ? "bg-sky-50 border-sky-400 text-sky-700"
                    : "bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="sm:col-span-2">
          <label className="block text-[12px] font-medium text-gray-500 mb-1.5">
            Additional Notes (optional)
          </label>
          <textarea
            value={vehicle.notes}
            onChange={(e) => update({ notes: e.target.value })}
            placeholder="e.g. Dedicated driver throughout the trip, toll & parking included"
            rows={2}
            className={`${inputCls} resize-none`}
          />
        </div>
      </div>
    </div>
  );
}
