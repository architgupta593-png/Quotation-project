"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  MapPin,
  Moon,
  Sun,
  Building2,
  Car,
  IndianRupee,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  Loader2,
  Pencil,
  Star,
} from "lucide-react";

const MEAL_PLAN_LABELS = {
  EP: "Room Only",
  CP: "Bed & Breakfast",
  MAP: "Breakfast + Dinner",
  AP: "All Meals",
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
      .catch(() => setError("Failed to load"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (!pkg) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">{error || "Package not found"}</p>
      </div>
    );
  }

  const currency = pkg.pricing?.currency || "INR";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Banner */}
      <div className="relative h-64 sm:h-80 bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700">
        {pkg.coverImage?.url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={pkg.coverImage.url}
            alt={pkg.title}
            className="absolute inset-0 w-full h-full object-cover opacity-40"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

        {/* Back + Edit */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
          <Link href="/dashboard/packages" className="flex items-center gap-2 text-white/90 hover:text-white text-[13px] font-medium transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Packages
          </Link>
          <Link
            href={`/dashboard/packages/${id}/edit`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white text-[12px] font-medium backdrop-blur-sm transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" /> Edit
          </Link>
        </div>

        {/* Title */}
        <div className="absolute bottom-6 left-6 right-6">
          <div className="flex items-center gap-2 text-white/80 text-[12px] mb-2">
            <MapPin className="w-3.5 h-3.5" />
            {pkg.destination}
            <span className="ml-2 px-2 py-0.5 rounded-full border border-white/30 text-[11px] capitalize">
              {pkg.status}
            </span>
          </div>
          <h1 className="text-white text-[24px] sm:text-[28px] font-bold leading-tight">
            {pkg.title}
          </h1>
          <div className="flex items-center gap-3 mt-3">
            <span className="flex items-center gap-1.5 px-3 py-1 bg-white/20 rounded-full text-white text-[12px] font-medium backdrop-blur-sm">
              <Moon className="w-3.5 h-3.5" /> {pkg.nights} Nights
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1 bg-white/20 rounded-full text-white text-[12px] font-medium backdrop-blur-sm">
              <Sun className="w-3.5 h-3.5" /> {pkg.days} Days
            </span>
            {(pkg.pricing?.perPersonPrice > 0 || pkg.pricing?.pricePerPerson > 0) && (
              <span className="flex items-center gap-1 px-3 py-1 bg-white/20 rounded-full text-white text-[12px] font-medium backdrop-blur-sm">
                <IndianRupee className="w-3 h-3" />
                {currency} {(pkg.pricing.perPersonPrice || pkg.pricing.pricePerPerson).toLocaleString()} / person
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* Highlights */}
        {pkg.highlights?.length > 0 && (
          <Section title="Package Highlights">
            <div className="flex flex-wrap gap-2">
              {pkg.highlights.map((h, i) => (
                <span key={i} className="px-3 py-1.5 bg-indigo-50 border border-indigo-200 rounded-full text-[13px] text-indigo-700 font-medium">
                  ✨ {h}
                </span>
              ))}
            </div>
          </Section>
        )}

        {/* Itinerary */}
        {pkg.itinerary?.length > 0 && (
          <Section title="Day-by-Day Itinerary">
            <div className="space-y-3">
              {pkg.itinerary.map((day, i) => {
                const isOpen = openDay === i;
                return (
                  <div key={i} className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
                    <button
                      type="button"
                      onClick={() => setOpenDay(isOpen ? -1 : i)}
                      className="w-full flex items-center gap-3 px-5 py-4 hover:bg-gray-50 transition-colors text-left"
                    >
                      <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-[13px] font-bold flex-shrink-0">
                        {day.day}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-semibold text-gray-900">{day.title || `Day ${day.day}`}</p>
                        <p className="text-[12px] text-gray-400">
                          {day.activities?.filter(Boolean).length || 0} activities
                          {" · "}
                          {Object.entries(day.meals || {}).filter(([, v]) => v).map(([k]) => k).join(", ") || "No meals"}
                        </p>
                      </div>
                      {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                    </button>

                    {isOpen && (
                      <div className="px-5 pb-5 border-t border-gray-100 space-y-4 pt-4">
                        {day.description && (
                          <p className="text-[14px] text-gray-600 leading-relaxed">{day.description}</p>
                        )}

                        {day.activities?.filter(Boolean).length > 0 && (
                          <div>
                            <p className="text-[12px] font-semibold text-gray-500 mb-2 uppercase tracking-wider">Activities</p>
                            <ul className="space-y-1.5">
                              {day.activities.filter(Boolean).map((act, ai) => (
                                <li key={ai} className="flex items-start gap-2 text-[13px] text-gray-700">
                                  <MapPin className="w-3.5 h-3.5 text-indigo-400 mt-0.5 flex-shrink-0" />
                                  {act}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Meals */}
                        <div className="flex gap-2">
                          {["breakfast", "lunch", "dinner"].map((meal) => (
                            <span
                              key={meal}
                              className={`px-3 py-1 rounded-full text-[12px] font-medium border ${
                                day.meals?.[meal]
                                  ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                                  : "bg-gray-100 border-gray-200 text-gray-400"
                              }`}
                            >
                              {meal.charAt(0).toUpperCase() + meal.slice(1)}
                            </span>
                          ))}
                        </div>

                        {/* Day Images */}
                        {day.images?.length > 0 && (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {day.images.map((img, ii) => (
                              <div key={ii} className="aspect-video rounded-xl overflow-hidden bg-gray-100">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={img.url} alt={img.caption || `Day ${day.day} photo`} className="w-full h-full object-cover" />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Section>
        )}

        {/* Accommodation Options */}
        {pkg.accommodationOptions?.length > 0 ? (
          <Section title="Accommodation Tiers">
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

                return (
                  <div key={optIdx} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                      <span className="text-[15px] font-bold text-gray-900">{opt.label}</span>
                      <span className="text-[13px] font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                        Total: ₹{(opt.nights || []).reduce((s, n) => s + (n.pricePerNight || 0), 0).toLocaleString()}
                      </span>
                    </div>

                    <div className="space-y-3">
                      {legs.map((leg, li) => (
                        <div key={li} className="p-4 rounded-xl bg-gray-50/70 border border-gray-100 flex items-start gap-4">
                          <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white text-[12px] font-bold flex items-center justify-center flex-shrink-0">
                            {leg.nightsCount > 1 ? `N${leg.startNight}–${leg.endNight}` : `N${leg.startNight}`}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-[14px] font-bold text-gray-900">{leg.hotelName || "Hotel TBA"}</p>
                              {leg.starRating > 0 && (
                                <div className="flex">
                                  {Array.from({ length: leg.starRating }).map((_, si) => (
                                    <Star key={si} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-2 mt-1">
                              <Badge
                                label={leg.nightsCount > 1 ? `${leg.cityName || "Stay"} (${leg.nightsCount} Nights)` : leg.cityName || "Stay"}
                                color="violet"
                              />
                              {leg.roomType && <Badge label={leg.roomType} color="slate" />}
                              {leg.mealPlan && <Badge label={MEAL_PLAN_LABELS[leg.mealPlan] || leg.mealPlan} color="emerald" />}
                            </div>
                            {leg.notes && <p className="text-[12px] text-gray-500 mt-1.5 italic">{leg.notes}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </Section>
        ) : pkg.accommodations?.length > 0 ? (
          <Section title="Accommodation">
            <div className="space-y-4">
              {pkg.accommodations.map((acc, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-5 h-5 text-violet-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-[15px] font-bold text-gray-900">{acc.hotelName || "TBA"}</p>
                        {acc.starRating > 0 && (
                          <div className="flex">
                            {Array.from({ length: acc.starRating }).map((_, si) => (
                              <Star key={si} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            ))}
                          </div>
                        )}
                      </div>
                      <p className="text-[13px] text-gray-500 mb-2">{acc.location || "—"}</p>
                      <div className="flex flex-wrap gap-2">
                        <Badge label={`Night ${acc.night}`} color="violet" />
                        {acc.roomType && <Badge label={acc.roomType} color="slate" />}
                        {acc.mealPlan && <Badge label={MEAL_PLAN_LABELS[acc.mealPlan] || acc.mealPlan} color="emerald" />}
                      </div>
                      {acc.notes && <p className="text-[12px] text-gray-400 mt-2 italic">{acc.notes}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        ) : null}

        {/* Vehicle */}
        {pkg.vehicle?.vehicleType && (
          <Section title="Vehicle">
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center flex-shrink-0">
                <Car className="w-5 h-5 text-sky-600" />
              </div>
              <div className="flex-1">
                <p className="text-[15px] font-bold text-gray-900 mb-1">
                  {pkg.vehicle.vehicleType}
                  {pkg.vehicle.model ? ` — ${pkg.vehicle.model}` : ""}
                </p>
                <div className="flex flex-wrap gap-2 mb-2">
                  <Badge label={`${pkg.vehicle.seats} Seats`} color="sky" />
                  <Badge label={pkg.vehicle.acType || "AC"} color="slate" />
                </div>
                {pkg.vehicle.notes && <p className="text-[13px] text-gray-500 italic">{pkg.vehicle.notes}</p>}
              </div>
            </div>
          </Section>
        )}

        {/* Pricing */}
        {((pkg.pricing?.perPersonPrice || 0) > 0 || (pkg.pricing?.pricePerPerson || 0) > 0 || (pkg.pricing?.finalPrice || 0) > 0 || pkg.pricing?.includes?.length > 0) && (
          <Section title="Pricing & Inclusions">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              {/* Price row */}
              {((pkg.pricing?.perPersonPrice || 0) > 0 || (pkg.pricing?.pricePerPerson || 0) > 0) && (
                <div className="flex items-center justify-between py-3 border-b border-gray-100 mb-4">
                  <span className="text-[13px] text-gray-500">Price per person</span>
                  <span className="text-[20px] font-bold text-gray-900">
                    {currency} {(pkg.pricing.perPersonPrice || pkg.pricing.pricePerPerson).toLocaleString()}
                  </span>
                </div>
              )}
              {((pkg.pricing?.finalPrice || 0) > 0 || (pkg.pricing?.totalPrice || 0) > 0) && (
                <div className="flex items-center justify-between py-2 border-b border-gray-100 mb-4">
                  <span className="text-[13px] text-gray-500">Total package price</span>
                  <span className="text-[16px] font-bold text-gray-900">
                    {currency} {(pkg.pricing.finalPrice || pkg.pricing.totalPrice).toLocaleString()}
                  </span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Includes */}
                {pkg.pricing?.includes?.length > 0 && (
                  <div>
                    <p className="text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-3">Inclusions</p>
                    <ul className="space-y-2">
                      {pkg.pricing.includes.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-[13px] text-gray-700">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Excludes */}
                {pkg.pricing?.excludes?.length > 0 && (
                  <div>
                    <p className="text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-3">Exclusions</p>
                    <ul className="space-y-2">
                      {pkg.pricing.excludes.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-[13px] text-gray-700">
                          <XCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </Section>
        )}

        {/* Instructions */}
        {pkg.instructions?.length > 0 && (
          <Section title="Package Instructions & Terms">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-6">
              {pkg.instructions.map((block, idx) => (
                <div key={idx} className="space-y-2">
                  {block.heading && (
                    <h3 className="text-[15px] font-bold text-gray-900 border-b border-gray-100 pb-1.5">
                      {block.heading}
                    </h3>
                  )}

                  {block.format === "paragraph" ? (
                    <p className="text-[13px] text-gray-700 leading-relaxed whitespace-pre-line">
                      {block.content}
                    </p>
                  ) : block.format === "numbered" ? (
                    <ol className="list-decimal list-inside space-y-1.5 text-[13px] text-gray-700">
                      {(block.items || []).map((item, i) => (
                        <li key={i} className="pl-1">
                          {item}
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <ul className="list-disc list-inside space-y-1.5 text-[13px] text-gray-700">
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
          </Section>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <h2 className="text-[18px] font-bold text-gray-900 mb-4">{title}</h2>
      {children}
    </div>
  );
}

function Badge({ label, color }) {
  const colors = {
    violet: "bg-violet-50 border-violet-200 text-violet-700",
    slate: "bg-slate-100 border-slate-200 text-slate-700",
    emerald: "bg-emerald-50 border-emerald-200 text-emerald-700",
    sky: "bg-sky-50 border-sky-200 text-sky-700",
  };
  return (
    <span className={`px-2.5 py-1 rounded-full border text-[11px] font-semibold ${colors[color] || colors.slate}`}>
      {label}
    </span>
  );
}
