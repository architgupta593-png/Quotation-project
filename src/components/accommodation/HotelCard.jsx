"use client";

import {
  Building2, Star, Phone, Mail, Check,
  Pencil, Trash2, Eye, MapPin,
} from "lucide-react";

const TYPE_BADGE = {
  hotel:      { bg: "bg-sky-500",     label: "Hotel"      },
  resort:     { bg: "bg-emerald-500", label: "Resort"     },
  hostel:     { bg: "bg-orange-500",  label: "Hostel"     },
  guesthouse: { bg: "bg-amber-500",   label: "Guesthouse" },
  villa:      { bg: "bg-purple-500",  label: "Villa"      },
  apartment:  { bg: "bg-teal-500",    label: "Apartment"  },
  other:      { bg: "bg-gray-500",    label: "Other"      },
};

/**
 * HotelCard — redesigned card with image cover.
 *
 * Props:
 *   hotel     {Object}   hotel document (with images[])
 *   isAdmin   {boolean}
 *   onClick   {fn}       → opens preview modal
 *   onEdit    {fn}       → opens edit modal
 *   onDelete  {fn}
 */
export default function HotelCard({ hotel, isAdmin, onClick, onEdit, onDelete }) {
  const cover = hotel.images?.[0]?.url;
  const badge = TYPE_BADGE[hotel.type] || TYPE_BADGE.other;
  const extraImages = (hotel.images?.length || 0) - 1;

  return (
    <div
      className="group relative bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-250 overflow-hidden cursor-pointer"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
      aria-label={`Preview ${hotel.name}`}
    >
      {/* ── Cover image / gradient ──────────────────────────────────────── */}
      <div className="relative h-44 overflow-hidden">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover}
            alt={hotel.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-400"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-indigo-400 via-violet-500 to-purple-600 flex items-center justify-center">
            <Building2 className="w-12 h-12 text-white/25" />
          </div>
        )}

        {/* Dark gradient overlay at bottom */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

        {/* Type badge — top left */}
        <div className="absolute top-3 left-3">
          <span className={`px-2.5 py-0.5 rounded-full text-white text-[10px] font-bold ${badge.bg} shadow-sm`}>
            {badge.label}
          </span>
        </div>

        {/* Admin action buttons — top right, appear on hover */}
        {isAdmin && (
          <div className="absolute top-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200">
            <button
              type="button"
              id={`edit-hotel-${hotel._id}`}
              aria-label="Edit hotel"
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              className="w-7 h-7 rounded-full bg-white/90 backdrop-blur-sm text-indigo-600 hover:bg-indigo-600 hover:text-white flex items-center justify-center shadow-sm transition-all"
            >
              <Pencil className="w-3 h-3" />
            </button>
            <button
              type="button"
              id={`delete-hotel-${hotel._id}`}
              aria-label="Delete hotel"
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="w-7 h-7 rounded-full bg-white/90 backdrop-blur-sm text-red-500 hover:bg-red-500 hover:text-white flex items-center justify-center shadow-sm transition-all"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Image count badge */}
        {extraImages > 0 && (
          <div className="absolute bottom-3 right-3 px-2 py-0.5 bg-black/50 backdrop-blur-sm rounded-full text-[10px] text-white font-medium">
            +{extraImages} photo{extraImages > 1 ? "s" : ""}
          </div>
        )}

        {/* Hotel name + stars over the image (bottom overlay) */}
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-3">
          <p className="text-[16px] font-black text-white leading-tight drop-shadow-sm truncate">
            {hotel.name}
          </p>
          {hotel.starRating > 0 && (
            <div className="flex gap-0.5 mt-0.5">
              {Array.from({ length: hotel.starRating }).map((_, i) => (
                <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400 drop-shadow" />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Card body ──────────────────────────────────────────────────── */}
      <div className="p-4 space-y-3">
        {/* Contact info */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0">
              <Phone className="w-3 h-3 text-white" />
            </div>
            <span className="text-[13px] font-semibold text-gray-800">{hotel.contactNo}</span>
          </div>
          {hotel.email && (
            <div className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-gray-400 ml-1 flex-shrink-0" />
              <span className="text-[12px] text-gray-500 truncate">{hotel.email}</span>
            </div>
          )}
          {hotel.address && (
            <div className="flex items-start gap-2">
              <MapPin className="w-3.5 h-3.5 text-gray-400 ml-1 flex-shrink-0 mt-0.5" />
              <span className="text-[11px] text-gray-400 leading-snug line-clamp-1">{hotel.address}</span>
            </div>
          )}
        </div>

        {/* Features */}
        {hotel.features?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {hotel.features.slice(0, 4).map((f, i) => (
              <span key={i} className="flex items-center gap-1 px-2 py-0.5 bg-emerald-50 border border-emerald-200 rounded-full text-[10px] text-emerald-700 font-medium">
                <Check className="w-2.5 h-2.5" />
                {f}
              </span>
            ))}
            {hotel.features.length > 4 && (
              <span className="px-2 py-0.5 bg-gray-100 rounded-full text-[10px] text-gray-500">
                +{hotel.features.length - 4} more
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── Footer strip ───────────────────────────────────────────────── */}
      <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
        <span className="text-[11px] text-gray-400 italic">
          {hotel.activities?.length > 0
            ? `${hotel.activities.length} activit${hotel.activities.length > 1 ? "ies" : "y"}`
            : "No activities"}
        </span>
        <div className="flex items-center gap-1 text-[11px] text-indigo-600 font-semibold group-hover:gap-2 transition-all">
          <Eye className="w-3.5 h-3.5" />
          <span>Preview</span>
        </div>
      </div>
    </div>
  );
}
