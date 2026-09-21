"use client";

import { useState, useEffect, use, useMemo } from "react";
import Image from "next/image";
import {
  Zap, Calendar, Users, MapPin, Hotel, Car, Check, AlertCircle,
  IndianRupee, MessageSquare, Mail, Printer, Sparkles, Heart,
  Mountain, Palmtree, Castle, Trees, Flame, Compass, ChevronRight,
  ShieldCheck, Clock, CheckCircle2, Phone, X, Award, ExternalLink,
  ChevronDown, Star, Layers, Loader2, Share2, Copy, CheckCheck,
} from "lucide-react";
import { getActivityIcon, getStayForDay, getMealsFromStay, MEAL_PLAN_DESCRIPTIONS, getMealPlanLabel } from "@/components/quick-quotations/QuickItinerarySection";
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
  EP: "Room Only (EP - No Meals Included)",
  CP: "Daily Breakfast Included (CP - Bed & Breakfast)",
  MAP: "Breakfast + Dinner Included (MAP - Half Board)",
  AP: "All Meals Included (AP - Breakfast, Lunch & Dinner)",
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
  const [selectedOptionIdx, setSelectedOptionIdx] = useState(0);
  const [copied, setCopied] = useState(false);

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

  const availableOptions = useMemo(() => {
    if (quickQuote?.accommodationOptions && quickQuote.accommodationOptions.length > 0) {
      return quickQuote.accommodationOptions;
    }
    return [
      {
        label: "Standard Hotel Package",
        hotelStays: quickQuote?.hotelStays || [],
      },
    ];
  }, [quickQuote?.accommodationOptions, quickQuote?.hotelStays]);

  const activeStays = useMemo(() => {
    const opt = availableOptions[selectedOptionIdx] || availableOptions[0];
    return opt?.hotelStays && opt.hotelStays.length > 0 ? opt.hotelStays : (quickQuote?.hotelStays || []);
  }, [availableOptions, selectedOptionIdx, quickQuote?.hotelStays]);

  function handleCopyLink() {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  }

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
  const totalRooms = Math.max(1, parseInt(passengers?.totalRooms, 10) || 1);

  // Dynamic Tier-Adjusted Price when client toggles between option tiers
  const baseOption = availableOptions[0];
  const currentOption = availableOptions[selectedOptionIdx] || baseOption;

  const getOptionCost = (opt) => {
    const stays = opt?.hotelStays || [];
    if (stays.length > 0) {
      return stays.reduce((sum, s) => sum + ((Number(s.pricePerNight) || 0) * (s.nights || 1) * totalRooms), 0);
    }
    if (opt?.totalPrice && Number(opt.totalPrice) > 0) return Number(opt.totalPrice);
    return 0;
  };

  const getOptionWithMargin = (opt) => {
    const rawCost = getOptionCost(opt);
    const mType = opt?.marginType || pricing?.packageMarginType || "absolute";
    const mVal = Number(opt?.margin !== undefined ? opt.margin : (pricing?.packageMargin || 0));
    const mAmount = mType === "percentage" ? (rawCost * mVal) / 100 : mVal;
    return rawCost + mAmount;
  };

  const baseOptCost = getOptionWithMargin(baseOption);
  const currentOptCost = getOptionWithMargin(currentOption);
  const tierCostDelta = (baseOptCost > 0 && currentOptCost > 0) ? (currentOptCost - baseOptCost) : 0;

  const baseFinalPrice = pricing?.finalPrice || 0;
  const includeGst = Boolean(pricing?.includeGst);
  const gstRate = Number(pricing?.gstPercentage) || 5;
  const deltaWithTax = includeGst ? Math.round(tierCostDelta * (1 + gstRate / 100)) : tierCostDelta;

  const finalPrice = Math.max(0, baseFinalPrice + deltaWithTax);
  const discountAmount = Number(pricing?.discountAmount) || 0;
  const originalPrice = discountAmount > 0 ? finalPrice + discountAmount : finalPrice;
  const discountPercent = originalPrice > 0 ? Math.round((discountAmount / originalPrice) * 100) : 0;
  const perPerson = Math.round(finalPrice / numPax);
  const perCouple = Math.round(perPerson * 2);
  const gstAmount = includeGst ? Math.round((finalPrice * gstRate) / (100 + gstRate)) : 0;

  // Advance Payment calculations (Absolute / Percentage)
  const advanceType = pricing?.advanceType || "absolute";
  const advanceAmount = Number(pricing?.advanceAmount) > 0 ? Number(pricing.advanceAmount) : (Number(pricing?.advancePayment) || 0);
  const advancePercentage = Number(pricing?.advancePercentage) || 25;
  let advancePayment = 0;
  if (advanceType === "percentage") {
    advancePayment = Math.round((finalPrice * advancePercentage) / 100);
  } else if (advanceAmount > 0) {
    advancePayment = Math.min(finalPrice, advanceAmount);
  } else {
    advancePayment = Math.round(finalPrice * 0.25);
  }
  const balancePayment = Math.max(0, finalPrice - advancePayment);
  const advancePct = finalPrice > 0 ? Math.round((advancePayment / finalPrice) * 100) : 0;
  const advanceToken = advancePayment;

  const vehicleImg = getVehicleImage(vehicle?.vehicleType || "Sedan");

  // Accept Proposal Handler
  async function handleAcceptQuote() {
    setAccepting(true);
    try {
      const chosenOpt = availableOptions[selectedOptionIdx] || availableOptions[0];
      const res = await fetch(`/api/quick-quotations/code/${code}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "accept",
          notes: clientNotes,
          selectedOptionIndex: selectedOptionIdx,
          selectedOptionLabel: chosenOpt?.label || `Option ${selectedOptionIdx + 1}`,
          acceptedPrice: finalPrice,
        }),
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
              alt="Mande Holidays"
              fill
              sizes="(max-width: 640px) 112px, 144px"
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
          {/* Share / Copy Proposal Link */}
          <button
            type="button"
            onClick={handleCopyLink}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-[12px] font-bold transition-all shadow-2xs ${
              copied
                ? "bg-emerald-50 text-emerald-800 border-emerald-300 ring-2 ring-emerald-400/30"
                : "border-slate-300 hover:bg-slate-100 text-slate-700"
            }`}
            title="Copy proposal link to share"
          >
            {copied ? <CheckCheck className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{copied ? "Link Copied!" : "Share Link"}</span>
          </button>

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
                  {passengers?.childrenCount > 0 ? `, ${passengers.childrenCount} Child${passengers.childrenCount > 1 ? "ren" : ""}${passengers.childrenAges?.filter(Boolean).length > 0 ? ` (${passengers.childrenAges.filter(Boolean).join(", ")} yrs)` : ""}` : ""}
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
            {/* Minimalist Day-by-Day Tour Itinerary Timeline */}
            {quickQuote.showItinerary !== false && quickQuote.itinerary && quickQuote.itinerary.length > 0 && (
              <section className="bg-white rounded-3xl border border-slate-200/90 hover:border-indigo-400/80 p-6 sm:p-7 shadow-xs transition-all space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black shadow-xs">
                      <Compass className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-[17px] font-black text-slate-900">Day-by-Day Tour Itinerary</h2>
                        <span className="text-[10.5px] font-black text-indigo-700 bg-indigo-50 px-2 py-0.2 rounded-full border border-indigo-200">
                          {quickQuote.itinerary.length} Days
                        </span>
                      </div>
                      <p className="text-[11.5px] text-slate-500 font-semibold">Curated sightseeing route, transfer schedule &amp; meal schedule</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-black uppercase tracking-wider text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200 hidden sm:inline-block">
                    Full Day Schedule
                  </span>
                </div>

                {/* Luxury Journey Stream Layout */}
                <div className="space-y-4">
                  {quickQuote.itinerary.map((dayItem, idx) => {
                    const matchingStay = getStayForDay(idx, activeStays);
                    const mealInfo = getMealsFromStay(matchingStay, idx, quickQuote.itinerary.length);
                    const cityLeg = dayItem.city || matchingStay?.cityName || quickQuote.tripDetails?.destination;
                    const meals = dayItem.meals || mealInfo.meals || { breakfast: false, lunch: false, dinner: false };
                    const hasAnyMeal = Boolean(meals.breakfast || meals.lunch || meals.dinner);

                    return (
                      <div
                        key={idx}
                        className="group relative rounded-3xl bg-white border border-slate-200/90 hover:border-amber-400/80 p-5 sm:p-6 shadow-xs hover:shadow-md transition-all space-y-4 overflow-hidden"
                      >
                        {/* Subtle top ambient gradient accent */}
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-indigo-500 to-purple-500 opacity-60 group-hover:opacity-100 transition-opacity" />

                        {/* Top Row: Hero Day Number + Title + City & Meals */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 pb-3 border-b border-slate-100">
                          <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
                            {/* Hero Day Squircle Tile */}
                            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-amber-400 flex flex-col items-center justify-center flex-shrink-0 shadow-md ring-2 ring-amber-400/20">
                              <span className="font-mono font-black text-[16px] sm:text-[18px] leading-none">
                                {String(dayItem.day || idx + 1).padStart(2, "0")}
                              </span>
                              <span className="text-[8.5px] font-black tracking-widest text-slate-400 uppercase mt-0.5">
                                DAY
                              </span>
                            </div>

                            <div className="flex-1 min-w-0 space-y-1.5">
                              <div className="flex items-center gap-2 flex-wrap">
                                {cityLeg && (
                                  <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-50 to-amber-100/60 text-amber-900 border border-amber-200/90 font-black text-[11px] flex items-center gap-1 shadow-2xs">
                                    <MapPin className="w-3 h-3 text-amber-600" />
                                    <span>{cityLeg}</span>
                                  </span>
                                )}

                                {/* Hotel & Meal Plan badge - Shown ONLY when hotel is selected */}
                                {mealInfo.hasHotel && (
                                  <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 text-emerald-950 border border-emerald-200/90 font-black text-[11px] flex items-center gap-1.5 shadow-2xs">
                                    <Hotel className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                                    <span className="truncate max-w-[170px]">{mealInfo.hotelName}</span>
                                    <span className="text-emerald-400">•</span>
                                    <span className="text-emerald-800 font-extrabold">{mealInfo.planDesc?.badge || `${mealInfo.mealPlan} • ${mealInfo.planDesc?.shortMeaning || "Meals"}`}</span>
                                  </span>
                                )}

                                <span className="text-[10.5px] font-bold text-slate-400">
                                  Milestone #{dayItem.day || idx + 1}
                                </span>
                              </div>

                              <h3 className="text-[16px] sm:text-[17px] font-black text-slate-900 leading-snug">
                                {dayItem.title || `Day ${idx + 1} Sightseeing & Experience`}
                              </h3>
                            </div>
                          </div>

                          {/* Meals Included Pills - ONLY shown when hotel is selected */}
                          {mealInfo.hasHotel && (
                            <div className="flex items-center gap-1.5 flex-wrap self-start sm:self-auto">
                              {meals.breakfast && (
                                <span className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-amber-50 text-amber-950 border border-amber-200 shadow-2xs flex items-center gap-1" title="Daily Morning Breakfast Included">
                                  <span>🌅</span>
                                  <span>Breakfast Included</span>
                                </span>
                              )}
                              {meals.lunch && (
                                <span className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-orange-50 text-orange-950 border border-orange-200 shadow-2xs flex items-center gap-1" title="Lunch Included">
                                  <span>☀️</span>
                                  <span>Lunch Included</span>
                                </span>
                              )}
                              {meals.dinner && (
                                <span className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-purple-50 text-purple-950 border border-purple-200 shadow-2xs flex items-center gap-1" title="Evening Dinner Included">
                                  <span>🌙</span>
                                  <span>Dinner Included</span>
                                </span>
                              )}
                              {!hasAnyMeal && mealInfo.mealPlan === "EP" && (
                                <span className="px-2.5 py-1 rounded-xl text-[10.5px] font-bold bg-slate-50 text-slate-600 border border-slate-200 shadow-2xs flex items-center gap-1" title="Room Only - No meals included in this stay">
                                  <span>🍽️</span>
                                  <span>Room Only (No Meals)</span>
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Narrative Story Description */}
                        {dayItem.description && (
                          <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-1">
                            <div
                              className="text-[13.5px] text-slate-700 leading-relaxed font-normal itinerary-rich-content [&_p]:mb-1.5 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_strong]:font-bold [&_b]:font-bold"
                              dangerouslySetInnerHTML={{ __html: dayItem.description }}
                            />
                          </div>
                        )}

                        {/* Planned Highlights & Activities Tags */}
                        {dayItem.activities && dayItem.activities.length > 0 && (
                          <div className="space-y-1.5 pt-1">
                            <span className="text-[10.5px] font-black uppercase tracking-wider text-slate-400 block">
                              Day Highlights &amp; Inclusions:
                            </span>
                            <div className="flex flex-wrap items-center gap-1.5">
                              {dayItem.activities.map((act, aIdx) => (
                                <span
                                  key={aIdx}
                                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gradient-to-r from-indigo-50/90 to-purple-50/80 text-indigo-950 border border-indigo-200/90 text-[11.5px] font-bold shadow-2xs"
                                >
                                  <span className="text-[12px]">{getActivityIcon(act)}</span>
                                  <span>{act}</span>
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* ── Hotel Accommodation Portfolio Showcase ── */}
            {activeStays && activeStays.length > 0 && (
              <section className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-xs space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold shadow-xs">
                      <Hotel className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-[18px] font-black text-slate-900">Hotel Accommodation Portfolio</h2>
                      <p className="text-[12px] text-slate-500 font-semibold">
                        Curated stays reserved for your selected itinerary &amp; dates
                      </p>
                    </div>
                  </div>

                  <span className="text-[11px] font-black uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 self-start sm:self-auto">
                    {activeStays.length} Destination {activeStays.length === 1 ? "Stay" : "Stays"}
                  </span>
                </div>

                {/* Multi-Tier Interactive Selector Tabs (Custom Option Names & Live Deltas) */}
                {availableOptions.length > 1 && (
                  <div className="p-2.5 rounded-2xl bg-slate-100/90 border border-slate-200 flex items-center gap-2 overflow-x-auto scrollbar-none">
                    <div className="flex items-center gap-1 text-[11px] font-black uppercase text-slate-500 px-1.5 flex-shrink-0">
                      <Layers className="w-3.5 h-3.5 text-amber-600" />
                      <span>Select Tier:</span>
                    </div>
                    {availableOptions.map((opt, oIdx) => {
                      const isSelected = selectedOptionIdx === oIdx;
                      const thisOptCost = getOptionWithMargin(opt);
                      const thisDelta = (baseOptCost > 0 && thisOptCost > 0) ? (thisOptCost - baseOptCost) : 0;
                      const thisDeltaWithTax = includeGst ? Math.round(thisDelta * (1 + gstRate / 100)) : thisDelta;

                      return (
                        <button
                          key={oIdx}
                          type="button"
                          onClick={() => setSelectedOptionIdx(oIdx)}
                          className={`px-4 py-2 rounded-xl text-[12.5px] font-black transition-all flex items-center gap-2 whitespace-nowrap ${
                            isSelected
                              ? "bg-slate-900 text-amber-400 shadow-xs ring-2 ring-amber-400/30 scale-[1.02]"
                              : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200"
                          }`}
                        >
                          <span>{opt.label || `Option ${oIdx + 1}`}</span>
                          <span className={`text-[10.5px] font-bold px-1.5 py-0.2 rounded-md ${
                            isSelected ? "bg-amber-400/20 text-amber-300" : "bg-slate-100 text-slate-500"
                          }`}>
                            {oIdx === 0
                              ? "Base"
                              : thisDeltaWithTax > 0
                              ? `+₹${thisDeltaWithTax.toLocaleString("en-IN")}`
                              : thisDeltaWithTax < 0
                              ? `-₹${Math.abs(thisDeltaWithTax).toLocaleString("en-IN")}`
                              : "Same"}
                          </span>
                          {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Stays List */}
                <div className="space-y-3.5">
                  {activeStays.map((stay, idx) => {
                    const planDesc = MEAL_PLAN_DESCRIPTIONS[stay.mealPlan] || {
                      meaning: `${stay.mealPlan} Meal Plan`,
                      badge: stay.mealPlan,
                      description: "Meals included as per plan",
                    };

                    return (
                      <div
                        key={idx}
                        className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-amber-400/80 transition-all group"
                      >
                        <div className="flex items-start gap-3.5">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 text-white flex flex-col items-center justify-center flex-shrink-0 shadow-xs font-black">
                            <span className="text-[14px] leading-none font-mono">{stay.nights || 1}N</span>
                            <span className="text-[9px] uppercase tracking-tighter text-amber-100">Stay</span>
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[11.5px] font-black text-amber-900 uppercase tracking-wider bg-amber-100/70 px-2.5 py-0.5 rounded-md border border-amber-300/80 flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-amber-700" />
                                <span>{stay.cityName || tripDetails?.destination || "Destination"} • {stay.nights || 1} {(stay.nights || 1) > 1 ? "Nights" : "Night"}</span>
                              </span>

                              {stay.category && stay.category !== "None" && (
                                <span className="text-[10.5px] font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                                  {stay.category}
                                </span>
                              )}

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

                        {stay.mealPlan && (
                          <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/60 flex-shrink-0">
                            <span className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-950 border border-emerald-200 text-[11.5px] font-extrabold flex items-center gap-1.5 shadow-2xs">
                              <span>🍽️</span>
                              <span>{planDesc.badge || `${stay.mealPlan} • ${planDesc.meaning}`}</span>
                            </span>
                            <span className="text-[10px] text-slate-400 mt-0.5 hidden sm:inline">
                              {planDesc.description}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

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
                    <div className="flex items-center justify-between flex-wrap gap-1">
                      <span className="text-[12.5px] text-slate-400 font-semibold line-through font-mono">
                        ₹{originalPrice.toLocaleString("en-IN")}
                      </span>
                      <span className="text-[11px] font-black px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        SAVE ₹{discountAmount.toLocaleString("en-IN")} ({discountPercent}% OFF{pricing?.discountReason ? ` • ${pricing.discountReason}` : ""})
                      </span>
                    </div>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black uppercase tracking-widest text-amber-400">Total Net Package Price</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      includeGst
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        : "bg-slate-800 text-slate-400 border border-slate-700"
                    }`}>
                      {includeGst ? "Includes 5% GST" : "Excludes 5% GST"}
                    </span>
                  </div>
                  <p className="text-[32px] font-black text-white leading-tight font-mono tracking-tight mt-0.5">
                    ₹{finalPrice.toLocaleString("en-IN")}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-3 border-t border-white/10 text-[11px]">
                  <div className="bg-white/5 rounded-xl p-2.5">
                    <p className="text-slate-400 font-bold text-[10px]">Per Couple (2 Adults)</p>
                    <p className="font-black text-[14px] text-white">₹{perCouple.toLocaleString("en-IN")}</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-2.5">
                    <p className="text-slate-400 font-bold text-[10px]">Per Adult ({numPax} {numPax === 1 ? "Pax" : "Pax"})</p>
                    <p className="font-black text-[14px] text-white">₹{perPerson.toLocaleString("en-IN")}</p>
                  </div>
                </div>

                <div className="pt-2.5 border-t border-white/10 space-y-1.5 text-[11.5px]">
                  <div className="flex items-center justify-between text-amber-200">
                    <span>Booking Advance Token ({advancePct}%):</span>
                    <span className="font-black text-[13.5px] font-mono text-amber-300">₹{advancePayment.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300 text-[11px]">
                    <span>Balance at Check-in:</span>
                    <span className="font-bold text-white font-mono">₹{balancePayment.toLocaleString("en-IN")}</span>
                  </div>
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
                  href={`https://api.whatsapp.com/send?phone=${encodeURIComponent(quickQuote.agencyPhone || "919876543210")}&text=Hi%20Mande%20Holidays,%20I%20am%20reviewing%20my%20Quick%20Proposal%20${quickQuote.quickQuoteCode}%20for%20${encodeURIComponent(tripDetails?.title || "Custom Holiday")}.%20Please%20connect%20with%20me.`}
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
                  <p className="text-slate-500">Advance Token ({advancePct}%): <span className="font-bold text-amber-700">₹{advancePayment.toLocaleString("en-IN")}</span></p>
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
      {/* ── Print Stylesheet for High-Quality PDF Output ── */}
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
            font-size: 11pt !important;
          }
          header,
          .print\\:hidden,
          .fixed {
            display: none !important;
          }
          section,
          article,
          .group,
          .rounded-3xl,
          .rounded-2xl {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
          .shadow-xs,
          .shadow-sm,
          .shadow-md,
          .shadow-lg,
          .shadow-xl,
          .shadow-2xl {
            box-shadow: none !important;
          }
          .border {
            border-color: #cbd5e1 !important;
          }
          .max-w-5xl,
          .max-w-6xl {
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          @page {
            margin: 1cm;
            size: A4;
          }
        }
      `}</style>
    </div>
  );
}
