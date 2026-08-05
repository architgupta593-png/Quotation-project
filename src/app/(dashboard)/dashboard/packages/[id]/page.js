"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, MapPin, Moon, Sun, Building2, Car, IndianRupee, CheckCircle2, XCircle,
  ChevronDown, ChevronUp, Loader2, Pencil, Star, HeartHandshake, Users, Receipt, Sparkles,
  ShieldCheck, FileText, Check, Compass,
} from "lucide-react";

const MEAL_PLAN_LABELS = {
  EP: "Room Only (EP)",
  CP: "Bed & Breakfast (CP)",
  MAP: "Breakfast + Dinner (MAP)",
  AP: "All Meals (AP)",
  "": "Not specified",
};

export default function PackageViewPage() {
  const { id } = useParams();
  const [pkg, setPkg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openDay, setOpenDay] = useState(0);

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
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8fafc]">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-3" />
        <p className="text-[14px] font-extrabold text-slate-600">Loading package preview…</p>
      </div>
    );
  }

  if (!pkg) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8fafc] px-4">
        <XCircle className="w-10 h-10 text-rose-500 mb-3" />
        <h2 className="text-[18px] font-black text-slate-900 mb-1">{error || "Package not found"}</h2>
        <Link href="/dashboard/packages" className="text-[13px] font-bold text-indigo-600 hover:underline">
          ← Back to Packages List
        </Link>
      </div>
    );
  }

  const currency = pkg.pricing?.currency || "INR";
  const pax = Math.max(1, pkg.pricing?.numberOfPersons || 2);
  const finalPrice = pkg.pricing?.finalPrice || pkg.pricing?.totalPrice || 0;
  const perPersonPrice = pkg.pricing?.perPersonPrice || (pax > 0 ? Math.round(finalPrice / pax) : finalPrice);
  const perCouplePrice = pkg.pricing?.perCouplePrice || (pax >= 2 ? Math.round((finalPrice / pax) * 2) : finalPrice);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans pb-24">
      {/* ── Top Bar ── */}
      <header className="sticky top-0 z-30 bg-slate-900 text-white border-b border-slate-800 px-6 py-4 flex items-center justify-between shadow-lg shadow-slate-900/20">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/packages"
            className="p-2.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-all border border-slate-700/60 flex items-center gap-2 text-[13px] font-bold"
          >
            <ArrowLeft className="w-4 h-4" /> Packages List
          </Link>
          <div className="h-6 w-px bg-slate-800 hidden sm:block" />
          <div className="hidden sm:block">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-300 bg-indigo-500/20 px-2.5 py-0.5 rounded-full border border-indigo-500/30">
              Package Preview
            </span>
            <h1 className="text-[15px] font-black text-white leading-snug mt-0.5 truncate max-w-sm">
              {pkg.title}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span
            className={`px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider border ${
              pkg.status === "published"
                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                : "bg-amber-500/20 text-amber-300 border-amber-500/30"
            }`}
          >
            ● {pkg.status}
          </span>
          <Link
            href={`/dashboard/packages/${id}/edit`}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-600 hover:from-indigo-600 hover:to-pink-700 text-white text-[13px] font-extrabold shadow-lg shadow-indigo-500/25 transition-all hover:scale-[1.02]"
          >
            <Pencil className="w-4 h-4" /> Edit Package
          </Link>
        </div>
      </header>

      {/* ── Executive Hero Banner ── */}
      <div className="relative bg-slate-900 text-white overflow-hidden border-b border-slate-800">
        {pkg.coverImage?.url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={pkg.coverImage.url}
            alt={pkg.title}
            className="absolute inset-0 w-full h-full object-cover opacity-25 filter blur-xs scale-105"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/80 to-transparent" />

        <div className="relative max-w-6xl mx-auto px-6 py-12 space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 text-white text-[12px] font-bold backdrop-blur-md border border-white/15 shadow-xs">
              <Moon className="w-3.5 h-3.5 text-purple-300" /> {pkg.nights} Nights
            </span>
            <span className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 text-white text-[12px] font-bold backdrop-blur-md border border-white/15 shadow-xs">
              <Sun className="w-3.5 h-3.5 text-amber-300" /> {pkg.days} Days
            </span>
            {pkg.destinations?.length > 0 && (
              <span className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-indigo-500/25 text-indigo-200 text-[12px] font-bold backdrop-blur-md border border-indigo-400/30">
                <MapPin className="w-3.5 h-3.5 text-rose-400" /> {pkg.destinations.length} Cities Route
              </span>
            )}
          </div>

          <h1 className="text-[28px] sm:text-[36px] font-black leading-tight text-white tracking-tight">
            {pkg.title}
          </h1>

          {pkg.destination && (
            <p className="text-[15px] font-extrabold text-indigo-200 flex items-center gap-2">
              <Compass className="w-4.5 h-4.5 text-indigo-400" />
              {pkg.destination}
            </p>
          )}

          {/* Rate Highlights Cards */}
          <div className="pt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl">
            <div className="p-4 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md space-y-1">
              <p className="text-[10.5px] font-black uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                <HeartHandshake className="w-4 h-4 text-emerald-400" /> Per Couple Rate (2 Pax)
              </p>
              <p className="text-[22px] font-black text-emerald-400">
                {currency} {perCouplePrice.toLocaleString()}
                <span className="text-[12px] font-semibold text-slate-300"> / couple</span>
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md space-y-1">
              <p className="text-[10.5px] font-black uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-indigo-400" /> Per Person Rate (1 Pax)
              </p>
              <p className="text-[22px] font-black text-indigo-300">
                {currency} {perPersonPrice.toLocaleString()}
                <span className="text-[12px] font-semibold text-slate-300"> / person</span>
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md space-y-1">
              <p className="text-[10.5px] font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" /> Grand Total Package Price
              </p>
              <p className="text-[22px] font-black text-amber-300">
                {currency} {finalPrice.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Content Grid ── */}
      <div className="max-w-6xl mx-auto px-6 py-10 space-y-10">
        {/* Highlights */}
        {pkg.highlights?.length > 0 && (
          <div className="bg-white rounded-3xl border border-slate-200/90 p-7 shadow-xs space-y-4">
            <h2 className="text-[17px] font-black text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              Package Highlights
            </h2>
            <div className="flex flex-wrap gap-2.5">
              {pkg.highlights.map((h, i) => (
                <span
                  key={i}
                  className="px-4 py-2 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl text-[13px] font-extrabold text-indigo-900 shadow-xs"
                >
                  ✨ {h}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Day-by-Day Itinerary */}
        {pkg.itinerary?.length > 0 && (
          <div className="bg-white rounded-3xl border border-slate-200/90 p-7 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-[18px] font-black text-slate-900 flex items-center gap-2">
                  <Sun className="w-5 h-5 text-amber-500" />
                  Day-by-Day Itinerary Schedule ({pkg.itinerary.length} Days)
                </h2>
                <p className="text-[13px] text-slate-500 mt-0.5">Comprehensive daily sightseeings & activities plan</p>
              </div>
            </div>

            <div className="space-y-4">
              {pkg.itinerary.map((day, i) => {
                const isOpen = openDay === i;
                const activityCount = day.activities?.filter(Boolean).length || 0;
                const mealsArr = Object.entries(day.meals || {}).filter(([, v]) => v).map(([k]) => k);

                return (
                  <div
                    key={i}
                    className="rounded-2xl border border-slate-200/90 bg-white overflow-hidden shadow-xs hover:border-indigo-300 transition-all"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenDay(isOpen ? -1 : i)}
                      className="w-full flex items-center gap-4 px-6 py-4 hover:bg-slate-50/80 transition-colors text-left"
                    >
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center text-white text-[13.5px] font-black flex-shrink-0 shadow-sm">
                        {day.day}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-[15px] font-black text-slate-900 truncate">
                          {day.title || `Day ${day.day} — Schedule`}
                        </h3>
                        <p className="text-[12px] text-slate-500 font-semibold mt-0.5">
                          {activityCount} activities · {mealsArr.length > 0 ? mealsArr.map(m => m.charAt(0).toUpperCase() + m.slice(1)).join(", ") : "No meals specified"}
                        </p>
                      </div>
                      {isOpen ? (
                        <ChevronUp className="w-5 h-5 text-slate-400 flex-shrink-0" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-slate-400 flex-shrink-0" />
                      )}
                    </button>

                    {isOpen && (
                      <div className="px-6 pb-6 border-t border-slate-100 space-y-5 pt-5 bg-slate-50/40">
                        {day.description && (
                          <p className="text-[13.5px] text-slate-700 leading-relaxed font-medium bg-white p-4 rounded-2xl border border-slate-200/80">
                            {day.description}
                          </p>
                        )}

                        {activityCount > 0 && (
                          <div className="space-y-2">
                            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                              Activities & Sightseeings
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {day.activities.filter(Boolean).map((act, ai) => (
                                <div
                                  key={ai}
                                  className="flex items-center gap-2 p-3 rounded-xl bg-white border border-slate-200/80 text-[13px] font-bold text-slate-800 shadow-xs"
                                >
                                  <MapPin className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                                  <span>{act}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Meals Included */}
                        <div className="flex items-center gap-2 pt-1">
                          <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest mr-2">Meals:</span>
                          {["breakfast", "lunch", "dinner"].map((meal) => {
                            const isIncluded = Boolean(day.meals?.[meal]);
                            return (
                              <span
                                key={meal}
                                className={`px-3 py-1 rounded-full text-[11.5px] font-extrabold border ${
                                  isIncluded
                                    ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                                    : "bg-slate-100 border-slate-200 text-slate-400 line-through opacity-60"
                                }`}
                              >
                                {isIncluded ? "✓ " : ""}{meal.charAt(0).toUpperCase() + meal.slice(1)}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Accommodation Category Tiers */}
        {pkg.accommodationOptions?.length > 0 && (
          <div className="bg-white rounded-3xl border border-slate-200/90 p-7 shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-[18px] font-black text-slate-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-600" />
                Hotel Accommodation Category Tiers ({pkg.accommodationOptions.length} Options)
              </h2>
              <p className="text-[13px] text-slate-500 mt-0.5">Pre-selected hotel stays grouped by continuous route legs</p>
            </div>

            <div className="space-y-6">
              {pkg.accommodationOptions.map((opt, optIdx) => {
                const legs = [];
                (opt.nights || []).forEach((n) => {
                  const lastLeg = legs[legs.length - 1];
                  if (
                    lastLeg &&
                    lastLeg.hotelName === n.hotelName &&
                    lastLeg.roomType === n.roomType &&
                    lastLeg.cityName === n.cityName
                  ) {
                    lastLeg.endNight = n.night;
                    lastLeg.nightsCount += 1;
                  } else {
                    legs.push({
                      cityName: n.cityName,
                      hotelName: n.hotelName,
                      roomType: n.roomType,
                      mealPlan: n.mealPlan,
                      starRating: n.starRating,
                      pricePerNight: n.pricePerNight,
                      notes: n.notes,
                      startNight: n.night,
                      endNight: n.night,
                      nightsCount: 1,
                    });
                  }
                });

                const optTotal = (opt.nights || []).reduce((s, n) => s + (n.pricePerNight || 0), 0);

                return (
                  <div key={optIdx} className="bg-slate-50/60 rounded-3xl border border-slate-200/90 p-6 space-y-5">
                    <div className="flex items-center justify-between border-b border-slate-200/80 pb-4">
                      <div>
                        <span className="text-[11px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
                          Category Option {optIdx + 1}
                        </span>
                        <h3 className="text-[17px] font-black text-slate-900 mt-1">{opt.label}</h3>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Accommodation Total</p>
                        <p className="text-[18px] font-black text-indigo-900">₹{optTotal.toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="space-y-3.5">
                      {legs.map((leg, li) => (
                        <div key={li} className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col sm:flex-row items-start sm:items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-[13px] font-black flex items-center justify-center flex-shrink-0 shadow-sm">
                            {leg.nightsCount > 1 ? `N${leg.startNight}–${leg.endNight}` : `N${leg.startNight}`}
                          </div>

                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-center gap-2">
                              <h4 className="text-[15px] font-black text-slate-900 truncate">
                                {leg.hotelName || "Hotel To Be Confirmed"}
                              </h4>
                              {leg.starRating > 0 && (
                                <div className="flex items-center gap-0.5">
                                  {Array.from({ length: leg.starRating }).map((_, si) => (
                                    <Star key={si} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                  ))}
                                </div>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              <span className="px-2.5 py-0.5 rounded-full bg-violet-50 text-violet-800 text-[11.5px] font-bold border border-violet-200">
                                📍 {leg.cityName || "Destination"} ({leg.nightsCount} Nights)
                              </span>
                              {leg.roomType && (
                                <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11.5px] font-bold border border-slate-200">
                                  🛏️ {leg.roomType}
                                </span>
                              )}
                              {leg.mealPlan && (
                                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[11.5px] font-bold border border-emerald-200">
                                  🍽️ {MEAL_PLAN_LABELS[leg.mealPlan] || leg.mealPlan}
                                </span>
                              )}
                            </div>

                            {leg.notes && <p className="text-[12px] text-slate-500 italic pt-0.5">Note: {leg.notes}</p>}
                          </div>

                          {leg.pricePerNight > 0 && (
                            <div className="text-right flex-shrink-0">
                              <p className="text-[14px] font-black text-slate-900">
                                ₹{leg.pricePerNight.toLocaleString()} <span className="text-[11px] text-slate-400 font-semibold">/ night</span>
                              </p>
                              {leg.nightsCount > 1 && (
                                <p className="text-[11px] font-bold text-indigo-600">
                                  Total: ₹{(leg.pricePerNight * leg.nightsCount).toLocaleString()}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Vehicle & Transport Fleet */}
        {pkg.vehicle?.vehicleType && (
          <div className="bg-white rounded-3xl border border-slate-200/90 p-7 shadow-xs space-y-5">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-[18px] font-black text-slate-900 flex items-center gap-2">
                <Car className="w-5 h-5 text-sky-600" />
                Vehicle & Transport Fleet Details
              </h2>
            </div>

            <div className="p-6 rounded-2xl bg-sky-50/60 border border-sky-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[18px] font-black text-sky-950">{pkg.vehicle.vehicleType}</span>
                  {pkg.vehicle.model && (
                    <span className="text-[13px] font-extrabold text-sky-700 bg-white px-2.5 py-0.5 rounded-full border border-sky-200">
                      {pkg.vehicle.model}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-[12.5px] font-bold text-slate-600">
                  <span>Capacity: {pkg.vehicle.seats || 4} Persons</span>
                  <span>•</span>
                  <span>{pkg.vehicle.acType || "AC"} Vehicle</span>
                </div>
                {pkg.vehicle.notes && (
                  <p className="text-[12.5px] text-sky-900 font-medium italic pt-1">Notes: {pkg.vehicle.notes}</p>
                )}
              </div>

              <div className="text-right flex-shrink-0">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Transport Fleet Total</p>
                <p className="text-[20px] font-black text-sky-950">₹{(pkg.vehicle.vehiclePrice || 0).toLocaleString()}</p>
              </div>
            </div>
          </div>
        )}

        {/* Financial Breakdown & Inclusions */}
        {pkg.pricing && (
          <div className="bg-white rounded-3xl border border-slate-200/90 p-7 shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-[18px] font-black text-slate-900 flex items-center gap-2">
                <IndianRupee className="w-5 h-5 text-emerald-600" />
                Pricing, Margins & Inclusions Breakdown
              </h2>
            </div>

            {/* Pricing Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white space-y-1 shadow-md shadow-emerald-500/20">
                <p className="text-[11px] font-black uppercase tracking-widest text-emerald-100 flex items-center gap-1.5">
                  <HeartHandshake className="w-4 h-4" /> Per Couple Rate (2 Pax)
                </p>
                <p className="text-[24px] font-black">
                  {currency} {perCouplePrice.toLocaleString()}
                  <span className="text-[13px] font-semibold text-emerald-100"> / couple</span>
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white space-y-1 shadow-md shadow-indigo-500/20">
                <p className="text-[11px] font-black uppercase tracking-widest text-indigo-100 flex items-center gap-1.5">
                  <Users className="w-4 h-4" /> Per Person Rate (1 Pax)
                </p>
                <p className="text-[24px] font-black">
                  {currency} {perPersonPrice.toLocaleString()}
                  <span className="text-[13px] font-semibold text-indigo-100"> / person</span>
                </p>
              </div>
            </div>

            {/* Inclusions & Exclusions Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
              {/* Inclusions */}
              {pkg.pricing?.includes?.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-[13px] font-black uppercase tracking-wider text-emerald-800 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Inclusions Included ({pkg.pricing.includes.length})
                  </h3>
                  <div className="space-y-2">
                    {pkg.pricing.includes.map((inc, i) => (
                      <div key={i} className="flex items-center gap-2.5 p-3 rounded-xl bg-emerald-50/60 border border-emerald-100 text-[13px] font-bold text-slate-800">
                        <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        <span>{inc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Exclusions */}
              {pkg.pricing?.excludes?.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-[13px] font-black uppercase tracking-wider text-rose-800 flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-rose-600" />
                    Exclusions Not Included ({pkg.pricing.excludes.length})
                  </h3>
                  <div className="space-y-2">
                    {pkg.pricing.excludes.map((exc, i) => (
                      <div key={i} className="flex items-center gap-2.5 p-3 rounded-xl bg-rose-50/60 border border-rose-100 text-[13px] font-bold text-slate-800">
                        <XCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
                        <span>{exc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Instructions & Terms */}
        {pkg.instructions?.length > 0 && (
          <div className="bg-white rounded-3xl border border-slate-200/90 p-7 shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-[18px] font-black text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-600" />
                Instructions, Guidelines & Cancellation Policy
              </h2>
            </div>

            <div className="space-y-6">
              {pkg.instructions.map((block, idx) => (
                <div key={idx} className="p-5 rounded-2xl bg-slate-50/60 border border-slate-200/80 space-y-3">
                  {block.heading && (
                    <h3 className="text-[15px] font-black text-slate-900 border-b border-slate-200/80 pb-2">
                      {block.heading}
                    </h3>
                  )}

                  {block.format === "paragraph" ? (
                    <p className="text-[13.5px] text-slate-700 leading-relaxed font-medium whitespace-pre-line">
                      {block.content}
                    </p>
                  ) : block.format === "numbered" ? (
                    <ol className="list-decimal list-inside space-y-2 text-[13.5px] font-bold text-slate-800">
                      {(block.items || []).map((item, i) => (
                        <li key={i} className="pl-1">
                          {item}
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <ul className="list-disc list-inside space-y-2 text-[13.5px] font-bold text-slate-800">
                      {(block.items || []).map((item, i) => (
                        <li key={i} className="pl-1">
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
