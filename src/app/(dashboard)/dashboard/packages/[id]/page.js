"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, MapPin, Moon, Sun, Building2, Car, IndianRupee,
  CheckCircle2, XCircle, ChevronDown, ChevronUp, Loader2, Pencil,
  Star, HeartHandshake, Users, Sparkles, FileText, Check, Compass,
  Utensils, Camera, Clock3, Zap, Shield, Navigation, Share2, Printer,
  Layers, Tag, Info, AlertCircle, Copy
} from "lucide-react";

const MEAL_PLAN_LABELS = {
  EP: "Room Only (EP)",
  CP: "Bed & Breakfast (CP)",
  MAP: "Breakfast + Dinner (MAP)",
  AP: "All Meals (AP)",
  "": "Not specified",
};

const MEAL_EMOJI = { breakfast: "🌅 Breakfast", lunch: "☀️ Lunch", dinner: "🌙 Dinner" };

function getVehicleImage(vehicleType = "") {
  const type = (vehicleType || "").toLowerCase();
  if (type.includes("sedan") || type.includes("dzire") || type.includes("etios")) return "/vehicle-sedan.png";
  if (type.includes("suv") || type.includes("innova") || type.includes("crysta")) return "/vehicle-suv.png";
  if (type.includes("muv") || type.includes("ertiga") || type.includes("carens")) return "/vehicle-muv.png";
  if (type.includes("tempo") || type.includes("traveller") || type.includes("van")) return "/vehicle-tempo.png";
  if (type.includes("mini bus") || type.includes("minibus") || type.includes("coach")) return "/vehicle-minibus.png";
  if (type.includes("bus")) return "/vehicle-bus.png";
  return "/vehicle-sedan.png";
}

export default function PackageViewPage() {
  const { id } = useParams();
  const [pkg, setPkg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Interactive UI states
  const [expandedDays, setExpandedDays] = useState({ 0: true });
  const [allExpanded, setAllExpanded] = useState(false);
  const [activeAccomTab, setActiveAccomTab] = useState(0);
  const [activeVehiclePeriodTab, setActiveVehiclePeriodTab] = useState(0);
  const [selectedVehicleIdx, setSelectedVehicleIdx] = useState(0);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  useEffect(() => {
    fetch(`/api/packages/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.package) {
          setPkg(data.package);
          // Default expand first day
          setExpandedDays({ 0: true });
        } else {
          setError("Package not found");
        }
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

  const pax = Math.max(1, pkg.pricing?.numberOfPersons || 2);
  const numRooms = Math.max(1, Number(pkg.pricing?.numberOfRooms) || Math.ceil(pax / 2));

  // Period and vehicle calculation
  const periodsList = (Array.isArray(pkg.vehiclePeriods) && pkg.vehiclePeriods.length > 0)
    ? pkg.vehiclePeriods
    : [{
        name: "Standard Season",
        startDate: "",
        endDate: "",
        vehicles: (Array.isArray(pkg.vehicles) && pkg.vehicles.length > 0) ? pkg.vehicles : (pkg.vehicle?.vehicleType ? [pkg.vehicle] : []),
      }];

  const safePeriodTab = Math.min(Math.max(0, activeVehiclePeriodTab), Math.max(0, periodsList.length - 1));
  const curPeriod = periodsList[safePeriodTab] || periodsList[0];
  const fleetList = (curPeriod?.vehicles && curPeriod.vehicles.length > 0)
    ? curPeriod.vehicles
    : ((Array.isArray(pkg.vehicles) && pkg.vehicles.length > 0) ? pkg.vehicles : (pkg.vehicle?.vehicleType ? [pkg.vehicle] : []));

  const periodGrandTransportTotal = fleetList.reduce(
    (sum, v) => sum + ((Number(v?.vehiclePrice ?? v?.price) || 0) * (parseInt(v?.quantity, 10) || 1)),
    0
  );

  const safeVehIdx = typeof selectedVehicleIdx === "number"
    ? Math.min(Math.max(0, selectedVehicleIdx), Math.max(0, fleetList.length - 1))
    : "all";

  const chosenVeh = safeVehIdx !== "all" && fleetList[safeVehIdx]
    ? fleetList[safeVehIdx]
    : fleetList[0];

  const chosenVehCost = chosenVeh
    ? (Number(chosenVeh.vehiclePrice ?? chosenVeh.price) || 0) * (parseInt(chosenVeh.quantity, 10) || 1)
    : 0;

  const activeTransportCost = safeVehIdx === "all" ? periodGrandTransportTotal : (chosenVehCost || pkg.pricing?.vehicleTotal || 0);

  // Accommodation calculation (including room multiplier)
  const selectedAccomOption = pkg.accommodationOptions?.[activeAccomTab] || pkg.accommodationOptions?.[0];
  const rawAccomNightsCost = selectedAccomOption
    ? (selectedAccomOption.nights || []).reduce((s, n) => s + ((Number(n.pricePerNight) || 0) * (Number(n.count) || 1)), 0)
    : 0;
  const activeAccomCost = rawAccomNightsCost > 0 
    ? (rawAccomNightsCost * numRooms)
    : (pkg.pricing?.accommodationTotal || 0);

  // Activities calculation
  const actTotal = pkg.pricing?.activitiesTotal || 0;

  // Base Subtotal
  const liveSubtotal = activeAccomCost + activeTransportCost + actTotal;

  // Tier Margin Resolution
  const tierMargin = Number(selectedAccomOption?.margin) > 0 
    ? Number(selectedAccomOption.margin) 
    : Number(pkg.pricing?.margin || 0);
  const tierMarginType = (Number(selectedAccomOption?.margin) > 0 && selectedAccomOption?.marginType) 
    ? selectedAccomOption.marginType 
    : (pkg.pricing?.marginType || "absolute");

  const marginAmount = tierMarginType === "percentage" ? (liveSubtotal * tierMargin) / 100 : tierMargin;
  const livePreTaxTotal = liveSubtotal + marginAmount;
  const includeGst = Boolean(pkg.pricing?.includeGst);
  const gstPercentage = Number(pkg.pricing?.gstPercentage) || 5;
  const liveGstAmount = includeGst ? Math.round((livePreTaxTotal * gstPercentage) / 100) : 0;
  const preDiscount = livePreTaxTotal + liveGstAmount;
  const discountAmount = Number(pkg.pricing?.discountAmount) || 0;
  const rawFinal = Math.max(0, preDiscount - discountAmount);
  const liveFinalPrice = Math.round(rawFinal / 100) * 100;
  const livePerPerson = pax > 0 ? Math.round(liveFinalPrice / pax) : liveFinalPrice;
  const livePerCouple = Math.round((liveFinalPrice / Math.max(1, pax)) * 2);

  // Toggle Day Expand
  const toggleDay = (idx) => {
    setExpandedDays((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const toggleAllDays = () => {
    if (allExpanded) {
      setExpandedDays({});
      setAllExpanded(false);
    } else {
      const all = {};
      (pkg.itinerary || []).forEach((_, idx) => { all[idx] = true; });
      setExpandedDays(all);
      setAllExpanded(true);
    }
  };

  // WhatsApp Share Text
  const generateWhatsAppMessage = () => {
    const text = `🌟 *${pkg.title}*\n` +
      `📍 *Destination:* ${pkg.destination || "Custom Tour"}\n` +
      `⏳ *Duration:* ${pkg.days} Days / ${pkg.nights} Nights\n` +
      `🏨 *Accommodation:* ${selectedAccomOption?.label || "Standard"}\n` +
      `🚗 *Vehicle:* ${safeVehIdx === "all" ? "All Fleet Included" : (chosenVeh?.vehicleType || "Private Cab")}\n` +
      `💰 *Package Rate:* ₹${liveFinalPrice.toLocaleString("en-IN")}\n` +
      `👥 *Per Couple:* ₹${livePerCouple.toLocaleString("en-IN")} | *Per Person:* ₹${livePerPerson.toLocaleString("en-IN")}\n` +
      (pkg.highlights?.length ? `\n✨ *Key Highlights:*\n• ` + pkg.highlights.slice(0, 4).join("\n• ") : "") +
      `\n\n_Generated via Travel CRM_`;
    return encodeURIComponent(text);
  };

  const copyShareLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  return (
    <div className="min-h-screen bg-[#f0f4f8] font-sans text-slate-900 pb-24">

      {/* ── Sticky Top Header ── */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-slate-200/80 px-4 sm:px-6 py-3 flex items-center justify-between shadow-xs print:hidden">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/dashboard/packages"
            className="flex-shrink-0 p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all"
            title="Back to Packages List"
          >
            <ArrowLeft className="w-4.5 h-4.5" />
          </Link>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Travel Package Preview</p>
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border ${
                pkg.status === "published"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-amber-50 text-amber-700 border-amber-200"
              }`}>
                {pkg.status === "published" ? "● Live" : "◌ Draft"}
              </span>
            </div>
            <h1 className="text-[14.5px] font-black text-slate-900 truncate max-w-sm sm:max-w-md">{pkg.title}</h1>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* WhatsApp Share */}
          <a
            href={`https://wa.me/?text=${generateWhatsAppMessage()}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] font-extrabold transition-all shadow-sm"
            title="Share proposal on WhatsApp"
          >
            <Share2 className="w-3.5 h-3.5" /> WhatsApp
          </a>

          {/* Print / PDF */}
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[12px] font-extrabold transition-all border border-slate-200"
            title="Print or Save PDF"
          >
            <Printer className="w-3.5 h-3.5" /> Print
          </button>

          {/* Full Quotation */}
          <Link
            href={`/dashboard/quotations/new?packageId=${id}`}
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[12px] font-black transition-all border border-indigo-200"
          >
            <FileText className="w-3.5 h-3.5" /> Full Quote
          </Link>

          {/* Quick Quote CTA */}
          <Link
            href={`/dashboard/quick-quotations/new?packageId=${id}`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-white text-[12.5px] font-black transition-all shadow-sm shadow-amber-500/20"
          >
            <Zap className="w-3.5 h-3.5" /> ⚡ Quick Quote
          </Link>

          {/* Edit */}
          <Link
            href={`/dashboard/packages/${id}/edit`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-[12.5px] font-extrabold transition-all shadow-sm"
          >
            <Pencil className="w-3.5 h-3.5" /> Edit
          </Link>
        </div>
      </header>

      {/* ── Hero Banner Section ── */}
      <div className="relative bg-slate-950 text-white overflow-hidden print:bg-white print:text-slate-900" style={{ minHeight: "440px" }}>
        {/* Cover image backdrop */}
        {pkg.coverImage?.url ? (
          <img
            src={pkg.coverImage.url}
            alt={pkg.title}
            className="absolute inset-0 w-full h-full object-cover opacity-45 filter brightness-95 print:hidden"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 opacity-90 print:hidden" />
        )}
        
        {/* Gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent print:hidden" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/60 to-transparent print:hidden" />

        <div className="relative max-w-5xl mx-auto px-5 sm:px-6 pt-10 pb-12 flex flex-col justify-end h-full">

          {/* Destination Badge & Category */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {pkg.destination && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/30 border border-indigo-400/40 text-indigo-200 text-[12px] font-extrabold backdrop-blur-md">
                <Navigation className="w-3.5 h-3.5 text-indigo-400" />
                {pkg.destination}
              </span>
            )}
            {pkg.category && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-purple-500/25 border border-purple-400/30 text-purple-200 text-[11.5px] font-bold backdrop-blur-md uppercase tracking-wider">
                <Tag className="w-3 h-3 text-purple-300" />
                {pkg.category}
              </span>
            )}
            {pkg.tags?.map((t, idx) => (
              <span key={idx} className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full bg-white/10 text-white/80 text-[11px] font-medium backdrop-blur-sm">
                #{t}
              </span>
            ))}
          </div>

          {/* Title */}
          <h1 className="text-[28px] sm:text-[40px] font-black leading-tight text-white tracking-tight mb-3.5 max-w-3xl drop-shadow-sm">
            {pkg.title}
          </h1>

          {/* Duration & Cities Route */}
          <div className="flex flex-wrap items-center gap-2.5 mb-7">
            <span className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/15 border border-white/20 text-white text-[12.5px] font-black backdrop-blur-md shadow-xs">
              <Moon className="w-3.5 h-3.5 text-purple-300" /> {pkg.nights} Nights
            </span>
            <span className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/15 border border-white/20 text-white text-[12.5px] font-black backdrop-blur-md shadow-xs">
              <Sun className="w-3.5 h-3.5 text-amber-300" /> {pkg.days} Days
            </span>
            {pkg.destinations?.map((dest, i) => (
              <span key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-500/20 border border-rose-400/30 text-rose-200 text-[12px] font-bold backdrop-blur-md">
                <MapPin className="w-3 h-3 text-rose-300" /> {dest.cityName} ({dest.nights}N)
              </span>
            ))}
          </div>

          {/* Pricing Highlight Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 max-w-3xl">
            {/* Total Package Price */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-400/30 backdrop-blur-md relative overflow-hidden">
              <div className="flex items-center justify-between mb-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-300 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> Total Price
                </p>
                {includeGst && (
                  <span className="text-[9.5px] font-black px-1.5 py-0.5 rounded bg-emerald-400/20 text-emerald-200">
                    +{gstPercentage}% GST
                  </span>
                )}
              </div>
              <p className="text-[24px] sm:text-[26px] font-black text-emerald-300 leading-none">
                ₹{liveFinalPrice.toLocaleString("en-IN")}
              </p>
              <p className="text-[10.5px] text-emerald-200/80 mt-1 font-semibold">
                For {pax} Guests • {numRooms} Room{numRooms > 1 ? "s" : ""}
              </p>
            </div>

            {/* Per Couple */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500/20 to-indigo-500/10 border border-purple-400/30 backdrop-blur-md">
              <p className="text-[10px] font-black uppercase tracking-widest text-purple-300 flex items-center gap-1 mb-1">
                <HeartHandshake className="w-3.5 h-3.5" /> Per Couple
              </p>
              <p className="text-[24px] sm:text-[26px] font-black text-purple-300 leading-none">
                ₹{livePerCouple.toLocaleString("en-IN")}
              </p>
              <p className="text-[10.5px] text-purple-200/80 mt-1 font-semibold">2 Adults rate</p>
            </div>

            {/* Per Person */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-sky-500/20 to-blue-500/10 border border-sky-400/30 backdrop-blur-md">
              <p className="text-[10px] font-black uppercase tracking-widest text-sky-300 flex items-center gap-1 mb-1">
                <Users className="w-3.5 h-3.5" /> Per Person
              </p>
              <p className="text-[24px] sm:text-[26px] font-black text-sky-300 leading-none">
                ₹{livePerPerson.toLocaleString("en-IN")}
              </p>
              <p className="text-[10.5px] text-sky-200/80 mt-1 font-semibold">Base rate / pax</p>
            </div>
          </div>

        </div>
      </div>

      {/* ── Main Container ── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-7">

        {/* Overview & Description */}
        {pkg.overview && (
          <section className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-xs">
            <h2 className="text-[15px] font-black text-slate-900 flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-xl bg-indigo-100 flex items-center justify-center">
                <Info className="w-4 h-4 text-indigo-600" />
              </div>
              Package Overview
            </h2>
            <p className="text-[13.5px] text-slate-600 leading-relaxed font-medium">
              {pkg.overview}
            </p>
          </section>
        )}

        {/* Highlights */}
        {pkg.highlights?.length > 0 && (
          <section className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-xs">
            <h2 className="text-[15px] font-black text-slate-900 flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-xl bg-amber-100 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-amber-600" />
              </div>
              Trip Highlights
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {pkg.highlights.map((h, i) => (
                <div key={i} className="flex items-center gap-2.5 px-3.5 py-2.5 bg-gradient-to-r from-amber-50/80 to-orange-50/60 border border-amber-200/70 rounded-2xl text-[12.5px] font-bold text-amber-950 shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" />
                  <span>{h}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Accommodation Categories & Hotel Stays */}
        {((pkg.accommodationOptions && pkg.accommodationOptions.length > 0) || (pkg.hotels && pkg.hotels.length > 0)) && (
          <section className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-[17px] font-black text-slate-900 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-violet-100 flex items-center justify-center">
                    <Building2 className="w-4.5 h-4.5 text-violet-600" />
                  </div>
                  Accommodations & Hotel Stays
                </h2>
                <p className="text-[12px] font-semibold text-slate-400 mt-0.5">
                  Select a category tier below to simulate live pricing with specific hotels
                </p>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Active Stays Cost</span>
                <span className="text-[19px] font-black text-violet-950">₹{activeAccomCost.toLocaleString("en-IN")}</span>
                <span className="text-[10.5px] text-slate-400 block font-semibold">({numRooms} Room{numRooms > 1 ? "s" : ""})</span>
              </div>
            </div>

            {/* Interactive Category Tier Switcher */}
            {pkg.accommodationOptions && pkg.accommodationOptions.length > 1 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 pt-1">
                {pkg.accommodationOptions.map((opt, oIdx) => {
                  const isSel = activeAccomTab === oIdx;
                  const optNightsCost = (opt.nights || []).reduce((s, n) => s + ((Number(n.pricePerNight) || 0) * (Number(n.count) || 1)), 0);
                  const optTotal = optNightsCost * numRooms;
                  return (
                    <button
                      key={oIdx}
                      type="button"
                      onClick={() => setActiveAccomTab(oIdx)}
                      className={`p-3 rounded-2xl border text-left transition-all relative ${
                        isSel
                          ? "bg-violet-600 border-violet-600 text-white shadow-md shadow-violet-500/20 scale-[1.02]"
                          : "bg-slate-50/70 border-slate-200/90 text-slate-800 hover:bg-violet-50/50 hover:border-violet-300"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[12.5px] font-black truncate">{opt.label || `Option ${oIdx + 1}`}</span>
                        {isSel && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />}
                      </div>
                      <p className={`text-[11px] font-bold ${isSel ? "text-violet-200" : "text-slate-500"}`}>
                        ₹{optTotal.toLocaleString("en-IN")}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Active Selected Accommodations Legs List */}
            {(() => {
              const activeOpt = selectedAccomOption;
              const legs = activeOpt?.nights || [];
              if (legs.length === 0) {
                return (
                  <p className="text-[13px] text-slate-400 italic py-4 text-center">
                    No hotel details recorded for this category.
                  </p>
                );
              }
              return (
                <div className="space-y-3 pt-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {legs.map((leg, lIdx) => (
                      <div
                        key={lIdx}
                        className="p-4.5 rounded-2xl bg-slate-50/80 border border-slate-200/80 hover:border-violet-200 transition-all flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span className="px-2.5 py-0.5 rounded-full bg-violet-100 text-violet-800 text-[11px] font-black">
                              Night {leg.nightNumber || lIdx + 1}{leg.count > 1 ? `–${(leg.nightNumber || lIdx + 1) + leg.count - 1} (${leg.count}N)` : ""}
                            </span>
                            {leg.rating && (
                              <span className="flex items-center gap-1 text-[11px] font-extrabold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                                <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                                {leg.rating} Star
                              </span>
                            )}
                          </div>

                          <h3 className="text-[14.5px] font-black text-slate-900 leading-snug">
                            {leg.hotelName || "Standard Hotel"}
                          </h3>
                          <p className="text-[12px] font-semibold text-slate-500 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            {leg.cityName || pkg.destination || "Destination"}
                          </p>

                          <div className="flex flex-wrap items-center gap-1.5 mt-3">
                            {leg.roomType && (
                              <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 text-[11px] font-bold">
                                🛏️ {leg.roomType}
                              </span>
                            )}
                            <span className="px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold">
                              🍽️ {MEAL_PLAN_LABELS[leg.mealPlan] || leg.mealPlan || "Room Only"}
                            </span>
                          </div>
                        </div>

                        {leg.pricePerNight > 0 && (
                          <div className="pt-3 mt-3 border-t border-slate-200/70 flex items-center justify-between text-right">
                            <span className="text-[11px] font-semibold text-slate-400">Nightly Rate</span>
                            <div>
                              <span className="text-[13.5px] font-black text-slate-900">
                                ₹{Number(leg.pricePerNight).toLocaleString("en-IN")}
                              </span>
                              <span className="text-[10px] text-slate-400 font-bold ml-1">/ night</span>
                            </div>
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

        {/* Day-by-Day Itinerary */}
        {pkg.itinerary?.length > 0 && (
          <section className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-[17px] font-black text-slate-900 flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center">
                  <Sun className="w-4.5 h-4.5 text-indigo-600" />
                </div>
                Day-by-Day Itinerary
                <span className="text-[11px] font-bold text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded-full">
                  {pkg.itinerary.length} Days
                </span>
              </h2>

              <button
                type="button"
                onClick={toggleAllDays}
                className="text-[12px] font-extrabold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-xl transition-all"
              >
                {allExpanded ? "Collapse All" : "Expand All"}
              </button>
            </div>

            {/* Timeline */}
            <div className="relative space-y-3.5">
              {pkg.itinerary.map((day, i) => {
                const isOpen = Boolean(expandedDays[i]);
                return (
                  <div
                    key={i}
                    className={`rounded-2xl border transition-all overflow-hidden ${
                      isOpen ? "bg-white border-indigo-200 shadow-sm" : "bg-slate-50/70 border-slate-200/80 hover:bg-slate-50"
                    }`}
                  >
                    {/* Day Header Trigger */}
                    <button
                      type="button"
                      onClick={() => toggleDay(i)}
                      className="w-full p-4 sm:p-4.5 flex items-center justify-between gap-3 text-left transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="flex-shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white font-black text-[13px] flex items-center justify-center shadow-xs">
                          D{day.dayNumber || i + 1}
                        </span>
                        <div className="min-w-0">
                          <h3 className="text-[14px] font-black text-slate-900 truncate">
                            {day.title || `Day ${day.dayNumber || i + 1}`}
                          </h3>
                          {day.location && (
                            <p className="text-[11.5px] font-bold text-slate-400 flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />
                              {day.location}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        {/* Meal Plan Badges */}
                        <div className="hidden sm:flex items-center gap-1">
                          {day.meals?.breakfast && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
                              Breakfast
                            </span>
                          )}
                          {day.meals?.lunch && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-orange-50 text-orange-700 border border-orange-200">
                              Lunch
                            </span>
                          )}
                          {day.meals?.dinner && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
                              Dinner
                            </span>
                          )}
                        </div>

                        {isOpen ? (
                          <ChevronUp className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                    </button>

                    {/* Day Expanded Details */}
                    {isOpen && (
                      <div className="px-5 pb-5 pt-1 border-t border-slate-100 space-y-4">
                        {/* Description */}
                        {day.description && (
                          <div
                            className="text-[13px] text-slate-700 leading-relaxed itinerary-description pt-2"
                            dangerouslySetInnerHTML={{ __html: day.description }}
                          />
                        )}

                        {/* Activities list */}
                        {day.activities?.length > 0 && (
                          <div className="space-y-2 pt-1">
                            <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                              Included Activities & Sightseeing
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {day.activities.map((act, aIdx) => (
                                <div
                                  key={aIdx}
                                  className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start justify-between gap-2"
                                >
                                  <div>
                                    <p className="text-[12.5px] font-black text-slate-800 flex items-center gap-1.5">
                                      <Camera className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                                      {act.activityName || act.name || "Sightseeing Activity"}
                                    </p>
                                    {act.timing && (
                                      <span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-slate-400 mt-1">
                                        <Clock3 className="w-3 h-3" /> {act.timing}
                                      </span>
                                    )}
                                  </div>
                                  {act.price > 0 && (
                                    <span className="text-[12px] font-black text-slate-700">
                                      ₹{Number(act.price).toLocaleString("en-IN")}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Vehicle & Transport Fleet */}
        {((pkg.vehiclePeriods && pkg.vehiclePeriods.length > 0) || (pkg.vehicles && pkg.vehicles.length > 0) || pkg.vehicle?.vehicleType) && (() => {
          return (
            <section className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <h2 className="text-[17px] font-black text-slate-900 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-sky-100 flex items-center justify-center">
                      <Car className="w-4.5 h-4.5 text-sky-600" />
                    </div>
                    Vehicle &amp; Transport Fleet
                  </h2>
                  <p className="text-[12px] font-semibold text-slate-400 mt-0.5">
                    Select a vehicle option or season to calculate package rates in real time
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Active Transport Cost</span>
                  <span className="text-[19px] font-black text-sky-950">₹{activeTransportCost.toLocaleString("en-IN")}</span>
                </div>
              </div>

              {/* Date Period Tabs */}
              {periodsList.length > 1 && (
                <div className="flex items-center gap-2 flex-wrap pt-1">
                  <span className="text-[11.5px] font-bold text-slate-500 mr-1">Travel Season:</span>
                  {periodsList.map((p, pIdx) => {
                    const isSel = safePeriodTab === pIdx;
                    return (
                      <button
                        key={pIdx}
                        type="button"
                        onClick={() => {
                          setActiveVehiclePeriodTab(pIdx);
                          setSelectedVehicleIdx(0);
                        }}
                        className={`px-3 py-1.5 rounded-xl text-[12px] font-bold border transition-all flex items-center gap-1.5 ${
                          isSel
                            ? "bg-sky-600 text-white border-sky-600 shadow-sm"
                            : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                        }`}
                      >
                        <span>{p.name || `Period ${pIdx + 1}`}</span>
                        {(p.startDate || p.endDate) && (
                          <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                            isSel ? "bg-sky-700 text-sky-100" : "bg-slate-200 text-slate-600"
                          }`}>
                            {p.startDate ? p.startDate.slice(5) : ""}
                            {p.startDate && p.endDate ? " → " : ""}
                            {p.endDate ? p.endDate.slice(5) : ""}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Selectable Vehicle Options Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 pt-1">
                {fleetList.map((veh, vIdx) => {
                  const qty = Math.max(1, parseInt(veh.quantity, 10) || 1);
                  const price = Number(veh.vehiclePrice ?? veh.price) || 0;
                  const rowSubtotal = price * qty;
                  const isSel = safeVehIdx === vIdx;
                  const imgPath = getVehicleImage(veh.vehicleType);

                  return (
                    <button
                      key={vIdx}
                      type="button"
                      onClick={() => setSelectedVehicleIdx(vIdx)}
                      className={`flex flex-col justify-between p-4.5 rounded-2xl border text-left transition-all relative ${
                        isSel
                          ? "bg-gradient-to-br from-sky-600 via-sky-700 to-blue-700 border-sky-600 text-white shadow-md shadow-sky-500/20 scale-[1.01]"
                          : "bg-white border-slate-200/90 text-slate-800 hover:border-sky-300 hover:bg-sky-50/40"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[14px] font-black">
                            {qty > 1 ? `${qty}x ` : ""}{veh.vehicleType || "Sedan"}
                          </span>
                          {veh.model && (
                            <span className={`text-[10.5px] font-bold px-2 py-0.5 rounded-full ${
                              isSel ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                            }`}>
                              {veh.model}
                            </span>
                          )}
                        </div>
                        {isSel ? (
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-300 animate-pulse shadow-sm" />
                        ) : (
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Click to Select</span>
                        )}
                      </div>

                      <div className="h-16 w-full flex items-center justify-center my-1">
                        <img
                          src={imgPath}
                          alt={veh.vehicleType || "Vehicle"}
                          className="max-h-14 max-w-full object-contain filter drop-shadow-sm"
                        />
                      </div>

                      <div className="space-y-1 text-[11px] my-2">
                        <div className="flex justify-between">
                          <span className={isSel ? "text-sky-100" : "text-slate-500"}>Rate:</span>
                          <span className="font-bold">₹{price.toLocaleString("en-IN")} / cab</span>
                        </div>
                        <div className="flex justify-between">
                          <span className={isSel ? "text-sky-100" : "text-slate-500"}>Capacity:</span>
                          <span className="font-bold">{veh.seats || 4} Guests • {veh.acType || "AC"}</span>
                        </div>
                        {veh.notes && (
                          <p className={`text-[10.5px] truncate pt-0.5 ${isSel ? "text-sky-100" : "text-slate-400"}`}>
                            📌 {veh.notes}
                          </p>
                        )}
                      </div>

                      <div className="pt-2 mt-1 border-t border-white/20 flex items-center justify-between">
                        <span className={`text-[10px] font-bold uppercase ${isSel ? "text-sky-100" : "text-slate-400"}`}>
                          Transport Subtotal
                        </span>
                        <span className="text-[15px] font-black">₹{rowSubtotal.toLocaleString("en-IN")}</span>
                      </div>
                    </button>
                  );
                })}

                {fleetList.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setSelectedVehicleIdx("all")}
                    className={`flex flex-col justify-between p-4.5 rounded-2xl border text-left transition-all ${
                      safeVehIdx === "all"
                        ? "bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 border-indigo-600 text-white shadow-md shadow-indigo-500/20 scale-[1.01]"
                        : "bg-white border-slate-200/90 text-slate-800 hover:border-indigo-300 hover:bg-white/80"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-2">
                      <span className="text-[14px] font-black">All Fleet Combined</span>
                      {safeVehIdx === "all" && (
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-300 animate-pulse" />
                      )}
                    </div>
                    <p className={`text-[11.5px] my-auto ${safeVehIdx === "all" ? "text-indigo-100" : "text-slate-500"}`}>
                      Full combined package price for all {fleetList.length} transport vehicles
                    </p>
                    <div className="pt-2 mt-3 border-t border-white/20 flex items-center justify-between">
                      <span className={`text-[10px] font-bold uppercase ${safeVehIdx === "all" ? "text-indigo-100" : "text-slate-400"}`}>
                        Combined Total
                      </span>
                      <span className="text-[15px] font-black">₹{periodGrandTransportTotal.toLocaleString("en-IN")}</span>
                    </div>
                  </button>
                )}
              </div>
            </section>
          );
        })()}

        {/* Pricing Breakdown & Inclusions */}
        {pkg.pricing && (
          <section className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-xs space-y-6">
            <h2 className="text-[17px] font-black text-slate-900 flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center">
                <IndianRupee className="w-4.5 h-4.5 text-emerald-600" />
              </div>
              Live Pricing Breakdown
            </h2>

            {/* Cost breakdown table */}
            <div className="rounded-2xl border border-slate-200/80 overflow-hidden text-[13px] shadow-2xs">
              <div className="flex items-center justify-between px-5 py-3.5 bg-violet-50/60">
                <span className="font-semibold text-slate-700">
                  🏨 Accommodation ({selectedAccomOption?.label || "Standard"} • {numRooms} Room{numRooms > 1 ? "s" : ""})
                </span>
                <span className="font-extrabold text-slate-900">₹{activeAccomCost.toLocaleString("en-IN")}</span>
              </div>

              <div className="flex items-center justify-between px-5 py-3.5 bg-sky-50/60 border-t border-slate-100">
                <span className="font-semibold text-slate-700">
                  🚗 Vehicle Transport ({safeVehIdx === "all" ? "All Fleet" : (chosenVeh?.vehicleType || "Sedan")})
                </span>
                <span className="font-extrabold text-slate-900">₹{activeTransportCost.toLocaleString("en-IN")}</span>
              </div>

              {actTotal > 0 && (
                <div className="flex items-center justify-between px-5 py-3.5 bg-rose-50/60 border-t border-slate-100">
                  <span className="font-semibold text-slate-700">⚡ Activities Cost</span>
                  <span className="font-extrabold text-slate-900">₹{actTotal.toLocaleString("en-IN")}</span>
                </div>
              )}

              <div className="flex items-center justify-between px-5 py-3.5 bg-slate-100 border-t border-slate-100">
                <span className="font-extrabold text-slate-900">📊 Base Net Subtotal</span>
                <span className="font-extrabold text-slate-900 text-[14.5px]">₹{liveSubtotal.toLocaleString("en-IN")}</span>
              </div>

              {marginAmount > 0 && (
                <div className="flex items-center justify-between px-5 py-3.5 bg-amber-50/60 border-t border-slate-100">
                  <span className="font-semibold text-slate-700">
                    📈 Profit Margin ({tierMarginType === "percentage" ? `${tierMargin}%` : "Absolute"})
                  </span>
                  <span className="font-extrabold text-amber-700">+ ₹{Math.round(marginAmount).toLocaleString("en-IN")}</span>
                </div>
              )}

              {discountAmount > 0 && (
                <div className="flex items-center justify-between px-5 py-3.5 bg-rose-50/60 border-t border-slate-100">
                  <span className="font-semibold text-slate-700">
                    🏷️ Special Discount {pkg.pricing?.discountReason ? `(${pkg.pricing.discountReason})` : ""}
                  </span>
                  <span className="font-extrabold text-rose-600">- ₹{discountAmount.toLocaleString("en-IN")}</span>
                </div>
              )}

              {includeGst && liveGstAmount > 0 && (
                <div className="flex items-center justify-between px-5 py-3.5 bg-emerald-50/60 border-t border-slate-100">
                  <span className="font-semibold text-slate-700">
                    🏛️ Goods & Services Tax (GST {gstPercentage}%)
                  </span>
                  <span className="font-extrabold text-emerald-700">+ ₹{liveGstAmount.toLocaleString("en-IN")}</span>
                </div>
              )}

              <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white">
                <span className="font-black text-[15px] flex items-center gap-2">
                  <Sparkles className="w-4 h-4" /> Grand Total Package Price
                </span>
                <span className="font-black text-[21px]">₹{liveFinalPrice.toLocaleString("en-IN")}</span>
              </div>
            </div>

            {/* Rate cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/20">
                <p className="text-[10.5px] font-black uppercase tracking-widest text-emerald-100 flex items-center gap-1.5 mb-1.5">
                  <HeartHandshake className="w-4 h-4" /> Per Couple Rate
                </p>
                <p className="text-[28px] font-black leading-tight">₹{livePerCouple.toLocaleString("en-IN")}</p>
                <p className="text-[11.5px] text-emerald-100/80 mt-1">Calculated for 2 persons</p>
              </div>

              <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/20">
                <p className="text-[10.5px] font-black uppercase tracking-widest text-indigo-100 flex items-center gap-1.5 mb-1.5">
                  <Users className="w-4 h-4" /> Per Person Rate
                </p>
                <p className="text-[28px] font-black leading-tight">₹{livePerPerson.toLocaleString("en-IN")}</p>
                <p className="text-[11.5px] text-indigo-100/80 mt-1">Per pax for {pax} guests</p>
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

        {/* Instructions & Policies */}
        {pkg.instructions?.length > 0 && (
          <section className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-xs space-y-5">
            <h2 className="text-[16px] font-black text-slate-900 flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-purple-100 flex items-center justify-center">
                <Shield className="w-4 h-4 text-purple-600" />
              </div>
              Instructions &amp; Policy Terms
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

      {/* ── Sticky Floating Bottom Bar ── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-slate-200/90 py-3 px-4 sm:px-8 shadow-lg flex items-center justify-between print:hidden">
        <div className="flex items-center gap-4">
          <div>
            <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block">Live Selected Total</span>
            <div className="flex items-baseline gap-2">
              <span className="text-[20px] font-black text-slate-900">₹{liveFinalPrice.toLocaleString("en-IN")}</span>
              <span className="text-[11.5px] font-bold text-slate-500">
                ({selectedAccomOption?.label || "Standard"} • {chosenVeh?.vehicleType || "Cab"})
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/dashboard/quick-quotations/new?packageId=${id}`}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-[13px] font-black transition-all shadow-md shadow-amber-500/20"
          >
            <Zap className="w-4 h-4" /> ⚡ Quick Quote
          </Link>
          <Link
            href={`/dashboard/packages/${id}/edit`}
            className="hidden sm:flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-[13px] font-extrabold transition-all"
          >
            <Pencil className="w-4 h-4" /> Edit Package
          </Link>
        </div>
      </div>

      {/* ── Stylesheet for Itinerary Prose & Print Layout ── */}
      <style jsx global>{`
        .itinerary-description p { margin: 0 0 0.5em; }
        .itinerary-description ul { list-style: disc; padding-left: 1.4em; margin: 0.3em 0; }
        .itinerary-description ol { list-style: decimal; padding-left: 1.4em; margin: 0.3em 0; }
        .itinerary-description li { margin: 0.15em 0; }
        .itinerary-description strong { font-weight: 700; }
        .itinerary-description em { font-style: italic; }
        .itinerary-description u { text-decoration: underline; }
        .itinerary-description p:last-child { margin-bottom: 0; }

        @media print {
          body { background: white !important; color: black !important; }
          header, .print\\:hidden { display: none !important; }
          .shadow-xs, .shadow-sm, .shadow-md, .shadow-lg { box-shadow: none !important; }
          .border { border-color: #e2e8f0 !important; }
          .max-w-5xl { max-width: 100% !important; padding: 0 !important; margin: 0 !important; }
          .rounded-3xl, .rounded-2xl { border-radius: 8px !important; }
          @page { margin: 1.2cm; size: A4; }
        }
      `}</style>
    </div>
  );
}
