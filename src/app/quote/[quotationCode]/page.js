"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2, XCircle, Calendar, Clock, Users, MapPin,
  ShieldCheck, Loader2, ArrowLeft, Download, Phone, Mail,
  IndianRupee, Sparkles, Check, Car, Moon, Sun, Utensils,
  ChevronDown, ChevronUp, Camera, HeartHandshake, CheckCheck,
  Heart, Mountain, Palmtree, Castle, Crown, Compass, Award,
  Share2, MessageSquare, Printer, Trees, Flame, FileText,
} from "lucide-react";
import WhatsAppShareModal from "@/components/quotations/WhatsAppShareModal";
import EmailShareModal from "@/components/quotations/EmailShareModal";
import { getVehicleImage } from "@/components/packages/VehiclePanel";

const MEAL_EMOJI = { breakfast: "🌅", lunch: "☀️", dinner: "🌙" };
const MEAL_PLAN_LABELS = {
  EP: "Room Only (EP)",
  CP: "Bed & Breakfast (CP)",
  MAP: "Breakfast + Dinner (MAP)",
  AP: "All Meals Included (AP)",
  "": "Standard Meal Plan",
};

// Vibrant Multi-Color Travel Themes with Scenic Background Assets
const THEMES = {
  honeymoon: {
    id: "honeymoon",
    label: "Honeymoon & Romance",
    icon: Heart,
    bgImage: "/themes/honeymoon.jpg",
    color: "from-rose-500 via-pink-600 to-purple-600",
    badge: "bg-rose-50 text-rose-700 border-rose-200",
    glowColor: "rgba(244, 63, 94, 0.25)",
    tagline: "Romantic Escapes, Candlelight Dinners & Sunset Stays 💕",
  },
  mountain: {
    id: "mountain",
    label: "Mountain & Hills",
    icon: Mountain,
    bgImage: "/themes/mountain.jpg",
    color: "from-emerald-500 via-teal-600 to-cyan-700",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    glowColor: "rgba(16, 185, 129, 0.25)",
    tagline: "Misty Peaks, Pine Valleys & Fresh Alpine Escapes 🏔️",
  },
  beach: {
    id: "beach",
    label: "Beach & Coastal",
    icon: Palmtree,
    bgImage: "/themes/beach.jpg",
    color: "from-cyan-500 via-blue-600 to-indigo-600",
    badge: "bg-cyan-50 text-cyan-700 border-cyan-200",
    glowColor: "rgba(6, 182, 212, 0.25)",
    tagline: "Golden Sands, Turquoise Waves & Houseboat Cruises 🏖️",
  },
  heritage: {
    id: "heritage",
    label: "Heritage & Forts",
    icon: Castle,
    bgImage: "/themes/heritage.jpg",
    color: "from-purple-600 via-amber-600 to-orange-600",
    badge: "bg-purple-50 text-purple-700 border-purple-200",
    glowColor: "rgba(168, 85, 247, 0.25)",
    tagline: "Historic Architecture, Palaces & Imperial Haveli Stays 🏰",
  },
  safari: {
    id: "safari",
    label: "Nature & Safari",
    icon: Trees,
    bgImage: "/themes/safari.jpg",
    color: "from-amber-500 via-emerald-600 to-green-700",
    badge: "bg-amber-50 text-amber-800 border-amber-200",
    glowColor: "rgba(245, 158, 11, 0.25)",
    tagline: "Wildlife Sanctuaries, Lush Tea Gardens & Jungle Resorts 🌴",
  },
  adventure: {
    id: "adventure",
    label: "Adventure & Road Trip",
    icon: Flame,
    bgImage: "/themes/adventure.jpg",
    color: "from-orange-500 via-rose-600 to-indigo-700",
    badge: "bg-orange-50 text-orange-700 border-orange-200",
    glowColor: "rgba(249, 115, 22, 0.25)",
    tagline: "Scenic Road Trips, Outdoor Treks & Thrilling Experiences 🎒",
  },
};

function detectTheme(title = "", destination = "") {
  const text = `${title} ${destination}`.toLowerCase();
  if (text.includes("honeymoon") || text.includes("couple") || text.includes("romantic")) return "honeymoon";
  if (text.includes("manali") || text.includes("shimla") || text.includes("munnar") || text.includes("ooty") || text.includes("kashmir") || text.includes("hill") || text.includes("mountain") || text.includes("ladakh")) return "mountain";
  if (text.includes("goa") || text.includes("beach") || text.includes("alleppey") || text.includes("andaman") || text.includes("kovalam") || text.includes("kerala")) return "beach";
  if (text.includes("jaipur") || text.includes("rajasthan") || text.includes("udaipur") || text.includes("jodhpur") || text.includes("fort") || text.includes("palace") || text.includes("heritage")) return "heritage";
  if (text.includes("safari") || text.includes("jungle") || text.includes("national park") || text.includes("wildlife") || text.includes("thekkady") || text.includes("wayanad")) return "safari";
  return "beach";
}

export default function PublicClientQuotationPage() {
  const { quotationCode } = useParams();
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTierIdx, setActiveTierIdx] = useState(0);
  const [openDay, setOpenDay] = useState(0);
  const [selectedThemeId, setSelectedThemeId] = useState("beach");
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [acceptModalOpen, setAcceptModalOpen] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [acceptedSuccess, setAcceptedSuccess] = useState(false);
  const [clientNotes, setClientNotes] = useState("");

  useEffect(() => {
    if (!quotationCode) return;
    setLoading(true);
    fetch(`/api/quotations/code/${quotationCode}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setQuote(data.quotation);
        setActiveTierIdx(data.quotation.selectedOptionIndex || 0);
        setSelectedThemeId(detectTheme(data.quotation.tripDetails?.title, data.quotation.tripDetails?.destination));
      })
      .catch((err) => setError(err.message || "Failed to load quotation"))
      .finally(() => setLoading(false));
  }, [quotationCode]);

  function handlePrint() {
    window.print();
  }

  async function handleAcceptQuote() {
    setAccepting(true);
    try {
      const res = await fetch(`/api/quotations/code/${quotationCode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "accept",
          selectedTierIndex: activeTierIdx,
          clientNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to accept quotation");

      setAcceptedSuccess(true);
      setQuote((prev) => ({ ...prev, status: "confirmed" }));
    } catch (err) {
      alert(`Acceptance error: ${err.message}`);
    } finally {
      setAccepting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white p-6">
        <div className="relative w-16 h-16 mb-4">
          <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20" />
          <div className="absolute inset-0 rounded-full border-4 border-t-cyan-400 animate-spin" />
        </div>
        <div className="text-center space-y-1">
          <p className="text-[11px] font-black uppercase tracking-widest text-cyan-300">Mandate Holidays</p>
          <p className="text-[17px] font-black text-slate-100">Generating Custom Travel Proposal…</p>
          <p className="text-[12px] text-slate-400 font-mono">{quotationCode?.toUpperCase()}</p>
        </div>
      </div>
    );
  }

  if (error || !quote) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white p-6">
        <div className="bg-slate-900 border border-rose-500/30 rounded-3xl p-8 max-w-md w-full text-center space-y-4 shadow-2xl">
          <XCircle className="w-12 h-12 text-rose-400 mx-auto" />
          <h1 className="text-[20px] font-black text-white">Proposal Not Available</h1>
          <p className="text-[13px] text-slate-400">
            {error || "This quotation could not be found or has expired."}
          </p>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-[13px]"
            >
              <ArrowLeft className="w-4 h-4" /> Go to Homepage
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const {
    client,
    tripDetails,
    passengers,
    itinerary = [],
    accommodationOptions = [],
    vehicle,
    pricing,
    inclusions = [],
    exclusions = [],
    paymentTerms,
    instructions = [],
    status,
    createdBy,
  } = quote;

  const activeTheme = THEMES[selectedThemeId] || THEMES.beach;
  const currentTier = accommodationOptions[activeTierIdx] || accommodationOptions[0];
  const isConfirmed = status === "confirmed";

  // Financial calculations
  const tierAccomTotal = currentTier
    ? (currentTier.nights || []).reduce((s, n) => s + (n.pricePerNight || 0), 0)
    : 0;
  const tierMarginType = currentTier?.marginType || pricing?.marginType || "absolute";
  const tierMarginVal = currentTier?.margin ?? pricing?.margin ?? 0;
  const tierVehicleTotal = vehicle?.vehiclePrice || 0;
  const tierActivitiesTotal = (itinerary || []).reduce((sum, day) => {
    return sum + (day.activities || []).reduce((ds, a) => ds + (typeof a === "object" ? a.price || 0 : 0), 0);
  }, 0);

  const tierSubtotal = tierAccomTotal + tierVehicleTotal + tierActivitiesTotal;
  const calculatedMargin =
    tierMarginType === "percentage" ? (tierSubtotal * tierMarginVal) / 100 : tierMarginVal;
  const tierPreTax = tierSubtotal + calculatedMargin;
  const tierGst = pricing?.includeGst ? (tierPreTax * (pricing?.gstPercentage || 5)) / 100 : 0;
  const activeFinalPrice = activeTierIdx === (quote.selectedOptionIndex || 0) && pricing?.finalPrice
    ? pricing.finalPrice
    : Math.max(0, Math.round(tierPreTax + tierGst - (pricing?.discountAmount || 0)));
  const discountAmount = pricing?.discountAmount || 0;
  const rawOriginalPrice = Math.round((tierPreTax + tierGst) / 100) * 100;
  const activeOriginalPrice = discountAmount > 0 ? Math.max(activeFinalPrice + discountAmount, rawOriginalPrice) : activeFinalPrice;
  const discountPercent = activeOriginalPrice > 0 && discountAmount > 0
    ? Math.round((discountAmount / activeOriginalPrice) * 100)
    : 0;

  const numPax = Math.max(1, passengers?.adults || 2);
  const activePerPersonPrice = Math.round(activeFinalPrice / numPax);
  const activePerCouplePrice = Math.round((activeFinalPrice / numPax) * 2);
  const advanceToken = Math.round((activeFinalPrice * (paymentTerms?.advancePercentage || 25)) / 100);

  const startDateStr = tripDetails?.startDate
    ? new Date(tripDetails.startDate).toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric", year: "numeric" })
    : "—";
  const endDateStr = tripDetails?.endDate
    ? new Date(tripDetails.endDate).toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric", year: "numeric" })
    : "—";

  // Split Itinerary for 6-Page PDF print
  const midPoint = Math.ceil(itinerary.length / 2);
  const itineraryPart1 = itinerary.slice(0, Math.max(2, midPoint));
  const itineraryPart2 = itinerary.slice(Math.max(2, midPoint));

  return (
    <div className="min-h-screen bg-[#f1f5f9] text-slate-900 font-sans pb-28">
      {/* ── Top Multi-Color Vibrant Header Line ── */}
      <div className="h-1.5 w-full bg-gradient-to-r from-rose-500 via-amber-500 via-emerald-500 to-cyan-500 no-print" />

      {/* ── Top Navigation Bar (Screen Only) ── */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-6 py-3 shadow-xs no-print">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="Mandate Holidays Logo"
              className="h-10 w-auto object-contain"
            />
            <div className="hidden sm:block">
              <div className="flex items-center gap-2">
                <span className="text-[14.5px] font-black text-slate-900 tracking-tight leading-none">MANDATE HOLIDAYS</span>
                <span className="text-[9.5px] font-black px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase tracking-wider">
                  Verified Proposal
                </span>
              </div>
              <p className="text-[11px] font-semibold text-slate-500 mt-0.5">
                Executive Holiday Proposal &amp; Travel Brochure
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShareModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-[12px] transition-colors"
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={() => setEmailModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 font-bold text-[12px] transition-colors"
            >
              <Mail className="w-3.5 h-3.5 text-sky-600" />
              <span className="hidden sm:inline">Email</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100 text-indigo-800 font-extrabold text-[12px] transition-all shadow-xs"
            >
              <Printer className="w-3.5 h-3.5 text-indigo-600" />
              <span>Print / PDF</span>
            </button>

            {isConfirmed ? (
              <span className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 font-extrabold text-[12px]">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Confirmed
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setAcceptModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:to-pink-700 text-white font-black text-[12.5px] transition-all shadow-md shadow-indigo-500/25 hover:scale-[1.02] active:scale-[0.98]"
              >
                <HeartHandshake className="w-4 h-4" /> Accept Proposal
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ── Theme Vibe Selector Switcher (Screen Only) ── */}
      <div className="bg-slate-200/80 border-b border-slate-300 px-6 py-2.5 no-print">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 overflow-x-auto">
          <span className="text-[11px] font-black uppercase tracking-widest text-slate-700 flex-shrink-0 flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-indigo-600" /> Choose Atmosphere:
          </span>
          <div className="flex items-center gap-2">
            {Object.values(THEMES).map((th) => {
              const Icon = th.icon;
              const isSelected = selectedThemeId === th.id;
              return (
                <button
                  key={th.id}
                  type="button"
                  onClick={() => setSelectedThemeId(th.id)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11.5px] font-extrabold whitespace-nowrap transition-all ${
                    isSelected
                      ? "bg-slate-900 text-white shadow-xs scale-105"
                      : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-300"
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  <span>{th.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Screen Hero: Panoramic Scenic Background Card ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 no-print">
        <div className="relative rounded-3xl overflow-hidden shadow-xl min-h-[380px] sm:min-h-[420px] flex flex-col justify-end p-6 sm:p-10 text-white border border-slate-700">
          {/* Scenic Theme Background Image */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={activeTheme.bgImage}
            alt={activeTheme.label}
            className="absolute inset-0 w-full h-full object-cover object-center transition-all duration-700"
          />
          {/* Gradient Overlay for high-contrast readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-slate-900/40" />

          {/* Hero Content */}
          <div className="relative z-10 space-y-4 max-w-4xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-[11px] font-black px-3 py-1 rounded-full bg-white/20 text-white backdrop-blur-md border border-white/30">
                REF: {quotationCode}
              </span>
              <span className="px-3 py-1 rounded-full bg-black/40 text-[11.5px] font-bold text-slate-200 backdrop-blur-md border border-white/10">
                Prepared for: <strong className="text-white underline decoration-cyan-400">{client?.name}</strong>
              </span>
              <span className={`px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider border backdrop-blur-md ${activeTheme.badge}`}>
                ✨ {activeTheme.label}
              </span>
              {discountAmount > 0 && (
                <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-400/40 backdrop-blur-md animate-pulse">
                  🔥 Special Deal: Save ₹{discountAmount.toLocaleString("en-IN")} ({discountPercent}% OFF)
                </span>
              )}
            </div>

            <div className="space-y-1">
              <p className="text-[12.5px] font-bold text-cyan-300 uppercase tracking-widest drop-shadow-sm">
                {activeTheme.tagline}
              </p>
              <h1 className="text-[28px] sm:text-[40px] font-black text-white leading-tight font-serif tracking-tight drop-shadow-md">
                {tripDetails?.title || "Custom Holiday Itinerary & Proposal"}
              </h1>
            </div>

            {/* Quick Param Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3 rounded-2xl bg-black/50 backdrop-blur-md border border-white/15">
                <p className="text-[9.5px] font-bold uppercase tracking-wider text-slate-300">Duration</p>
                <p className="text-[14px] font-black text-white">{tripDetails?.nights || 0}N / {tripDetails?.days || 0}D</p>
              </div>
              <div className="p-3 rounded-2xl bg-black/50 backdrop-blur-md border border-white/15">
                <p className="text-[9.5px] font-bold uppercase tracking-wider text-slate-300">Travelers</p>
                <p className="text-[14px] font-black text-white">{passengers?.adults || 2} Adults ({passengers?.totalRooms || 1} Room)</p>
              </div>
              <div className="p-3 rounded-2xl bg-black/50 backdrop-blur-md border border-white/15">
                <p className="text-[9.5px] font-bold uppercase tracking-wider text-slate-300">Transport</p>
                <p className="text-[14px] font-black text-white">AC {vehicle?.vehicleType || "Cab"}</p>
              </div>
              <div className="p-3 rounded-2xl bg-gradient-to-br from-indigo-600/60 to-purple-600/60 backdrop-blur-md border border-indigo-400/40">
                <p className="text-[9.5px] font-bold uppercase tracking-wider text-cyan-200">Category</p>
                <p className="text-[14px] font-black text-cyan-300 truncate">{currentTier?.label || "Standard"}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Screen Body: Modern Dual-Column Layout (Left: Sticky Commercials, Right: Detailed Stream) ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 no-print">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* ── Left Column (Sticky Commercials & Quick Info, 4 cols) ── */}
          <aside className="lg:col-span-4 space-y-6 lg:sticky lg:top-20">
            {/* Live Pricing Widget */}
            <div className="p-6 rounded-3xl bg-slate-900 text-white space-y-5 shadow-xl border border-indigo-500/30 relative overflow-hidden">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-cyan-300 bg-cyan-950/60 px-2.5 py-0.5 rounded-full border border-cyan-800">
                    {currentTier?.label || "Selected"} Category
                  </span>
                  {discountAmount > 0 && (
                    <span className="text-[10px] font-black bg-rose-500/20 text-rose-300 border border-rose-400/40 px-2.5 py-0.5 rounded-full animate-pulse flex items-center gap-1">
                      🎉 SAVE ₹{discountAmount.toLocaleString("en-IN")} ({discountPercent}% OFF)
                    </span>
                  )}
                </div>

                <div className="flex items-baseline gap-2.5 pt-1">
                  <p className="text-[34px] font-black text-emerald-400 font-serif leading-none">
                    ₹{activeFinalPrice.toLocaleString("en-IN")}
                  </p>
                  {discountAmount > 0 && (
                    <span className="text-[17px] font-bold text-slate-400 line-through">
                      ₹{activeOriginalPrice.toLocaleString("en-IN")}
                    </span>
                  )}
                </div>

                {discountAmount > 0 && (
                  <p className="text-[11.5px] text-emerald-300 font-bold flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    Special Offer: {pricing?.discountReason || "Limited Period Offer Discount"}
                  </p>
                )}
                <p className="text-[11.5px] text-slate-300 font-semibold">Total Price with taxes &amp; private cab</p>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10 text-[11.5px]">
                <div className="bg-white/10 rounded-2xl p-3 backdrop-blur-xs">
                  <p className="text-indigo-200 text-[10px] font-bold">Per Couple</p>
                  <p className="font-black text-[15px] text-white mt-0.5">
                    ₹{activePerCouplePrice.toLocaleString("en-IN")}
                  </p>
                </div>
                <div className="bg-white/10 rounded-2xl p-3 backdrop-blur-xs">
                  <p className="text-indigo-200 text-[10px] font-bold">Per Person ({numPax} Pax)</p>
                  <p className="font-black text-[15px] text-white mt-0.5">
                    ₹{activePerPersonPrice.toLocaleString("en-IN")}
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1 text-[12px]">
                <div className="flex justify-between text-slate-300">
                  <span>Advance Token (25%):</span>
                  <span className="font-black text-emerald-300">₹{advanceToken.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between text-slate-400 text-[11px]">
                  <span>Balance Milestone:</span>
                  <span>₹{(activeFinalPrice - advanceToken).toLocaleString("en-IN")}</span>
                </div>
              </div>

              {isConfirmed ? (
                <div className="p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-center font-bold text-[13px]">
                  ✓ Proposal Confirmed on {new Date(quote.updatedAt).toLocaleDateString("en-IN")}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setAcceptModalOpen(true)}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:to-pink-700 text-white font-black text-[14px] transition-all shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <HeartHandshake className="w-5 h-5" /> Accept &amp; Confirm Holiday
                </button>
              )}
            </div>

            {/* Transport Card */}
            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center gap-3.5">
                <div className="w-16 h-14 rounded-2xl bg-sky-50/70 border border-sky-100 p-1 flex items-center justify-center flex-shrink-0 shadow-2xs">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={getVehicleImage(vehicle?.vehicleType)}
                    alt={vehicle?.vehicleType || "Vehicle"}
                    className="h-11 w-auto object-contain"
                  />
                </div>
                <div>
                  <h4 className="font-black text-slate-900 text-[14px]">AC {vehicle?.vehicleType || "Private Cab"}</h4>
                  <p className="text-[11.5px] text-slate-500 font-semibold">{vehicle?.model || "Commercial Tourist Vehicle"} • Up to {vehicle?.seats || 4} Guests</p>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-100 space-y-1.5 text-[12px] text-slate-600 font-medium">
                <p className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-600" /> Fuel &amp; Toll Taxes Included</p>
                <p className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-600" /> Driver Night Allowance Included</p>
                <p className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-600" /> Inter-city &amp; Sightseeing Transfers</p>
              </div>
            </div>

            {/* Concierge Support Card */}
            <div className="p-5 rounded-3xl bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 shadow-xs space-y-2">
              <h4 className="font-black text-indigo-950 text-[13.5px] flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-indigo-600" /> Mandate Concierge Guarantee
              </h4>
              <p className="text-[12px] text-slate-600 leading-relaxed">
                You will receive a dedicated holiday manager on WhatsApp for seamless hotel check-ins and on-road chauffeur coordination.
              </p>
            </div>
          </aside>

          {/* ── Right Column (Comprehensive Content Stream, 8 cols) ── */}
          <main className="lg:col-span-8 space-y-8">

            {/* 1. Interactive Hotel Category Switcher (3 Tiers) */}
            {accommodationOptions.length > 0 && (
              <section className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
                    Step 1: Choose Comfort
                  </span>
                  <h2 className="text-[22px] font-black text-slate-900 mt-2 font-serif">
                    Hotel Accommodation Categories
                  </h2>
                  <p className="text-[13px] text-slate-500">
                    Click any option to view the included hotel properties and live updated pricing
                  </p>
                </div>

                {/* Category Options Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  {accommodationOptions.map((opt, idx) => {
                    const isSelected = idx === activeTierIdx;
                    const optAccomTotal = (opt.nights || []).reduce((s, n) => s + (n.pricePerNight || 0), 0);
                    const optMarginType = opt.marginType || pricing?.marginType || "absolute";
                    const optMarginVal = opt.margin ?? pricing?.margin ?? 0;
                    const optSub = optAccomTotal + tierVehicleTotal + tierActivitiesTotal;
                    const optMarg = optMarginType === "percentage" ? (optSub * optMarginVal) / 100 : optMarginVal;
                    const optPre = optSub + optMarg;
                    const optGst = pricing?.includeGst ? (optPre * (pricing?.gstPercentage || 5)) / 100 : 0;
                    const optFinal = Math.max(0, Math.round(optPre + optGst - (pricing?.discountAmount || 0)));

                    return (
                      <div
                        key={idx}
                        onClick={() => setActiveTierIdx(idx)}
                        className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                          isSelected
                            ? "border-indigo-600 bg-gradient-to-b from-indigo-50/80 to-purple-50/40 shadow-md shadow-indigo-500/10 ring-2 ring-indigo-400/20"
                            : "border-slate-200 hover:border-indigo-300 bg-white hover:bg-slate-50/50"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className={`text-[14.5px] font-black ${isSelected ? "text-indigo-950 font-serif" : "text-slate-800"}`}>
                            {opt.label || `Option ${idx + 1}`}
                          </span>
                          {isSelected ? (
                            <CheckCircle2 className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                          ) : (
                            <span className="w-4 h-4 rounded-full border border-slate-300" />
                          )}
                        </div>

                        <p className="text-[11.5px] text-slate-500 font-semibold mb-2">
                          {(opt.nights || []).length} Nights Stay Included
                        </p>

                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Package:</span>
                          <span className={`text-[14px] font-black ${isSelected ? "text-indigo-700" : "text-slate-900"}`}>
                            ₹{optFinal.toLocaleString("en-IN")}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Selected Category Hotel Breakdown */}
                {currentTier && (
                  <div className="pt-2 border-t border-slate-100 space-y-3">
                    <p className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                      Included Stays in <span className="text-indigo-700 font-serif font-black">{currentTier.label}</span>
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {(currentTier.nights || []).map((n, i) => (
                        <div key={i} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5 text-[13px]">
                          <div className="flex items-center justify-between">
                            <span className="font-black text-slate-900 flex items-center gap-1.5">
                              <Moon className="w-3.5 h-3.5 text-indigo-500" />
                              Night {n.night} — {n.cityName}
                            </span>
                            {n.starRating && (
                              <span className="text-[11px] text-amber-500 font-black tracking-widest">
                                {"★".repeat(n.starRating)}
                              </span>
                            )}
                          </div>

                          <p className="font-black text-slate-900 text-[14px]">
                            {n.hotelName || "Quality Certified Hotel"}
                          </p>

                          <div className="flex items-center gap-3 text-[11.5px] text-slate-600 font-semibold flex-wrap">
                            <span>Room: <strong className="text-slate-800">{n.roomType || "Deluxe AC Room"}</strong></span>
                            <span>•</span>
                            <span className="text-indigo-700 font-bold bg-indigo-50 px-2 py-0.5 rounded-md">
                              {MEAL_PLAN_LABELS[n.mealPlan] || n.mealPlan}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* 2. Day-by-Day Journey Timeline */}
            <section className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
                    Step 2: Tour Roadmap
                  </span>
                  <h2 className="text-[22px] font-black text-slate-900 mt-2 font-serif">
                    Day-by-Day Sightseeing &amp; Experience Schedule
                  </h2>
                </div>
                <span className="text-[11.5px] font-extrabold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                  {itinerary.length} Tour Days
                </span>
              </div>

              <div className="space-y-4">
                {itinerary.map((day, idx) => {
                  const isOpen = openDay === idx;
                  const mealsArr = Object.entries(day.meals || {}).filter(([, v]) => v).map(([k]) => k);

                  return (
                    <div
                      key={idx}
                      className="rounded-2xl border border-slate-200 overflow-hidden transition-all shadow-xs"
                    >
                      <button
                        type="button"
                        onClick={() => setOpenDay(isOpen ? -1 : idx)}
                        className="w-full p-4 sm:p-5 flex items-center justify-between gap-4 text-left bg-gradient-to-r from-slate-50 to-indigo-50/20 hover:bg-indigo-50/40 transition-colors"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white font-black text-[13px] flex items-center justify-center flex-shrink-0 shadow-sm">
                            D{day.day}
                          </div>
                          <div className="min-w-0 space-y-0.5">
                            <h3 className="text-[15px] font-black text-slate-900 truncate">
                              {day.title || `Day ${day.day} Exploration`}
                            </h3>
                            <div className="flex items-center gap-3 text-[11.5px] text-slate-500 font-semibold flex-wrap">
                              {mealsArr.length > 0 && (
                                <span className="text-indigo-700 font-bold flex items-center gap-1">
                                  {mealsArr.map((m) => MEAL_EMOJI[m]).join(" ")} Meals Included
                                </span>
                              )}
                              {(day.activities || []).length > 0 && (
                                <span>• {day.activities.length} Activities</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="p-1 rounded-full bg-white border border-slate-200 text-slate-400 flex-shrink-0">
                          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                      </button>

                      {/* Day Content */}
                      <div className={`${isOpen ? "block" : "hidden"} p-5 bg-white border-t border-slate-200 space-y-4`}>
                        {day.description && (
                          <div
                            className="text-[13px] text-slate-700 leading-relaxed itinerary-description p-4 bg-slate-50 rounded-2xl border border-slate-200"
                            dangerouslySetInnerHTML={{ __html: day.description }}
                          />
                        )}

                        {/* Sightseeing Pills */}
                        {day.activities?.length > 0 && (
                          <div className="space-y-1.5 pt-1">
                            <p className="text-[10.5px] font-black uppercase tracking-wider text-slate-400">
                              Included Sightseeing &amp; Passes
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {day.activities.map((act, ai) => (
                                <span
                                  key={ai}
                                  className="px-3 py-1 rounded-xl bg-slate-100 text-slate-800 text-[12px] font-extrabold border border-slate-200 flex items-center gap-1.5"
                                >
                                  <Sparkles className="w-3 h-3 text-amber-500" />
                                  {typeof act === "object" ? act.name : act}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* 3. Inclusions & Exclusions */}
            <section className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Step 3: Clear Boundaries
                </span>
                <h2 className="text-[22px] font-black text-slate-900 mt-2 font-serif">
                  Inclusions &amp; Exclusions Summary
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-start">
                <div className="space-y-3 p-5 rounded-2xl bg-emerald-50/40 border border-emerald-200">
                  <h4 className="text-[12.5px] font-black uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-emerald-600" /> What's Included
                  </h4>
                  <div className="space-y-2">
                    {inclusions.length > 0 ? (
                      inclusions.map((inc, i) => (
                        <div key={i} className="flex items-start gap-2 text-[12.5px] text-slate-800 font-medium">
                          <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-1" />
                          <span>{inc}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-[12px] text-slate-500">All hotel stays, private AC cab transfers, and listed tour meals.</p>
                    )}
                  </div>
                </div>

                <div className="space-y-3 p-5 rounded-2xl bg-rose-50/40 border border-rose-200">
                  <h4 className="text-[12.5px] font-black uppercase tracking-wider text-rose-900 flex items-center gap-1.5">
                    <XCircle className="w-4 h-4 text-rose-500" /> What's Excluded
                  </h4>
                  <div className="space-y-2">
                    {exclusions.length > 0 ? (
                      exclusions.map((exc, i) => (
                        <div key={i} className="flex items-start gap-2 text-[12.5px] text-slate-600 font-medium">
                          <span className="text-rose-500 font-bold">✕</span>
                          <span>{exc}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-[12px] text-slate-500">Flight/train tickets, personal expenses, and unmentioned monument entries.</p>
                    )}
                  </div>
                </div>
              </div>
            </section>
          </main>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════════
          PRINT-ONLY 6-PAGE BROCHURE ENGINE (FOR PERFECT PDF OUTPUT)
          ═══════════════════════════════════════════════════════════════════════════ */}

      {/* 📄 PRINT PAGE 1: COVER PAGE */}
      <section className="print-only pdf-page bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white p-12 relative overflow-hidden">
        {/* Scenic Background in Print */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={activeTheme.bgImage}
          alt={activeTheme.label}
          className="absolute inset-0 w-full h-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent" />

        <div className="relative z-10 flex items-center justify-between border-b border-white/20 pb-6">
          <div className="flex items-center gap-3.5">
            <div className="bg-white p-2 rounded-2xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="Mandate Holidays" className="h-12 w-auto object-contain" />
            </div>
            <div>
              <p className="text-[18px] font-black text-white">MANDATE HOLIDAYS</p>
              <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Luxury Travel &amp; Tour Curator</p>
            </div>
          </div>
          <div className="text-right">
            <span className="font-mono text-[11px] font-black px-3.5 py-1 rounded-full bg-white/10 text-white border border-white/20">
              REF: {quotationCode}
            </span>
            <p className="text-[10px] font-semibold text-slate-300 mt-1">Official Travel Dossier</p>
          </div>
        </div>

        <div className="relative z-10 my-auto py-10 space-y-6">
          <div className="space-y-2">
            <span className={`inline-block px-3.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider border ${activeTheme.badge}`}>
              ✨ {activeTheme.label}
            </span>
            <h1 className="text-[40px] font-black text-white leading-tight font-serif">
              {tripDetails?.title || "Custom Holiday Itinerary & Proposal"}
            </h1>
            <p className="text-[14px] font-medium text-cyan-200 max-w-2xl">{activeTheme.tagline}</p>
          </div>

          <div className="p-6 rounded-3xl bg-black/60 backdrop-blur-md border border-white/20 grid grid-cols-4 gap-4">
            <div>
              <p className="text-[9.5px] font-bold uppercase tracking-wider text-slate-300">Client</p>
              <p className="text-[15px] font-black text-white mt-0.5">{client?.name}</p>
              <p className="text-[11px] text-slate-300">{client?.phone}</p>
            </div>
            <div>
              <p className="text-[9.5px] font-bold uppercase tracking-wider text-slate-300">Duration</p>
              <p className="text-[15px] font-black text-white mt-0.5">{tripDetails?.nights || 0}N / {tripDetails?.days || 0}D</p>
              <p className="text-[11px] text-slate-300">{startDateStr}</p>
            </div>
            <div>
              <p className="text-[9.5px] font-bold uppercase tracking-wider text-slate-300">Guests</p>
              <p className="text-[15px] font-black text-white mt-0.5">{passengers?.adults || 2} Adults</p>
              <p className="text-[11px] text-slate-300">{passengers?.totalRooms || 1} Room(s)</p>
            </div>
            <div>
              <p className="text-[9.5px] font-bold uppercase tracking-wider text-slate-300">Category &amp; Price</p>
              <p className="text-[14px] font-black text-cyan-300 mt-0.5 truncate">{currentTier?.label || "Standard"}</p>
              {discountAmount > 0 ? (
                <div className="pt-0.5">
                  <span className="text-[10px] text-slate-400 line-through">₹{activeOriginalPrice.toLocaleString("en-IN")}</span>
                  <p className="text-[13px] font-black text-emerald-400">₹{activeFinalPrice.toLocaleString("en-IN")}</p>
                  <span className="text-[9px] font-bold text-rose-300">Save ₹{discountAmount.toLocaleString("en-IN")}</span>
                </div>
              ) : (
                <p className="text-[13px] font-black text-white">₹{activeFinalPrice.toLocaleString("en-IN")}</p>
              )}
            </div>
          </div>
        </div>

        <div className="relative z-10 pt-6 border-t border-white/20 flex items-center justify-between text-[11px] text-slate-300">
          <p>© Mandate Holidays • Certified Hospitality Network</p>
          <p className="font-mono">Page 1 of 6 • Dossier Cover</p>
        </div>
      </section>

      {/* 📄 PRINT PAGE 2: EXECUTIVE TOUR OVERVIEW */}
      <section className="print-only pdf-page bg-white p-10 text-slate-900">
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
                Section 01
              </span>
              <h2 className="text-[22px] font-black text-slate-900 mt-1 font-serif">Executive Tour Overview &amp; Route</h2>
            </div>
            <p className="font-mono text-[11px] text-slate-400">REF: {quotationCode}</p>
          </div>

          {tripDetails?.destinations?.length > 0 && (
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
              <p className="text-[11px] font-black uppercase tracking-wider text-slate-500">Scheduled Journey Roadmap</p>
              <div className="flex items-center gap-2 flex-wrap text-[13px] font-bold text-slate-800">
                {tripDetails.destinations.map((d, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-xl bg-indigo-600 text-white text-[12px] font-extrabold shadow-xs">
                      {d.cityName} ({d.nights}N)
                    </span>
                    {i < tripDetails.destinations.length - 1 && <span className="text-slate-400 font-black">➔</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-3">
            <h3 className="text-[13.5px] font-black uppercase tracking-wider text-slate-700">Tour Experience Pillars</h3>
            <div className="grid grid-cols-2 gap-3.5">
              <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-1">
                <p className="font-black text-indigo-950 text-[13px]">🏨 Verified Quality Stays</p>
                <p className="text-[11.5px] text-slate-600">Handpicked properties with verified hygiene, AC rooms, and top traveler ratings.</p>
              </div>
              <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 space-y-1">
                <p className="font-black text-emerald-950 text-[13px]">🚗 Dedicated AC Transport</p>
                <p className="text-[11.5px] text-slate-600">Private commercial vehicle for all transfers, sightseeing, and inter-city travel.</p>
              </div>
              <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-100 space-y-1">
                <p className="font-black text-purple-950 text-[13px]">🌅 Curated Sightseeing Passes</p>
                <p className="text-[11.5px] text-slate-600">Pre-scheduled scenic viewpoints, boat cruises, and landmark entry passes.</p>
              </div>
              <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-100 space-y-1">
                <p className="font-black text-amber-950 text-[13px]">🛡️ 24x7 Trip Concierge</p>
                <p className="text-[11.5px] text-slate-600">Dedicated operational support manager reachable via phone &amp; WhatsApp throughout.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-400">
          <p>MANDATE HOLIDAYS • Executive Overview</p>
          <p className="font-mono">Page 2 of 6</p>
        </div>
      </section>

      {/* 📄 PRINT PAGE 3: HOTEL ACCOMMODATION PORTFOLIO */}
      <section className="print-only pdf-page bg-white p-10 text-slate-900">
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Section 02
              </span>
              <h2 className="text-[22px] font-black text-slate-900 mt-1 font-serif">Hotel Accommodation Portfolio</h2>
            </div>
            <p className="font-mono text-[11px] text-slate-400">REF: {quotationCode}</p>
          </div>

          <div className="space-y-4">
            <p className="text-[12px] text-slate-600">
              The following hotel stays are confirmed for your selected category (<strong className="text-indigo-700">{currentTier?.label || "Standard"}</strong>):
            </p>

            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-[12px]">
                <thead className="bg-slate-50 border-b border-slate-200 text-[10.5px] font-black uppercase text-slate-500">
                  <tr>
                    <th className="p-3">Night</th>
                    <th className="p-3">Destination</th>
                    <th className="p-3">Hotel Property</th>
                    <th className="p-3">Room Category</th>
                    <th className="p-3">Meal Plan</th>
                    <th className="p-3">Rating</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {(currentTier?.nights || []).map((n, i) => (
                    <tr key={i}>
                      <td className="p-3 font-bold text-slate-900">Night {n.night}</td>
                      <td className="p-3 font-semibold text-slate-700">{n.cityName}</td>
                      <td className="p-3 font-black text-indigo-900">{n.hotelName || "Hotel Pending Confirmation"}</td>
                      <td className="p-3 text-slate-600">{n.roomType || "Deluxe AC"}</td>
                      <td className="p-3 font-bold text-emerald-700">{MEAL_PLAN_LABELS[n.mealPlan] || n.mealPlan}</td>
                      <td className="p-3 text-amber-500 font-bold">{n.starRating ? "★".repeat(n.starRating) : "3★"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 text-[11.5px] text-amber-900 space-y-1">
              <p className="font-bold">📋 Hotel Check-in / Check-out Guidelines:</p>
              <p>• Standard check-in time is 12:00 PM / 2:00 PM and check-out is 10:00 AM / 11:00 AM.</p>
              <p>• Early check-in or late check-out is subject to room availability at the respective property.</p>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-400">
          <p>MANDATE HOLIDAYS • Accommodation Portfolio</p>
          <p className="font-mono">Page 3 of 6</p>
        </div>
      </section>

      {/* 📄 PRINT PAGE 4: DETAILED ITINERARY PART 1 */}
      <section className="print-only pdf-page bg-white p-10 text-slate-900">
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-cyan-700 bg-cyan-50 px-2.5 py-0.5 rounded-full border border-cyan-200">
                Section 03 — Part I
              </span>
              <h2 className="text-[22px] font-black text-slate-900 mt-1 font-serif">Detailed Journey Itinerary</h2>
            </div>
            <p className="font-mono text-[11px] text-slate-400">REF: {quotationCode}</p>
          </div>

          <div className="space-y-3.5">
            {itineraryPart1.map((day, idx) => {
              const mealsArr = Object.entries(day.meals || {}).filter(([, v]) => v).map(([k]) => k);
              return (
                <div key={idx} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5 text-[12px]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white font-black text-[11px] flex items-center justify-center">
                        D{day.day}
                      </span>
                      <h4 className="text-[13.5px] font-black text-slate-900 font-serif">{day.title}</h4>
                    </div>
                    {mealsArr.length > 0 && (
                      <span className="text-[10.5px] font-bold text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded-md">
                        {mealsArr.map((m) => MEAL_EMOJI[m]).join(" ")} Meals
                      </span>
                    )}
                  </div>

                  {day.description && (
                    <div
                      className="text-[11.5px] text-slate-700 leading-relaxed itinerary-description pl-8"
                      dangerouslySetInnerHTML={{ __html: day.description }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="pt-6 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-400">
          <p>MANDATE HOLIDAYS • Itinerary Schedule (Part I)</p>
          <p className="font-mono">Page 4 of 6</p>
        </div>
      </section>

      {/* 📄 PRINT PAGE 5: DETAILED ITINERARY PART 2 & TRANSPORT */}
      <section className="print-only pdf-page bg-white p-10 text-slate-900">
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-200">
                Section 03 — Part II &amp; Fleet
              </span>
              <h2 className="text-[22px] font-black text-slate-900 mt-1 font-serif">Itinerary Completion &amp; Transport</h2>
            </div>
            <p className="font-mono text-[11px] text-slate-400">REF: {quotationCode}</p>
          </div>

          <div className="space-y-3">
            {itineraryPart2.map((day, idx) => {
              const mealsArr = Object.entries(day.meals || {}).filter(([, v]) => v).map(([k]) => k);
              return (
                <div key={idx} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5 text-[12px]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white font-black text-[11px] flex items-center justify-center">
                        D{day.day}
                      </span>
                      <h4 className="text-[13.5px] font-black text-slate-900 font-serif">{day.title}</h4>
                    </div>
                    {mealsArr.length > 0 && (
                      <span className="text-[10.5px] font-bold text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded-md">
                        {mealsArr.map((m) => MEAL_EMOJI[m]).join(" ")} Meals
                      </span>
                    )}
                  </div>

                  {day.description && (
                    <div
                      className="text-[11.5px] text-slate-700 leading-relaxed itinerary-description pl-8"
                      dangerouslySetInnerHTML={{ __html: day.description }}
                    />
                  )}
                </div>
              );
            })}
          </div>

          <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-200 flex items-center gap-4">
            <div className="w-16 h-14 rounded-xl bg-white border border-sky-100 p-1 flex items-center justify-center flex-shrink-0 shadow-2xs">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={getVehicleImage(vehicle?.vehicleType)}
                alt={vehicle?.vehicleType || "Vehicle"}
                className="h-11 w-auto object-contain"
              />
            </div>
            <div className="flex-1 space-y-1">
              <h4 className="text-[13px] font-black text-sky-950">🚗 Dedicated Private Chauffeur &amp; Cab</h4>
              <p className="text-[11.5px] text-sky-900 font-semibold">
                Vehicle: <strong>AC {vehicle?.vehicleType || "Sedan"}</strong> ({vehicle?.model || "Dedicated Tourist Cab"}) • Up to {vehicle?.seats || 4} Guests Capacity
              </p>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-sky-800 font-medium pt-0.5">
                <p>✓ Fuel, State Tax &amp; Toll Charges Included</p>
                <p>✓ Driver Night Batta &amp; Parking Included</p>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-400">
          <p>MANDATE HOLIDAYS • Transport &amp; Itinerary</p>
          <p className="font-mono">Page 5 of 6</p>
        </div>
      </section>

      {/* 📄 PRINT PAGE 6: COMMERCIALS, TERMS & CONFIRMATION SEAL */}
      <section className="print-only pdf-page-last bg-white p-10 text-slate-900">
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Section 04
              </span>
              <h2 className="text-[22px] font-black text-slate-900 mt-1 font-serif">Commercials, Inclusions &amp; Terms</h2>
            </div>
            <p className="font-mono text-[11px] text-slate-400">REF: {quotationCode}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-1.5">
              <div className="flex items-center justify-between">
                <p className="text-[9.5px] font-black uppercase tracking-wider text-slate-400">Total Quotation Value</p>
                {discountAmount > 0 && (
                  <span className="text-[9px] font-black bg-rose-500/20 text-rose-300 border border-rose-400/40 px-2 py-0.5 rounded-full">
                    Save ₹{discountAmount.toLocaleString("en-IN")}
                  </span>
                )}
              </div>
              <div className="flex items-baseline gap-2">
                <p className="text-[26px] font-black text-emerald-400 font-serif">₹{activeFinalPrice.toLocaleString("en-IN")}</p>
                {discountAmount > 0 && (
                  <span className="text-[14px] font-bold text-slate-400 line-through">₹{activeOriginalPrice.toLocaleString("en-IN")}</span>
                )}
              </div>
              <p className="text-[11px] text-slate-300">
                ₹{activePerCouplePrice.toLocaleString("en-IN")} / couple • ₹{activePerPersonPrice.toLocaleString("en-IN")} / person
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 space-y-1 text-[12px]">
              <p className="text-[9.5px] font-black uppercase tracking-wider text-amber-800">Booking Milestones</p>
              <p className="font-black text-[14px]">Advance Token (25%): ₹{advanceToken.toLocaleString("en-IN")}</p>
              <p className="text-[11px] text-amber-800">Balance: ₹{(activeFinalPrice - advanceToken).toLocaleString("en-IN")} (Payable prior to departure)</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-[11.5px]">
            <div className="p-3.5 rounded-2xl bg-emerald-50/50 border border-emerald-200 space-y-1">
              <h5 className="font-black text-emerald-900 uppercase tracking-wider text-[10.5px]">✓ What's Included</h5>
              {inclusions.slice(0, 5).map((inc, i) => (
                <p key={i} className="text-slate-700">• {inc}</p>
              ))}
            </div>

            <div className="p-3.5 rounded-2xl bg-rose-50/50 border border-rose-200 space-y-1">
              <h5 className="font-black text-rose-900 uppercase tracking-wider text-[10.5px]">✕ What's Excluded</h5>
              {exclusions.slice(0, 5).map((exc, i) => (
                <p key={i} className="text-slate-600">• {exc}</p>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 grid grid-cols-2 gap-6 text-[11.5px]">
            <div className="space-y-6">
              <p className="font-bold text-slate-700">Client Signature / Confirmation:</p>
              <div className="border-b border-slate-400 w-48" />
              <p className="text-[10.5px] text-slate-400">Date: _______________________</p>
            </div>

            <div className="text-right space-y-1">
              <p className="font-black text-slate-900 text-[13px]">MANDATE HOLIDAYS</p>
              <p className="text-[10.5px] text-slate-500">Authorized Tour Operator Seal</p>
              <div className="inline-block mt-1 px-3 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-black uppercase">
                ✓ Verified Proposal
              </div>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-400">
          <p>MANDATE HOLIDAYS • Official Proposal &amp; Contract</p>
          <p className="font-mono">Page 6 of 6 • Final Page</p>
        </div>
      </section>

      {/* ── Acceptance Confirmation Modal (Screen Only) ── */}
      {acceptModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 no-print">
          <div className="absolute inset-0 bg-slate-900/65 backdrop-blur-md" onClick={() => setAcceptModalOpen(false)} />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center mx-auto text-[22px]">
              ✈️
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-[18px] font-black text-slate-900 font-serif">Confirm Your Holiday Proposal</h3>
              <p className="text-[12.5px] text-slate-500">
                You are accepting the <strong>{currentTier?.label || "Selected"}</strong> category for ₹{activeFinalPrice.toLocaleString("en-IN")}.
              </p>
            </div>

            <div>
              <label className="block text-[12px] font-bold text-slate-600 mb-1">
                Any Special Preferences / Flight Details (Optional)
              </label>
              <textarea
                value={clientNotes}
                onChange={(e) => setClientNotes(e.target.value)}
                rows={3}
                placeholder="e.g. Special food preferences, arrival flight details, extra bed..."
                className="w-full p-3 rounded-xl border border-slate-200 text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setAcceptModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-[13px]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAcceptQuote}
                disabled={accepting}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-extrabold text-[13px] shadow-sm disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {accepting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Confirm Acceptance
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── WhatsApp Share Modal ── */}
      <WhatsAppShareModal
        isOpen={shareModalOpen}
        quotation={quote}
        onClose={() => setShareModalOpen(false)}
      />

      {/* ── Email Share Modal ── */}
      <EmailShareModal
        isOpen={emailModalOpen}
        quotation={quote}
        onClose={() => setEmailModalOpen(false)}
      />
    </div>
  );
}
