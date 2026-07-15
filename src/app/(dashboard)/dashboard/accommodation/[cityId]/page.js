"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Loader2, AlertCircle, Building2 } from "lucide-react";
import SearchBar from "@/components/accommodation/SearchBar";
import HotelCard from "@/components/accommodation/HotelCard";
import HotelFormModal from "@/components/accommodation/HotelFormModal";
import HotelPreviewModal from "@/components/accommodation/HotelPreviewModal";

export default function AccommodationHotelsPage() {
  const { cityId } = useParams();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";
  const router = useRouter();

  const [city, setCity] = useState(null);
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  // ── Preview modal (card click) ──────────────────────────────────────────────
  const [previewHotel, setPreviewHotel] = useState(null);
  const [previewRooms, setPreviewRooms] = useState([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [loadingPreviewRooms, setLoadingPreviewRooms] = useState(false);

  // ── Edit modal ──────────────────────────────────────────────────────────────
  const [editOpen, setEditOpen] = useState(false);
  const [editHotel, setEditHotel] = useState(null);
  const [editRooms, setEditRooms] = useState([]);
  const [loadingEditRooms, setLoadingEditRooms] = useState(false);

  // ── Fetch city ──────────────────────────────────────────────────────────────
  useEffect(() => {
    fetch(`/api/accommodation/cities/${cityId}`)
      .then((r) => r.json())
      .then((d) => { if (d.city) setCity(d.city); })
      .catch(() => {});
  }, [cityId]);

  // ── Fetch hotels ────────────────────────────────────────────────────────────
  const fetchHotels = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ cityId });
      if (search) params.set("search", search);
      const res = await fetch(`/api/accommodation/hotels?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load");
      setHotels(data.hotels || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [cityId, search]);

  useEffect(() => { fetchHotels(); }, [fetchHotels]);

  // ── Open PREVIEW (card click) ───────────────────────────────────────────────
  async function openPreview(hotel) {
    setPreviewHotel(hotel);
    setPreviewRooms([]);
    setPreviewOpen(true);
    setLoadingPreviewRooms(true);
    try {
      const res = await fetch(`/api/accommodation/rooms?hotelId=${hotel._id}`);
      const data = await res.json();
      if (res.ok) setPreviewRooms(data.rooms || []);
    } catch { /* silent */ }
    finally { setLoadingPreviewRooms(false); }
  }

  // ── Open EDIT (edit button / from preview) ──────────────────────────────────
  async function openEdit(hotel) {
    setPreviewOpen(false); // close preview if open
    setEditHotel(hotel);
    setEditRooms([]);
    setEditOpen(true);
    setLoadingEditRooms(true);
    try {
      const res = await fetch(`/api/accommodation/rooms?hotelId=${hotel._id}`);
      const data = await res.json();
      if (res.ok) setEditRooms(data.rooms || []);
    } catch { /* silent */ }
    finally { setLoadingEditRooms(false); }
  }

  // ── Open CREATE ─────────────────────────────────────────────────────────────
  function openCreate() {
    setEditHotel(null);
    setEditRooms([]);
    setEditOpen(true);
  }

  // After save: refresh list; immediately reopen preview so edits are visible
  function handleSaved(savedHotel) {
    setEditOpen(false);
    fetchHotels();
    if (savedHotel) {
      // Reopen preview with the freshly-saved hotel + fresh rooms
      openPreview(savedHotel);
    }
  }

  async function handleDelete(hotelId) {
    if (!confirm("Delete this hotel? Associated rooms will also be removed.")) return;
    try {
      const res = await fetch(`/api/accommodation/hotels/${hotelId}`, { method: "DELETE" });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Delete failed");
      }
      setHotels((prev) => prev.filter((h) => h._id !== hotelId));
      if (previewHotel?._id === hotelId) setPreviewOpen(false);
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-[12px] text-gray-400 mb-4">
            <Link href="/dashboard" className="hover:text-gray-700 transition-colors">Dashboard</Link>
            <span>/</span>
            <Link href="/dashboard/accommodation" className="hover:text-gray-700 transition-colors">Accommodation</Link>
            {city && (
              <><span>/</span><span className="text-gray-700 font-medium">{city.name}</span></>
            )}
          </div>

          <div className="flex items-center justify-between mb-5">
            <div>
              <button type="button" onClick={() => router.push("/dashboard/accommodation")}
                className="flex items-center gap-1.5 text-[12px] text-gray-500 hover:text-gray-900 mb-2 transition-colors">
                <ArrowLeft className="w-3.5 h-3.5" /> All Cities
              </button>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-sm">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-[22px] font-bold text-gray-900">{city?.name || "Hotels"}</h1>
                  {city?.state && (
                    <p className="text-[12px] text-gray-400">
                      {city.state}{city.country ? `, ${city.country}` : ""}
                    </p>
                  )}
                </div>
              </div>
              <p className="text-[13px] text-gray-500 mt-1 ml-12">
                {loading ? "Loading…" : `${hotels.length} hotel${hotels.length !== 1 ? "s" : ""}`}
                {" · "}
                <span className="text-gray-400 text-[12px]">Click card to preview · Edit button to manage rooms</span>
              </p>
            </div>
            {isAdmin && (
              <button type="button" id="add-hotel-btn" onClick={openCreate}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-[13px] font-semibold hover:bg-indigo-700 transition-colors shadow-sm">
                <Plus className="w-4 h-4" /> Add Hotel
              </button>
            )}
          </div>

          <div className="max-w-sm">
            <SearchBar id="hotel-search" placeholder="Search hotels…" value={search} onChange={setSearch} />
          </div>
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {error && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-[13px] mb-6">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
          </div>
        )}

        {!loading && hotels.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center mb-4">
              <Building2 className="w-8 h-8 text-indigo-400" />
            </div>
            <h3 className="text-[17px] font-bold text-gray-900 mb-2">
              {search ? "No hotels match your search" : "No hotels in this city yet"}
            </h3>
            <p className="text-[14px] text-gray-500 mb-6 max-w-xs">
              {isAdmin
                ? "Add a hotel to configure rooms, meals and seasonal pricing."
                : "No hotels added yet."}
            </p>
            {isAdmin && !search && (
              <button type="button" onClick={openCreate}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-[13px] font-semibold hover:bg-indigo-700 transition-colors">
                <Plus className="w-4 h-4" /> Add First Hotel
              </button>
            )}
          </div>
        )}

        {!loading && hotels.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {hotels.map((hotel) => (
              <HotelCard
                key={hotel._id}
                hotel={hotel}
                isAdmin={isAdmin}
                onClick={() => openPreview(hotel)}
                onEdit={() => openEdit(hotel)}
                onDelete={() => handleDelete(hotel._id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Preview modal ─────────────────────────────────────────────────── */}
      {previewOpen && previewHotel && (
        <HotelPreviewModal
          hotel={previewHotel}
          rooms={loadingPreviewRooms ? [] : previewRooms}
          cityName={city?.name || ""}
          isAdmin={isAdmin}
          onClose={() => setPreviewOpen(false)}
          onEdit={() => openEdit(previewHotel)}
        />
      )}

      {/* ── Edit modal ────────────────────────────────────────────────────── */}
      {editOpen && (
        <HotelFormModal
          cityId={cityId}
          hotel={editHotel}
          rooms={loadingEditRooms ? [] : editRooms}
          onClose={() => setEditOpen(false)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
