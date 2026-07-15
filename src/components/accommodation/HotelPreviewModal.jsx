"use client";

import { useState } from "react";
import {
  X, Star, Phone, Mail, MapPin, Building2, Check,
  BedDouble, Utensils, Users, IndianRupee, Pencil,
  ChevronLeft, ChevronRight, Activity, Image as ImageIcon,
} from "lucide-react";
import SeasonCalendar from "@/components/accommodation/SeasonCalendar";

const MEAL_LABELS = {
  EP:  { short: "EP",  full: "Room Only",           color: "bg-slate-100 text-slate-700 border-slate-200" },
  CP:  { short: "CP",  full: "Bed & Breakfast",      color: "bg-sky-50 text-sky-700 border-sky-200" },
  MAP: { short: "MAP", full: "Breakfast + Dinner",   color: "bg-violet-50 text-violet-700 border-violet-200" },
  AP:  { short: "AP",  full: "All Meals",            color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
};

// ── Image carousel ─────────────────────────────────────────────────────────────
function ImageCarousel({ images }) {
  const [idx, setIdx] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className="w-full bg-gradient-to-br from-indigo-500 to-violet-700 flex items-center justify-center" style={{ aspectRatio: "16/7" }}>
        <ImageIcon className="w-12 h-12 text-white/30" />
      </div>
    );
  }

  return (
    <div className="relative w-full overflow-hidden" style={{ aspectRatio: "16/7" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={images[idx].url}
        alt={images[idx].caption || "Hotel photo"}
        className="w-full h-full object-cover transition-opacity duration-300"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />

      {images.length > 1 && (
        <>
          <button type="button" onClick={() => setIdx((c) => (c - 1 + images.length) % images.length)}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors z-10">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button type="button" onClick={() => setIdx((c) => (c + 1) % images.length)}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors z-10">
            <ChevronRight className="w-4 h-4" />
          </button>
          {/* Dot nav */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {images.map((_, i) => (
              <button key={i} type="button" onClick={() => setIdx(i)}
                className={`rounded-full transition-all duration-200 ${i === idx ? "bg-white w-5 h-1.5" : "bg-white/50 w-1.5 h-1.5"}`} />
            ))}
          </div>
          {/* Count */}
          <div className="absolute top-3 right-3 px-2.5 py-0.5 bg-black/40 rounded-full text-[10px] text-white font-medium z-10">
            {idx + 1}/{images.length}
          </div>
        </>
      )}
    </div>
  );
}

// ── Room card in preview ───────────────────────────────────────────────────────
function RoomPreviewCard({ room, isActive, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left rounded-xl border p-3 transition-all flex-shrink-0 ${
        isActive
          ? "border-indigo-400 bg-indigo-50 shadow-sm"
          : "border-gray-200 bg-white hover:border-indigo-200 hover:bg-gray-50"
      }`}
    >
      <div className="flex items-center gap-2 mb-1">
        <BedDouble className={`w-3.5 h-3.5 ${isActive ? "text-indigo-600" : "text-gray-400"}`} />
        <p className={`text-[12px] font-bold truncate max-w-[120px] ${isActive ? "text-indigo-800" : "text-gray-800"}`}>
          {room.roomType}
        </p>
      </div>
      {room.seasonalPricing?.length > 0 && (() => {
        const prices = room.seasonalPricing.map((s) => Number(s.pricePerNight)).filter(Boolean);
        if (!prices.length) return null;
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        return (
          <p className="text-[11px] text-emerald-700 font-bold flex items-center gap-0.5">
            <IndianRupee className="w-3 h-3" />
            {min === max ? min.toLocaleString() : `${min.toLocaleString()} – ${max.toLocaleString()}`}
            <span className="text-gray-400 font-normal">/night</span>
          </p>
        );
      })()}
      <p className="text-[10px] text-gray-400 mt-0.5">
        <Users className="w-2.5 h-2.5 inline mr-0.5" />
        Max {room.maxOccupancy}
      </p>
    </button>
  );
}

// ── Main Modal ─────────────────────────────────────────────────────────────────
/**
 * HotelPreviewModal
 *
 * Props:
 *   hotel    {Object}    hotel document (with images[], features[], activities[])
 *   rooms    {Array}     room documents (with seasonalPricing[], meals[], images[])
 *   cityName {string}    city name for display
 *   isAdmin  {boolean}
 *   onClose  {fn}
 *   onEdit   {fn}        opens the full edit modal
 */
export default function HotelPreviewModal({
  hotel,
  rooms = [],
  cityName = "",
  isAdmin,
  onClose,
  onEdit,
}) {
  const [activeRoomIdx, setActiveRoomIdx] = useState(0);
  const activeRoom = rooms[activeRoomIdx] || null;

  if (!hotel) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">

        {/* ── Floating header buttons ───────────────────────────────────── */}
        <div className="absolute top-3 right-3 z-20 flex items-center gap-2">
          {isAdmin && (
            <button type="button" onClick={onEdit}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/90 backdrop-blur-sm text-[12px] font-semibold text-indigo-700 hover:bg-indigo-600 hover:text-white border border-indigo-200 transition-all shadow-sm">
              <Pencil className="w-3.5 h-3.5" /> Edit
            </button>
          )}
          <button type="button" onClick={onClose} aria-label="Close"
            className="w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-white transition-all shadow-sm border border-gray-200">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Image carousel ────────────────────────────────────────────── */}
        <div className="flex-shrink-0">
          <ImageCarousel images={hotel.images} />
        </div>

        {/* ── Scrollable body ───────────────────────────────────────────── */}
        <div className="overflow-y-auto flex-1">

          {/* Hotel identity */}
          <div className="px-6 pt-5 pb-4 border-b border-gray-100">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-[22px] font-black text-gray-900 leading-tight">{hotel.name}</h2>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-[11px] font-bold capitalize">
                    {hotel.type}
                  </span>
                  {cityName && (
                    <span className="text-[12px] text-gray-400 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {cityName}
                    </span>
                  )}
                </div>
                {hotel.starRating > 0 && (
                  <div className="flex gap-0.5 mt-2">
                    {Array.from({ length: hotel.starRating }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                    <span className="text-[11px] text-gray-400 ml-1">{hotel.starRating}-star</span>
                  </div>
                )}
              </div>

              {/* Contact card */}
              <div className="flex-shrink-0 bg-gray-50 rounded-xl border border-gray-200 px-4 py-3 min-w-[160px]">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0">
                    <Phone className="w-3 h-3 text-white" />
                  </div>
                  <p className="text-[13px] font-bold text-gray-900">{hotel.contactNo}</p>
                </div>
                {hotel.email && (
                  <div className="flex items-center gap-2 mb-1">
                    <Mail className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    <p className="text-[11px] text-gray-500 truncate">{hotel.email}</p>
                  </div>
                )}
                {hotel.address && (
                  <div className="flex items-start gap-2">
                    <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
                    <p className="text-[11px] text-gray-500 leading-snug">{hotel.address}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Features */}
          {hotel.features?.length > 0 && (
            <div className="px-6 py-4 border-b border-gray-100">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2.5">
                Hotel Features & Amenities
              </p>
              <div className="flex flex-wrap gap-2">
                {hotel.features.map((f, i) => (
                  <span key={i} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-full text-[12px] text-gray-700 font-medium">
                    <Check className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                    {f}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Activities */}
          {hotel.activities?.length > 0 && (
            <div className="px-6 py-4 border-b border-gray-100">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5" />
                Activities & Add-ons
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {hotel.activities.map((a, i) => (
                  <div key={i} className="flex items-center justify-between bg-violet-50 border border-violet-100 rounded-xl px-3 py-2">
                    <span className="text-[13px] font-medium text-violet-900">{a.name}</span>
                    <span className="text-[13px] font-bold text-violet-700">
                      {a.price > 0 ? `+₹${Number(a.price).toLocaleString()}` : "Free"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Rooms section ───────────────────────────────────────────── */}
          {rooms.length > 0 && (
            <div className="px-6 py-4">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <BedDouble className="w-3.5 h-3.5" />
                Room Types ({rooms.length})
              </p>

              {/* Room selector */}
              <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-none">
                {rooms.map((room, i) => (
                  <RoomPreviewCard
                    key={room._id || i}
                    room={room}
                    isActive={activeRoomIdx === i}
                    onClick={() => setActiveRoomIdx(i)}
                  />
                ))}
              </div>

              {/* Active room details */}
              {activeRoom && (
                <div className="space-y-4">
                  {/* Room images */}
                  {activeRoom.images?.length > 0 && (
                    <div className="grid grid-cols-3 gap-2">
                      {activeRoom.images.slice(0, 3).map((img, i) => (
                        <div key={i} className="aspect-video rounded-xl overflow-hidden bg-gray-100 relative">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={img.url} alt={activeRoom.roomType} className="w-full h-full object-cover" />
                          {i === 2 && activeRoom.images.length > 3 && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                              <span className="text-white font-bold text-[13px]">+{activeRoom.images.length - 3}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Room info row — show seasonal price range */}
                  <div className="flex items-center gap-4 flex-wrap">
                    {activeRoom.seasonalPricing?.length > 0 && (() => {
                      const prices = activeRoom.seasonalPricing.map((s) => Number(s.pricePerNight)).filter((p) => p > 0);
                      if (prices.length === 0) return null;
                      const min = Math.min(...prices);
                      const max = Math.max(...prices);
                      return (
                        <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
                          <IndianRupee className="w-4 h-4 text-emerald-600" />
                          <span className="text-[17px] font-black text-emerald-800">
                            {min === max
                              ? min.toLocaleString()
                              : `${min.toLocaleString()} – ${max.toLocaleString()}`}
                          </span>
                          <span className="text-[11px] text-emerald-600 ml-0.5">/night</span>
                        </div>
                      );
                    })()}
                    <div className="flex items-center gap-1.5 text-[13px] text-gray-600">
                      <Users className="w-4 h-4 text-gray-400" />
                      Max {activeRoom.maxOccupancy} guest{activeRoom.maxOccupancy !== 1 ? "s" : ""}
                    </div>
                  </div>

                  {/* Room features */}
                  {activeRoom.features?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {activeRoom.features.map((f, i) => (
                        <span key={i} className="px-2.5 py-1 bg-gray-100 rounded-full text-[11px] text-gray-600 font-medium">{f}</span>
                      ))}
                    </div>
                  )}

                  {/* Meal plans */}
                  {activeRoom.meals?.length > 0 && (
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                        <Utensils className="w-3 h-3" /> Meal Plans
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {activeRoom.meals.map((m, i) => {
                          const info = MEAL_LABELS[m.plan] || { short: m.plan, full: "", color: "bg-gray-100 text-gray-700 border-gray-200" };
                          return (
                            <div key={i} className={`flex items-center justify-between rounded-xl px-3 py-2 border ${info.color}`}>
                              <div>
                                <span className="text-[11px] font-black">{info.short}</span>
                                <span className="text-[10px] text-current opacity-70 ml-1">— {info.full}</span>
                              </div>
                              <span className="text-[12px] font-bold">
                                {m.price > 0 ? `+₹${Number(m.price).toLocaleString()}` : "Incl."}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Season Calendar */}
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                      Price Calendar
                    </p>
                    <SeasonCalendar
                      seasonalPricing={activeRoom.seasonalPricing || []}
                      roomType={activeRoom.roomType}
                      compact
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* No rooms state */}
          {rooms.length === 0 && (
            <div className="px-6 py-8 text-center">
              <BedDouble className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-[13px] text-gray-400">No room types configured yet.</p>
              {isAdmin && (
                <button type="button" onClick={onEdit}
                  className="mt-3 text-[12px] text-indigo-600 hover:text-indigo-700 font-semibold underline">
                  + Add rooms via Edit Hotel
                </button>
              )}
            </div>
          )}

          {/* Bottom padding */}
          <div className="h-4" />
        </div>
      </div>
    </div>
  );
}
