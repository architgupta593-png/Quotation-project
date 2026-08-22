"use client";

import { useState, useEffect, use } from "react";
import Image from "next/image";
import {
  Zap, Calendar, Users, MapPin, Hotel, Car, Check, AlertCircle,
  IndianRupee, MessageSquare, Mail, Printer, Sparkles, Heart,
  Mountain, Palmtree, Castle, Trees, Flame, Compass, ChevronRight,
  ShieldCheck, Clock, CheckCircle2, Phone, X, Award, ExternalLink,
  ChevronDown, Star,
} from "lucide-react";
import { getVehicleImage } from "@/components/packages/VehiclePanel";

const THEMES = {
  honeymoon: {
    label: "Honeymoon & Romance",
    icon: Heart,
    bgImage: "/themes/honeymoon.jpg",
    color: "from-rose-500 via-pink-600 to-purple-600",
    badge: "bg-rose-50 text-rose-700 border-rose-200",
    tagline: "Romantic Escapes, Candlelight Dinners & Sunset Stays 💕",
  },
  mountain: {
    label: "Mountain & Hills",
    icon: Mountain,
    bgImage: "/themes/mountain.jpg",
    color: "from-emerald-500 via-teal-600 to-cyan-700",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    tagline: "Misty Peaks, Pine Valleys & Fresh Alpine Escapes 🏔️",
  },
  beach: {
    label: "Beach & Coastal",
    icon: Palmtree,
    bgImage: "/themes/beach.jpg",
    color: "from-cyan-500 via-blue-600 to-indigo-600",
    badge: "bg-cyan-50 text-cyan-700 border-cyan-200",
    tagline: "Golden Sands, Turquoise Waves & Houseboat Cruises 🏖️",
  },
  heritage: {
    label: "Heritage & Forts",
    icon: Castle,
    bgImage: "/themes/heritage.jpg",
    color: "from-purple-600 via-amber-600 to-orange-600",
    badge: "bg-purple-50 text-purple-700 border-purple-200",
    tagline: "Historic Architecture, Palaces & Imperial Haveli Stays 🏰",
  },
  safari: {
    label: "Nature & Safari",
    icon: Trees,
    bgImage: "/themes/safari.jpg",
    color: "from-amber-500 via-emerald-600 to-green-700",
    badge: "bg-amber-50 text-amber-800 border-amber-200",
    tagline: "Wildlife Sanctuaries, Lush Tea Gardens & Jungle Resorts 🌴",
  },
  adventure: {
    label: "Adventure & Thrill",
    icon: Flame,
    bgImage: "/themes/adventure.jpg",
    color: "from-orange-500 via-rose-600 to-indigo-700",
    badge: "bg-orange-50 text-orange-700 border-orange-200",
    tagline: "High-Altitude Passes, Rafting & Unforgettable Road Trips ⚡",
  },
  general: {
    label: "Curated Holiday Experience",
    icon: Compass,
    bgImage: "/themes/mountain.jpg",
    color: "from-indigo-600 via-blue-600 to-cyan-600",
    badge: "bg-indigo-50 text-indigo-700 border-indigo-200",
    tagline: "Handcrafted Itineraries, Premium Stays & Seamless Logistics ✈️",
  },
};

const MEAL_PLANS = {
  EP: "Room Only (EP)",
  CP: "Bed & Breakfast (CP)",
  MAP: "Breakfast + Dinner (MAP)",
  AP: "All Meals Included (AP)",
  "": "Standard Meal Plan",
};

export default function QuickQuotationPublicPage({ params }) {
  const resolvedParams = use(params);
  const code = resolvedParams.code;

  const [quickQuote, setQuickQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [acceptModalOpen, setAcceptModalOpen] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [acceptedSuccess, setAcceptedSuccess] = useState(false);
  const [clientNotes, setClientNotes] = useState("");

  useEffect(() => {
    fetch(`/api/quick-quotations/code/${code}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setQuickQuote(data.quickQuotation);
      })
      .catch((err) => setError(err.message || "Failed to load proposal"))
      .finally(() => setLoading(false));
  }, [code]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#090d16] text-white gap-3">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center animate-pulse">
          <Zap className="w-6 h-6 text-amber-400" />
        </div>
        <p className="text-[13px] font-bold text-slate-400">Loading your customized proposal...</p>
      </div>
    );
  }

  if (error || !quickQuote) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#090d16] text-white p-6 text-center space-y-4">
        <div className="w-14 h-14 rounded-3xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h2 className="text-[20px] font-black">Proposal Not Available</h2>
        <p className="text-[13px] text-slate-400 max-w-md">
          {error || "This proposal link may have expired or is no longer active. Please contact your travel specialist for an updated quote."}
        </p>
      </div>
    );
  }

  const { client, tripDetails, passengers, hotelStays = [], vehicle, pricing, inclusions = [], exclusions = [] } = quickQuote;

  const themeKey = tripDetails?.theme || "general";
  const currentTheme = THEMES[themeKey] || THEMES.general;
  const ThemeIcon = currentTheme.icon;

  const startDateStr = tripDetails?.startDate
    ? new Date(tripDetails.startDate).toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric", year: "numeric" })
    : "Flexible";
  const endDateStr = tripDetails?.endDate
    ? new Date(tripDetails.endDate).toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric", year: "numeric" })
    : "Flexible";

  const numPax = Math.max(1, passengers?.adults || 2);
  const finalPrice = pricing?.finalPrice || 0;
  const discountAmount = pricing?.discountAmount || 0;
  const originalPrice = discountAmount > 0 ? finalPrice + discountAmount : finalPrice;
  const discountPercent = originalPrice > 0 ? Math.round((discountAmount / originalPrice) * 100) : 0;
  const perCouple = pricing?.perCouplePrice || finalPrice;
  const perPerson = pricing?.perPersonPrice || Math.round(finalPrice / numPax);
  const advanceToken = Math.round((finalPrice * (pricing?.advancePercentage || 25)) / 100);

  const vehicleImg = getVehicleImage(vehicle?.vehicleType || "Sedan");

  // Accept Proposal Handler
  async function handleAcceptQuote() {
    setAccepting(true);
    try {
      const res = await fetch(`/api/quick-quotations/code/${code}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "accept", notes: clientNotes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to accept proposal");
      setAcceptedSuccess(true);
      setQuickQuote((prev) => ({ ...prev, status: "accepted" }));
    } catch (err) {
      alert(`Action failed: ${err.message}`);
    } finally {
      setAccepting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans selection:bg-amber-500 selection:text-white">
      {/* ── Fixed Top Action Bar ── */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-xs print:hidden">
        <div className="flex items-center gap-3">
          <div className="relative h-8 w-28 sm:w-36">
            <Image
              src="/logo (2).png"
              alt="Mandate Holidays"
              fill
              className="object-contain object-left"
              priority
            />
          </div>
          <div className="hidden md:flex items-center gap-2 pl-3 border-l border-slate-200">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              {quickQuote.quickQuoteCode}
            </span>
            <span className="text-[12px] font-bold text-slate-500 truncate max-w-xs">
              {tripDetails?.title}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Print / Save PDF Button */}
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-[12px] transition-all shadow-2xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Save PDF / Print</span>
          </button>

          {/* Accept / Confirm Action */}
          {quickQuote.status === "accepted" ? (
            <div className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-300 font-black text-[12.5px]">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Proposal Accepted</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setAcceptModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-[12.5px] shadow-md shadow-emerald-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Accept Proposal</span>
            </button>
          )}
        </div>
      </header>

      {/* ── Main Container ── */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-8">
        {/* ── 1. Hero Showcase Banner ── */}
        <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-slate-950 border border-slate-800 text-white">
          {/* Background Theme Image with Gradient Overlay */}
          <div className="absolute inset-0 z-0">
            <img
              src={currentTheme.bgImage}
              alt={currentTheme.label}
              className="w-full h-full object-cover opacity-35 filter brightness-90 scale-105"
            />
            <div className={`absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/75 to-transparent`} />
          </div>

          {/* Hero Content */}
          <div className="relative z-10 p-6 sm:p-10 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-amber-300 text-[11px] font-black uppercase tracking-wider border border-white/15">
                  <ThemeIcon className="w-3.5 h-3.5" />
                  {currentTheme.label}
                </span>
                <span className="px-3 py-1 rounded-full bg-indigo-500/20 backdrop-blur-md text-indigo-200 text-[11px] font-bold border border-indigo-500/30">
                  Ref: {quickQuote.quickQuoteCode}
                </span>
              </div>

              {discountAmount > 0 && (
                <span className="px-3.5 py-1 rounded-full bg-gradient-to-r from-rose-500 to-amber-500 text-white font-black text-[12px] shadow-md shadow-rose-500/30 animate-pulse">
                  🔥 Special Deal: Save ₹{discountAmount.toLocaleString("en-IN")} ({discountPercent}% OFF)
                </span>
              )}
            </div>

            <div className="space-y-2 max-w-3xl">
              <p className="text-[13px] font-bold text-amber-300 tracking-wide uppercase">
                Prepared Exclusively for {client?.name || "Our Valued Traveler"}
              </p>
              <h1 className="text-[26px] sm:text-[36px] font-black leading-tight tracking-tight text-white font-serif">
                {tripDetails?.title}
              </h1>
              <p className="text-[14px] text-slate-300 font-medium">
                {currentTheme.tagline}
              </p>
            </div>

            {/* Quick Trip Overview Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-white/15">
              <div className="p-3.5 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10">
                <div className="flex items-center gap-1.5 text-amber-300 text-[11px] font-black uppercase tracking-wider mb-1">
                  <MapPin className="w-3.5 h-3.5" /> Destination
                </div>
                <p className="text-[15px] font-black text-white truncate">{tripDetails?.destination}</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10">
                <div className="flex items-center gap-1.5 text-sky-300 text-[11px] font-black uppercase tracking-wider mb-1">
                  <Calendar className="w-3.5 h-3.5" /> Dates &amp; Duration
                </div>
                <p className="text-[15px] font-black text-white">{tripDetails?.nights}N / {tripDetails?.days}D</p>
                <p className="text-[10px] text-slate-400 font-semibold">{startDateStr.split(",")[1]} - {endDateStr.split(",")[1]}</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10">
                <div className="flex items-center gap-1.5 text-purple-300 text-[11px] font-black uppercase tracking-wider mb-1">
                  <Users className="w-3.5 h-3.5" /> Party Size
                </div>
                <p className="text-[14px] font-black text-white">
                  {numPax} Adults
                  {passengers?.childrenCount > 0 ? `, ${passengers.childrenCount} Child (${passengers.childrenAges?.join(", ")} yrs)` : ""}
                </p>
                <p className="text-[10px] text-slate-400 font-semibold">{passengers?.totalRooms || 1} Private Room(s)</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10">
                <div className="flex items-center gap-1.5 text-emerald-300 text-[11px] font-black uppercase tracking-wider mb-1">
                  <Car className="w-3.5 h-3.5" /> Dedicated Cab
                </div>
                <p className="text-[15px] font-black text-white truncate">{vehicle?.vehicleType || "Private Sedan"}</p>
                <p className="text-[10px] text-slate-400 font-semibold">Chauffeur Included</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── 2. Content Grid (8 cols Details + 4 cols Sticky Pricing) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Details (8 cols) */}
          <div className="lg:col-span-8 space-y-8">
            {/* Hotel Accommodation Showcase */}
            <section className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-xs space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold shadow-xs">
                    <Hotel className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-[18px] font-black text-slate-900">Hotel Accommodation Portfolio</h2>
                    <p className="text-[12px] text-slate-500 font-semibold">Certified quality hotel stays reserved for your dates</p>
                  </div>
                </div>
                <span className="text-[11px] font-black uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                  {hotelStays.length} Stays Logged
                </span>
              </div>

              <div className="space-y-3.5">
                {hotelStays.map((stay, idx) => (
                  <div
                    key={idx}
                    className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-amber-400/80 transition-all group"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 text-white flex flex-col items-center justify-center flex-shrink-0 shadow-xs font-black">
                        <span className="text-[9px] uppercase tracking-tighter">Night</span>
                        <span className="text-[14px] leading-none">{stay.nightNumber}</span>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-black text-amber-700 uppercase tracking-wider bg-amber-50 px-2 py-0.2 rounded border border-amber-200">
                            {stay.cityName || tripDetails?.destination}
                          </span>
                          <div className="flex text-amber-400">
                            {[...Array(stay.starRating || 3)].map((_, i) => (
                              <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            ))}
                          </div>
                        </div>

                        <h3 className="text-[16px] font-black text-slate-900 group-hover:text-amber-600 transition-colors">
                          {stay.hotelName || "Quality Certified Hotel"}
                        </h3>

                        <p className="text-[12px] text-slate-500 font-semibold">
                          Room: <span className="text-slate-800 font-bold">{stay.roomType || "Deluxe AC Room"}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/60">
                      <span className="px-3 py-1 rounded-xl bg-indigo-50 text-indigo-800 border border-indigo-200 text-[11.5px] font-black">
                        {MEAL_PLANS[stay.mealPlan] || stay.mealPlan || "CP (Breakfast)"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Dedicated Transport & Vehicle Section */}
            <section className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-xs space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold shadow-xs">
                    <Car className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-[18px] font-black text-slate-900">Dedicated Chauffeur &amp; Transport</h2>
                    <p className="text-[12px] text-slate-500 font-semibold">Private airport / station pickup, drops &amp; daily sightseeing</p>
                  </div>
                </div>
                <span className="text-[11px] font-black uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200">
                  {vehicle?.acType || "AC"} Private
                </span>
              </div>

              <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50/60 via-slate-50 to-sky-50/60 border border-indigo-100 flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="space-y-2 text-center sm:text-left">
                  <span className="text-[11px] font-black uppercase tracking-wider text-indigo-600">
                    Private Dedicated Tour Transport
                  </span>
                  <h3 className="text-[20px] font-black text-slate-900">
                    {vehicle?.vehicleType || "Sedan"} — {vehicle?.model || "Dzire / Etios"}
                  </h3>
                  <p className="text-[12.5px] text-slate-600 font-medium max-w-md">
                    {vehicle?.notes || "Exclusive air-conditioned vehicle with courteous driver, all toll charges, interstate taxes, fuel & parking included."}
                  </p>

                  <div className="flex items-center justify-center sm:justify-start gap-2 pt-2">
                    <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-[11px] font-bold text-slate-700 shadow-2xs">
                      👥 {vehicle?.seats || 4} Seater Capacity
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-[11px] font-bold text-slate-700 shadow-2xs">
                      ❄️ Air Conditioned
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-[11px] font-bold text-emerald-800 shadow-2xs">
                      ✓ Driver Allowance Paid
                    </span>
                  </div>
                </div>

                <div className="h-28 w-44 relative flex items-center justify-center flex-shrink-0">
                  <img
                    src={vehicleImg}
                    alt={vehicle?.vehicleType}
                    className="max-h-24 max-w-full object-contain filter drop-shadow-md"
                  />
                </div>
              </div>
            </section>

            {/* Inclusions & Exclusions */}
            <section className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Inclusions */}
              <div className="bg-white rounded-3xl border border-emerald-200/90 p-6 shadow-xs space-y-4">
                <div className="flex items-center gap-2 text-emerald-800 pb-2 border-b border-emerald-100">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <h3 className="text-[16px] font-black">Package Inclusions</h3>
                </div>
                <ul className="space-y-2 text-[12.5px] text-slate-700 font-medium">
                  {inclusions.map((inc, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <span>{inc}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Exclusions */}
              <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs space-y-4">
                <div className="flex items-center gap-2 text-slate-700 pb-2 border-b border-slate-100">
                  <X className="w-5 h-5 text-slate-400" />
                  <h3 className="text-[16px] font-black">Exclusions &amp; Notes</h3>
                </div>
                <ul className="space-y-2 text-[12.5px] text-slate-500 font-medium">
                  {exclusions.map((exc, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-slate-400 font-black">•</span>
                      <span>{exc}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            {/* Luxury Redesigned Travel Guidelines & Important Advisory */}
            {quickQuote.specialInstructions?.length > 0 && (
              <section className="bg-white rounded-3xl border-2 border-slate-200/90 hover:border-amber-400/80 p-6 sm:p-8 shadow-xs transition-all space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 text-slate-950 flex items-center justify-center font-black shadow-md shadow-amber-500/20">
                      <ShieldCheck className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-[18px] font-black text-slate-900">Trip Guidelines &amp; Important Advisory</h2>
                        <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                          Mandatory
                        </span>
                      </div>
                      <p className="text-[12px] text-slate-500 font-semibold">Essential check-in policies, ID verifications &amp; transport rules</p>
                    </div>
                  </div>

                  <span className="text-[11px] font-black uppercase tracking-wider text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200 hidden sm:inline-block">
                    Advisory Terms
                  </span>
                </div>

                <div className="space-y-4">
                  {quickQuote.specialInstructions.map((inst, i) => {
                    const isHtml = typeof inst === "string" && (inst.includes("<p>") || inst.includes("<ul>") || inst.includes("<ol>") || inst.includes("<li>") || inst.includes("<div"));
                    return (
                      <div
                        key={i}
                        className="bg-gradient-to-br from-slate-50 via-white to-amber-50/20 p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2"
                      >
                        <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100/80">
                          <span className="w-6 h-6 rounded-lg bg-slate-900 text-amber-400 font-mono font-black text-[11px] flex items-center justify-center">
                            {i + 1}
                          </span>
                          <span className="text-[12px] font-black text-slate-800 tracking-wide">
                            {(() => {
                              const titleMatch = typeof inst === "string" && (inst.match(/<strong>([^<]+)<\/strong>/i) || inst.match(/•\s*([^:\n]+):/));
                              return titleMatch && titleMatch[1] ? titleMatch[1].replace(/^[🏨🪪🚗🧳💳📌\s]+/, "").trim() : `Advisory Policy Section ${i + 1}`;
                            })()}
                          </span>
                        </div>

                        <div className="text-[13.5px] text-slate-800 leading-relaxed font-medium pl-1">
                          {isHtml ? (
                            <div
                              className="prose prose-base max-w-none text-slate-800 leading-relaxed font-medium [&>ul]:list-disc [&>ul]:pl-6 [&>ol]:list-decimal [&>ol]:pl-6 [&>ul>li>ul]:list-circle [&>ul>li>ul]:pl-6 [&>p]:mb-2 [&>ul]:mb-2.5 [&>ol]:mb-2.5 [&>p>strong]:text-slate-950 [&>p>strong]:font-black"
                              dangerouslySetInnerHTML={{ __html: inst }}
                            />
                          ) : (
                            <div className="whitespace-pre-wrap leading-relaxed">
                              {inst}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </div>

          {/* Sticky Pricing & Acceptance Sidebar (4 cols) */}
          <div className="lg:col-span-4 sticky top-20 space-y-5">
            <div className="bg-white rounded-3xl border-2 border-amber-300 p-6 shadow-xl space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-[11px] font-black uppercase tracking-widest text-amber-700 flex items-center gap-1">
                  <Award className="w-4 h-4 text-amber-500" /> Formal Commercial Proposal
                </span>
                <span className="text-[10.5px] font-black px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  All Taxes Incl.
                </span>
              </div>

              {/* Price Highlight Box */}
              <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white space-y-3 shadow-lg">
                {discountAmount > 0 && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[12.5px] text-slate-400 font-semibold line-through font-mono">
                        ₹{originalPrice.toLocaleString("en-IN")}
                      </span>
                      <span className="text-[11px] font-black px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        SAVE ₹{discountAmount.toLocaleString("en-IN")} ({discountPercent}% OFF)
                      </span>
                    </div>
                  </div>
                )}

                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-amber-400">Total Net Package Price</p>
                  <p className="text-[32px] font-black text-white leading-tight font-mono tracking-tight">
                    ₹{finalPrice.toLocaleString("en-IN")}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-3 border-t border-white/10 text-[11px]">
                  <div className="bg-white/5 rounded-xl p-2.5">
                    <p className="text-slate-400 font-bold text-[10px]">Per Couple</p>
                    <p className="font-black text-[14px] text-white">₹{perCouple.toLocaleString("en-IN")}</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-2.5">
                    <p className="text-slate-400 font-bold text-[10px]">Per Person</p>
                    <p className="font-black text-[14px] text-white">₹{perPerson.toLocaleString("en-IN")}</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11.5px] text-amber-200">
                  <span>25% Booking Advance Token:</span>
                  <span className="font-black text-[13px]">₹{advanceToken.toLocaleString("en-IN")}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2.5">
                {quickQuote.status === "accepted" ? (
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-1">
                    <div className="flex items-center justify-center gap-1.5 text-emerald-800 font-black text-[14px]">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      <span>Booking Confirmed!</span>
                    </div>
                    <p className="text-[11.5px] text-emerald-700 font-medium">
                      Our operations team is finalizing your hotel vouchers.
                    </p>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setAcceptModalOpen(true)}
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-[14px] shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99]"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Accept Proposal Online</span>
                  </button>
                )}

                {/* WhatsApp Connect */}
                <a
                  href={`https://api.whatsapp.com/send?phone=919876543210&text=Hi%20Mandate%20Holidays,%20I%20am%20reviewing%20my%20Quick%20Proposal%20${quickQuote.quickQuoteCode}%20for%20${encodeURIComponent(tripDetails?.title)}.%20Please%20connect%20with%20me.`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-3 rounded-2xl border border-emerald-300 bg-emerald-50/70 hover:bg-emerald-100 text-emerald-800 font-bold text-[13px] transition-all flex items-center justify-center gap-2"
                >
                  <MessageSquare className="w-4 h-4 text-emerald-600" />
                  <span>Chat on WhatsApp</span>
                </a>
              </div>

              {/* Verified Trust Badges */}
              <div className="pt-2 border-t border-slate-100 space-y-2 text-[11.5px] text-slate-500 font-semibold">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-500" />
                  <span>100% Price Lock &amp; Confirmed Stays</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-500" />
                  <span>24x7 Dedicated On-Trip Chauffeur &amp; Support</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ── Client Accept Modal ── */}
      {acceptModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-md" onClick={() => setAcceptModalOpen(false)} />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 p-6 space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-[17px] font-black text-slate-900">Accept Travel Proposal</h3>
                  <p className="text-[11.5px] text-slate-500">Ref: {quickQuote.quickQuoteCode}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAcceptModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {acceptedSuccess ? (
              <div className="py-6 text-center space-y-3">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
                  <Check className="w-7 h-7" />
                </div>
                <h4 className="text-[18px] font-black text-slate-900">Proposal Confirmed!</h4>
                <p className="text-[13px] text-slate-500 max-w-sm mx-auto">
                  Thank you, <span className="font-bold text-slate-800">{client?.name}</span>! Your proposal has been accepted. Our travel manager will connect with you on WhatsApp ({client?.phone}) with your confirmed booking voucher.
                </p>
                <button
                  type="button"
                  onClick={() => setAcceptModalOpen(false)}
                  className="px-6 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-[13px]"
                >
                  Close
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5 text-[12.5px]">
                  <p className="font-bold text-slate-800">{tripDetails?.title}</p>
                  <p className="text-slate-500">Total Price: <span className="font-bold text-slate-900">₹{finalPrice.toLocaleString("en-IN")}</span> (All Inclusive)</p>
                  <p className="text-slate-500">Advance Token (25%): <span className="font-bold text-amber-700">₹{advanceToken.toLocaleString("en-IN")}</span></p>
                </div>

                <div>
                  <label className="block text-[12px] font-bold text-slate-700 mb-1.5">
                    Special Requests / Room Preferences (Optional)
                  </label>
                  <textarea
                    value={clientNotes}
                    onChange={(e) => setClientNotes(e.target.value)}
                    rows={3}
                    placeholder="e.g. King bed preferred, early morning airport pickup..."
                    className="w-full p-3 rounded-xl border border-slate-200 text-[12.5px] focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleAcceptQuote}
                  disabled={accepting}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-[13.5px] shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {accepting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Confirm &amp; Accept Proposal</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
