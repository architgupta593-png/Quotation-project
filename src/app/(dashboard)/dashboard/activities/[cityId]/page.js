"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Loader2,
  AlertCircle,
  Zap,
  MapPin,
} from "lucide-react";
import ActivityCard from "@/components/activities/ActivityCard";
import ActivityFormModal from "@/components/activities/ActivityFormModal";
import SearchBar from "@/components/accommodation/SearchBar";

const CATEGORIES = ["all", "sightseeing", "adventure", "cultural", "leisure"];

const CATEGORY_LABEL = {
  all:         "All",
  sightseeing: "Sightseeing",
  adventure:   "Adventure",
  cultural:    "Cultural",
  leisure:     "Leisure",
};

export default function CityActivitiesPage() {
  const { data: session } = useSession();
  const isAdmin = ["superuser", "admin"].includes(session?.user?.role);
  const { cityId } = useParams();

  const [cityName,    setCityName]    = useState("");
  const [activities,  setActivities]  = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState("");
  const [search,      setSearch]      = useState("");
  const [activeTab,   setActiveTab]   = useState("all");

  // Modal state
  const [modalOpen,   setModalOpen]   = useState(false);
  const [editActivity, setEditActivity] = useState(null); // null = create mode

  // Delete confirm
  const [deletingId,  setDeletingId]  = useState(null);

  const fetchActivities = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ city: cityId });
      if (search) params.set("search", search);

      const res  = await fetch(`/api/activities?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load activities");

      setActivities(data.activities || []);

      // Pull city name from first activity or fetch from cities API
      if (data.activities?.[0]?.city?.name) {
        setCityName(data.activities[0].city.name);
      } else if (!cityName) {
        const cityRes  = await fetch(`/api/accommodation/cities/${cityId}`);
        const cityData = await cityRes.json();
        setCityName(cityData.city?.name || "City");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [cityId, search]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  // Also fetch city name on first mount if no activities yet
  useEffect(() => {
    if (!cityName) {
      fetch(`/api/accommodation/cities/${cityId}`)
        .then((r) => r.json())
        .then((d) => setCityName(d.city?.name || "City"))
        .catch(() => {});
    }
  }, [cityId]);

  function openCreate() {
    setEditActivity(null);
    setModalOpen(true);
  }

  function openEdit(activity) {
    setEditActivity(activity);
    setModalOpen(true);
  }

  function handleSaved(saved) {
    setModalOpen(false);
    fetchActivities();
  }

  async function handleDelete(activityId) {
    if (!confirm("Delete this activity? This cannot be undone.")) return;
    setDeletingId(activityId);
    try {
      const res = await fetch(`/api/activities/${activityId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Delete failed");
      }
      setActivities((prev) => prev.filter((a) => a._id !== activityId));
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
    } finally {
      setDeletingId(null);
    }
  }

  async function handleToggleHighlight(activity) {
    if (!isAdmin) return;
    try {
      const res  = await fetch(`/api/activities/${activity._id}`, {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ isHighlight: !activity.isHighlight }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setActivities((prev) =>
        prev.map((a) => (a._id === activity._id ? data.activity : a))
      );
    } catch (err) {
      alert(`Failed: ${err.message}`);
    }
  }

  // Filter by category tab
  const filtered = activities.filter((a) => {
    if (activeTab !== "all" && a.category !== activeTab) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-6">
          {/* Breadcrumb */}
          <Link
            href="/dashboard/activities"
            className="inline-flex items-center gap-1.5 text-[12px] text-gray-400 hover:text-gray-700 transition-colors mb-4"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Activities
          </Link>

          <div className="flex items-center justify-between mb-5">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shadow-sm">
                  <MapPin className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-[24px] font-bold text-gray-900">
                  {cityName || "Loading…"}
                </h1>
              </div>
              <p className="text-[14px] text-gray-500 ml-12">
                {loading
                  ? "Loading…"
                  : `${filtered.length} activit${filtered.length !== 1 ? "ies" : "y"}`}
              </p>
            </div>

            {isAdmin && (
              <button
                type="button"
                id="add-activity-btn"
                onClick={openCreate}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 text-white text-[13px] font-semibold hover:bg-rose-700 transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Add Activity
              </button>
            )}
          </div>

          {/* Search + Category Tabs */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div className="w-full sm:max-w-xs">
              <SearchBar
                id="activity-search"
                placeholder="Search activities…"
                value={search}
                onChange={setSearch}
              />
            </div>

            {/* Category filter tabs */}
            <div className="flex gap-1.5 flex-wrap">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveTab(cat)}
                  className={`px-3.5 py-1.5 rounded-full text-[12px] font-semibold border transition-all ${
                    activeTab === cat
                      ? "bg-rose-600 text-white border-rose-600 shadow-sm"
                      : "bg-white text-gray-500 border-gray-200 hover:border-rose-300 hover:text-rose-600"
                  }`}
                >
                  {CATEGORY_LABEL[cat]}
                </button>
              ))}
            </div>
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
        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-rose-50 flex items-center justify-center mb-4">
              <Zap className="w-8 h-8 text-rose-400" />
            </div>
            <h3 className="text-[17px] font-bold text-gray-900 mb-2">
              {search || activeTab !== "all"
                ? "No activities match your filter"
                : "No activities yet"}
            </h3>
            <p className="text-[14px] text-gray-500 mb-6 max-w-xs">
              {isAdmin && !search && activeTab === "all"
                ? `Add the first activity for ${cityName || "this city"}.`
                : "Try a different search or category filter."}
            </p>
            {isAdmin && !search && activeTab === "all" && (
              <button
                type="button"
                onClick={openCreate}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 text-white text-[13px] font-semibold hover:bg-rose-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add First Activity
              </button>
            )}
          </div>
        )}

        {/* Activity Cards Grid */}
        {!loading && filtered.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((activity) => (
              <ActivityCard
                key={activity._id}
                activity={activity}
                isAdmin={isAdmin}
                onEdit={() => openEdit(activity)}
                onDelete={() => handleDelete(activity._id)}
                onToggleHighlight={() => handleToggleHighlight(activity)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Activity Form Modal */}
      {modalOpen && (
        <ActivityFormModal
          cityId={cityId}
          cityName={cityName}
          activity={editActivity}
          onClose={() => setModalOpen(false)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
