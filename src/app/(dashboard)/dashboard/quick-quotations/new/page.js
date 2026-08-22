"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Zap, ArrowLeft, Loader2, Sparkles, Plus, Trash2, IndianRupee,
  MapPin, Calendar, Users, Hotel, Car, Check, AlertCircle, Eye,
  Tag, ShieldCheck, Heart, Mountain, Compass, Waves, Trees,
  Baby, CheckCircle2, ChevronRight, FileText, Info, HelpCircle,
  Star, Clock, Building, Compass as CompassIcon, Shield, CheckCheck, Edit3,
} from "lucide-react";
import { getVehicleImage } from "@/components/packages/VehiclePanel";
import InstructionsEditorModal from "@/components/quick-quotations/InstructionsEditorModal";

const THEMES = [
  { id: "general", label: "General Tour", icon: Compass, color: "border-slate-300 text-slate-700 bg-slate-50" },
  { id: "honeymoon", label: "Honeymoon", icon: Heart, color: "border-rose-300 text-rose-700 bg-rose-50" },
  { id: "mountain", label: "Mountain Peaks", icon: Mountain, color: "border-emerald-300 text-emerald-700 bg-emerald-50" },
  { id: "beach", label: "Beach Coastal", icon: Waves, color: "border-sky-300 text-sky-700 bg-sky-50" },
  { id: "heritage", label: "Heritage Culture", icon: Sparkles, color: "border-amber-300 text-amber-700 bg-amber-50" },
  { id: "safari", label: "Safari & Jungle", icon: Trees, color: "border-lime-300 text-lime-700 bg-lime-50" },
  { id: "adventure", label: "Adventure Thrill", icon: Zap, color: "border-orange-300 text-orange-700 bg-orange-50" },
];

const VEHICLE_OPTIONS = [
  { type: "Sedan", model: "Dzire / Etios", seats: 4 },
  { type: "SUV", model: "Innova / Ertiga", seats: 6 },
  { type: "MUV", model: "Innova Crysta", seats: 7 },
  { type: "Tempo Traveller", model: "12 / 17 Seater AC", seats: 12 },
  { type: "Mini Bus", model: "21 Seater Luxury AC", seats: 21 },
  { type: "Bus", model: "35 / 45 Seater AC Coach", seats: 35 },
];

const ROOM_TYPE_PRESETS = [
  "Deluxe AC Room",
  "Super Deluxe AC",
  "Premium Valley View Room",
  "Executive Suite",
  "Luxury Pool Villa",
  "Standard Room",
];

const DEFAULT_INSTRUCTIONS = [
  "Hotel check-in is typically at 12:00 PM and check-out is at 10:00 AM.",
  "Valid Government Photo ID (Aadhaar / Passport / Driving License) is mandatory for all adult guests at hotel check-in.",
  "Driver contact details and vehicle registration number will be dispatched on WhatsApp 24 hours prior to departure.",
  "AC in vehicles will be switched off while driving in hilly terrains or when stationary.",
  "Early check-in or late check-out is strictly subject to hotel availability and policies.",
];

function getTomorrowDate() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
}

function getFutureDate(daysAhead) {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().split("T")[0];
}

export default function NewQuickQuotationPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showAgentGuide, setShowAgentGuide] = useState(true);
  const [instructionsModalOpen, setInstructionsModalOpen] = useState(false);

  const [form, setForm] = useState({
    client: {
      name: "",
      phone: "",
      email: "",
      clientType: "b2c",
      notes: "",
    },
    tripDetails: {
      title: "",
      destination: "",
      theme: "general",
      startDate: getTomorrowDate(),
      endDate: getFutureDate(4),
      nights: 4,
      days: 5,
    },
    passengers: {
      adults: 2,
      childrenCount: 0,
      childrenAges: [],
      infants: 0,
      totalRooms: 1,
    },
    hotelStays: [
      {
        nightNumber: 1,
        cityName: "",
        hotelName: "",
        starRating: 3,
        roomType: "Deluxe AC Room",
        mealPlan: "CP",
        notes: "",
      },
    ],
    vehicle: {
      vehicleType: "Sedan",
      model: "Dzire / Etios",
      seats: 4,
      acType: "AC",
      notes: "Includes fuel, toll taxes, parking & driver allowance",
    },
    specialInstructions: DEFAULT_INSTRUCTIONS,
    inclusions: [
      "Accommodation on CP (Daily Breakfast) basis",
      "Private AC vehicle for all transfers and sightseeing",
      "All fuel charges, toll taxes, parking fees & driver allowances",
      "Assistance upon arrival and departure",
      "24x7 On-trip operations support",
    ],
    exclusions: [
      "Airfare / Train tickets",
      "Entry fees to monuments, parks and activity tickets",
      "Personal expenses like laundry, minibar, phone calls",
      "Optional water sports / adventure activities",
      "GST 5% (unless explicitly specified)",
    ],
    pricing: {
      totalPrice: 0,
      discountAmount: 0,
      discountReason: "",
      advancePercentage: 25,
    },
    internalNotes: "",
  });

  // Direct Date calculation helper
  function handleDateChange(start, end) {
    const s = new Date(start);
    const e = new Date(end);
    let diffDays = Math.round((e - s) / (1000 * 60 * 60 * 24));
    if (isNaN(diffDays) || diffDays < 1) diffDays = 1;

    setForm((prev) => {
      let updatedStays = [...prev.hotelStays];
      if (updatedStays.length < diffDays) {
        for (let i = updatedStays.length; i < diffDays; i++) {
          const lastCity = updatedStays[updatedStays.length - 1]?.cityName || prev.tripDetails.destination;
          updatedStays.push({
            nightNumber: i + 1,
            cityName: lastCity,
            hotelName: "",
            starRating: 3,
            roomType: "Deluxe AC Room",
            mealPlan: "CP",
            notes: "",
          });
        }
      }
      return {
        ...prev,
        tripDetails: {
          ...prev.tripDetails,
          startDate: start,
          endDate: end,
          nights: diffDays,
          days: diffDays + 1,
        },
        hotelStays: updatedStays,
      };
    });
  }

  function applyDurationPreset(nights) {
    const s = form.tripDetails.startDate || getTomorrowDate();
    const d = new Date(s);
    d.setDate(d.getDate() + nights);
    const end = d.toISOString().split("T")[0];
    handleDateChange(s, end);
  }

  // Children count and individual ages handler
  function handleChildrenCountChange(count) {
    const validCount = Math.max(0, parseInt(count, 10) || 0);
    setForm((prev) => {
      const currentAges = [...(prev.passengers.childrenAges || [])];
      let updatedAges = [];
      for (let i = 0; i < validCount; i++) {
        updatedAges.push(currentAges[i] !== undefined ? currentAges[i] : 6);
      }
      return {
        ...prev,
        passengers: {
          ...prev.passengers,
          childrenCount: validCount,
          childrenAges: updatedAges,
        },
      };
    });
  }

  function handleChildAgeChange(index, age) {
    const validAge = Math.max(1, Math.min(17, parseInt(age, 10) || 1));
    setForm((prev) => {
      const updated = [...prev.passengers.childrenAges];
      updated[index] = validAge;
      return {
        ...prev,
        passengers: {
          ...prev.passengers,
          childrenAges: updated,
        },
      };
    });
  }

  // Pricing calculations
  const totalPrice = Number(form.pricing.totalPrice) || 0;
  const discountAmt = Math.max(0, Number(form.pricing.discountAmount) || 0);
  const finalPrice = Math.max(0, totalPrice - discountAmt);
  const numPax = Math.max(1, form.passengers.adults || 2);
  const perPersonPrice = Math.round(finalPrice / numPax);
  const perCouplePrice = finalPrice;
  const advanceToken = Math.round((finalPrice * (form.pricing.advancePercentage || 25)) / 100);

  function handleDestinationChange(val) {
    setForm((prev) => {
      const clientPart = prev.client.name.trim() ? ` for ${prev.client.name.trim()}` : "";
      const newTitle = prev.tripDetails.title && !prev.tripDetails.title.includes("Holiday")
        ? prev.tripDetails.title
        : `${prev.tripDetails.nights}N/${prev.tripDetails.days}D ${val || "Custom"} Holiday${clientPart}`;

      return {
        ...prev,
        tripDetails: {
          ...prev.tripDetails,
          destination: val,
          title: newTitle,
        },
      };
    });
  }

  function addStay() {
    setForm((prev) => {
      const nextNight = prev.hotelStays.length + 1;
      const lastCity = prev.hotelStays[prev.hotelStays.length - 1]?.cityName || prev.tripDetails.destination;
      return {
        ...prev,
        hotelStays: [
          ...prev.hotelStays,
          {
            nightNumber: nextNight,
            cityName: lastCity,
            hotelName: "",
            starRating: 3,
            roomType: "Deluxe AC Room",
            mealPlan: "CP",
            notes: "",
          },
        ],
      };
    });
  }

  function removeStay(idx) {
    setForm((prev) => {
      const updated = prev.hotelStays.filter((_, i) => i !== idx).map((s, ni) => ({
        ...s,
        nightNumber: ni + 1,
      }));
      return {
        ...prev,
        hotelStays: updated,
      };
    });
  }

  function addInstruction(text) {
    if (!text || !text.trim()) return;
    setForm((prev) => ({
      ...prev,
      specialInstructions: [...(prev.specialInstructions || []), text.trim()],
    }));
  }

  function removeInstruction(idx) {
    setForm((prev) => ({
      ...prev,
      specialInstructions: (prev.specialInstructions || []).filter((_, i) => i !== idx),
    }));
  }

  async function handleSubmit(status = "draft") {
    setError("");
    if (!form.client.name.trim()) {
      setError("Please enter the client full name");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (!form.client.phone.trim()) {
      setError("Please enter the client WhatsApp / phone number");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (!form.tripDetails.destination.trim()) {
      setError("Please enter the primary destination");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (totalPrice <= 0) {
      setError("Please enter the Total Package Price");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        pricing: {
          ...form.pricing,
          totalPrice,
          finalPrice,
          perPersonPrice,
          perCouplePrice,
        },
        status,
      };

      const res = await fetch("/api/quick-quotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save quick quotation");

      router.push("/dashboard/quick-quotations");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans pb-28">
      {/* ── Top Header ── */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200/80 px-6 py-4 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/quick-quotations"
            className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center gap-2 text-[13px] font-bold"
          >
            <ArrowLeft className="w-4 h-4" /> Quick Quotes
          </Link>
          <div className="h-6 w-px bg-slate-200 hidden sm:block" />
          <div className="hidden sm:block">
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 flex items-center gap-1 w-fit">
              <Zap className="w-3 h-3 text-amber-500" /> Fast 1-Minute Quote Studio
            </span>
            <h1 className="text-[15px] font-black text-slate-900 leading-snug mt-0.5 truncate max-w-sm">
              {form.tripDetails.title || "New Quick Quotation"}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => handleSubmit("draft")}
            disabled={saving}
            className="px-4 py-2.5 rounded-2xl border border-slate-300 text-[13px] font-bold text-slate-700 bg-white hover:bg-slate-50 transition-all disabled:opacity-50"
          >
            Save Draft
          </button>

          <button
            type="button"
            onClick={() => handleSubmit("sent")}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-white text-[13px] font-black shadow-md shadow-amber-500/25 transition-all disabled:opacity-50 hover:scale-[1.02] active:scale-[0.99]"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            <Zap className="w-4 h-4" />
            <span>Generate &amp; Send Proposal</span>
          </button>
        </div>
      </header>

      {/* ── Main Form Container ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6">
        {/* ── Agent Quick Instructions Guide ── */}
        <div className="mb-6 rounded-3xl bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white p-5 sm:p-6 shadow-md border border-indigo-800/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-[15px] font-black tracking-wide">60-Second Quick Quoting Workflow Instructions</h2>
                <p className="text-[11.5px] text-indigo-200">How to generate high-converting proposals on phone calls or WhatsApp inquiries</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowAgentGuide(!showAgentGuide)}
              className="text-[11px] font-bold text-indigo-300 hover:text-white underline"
            >
              {showAgentGuide ? "Hide Guide" : "Show Guide"}
            </button>
          </div>

          {showAgentGuide && (
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-white/10 text-[11.5px]">
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                <span className="font-mono text-[10px] font-black text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded">STEP 1</span>
                <p className="font-bold text-white">Client &amp; Destination</p>
                <p className="text-slate-300">Enter client WhatsApp number, name, and travel destination.</p>
              </div>

              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                <span className="font-mono text-[10px] font-black text-sky-400 bg-sky-400/10 px-1.5 py-0.5 rounded">STEP 2</span>
                <p className="font-bold text-white">Dates &amp; Child Ages</p>
                <p className="text-slate-300">Pick departure &amp; return date. If children traveling, enter their exact ages.</p>
              </div>

              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                <span className="font-mono text-[10px] font-black text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded">STEP 3</span>
                <p className="font-bold text-white">Hotel Stays &amp; Meal Plans</p>
                <p className="text-slate-300">Select city, hotel name, star rating, room category &amp; CP/MAP meal plans.</p>
              </div>

              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                <span className="font-mono text-[10px] font-black text-rose-400 bg-rose-400/10 px-1.5 py-0.5 rounded">STEP 4</span>
                <p className="font-bold text-white">Direct Price &amp; WhatsApp</p>
                <p className="text-slate-300">Enter Total Price and Discount. Click Send to launch 1-click WhatsApp message.</p>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="flex items-center gap-2.5 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-[13.5px] mb-6">
            <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Form (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* 1. Client & Contact Information */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-black text-[12px]">
                  1
                </div>
                <h3 className="text-[16px] font-black text-slate-900">Client &amp; Contact Details</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-bold text-slate-600 mb-1.5">Client Full Name *</label>
                  <input
                    type="text"
                    value={form.client.name}
                    onChange={(e) => setForm((p) => ({ ...p, client: { ...p.client, name: e.target.value } }))}
                    placeholder="e.g. Rajesh Sharma"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-[13.5px] font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-bold text-slate-600 mb-1.5">WhatsApp / Phone Number *</label>
                  <input
                    type="text"
                    value={form.client.phone}
                    onChange={(e) => setForm((p) => ({ ...p, client: { ...p.client, phone: e.target.value } }))}
                    placeholder="e.g. +91 98765 43210"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-[13.5px] font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-bold text-slate-600 mb-1.5">Email Address</label>
                  <input
                    type="email"
                    value={form.client.email}
                    onChange={(e) => setForm((p) => ({ ...p, client: { ...p.client, email: e.target.value } }))}
                    placeholder="client@example.com"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-[13.5px] font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-bold text-slate-600 mb-1.5">Client Type</label>
                  <select
                    value={form.client.clientType}
                    onChange={(e) => setForm((p) => ({ ...p, client: { ...p.client, clientType: e.target.value } }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-[13.5px] font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  >
                    <option value="b2c">B2C (Direct Traveler)</option>
                    <option value="b2b">B2B (Travel Agent)</option>
                    <option value="corporate">Corporate / Group</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 2. Destination & Direct Travel Dates */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs space-y-5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-black text-[12px]">
                  2
                </div>
                <h3 className="text-[16px] font-black text-slate-900">Destination &amp; Travel Dates</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-bold text-slate-600 mb-1.5">Primary Destination *</label>
                  <input
                    type="text"
                    value={form.tripDetails.destination}
                    onChange={(e) => handleDestinationChange(e.target.value)}
                    placeholder="e.g. Kerala, Kashmir, Goa, Himachal"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-[13.5px] font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-bold text-slate-600 mb-1.5">Quotation Title</label>
                  <input
                    type="text"
                    value={form.tripDetails.title}
                    onChange={(e) => setForm((p) => ({ ...p, tripDetails: { ...p.tripDetails, title: e.target.value } }))}
                    placeholder="e.g. 5D/4N Kerala Luxury Escape"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-[13.5px] font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Theme selector */}
              <div>
                <label className="block text-[12px] font-bold text-slate-600 mb-1.5">Travel Theme / Style</label>
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {THEMES.map((th) => {
                    const Icon = th.icon;
                    const isSel = form.tripDetails.theme === th.id;
                    return (
                      <button
                        key={th.id}
                        type="button"
                        onClick={() => setForm((p) => ({ ...p, tripDetails: { ...p.tripDetails, theme: th.id } }))}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[12px] font-bold whitespace-nowrap transition-all ${
                          isSel ? "border-amber-500 bg-amber-50 text-amber-900 ring-2 ring-amber-500/20 font-black shadow-2xs" : th.color
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{th.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Direct Travel Dates */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-amber-600" /> Travel Duration &amp; Dates
                  </span>
                  <div className="flex items-center gap-1">
                    {[
                      { label: "3N/4D", n: 3 },
                      { label: "4N/5D", n: 4 },
                      { label: "5N/6D", n: 5 },
                      { label: "6N/7D", n: 6 },
                      { label: "7N/8D", n: 7 },
                    ].map((ps) => (
                      <button
                        key={ps.n}
                        type="button"
                        onClick={() => applyDurationPreset(ps.n)}
                        className={`px-2 py-0.5 rounded-lg text-[11px] font-extrabold border transition-all ${
                          form.tripDetails.nights === ps.n
                            ? "bg-amber-500 text-white border-amber-600 shadow-xs"
                            : "bg-white text-slate-600 hover:bg-slate-100 border-slate-200"
                        }`}
                      >
                        {ps.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Departure Date</label>
                    <input
                      type="date"
                      value={form.tripDetails.startDate}
                      onChange={(e) => handleDateChange(e.target.value, form.tripDetails.endDate)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-bold text-[13px] text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Return Date</label>
                    <input
                      type="date"
                      value={form.tripDetails.endDate}
                      min={form.tripDetails.startDate}
                      onChange={(e) => handleDateChange(form.tripDetails.startDate, e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-bold text-[13px] text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Calculated Duration</label>
                    <div className="w-full px-3 py-2 rounded-xl border border-amber-200 bg-amber-50/70 font-black text-[13px] text-amber-900 text-center flex items-center justify-center gap-1">
                      <span>{form.tripDetails.nights} Nights</span>
                      <span>/</span>
                      <span>{form.tripDetails.days} Days</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Passenger Details & Children with Individual Ages */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-indigo-600" /> Travelers &amp; Rooms
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Adults (12+ yrs)</label>
                    <input
                      type="number"
                      min="1"
                      value={form.passengers.adults}
                      onChange={(e) => setForm((p) => ({ ...p, passengers: { ...p.passengers, adults: parseInt(e.target.value, 10) || 1 } }))}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-center font-bold text-[13px]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Children (Below 12)</label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={form.passengers.childrenCount}
                      onChange={(e) => handleChildrenCountChange(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-center font-bold text-[13px]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Infants (0-2 yrs)</label>
                    <input
                      type="number"
                      min="0"
                      value={form.passengers.infants}
                      onChange={(e) => setForm((p) => ({ ...p, passengers: { ...p.passengers, infants: parseInt(e.target.value, 10) || 0 } }))}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-center font-bold text-[13px]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Total Rooms</label>
                    <input
                      type="number"
                      min="1"
                      value={form.passengers.totalRooms}
                      onChange={(e) => setForm((p) => ({ ...p, passengers: { ...p.passengers, totalRooms: parseInt(e.target.value, 10) || 1 } }))}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-center font-bold text-[13px]"
                    />
                  </div>
                </div>

                {/* Dynamic Individual Child Ages */}
                {form.passengers.childrenCount > 0 && (
                  <div className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-200 space-y-2">
                    <div className="flex items-center gap-1.5 text-indigo-900 font-bold text-[11.5px]">
                      <Baby className="w-4 h-4 text-indigo-600" />
                      <span>Specify Individual Child Ages ({form.passengers.childrenCount} {form.passengers.childrenCount === 1 ? "Child" : "Children"}):</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {form.passengers.childrenAges.map((age, idx) => (
                        <div key={idx} className="bg-white p-2 rounded-lg border border-indigo-200 flex items-center justify-between">
                          <span className="text-[11px] font-bold text-slate-600">Child {idx + 1}:</span>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min="1"
                              max="17"
                              value={age}
                              onChange={(e) => handleChildAgeChange(idx, e.target.value)}
                              className="w-12 px-1.5 py-0.5 rounded border border-slate-200 text-center font-black text-[12px] text-indigo-900"
                            />
                            <span className="text-[10.5px] text-slate-400 font-semibold">yrs</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ── 3. Redesigned Hotel Accommodation Portfolio ── */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center font-black shadow-xs">
                    <Building className="w-4 h-4 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="text-[16px] font-black text-slate-900">Hotel Accommodation Portfolio</h3>
                    <p className="text-[11.5px] text-slate-400 font-medium">Night-by-night luxury &amp; standard stay options with meal plans</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={addStay}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 font-black text-[12px] transition-colors border border-amber-200 shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Night
                </button>
              </div>

              {/* Modern Stay Cards */}
              <div className="space-y-4">
                {form.hotelStays.map((stay, idx) => (
                  <div
                    key={idx}
                    className="p-5 rounded-3xl bg-gradient-to-br from-slate-50 to-white border-2 border-slate-200/90 hover:border-amber-400/80 transition-all shadow-xs space-y-4"
                  >
                    {/* Stay Card Header: Night Pill, City & Remove Button */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="px-3 py-1 rounded-xl bg-slate-900 text-amber-400 font-mono font-black text-[12px] shadow-xs">
                          NIGHT {stay.nightNumber}
                        </div>
                        <span className="text-[12px] font-bold text-slate-400">Stay Leg {idx + 1} of {form.hotelStays.length}</span>
                      </div>

                      {form.hotelStays.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeStay(idx)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-rose-600 hover:bg-rose-50 text-[11px] font-bold transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Remove
                        </button>
                      )}
                    </div>

                    {/* City & Hotel Name & Star Rating Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                      <div className="sm:col-span-4">
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Destination / City</label>
                        <div className="relative">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            value={stay.cityName}
                            onChange={(e) => {
                              const val = e.target.value;
                              setForm((p) => {
                                const st = [...p.hotelStays];
                                st[idx].cityName = val;
                                return { ...p, hotelStays: st };
                              });
                            }}
                            placeholder="e.g. Munnar"
                            className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 bg-white font-bold text-[13px] text-slate-800 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                          />
                        </div>
                      </div>

                      <div className="sm:col-span-5">
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Hotel Name / Resort</label>
                        <div className="relative">
                          <Hotel className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            value={stay.hotelName}
                            onChange={(e) => {
                              const val = e.target.value;
                              setForm((p) => {
                                const st = [...p.hotelStays];
                                st[idx].hotelName = val;
                                return { ...p, hotelStays: st };
                              });
                            }}
                            placeholder="e.g. Tea County Resort"
                            className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 bg-white font-bold text-[13px] text-slate-800 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                          />
                        </div>
                      </div>

                      {/* Interactive Star Rating */}
                      <div className="sm:col-span-3">
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Star Category</label>
                        <div className="flex items-center gap-1 bg-white p-2 rounded-xl border border-slate-200">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => {
                                setForm((p) => {
                                  const st = [...p.hotelStays];
                                  st[idx].starRating = star;
                                  return { ...p, hotelStays: st };
                                });
                              }}
                              className="focus:outline-none transition-transform hover:scale-110"
                            >
                              <Star
                                className={`w-4 h-4 ${
                                  star <= (stay.starRating || 3)
                                    ? "fill-amber-400 text-amber-400"
                                    : "text-slate-200"
                                }`}
                              />
                            </button>
                          ))}
                          <span className="text-[11px] font-black text-slate-600 ml-1">{stay.starRating || 3}★</span>
                        </div>
                      </div>
                    </div>

                    {/* Meal Plan Pills & Room Category Presets */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2 border-t border-slate-200/60 items-center">
                      <div className="sm:col-span-6 space-y-1.5">
                        <label className="block text-[11px] font-bold text-slate-600">Meal Plan Inclusions</label>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {[
                            { id: "CP", label: "CP", sub: "Breakfast" },
                            { id: "MAP", label: "MAP", sub: "Bfast + Dinner" },
                            { id: "AP", label: "AP", sub: "All Meals" },
                            { id: "EP", label: "EP", sub: "Room Only" },
                          ].map((mp) => {
                            const isSel = stay.mealPlan === mp.id;
                            return (
                              <button
                                key={mp.id}
                                type="button"
                                onClick={() => {
                                  setForm((p) => {
                                    const st = [...p.hotelStays];
                                    st[idx].mealPlan = mp.id;
                                    return { ...p, hotelStays: st };
                                  });
                                }}
                                className={`px-3 py-1 rounded-xl text-[11.5px] font-black transition-all border ${
                                  isSel
                                    ? "bg-amber-500 text-white border-amber-600 shadow-2xs"
                                    : "bg-white text-slate-600 hover:bg-slate-100 border-slate-200"
                                }`}
                              >
                                {mp.label} <span className="text-[9.5px] font-normal opacity-85">({mp.sub})</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="sm:col-span-6 space-y-1.5">
                        <label className="block text-[11px] font-bold text-slate-600">Room Category</label>
                        <input
                          type="text"
                          value={stay.roomType}
                          onChange={(e) => {
                            const val = e.target.value;
                            setForm((p) => {
                              const st = [...p.hotelStays];
                              st[idx].roomType = val;
                              return { ...p, hotelStays: st };
                            });
                          }}
                          placeholder="e.g. Deluxe AC Room"
                          className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-[12.5px] font-bold text-slate-800"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 4. Dedicated Transport */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-black text-[12px]">
                  4
                </div>
                <div>
                  <h3 className="text-[16px] font-black text-slate-900">Dedicated Transport &amp; Vehicle</h3>
                  <p className="text-[11.5px] text-slate-400 font-medium">Dedicated vehicle for airport pickup, drop and all sightseeing</p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {VEHICLE_OPTIONS.map((v) => {
                  const isSel = form.vehicle.vehicleType === v.type;
                  const imgPath = getVehicleImage(v.type);
                  return (
                    <div
                      key={v.type}
                      onClick={() => setForm((p) => ({
                        ...p,
                        vehicle: {
                          ...p.vehicle,
                          vehicleType: v.type,
                          model: v.model,
                          seats: v.seats,
                        },
                      }))}
                      className={`p-3 rounded-2xl border-2 transition-all cursor-pointer flex flex-col items-center text-center space-y-2 ${
                        isSel ? "border-amber-500 bg-amber-50/50 shadow-xs ring-2 ring-amber-500/20" : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    >
                      <div className="h-14 w-full flex items-center justify-center">
                        <img src={imgPath} alt={v.type} className="max-h-12 max-w-full object-contain" />
                      </div>
                      <div>
                        <p className="text-[12.5px] font-black text-slate-900">{v.type}</p>
                        <p className="text-[10.5px] text-slate-500 font-semibold">{v.model}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-[12px] font-bold text-slate-600 mb-1">Vehicle Description / Model</label>
                  <input
                    type="text"
                    value={form.vehicle.model}
                    onChange={(e) => setForm((p) => ({ ...p, vehicle: { ...p.vehicle, model: e.target.value } }))}
                    placeholder="e.g. Swift Dzire AC"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-[13px] font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-bold text-slate-600 mb-1">AC Type</label>
                  <select
                    value={form.vehicle.acType}
                    onChange={(e) => setForm((p) => ({ ...p, vehicle: { ...p.vehicle, acType: e.target.value } }))}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-[13px] font-semibold"
                  >
                    <option value="AC">AC (Air Conditioned)</option>
                    <option value="Non-AC">Non-AC</option>
                  </select>
                </div>
              </div>
            </div>

            {/* ── 5. Luxury Redesigned Trip Instructions & Policies Card ── */}
            <div className="bg-white rounded-3xl border-2 border-slate-200/90 hover:border-amber-400/60 p-6 sm:p-7 shadow-xs transition-all space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 text-slate-950 flex items-center justify-center font-black shadow-md shadow-amber-500/20">
                    <ShieldCheck className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-[16px] font-black text-slate-900">Trip Instructions &amp; Policies</h3>
                      <span className="text-[10px] font-black text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                        {form.specialInstructions?.length || 0} Block(s) Active
                      </span>
                    </div>
                    <p className="text-[11.5px] text-slate-400 font-medium">Hotel policies, ID verification, chauffeur dispatch &amp; payment milestones</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setInstructionsModalOpen(true)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-slate-950 to-indigo-950 hover:from-slate-900 hover:to-indigo-900 text-white font-black text-[12.5px] shadow-sm transition-all hover:scale-105 active:scale-95 self-start sm:self-auto border border-indigo-900/50"
                >
                  <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Open Policy Studio &amp; Editor</span>
                </button>
              </div>

              {/* Redesigned Active Instructions Surface */}
              <div className="space-y-3">
                {(form.specialInstructions || []).map((inst, i) => {
                  const isHtml = typeof inst === "string" && (inst.includes("<p>") || inst.includes("<ul>") || inst.includes("<ol>") || inst.includes("<li>") || inst.includes("<div"));
                  return (
                    <div
                      key={i}
                      className="group relative bg-gradient-to-br from-slate-50 via-white to-amber-50/20 p-5 rounded-2xl border border-slate-200/90 hover:border-amber-300 transition-all shadow-2xs space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-900 font-mono font-black text-[11px] flex items-center justify-center">
                            {i + 1}
                          </span>
                          <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                            Policy Section {i + 1}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setInstructionsModalOpen(true)}
                            className="text-[11px] font-bold text-slate-500 hover:text-indigo-600 px-2 py-1 rounded-lg hover:bg-indigo-50 transition-colors"
                          >
                            Edit in Studio
                          </button>
                          <button
                            type="button"
                            onClick={() => removeInstruction(i)}
                            className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition-colors"
                            title="Remove Note"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="text-[13px] text-slate-800 leading-relaxed font-medium pl-1">
                        {isHtml ? (
                          <div
                            className="prose prose-sm max-w-none text-slate-800 leading-relaxed font-medium [&>ul]:list-disc [&>ul]:pl-5 [&>ol]:list-decimal [&>ol]:pl-5 [&>ul>li>ul]:list-circle [&>ul>li>ul]:pl-5 [&>p]:mb-1.5 [&>ul]:mb-1.5 [&>ol]:mb-1.5 [&>p>strong]:text-slate-950"
                            dangerouslySetInnerHTML={{ __html: inst }}
                          />
                        ) : (
                          <div className="whitespace-pre-wrap leading-relaxed">{inst}</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bottom Quick-Action Trigger */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setInstructionsModalOpen(true)}
                  className="w-full py-3 rounded-2xl border-2 border-dashed border-slate-200 hover:border-amber-400 hover:bg-amber-50/40 text-slate-600 hover:text-amber-900 font-bold text-[12.5px] transition-all flex items-center justify-center gap-2 group"
                >
                  <Sparkles className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />
                  <span>Exact Paste from Word / WhatsApp or Insert Presets in Policy Studio</span>
                </button>
              </div>
            </div>

            {/* ── 6. Redesigned Review of Package Summary Card ── */}
            <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 border border-slate-800 relative overflow-hidden">
              {/* Decorative Glow */}
              <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/15 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-lg">
                    <CheckCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-[18px] font-black text-white">Executive Proposal Review Brief</h3>
                    <p className="text-[12px] text-amber-300 font-semibold">Instant snapshot of client itinerary parameters &amp; pricing</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-white/10 text-slate-300 text-[11px] font-black uppercase tracking-wider border border-white/15">
                    {form.tripDetails.nights}N / {form.tripDetails.days}D Tour
                  </span>
                </div>
              </div>

              {/* 4-Box Key Highlights Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 relative z-10 text-[12.5px]">
                {/* 1. Client Card */}
                <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">Client / Party</span>
                  <p className="font-black text-white text-[14px] truncate">{form.client.name || "Client Name"}</p>
                  <p className="text-slate-300 font-mono text-[11px]">{form.client.phone || "No Phone Entered"}</p>
                </div>

                {/* 2. Destination & Dates Card */}
                <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-sky-400">Destination</span>
                  <p className="font-black text-white text-[14px] truncate">{form.tripDetails.destination || "Destination"}</p>
                  <p className="text-slate-300 text-[11px]">{form.tripDetails.startDate} to {form.tripDetails.endDate}</p>
                </div>

                {/* 3. Passengers & Children Ages Card */}
                <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Travelers</span>
                  <p className="font-black text-white text-[14px]">
                    {form.passengers.adults} Adults
                    {form.passengers.childrenCount > 0 ? `, ${form.passengers.childrenCount} Child` : ""}
                  </p>
                  <p className="text-slate-300 text-[11px]">
                    {form.passengers.childrenCount > 0
                      ? `Ages: ${form.passengers.childrenAges.join(", ")} yrs • ${form.passengers.totalRooms} Room`
                      : `${form.passengers.totalRooms} Room(s)`}
                  </p>
                </div>

                {/* 4. Transport Card */}
                <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-purple-400">Private Cab</span>
                  <p className="font-black text-white text-[14px] truncate">{form.vehicle.vehicleType}</p>
                  <p className="text-slate-300 text-[11px] truncate">{form.vehicle.model || "Dzire / Etios"}</p>
                </div>
              </div>

              {/* Night-by-Night Accommodation Timeline Review */}
              <div className="pt-2 border-t border-white/10 space-y-2 relative z-10">
                <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Accommodation Itinerary ({form.hotelStays.length} Stays):</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {form.hotelStays.map((s, i) => (
                    <div key={i} className="flex items-center justify-between bg-white/5 px-3.5 py-2 rounded-xl border border-white/5 text-[12px]">
                      <div className="flex items-center gap-2 truncate">
                        <span className="w-5 h-5 rounded-md bg-amber-500/20 text-amber-300 font-mono font-black text-[10px] flex items-center justify-center flex-shrink-0">
                          N{s.nightNumber}
                        </span>
                        <span className="text-slate-300 font-bold truncate">
                          {s.cityName || form.tripDetails.destination}: <span className="text-white font-black">{s.hotelName || "Quality Hotel"}</span>
                        </span>
                      </div>
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-white/10 text-amber-300 border border-white/10 flex-shrink-0">
                        {s.mealPlan}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Commercial Pill Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-600/20 border border-amber-400/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black">
                    <IndianRupee className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-amber-300">Commercial Snapshot</p>
                    <p className="text-[15px] font-black text-white">
                      ₹{finalPrice.toLocaleString("en-IN")} Total Value
                      {discountAmt > 0 && <span className="text-amber-300 text-[12px] font-bold ml-2">(₹{discountAmt.toLocaleString("en-IN")} Discount Applied)</span>}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[12px]">
                  <span className="text-slate-300">25% Advance Token:</span>
                  <span className="font-black text-white font-mono bg-white/10 px-2.5 py-1 rounded-xl border border-white/15">
                    ₹{advanceToken.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Sticky Sidebar: Direct Total Price & Discount (4 cols) */}
          <div className="lg:col-span-4 sticky top-24 space-y-4">
            <div className="bg-white rounded-3xl border-2 border-amber-200 p-6 shadow-md space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-[11px] font-black uppercase tracking-widest text-amber-700 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-500" /> Direct Commercials
                </span>
                <span className="text-[11px] font-bold text-slate-400">1-Minute Entry</span>
              </div>

              {/* Direct Total Package Price Input */}
              <div className="space-y-1.5">
                <label className="block text-[12px] font-black text-slate-800">
                  Total Package Price (₹) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-[14px]">₹</span>
                  <input
                    type="number"
                    min="0"
                    value={form.pricing.totalPrice || ""}
                    onChange={(e) => setForm((p) => ({ ...p, pricing: { ...p.pricing, totalPrice: parseFloat(e.target.value) || 0 } }))}
                    placeholder="e.g. 45000"
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-300 font-black text-[16px] text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-right font-mono"
                  />
                </div>
              </div>

              {/* Direct Discount / Offer Input */}
              <div className="p-3.5 rounded-2xl bg-rose-50/70 border border-rose-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11.5px] font-black text-rose-800 flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5 text-rose-500" /> Special Discount (₹)
                  </span>
                  {discountAmt > 0 && (
                    <span className="text-[10.5px] font-black px-2 py-0.5 rounded-full bg-rose-200 text-rose-900">
                      Save ₹{discountAmt.toLocaleString("en-IN")}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-rose-500 font-bold text-[12px]">₹</span>
                  <input
                    type="number"
                    min="0"
                    value={form.pricing.discountAmount || ""}
                    onChange={(e) => setForm((p) => ({ ...p, pricing: { ...p.pricing, discountAmount: parseFloat(e.target.value) || 0 } }))}
                    placeholder="0"
                    className="w-full pl-7 pr-3 py-2 rounded-xl border border-rose-200 bg-white text-[14px] font-bold text-right text-rose-900"
                  />
                </div>
              </div>

              {/* Final Summary Box */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950 text-white space-y-3 shadow-lg">
                <div>
                  {discountAmt > 0 && (
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[12px] text-slate-400 line-through font-bold">
                        ₹{totalPrice.toLocaleString("en-IN")}
                      </span>
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        Discount Applied
                      </span>
                    </div>
                  )}
                  <p className="text-[10.5px] font-black uppercase tracking-widest text-amber-400">Net Client Payable</p>
                  <p className="text-[28px] font-black text-white leading-tight font-mono">
                    ₹{finalPrice.toLocaleString("en-IN")}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10 text-[11px]">
                  <div className="bg-white/5 rounded-xl p-2">
                    <p className="text-slate-400 font-bold text-[10px]">Per Couple</p>
                    <p className="font-black text-[13px] text-white">₹{perCouplePrice.toLocaleString("en-IN")}</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-2">
                    <p className="text-slate-400 font-bold text-[10px]">Per Person</p>
                    <p className="font-black text-[13px] text-white">₹{perPersonPrice.toLocaleString("en-IN")}</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-amber-200">
                  <span>25% Advance Token:</span>
                  <span className="font-black">₹{advanceToken.toLocaleString("en-IN")}</span>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => handleSubmit("sent")}
                  disabled={saving}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-white font-black text-[13.5px] shadow-md shadow-amber-500/25 transition-all flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  <Zap className="w-4 h-4" />
                  <span>Generate Quick Quote</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSubmit("draft")}
                  disabled={saving}
                  className="w-full py-2.5 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-[12.5px] transition-colors"
                >
                  Save as Draft Only
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Instructions & Policies Editor Dialog Modal */}
      <InstructionsEditorModal
        isOpen={instructionsModalOpen}
        onClose={() => setInstructionsModalOpen(false)}
        instructions={form.specialInstructions || []}
        onSave={(updated) => setForm((p) => ({ ...p, specialInstructions: updated }))}
      />
    </div>
  );
}
