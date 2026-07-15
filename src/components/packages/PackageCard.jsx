"use client";

import Link from "next/link";
import { MapPin, Moon, Sun, Users, BadgeCheck, FileText, Pencil, Trash2 } from "lucide-react";

const STATUS_STYLES = {
  draft: "bg-amber-50 text-amber-700 border-amber-200",
  published: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

/**
 * PackageCard — display card for the packages list page.
 *
 * Props:
 *   pkg      {Object}   - Package data object
 *   onDelete {fn}       - Called with pkg._id when delete is confirmed
 *   isAdmin  {boolean}  - Show admin actions (edit/delete) when true
 */
export default function PackageCard({ pkg, onDelete, isAdmin = false }) {
  const currency = pkg.pricing?.currency || "INR";
  const price = pkg.pricing?.pricePerPerson || 0;

  return (
    <div className="group relative flex flex-col bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 overflow-hidden">
      {/* Cover Image */}
      <div className="relative h-44 bg-gradient-to-br from-indigo-100 to-violet-100 overflow-hidden">
        {pkg.coverImage?.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={pkg.coverImage.url}
            alt={pkg.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <MapPin className="w-10 h-10 text-indigo-300" />
          </div>
        )}
        {/* Status Badge */}
        <div className="absolute top-3 right-3">
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
              STATUS_STYLES[pkg.status] || STATUS_STYLES.draft
            }`}
          >
            {pkg.status === "published" ? (
              <BadgeCheck className="w-3 h-3" />
            ) : (
              <FileText className="w-3 h-3" />
            )}
            {pkg.status}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4">
        {/* Destination */}
        <div className="flex items-center gap-1.5 text-[12px] text-indigo-600 font-medium mb-1">
          <MapPin className="w-3 h-3" />
          {pkg.destination}
        </div>

        {/* Title */}
        <h3 className="text-[15px] font-bold text-gray-900 leading-snug mb-3 line-clamp-2">
          {pkg.title}
        </h3>

        {/* Night / Day badges */}
        <div className="flex items-center gap-2 mb-3">
          <span className="flex items-center gap-1 px-2.5 py-1 bg-slate-100 rounded-full text-[12px] text-slate-700 font-medium">
            <Moon className="w-3 h-3" />
            {pkg.nights}N
          </span>
          <span className="flex items-center gap-1 px-2.5 py-1 bg-slate-100 rounded-full text-[12px] text-slate-700 font-medium">
            <Sun className="w-3 h-3" />
            {pkg.days}D
          </span>
        </div>

        {/* Price */}
        {price > 0 && (
          <p className="text-[13px] text-gray-500">
            Starting from{" "}
            <span className="text-[16px] font-bold text-gray-900">
              {currency} {price.toLocaleString()}
            </span>{" "}
            / person
          </p>
        )}
      </div>

      {/* Footer Actions */}
      <div className="px-4 pb-4 pt-0 flex items-center gap-2">
        <Link
          href={`/dashboard/packages/${pkg._id}`}
          className="flex-1 text-center px-3 py-2 rounded-xl bg-indigo-600 text-white text-[13px] font-semibold hover:bg-indigo-700 transition-colors"
        >
          View Details
        </Link>

        {isAdmin && (
          <>
            <Link
              href={`/dashboard/packages/${pkg._id}/edit`}
              className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 transition-all"
              aria-label="Edit package"
            >
              <Pencil className="w-4 h-4" />
            </Link>
            <button
              type="button"
              onClick={() => {
                if (confirm(`Delete "${pkg.title}"? This cannot be undone.`)) {
                  onDelete?.(pkg._id);
                }
              }}
              className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-all"
              aria-label="Delete package"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
