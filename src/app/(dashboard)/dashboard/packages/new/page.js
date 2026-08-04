"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Plus, Trash2, Loader2, AlertCircle, ChevronRight,
  MapPin, Moon, Sun, Check, Sparkles, Layers, FileText, Compass,
  Car, IndianRupee, ShieldCheck, Eye, CheckCircle2, Navigation,
} from "lucide-react";
import Link from "next/link";
import ItineraryBuilder from "@/components/packages/ItineraryBuilder";
import AccommodationPanel from "@/components/packages/AccommodationPanel";
import VehiclePanel from "@/components/packages/VehiclePanel";
import PricingPanel from "@/components/packages/PricingPanel";
import InstructionPanel from "@/components/packages/InstructionPanel";

const SECTIONS = [
  { id: "basics", label: "Basics", icon: Compass, desc: "Title & Route" },
  { id: "itinerary", label: "Itinerary", icon: Sun, desc: "Day by Day" },
  { id: "accommodation", label: "Accommodation", icon: Layers, desc: "Hotel Tiers" },
  { id: "vehicle", label: "Vehicle", icon: Car, desc: "Transport" },
  { id: "pricing", label: "Pricing", icon: IndianRupee, desc: "Margins & Cost" },
  { id: "instructions", label: "Instructions", icon: FileText, desc: "Terms & Rules" },
  { id: "review", label: "Review", icon: ShieldCheck, desc: "Final Publish" },
];

const DEFAULT_FORM = {
  title: "",
  destinations: [],
  nights: 0,
  days: 0,
  highlights: [],
  coverImage: null,
  itinerary: [],
  accommodationOptions: [],
  vehicle: { vehicleType: "SUV", model: "", seats: 6, acType: "AC", vehiclePrice: 0, notes: "" },
  pricing: {
    selectedOptionIndex: 0,
    accommodationTotal: 0,
    vehicleTotal: 0,
    subtotal: 0,
    marginType: "absolute",
    margin: 0,
    finalPrice: 0,
    perPersonPrice: 0,
    numberOfPersons: 1,
    currency: "INR",
    includes: [],
    excludes: [],
  },
  instructions: [],
  status: "draft",
};

export default function NewPackagePage() {
  const router = useRouter();
  const [currentSection, setCurrentSection] = useState("basics");
  const [form, setForm] = useState(DEFAULT_FORM);
  const [newHighlight, setNewHighlight] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [cities, setCities] = useState([]);
  const [loadingCities, setLoadingCities] = useState(true);

  // Fetch cities
  useEffect(() => {
    fetch("/api/accommodation/cities")
      .then((r) => r.json())
      .then((data) => setCities(data.cities || []))
      .catch((err) => console.error("Failed to fetch cities:", err))
      .finally(() => setLoadingCities(false));
  }, []);

  function updateForm(patch) {
    setForm((prev) => ({ ...prev, ...patch }));
  }

  // ── Destination helpers ──
  function addDestination() {
    updateForm({
      destinations: [...form.destinations, { cityId: "", cityName: "", state: "", nights: 1 }],
    });
  }

  function updateDestination(idx, patch) {
    const updated = form.destinations.map((d, i) => (i === idx ? { ...d, ...patch } : d));
    const totalNights = updated.reduce((s, d) => s + (d.nights || 0), 0);
    updateForm({
      destinations: updated,
      nights: totalNights,
      days: totalNights > 0 ? totalNights + 1 : 0,
    });
  }

  function removeDestination(idx) {
    const updated = form.destinations.filter((_, i) => i !== idx);
    const totalNights = updated.reduce((s, d) => s + (d.nights || 0), 0);
    updateForm({
      destinations: updated,
      nights: totalNights,
      days: totalNights > 0 ? totalNights + 1 : 0,
      accommodationOptions: [],
    });
  }

  function handleCitySelect(idx, cityId) {
    const city = cities.find((c) => c._id === cityId);
    updateDestination(idx, {
      cityId,
      cityName: city ? city.name : "",
      state: city ? city.state || "" : "",
    });
  }

  function handleDestNightsChange(idx, nights) {
    const n = Math.max(1, Math.min(30, parseInt(nights, 10) || 1));
    updateDestination(idx, { nights: n });
  }

  function addHighlight() {
    const trimmed = newHighlight.trim();
    if (!trimmed) return;
    updateForm({ highlights: [...form.highlights, trimmed] });
    setNewHighlight("");
  }

  function removeHighlight(idx) {
    updateForm({ highlights: form.highlights.filter((_, i) => i !== idx) });
  }

  function goTo(sectionId) {
    setCurrentSection(sectionId);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const currentStepIdx = SECTIONS.findIndex((s) => s.id === currentSection);

  function nextSection() {
    if (currentStepIdx < SECTIONS.length - 1) goTo(SECTIONS[currentStepIdx + 1].id);
  }

  function prevSection() {
    if (currentStepIdx > 0) goTo(SECTIONS[currentStepIdx - 1].id);
  }

  // Computed totals
  const selectedOptIdx = form.pricing?.selectedOptionIndex || 0;
  const accommodationTotal = useMemo(() => {
    const opt = (form.accommodationOptions || [])[selectedOptIdx];
    return opt ? (opt.nights || []).reduce((s, n) => s + (n.pricePerNight || 0), 0) : 0;
  }, [form.accommodationOptions, selectedOptIdx]);

  const vehicleTotal = useMemo(() => form.vehicle?.vehiclePrice || 0, [form.vehicle]);

  const destinationSummary = form.destinations
    .filter((d) => d.cityName)
    .map((d) => `${d.cityName} (${d.nights}N)`)
    .join(" → ");

  async function handleSubmit(status = "draft") {
    setError("");
    if (form.destinations.length === 0 || !form.destinations.some((d) => d.cityId)) {
      setError("Please add at least one destination city.");
      setCurrentSection("basics");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        status,
        destination: destinationSummary,
      };
      const res = await fetch("/api/packages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save package");
      router.push(`/dashboard/packages/${data.package._id}`);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  const inputCls =
    "w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white text-[13.5px] font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-600 transition-all shadow-xs";

  return (
    <div className="min-h-screen bg-[#f1f5f9] text-slate-900 font-sans pb-24">
      {/* ── Luxury Gradient Navbar ── */}
      <header className="sticky top-0 z-30 bg-slate-900 text-white border-b border-slate-800 px-6 py-4 flex items-center justify-between shadow-lg shadow-slate-900/20">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/packages"
            className="p-2.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-all border border-slate-700/60"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="h-6 w-px bg-slate-800" />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-300 bg-indigo-500/20 px-2.5 py-0.5 rounded-full border border-indigo-500/30">
                Luxury Package Builder
              </span>
              <span className="text-[11px] font-semibold text-slate-400">
                Step {currentStepIdx + 1} of {SECTIONS.length}
              </span>
            </div>
            <h1 className="text-[17px] font-black text-white leading-snug mt-0.5">
              {form.title || "Untitled Travel Package"}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => handleSubmit("draft")}
            disabled={saving}
            className="px-4.5 py-2.5 rounded-2xl border border-slate-700 text-[13px] font-bold text-slate-200 bg-slate-800/60 hover:bg-slate-800 hover:text-white transition-all shadow-xs disabled:opacity-50"
          >
            Save Draft
          </button>
          <button
            type="button"
            onClick={() => handleSubmit("published")}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-600 hover:from-indigo-600 hover:to-pink-700 text-white text-[13px] font-extrabold shadow-lg shadow-indigo-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Publish Package
          </button>
        </div>
      </header>

      {/* Animated Glowing Progress Bar */}
      <div className="w-full bg-slate-800 h-1.5 overflow-hidden">
        <div
          className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 h-1.5 transition-all duration-300 ease-out shadow-[0_0_12px_rgba(168,85,247,0.8)]"
          style={{ width: `${((currentStepIdx + 1) / SECTIONS.length) * 100}%` }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ── Floating Visual Stepper Card ── */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-4 mb-8 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.06)] overflow-x-auto scrollbar-none">
          <div className="flex items-center justify-between min-w-[760px]">
            {SECTIONS.map((sec, i) => {
              const Icon = sec.icon;
              const isActive = sec.id === currentSection;
              const isPast = currentStepIdx > i;

              return (
                <div key={sec.id} className="flex items-center flex-1 last:flex-initial">
                  <button
                    type="button"
                    onClick={() => goTo(sec.id)}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl transition-all ${
                      isActive
                        ? "bg-gradient-to-r from-indigo-600 via-purple-600 to-violet-600 text-white shadow-md shadow-indigo-500/25 font-bold scale-[1.03]"
                        : isPast
                        ? "text-slate-800 hover:bg-slate-100 font-semibold"
                        : "text-slate-400 hover:bg-slate-50 font-medium"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center text-[12px] font-extrabold transition-all ${
                        isActive
                          ? "bg-white/20 text-white shadow-inner"
                          : isPast
                          ? "bg-indigo-50 text-indigo-700"
                          : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      {isPast ? <Check className="w-4 h-4 stroke-[3]" /> : <Icon className="w-4 h-4" />}
                    </div>
                    <div className="text-left">
                      <p className="text-[13px] leading-tight">{sec.label}</p>
                      <p
                        className={`text-[10px] ${
                          isActive ? "text-indigo-100" : isPast ? "text-slate-500" : "text-slate-400"
                        }`}
                      >
                        {sec.desc}
                      </p>
                    </div>
                  </button>

                  {i < SECTIONS.length - 1 && (
                    <div
                      className={`h-0.5 flex-1 mx-2 transition-colors ${
                        isPast ? "bg-indigo-500/40" : "bg-slate-100"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Error Notification Banner */}
        {error && (
          <div className="flex items-center gap-3 px-5 py-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-[13.5px] font-bold mb-6 shadow-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600" />
            {error}
          </div>
        )}

        {/* ── Two-Column Main Content & Live Sidebar ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Form (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* ═══════════ BASICS ═══════════ */}
            {currentSection === "basics" && (
              <div className="bg-white rounded-3xl border border-slate-200/90 p-7 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] space-y-6">
                <SectionHeader
                  title="Package Essentials"
                  description="Give your package a catchy title and select your multi-city route."
                />

                {/* Title */}
                <div>
                  <label className="block text-[12.5px] font-extrabold text-slate-800 uppercase tracking-wider mb-2">
                    Package Title *
                  </label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => updateForm({ title: e.target.value })}
                    placeholder="e.g. 4 Night 5 Day Luxury Himachal Experience"
                    className={inputCls}
                    required
                  />
                </div>

                {/* Multi-Destination Builder */}
                <div className="pt-2">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-[12.5px] font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                      <MapPin className="w-4.5 h-4.5 text-rose-500" />
                      Route Destinations & Nights Stay *
                    </label>
                    {form.destinations.length > 0 && (
                      <span className="text-[11.5px] font-black px-3 py-1 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-xs">
                        {form.nights} Nights / {form.days} Days Total
                      </span>
                    )}
                  </div>

                  {form.destinations.length === 0 && (
                    <div className="text-center p-8 border-2 border-dashed border-slate-200/90 rounded-2xl bg-slate-50/60">
                      <Compass className="w-8 h-8 text-indigo-500 mx-auto mb-2" />
                      <p className="text-[14px] text-slate-800 font-extrabold">No Route Added</p>
                      <p className="text-[12px] text-slate-500 mt-1 max-w-sm mx-auto">
                        Add destination cities (e.g. Manali 2N, Shimla 2N). Hotels will automatically be fetched!
                      </p>
                    </div>
                  )}

                  <div className="space-y-3.5 mb-4">
                    {form.destinations.map((dest, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-3 p-4 rounded-2xl border border-slate-200/90 bg-slate-50/60 hover:bg-white hover:border-indigo-300 hover:shadow-md transition-all"
                      >
                        <span className="flex-shrink-0 w-8 h-8 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white text-[13px] font-black flex items-center justify-center shadow-sm">
                          {idx + 1}
                        </span>

                        {/* City select */}
                        <div className="flex-1 min-w-0">
                          {loadingCities ? (
                            <div className="flex items-center gap-2 text-[12px] text-slate-400">
                              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading cities…
                            </div>
                          ) : (
                            <select
                              value={dest.cityId || ""}
                              onChange={(e) => handleCitySelect(idx, e.target.value)}
                              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-[13.5px] font-bold bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all shadow-xs"
                            >
                              <option value="">Select destination city…</option>
                              {cities.map((c) => (
                                <option key={c._id} value={c._id}>
                                  {c.name}
                                  {c.state ? `, ${c.state}` : ""}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>

                        {/* Nights */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Moon className="w-4 h-4 text-purple-600" />
                          <input
                            type="number"
                            min={1}
                            max={30}
                            value={dest.nights}
                            onWheel={(e) => e.target.blur()}
                            onChange={(e) => handleDestNightsChange(idx, e.target.value)}
                            className="w-16 px-3 py-2 rounded-xl border border-slate-200 text-[13.5px] font-black text-center bg-white text-slate-900 focus:outline-none focus:border-indigo-600 transition-all"
                          />
                          <span className="text-[12px] text-slate-600 font-extrabold">Nights</span>
                        </div>

                        {/* Delete */}
                        <button
                          type="button"
                          onClick={() => removeDestination(idx)}
                          className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors flex-shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={addDestination}
                    className="w-full py-3.5 rounded-2xl text-[13px] font-black text-indigo-700 bg-indigo-50 hover:bg-indigo-100/80 border border-indigo-200 transition-all flex items-center justify-center gap-2 shadow-xs"
                  >
                    <Plus className="w-4.5 h-4.5" /> Add Destination City
                  </button>
                </div>

                {/* Highlights */}
                <div className="pt-2 border-t border-slate-100">
                  <label className="block text-[12.5px] font-extrabold text-slate-800 uppercase tracking-wider mb-2">
                    Package Highlights & Key Features
                  </label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {form.highlights.map((h, i) => (
                      <span
                        key={i}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-violet-100 via-indigo-100 to-purple-100 border border-indigo-200 rounded-full text-[12px] text-indigo-900 font-extrabold shadow-xs"
                      >
                        ✨ {h}
                        <button
                          type="button"
                          onClick={() => removeHighlight(i)}
                          className="text-indigo-400 hover:text-indigo-900 ml-1 font-black"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newHighlight}
                      onChange={(e) => setNewHighlight(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === "Enter" && (e.preventDefault(), addHighlight())
                      }
                      placeholder="e.g. Candlelight Dinner, Paragliding included…"
                      className={inputCls}
                    />
                    <button
                      type="button"
                      onClick={addHighlight}
                      className="px-5 py-3 rounded-2xl bg-slate-900 text-white text-[13px] font-extrabold hover:bg-slate-800 transition-all shadow-xs"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ═══════════ ITINERARY ═══════════ */}
            {currentSection === "itinerary" && (
              <div className="space-y-6">
                <SectionHeader
                  title="Day-by-Day Itinerary"
                  description={`Plan daily activities and sightseeings for ${form.days || 1} days.`}
                />
                <ItineraryBuilder
                  days={form.days || 1}
                  value={form.itinerary}
                  onChange={(itinerary) => updateForm({ itinerary })}
                  packageId={null}
                />
              </div>
            )}

            {/* ═══════════ ACCOMMODATION ═══════════ */}
            {currentSection === "accommodation" && (
              <div className="space-y-6">
                <SectionHeader
                  title="Accommodation Categories"
                  description="Create option categories (e.g. Premium Resort, Deluxe Hotel) with pre-selected hotels."
                />
                <AccommodationPanel
                  destinations={form.destinations}
                  accommodationOptions={form.accommodationOptions}
                  onChange={(accommodationOptions) => updateForm({ accommodationOptions })}
                />
              </div>
            )}

            {/* ═══════════ VEHICLE ═══════════ */}
            {currentSection === "vehicle" && (
              <div className="space-y-6">
                <SectionHeader
                  title="Transport Fleet & Vehicle Pricing"
                  description="Choose transport vehicle category and specify full transport pricing."
                />
                <VehiclePanel value={form.vehicle} onChange={(vehicle) => updateForm({ vehicle })} />
              </div>
            )}

            {/* ═══════════ PRICING ═══════════ */}
            {currentSection === "pricing" && (
              <div className="space-y-6">
                <SectionHeader
                  title="Pricing & Margin Calculator"
                  description="Select base accommodation option, add profit margin, and calculate per person rate."
                />
                <PricingPanel
                  value={form.pricing}
                  onChange={(pricing) => updateForm({ pricing })}
                  accommodationOptions={form.accommodationOptions}
                  vehicleTotal={vehicleTotal}
                />
              </div>
            )}

            {/* ═══════════ INSTRUCTIONS ═══════════ */}
            {currentSection === "instructions" && (
              <div className="space-y-6">
                <SectionHeader
                  title="Package Instructions & Terms"
                  description="Add travel advisory points or paste multi-line instructions directly into any box."
                />
                <InstructionPanel
                  value={form.instructions}
                  onChange={(instructions) => updateForm({ instructions })}
                />
              </div>
            )}

            {/* ═══════════ REVIEW ═══════════ */}
            {currentSection === "review" && (
              <div className="space-y-6">
                <SectionHeader
                  title="Package Summary & Final Review"
                  description="Review your travel package details before saving or publishing."
                />
                <div className="bg-white rounded-3xl border border-slate-200/90 p-7 shadow-xs space-y-4">
                  <ReviewRow label="Package Title" value={form.title || "—"} />
                  <ReviewRow label="Route Destinations" value={destinationSummary || "—"} />
                  <ReviewRow
                    label="Duration"
                    value={form.nights > 0 ? `${form.nights} Nights / ${form.days} Days` : "—"}
                  />
                  <ReviewRow label="Status" value={form.status} />
                  <ReviewRow
                    label="Itinerary"
                    value={`${form.itinerary.filter((d) => d.title).length} of ${form.days} days filled`}
                  />
                  <ReviewRow
                    label="Accom. Tiers"
                    value={`${form.accommodationOptions.length} category option(s)`}
                  />
                  {form.accommodationOptions.map((opt, i) => (
                    <ReviewRow
                      key={i}
                      label={`  └ ${opt.label}`}
                      value={`₹${(opt.nights || [])
                        .reduce((s, n) => s + (n.pricePerNight || 0), 0)
                        .toLocaleString()}`}
                      highlight={i === selectedOptIdx}
                    />
                  ))}
                  <ReviewRow
                    label="Vehicle"
                    value={`${form.vehicle?.vehicleType || "—"} — ₹${vehicleTotal.toLocaleString()}`}
                    highlight
                  />
                  <ReviewRow
                    label="Margin"
                    value={
                      form.pricing?.marginType === "percentage"
                        ? `${form.pricing?.margin || 0}%`
                        : `₹${(form.pricing?.margin || 0).toLocaleString()}`
                    }
                  />
                  <ReviewRow
                    label="Final Package Price"
                    value={`₹${Math.round(form.pricing?.finalPrice || 0).toLocaleString()}`}
                    highlight
                  />
                  <ReviewRow
                    label="Price Per Person"
                    value={`₹${Math.round(form.pricing?.perPersonPrice || 0).toLocaleString()} (${
                      form.pricing?.numberOfPersons || 1
                    } pax)`}
                    highlight
                  />
                  <ReviewRow
                    label="Instructions"
                    value={`${(form.instructions || []).length} instruction section(s)`}
                  />
                  <ReviewRow
                    label="Highlights"
                    value={form.highlights.length > 0 ? form.highlights.join(", ") : "None"}
                  />
                </div>

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => handleSubmit("draft")}
                    disabled={saving}
                    className="flex-1 py-4 rounded-2xl border border-slate-300 text-[14px] font-extrabold text-slate-700 bg-white hover:bg-slate-50 transition-all shadow-xs disabled:opacity-50"
                  >
                    {saving ? "Saving…" : "Save Draft"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSubmit("published")}
                    disabled={saving}
                    className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:to-pink-700 text-white text-[14px] font-black transition-all shadow-lg shadow-indigo-500/25 disabled:opacity-50"
                  >
                    {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                    Publish Package
                  </button>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-6 border-t border-slate-200/80">
              <button
                type="button"
                onClick={prevSection}
                disabled={currentStepIdx === 0}
                className="px-6 py-3 rounded-2xl border border-slate-300 text-[13.5px] font-bold text-slate-700 bg-white hover:bg-slate-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-xs"
              >
                ← Previous Step
              </button>
              {currentSection !== "review" && (
                <button
                  type="button"
                  onClick={nextSection}
                  className="flex items-center gap-2 px-7 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-[13.5px] font-black transition-all shadow-md shadow-indigo-500/20 hover:scale-[1.02] active:scale-[0.98]"
                >
                  Continue Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* ── Live Visual Package Preview Sidebar (4 cols - Sticky) ── */}
          <div className="lg:col-span-4 sticky top-24 space-y-5">
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-[0_6px_30px_-5px_rgba(0,0,0,0.08)] overflow-hidden">
              {/* Header Banner */}
              <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-5 text-white relative">
                <div className="flex items-center justify-between mb-3">
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/30 text-indigo-200 text-[11px] font-bold backdrop-blur-md border border-indigo-400/30">
                    <Eye className="w-3.5 h-3.5" /> Live Preview
                  </span>
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-300">
                    {form.status}
                  </span>
                </div>
                <h3 className="text-[17px] font-black leading-snug">
                  {form.title || "Untitled Travel Package"}
                </h3>
                {destinationSummary && (
                  <p className="text-[12px] text-indigo-200 font-semibold mt-2 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-rose-400" />
                    {destinationSummary}
                  </p>
                )}
              </div>

              {/* Package Details Specs */}
              <div className="p-5 space-y-4">
                {/* Nights & Days badge */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-100">
                  <div className="flex items-center gap-2 text-[13px] font-extrabold text-indigo-950">
                    <Moon className="w-4 h-4 text-indigo-600" />
                    <span>{form.nights} Nights</span>
                    <span className="text-indigo-300">•</span>
                    <Sun className="w-4 h-4 text-amber-500" />
                    <span>{form.days} Days</span>
                  </div>
                  <span className="text-[11px] font-black text-indigo-700 bg-white px-2.5 py-1 rounded-full shadow-xs">
                    {form.destinations.length} Cities
                  </span>
                </div>

                {/* Accommodation categories */}
                <div>
                  <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2">
                    Accommodation Tiers ({form.accommodationOptions.length})
                  </p>
                  <div className="space-y-1.5">
                    {form.accommodationOptions.map((opt, i) => {
                      const optTotal = (opt.nights || []).reduce(
                        (s, n) => s + (n.pricePerNight || 0),
                        0
                      );
                      const isSelected = i === selectedOptIdx;
                      return (
                        <div
                          key={i}
                          className={`flex items-center justify-between px-3.5 py-2 rounded-xl text-[12.5px] font-bold border transition-all ${
                            isSelected
                              ? "bg-gradient-to-r from-violet-600 to-indigo-600 border-indigo-600 text-white shadow-sm"
                              : "bg-slate-50 border-slate-200/80 text-slate-700"
                          }`}
                        >
                          <span className="flex items-center gap-1.5">
                            {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                            {opt.label}
                          </span>
                          <span className="font-black">₹{optTotal.toLocaleString()}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Vehicle Specs */}
                <div className="p-3.5 rounded-2xl bg-sky-50/80 border border-sky-200 flex items-center justify-between text-[13px]">
                  <div className="flex items-center gap-2 font-extrabold text-sky-900">
                    <Car className="w-4.5 h-4.5 text-sky-600" />
                    <span>{form.vehicle?.vehicleType || "SUV"}</span>
                    <span className="text-[11px] text-sky-600 font-bold">({form.vehicle?.seats || 4} Seats)</span>
                  </div>
                  <span className="font-black text-sky-900">₹{vehicleTotal.toLocaleString()}</span>
                </div>

                {/* Calculated Price Banner */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-600 to-emerald-700 text-white shadow-md shadow-emerald-500/20 space-y-1">
                  <div className="flex items-center justify-between text-[12px] text-emerald-100 font-bold">
                    <span>Calculated Per Couple</span>
                    <span>({form.pricing?.numberOfPersons || 1} Pax)</span>
                  </div>
                  <div className="text-[24px] font-black tracking-tight">
                    ₹{Math.round(form.pricing?.perPersonPrice || 0).toLocaleString()}
                    <span className="text-[13px] font-bold text-emerald-100"> / pax</span>
                  </div>
                  <div className="text-[11.5px] text-emerald-100 pt-1.5 border-t border-emerald-400/30 flex justify-between font-semibold">
                    <span>Grand Total Package Price:</span>
                    <span className="font-black text-white">
                      ₹{Math.round(form.pricing?.finalPrice || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ title, description }) {
  return (
    <div className="mb-2">
      <h2 className="text-[21px] font-black text-slate-900 tracking-tight">{title}</h2>
      {description && <p className="text-[13.5px] text-slate-500 mt-1 font-medium">{description}</p>}
    </div>
  );
}

function ReviewRow({ label, value, highlight }) {
  return (
    <div className="flex items-start justify-between py-2.5 border-b border-slate-100 last:border-0">
      <span className="text-[13px] font-semibold text-slate-500 w-48 flex-shrink-0">{label}</span>
      <span
        className={`text-[13.5px] font-bold text-right ${
          highlight ? "text-emerald-700 font-black" : "text-slate-900"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
