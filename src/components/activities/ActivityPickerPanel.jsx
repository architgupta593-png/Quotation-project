"use client";

import { useState, useEffect } from "react";
import { Loader2, MapPin, Zap, Check, IndianRupee } from "lucide-react";
import ActivityBadge from "./ActivityBadge";

/**
 * ActivityPickerPanel — used inside the package wizard.
 * Shows available activities per city/destination, lets user check/uncheck them.
 *
 * Props:
 *   destinations {Array}  - form.destinations [{ cityId, cityName, nights }]
 *   activities   {Array}  - form.activities (selected activities)
 *   onChange     {fn}     - Called with updated selected activities array
 */
export default function ActivityPickerPanel({ destinations, activities = [], onChange }) {
  // Map: cityId -> fetched activity list
  const [cityActivities, setCityActivities] = useState({});
  const [loading,        setLoading]        = useState({});

  // Fetch activities per city when destinations change
  useEffect(() => {
    const validDests = (destinations || []).filter((d) => d.cityId);
    for (const dest of validDests) {
      if (cityActivities[dest.cityId] !== undefined) continue; // already fetched
      setLoading((prev) => ({ ...prev, [dest.cityId]: true }));
      fetch(`/api/activities?city=${dest.cityId}`)
        .then((r) => r.json())
        .then((data) => {
          setCityActivities((prev) => ({
            ...prev,
            [dest.cityId]: data.activities || [],
          }));
        })
        .catch(() => {
          setCityActivities((prev) => ({ ...prev, [dest.cityId]: [] }));
        })
        .finally(() => {
          setLoading((prev) => ({ ...prev, [dest.cityId]: false }));
        });
    }
  }, [destinations]);

  function isSelected(cityId, activityId) {
    return activities.some(
      (a) => a.cityId === cityId && a.activityId === activityId
    );
  }

  function toggleActivity(dest, activity) {
    const selected = isSelected(dest.cityId, activity._id);
    if (selected) {
      // Remove
      onChange(
        activities.filter(
          (a) => !(a.cityId === dest.cityId && a.activityId === activity._id)
        )
      );
    } else {
      // Add
      onChange([
        ...activities,
        {
          cityId:     dest.cityId,
          cityName:   dest.cityName,
          activityId: activity._id,
          name:       activity.name,
          price:      activity.price,
          category:   activity.category,
        },
      ]);
    }
  }

  const validDests = (destinations || []).filter((d) => d.cityId);

  if (validDests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50">
        <MapPin className="w-8 h-8 text-indigo-400 mb-3" />
        <p className="text-[14px] font-bold text-slate-700">No destinations added yet</p>
        <p className="text-[12px] text-slate-400 mt-1 max-w-xs">
          Go back to Basics and add destination cities first. Activities will load per city.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {validDests.map((dest) => {
        const acts = cityActivities[dest.cityId] || [];
        const isLoading = loading[dest.cityId];
        const selectedForCity = activities.filter((a) => a.cityId === dest.cityId);

        return (
          <div
            key={dest.cityId}
            className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden"
          >
            {/* City header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/60">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-rose-100 flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-rose-600" />
                </div>
                <div>
                  <p className="text-[14px] font-extrabold text-slate-900">{dest.cityName}</p>
                  <p className="text-[11px] text-slate-400">{dest.nights} night{dest.nights !== 1 ? "s" : ""}</p>
                </div>
              </div>
              {selectedForCity.length > 0 && (
                <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-[11px] font-bold text-indigo-700">
                  <Check className="w-3 h-3" />
                  {selectedForCity.length} selected
                </span>
              )}
            </div>

            <div className="p-5">
              {/* Loading state */}
              {isLoading && (
                <div className="flex items-center gap-2 py-6 justify-center text-[13px] text-slate-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading activities for {dest.cityName}…
                </div>
              )}

              {/* Empty state */}
              {!isLoading && acts.length === 0 && (
                <div className="flex flex-col items-center py-8 text-center">
                  <Zap className="w-6 h-6 text-slate-300 mb-2" />
                  <p className="text-[13px] text-slate-400">
                    No activities found for {dest.cityName}.
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Add activities in Dashboard → Activities → {dest.cityName}.
                  </p>
                </div>
              )}

              {/* Activity checkbox list */}
              {!isLoading && acts.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {acts.map((activity) => {
                    const checked = isSelected(dest.cityId, activity._id);
                    return (
                      <label
                        key={activity._id}
                        className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                          checked
                            ? "bg-indigo-50 border-indigo-300 shadow-sm"
                            : "bg-white border-slate-200 hover:border-indigo-200 hover:bg-indigo-50/30"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleActivity(dest, activity)}
                          className="mt-0.5 w-4 h-4 rounded accent-indigo-600 flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-bold text-slate-900 leading-tight truncate">
                            {activity.name}
                          </p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <ActivityBadge category={activity.category} />
                            {activity.price > 0 ? (
                              <span className="flex items-center gap-0.5 text-[11px] text-emerald-700 font-semibold">
                                <IndianRupee className="w-3 h-3" />
                                {activity.price.toLocaleString("en-IN")}
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400 font-medium">Free</span>
                            )}
                          </div>
                          {activity.duration && (
                            <p className="text-[10px] text-slate-400 mt-0.5">{activity.duration}</p>
                          )}
                        </div>
                        {checked && (
                          <Check className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
                        )}
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Summary */}
      {activities.length > 0 && (
        <div className="px-5 py-3.5 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-between">
          <span className="text-[13px] font-extrabold text-indigo-800 flex items-center gap-2">
            <Zap className="w-4 h-4" />
            {activities.length} activit{activities.length !== 1 ? "ies" : "y"} selected
          </span>
          <span className="text-[12px] text-indigo-600 font-semibold">
            ₹{activities
              .reduce((s, a) => s + (a.price || 0), 0)
              .toLocaleString("en-IN")} est. total
          </span>
        </div>
      )}
    </div>
  );
}
