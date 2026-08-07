"use client";

import Link from "next/link";
import { Clock, IndianRupee, Star, Pencil, Trash2, Ticket } from "lucide-react";
import ActivityBadge, { CATEGORY_META } from "./ActivityBadge";

// Top-bar gradient per category
const CATEGORY_GRADIENT = {
  sightseeing: "from-violet-500 to-indigo-600",
  adventure:   "from-orange-500 to-rose-600",
  cultural:    "from-amber-500 to-yellow-500",
  leisure:     "from-teal-500 to-emerald-600",
};

/**
 * ActivityCard — displays a single activity for a city.
 *
 * Props:
 *   activity   {Object}   - Activity document
 *   isAdmin    {boolean}
 *   onEdit     {fn}
 *   onDelete   {fn}
 *   onToggleHighlight {fn} - Optional: toggle isHighlight
 */
export default function ActivityCard({
  activity,
  isAdmin,
  onEdit,
  onDelete,
  onToggleHighlight,
}) {
  const gradient =
    CATEGORY_GRADIENT[activity.category] || CATEGORY_GRADIENT.sightseeing;
  const coverImage = activity.images?.[0]?.url;

  return (
    <div className="group relative bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 overflow-hidden">
      {/* ── Colour accent top bar ─────────────────────────────────────────── */}
      <div className={`h-1.5 bg-gradient-to-r ${gradient}`} />

      {/* ── Optional Cover Image ─────────────────────────────────────────── */}
      {coverImage && (
        <div className="relative h-36 w-full overflow-hidden bg-slate-100 border-b border-gray-100">
          <img
            src={coverImage}
            alt={activity.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {activity.images.length > 1 && (
            <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/60 text-white text-[10px] font-semibold backdrop-blur-xs">
              +{activity.images.length - 1} photos
            </span>
          )}
        </div>
      )}

      <div className="p-5 space-y-3">
        {/* ── Title row ─────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-[15px] font-bold text-gray-900 leading-tight group-hover:text-indigo-700 transition-colors truncate">
              {activity.name}
            </p>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <ActivityBadge category={activity.category} />
              {activity.duration && (
                <span className="flex items-center gap-1 text-[10px] text-gray-400 font-medium">
                  <Clock className="w-3 h-3" />
                  {activity.duration}
                </span>
              )}
            </div>
          </div>

          {/* Admin actions */}
          {isAdmin && (
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
              <button
                type="button"
                id={`edit-activity-${activity._id}`}
                aria-label="Edit activity"
                onClick={(e) => { e.stopPropagation(); onEdit && onEdit(); }}
                className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                id={`delete-activity-${activity._id}`}
                aria-label="Delete activity"
                onClick={(e) => { e.stopPropagation(); onDelete && onDelete(); }}
                className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* ── Description ───────────────────────────────────────────────── */}
        {activity.description && (
          <p className="text-[12.5px] text-gray-500 leading-relaxed line-clamp-2">
            {activity.description}
          </p>
        )}

        {/* ── Footer: Price + Highlight + Direct Booking ─────────────────── */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100 flex-wrap gap-2">
          <div className="flex items-center gap-1 text-[14px] font-black text-gray-900">
            <IndianRupee className="w-3.5 h-3.5 text-emerald-600" />
            {activity.price > 0
              ? activity.price.toLocaleString("en-IN")
              : <span className="text-[12px] text-gray-400 font-medium">Free</span>}
            {activity.price > 0 && (
              <span className="text-[11px] text-gray-400 font-normal ml-0.5">/ person</span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {activity.isStandaloneSaleable !== false && (
              <Link
                href={`/dashboard/activities/book/${activity._id}`}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-all"
              >
                <Ticket className="w-3 h-3 text-rose-500" />
                Book Ticket
              </Link>
            )}

            {/* Highlight toggle */}
            <button
              type="button"
              id={`highlight-activity-${activity._id}`}
              aria-label={activity.isHighlight ? "Remove highlight" : "Mark as highlight"}
              onClick={(e) => { e.stopPropagation(); onToggleHighlight && onToggleHighlight(); }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all ${
                activity.isHighlight
                  ? "bg-amber-50 text-amber-700 border-amber-300"
                  : "bg-gray-50 text-gray-400 border-gray-200 hover:border-amber-300 hover:text-amber-600"
              }`}
            >
              <Star className={`w-3 h-3 ${activity.isHighlight ? "fill-amber-500 text-amber-500" : ""}`} />
              Highlight
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
