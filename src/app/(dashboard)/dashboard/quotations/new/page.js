"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft, Plus, Trash2, Loader2, AlertCircle, ChevronRight,
  MapPin, Moon, Sun, Check, Sparkles, Layers, FileText, Compass,
  Car, IndianRupee, ShieldCheck, Eye, CheckCircle2, Navigation,
  Users, Calendar, Package, MessageSquare, Copy, ExternalLink,
  HeartHandshake, Percent, Tag,
} from "lucide-react";
import Link from "next/link";
import ItineraryBuilder from "@/components/packages/ItineraryBuilder";
import AccommodationPanel from "@/components/packages/AccommodationPanel";
import VehiclePanel from "@/components/packages/VehiclePanel";
import PricingPanel from "@/components/packages/PricingPanel";
import InstructionPanel from "@/components/packages/InstructionPanel";
import PackageCloneModal from "@/components/quotations/PackageCloneModal";
import DateRangeSelector from "@/components/quotations/DateRangeSelector";

const SECTIONS = [
  { id: "client", label: "Client & Dates", icon: Users, desc: "Lead & Travel Info" },
  { id: "itinerary", label: "Itinerary", icon: Sun, desc: "Day by Day" },
  { id: "accommodation", label: "Accommodation", icon: Layers, desc: "Hotel Tiers" },
  { id: "vehicle", label: "Vehicle", icon: Car, desc: "Transport" },
  { id: "pricing", label: "Pricing & Margin", icon: IndianRupee, desc: "Markup & Terms" },
  { id: "instructions", label: "Policies", icon: FileText, desc: "Terms & Rules" },
  { id: "review", label: "Review & Send", icon: ShieldCheck, desc: "Final Proposal" },
];

function getTomorrowDate() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
}

function getNextWeekDate() {
  const d = new Date();
  d.setDate(d.getDate() + 5);
  return d.toISOString().split("T")[0];
}

export default function CreateQuotationPageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>}>
      <CreateQuotationPage />
    </Suspense>
  );
}

function CreateQuotationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clonePkgId = searchParams.get("clonePkgId");

  const [currentSection, setCurrentSection] = useState("client");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [cities, setCities] = useState([]);
  const [cloneModalOpen, setCloneModalOpen] = useState(false);

  const [form, setForm] = useState({
    sourcePackage: null,
    client: {
      name: "",
      phone: "",
      email: "",
      company: "",
      clientType: "b2c",
      leadSource: "Direct",
      notes: "",
    },
    tripDetails: {
      title: "",
      startDate: getTomorrowDate(),
      endDate: getNextWeekDate(),
      nights: 4,
      days: 5,
      destinations: [],
      destination: "",
    },
    passengers: {
      adults: 2,
      childrenWithBed: 0,
      childrenNoBed: 0,
      infants: 0,
      totalRooms: 1,
    },
    highlights: [],
    coverImage: null,
    itinerary: [],
    accommodationOptions: [],
    selectedOptionIndex: 0,
    vehicle: {
      vehicleType: "Sedan",
      model: "",
      seats: 4,
      acType: "AC",
      vehiclePrice: 0,
      notes: "",
    },
    pricing: {
      accommodationTotal: 0,
      vehicleTotal: 0,
      activitiesTotal: 0,
      subtotal: 0,
      marginType: "absolute",
      margin: 0,
      discountAmount: 0,
      includeGst: false,
      gstPercentage: 5,
      finalPrice: 0,
      perPersonPrice: 0,
      perCouplePrice: 0,
      numberOfPersons: 2,
      currency: "INR",
      includes: [],
      excludes: [],
    },
    paymentTerms: {
      advancePercentage: 25,
      advanceAmount: 0,
      balanceDueDate: null,
      termsText: "25% advance to confirm booking, balance payable 15 days before travel.",
    },
    instructions: [],
    validUntil: "",
  });

  // Fetch cities for destination pickers
  useEffect(() => {
    fetch("/api/accommodation/cities")
      .then((r) => r.json())
      .then((d) => setCities(d.cities || []))
      .catch((err) => console.error("Failed to load cities", err));
  }, []);

  // Auto-clone if clonePkgId is in query params
  useEffect(() => {
    if (!clonePkgId) return;
    fetch(`/api/packages/${clonePkgId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.package) {
          handleClonePackage(data.package);
        }
      })
      .catch((err) => console.error("Failed to clone package via URL", err));
  }, [clonePkgId]);

  // Auto-calculate nights and days when dates change
  function handleDateChange(field, val) {
    const updated = { ...form.tripDetails, [field]: val };
    if (updated.startDate && updated.endDate) {
      const start = new Date(updated.startDate);
      const end = new Date(updated.endDate);
      const diffTime = end.getTime() - start.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays > 0) {
        updated.nights = diffDays;
        updated.days = diffDays + 1;
      }
    }
    setForm((prev) => ({ ...prev, tripDetails: updated }));
  }

  // 1-Click Clone from Package Handler (Deep Copy & Normalize to isolate quotation)
  async function handleClonePackage(pkg) {
    if (!pkg) return;
    let fullPkg = pkg;
    if (!pkg.itinerary || !pkg.accommodationOptions || pkg.itinerary.length === 0) {
      try {
        const res = await fetch(`/api/packages/${pkg._id}`);
        const data = await res.json();
        if (data.package) fullPkg = data.package;
      } catch (e) {
        console.error("Error fetching package details for clone", e);
      }
    }

    const deepClone = JSON.parse(JSON.stringify(fullPkg));
    const incs = Array.isArray(deepClone.pricing?.includes)
      ? deepClone.pricing.includes
      : (Array.isArray(deepClone.inclusions) ? deepClone.inclusions : []);
    const excs = Array.isArray(deepClone.pricing?.excludes)
      ? deepClone.pricing.excludes
      : (Array.isArray(deepClone.exclusions) ? deepClone.exclusions : []);

    // 1. Synthesize destinations if empty
    let destinations = Array.isArray(deepClone.destinations) && deepClone.destinations.length > 0
      ? deepClone.destinations
      : [];
    if (destinations.length === 0 && Array.isArray(deepClone.accommodationOptions) && deepClone.accommodationOptions.length > 0) {
      const firstOptNights = deepClone.accommodationOptions[0]?.nights || [];
      const synthesized = [];
      firstOptNights.forEach((n) => {
        const last = synthesized[synthesized.length - 1];
        if (last && last.cityName === n.cityName) {
          last.nights += 1;
        } else {
          synthesized.push({
            cityId: n.cityId || null,
            cityName: n.cityName || "Destination",
            state: "",
            nights: 1,
          });
        }
      });
      destinations = synthesized;
    }

    const totalNights = deepClone.nights || (destinations.length > 0 ? destinations.reduce((s, d) => s + (d.nights || 1), 0) : form.tripDetails.nights) || 4;
    const totalDays = deepClone.days || totalNights + 1;

    // 2. Synchronize Start Date and End Date
    const startDate = form.tripDetails.startDate || getTomorrowDate();
    const startObj = new Date(startDate);
    const endObj = new Date(startObj.getTime() + totalNights * 24 * 60 * 60 * 1000);
    const endDate = !isNaN(endObj.getTime()) ? endObj.toISOString().split("T")[0] : form.tripDetails.endDate;

    const destination = deepClone.destination || destinations.map((d) => d.cityName).join(" → ");

    // 3. Normalize Itinerary
    const itinerary = (deepClone.itinerary || []).map((day, di) => ({
      day: day.day || di + 1,
      title: day.title || `Day ${di + 1}`,
      description: day.description || "",
      activities: Array.isArray(day.activities) ? day.activities : [],
      meals: {
        breakfast: Boolean(day.meals?.breakfast),
        lunch: Boolean(day.meals?.lunch),
        dinner: Boolean(day.meals?.dinner),
      },
      images: Array.isArray(day.images) ? day.images : [],
    }));

    // 4. Normalize Accommodation Options
    const accommodationOptions = (deepClone.accommodationOptions || []).map((opt, optIdx) => ({
      label: opt.label || `Option ${optIdx + 1}`,
      marginType: opt.marginType || "absolute",
      margin: opt.margin || 0,
      totalPrice: opt.totalPrice || 0,
      nights: (opt.nights || []).map((n, ni) => ({
        night: n.night || ni + 1,
        cityId: n.cityId || null,
        cityName: n.cityName || "",
        hotelId: n.hotelId || null,
        hotelName: n.hotelName || "",
        roomId: n.roomId || null,
        roomType: n.roomType || "",
        mealPlan: n.mealPlan || "CP",
        starRating: n.starRating || null,
        pricePerNight: n.pricePerNight || 0,
        notes: n.notes || "",
      })),
    }));

    // 5. Normalize Vehicle
    const vehicle = deepClone.vehicle ? {
      vehicleType: deepClone.vehicle.vehicleType || "Sedan",
      model: deepClone.vehicle.model || "",
      seats: deepClone.vehicle.seats || 4,
      acType: deepClone.vehicle.acType || "AC",
      vehiclePrice: deepClone.vehicle.vehiclePrice || 0,
      notes: deepClone.vehicle.notes || "",
    } : form.vehicle;

    setForm((prev) => ({
      ...prev,
      sourcePackage: deepClone._id,
      tripDetails: {
        ...prev.tripDetails,
        title: prev.client?.name?.trim()
          ? `${deepClone.title} (Quote for ${prev.client.name.trim()})`
          : deepClone.title,
        nights: totalNights,
        days: totalDays,
        startDate,
        endDate,
        destinations,
        destination,
      },
      highlights: Array.isArray(deepClone.highlights) ? deepClone.highlights : [],
      coverImage: deepClone.coverImage || null,
      itinerary,
      accommodationOptions,
      selectedOptionIndex: deepClone.pricing?.selectedOptionIndex || 0,
      vehicle,
      pricing: {
        ...prev.pricing,
        ...deepClone.pricing,
        selectedOptionIndex: deepClone.pricing?.selectedOptionIndex || 0,
        marginType: deepClone.pricing?.marginType || "absolute",
        margin: deepClone.pricing?.margin || 0,
        discountAmount: deepClone.pricing?.discountAmount || 0,
        discountReason: deepClone.pricing?.discountReason || "",
        includeGst: Boolean(deepClone.pricing?.includeGst),
        gstPercentage: deepClone.pricing?.gstPercentage || 5,
        rateBasis: deepClone.pricing?.rateBasis || "per_couple",
        includes: incs,
        excludes: excs,
        numberOfPersons: prev.passengers?.adults || 2,
      },
      inclusions: incs,
      exclusions: excs,
      instructions: Array.isArray(deepClone.instructions) ? deepClone.instructions : [],
    }));
    setCloneModalOpen(false);
  }

  // Destination helpers
  function addDestination(cityId) {
    if (!cityId) return;
    const city = cities.find((c) => c._id === cityId);
    if (!city) return;
    const dest = {
      cityId: city._id,
      cityName: city.name,
      state: city.state || "",
      nights: 1,
    };
    const updated = [...form.tripDetails.destinations, dest];
    const totalNights = updated.reduce((s, d) => s + (d.nights || 1), 0);
    setForm((prev) => ({
      ...prev,
      tripDetails: {
        ...prev.tripDetails,
        destinations: updated,
        nights: totalNights,
        days: totalNights + 1,
        destination: updated.map((d) => d.cityName).join(" → "),
      },
    }));
  }

  function updateDestinationNights(idx, nights) {
    const updated = form.tripDetails.destinations.map((d, i) =>
      i === idx ? { ...d, nights: Math.max(1, parseInt(nights, 10) || 1) } : d
    );
    const totalNights = updated.reduce((s, d) => s + (d.nights || 1), 0);
    setForm((prev) => ({
      ...prev,
      tripDetails: {
        ...prev.tripDetails,
        destinations: updated,
        nights: totalNights,
        days: totalNights + 1,
        destination: updated.map((d) => d.cityName).join(" → "),
      },
    }));
  }

  function removeDestination(idx) {
    const updated = form.tripDetails.destinations.filter((_, i) => i !== idx);
    const totalNights = updated.reduce((s, d) => s + (d.nights || 1), 0) || 1;
    setForm((prev) => ({
      ...prev,
      tripDetails: {
        ...prev.tripDetails,
        destinations: updated,
        nights: totalNights,
        days: totalNights + 1,
        destination: updated.map((d) => d.cityName).join(" → "),
      },
    }));
  }

  // Financial recalculation
  const selectedOptIdx = form.selectedOptionIndex || 0;
  const currentOpt = form.accommodationOptions[selectedOptIdx] || form.accommodationOptions[0];
  const accommodationTotal = currentOpt
    ? (currentOpt.nights || []).reduce((s, n) => s + (n.pricePerNight || 0), 0)
    : 0;
  const vehicleTotal = form.vehicle?.vehiclePrice || 0;
  const activitiesTotal = (form.itinerary || []).reduce((sum, day) => {
    const dayActs = (day.activities || []).reduce((ds, a) => ds + (typeof a === "object" ? a.price || 0 : 0), 0);
    return sum + dayActs;
  }, 0);

  const subtotal = accommodationTotal + vehicleTotal + activitiesTotal;
  const marginVal =
    form.pricing?.marginType === "percentage"
      ? (subtotal * (form.pricing?.margin || 0)) / 100
      : form.pricing?.margin || 0;
  const preTax = subtotal + marginVal;
  const gstAmount = form.pricing?.includeGst ? (preTax * (form.pricing?.gstPercentage || 5)) / 100 : 0;
  const finalPrice = Math.max(0, Math.round(preTax + gstAmount - (form.pricing?.discountAmount || 0)));
  const pax = Math.max(1, form.passengers?.adults || 2);
  const perPersonPrice = pax > 0 ? Math.round(finalPrice / pax) : finalPrice;
  const perCouplePrice = pax >= 2 ? Math.round((finalPrice / pax) * 2) : finalPrice;

  // Sync pricing state
  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      pricing: {
        ...prev.pricing,
        accommodationTotal,
        vehicleTotal,
        activitiesTotal,
        subtotal,
        finalPrice,
        perPersonPrice,
        perCouplePrice,
        numberOfPersons: pax,
      },
      paymentTerms: {
        ...prev.paymentTerms,
        advanceAmount: Math.round((finalPrice * (prev.paymentTerms?.advancePercentage || 25)) / 100),
      },
    }));
  }, [accommodationTotal, vehicleTotal, activitiesTotal, subtotal, finalPrice, perPersonPrice, perCouplePrice, pax]);

  // Submit Handler
  async function handleSubmit(targetStatus = "draft") {
    setError("");
    if (!form.client.name.trim() || !form.client.phone.trim()) {
      setError("Please fill in client name and phone number.");
      setCurrentSection("client");
      return;
    }
    if (!form.tripDetails.title.trim()) {
      setError("Please provide a quotation title.");
      setCurrentSection("client");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        status: targetStatus,
      };

      const res = await fetch("/api/quotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create quotation");

      router.push("/dashboard/quotations");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const currentStepIdx = SECTIONS.findIndex((s) => s.id === currentSection);
  function nextSection() {
    if (currentStepIdx < SECTIONS.length - 1) {
      setCurrentSection(SECTIONS[currentStepIdx + 1].id);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }
  function prevSection() {
    if (currentStepIdx > 0) {
      setCurrentSection(SECTIONS[currentStepIdx - 1].id);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans pb-24">
      {/* ── Top Bar ── */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200/80 px-6 py-4 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/quotations"
            className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center gap-2 text-[13px] font-bold"
          >
            <ArrowLeft className="w-4 h-4" /> Quotations List
          </Link>
          <div className="h-6 w-px bg-slate-200 hidden sm:block" />
          <div className="hidden sm:block">
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
              Quotation Generator
            </span>
            <h1 className="text-[15px] font-black text-slate-900 leading-snug mt-0.5 truncate max-w-sm">
              {form.tripDetails.title || "New Holiday Proposal"}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setCloneModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 font-extrabold text-[12.5px] transition-all shadow-2xs"
          >
            <Package className="w-4 h-4 text-indigo-600" />
            <span>Clone from Package</span>
          </button>

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
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-[13px] font-extrabold shadow-md shadow-indigo-500/25 transition-all disabled:opacity-50"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Save &amp; Generate Proposal
          </button>
        </div>
      </header>

      {/* ── Step Navigation Bar ── */}
      <div className="bg-white border-b border-slate-200/80 px-6 py-3 overflow-x-auto">
        <div className="max-w-6xl mx-auto flex items-center gap-2">
          {SECTIONS.map((sec, idx) => {
            const Icon = sec.icon;
            const isActive = currentSection === sec.id;
            const isPassed = currentStepIdx > idx;

            return (
              <button
                key={sec.id}
                type="button"
                onClick={() => setCurrentSection(sec.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-[12.5px] font-bold whitespace-nowrap transition-all ${
                  isActive
                    ? "bg-slate-900 text-white shadow-xs"
                    : isPassed
                    ? "bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                    : "text-slate-500 hover:bg-slate-100"
                }`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                  isActive ? "bg-white/20 text-white" : isPassed ? "bg-emerald-200 text-emerald-900" : "bg-slate-200 text-slate-600"
                }`}>
                  {isPassed ? "✓" : idx + 1}
                </span>
                <Icon className="w-3.5 h-3.5" />
                <span>{sec.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Main Form Area ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8">
        {error && (
          <div className="flex items-center gap-2.5 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-[13.5px] mb-6">
            <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Wizard Form (8 cols) */}
          <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200/90 p-7 shadow-xs space-y-6">

            {/* 1. Client & Dates Step */}
            {currentSection === "client" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-[18px] font-black text-slate-900">Client &amp; Trip Parameters</h2>
                  <p className="text-[13px] text-slate-500 mt-0.5">Primary traveler contact and scheduled tour dates</p>
                </div>

                {/* Client info grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[12px] font-bold text-slate-600 mb-1.5">Client Full Name *</label>
                    <input
                      type="text"
                      value={form.client.name}
                      onChange={(e) => setForm((p) => ({ ...p, client: { ...p.client, name: e.target.value } }))}
                      placeholder="e.g. Rajesh Sharma"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-[13.5px] font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[12px] font-bold text-slate-600 mb-1.5">WhatsApp / Phone Number *</label>
                    <input
                      type="text"
                      value={form.client.phone}
                      onChange={(e) => setForm((p) => ({ ...p, client: { ...p.client, phone: e.target.value } }))}
                      placeholder="e.g. +91 98765 43210"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-[13.5px] font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[12px] font-bold text-slate-600 mb-1.5">Email Address</label>
                    <input
                      type="email"
                      value={form.client.email}
                      onChange={(e) => setForm((p) => ({ ...p, client: { ...p.client, email: e.target.value } }))}
                      placeholder="rajesh.sharma@example.com"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-[13.5px] font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[12px] font-bold text-slate-600 mb-1.5">Client Type</label>
                    <select
                      value={form.client.clientType}
                      onChange={(e) => setForm((p) => ({ ...p, client: { ...p.client, clientType: e.target.value } }))}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-[13.5px] font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                    >
                      <option value="b2c">B2C (Direct Traveler)</option>
                      <option value="b2b">B2B (Travel Agent)</option>
                      <option value="corporate">Corporate / Group</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 space-y-4">
                  <div>
                    <label className="block text-[12px] font-bold text-slate-600 mb-1.5">Quotation Proposal Title *</label>
                    <input
                      type="text"
                      value={form.tripDetails.title}
                      onChange={(e) => setForm((p) => ({ ...p, tripDetails: { ...p.tripDetails, title: e.target.value } }))}
                      placeholder="e.g. 5 Day 4 Night Luxury Kerala Experience for Rajesh Sharma"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-[13.5px] font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                    />
                  </div>

                  {/* Visual Date Range Selector */}
                  <DateRangeSelector
                    startDate={form.tripDetails.startDate}
                    endDate={form.tripDetails.endDate}
                    nights={form.tripDetails.nights}
                    days={form.tripDetails.days}
                    onChange={(datePatch) => {
                      setForm((prev) => ({
                        ...prev,
                        tripDetails: {
                          ...prev.tripDetails,
                          ...datePatch,
                        },
                      }));
                    }}
                  />

                  {/* Passengers & Rooms */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                    <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Passenger &amp; Room Configuration</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">Adults (12+)</label>
                        <input
                          type="number"
                          min="1"
                          value={form.passengers.adults}
                          onChange={(e) => setForm((p) => ({ ...p, passengers: { ...p.passengers, adults: parseInt(e.target.value, 10) || 1 } }))}
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-[13px] font-black text-center"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">Child (with Bed)</label>
                        <input
                          type="number"
                          min="0"
                          value={form.passengers.childrenWithBed}
                          onChange={(e) => setForm((p) => ({ ...p, passengers: { ...p.passengers, childrenWithBed: parseInt(e.target.value, 10) || 0 } }))}
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-[13px] font-black text-center"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">Infants (&lt;2)</label>
                        <input
                          type="number"
                          min="0"
                          value={form.passengers.infants}
                          onChange={(e) => setForm((p) => ({ ...p, passengers: { ...p.passengers, infants: parseInt(e.target.value, 10) || 0 } }))}
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-[13px] font-black text-center"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">Total Rooms</label>
                        <input
                          type="number"
                          min="1"
                          value={form.passengers.totalRooms}
                          onChange={(e) => setForm((p) => ({ ...p, passengers: { ...p.passengers, totalRooms: parseInt(e.target.value, 10) || 1 } }))}
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-[13px] font-black text-center"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Multi-City Route */}
                  <div className="space-y-3 pt-2">
                    <label className="block text-[12px] font-bold text-slate-700 uppercase tracking-wider">
                      Tour Route Destinations ({form.tripDetails.destinations.length} Cities)
                    </label>

                    <div className="flex gap-2">
                      <select
                        onChange={(e) => {
                          addDestination(e.target.value);
                          e.target.value = "";
                        }}
                        defaultValue=""
                        className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-[13.5px] font-semibold bg-white"
                      >
                        <option value="" disabled>+ Add Destination City to Route…</option>
                        {cities.map((c) => (
                          <option key={c._id} value={c._id}>
                            {c.name}{c.state ? `, ${c.state}` : ""}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Destination List */}
                    <div className="space-y-2">
                      {form.tripDetails.destinations.map((dest, i) => (
                        <div key={i} className="flex items-center justify-between p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-100">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white font-black text-[11px] flex items-center justify-center">
                              {i + 1}
                            </span>
                            <span className="font-extrabold text-indigo-950 text-[13.5px]">{dest.cityName}</span>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5 text-[12.5px] font-bold text-slate-600">
                              <span>Stay:</span>
                              <input
                                type="number"
                                min="1"
                                value={dest.nights}
                                onChange={(e) => updateDestinationNights(i, e.target.value)}
                                className="w-14 px-2 py-1 rounded-lg border border-slate-300 text-center font-black bg-white"
                              />
                              <span>Nights</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeDestination(i)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. Itinerary Step */}
            {currentSection === "itinerary" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-[18px] font-black text-slate-900">Day-by-Day Itinerary &amp; Sightseeings</h2>
                  <p className="text-[13px] text-slate-500 mt-0.5">Customize daily schedule with formatted sub-bullets and activities</p>
                </div>

                <ItineraryBuilder
                  days={form.tripDetails.days}
                  value={form.itinerary}
                  onChange={(itinerary) => setForm((p) => ({ ...p, itinerary }))}
                  destinations={form.tripDetails.destinations}
                />
              </div>
            )}

            {/* 3. Accommodation Step */}
            {currentSection === "accommodation" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-[18px] font-black text-slate-900">Hotel Accommodation Tiers</h2>
                  <p className="text-[13px] text-slate-500 mt-0.5">Provide Standard, Deluxe, and Luxury hotel choices</p>
                </div>

                <AccommodationPanel
                  destinations={form.tripDetails.destinations}
                  options={form.accommodationOptions}
                  onChange={(accommodationOptions) => setForm((p) => ({ ...p, accommodationOptions }))}
                />
              </div>
            )}

            {/* 4. Vehicle Step */}
            {currentSection === "vehicle" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-[18px] font-black text-slate-900">Transport &amp; Vehicle Fleet</h2>
                  <p className="text-[13px] text-slate-500 mt-0.5">Assign private transfers, dedicated cab, and driver terms</p>
                </div>

                <VehiclePanel
                  value={form.vehicle}
                  onChange={(vehicle) => setForm((p) => ({ ...p, vehicle }))}
                  days={form.tripDetails.days}
                />
              </div>
            )}

            {/* 5. Pricing & Margins Step */}
            {currentSection === "pricing" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-[18px] font-black text-slate-900">Commercials, Margin &amp; Milestones</h2>
                  <p className="text-[13px] text-slate-500 mt-0.5">Set agency profit markup, special discounts, and advance payment terms</p>
                </div>

                {/* Special client discount */}
                <div className="p-4.5 rounded-2xl bg-amber-50/60 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <Tag className="w-5 h-5 text-amber-600 flex-shrink-0" />
                    <div>
                      <h4 className="text-[13.5px] font-black text-amber-950">Client Special Discount (Optional)</h4>
                      <p className="text-[11.5px] text-amber-800">Deduct custom discount amount to close the lead</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-bold text-slate-600">₹</span>
                    <input
                      type="number"
                      min="0"
                      value={form.pricing.discountAmount || 0}
                      onChange={(e) => setForm((p) => ({ ...p, pricing: { ...p.pricing, discountAmount: parseFloat(e.target.value) || 0 } }))}
                      placeholder="0"
                      className="w-28 px-3 py-1.5 rounded-xl border border-amber-300 font-black text-[14px] bg-white text-slate-900 text-right"
                    />
                  </div>
                </div>

                <PricingPanel
                  value={form.pricing}
                  onChange={(pricing) => setForm((p) => ({ ...p, pricing }))}
                  onAccommodationOptionsChange={(accommodationOptions) => setForm((p) => ({ ...p, accommodationOptions }))}
                  accommodationOptions={form.accommodationOptions}
                  vehiclePrice={form.vehicle?.vehiclePrice || 0}
                  activitiesTotal={activitiesTotal}
                />
              </div>
            )}

            {/* 6. Instructions Step */}
            {currentSection === "instructions" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-[18px] font-black text-slate-900">Policies &amp; Guidelines</h2>
                  <p className="text-[13px] text-slate-500 mt-0.5">Cancellation terms, driver guidelines, and trip notes</p>
                </div>

                <InstructionPanel
                  value={form.instructions}
                  onChange={(instructions) => setForm((p) => ({ ...p, instructions }))}
                />
              </div>
            )}

            {/* 7. Review Step */}
            {currentSection === "review" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-[18px] font-black text-slate-900">Final Quotation Review</h2>
                  <p className="text-[13px] text-slate-500 mt-0.5">Verify all commercial details before sending to client</p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3 text-[13px]">
                  <div className="flex justify-between py-1 border-b border-slate-200/60">
                    <span className="text-slate-500 font-semibold">Client Name</span>
                    <span className="font-extrabold text-slate-900">{form.client.name} ({form.client.phone})</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/60">
                    <span className="text-slate-500 font-semibold">Tour Duration</span>
                    <span className="font-extrabold text-slate-900">{form.tripDetails.nights} Nights / {form.tripDetails.days} Days</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/60">
                    <span className="text-slate-500 font-semibold">Route</span>
                    <span className="font-extrabold text-slate-900">{form.tripDetails.destination || "Custom Route"}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/60">
                    <span className="text-slate-500 font-semibold">Vehicle</span>
                    <span className="font-extrabold text-slate-900">{form.vehicle?.vehicleType} ({form.vehicle?.acType})</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/60">
                    <span className="text-slate-500 font-semibold">Hotel Tiers</span>
                    <span className="font-extrabold text-indigo-700">{form.accommodationOptions.length} Tier(s) configured</span>
                  </div>
                  <div className="flex justify-between py-1.5 font-bold text-[14px]">
                    <span>Total Quotation Amount</span>
                    <span className="text-emerald-700 font-black">₹{finalPrice.toLocaleString("en-IN")}</span>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => handleSubmit("draft")}
                    disabled={saving}
                    className="flex-1 py-3.5 rounded-2xl border border-slate-300 font-extrabold text-[13.5px] bg-white hover:bg-slate-50 text-slate-700 transition-all disabled:opacity-50"
                  >
                    Save as Draft
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSubmit("sent")}
                    disabled={saving}
                    className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-700 hover:to-purple-700 text-white font-black text-[14px] transition-all shadow-md shadow-indigo-500/25 disabled:opacity-50"
                  >
                    {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                    Save &amp; Generate Client Proposal
                  </button>
                </div>
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex items-center justify-between pt-6 border-t border-slate-100">
              <button
                type="button"
                onClick={prevSection}
                disabled={currentStepIdx === 0}
                className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 font-bold text-[13px] hover:bg-slate-50 disabled:opacity-30 transition-all"
              >
                ← Previous
              </button>
              {currentSection !== "review" && (
                <button
                  type="button"
                  onClick={nextSection}
                  className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[13px] shadow-sm transition-all"
                >
                  Continue <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* ── Live Quotation Calculator Sidebar (4 cols) ── */}
          <div className="lg:col-span-4 sticky top-24 space-y-4">
            <div className="bg-slate-900 text-white rounded-3xl p-6 border border-slate-800 shadow-xl space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Live Quote Summary</span>
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10.5px] font-bold border border-indigo-500/30">
                  {form.tripDetails.nights}N / {form.tripDetails.days}D
                </span>
              </div>

              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Client</p>
                <p className="text-[15px] font-black text-white">{form.client.name || "Client Name"}</p>
                {form.client.phone && <p className="text-[12px] text-slate-400 mt-0.5">{form.client.phone}</p>}
              </div>

              {/* Cost breakdown */}
              <div className="space-y-2.5 pt-3 border-t border-slate-800 text-[12.5px]">
                <div className="flex justify-between text-slate-300">
                  <span>Accommodation</span>
                  <span className="font-bold text-white">₹{accommodationTotal.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Vehicle ({form.vehicle?.vehicleType || "Sedan"})</span>
                  <span className="font-bold text-white">₹{vehicleTotal.toLocaleString("en-IN")}</span>
                </div>
                {activitiesTotal > 0 && (
                  <div className="flex justify-between text-slate-300">
                    <span>Activities</span>
                    <span className="font-bold text-rose-300">₹{activitiesTotal.toLocaleString("en-IN")}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-300 font-bold pt-2 border-t border-slate-800">
                  <span>Net Base Cost</span>
                  <span className="text-indigo-300">₹{subtotal.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Markup ({form.pricing?.marginType === "percentage" ? `${form.pricing?.margin || 0}%` : "₹"})</span>
                  <span className="font-bold text-purple-300">₹{Math.round(marginVal).toLocaleString("en-IN")}</span>
                </div>
                {form.pricing?.discountAmount > 0 && (
                  <div className="flex justify-between text-amber-400 font-bold">
                    <span>Discount</span>
                    <span>-₹{Number(form.pricing.discountAmount).toLocaleString("en-IN")}</span>
                  </div>
                )}
              </div>

              {/* Final price card */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950 to-purple-950 border border-indigo-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-black uppercase tracking-widest text-indigo-300">Grand Total Value</p>
                  <span className="text-[9.5px] font-extrabold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                    All Inclusive
                  </span>
                </div>
                <p className="text-[24px] font-black text-emerald-400 leading-tight">
                  ₹{finalPrice.toLocaleString("en-IN")}
                </p>

                <div className="pt-2 border-t border-white/10 grid grid-cols-2 gap-2 text-[11px]">
                  <div className="bg-white/5 rounded-xl p-2">
                    <p className="text-indigo-200 text-[10px] font-bold">Per Couple</p>
                    <p className="font-black text-[13px] text-white">₹{perCouplePrice.toLocaleString("en-IN")}</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-2">
                    <p className="text-indigo-200 text-[10px] font-bold">Per Person ({pax} Pax)</p>
                    <p className="font-black text-[13px] text-white">₹{perPersonPrice.toLocaleString("en-IN")}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Package Clone Modal */}
      <PackageCloneModal
        isOpen={cloneModalOpen}
        onClose={() => setCloneModalOpen(false)}
        onSelectPackage={handleClonePackage}
      />
    </div>
  );
}
