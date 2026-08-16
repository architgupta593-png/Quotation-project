"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, MapPin, Moon, Sun, Building2, Car, IndianRupee,
  CheckCircle2, XCircle, ChevronDown, ChevronUp, Loader2, Pencil,
  Star, HeartHandshake, Users, Sparkles, FileText, Check, Compass,
  Utensils, Camera, Clock3, Zap, Shield, Receipt, Navigation,
} from "lucide-react";

const MEAL_PLAN_LABELS = {
  EP: "Room Only",
  CP: "Bed & Breakfast",
  MAP: "Breakfast + Dinner",
  AP: "All Meals",
  "": "Not specified",
};

const MEAL_EMOJI = { breakfast: "🌅", lunch: "☀️", dinner: "🌙" };

export default function PackageViewPage() {
  const { id } = useParams();
  const [pkg, setPkg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openDay, setOpenDay] = useState(0);
  const [activeAccomTab, setActiveAccomTab] = useState(0);

  useEffect(() => {
    fetch(`/api/packages/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.package) setPkg(data.package);
        else setError("Package not found");
      })
      .catch(() => setError("Failed to load package"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900">
        <div className="relative w-14 h-14 mb-5">
          <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20" />
          <div className="absolute inset-0 rounded-full border-4 border-t-indigo-500 animate-spin" />
        </div>
        <p className="text-[15px] font-bold text-slate-400">Loading package preview…</p>
      </div>
    );
  }

  if (!pkg) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8fafc] px-4">
        <XCircle className="w-12 h-12 text-rose-400 mb-4" />
        <h2 className="text-[20px] font-black text-slate-900 mb-2">{error || "Package not found"}</h2>
        <Link href="/dashboard/packages" className="text-[13px] font-bold text-indigo-600 hover:underline">
          ← Back to Packages
        </Link>
      </div>
    );
  }

  const currency = pkg.pricing?.currency || "INR";
  const pax = Math.max(1, pkg.pricing?.numberOfPersons || 2);
  const finalPrice = pkg.pricing?.finalPrice || 0;
  const perPersonPrice = pkg.pricing?.perPersonPrice || (pax > 0 ? Math.round(finalPrice / pax) : finalPrice);
  const perCouplePrice = pkg.pricing?.perCouplePrice || (pax >= 2 ? Math.round((finalPrice / pax) * 2) : finalPrice);

  return (
    <div className="min-h-screen bg-[#f0f4f8] font-sans text-slate-900">

      {/* ── Sticky Top Bar ── */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-slate-200/80 px-5 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/dashboard/packages"
            className="flex-shrink-0 p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="hidden sm:block min-w-0">
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-500">Package Preview</p>
            <h1 className="text-[14px] font-black text-slate-900 truncate max-w-xs">{pkg.title}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <span className={`px-3 py-1 rounded-full text-[10.5px] font-black uppercase tracking-wider border ${
            pkg.status === "published"
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-amber-50 text-amber-700 border-amber-200"
          }`}>
            {pkg.status === "published" ? "● Live" : "◌ Draft"}
          </span>
          <Link
            href={`/dashboard/packages/${id}/edit`}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[13px] font-extrabold transition-all shadow-sm shadow-indigo-500/20"
          >
            <Pencil className="w-3.5 h-3.5" /> Edit
          </Link>
        </div>
      </header>

      {/* ── Hero Section ── */}
      <div className="relative bg-slate-900 text-white overflow-hidden" style={{ minHeight: "420px" }}>
        {/* Cover image */}
        {pkg.coverImage?.url ? (
          <img
            src={pkg.coverImage.url}
            alt={pkg.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900" />
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/70 to-slate-900/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/60 to-transparent" />

        <div className="relative max-w-5xl mx-auto px-6 pt-12 pb-14 flex flex-col justify-end h-full" style={{ minHeight: "420px" }}>

          {/* Destination route */}
          {pkg.destination && (
            <div className="flex items-center gap-2 mb-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-[12px] font-bold backdrop-blur-sm">
                <Navigation className="w-3 h-3" />
                {pkg.destination}
              </span>
            </div>
          )}

          {/* Title */}
          <h1 className="text-[32px] sm:text-[42px] font-black leading-tight text-white tracking-tight mb-4 max-w-2xl">
            {pkg.title}
          </h1>

          {/* Duration + Cities pills */}
          <div className="flex flex-wrap items-center gap-2.5 mb-8">
            <span className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 text-white text-[12.5px] font-bold backdrop-blur-md">
              <Moon className="w-3.5 h-3.5 text-purple-300" /> {pkg.nights} Nights
            </span>
            <span className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 text-white text-[12.5px] font-bold backdrop-blur-md">
              <Sun className="w-3.5 h-3.5 text-amber-300" /> {pkg.days} Days
            </span>
            {pkg.destinations?.map((dest, i) => (
              <span key={i} className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-rose-500/20 border border-rose-400/30 text-rose-200 text-[12px] font-bold backdrop-blur-md">
                <MapPin className="w-3 h-3" /> {dest.cityName} ({dest.nights}N)
              </span>
            ))}
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl">
            <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-400/25 backdrop-blur-md">
              <p className="text-[9.5px] font-black uppercase tracking-widest text-emerald-300 flex items-center gap-1 mb-1">
                <HeartHandshake className="w-3 h-3" /> Per Couple
              </p>
              <p className="text-[22px] font-black text-emerald-300 leading-none">
                ₹{perCouplePrice.toLocaleString("en-IN")}
              </p>
              <p className="text-[10px] text-emerald-400/70 mt-0.5">for 2 persons</p>
            </div>
            <div className="p-4 rounded-2xl bg-indigo-500/15 border border-indigo-400/25 backdrop-blur-md">
              <p className="text-[9.5px] font-black uppercase tracking-widest text-indigo-300 flex items-center gap-1 mb-1">
                <Users className="w-3 h-3" /> Per Person
              </p>
              <p className="text-[22px] font-black text-indigo-300 leading-none">
                ₹{perPersonPrice.toLocaleString("en-IN")}
              </p>
              <p className="text-[10px] text-indigo-400/70 mt-0.5">per pax</p>
            </div>
            <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-400/25 backdrop-blur-md">
              <p className="text-[9.5px] font-black uppercase tracking-widest text-amber-300 flex items-center gap-1 mb-1">
                <Sparkles className="w-3 h-3" /> Package Total
              </p>
              <p className="text-[22px] font-black text-amber-300 leading-none">
                ₹{finalPrice.toLocaleString("en-IN")}
              </p>
              <p className="text-[10px] text-amber-400/70 mt-0.5">all inclusive</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-8">

        {/* Highlights */}
        {pkg.highlights?.length > 0 && (
          <section className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs">
            <h2 className="text-[16px] font-black text-slate-900 flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-xl bg-amber-100 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-amber-600" />
              </div>
              Package Highlights
            </h2>
            <div className="flex flex-wrap gap-2.5">
              {pkg.highlights.map((h, i) => (
                <span key={i} className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 rounded-full text-[12.5px] font-extrabold text-amber-900">
                  ✨ {h}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Day-by-Day Itinerary */}
        {pkg.itinerary?.length > 0 && (
          <section className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-[16px] font-black text-slate-900 flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-indigo-100 flex items-center justify-center">
                  <Sun className="w-4 h-4 text-indigo-600" />
                </div>
                Day-by-Day Itinerary
                <span className="text-[11px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                  {pkg.itinerary.length} Days
                </span>
              </h2>
            </div>

            {/* Timeline */}
            <div className="relative">
              {/* Vertical timeline line */}
              <div className="absolute left-[18px] top-6 bottom-6 w-0.5 bg-gradient-to-b from-indigo-200 via-purple-200 to-rose-200 rounded-full hidden sm:block" />

              <div className="space-y-3">
                {pkg.itinerary.map((day, i) => {
                  const isOpen = openDay === i;
                  const mealsArr = Object.entries(day.meals || {}).filter(([, v]) => v).map(([k]) => k);
                  const actCount = day.activities?.filter(Boolean).length || 0;
                  const hasImages = day.images?.length > 0;

                  return (
                    <div key={i} className="sm:pl-10 relative">
                      {/* Day badge on timeline */}
                      <div className="hidden sm:flex absolute left-0 top-4 w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white text-[12px] font-black items-center justify-center shadow-md shadow-indigo-500/25 z-10">
                        D{day.day}
                      </div>

                      <div className={`rounded-2xl border overflow-hidden transition-all duration-200 ${
                        isOpen
                          ? "border-indigo-200 shadow-md shadow-indigo-500/10"
                          : "border-slate-200/80 hover:border-indigo-200 hover:shadow-sm"
                      }`}>
                        {/* Header */}
                        <button
                          type="button"
                          onClick={() => setOpenDay(isOpen ? -1 : i)}
                          className={`w-full flex items-center gap-3 px-5 py-4 text-left transition-colors ${
                            isOpen ? "bg-indigo-50/80" : "bg-white hover:bg-slate-50"
                          }`}
                        >
                          {/* Mobile day badge */}
                          <div className="sm:hidden flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 text-white text-[11px] font-black flex items-center justify-center">
                            D{day.day}
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="text-[14px] font-black text-slate-900 truncate">
                              {day.title || `Day ${day.day} — Schedule`}
                            </p>
                            <div className="flex items-center gap-3 mt-0.5">
                              {actCount > 0 && (
                                <span className="text-[11px] font-bold text-indigo-600 flex items-center gap-1">
                                  <Zap className="w-3 h-3" /> {actCount} activities
                                </span>
                              )}
                              {mealsArr.length > 0 && (
                                <span className="text-[11px] font-bold text-slate-500">
                                  {mealsArr.map(m => MEAL_EMOJI[m]).join(" ")} meals included
                                </span>
                              )}
                              {hasImages && (
                                <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                                  <Camera className="w-3 h-3" /> {day.images.length} photos
                                </span>
                              )}
                            </div>
                          </div>

                          <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                            isOpen ? "bg-indigo-100 text-indigo-600" : "bg-slate-100 text-slate-400"
                          }`}>
                            {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </div>
                        </button>

                        {/* Body */}
                        {isOpen && (
                          <div className="border-t border-slate-100 bg-white px-5 pb-5 pt-4 space-y-5">
                            {/* Description — HTML from Tiptap */}
                            {day.description && (
                              <div
                                className="text-[13.5px] text-slate-700 leading-relaxed bg-indigo-50/40 border border-indigo-100/80 p-4 rounded-2xl itinerary-description"
                                dangerouslySetInnerHTML={{ __html: day.description }}
                              />
                            )}

                            {/* Day images */}
                            {day.images?.length > 0 && (
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {day.images.map((img, ii) => (
                                  <div key={ii} className="relative aspect-video rounded-xl overflow-hidden">
                                    <img
                                      src={img.url}
                                      alt={img.caption || `Day ${day.day} photo`}
                                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                                    />
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Activities */}
                            {actCount > 0 && (
                              <div>
                                <p className="text-[10.5px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                  <Zap className="w-3.5 h-3.5 text-rose-400" /> Activities & Sightseeings
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {day.activities.filter(Boolean).map((act, ai) => {
                                    const name = typeof act === "string" ? act : act?.name || "";
                                    const price = typeof act === "string" ? 0 : act?.price || 0;
                                    return (
                                      <span key={ai} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-[12.5px] font-bold text-rose-900">
                                        <Zap className="w-3 h-3 text-rose-500" />
                                        {name}
                                        {price > 0 && <span className="text-[10.5px] text-emerald-700 font-black">(₹{price.toLocaleString("en-IN")})</span>}
                                      </span>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {/* Meals */}
                            {mealsArr.length > 0 && (
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[10.5px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                  <Utensils className="w-3 h-3" /> Meals:
                                </span>
                                {["breakfast", "lunch", "dinner"].map((meal) => (
                                  <span
                                    key={meal}
                                    className={`px-3 py-1 rounded-full text-[11.5px] font-bold border ${
                                      day.meals?.[meal]
                                        ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                                        : "bg-slate-100 border-slate-200 text-slate-400 line-through opacity-50"
                                    }`}
                                  >
                                    {MEAL_EMOJI[meal]} {meal.charAt(0).toUpperCase() + meal.slice(1)}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* Accommodation Tiers — Tabbed */}
        {pkg.accommodationOptions?.length > 0 && (
          <section className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-7 h-7 rounded-xl bg-violet-100 flex items-center justify-center">
                <Building2 className="w-4 h-4 text-violet-600" />
              </div>
              <h2 className="text-[16px] font-black text-slate-900">Accommodation Options</h2>
            </div>

            {/* Tabs for accommodation tiers */}
            {pkg.accommodationOptions.length > 1 && (
              <div className="flex gap-2 mb-5 flex-wrap">
                {pkg.accommodationOptions.map((opt, ti) => (
                  <button
                    key={ti}
                    type="button"
                    onClick={() => setActiveAccomTab(ti)}
                    className={`px-4 py-1.5 rounded-xl text-[12.5px] font-extrabold border transition-all ${
                      activeAccomTab === ti
                        ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
                        : "bg-white border-slate-200 text-slate-600 hover:border-indigo-300"
                    }`}
                  >
                    {opt.label || `Option ${ti + 1}`}
                  </button>
                ))}
              </div>
            )}

            {(() => {
              const opt = pkg.accommodationOptions[activeAccomTab];
              if (!opt) return null;

              // Group consecutive nights at same hotel
              const legs = [];
              (opt.nights || []).forEach((n) => {
                const last = legs[legs.length - 1];
                if (last && last.hotelName === n.hotelName && last.cityName === n.cityName && last.roomType === n.roomType) {
                  last.endNight = n.night;
                  last.count += 1;
                } else {
                  legs.push({ ...n, startNight: n.night, endNight: n.night, count: 1 });
                }
              });

              const total = (opt.nights || []).reduce((s, n) => s + (n.pricePerNight || 0), 0);

              return (
                <div className="space-y-3">
                  {/* Option header */}
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-violet-50/60 border border-violet-100">
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-widest text-violet-600">Selected Tier</p>
                      <p className="text-[16px] font-black text-slate-900">{opt.label}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Accommodation Total</p>
                      <p className="text-[20px] font-black text-violet-900">₹{total.toLocaleString("en-IN")}</p>
                    </div>
                  </div>

                  {/* Hotel legs */}
                  <div className="space-y-2">
                    {legs.map((leg, li) => (
                      <div key={li} className="flex items-start gap-4 p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-violet-200 transition-all">
                        {/* Night badge */}
                        <div className="flex-shrink-0 text-center">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white text-[11px] font-black flex items-center justify-center shadow-sm">
                            {leg.count > 1 ? `N${leg.startNight}–${leg.endNight}` : `N${leg.startNight}`}
                          </div>
                          <p className="text-[9.5px] font-bold text-slate-400 mt-1">{leg.count}N</p>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-[14px] font-black text-slate-900">
                              {leg.hotelName || "Hotel TBC"}
                            </p>
                            {leg.starRating > 0 && (
                              <div className="flex">
                                {Array.from({ length: leg.starRating }).map((_, si) => (
                                  <Star key={si} className="w-3 h-3 fill-amber-400 text-amber-400" />
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-1.5 mt-1.5">
                            <span className="px-2 py-0.5 rounded-full bg-violet-50 border border-violet-200 text-[11px] font-bold text-violet-800">
                              📍 {leg.cityName}
                            </span>
                            {leg.roomType && (
                              <span className="px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-[11px] font-bold text-slate-700">
                                🛏 {leg.roomType}
                              </span>
                            )}
                            {leg.mealPlan && (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-bold text-emerald-800">
                                🍽 {MEAL_PLAN_LABELS[leg.mealPlan] || leg.mealPlan}
                              </span>
                            )}
                          </div>
                          {leg.notes && (
                            <p className="text-[11.5px] text-slate-500 italic mt-1.5">📌 {leg.notes}</p>
                          )}
                        </div>

                        {leg.pricePerNight > 0 && (
                          <div className="flex-shrink-0 text-right">
                            <p className="text-[14px] font-black text-slate-900">
                              ₹{leg.pricePerNight.toLocaleString("en-IN")}
                            </p>
                            <p className="text-[10.5px] text-slate-400 font-semibold">/ night</p>
                            {leg.count > 1 && (
                              <p className="text-[11px] font-black text-indigo-600 mt-0.5">
                                ₹{(leg.pricePerNight * leg.count).toLocaleString("en-IN")} total
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </section>
        )}

        {/* Vehicle */}
        {pkg.vehicle?.vehicleType && (
          <section className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs">
            <h2 className="text-[16px] font-black text-slate-900 flex items-center gap-2 mb-5">
              <div className="w-7 h-7 rounded-xl bg-sky-100 flex items-center justify-center">
                <Car className="w-4 h-4 text-sky-600" />
              </div>
              Vehicle & Transport
            </h2>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-sky-50/60 border border-sky-200/60">
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[20px] font-black text-sky-900">{pkg.vehicle.vehicleType}</span>
                  {pkg.vehicle.model && (
                    <span className="text-[12.5px] font-bold text-sky-700 bg-white px-3 py-0.5 rounded-full border border-sky-200">
                      {pkg.vehicle.model}
                    </span>
                  )}
                  <span className={`text-[11.5px] font-bold px-2.5 py-0.5 rounded-full border ${
                    pkg.vehicle.acType === "AC"
                      ? "bg-cyan-50 border-cyan-200 text-cyan-800"
                      : "bg-slate-100 border-slate-200 text-slate-600"
                  }`}>
                    ❄️ {pkg.vehicle.acType || "AC"}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[12.5px] font-semibold text-slate-600">
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-sky-500" />
                    {pkg.vehicle.seats || 4} Persons
                  </span>
                </div>
                {pkg.vehicle.notes && (
                  <p className="text-[12px] text-sky-800 italic">📌 {pkg.vehicle.notes}</p>
                )}
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Transport Total</p>
                <p className="text-[22px] font-black text-sky-900">₹{(pkg.vehicle.vehiclePrice || 0).toLocaleString("en-IN")}</p>
              </div>
            </div>
          </section>
        )}

        {/* Pricing & Inclusions */}
        {pkg.pricing && (
          <section className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-6">
            <h2 className="text-[16px] font-black text-slate-900 flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-emerald-100 flex items-center justify-center">
                <IndianRupee className="w-4 h-4 text-emerald-600" />
              </div>
              Pricing Breakdown
            </h2>

            {/* Cost breakdown table */}
            <div className="rounded-2xl border border-slate-200/80 overflow-hidden text-[13px]">
              {[
                { label: "🏨 Accommodation", value: pkg.pricing.accommodationTotal || 0, color: "bg-violet-50/60" },
                { label: "🚗 Vehicle & Transport", value: pkg.pricing.vehicleTotal || 0, color: "bg-sky-50/60" },
                ...(pkg.pricing.activitiesTotal > 0 ? [{ label: "⚡ Activities Cost", value: pkg.pricing.activitiesTotal, color: "bg-rose-50/60" }] : []),
                { label: "📊 Subtotal", value: pkg.pricing.subtotal || 0, bold: true, color: "bg-slate-100" },
                { label: `📈 Profit Margin (${pkg.pricing.marginType === "percentage" ? `${pkg.pricing.margin}%` : "Absolute"})`, value: pkg.pricing.margin || 0, color: "bg-amber-50/60", isMargin: true, marginType: pkg.pricing.marginType },
              ].map((row, ri) => (
                <div key={ri} className={`flex items-center justify-between px-4 py-3 ${row.color} ${ri > 0 ? "border-t border-slate-100" : ""}`}>
                  <span className={`${row.bold ? "font-extrabold text-slate-900" : "font-semibold text-slate-700"}`}>{row.label}</span>
                  <span className={`${row.bold ? "font-extrabold text-slate-900 text-[14px]" : "font-bold text-slate-800"}`}>
                    {row.isMargin && row.marginType === "percentage"
                      ? `${row.value}%`
                      : `₹${Number(row.value).toLocaleString("en-IN")}`}
                  </span>
                </div>
              ))}
              {pkg.pricing.includeGst && (
                <div className="flex items-center justify-between px-4 py-3 bg-blue-50/60 border-t border-slate-100">
                  <span className="font-semibold text-blue-900 flex items-center gap-1.5">
                    <Receipt className="w-3.5 h-3.5" /> GST ({pkg.pricing.gstPercentage || 5}%)
                  </span>
                  <span className="font-bold text-blue-800">
                    ₹{Math.round((pkg.pricing.subtotal || 0) * ((pkg.pricing.gstPercentage || 5) / 100)).toLocaleString("en-IN")}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between px-4 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
                <span className="font-black text-[15px] flex items-center gap-2">
                  <Sparkles className="w-4 h-4" /> Grand Total Package Price
                </span>
                <span className="font-black text-[20px]">₹{finalPrice.toLocaleString("en-IN")}</span>
              </div>
            </div>

            {/* Rate cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/20">
                <p className="text-[10.5px] font-black uppercase tracking-widest text-emerald-100 flex items-center gap-1.5 mb-1.5">
                  <HeartHandshake className="w-4 h-4" /> Per Couple Rate
                </p>
                <p className="text-[28px] font-black leading-none">{currency} {perCouplePrice.toLocaleString("en-IN")}</p>
                <p className="text-[12px] text-emerald-200 mt-1">for 2 persons</p>
              </div>
              <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/20">
                <p className="text-[10.5px] font-black uppercase tracking-widest text-indigo-100 flex items-center gap-1.5 mb-1.5">
                  <Users className="w-4 h-4" /> Per Person Rate
                </p>
                <p className="text-[28px] font-black leading-none">{currency} {perPersonPrice.toLocaleString("en-IN")}</p>
                <p className="text-[12px] text-indigo-200 mt-1">per pax</p>
              </div>
            </div>

            {/* Inclusions & Exclusions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {pkg.pricing?.includes?.length > 0 && (
                <div>
                  <h3 className="text-[12px] font-black uppercase tracking-wider text-emerald-800 flex items-center gap-1.5 mb-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Included ({pkg.pricing.includes.length})
                  </h3>
                  <div className="space-y-1.5">
                    {pkg.pricing.includes.map((inc, i) => (
                      <div key={i} className="flex items-center gap-2.5 p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-100 text-[12.5px] font-bold text-slate-800">
                        <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                        {inc}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {pkg.pricing?.excludes?.length > 0 && (
                <div>
                  <h3 className="text-[12px] font-black uppercase tracking-wider text-rose-800 flex items-center gap-1.5 mb-3">
                    <XCircle className="w-4 h-4 text-rose-600" />
                    Not Included ({pkg.pricing.excludes.length})
                  </h3>
                  <div className="space-y-1.5">
                    {pkg.pricing.excludes.map((exc, i) => (
                      <div key={i} className="flex items-center gap-2.5 p-2.5 rounded-xl bg-rose-50/60 border border-rose-100 text-[12.5px] font-bold text-slate-800">
                        <XCircle className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />
                        {exc}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Instructions & Terms */}
        {pkg.instructions?.length > 0 && (
          <section className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-5">
            <h2 className="text-[16px] font-black text-slate-900 flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-purple-100 flex items-center justify-center">
                <Shield className="w-4 h-4 text-purple-600" />
              </div>
              Instructions & Terms
            </h2>
            <div className="space-y-4">
              {pkg.instructions.map((block, idx) => {
                const titleText = block.heading || block.title;
                return (
                  <div key={idx} className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-3">
                    {titleText && (
                      <h3 className="text-[14px] font-black text-slate-900 border-b border-slate-200/80 pb-2">
                        {titleText}
                      </h3>
                    )}
                    {block.format === "paragraph" ? (
                      <div className="text-[13.5px] text-slate-700 leading-relaxed bg-white p-4 rounded-xl border border-slate-200/70 whitespace-pre-line">
                        {block.content}
                      </div>
                    ) : block.format === "numbered" ? (
                      <ol className="list-decimal list-inside space-y-1.5 text-[13.5px] font-semibold text-slate-800">
                        {(block.items || []).map((item, i) => (
                          <li key={i} className={`pl-1 ${item.startsWith("   ") ? "ml-6 text-purple-900 font-medium" : ""}`}>
                            {item.trim()}
                          </li>
                        ))}
                      </ol>
                    ) : block.format === "alphabetic" ? (
                      <ol className="list-[lower-alpha] list-inside space-y-1.5 text-[13.5px] font-semibold text-slate-800">
                        {(block.items || []).map((item, i) => (
                          <li key={i} className={`pl-1 ${item.startsWith("   ") ? "ml-6 text-purple-900 font-medium" : ""}`}>
                            {item.trim()}
                          </li>
                        ))}
                      </ol>
                    ) : (
                      <ul className="list-disc list-inside space-y-1.5 text-[13.5px] font-semibold text-slate-800">
                        {(block.items || []).map((item, i) => (
                          <li key={i} className={`pl-1 ${item.startsWith("   ") ? "ml-6 text-purple-900 font-medium" : ""}`}>
                            {item.trim()}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>

      {/* Itinerary description prose styles */}
      <style>{`
        .itinerary-description p { margin: 0 0 0.5em; }
        .itinerary-description ul { list-style: disc; padding-left: 1.4em; margin: 0.3em 0; }
        .itinerary-description ol { list-style: decimal; padding-left: 1.4em; margin: 0.3em 0; }
        .itinerary-description li { margin: 0.15em 0; }
        .itinerary-description strong { font-weight: 700; }
        .itinerary-description em { font-style: italic; }
        .itinerary-description u { text-decoration: underline; }
        .itinerary-description p:last-child { margin-bottom: 0; }
      `}</style>
    </div>
  );
}
