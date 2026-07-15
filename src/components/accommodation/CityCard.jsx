"use client";

import { Building2, MapPin, Pencil, Trash2 } from "lucide-react";

/**
 * CityCard — displays a city with its hotel count.
 *
 * Props:
 *   city     {Object}  - { _id, name, state, country, hotelCount }
 *   onClick  {fn}      - Called when the card body is clicked
 *   onEdit   {fn}      - Called when edit is clicked (admin only)
 *   onDelete {fn}      - Called when delete is clicked (admin only)
 *   isAdmin  {boolean}
 */
export default function CityCard({ city, onClick, onEdit, onDelete, isAdmin }) {
  return (
    <div
      className="group relative bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden cursor-pointer"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
      aria-label={`Open ${city.name}`}
    >
      {/* Colour accent top bar */}
      <div className="h-1.5 bg-gradient-to-r from-violet-500 to-indigo-500" />

      <div className="p-5">
        {/* Icon + Name */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center flex-shrink-0">
              <MapPin className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <p className="text-[15px] font-bold text-gray-900 leading-tight group-hover:text-violet-700 transition-colors">
                {city.name}
              </p>
              {city.state && (
                <p className="text-[12px] text-gray-400 mt-0.5">
                  {city.state}
                  {city.country ? `, ${city.country}` : ""}
                </p>
              )}
            </div>
          </div>

          {/* Admin actions */}
          {isAdmin && (
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                id={`edit-city-${city._id}`}
                aria-label="Edit city"
                onClick={(e) => { e.stopPropagation(); onEdit(); }}
                className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                id={`delete-city-${city._id}`}
                aria-label="Delete city"
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Hotel count badge */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 rounded-full">
            <Building2 className="w-3.5 h-3.5 text-indigo-500" />
            <span className="text-[12px] font-semibold text-indigo-700">
              {city.hotelCount ?? 0} hotel{city.hotelCount !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
