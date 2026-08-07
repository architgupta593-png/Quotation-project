"use client";

import { useState, useMemo, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
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

export default function EditPackagePage() {
  const { id } = useParams();
  const router = useRouter();
  const [currentSection, setCurrentSection] = useState("basics");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState(null);
  const [newHighlight, setNewHighlight] = useState("");
  const [cities, setCities] = useState([]);
  const [loadingCities, setLoadingCities] = useState(true);

  // Fetch package data & cities
  useEffect(() => {
    Promise.all([
      fetch(`/api/packages/${id}`).then((r) => r.json()),
      fetch("/api/accommodation/cities").then((r) => r.json()),
    ])
      .then(([pkgData, cityData]) => {
        if (pkgData.package) {
          const p = pkgData.package;
          setForm({
            title: p.title || "",
            destinations: p.destinations || [],
            nights: p.nights || 0,
            days: p.days || 0,
            highlights: p.highlights || [],
            coverImage: p.coverImage || null,
            itinerary: p.itinerary || [],
            accommodationOptions: p.accommodationOptions || [],
            vehicle: p.vehicle || { vehicleType: "Sedan", model: "", seats: 4, acType: "AC", vehiclePrice: 0, notes: "" },
            pricing: p.pricing || {
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
            instructions: p.instructions || [],
            status: p.status || "draft",
          });
        } else {
          setError("Package not found");
        }
        setCities(cityData.cities || []);
      })
      .catch((err) => {
        console.error("Failed to load package data:", err);
        setError("Failed to load package data");
      })
      .finally(() => {
        setLoading(false);
        setLoadingCities(false);
      });
  }, [id]);

  function updateForm(patch) {
    setForm((prev) => ({ ...prev, ...patch }));
  }

  // ── Destination helpers ──
  function addDestination() {
    if (!form) return;
    const updated = [...form.destinations, { cityId: "", cityName: "", state: "", nights: 1 }];
    const totalNights = updated.reduce((s, d) => s + (d.nights || 0), 0);
    const totalDays = totalNights > 0 ? totalNights + 1 : 1;
    updateForm({
      destinations: updated,
      nights: totalNights,
      days: totalDays,
    });
  }

  function updateDestination(idx, patch) {
    if (!form) return;
    const updated = form.destinations.map((d, i) => (i === idx ? { ...d, ...patch } : d));
    const totalNights = updated.reduce((s, d) => s + (d.nights || 0), 0);
    const totalDays = totalNights > 0 ? totalNights + 1 : 1;
    updateForm({
      destinations: updated,
      nights: totalNights,
      days: totalDays,
    });
  }

  function removeDestination(idx) {
    if (!form) return;
    const updated = form.destinations.filter((_, i) => i !== idx);
    const totalNights = updated.reduce((s, d) => s + (d.nights || 0), 0);
    const totalDays = totalNights > 0 ? totalNights + 1 : 1;
    updateForm({
      destinations: updated,
      nights: totalNights,
      days: totalDays,
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
    if (!form) return;
    const trimmed = newHighlight.trim();
    if (!trimmed) return;
    updateForm({ highlights: [...form.highlights, trimmed] });
    setNewHighlight("");
  }

  function removeHighlight(idx) {
    if (!form) return;
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
  const selectedOptIdx = form?.pricing?.selectedOptionIndex || 0;
  const accommodationTotal = useMemo(() => {
    if (!form) return 0;
    const opt = (form.accommodationOptions || [])[selectedOptIdx];
    const baseAccom = opt ? (opt.nights || []).reduce((s, n) => s + (n.pricePerNight || 0), 0) : 0;
    const pax = Math.max(1, parseInt(form?.pricing?.numberOfPersons, 10) || 1);
    const maxPerRoom = Math.max(1, parseInt(form?.pricing?.maxPersonsPerRoom, 10) || 2);
    const isPerPerson = form?.pricing?.rateBasis === "per_person";
    const roomsRequired = isPerPerson ? Math.max(1, Math.ceil(pax / maxPerRoom)) : Math.max(1, Math.ceil(pax / 2));
    return baseAccom * roomsRequired;
  }, [form, selectedOptIdx]);

  const vehicleTotal = useMemo(() => form?.vehicle?.vehiclePrice || 0, [form?.vehicle]);

  const destinationSummary = useMemo(() => {
    if (!form || !form.destinations) return "";
    return form.destinations
      .filter((d) => d.cityName)
      .map((d) => `${d.cityName} (${d.nights}N)`)
      .join(" → ");
  }, [form]);

  async function handleSubmit(status = "published") {
    if (!form) return;
    setError("");
    if (!form.title || !form.title.trim()) {
      setError("Please enter a Package Title in the Basics section.");
      setCurrentSection("basics");
      return;
    }
    if (form.destinations.length === 0 || !form.destinations.some((d) => d.cityId)) {
      setError("Please select at least one destination city in the Basics section.");
      setCurrentSection("basics");
      return;
    }
    if ((form.nights || 0) < 1) {
      setError("Package duration must be at least 1 night.");
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
      const res = await fetch(`/api/packages/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update package");
      router.push(`/dashboard/packages/${id}`);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  const inputCls =
    "w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white text-[13.5px] font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-600 transition-all shadow-xs";

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f1f5f9]">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-3" />
        <p className="text-[14px] font-extrabold text-slate-600">Loading package details…</p>
      </div>
    );
  }

  if (error && !form) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f1f5f9] px-4">
        <AlertCircle className="w-10 h-10 text-rose-500 mb-3" />
        <h2 className="text-[18px] font-black text-slate-900 mb-1">{error}</h2>
        <Link href="/dashboard/packages" className="text-[13px] font-bold text-indigo-600 hover:underline">
          ← Back to Packages List
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f1f5f9] text-slate-900 font-sans pb-24" suppressHydrationWarning>
      {/* ── Luxury Gradient Navbar ── */}
      <header className="sticky top-0 z-30 bg-slate-900 text-white border-b border-slate-800 px-6 py-4 flex items-center justify-between shadow-lg shadow-slate-900/20">
        <div className="flex items-center gap-4">
          <Link
            href={`/dashboard/packages/${id}`}
            className="p-2.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-all border border-slate-700/60"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="h-6 w-px bg-slate-800" />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-300 bg-indigo-500/20 px-2.5 py-0.5 rounded-full border border-indigo-500/30">
                Edit Package
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
            Save & Publish
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
                  description="Update package title and your multi-city route destinations."
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
                    className="w-full py-3.5 rounded-2xl text-[13px] font-black text-indigo-700 bg-indigo-50 hover:bg-indigo-100/80 border border-indigo-200 transition-all flex items-center justify-center gap-2 shadow-xs mb-4"
                  >
                    <Plus className="w-4.5 h-4.5" /> Add Destination City
                  </button>

                  {/* Total Duration Override Controls */}
                  {form.destinations.length > 0 && (
                    <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-indigo-50/40 border border-indigo-100">
                      <div>
                        <label className="block text-[11.5px] font-extrabold text-indigo-950 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                          <Moon className="w-3.5 h-3.5 text-purple-600" />
                          Total Accommodation Nights
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={60}
                          value={form.nights}
                          onWheel={(e) => e.target.blur()}
                          onChange={(e) =>
                            updateForm({ nights: Math.max(1, parseInt(e.target.value, 10) || 1) })
                          }
                          className={`${inputCls} font-black text-purple-900 border-indigo-200`}
                        />
                      </div>
                      <div>
                        <label className="block text-[11.5px] font-extrabold text-indigo-950 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                          <Sun className="w-3.5 h-3.5 text-amber-500" />
                          Total Itinerary Days
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={61}
                          value={form.days}
                          onWheel={(e) => e.target.blur()}
                          onChange={(e) =>
                            updateForm({ days: Math.max(1, parseInt(e.target.value, 10) || 1) })
                          }
                          className={`${inputCls} font-black text-amber-900 border-indigo-200`}
                        />
                      </div>
                    </div>
                  )}
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
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 text-slate-800 text-[12px] font-bold border border-slate-200/80 shadow-xs"
                      >
                        {h}
                        <button
                          type="button"
                          onClick={() => removeHighlight(i)}
                          className="text-slate-400 hover:text-rose-600 transition-colors"
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
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addHighlight())}
                      placeholder="e.g. Candlelight Dinner included, Helicopter Tour"
                      className={inputCls}
                    />
                    <button
                      type="button"
                      onClick={addHighlight}
                      className="px-5 py-3 rounded-2xl bg-slate-900 text-white font-extrabold hover:bg-slate-800 transition-all flex-shrink-0"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ═══════════ ITINERARY ═══════════ */}
            {currentSection === "itinerary" && (
              <div className="bg-white rounded-3xl border border-slate-200/90 p-7 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] space-y-6">
                <SectionHeader
                  title="Day-by-Day Itinerary Builder"
                  description="Build the daily schedule for all package days."
                />
                <ItineraryBuilder
                  days={form.days}
                  itinerary={form.itinerary}
                  value={form.itinerary}
                  destinations={form.destinations}
                  onChange={(itinerary) => updateForm({ itinerary })}
                />
              </div>
            )}

            {/* ═══════════ ACCOMMODATION ═══════════ */}
            {currentSection === "accommodation" && (
              <div className="bg-white rounded-3xl border border-slate-200/90 p-7 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] space-y-6">
                <SectionHeader
                  title="Hotel Accommodation Tiers"
                  description="Configure accommodation options (Option 1, Option 2, etc.) for each night of the route."
                />
                <AccommodationPanel
                  destinations={form.destinations}
                  nightsCount={form.nights}
                  accommodationOptions={form.accommodationOptions}
                  value={form.accommodationOptions}
                  onChange={(accommodationOptions) => updateForm({ accommodationOptions })}
                />
              </div>
            )}

            {/* ═══════════ VEHICLE ═══════════ */}
            {currentSection === "vehicle" && (
              <div className="bg-white rounded-3xl border border-slate-200/90 p-7 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] space-y-6">
                <SectionHeader
                  title="Vehicle & Transport Fleet"
                  description="Select vehicle type and set transport pricing."
                />
                <VehiclePanel
                  vehicle={form.vehicle}
                  value={form.vehicle}
                  onChange={(vehicle) => updateForm({ vehicle })}
                />
              </div>
            )}

            {/* ═══════════ PRICING ═══════════ */}
            {currentSection === "pricing" && (
              <div className="bg-white rounded-3xl border border-slate-200/90 p-7 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] space-y-6">
                <SectionHeader
                  title="Pricing & Margin Calculator"
                  description="Review costs and configure profit margins and per-person rates."
                />
                <PricingPanel
                  accommodationOptions={form.accommodationOptions}
                  vehicleTotal={form.vehicle?.vehiclePrice || 0}
                  vehiclePrice={form.vehicle?.vehiclePrice || 0}
                  pricing={form.pricing}
                  value={form.pricing}
                  onChange={(pricing) => updateForm({ pricing })}
                  onAccommodationOptionsChange={(accommodationOptions) => updateForm({ accommodationOptions })}
                />
              </div>
            )}

            {/* ═══════════ INSTRUCTIONS ═══════════ */}
            {currentSection === "instructions" && (
              <div className="bg-white rounded-3xl border border-slate-200/90 p-7 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] space-y-6">
                <SectionHeader
                  title="Instructions, Inclusions & Terms"
                  description="Add terms, driver guidelines, and cancellation policies."
                />
                <InstructionPanel
                  instructions={form.instructions}
                  value={form.instructions}
                  onChange={(instructions) => updateForm({ instructions })}
                />
              </div>
            )}

            {/* ═══════════ REVIEW ═══════════ */}
            {currentSection === "review" && (
              <div className="bg-white rounded-3xl border border-slate-200/90 p-7 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] space-y-6">
                <SectionHeader
                  title="Review & Confirm Package Details"
                  description="Check your package details before saving changes."
                />

                <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-900 via-slate-900 to-purple-950 text-white space-y-4 shadow-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase tracking-widest text-indigo-300 bg-indigo-500/20 px-3 py-1 rounded-full border border-indigo-500/30">
                      Summary Preview
                    </span>
                    <span className="text-[13px] font-extrabold text-amber-400">
                      {form.nights}N / {form.days}D
                    </span>
                  </div>
                  <h3 className="text-[20px] font-black leading-tight text-white">{form.title || "Untitled Package"}</h3>
                  <p className="text-[13px] text-slate-300 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-rose-400" />
                    {destinationSummary || "No destinations selected"}
                  </p>

                  <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                    <div>
                      <p className="text-[11px] text-slate-400 font-bold uppercase">Final Per Person Rate</p>
                      <p className="text-[22px] font-black text-emerald-400">
                        ₹{(form.pricing?.perPersonPrice || 0).toLocaleString("en-IN")}
                        <span className="text-[12px] text-slate-300 font-semibold"> / pax</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] text-slate-400 font-bold uppercase">Grand Total</p>
                      <p className="text-[17px] font-extrabold text-white">
                        ₹{(form.pricing?.finalPrice || 0).toLocaleString("en-IN")}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => handleSubmit("draft")}
                    disabled={saving}
                    className="flex-1 py-4 rounded-2xl border-2 border-slate-200 text-slate-800 text-[14px] font-extrabold hover:bg-slate-50 transition-all disabled:opacity-50"
                  >
                    Save as Draft
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSubmit("published")}
                    disabled={saving}
                    className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white text-[14px] font-extrabold shadow-lg shadow-indigo-500/25 hover:scale-[1.01] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                    Save & Publish Package
                  </button>
                </div>
              </div>
            )}

            {/* Step Bottom Controls */}
            <div className="flex items-center justify-between pt-4">
              <button
                type="button"
                onClick={prevSection}
                disabled={currentStepIdx === 0}
                className="px-5 py-3 rounded-2xl border border-slate-200 text-[13px] font-bold text-slate-700 bg-white hover:bg-slate-50 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
              >
                Previous Step
              </button>
              {currentStepIdx < SECTIONS.length - 1 ? (
                <button
                  type="button"
                  onClick={nextSection}
                  className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-slate-900 text-white text-[13px] font-extrabold hover:bg-slate-800 transition-all shadow-md"
                >
                  Next Step: {SECTIONS[currentStepIdx + 1].label}
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleSubmit("published")}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-[13px] font-extrabold hover:scale-[1.02] transition-all shadow-md disabled:opacity-50"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  Save & Publish
                </button>
              )}
            </div>
          </div>

          {/* ── Live Cost Summary Sidebar (4 cols) ── */}
          <div className="lg:col-span-4 sticky top-24 space-y-5">
            <div className="bg-slate-900 text-white rounded-3xl p-6 border border-slate-800 shadow-xl space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Live Package Calculator</p>
                  <h3 className="text-[15px] font-bold text-white mt-0.5">Cost Summary</h3>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-[11px] font-extrabold border border-indigo-500/30">
                  {form.nights}N / {form.days}D
                </span>
              </div>

              {/* Route */}
              <div className="space-y-1.5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Route Summary</p>
                <p className="text-[13px] font-semibold text-slate-200">
                  {destinationSummary || "No destinations added yet"}
                </p>
              </div>

              {/* Cost breakdown */}
              <div className="space-y-3 pt-3 border-t border-slate-800 text-[13px]">
                <div className="flex justify-between text-slate-300">
                  <span>Accommodation ({form.accommodationOptions?.length || 0} Tiers)</span>
                  <span className="font-bold text-white">₹{accommodationTotal.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Transport ({form.vehicle?.vehicleType || "Vehicle"})</span>
                  <span className="font-bold text-white">₹{vehicleTotal.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between text-slate-300 font-bold pt-2 border-t border-slate-800/80">
                  <span>Base Cost Subtotal</span>
                  <span className="text-indigo-300">₹{(accommodationTotal + vehicleTotal).toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Configured Margin ({form.pricing?.marginType === "percentage" ? `${form.pricing?.margin || 0}%` : "₹"})</span>
                  <span className="font-bold text-purple-300">
                    ₹{(form.pricing?.marginType === "percentage"
                      ? ((accommodationTotal + vehicleTotal) * (form.pricing?.margin || 0)) / 100
                      : form.pricing?.margin || 0
                    ).toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              {/* Final price box */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950 to-purple-950 border border-indigo-500/30 space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-300">Grand Package Total</p>
                <p className="text-[24px] font-black text-emerald-400 leading-tight">
                  ₹{(form.pricing?.finalPrice || 0).toLocaleString("en-IN")}
                </p>
              </div>

              {/* Step indicator status */}
              <div className="pt-2 space-y-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Completion Status</p>
                <div className="grid grid-cols-2 gap-2 text-[11.5px]">
                  {SECTIONS.map((sec) => {
                    const isDone =
                      (sec.id === "basics" && form.title && form.destinations.length > 0) ||
                      (sec.id === "itinerary" && form.itinerary.length > 0) ||
                      (sec.id === "accommodation" && form.accommodationOptions.length > 0) ||
                      (sec.id === "vehicle" && form.vehicle?.vehiclePrice > 0) ||
                      (sec.id === "pricing" && form.pricing?.finalPrice > 0) ||
                      (sec.id === "instructions" && form.instructions.length > 0) ||
                      sec.id === "review";

                    return (
                      <div
                        key={sec.id}
                        onClick={() => goTo(sec.id)}
                        className={`flex items-center gap-1.5 p-2 rounded-xl cursor-pointer transition-all ${
                          sec.id === currentSection
                            ? "bg-indigo-600 text-white font-bold"
                            : isDone
                            ? "bg-slate-800/80 text-emerald-400 font-semibold"
                            : "bg-slate-800/40 text-slate-400"
                        }`}
                      >
                        <CheckCircle2 className={`w-3.5 h-3.5 ${isDone ? "text-emerald-400" : "text-slate-500"}`} />
                        <span className="truncate">{sec.label}</span>
                      </div>
                    );
                  })}
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
    <div className="border-b border-slate-100 pb-4 mb-2">
      <h2 className="text-[18px] font-black text-slate-900 tracking-tight">{title}</h2>
      <p className="text-[13px] text-slate-500 mt-0.5">{description}</p>
    </div>
  );
}
