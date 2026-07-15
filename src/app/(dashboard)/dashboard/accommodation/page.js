"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Loader2,
  AlertCircle,
  MapPin,
  Hotel,
  Trash2,
} from "lucide-react";
import SearchBar from "@/components/accommodation/SearchBar";
import CityCard from "@/components/accommodation/CityCard";
import CityFormModal from "@/components/accommodation/CityFormModal";

export default function AccommodationCitiesPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";
  const router = useRouter();

  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editCity, setEditCity] = useState(null); // null = create mode

  // Delete confirm
  const [deletingId, setDeletingId] = useState(null);

  const fetchCities = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      const res = await fetch(`/api/accommodation/cities?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load");
      setCities(data.cities || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchCities();
  }, [fetchCities]);

  function openCreate() {
    setEditCity(null);
    setModalOpen(true);
  }

  function openEdit(city) {
    setEditCity(city);
    setModalOpen(true);
  }

  function handleSaved(saved) {
    setModalOpen(false);
    // Refresh list
    fetchCities();
  }

  async function handleDelete(cityId) {
    if (!confirm("Delete this city? This will not delete associated hotels.")) return;
    setDeletingId(cityId);
    try {
      const res = await fetch(`/api/accommodation/cities/${cityId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Delete failed");
      }
      setCities((prev) => prev.filter((c) => c._id !== cityId));
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
    } finally {
      setDeletingId(null);
    }
  }

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
            <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
          </Link>

          <div className="flex items-center justify-between mb-5">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-sm">
                  <Hotel className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-[24px] font-bold text-gray-900">Accommodation</h1>
              </div>
              <p className="text-[14px] text-gray-500 ml-12">
                {loading ? "Loading…" : `${cities.length} cit${cities.length !== 1 ? "ies" : "y"}`}
              </p>
            </div>

            {isAdmin && (
              <button
                type="button"
                id="add-city-btn"
                onClick={openCreate}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 text-white text-[13px] font-semibold hover:bg-violet-700 transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Add City
              </button>
            )}
          </div>

          {/* Search */}
          <div className="max-w-sm">
            <SearchBar
              id="city-search"
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
            <Loader2 className="w-6 h-6 text-violet-500 animate-spin" />
          </div>
        )}

        {/* Empty */}
        {!loading && cities.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-violet-50 flex items-center justify-center mb-4">
              <MapPin className="w-8 h-8 text-violet-400" />
            </div>
            <h3 className="text-[17px] font-bold text-gray-900 mb-2">
              {search ? "No cities match your search" : "No cities yet"}
            </h3>
            <p className="text-[14px] text-gray-500 mb-6 max-w-xs">
              {isAdmin
                ? "Add your first city to start building the hotel database."
                : "No cities have been added yet."}
            </p>
            {isAdmin && !search && (
              <button
                type="button"
                onClick={openCreate}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 text-white text-[13px] font-semibold hover:bg-violet-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add First City
              </button>
            )}
          </div>
        )}

        {/* City Grid */}
        {!loading && cities.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {cities.map((city) => (
              <CityCard
                key={city._id}
                city={city}
                isAdmin={isAdmin}
                onClick={() => router.push(`/dashboard/accommodation/${city._id}`)}
                onEdit={() => openEdit(city)}
                onDelete={() => handleDelete(city._id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* City Form Modal */}
      {modalOpen && (
        <CityFormModal
          city={editCity}
          onClose={() => setModalOpen(false)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
