"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Loader2, Building2, Star, Phone, Mail,
  MapPin, BedDouble, Check, Utensils, Users, IndianRupee,
  Activity, ChevronLeft, ChevronRight,
} from "lucide-react";
import SeasonCalendar from "@/components/accommodation/SeasonCalendar";

const MEAL_LABELS = {
  EP:  { label: "EP — Room Only",          color: "bg-slate-100 text-slate-700 border-slate-200" },
  CP:  { label: "CP — Bed & Breakfast",    color: "bg-sky-50 text-sky-700 border-sky-200" },
  MAP: { label: "MAP — Breakfast + Dinner",color: "bg-violet-50 text-violet-700 border-violet-200" },
  AP:  { label: "AP — All Meals",          color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
};

// ── Image Gallery ─────────────────────────────────────────────────────────────
function ImageGallery({ images }) {
  const [current, setCurrent] = useState(0);
  if (!images?.length) return null;

  return (
    <div className="relative w-full rounded-2xl overflow-hidden bg-gray-900" style={{ aspectRatio: "16/7" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={images[current].url} alt={images[current].caption || "Hotel photo"}
        className="w-full h-full object-cover transition-opacity duration-300" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />
      {images.length > 1 && (
        <>
          <button type="button" onClick={() => setCurrent((c) => (c - 1 + images.length) % images.length)}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button type="button" onClick={() => setCurrent((c) => (c + 1) % images.length)}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_, i) => (
              <button key={i} type="button" onClick={() => setCurrent(i)}
                className={`rounded-full transition-all duration-200 ${i === current ? "bg-white w-5 h-1.5" : "bg-white/50 w-1.5 h-1.5"}`} />
            ))}
          </div>
          <div className="absolute top-3 right-3 px-2.5 py-0.5 bg-black/40 rounded-full text-[11px] text-white">
            {current + 1}/{images.length}
          </div>
        </>
      )}
    </div>
  );
}

// ── Room Detail Card ──────────────────────────────────────────────────────────
function RoomDetailCard({ room }) {
  const [imgIdx, setImgIdx] = useState(0);
  const images = room.images || [];

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Room images */}
      {images.length > 0 ? (
        <div className="relative h-40 bg-gray-100 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={images[imgIdx].url} alt={room.roomType}
            className="w-full h-full object-cover" />
          {images.length > 1 && (
            <div className="absolute bottom-2 right-2 flex gap-1">
              {images.map((_, i) => (
                <button key={i} type="button" onClick={() => setImgIdx(i)}
                  className={`rounded-full transition-all ${i === imgIdx ? "bg-white w-3 h-1.5" : "bg-white/60 w-1.5 h-1.5"}`} />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="h-1 bg-gradient-to-r from-violet-400 to-indigo-400" />
      )}

      <div className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center flex-shrink-0">
              <BedDouble className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <p className="text-[15px] font-bold text-gray-900">{room.roomType}</p>
              <p className="text-[12px] text-gray-400 flex items-center gap-1">
                <Users className="w-3 h-3" /> Max {room.maxOccupancy} guest{room.maxOccupancy !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          {room.seasonalPricing?.length > 0 && (() => {
            const prices = room.seasonalPricing.map((s) => Number(s.pricePerNight)).filter((p) => p > 0);
            if (!prices.length) return null;
            const min = Math.min(...prices);
            const max = Math.max(...prices);
            return (
              <div className="flex items-center gap-1 bg-emerald-50 border border-emerald-200 rounded-xl px-2.5 py-1.5 flex-shrink-0">
                <IndianRupee className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-[15px] font-black text-emerald-800">
                  {min === max ? min.toLocaleString() : `${min.toLocaleString()} – ${max.toLocaleString()}`}
                </span>
                <span className="text-[10px] text-emerald-600 ml-0.5">/night</span>
              </div>
            );
          })()}
        </div>

        {/* Room features */}
        {room.features?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {room.features.map((f, i) => (
              <span key={i} className="px-2.5 py-1 bg-gray-100 rounded-full text-[11px] text-gray-600 font-medium">{f}</span>
            ))}
          </div>
        )}

        {/* Meal Plans */}
        {room.meals?.length > 0 && (
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
              <Utensils className="w-3 h-3" /> Meal Plans
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {room.meals.map((m, i) => {
                const info = MEAL_LABELS[m.plan] || { label: m.plan, color: "bg-gray-100 text-gray-700 border-gray-200" };
                return (
                  <div key={i} className={`flex items-center justify-between rounded-xl px-3 py-2 border ${info.color}`}>
                    <span className="text-[11px] font-semibold">{info.label}</span>
                    <span className="text-[12px] font-bold ml-2">
                      {m.price > 0 ? `+₹${Number(m.price).toLocaleString()}/pax` : "Incl."}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Season Calendar (seasonal pricing moved to room level) */}
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
            Price Calendar
          </p>
          <SeasonCalendar
            seasonalPricing={room.seasonalPricing || []}
            roomType={room.roomType}
          />
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function HotelDetailPage() {
  const { cityId, hotelId } = useParams();
  const router = useRouter();

  const [hotel, setHotel] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`/api/accommodation/hotels/${hotelId}`).then((r) => r.json()),
      fetch(`/api/accommodation/rooms?hotelId=${hotelId}`).then((r) => r.json()),
    ])
      .then(([hotelData, roomData]) => {
        if (hotelData.hotel) setHotel(hotelData.hotel);
        else setError("Hotel not found");
        setRooms(roomData.rooms || []);
      })
      .catch(() => setError("Failed to load hotel"))
      .finally(() => setLoading(false));
  }, [hotelId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (!hotel) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">{error || "Hotel not found"}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky top bar */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center gap-2 text-[12px] text-gray-400 mb-1">
            <Link href="/dashboard" className="hover:text-gray-700 transition-colors">Dashboard</Link>
            <span>/</span>
            <Link href="/dashboard/accommodation" className="hover:text-gray-700 transition-colors">Accommodation</Link>
            <span>/</span>
            <Link href={`/dashboard/accommodation/${cityId}`} className="hover:text-gray-700 transition-colors">
              {hotel.city?.name || "City"}
            </Link>
            <span>/</span>
            <span className="text-gray-700 font-medium truncate max-w-[130px]">{hotel.name}</span>
          </div>
          <div className="flex items-center justify-between">
            <button type="button"
              onClick={() => router.push(`/dashboard/accommodation/${cityId}`)}
              className="flex items-center gap-1.5 text-[13px] text-gray-500 hover:text-gray-900 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back to Hotels
            </button>
            <span className="text-[12px] text-gray-400 italic">
              Read-only · Use the hotel card to edit
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">

        {/* ── Hotel Image Gallery ────────────────────────────────────────── */}
        <ImageGallery images={hotel.images} />

        {/* ── Hotel Info Card ────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500" />
          <div className="p-6 space-y-5">
            {/* Identity */}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                <Building2 className="w-6 h-6 text-indigo-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-[22px] font-bold text-gray-900">{hotel.name}</h1>
                  <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-[11px] font-semibold capitalize">
                    {hotel.type}
                  </span>
                </div>
                {hotel.starRating > 0 && (
                  <div className="flex gap-0.5 mt-1.5">
                    {Array.from({ length: hotel.starRating }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                    <span className="text-[12px] text-gray-400 ml-1">{hotel.starRating}-star</span>
                  </div>
                )}
              </div>
            </div>

            {/* Contact */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0">
                    <Phone className="w-3 h-3 text-white" />
                  </div>
                  <p className="text-[14px] font-bold text-indigo-900">{hotel.contactNo}</p>
                </div>
                {hotel.email && (
                  <div className="flex items-center gap-2 mt-2">
                    <Mail className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                    <p className="text-[12px] text-indigo-700">{hotel.email}</p>
                  </div>
                )}
              </div>
              {hotel.address && (
                <div className="flex items-start gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
                  <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                  <p className="text-[13px] text-gray-600 leading-snug">{hotel.address}</p>
                </div>
              )}
            </div>

            {/* Features */}
            {hotel.features?.length > 0 && (
              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Hotel Features
                </p>
                <div className="flex flex-wrap gap-2">
                  {hotel.features.map((f, i) => (
                    <span key={i} className="flex items-center gap-1.5 px-3 py-1 bg-gray-100 rounded-full text-[12px] text-gray-700 font-medium">
                      <Check className="w-3 h-3 text-emerald-500 flex-shrink-0" />{f}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Activities */}
            {hotel.activities?.length > 0 && (
              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5" /> Activities & Add-ons
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {hotel.activities.map((a, i) => (
                    <div key={i} className="flex items-center justify-between bg-violet-50 border border-violet-100 rounded-xl px-3 py-2.5">
                      <span className="text-[13px] font-semibold text-violet-900">{a.name}</span>
                      <span className="text-[13px] font-bold text-violet-700">
                        {a.price > 0 ? `+₹${Number(a.price).toLocaleString()}` : "Free"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Rooms (each with SeasonCalendar) ──────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-[18px] font-bold text-gray-900">Room Types</h2>
              <p className="text-[13px] text-gray-400">
                {rooms.length} room type{rooms.length !== 1 ? "s" : ""}
                {rooms.length > 0 && " · click a date to check seasonal price"}
              </p>
            </div>
          </div>

          {rooms.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 bg-white rounded-2xl border border-dashed border-gray-200 text-center">
              <BedDouble className="w-8 h-8 text-violet-300 mb-2" />
              <p className="text-[14px] font-medium text-gray-500">No room types configured</p>
              <p className="text-[12px] text-gray-400 mt-0.5">
                Go back and click a hotel card to edit and add rooms.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {rooms.map((room) => (
                <RoomDetailCard key={room._id} room={room} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
