"use client";

import { useState, useMemo, useCallback } from "react";
import {
  Calendar, Users, Plus, Trash2, Tag, ArrowRight,
} from "lucide-react";

export const VEHICLE_TYPES = [
  {
    type: "Sedan",
    label: "Sedan",
    defaultSeats: 4,
    image: "/vehicle-sedan.png",
    models: "Dzire / Etios",
    defaultPrice: 5000,
  },
  {
    type: "SUV",
    label: "SUV",
    defaultSeats: 6,
    image: "/vehicle-suv.png",
    models: "Innova / Ertiga",
    defaultPrice: 7000,
  },
  {
    type: "MUV",
    label: "MUV / Premium",
    defaultSeats: 7,
    image: "/vehicle-muv.png",
    models: "Innova Crysta",
    defaultPrice: 8500,
  },
  {
    type: "Tempo Traveller",
    label: "Tempo (12-17S)",
    defaultSeats: 12,
    image: "/vehicle-tempo.png",
    models: "Force Traveller",
    defaultPrice: 12000,
  },
  {
    type: "Mini Bus",
    label: "Mini Bus (21S)",
    defaultSeats: 21,
    image: "/vehicle-minibus.png",
    models: "21-Seater Coach",
    defaultPrice: 18000,
  },
  {
    type: "Bus",
    label: "Bus (40S)",
    defaultSeats: 40,
    image: "/vehicle-bus.png",
    models: "40-Seater Coach",
    defaultPrice: 28000,
  },
  {
    type: "Other",
    label: "Custom",
    defaultSeats: 4,
    image: "/vehicle-sedan.png",
    models: "Custom Cab",
    defaultPrice: 6000,
  },
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

function createDefaultVehicle(type = "Sedan", defaultPrice) {
  const cfg = VEHICLE_TYPES.find((v) => v.type === type) || VEHICLE_TYPES[0];
  const p = defaultPrice !== undefined ? defaultPrice : cfg.defaultPrice;
  return {
    vehicleType: cfg.type,
    model: cfg.models,
    seats: cfg.defaultSeats,
    quantity: 1,
    acType: "AC",
    price: p,
    vehiclePrice: p,
    notes: "Includes fuel, driver allowance, tolls & parking",
  };
}

function createDefaultPeriod(name = "Standard Season", startDate = "", endDate = "") {
  return {
    name,
    startDate,
    endDate,
    vehicles: [createDefaultVehicle("Sedan")],
  };
}

/**
 * VehiclePanel — Custom Date Periods with Multi-Vehicle Dynamic Pricing
 */
export default function VehiclePanel({
  vehiclePeriods: propVehiclePeriods,
  vehicles: propVehicles,
  vehicle: propVehicle,
  value = {},
  onChange,
}) {
  // Normalize incoming periods safely
  const rawPeriods = useMemo(() => {
    if (Array.isArray(propVehiclePeriods) && propVehiclePeriods.length > 0) {
      return propVehiclePeriods;
    }
    if (Array.isArray(value?.vehiclePeriods) && value.vehiclePeriods.length > 0) {
      return value.vehiclePeriods;
    }
    if (Array.isArray(propVehicles) && propVehicles.length > 0) {
      return [{
        name: "Standard Season",
        startDate: "",
        endDate: "",
        vehicles: propVehicles,
      }];
    }
    if (Array.isArray(value?.vehicles) && value.vehicles.length > 0) {
      return [{
        name: "Standard Season",
        startDate: "",
        endDate: "",
        vehicles: value.vehicles,
      }];
    }
    if (propVehicle && propVehicle.vehicleType) {
      return [{
        name: "Standard Season",
        startDate: "",
        endDate: "",
        vehicles: [propVehicle],
      }];
    }
    return [createDefaultPeriod()];
  }, [propVehiclePeriods, value?.vehiclePeriods, propVehicles, value?.vehicles, propVehicle]);

  const [activePeriodIdx, setActivePeriodIdx] = useState(0);

  // Normalize periods structure with safe defaults
  const periods = useMemo(() => {
    return rawPeriods.map((p, pIdx) => {
      const vList = Array.isArray(p?.vehicles) && p.vehicles.length > 0
        ? p.vehicles
        : [createDefaultVehicle("Sedan")];

      const normalizedVehicles = vList.map((v) => {
        const typeCfg = VEHICLE_TYPES.find((t) => t.type === v?.vehicleType) || VEHICLE_TYPES[0];
        const rawPrice = v?.vehiclePrice !== undefined && v?.vehiclePrice !== null
          ? v.vehiclePrice
          : (v?.price !== undefined && v?.price !== null ? v.price : (v?.dailyRate !== undefined && v?.dailyRate !== null ? v.dailyRate : typeCfg.defaultPrice));
        const qty = Math.max(1, parseInt(v?.quantity, 10) || 1);

        return {
          ...v,
          vehicleType: v?.vehicleType || "Sedan",
          model: v?.model || typeCfg.models,
          seats: Math.max(1, parseInt(v?.seats, 10) || typeCfg.defaultSeats),
          quantity: qty,
          acType: v?.acType || "AC",
          price: rawPrice,
          vehiclePrice: rawPrice,
          notes: v?.notes || "Includes fuel, driver allowance, tolls & parking",
        };
      });

      return {
        name: p?.name || `Period ${pIdx + 1}`,
        startDate: p?.startDate || "",
        endDate: p?.endDate || "",
        vehicles: normalizedVehicles,
      };
    });
  }, [rawPeriods]);

  const safeActiveIdx = Math.min(Math.max(0, activePeriodIdx), Math.max(0, periods.length - 1));
  const activePeriod = periods[safeActiveIdx] || periods[0] || createDefaultPeriod();
  const activeVehicles = Array.isArray(activePeriod?.vehicles) && activePeriod.vehicles.length > 0
    ? activePeriod.vehicles
    : [createDefaultVehicle("Sedan")];

  const triggerChange = useCallback((updatedPeriods, currentActiveIdx = safeActiveIdx) => {
    const targetIdx = Math.min(Math.max(0, currentActiveIdx), Math.max(0, updatedPeriods.length - 1));
    const curPeriod = updatedPeriods[targetIdx] || updatedPeriods[0] || createDefaultPeriod();
    const curVehicles = (curPeriod?.vehicles || []).map((v) => ({
      ...v,
      vehiclePrice: Number(v?.vehiclePrice) || 0,
      price: Number(v?.vehiclePrice) || 0,
    }));
    const total = curVehicles.reduce(
      (sum, v) => sum + ((Number(v.vehiclePrice) || 0) * (parseInt(v.quantity, 10) || 1)),
      0
    );
    const primary = curVehicles[0] || createDefaultVehicle("Sedan");

    if (typeof onChange === "function") {
      onChange({
        vehiclePeriods: updatedPeriods,
        vehicles: curVehicles,
        vehicle: primary,
        vehicleTotal: total,
        vehiclePrice: total,
      });
    }
  }, [onChange, safeActiveIdx]);

  // Add Date Period
  function handleAddPeriod(e) {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    const newPeriod = createDefaultPeriod(
      `Period ${periods.length + 1}`,
      "",
      ""
    );
    if (activeVehicles && activeVehicles.length > 0) {
      newPeriod.vehicles = activeVehicles.map((v) => ({ ...v }));
    }
    const updated = [...periods, newPeriod];
    const newIdx = updated.length - 1;
    setActivePeriodIdx(newIdx);
    triggerChange(updated, newIdx);
  }

  // Remove Date Period
  function handleRemovePeriod(pIdx, e) {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    if (periods.length <= 1) return;
    const updated = periods.filter((_, i) => i !== pIdx);
    const newIdx = Math.max(0, pIdx >= updated.length ? updated.length - 1 : pIdx);
    setActivePeriodIdx(newIdx);
    triggerChange(updated, newIdx);
  }

  // Update Period Metadata (Name, Start Date, End Date)
  function handleUpdatePeriodMeta(patch) {
    const updated = periods.map((p, idx) => {
      if (idx !== safeActiveIdx) return p;
      return { ...p, ...patch };
    });
    triggerChange(updated);
  }

  // Vehicle operations in active period
  function handleUpdateVehicle(vIdx, patch) {
    const updatedPeriods = periods.map((p, pIdx) => {
      if (pIdx !== safeActiveIdx) return p;
      const nextVehicles = (p?.vehicles || []).map((veh, i) => {
        if (i !== vIdx) return veh;
        const updated = { ...veh, ...patch };

        if (patch.vehicleType && patch.vehicleType !== veh.vehicleType) {
          const typeCfg = VEHICLE_TYPES.find((t) => t.type === patch.vehicleType) || VEHICLE_TYPES[0];
          updated.seats = typeCfg.defaultSeats;
          updated.model = typeCfg.models;
          updated.price = typeCfg.defaultPrice;
          updated.vehiclePrice = typeCfg.defaultPrice;
        }

        if (patch.vehiclePrice !== undefined) {
          updated.vehiclePrice = patch.vehiclePrice;
          updated.price = patch.vehiclePrice;
        }

        if (patch.quantity !== undefined) {
          updated.quantity = Math.max(1, parseInt(patch.quantity, 10) || 1);
        }

        return updated;
      });
      return { ...p, vehicles: nextVehicles };
    });
    triggerChange(updatedPeriods);
  }

  function handleAddVehicleToPeriod(e) {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    const selectedTypes = activeVehicles.map((v) => v.vehicleType);
    const nextAvailable = VEHICLE_TYPES.find((t) => !selectedTypes.includes(t.type)) || VEHICLE_TYPES.find((t) => t.type === "Other") || VEHICLE_TYPES[0];

    const updatedPeriods = periods.map((p, pIdx) => {
      if (pIdx !== safeActiveIdx) return p;
      return {
        ...p,
        vehicles: [...(p?.vehicles || []), createDefaultVehicle(nextAvailable.type)],
      };
    });
    triggerChange(updatedPeriods);
  }

  function handleRemoveVehicleFromPeriod(vIdx, e) {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    if (activeVehicles.length <= 1) return;
    const updatedPeriods = periods.map((p, pIdx) => {
      if (pIdx !== safeActiveIdx) return p;
      return {
        ...p,
        vehicles: (p?.vehicles || []).filter((_, i) => i !== vIdx),
      };
    });
    triggerChange(updatedPeriods);
  }

  const periodGrandTotal = activeVehicles.reduce(
    (sum, v) => sum + ((Number(v.vehiclePrice) || 0) * (parseInt(v.quantity, 10) || 1)),
    0
  );
  const periodTotalFleet = activeVehicles.reduce((sum, v) => sum + (parseInt(v.quantity, 10) || 1), 0);
  const periodTotalSeats = activeVehicles.reduce(
    (sum, v) => sum + ((parseInt(v.seats, 10) || 4) * (parseInt(v.quantity, 10) || 1)),
    0
  );

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 space-y-4 shadow-xs">
      {/* ── Top Bar: Date Period Tabs ── */}
      <div className="space-y-2.5 pb-3 border-b border-slate-100">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-600" />
            <span className="text-[13px] font-bold text-slate-800">
              Seasonal Date Periods &amp; Vehicles
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[12px] font-bold text-slate-500 flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              {periodTotalFleet} Cab{periodTotalFleet > 1 ? "s" : ""} ({periodTotalSeats} Pax)
            </span>
            <span className="text-[14px] font-black text-emerald-700 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200 shadow-2xs">
              ₹{periodGrandTotal.toLocaleString("en-IN")}
            </span>
          </div>
        </div>

        {/* Period Pill Tabs */}
        <div className="flex items-center gap-2 flex-wrap">
          {periods.map((p, idx) => {
            const isSelected = safeActiveIdx === idx;
            const hasDates = p?.startDate || p?.endDate;
            return (
              <button
                key={idx}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setActivePeriodIdx(idx);
                  triggerChange(periods, idx);
                }}
                className={`px-3 py-1.5 rounded-xl text-[12px] font-bold border transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                    : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                }`}
              >
                <Tag className={`w-3 h-3 ${isSelected ? "text-indigo-200" : "text-slate-400"}`} />
                <span>{p?.name || `Period ${idx + 1}`}</span>
                {hasDates && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                    isSelected ? "bg-indigo-700 text-indigo-100" : "bg-slate-200 text-slate-600"
                  }`}>
                    {p?.startDate ? p.startDate.slice(5) : ""}
                    {p?.startDate && p?.endDate ? " → " : ""}
                    {p?.endDate ? p.endDate.slice(5) : ""}
                  </span>
                )}
              </button>
            );
          })}

          <button
            type="button"
            onClick={handleAddPeriod}
            className="px-3 py-1.5 rounded-xl text-[12px] font-bold border border-dashed border-indigo-300 text-indigo-700 bg-indigo-50/50 hover:bg-indigo-50 transition-all flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Date Period</span>
          </button>
        </div>
      </div>

      {/* ── Active Date Period Configuration Bar ── */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-50 via-indigo-50/30 to-purple-50/20 border border-slate-200/90 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
          {/* Period Title Input */}
          <div className="flex-1 min-w-[220px]">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
              Period / Season Name
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-500 font-bold text-[13px] select-none pointer-events-none">
                🏷️
              </span>
              <input
                type="text"
                value={activePeriod?.name || ""}
                onKeyDown={(e) => { if (e.key === "Enter") e.preventDefault(); }}
                onChange={(e) => handleUpdatePeriodMeta({ name: e.target.value })}
                placeholder="e.g. Summer Rush, Diwali Peak, Monsoon..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 focus:border-indigo-600 bg-white font-extrabold text-[13px] text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 shadow-2xs transition-all"
              />
            </div>
          </div>

          {/* Date Range Selector */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {/* Start Date */}
            <div className="min-w-[135px]">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                Valid From
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={activePeriod?.startDate || ""}
                  onKeyDown={(e) => { if (e.key === "Enter") e.preventDefault(); }}
                  onChange={(e) => handleUpdatePeriodMeta({ startDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-indigo-600 bg-white font-bold text-[12px] text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 shadow-2xs cursor-pointer transition-all"
                />
              </div>
            </div>

            {/* Arrow Divider */}
            <div className="self-end pb-2 hidden sm:block">
              <div className="w-6 h-6 rounded-full bg-slate-200/80 flex items-center justify-center text-slate-500">
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* End Date */}
            <div className="min-w-[135px]">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                Valid Till
              </label>
              <div className="relative">
                <input
                  type="date"
                  min={activePeriod?.startDate || undefined}
                  value={activePeriod?.endDate || ""}
                  onKeyDown={(e) => { if (e.key === "Enter") e.preventDefault(); }}
                  onChange={(e) => handleUpdatePeriodMeta({ endDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-indigo-600 bg-white font-bold text-[12px] text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 shadow-2xs cursor-pointer transition-all"
                />
              </div>
            </div>
          </div>

          {/* Delete Period Button */}
          {periods.length > 1 && (
            <div className="self-end lg:self-center lg:pt-4">
              <button
                type="button"
                onClick={(e) => handleRemovePeriod(safeActiveIdx, e)}
                className="px-3 py-2 rounded-xl text-[12px] font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 hover:border-rose-300 transition-all flex items-center gap-1.5 shadow-2xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Period</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Vehicle Fleet in Active Period ── */}
      <div className="space-y-2.5">
        {activeVehicles.map((veh, vIdx) => {
          const typeCfg = VEHICLE_TYPES.find((v) => v.type === veh?.vehicleType) || VEHICLE_TYPES[0];
          const unitPrice = Number(veh?.vehiclePrice) || 0;
          const rowSubtotal = unitPrice * (parseInt(veh?.quantity, 10) || 1);

          return (
            <div
              key={vIdx}
              className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 sm:p-3.5 rounded-2xl bg-white hover:bg-slate-50/60 border border-slate-200 transition-all shadow-2xs"
            >
              {/* Left: Category Icon + Dropdown + Model & Seats */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={typeCfg.image}
                  alt={veh?.vehicleType || "Vehicle"}
                  className="w-11 h-8 object-contain flex-shrink-0"
                />

                <div className="flex items-center gap-2 flex-wrap min-w-0">
                  {/* Category Selector */}
                  <select
                    value={veh?.vehicleType || "Sedan"}
                    onChange={(e) => handleUpdateVehicle(vIdx, { vehicleType: e.target.value })}
                    className="px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white font-black text-[12px] text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-2xs"
                  >
                    {VEHICLE_TYPES.filter((t) => {
                      if (t.type === veh?.vehicleType) return true;
                      if (t.type === "Other") return true;
                      return !activeVehicles.some((otherVeh, otherIdx) => otherIdx !== vIdx && otherVeh?.vehicleType === t.type);
                    }).map((t) => (
                      <option key={t.type} value={t.type}>
                        {t.label} ({t.defaultSeats} Seats)
                      </option>
                    ))}
                  </select>

                  {/* Model input */}
                  <input
                    type="text"
                    value={veh?.model || ""}
                    onKeyDown={(e) => { if (e.key === "Enter") e.preventDefault(); }}
                    onChange={(e) => handleUpdateVehicle(vIdx, { model: e.target.value })}
                    placeholder="Model (e.g. Dzire)"
                    className="w-28 sm:w-36 px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white font-semibold text-[12px] text-slate-800 focus:outline-none focus:border-indigo-500"
                  />

                  {/* AC toggle */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleUpdateVehicle(vIdx, { acType: veh?.acType === "AC" ? "Non-AC" : "AC" });
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-black border transition-all ${
                      veh?.acType === "AC"
                        ? "bg-sky-50 text-sky-800 border-sky-200"
                        : "bg-slate-100 text-slate-600 border-slate-200"
                    }`}
                  >
                    {veh?.acType || "AC"}
                  </button>
                </div>
              </div>

              {/* Right: Quantity, Price Input, Subtotal, Delete */}
              <div className="flex items-center justify-between md:justify-end gap-3.5 flex-wrap pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                {/* Quantity Stepper */}
                <div>
                  <span className="text-[9.5px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                    Cabs
                  </span>
                  <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl border border-slate-200 shadow-2xs">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleUpdateVehicle(vIdx, { quantity: Math.max(1, (veh?.quantity || 1) - 1) });
                      }}
                      disabled={(veh?.quantity || 1) <= 1}
                      className="w-6 h-6 rounded-lg hover:bg-white disabled:opacity-20 flex items-center justify-center font-black text-[13px] text-slate-700 transition-all shadow-2xs"
                    >
                      -
                    </button>
                    <span className="w-6 text-center font-black text-[12.5px] text-slate-900">
                      {veh?.quantity || 1}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleUpdateVehicle(vIdx, { quantity: (veh?.quantity || 1) + 1 });
                      }}
                      className="w-6 h-6 rounded-lg hover:bg-white flex items-center justify-center font-black text-[13px] text-slate-700 transition-all shadow-2xs"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Direct Price Input without Stepper Arrows */}
                <div>
                  <span className="text-[9.5px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                    Rate per Cab
                  </span>
                  <div className="relative flex items-center">
                    <span className="absolute left-2.5 text-indigo-600 font-black text-[12px] select-none pointer-events-none">
                      ₹
                    </span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={veh?.vehiclePrice !== undefined && veh?.vehiclePrice !== null ? veh.vehiclePrice : ""}
                      placeholder="0"
                      onKeyDown={(e) => { if (e.key === "Enter") e.preventDefault(); }}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/[^0-9]/g, "");
                        handleUpdateVehicle(vIdx, { vehiclePrice: raw });
                      }}
                      className="w-28 pl-6 pr-2.5 py-1.5 rounded-xl border border-slate-200 hover:border-indigo-300 focus:border-indigo-600 bg-white font-black text-[13px] text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 shadow-2xs transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                </div>

                {/* Subtotal */}
                <div className="text-right min-w-[85px]">
                  <span className="text-[9.5px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                    Total
                  </span>
                  <span className="text-[14px] font-black text-slate-900 block leading-tight">
                    ₹{rowSubtotal.toLocaleString("en-IN")}
                  </span>
                </div>

                {/* Remove button */}
                {activeVehicles.length > 1 && (
                  <div className="pt-3 md:pt-0">
                    <button
                      type="button"
                      onClick={(e) => handleRemoveVehicleFromPeriod(vIdx, e)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-all"
                      title="Remove vehicle"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Add Vehicle to Active Period Button ── */}
      <button
        type="button"
        onClick={handleAddVehicleToPeriod}
        className="w-full py-2.5 rounded-xl border border-dashed border-indigo-200 hover:border-indigo-400 bg-indigo-50/40 hover:bg-indigo-50 text-indigo-700 font-bold text-[12px] transition-all flex items-center justify-center gap-1.5"
      >
        <Plus className="w-3.5 h-3.5" />
        <span>+ Add Another Vehicle to &quot;{activePeriod?.name || "this period"}&quot;</span>
      </button>
    </div>
  );
}
