"use client";

/**
 * ActivityBadge — colored pill badge showing the activity category.
 *
 * Props:
 *   category  {string}  "sightseeing" | "adventure" | "cultural" | "leisure"
 *   size      {string}  "sm" | "md"  (default "sm")
 */

const CATEGORY_META = {
  sightseeing: {
    label: "Sightseeing",
    bg:    "bg-indigo-50",
    text:  "text-indigo-700",
    border:"border-indigo-200",
    dot:   "bg-indigo-500",
  },
  adventure: {
    label: "Adventure",
    bg:    "bg-rose-50",
    text:  "text-rose-700",
    border:"border-rose-200",
    dot:   "bg-rose-500",
  },
  cultural: {
    label: "Cultural",
    bg:    "bg-amber-50",
    text:  "text-amber-700",
    border:"border-amber-200",
    dot:   "bg-amber-500",
  },
  leisure: {
    label: "Leisure",
    bg:    "bg-emerald-50",
    text:  "text-emerald-700",
    border:"border-emerald-200",
    dot:   "bg-emerald-500",
  },
};

export default function ActivityBadge({ category, size = "sm" }) {
  const meta = CATEGORY_META[category] || CATEGORY_META.sightseeing;
  const textSize = size === "md" ? "text-[12px]" : "text-[10px]";
  const px       = size === "md" ? "px-3 py-1"   : "px-2.5 py-0.5";

  return (
    <span
      className={`inline-flex items-center gap-1.5 ${px} rounded-full border font-semibold
        ${meta.bg} ${meta.text} ${meta.border} ${textSize}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  );
}

// Export the meta map so other files can use gradient / top-bar colors
export { CATEGORY_META };
