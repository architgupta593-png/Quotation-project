"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  MapPin,
  Zap,
} from "lucide-react";
import CityCard from "@/components/accommodation/CityCard";
import SearchBar from "@/components/accommodation/SearchBar";

export default function ActivitiesCitiesPage() {
  const { data: session } = useSession();
  const isAdmin = ["superuser", "admin"].includes(session?.user?.role);
  const router  = useRouter();

  const [cities,  setCities]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");
  const [search,  setSearch]  = useState("");

  const fetchCities = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);

      // Use the existing cities endpoint
      const res  = await fetch(`/api/accommodation/cities?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load cities");

      // Fetch activity counts per city
      const activitiesRes  = await fetch("/api/activities");
      const activitiesData = await activitiesRes.json();
      const activities     = activitiesData.activities || [];

      // Build count map
      const countMap = {};
      for (const act of activities) {
        const cid = act.city?._id || act.city;
        if (cid) countMap[cid] = (countMap[cid] || 0) + 1;
      }

      // Attach activityCount to each city
      const enriched = (data.cities || []).map((c) => ({
        ...c,
        activityCount: countMap[c._id?.toString()] || 0,
      }));

      setCities(enriched);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchCities();
  }, [fetchCities]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-6">
          {/* Breadcrumb */}
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-[12px] text-gray-400 hover:text-gray-700 transition-colors mb-4"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Dashboard
          </Link>

          <div className="flex items-center justify-between mb-5">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shadow-sm">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-[24px] font-bold text-gray-900">Activities</h1>
              </div>
              <p className="text-[14px] text-gray-500 ml-12">
                {loading
                  ? "Loading…"
                  : `${cities.length} cit${cities.length !== 1 ? "ies" : "y"} — browse to manage activities`}
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="max-w-sm">
            <SearchBar
              id="activity-city-search"
              placeholder="Search cities or states…"
              value={search}
              onChange={setSearch}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-[13px] mb-6">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-6 h-6 text-rose-500 animate-spin" />
          </div>
        )}

        {/* Empty */}
        {!loading && cities.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-rose-50 flex items-center justify-center mb-4">
              <MapPin className="w-8 h-8 text-rose-400" />
            </div>
            <h3 className="text-[17px] font-bold text-gray-900 mb-2">
              {search ? "No cities match your search" : "No cities yet"}
            </h3>
            <p className="text-[14px] text-gray-500 mb-6 max-w-xs">
              Cities are managed in the Accommodation section. Add cities there first.
            </p>
            <Link
              href="/dashboard/accommodation"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 text-white text-[13px] font-semibold hover:bg-rose-700 transition-colors"
            >
              Go to Accommodation
            </Link>
          </div>
        )}

        {/* City Grid — reusing CityCard with activityCount shown as hotelCount badge */}
        {!loading && cities.length > 0 && (
          <div>
            <p className="text-[12px] text-gray-400 mb-4 font-medium">
              Click a city to view and manage its activities.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {cities.map((city) => (
                <ActivityCityCard
                  key={city._id}
                  city={city}
                  activityCount={city.activityCount}
                  onClick={() => router.push(`/dashboard/activities/${city._id}`)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Inline city card that shows activityCount ─────────────────────────────────
function ActivityCityCard({ city, activityCount, onClick }) {
  return (
    <div
      className="group relative bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden cursor-pointer"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
      aria-label={`Open activities for ${city.name}`}
    >
      {/* Rose accent top bar */}
      <div className="h-1.5 bg-gradient-to-r from-rose-500 to-pink-500" />

      <div className="p-5">
        {/* Icon + Name */}
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center flex-shrink-0">
            <MapPin className="w-5 h-5 text-rose-600" />
          </div>
          <div>
            <p className="text-[15px] font-bold text-gray-900 leading-tight group-hover:text-rose-700 transition-colors">
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

        {/* Activity count badge */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-rose-50 rounded-full">
            <Zap className="w-3.5 h-3.5 text-rose-500" />
            <span className="text-[12px] font-semibold text-rose-700">
              {activityCount} activit{activityCount !== 1 ? "ies" : "y"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
