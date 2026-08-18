"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Pencil, MessageSquare, Copy, Check, ExternalLink,
  Printer, Trash2, Calendar, Users, MapPin, Moon, Sun, Car,
  ShieldCheck, Loader2, AlertCircle, Heart, Mountain, Palmtree,
  Castle, Crown, Compass, Sparkles, CheckCircle2, Trees, Flame,
} from "lucide-react";
import WhatsAppShareModal from "@/components/quotations/WhatsAppShareModal";
import EmailShareModal from "@/components/quotations/EmailShareModal";
import { Mail } from "lucide-react";

const MEAL_EMOJI = { breakfast: "🌅", lunch: "☀️", dinner: "🌙" };
const MEAL_PLAN_LABELS = {
  EP: "Room Only (EP)",
  CP: "Bed & Breakfast (CP)",
  MAP: "Breakfast + Dinner (MAP)",
  AP: "All Meals Included (AP)",
  "": "Standard Meal Plan",
};

const THEMES = {
  honeymoon: {
    id: "honeymoon",
    label: "Honeymoon & Romance",
    icon: Heart,
    bgImage: "/themes/honeymoon.jpg",
    badge: "bg-rose-50 text-rose-700 border-rose-200",
    tagline: "Romantic Escapes, Candlelight Dinners & Sunset Stays 💕",
  },
  mountain: {
    id: "mountain",
    label: "Mountain & Hills",
    icon: Mountain,
    bgImage: "/themes/mountain.jpg",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    tagline: "Misty Peaks, Pine Valleys & Fresh Alpine Escapes 🏔️",
  },
  beach: {
    id: "beach",
    label: "Beach & Coastal",
    icon: Palmtree,
    bgImage: "/themes/beach.jpg",
    badge: "bg-cyan-50 text-cyan-700 border-cyan-200",
    tagline: "Golden Sands, Turquoise Waves & Houseboat Cruises 🏖️",
  },
  heritage: {
    id: "heritage",
    label: "Heritage & Forts",
    icon: Castle,
    bgImage: "/themes/heritage.jpg",
    badge: "bg-purple-50 text-purple-700 border-purple-200",
    tagline: "Historic Architecture, Palaces & Imperial Haveli Stays 🏰",
  },
  safari: {
    id: "safari",
    label: "Nature & Safari",
    icon: Trees,
    bgImage: "/themes/safari.jpg",
    badge: "bg-amber-50 text-amber-800 border-amber-200",
    tagline: "Wildlife Sanctuaries, Lush Tea Gardens & Jungle Resorts 🌴",
  },
  adventure: {
    id: "adventure",
    label: "Adventure & Road Trip",
    icon: Flame,
    bgImage: "/themes/adventure.jpg",
    badge: "bg-orange-50 text-orange-700 border-orange-200",
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

export default function QuotationDashboardDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTierIdx, setActiveTierIdx] = useState(0);
  const [selectedThemeId, setSelectedThemeId] = useState("beach");
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/quotations/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setQuote(data.quotation);
        setActiveTierIdx(data.quotation.selectedOptionIndex || 0);
        setSelectedThemeId(detectTheme(data.quotation.tripDetails?.title, data.quotation.tripDetails?.destination));
      })
      .catch((err) => setError(err.message || "Failed to load quotation"))
      .finally(() => setLoading(false));
  }, [id]);

  function handleCopyClientLink() {
    if (!quote) return;
    const url = `${window.location.origin}/quote/${quote.quotationCode}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  }

  function handlePrint() {
    window.print();
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error || !quote) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8fafc] p-6 text-center">
        <AlertCircle className="w-12 h-12 text-rose-500 mb-2" />
        <h2 className="text-[18px] font-black text-slate-900">{error || "Quotation Not Found"}</h2>
        <Link href="/dashboard/quotations" className="text-[13px] font-bold text-indigo-600 hover:underline mt-2">
          ← Back to Quotations List
        </Link>
      </div>
    );
  }

  const {
    quotationCode,
    client,
    tripDetails,
    passengers,
    itinerary = [],
    accommodationOptions = [],
    vehicle,
    pricing,
    inclusions = [],
    exclusions = [],
    instructions = [],
    status,
  } = quote;

  const activeTheme = THEMES[selectedThemeId] || THEMES.beach;
  const currentTier = accommodationOptions[activeTierIdx] || accommodationOptions[0];

  const startDateStr = tripDetails?.startDate
    ? new Date(tripDetails.startDate).toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric", year: "numeric" })
    : "—";
  const endDateStr = tripDetails?.endDate
    ? new Date(tripDetails.endDate).toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric", year: "numeric" })
    : "—";

  return (
    <div className="min-h-screen bg-[#f1f5f9] text-slate-900 font-sans pb-28">
      {/* ── Top Multi-Color Accent Ribbon ── */}
      <div className="h-1.5 w-full bg-gradient-to-r from-rose-500 via-amber-500 via-emerald-500 to-cyan-500 no-print" />

      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-6 py-3 shadow-xs no-print">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/quotations"
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center gap-1 text-[12.5px] font-bold"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </Link>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="Mandate Holidays Logo"
              className="h-9 w-auto object-contain hidden sm:block"
            />
            <div className="h-5 w-px bg-slate-200 hidden sm:block" />
            <div className="hidden sm:block">
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                REF: {quotationCode}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShareModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-[12.5px] transition-colors"
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-600" /> WhatsApp
            </button>

            <button
              type="button"
              onClick={() => setEmailModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 font-bold text-[12.5px] transition-colors"
            >
              <Mail className="w-3.5 h-3.5 text-sky-600" /> Email
            </button>

            <button
              type="button"
              onClick={handleCopyClientLink}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 font-bold text-[12.5px] transition-colors"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? "Copied!" : "Copy Link"}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-[12.5px]"
            >
              <Printer className="w-3.5 h-3.5 text-indigo-600" /> Print PDF
            </button>

            <Link
              href={`/dashboard/quotations/${id}/edit`}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-[12.5px] transition-all shadow-xs"
            >
              <Pencil className="w-3.5 h-3.5" /> Edit Quote
            </Link>
          </div>
        </div>
      </header>

      {/* ── Panoramic Hero with Scenic Background Card ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 no-print">
        <div className="relative rounded-3xl overflow-hidden shadow-xl min-h-[360px] flex flex-col justify-end p-6 sm:p-10 text-white border border-slate-700">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={activeTheme.bgImage}
            alt={activeTheme.label}
            className="absolute inset-0 w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-slate-900/40" />

          <div className="relative z-10 space-y-3 max-w-4xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-[11px] font-black px-3 py-1 rounded-full bg-white/20 text-white backdrop-blur-md">
                {quotationCode}
              </span>
              <span className="px-3 py-1 rounded-full bg-black/40 text-[11px] font-bold text-slate-200 backdrop-blur-md">
                Client: <strong>{client?.name}</strong> ({client?.phone})
              </span>
              <span className={`px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider border backdrop-blur-md ${activeTheme.badge}`}>
                ✨ {activeTheme.label}
              </span>
            </div>

            <h1 className="text-[26px] sm:text-[36px] font-black text-white font-serif max-w-3xl drop-shadow-md">
              {tripDetails?.title || "Custom Proposal"}
            </h1>

            <div className="flex items-center gap-6 flex-wrap text-[13px] text-cyan-200 font-semibold pt-1">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-cyan-400" /> {startDateStr} – {endDateStr}
              </span>
              <span className="flex items-center gap-1.5">
                <Moon className="w-4 h-4 text-cyan-400" /> {tripDetails?.nights || 0}N / {tripDetails?.days || 0}D
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-cyan-400" /> {passengers?.adults || 2} Adults ({passengers?.totalRooms || 1} Room)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Proposal Body: Dual Column ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 space-y-8 no-print">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Commercial Widget (4 cols) */}
          <aside className="lg:col-span-4 space-y-6 lg:sticky lg:top-20">
            <div className="p-6 rounded-3xl bg-slate-900 text-white space-y-5 shadow-xl border border-indigo-500/30">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-cyan-300">Total Proposal Value</p>
                  {(pricing?.discountAmount || 0) > 0 && (
                    <span className="text-[10px] font-black bg-rose-500/20 text-rose-300 border border-rose-400/40 px-2.5 py-0.5 rounded-full animate-pulse">
                      Save ₹{pricing.discountAmount.toLocaleString("en-IN")}
                    </span>
                  )}
                </div>
                <div className="flex items-baseline gap-2.5 mt-1">
                  <p className="text-[34px] font-black text-emerald-400 font-serif leading-none">
                    ₹{(pricing?.finalPrice || 0).toLocaleString("en-IN")}
                  </p>
                  {(pricing?.discountAmount || 0) > 0 && (
                    <span className="text-[16px] font-bold text-slate-400 line-through">
                      ₹{((pricing.finalPrice || 0) + pricing.discountAmount).toLocaleString("en-IN")}
                    </span>
                  )}
                </div>
                <p className="text-[12px] text-slate-300 mt-1">
                  ₹{(pricing?.perCouplePrice || (pricing?.finalPrice || 0)).toLocaleString("en-IN")} / couple • ₹{(pricing?.perPersonPrice || 0).toLocaleString("en-IN")} / person
                </p>
              </div>

              <Link
                href={`/quote/${quotationCode}`}
                target="_blank"
                rel="noreferrer"
                className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[13px] transition-all shadow-sm flex items-center justify-center gap-2"
              >
                <ExternalLink className="w-4 h-4" /> Open Public View
              </Link>
            </div>
          </aside>

          {/* Right Column: Details (8 cols) */}
          <main className="lg:col-span-8 space-y-8">
            {/* Accommodation Tiers */}
            {accommodationOptions.length > 0 && (
              <section className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-5">
                <h2 className="text-[20px] font-black text-slate-900 font-serif">Hotel Accommodation Tiers</h2>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {accommodationOptions.map((opt, idx) => (
                    <div
                      key={idx}
                      onClick={() => setActiveTierIdx(idx)}
                      className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                        idx === activeTierIdx
                          ? "border-indigo-600 bg-indigo-50/50 shadow-xs"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[14px] font-black font-serif text-slate-900">{opt.label}</span>
                        {idx === activeTierIdx && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
                      </div>
                      <p className="text-[12px] text-slate-500 font-semibold">{(opt.nights || []).length} Nights Stay</p>
                    </div>
                  ))}
                </div>

                {currentTier && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                    {(currentTier.nights || []).map((n, i) => (
                      <div key={i} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-[13px] space-y-1">
                        <div className="flex justify-between font-bold text-slate-800">
                          <span>Night {n.night} — {n.cityName}</span>
                          {n.starRating && <span className="text-amber-500">{"★".repeat(n.starRating)}</span>}
                        </div>
                        <p className="font-black text-slate-900">{n.hotelName || "Hotel Pending"}</p>
                        <p className="text-[12px] text-slate-500">Room: {n.roomType} • Plan: {MEAL_PLAN_LABELS[n.mealPlan] || n.mealPlan}</p>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* Day-by-day itinerary */}
            <section className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-5">
              <h2 className="text-[20px] font-black text-slate-900 font-serif">Day-by-Day Itinerary</h2>
              <div className="space-y-3">
                {itinerary.map((day, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-black text-[12px] flex items-center justify-center flex-shrink-0">
                        D{day.day}
                      </span>
                      <h3 className="text-[15px] font-black text-slate-900 font-serif">{day.title}</h3>
                    </div>
                    {day.description && (
                      <div
                        className="text-[13px] text-slate-700 leading-relaxed itinerary-description pl-11"
                        dangerouslySetInnerHTML={{ __html: day.description }}
                      />
                    )}
                  </div>
                ))}
              </div>
            </section>
          </main>
        </div>
      </div>

      {/* WhatsApp Modal */}
      <WhatsAppShareModal
        isOpen={shareModalOpen}
        quotation={quote}
        onClose={() => setShareModalOpen(false)}
      />

      {/* Email Modal */}
      <EmailShareModal
        isOpen={emailModalOpen}
        quotation={quote}
        onClose={() => setEmailModalOpen(false)}
      />
    </div>
  );
}
