"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trash2, Loader2, AlertCircle, ChevronRight } from "lucide-react";
import Link from "next/link";
import ItineraryBuilder from "@/components/packages/ItineraryBuilder";
import AccommodationPanel from "@/components/packages/AccommodationPanel";
import VehiclePanel from "@/components/packages/VehiclePanel";
import PricingPanel from "@/components/packages/PricingPanel";
import ImageUploader from "@/components/packages/ImageUploader";

const SECTIONS = ["basics", "itinerary", "accommodation", "vehicle", "pricing", "review"];
const SECTION_LABELS = {
  basics: "Basics",
  itinerary: "Itinerary",
  accommodation: "Accommodation",
  vehicle: "Vehicle",
  pricing: "Pricing",
  review: "Review",
};

const DEFAULT_FORM = {
  title: "",
  destination: "",
  nights: 2,
  days: 3,
  highlights: [],
  coverImage: null,
  itinerary: [],
  accommodations: [],
  vehicle: {},
  pricing: { pricePerPerson: 0, totalPrice: 0, currency: "INR", includes: [], excludes: [] },
  status: "draft",
};

export default function NewPackagePage() {
  const router = useRouter();
  const [currentSection, setCurrentSection] = useState("basics");
  const [form, setForm] = useState(DEFAULT_FORM);
  const [newHighlight, setNewHighlight] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function updateForm(patch) {
    setForm((prev) => ({ ...prev, ...patch }));
  }

  function handleNightsChange(nights) {
    const n = Math.max(1, Math.min(60, parseInt(nights, 10) || 1));
    updateForm({ nights: n, days: n + 1 });
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

  function goTo(section) {
    setCurrentSection(section);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function nextSection() {
    const idx = SECTIONS.indexOf(currentSection);
    if (idx < SECTIONS.length - 1) goTo(SECTIONS[idx + 1]);
  }

  function prevSection() {
    const idx = SECTIONS.indexOf(currentSection);
    if (idx > 0) goTo(SECTIONS[idx - 1]);
  }

  async function handleSubmit(status = "draft") {
    setError("");
    setSaving(true);
    try {
      const payload = { ...form, status };
      const res = await fetch("/api/packages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      router.push(`/dashboard/packages/${data.package._id}`);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  const inputCls =
    "w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-[14px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all bg-white";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Top Bar ── */}
      <header className="sticky top-0 z-20 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/packages"
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-500"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">New Package</p>
            <h1 className="text-[16px] font-bold text-gray-900 leading-tight">
              {form.title || "Untitled Package"}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleSubmit("draft")}
            disabled={saving}
            className="px-4 py-2 rounded-xl border border-gray-200 text-[13px] font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Save Draft
          </button>
          <button
            type="button"
            onClick={() => handleSubmit("published")}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-[13px] font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Publish
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* ── Step Progress ── */}
        <div className="flex items-center gap-1 mb-8 overflow-x-auto pb-2">
          {SECTIONS.map((sec, i) => {
            const isActive = sec === currentSection;
            const isPast = SECTIONS.indexOf(currentSection) > i;
            return (
              <button
                key={sec}
                type="button"
                onClick={() => goTo(sec)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? "bg-indigo-600 text-white"
                    : isPast
                    ? "bg-indigo-100 text-indigo-700"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
              >
                <span className="w-4 h-4 rounded-full border-2 flex items-center justify-center text-[10px] font-bold
                  ${isActive ? 'border-white' : isPast ? 'border-indigo-600' : 'border-gray-400'}">
                  {i + 1}
                </span>
                {SECTION_LABELS[sec]}
              </button>
            );
          })}
        </div>

        {/* ── Error Banner ── */}
        {error && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-[13px] mb-6">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* ── Section: Basics ── */}
        {currentSection === "basics" && (
          <div className="space-y-6">
            <SectionHeader title="Package Basics" description="Core details of the travel package." />

            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-5">
              {/* Title */}
              <div>
                <label className="block text-[12px] font-medium text-gray-500 mb-1.5">Package Title *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => updateForm({ title: e.target.value })}
                  placeholder="e.g. 4 Night 5 Day Manali Adventure"
                  className={inputCls}
                  required
                />
              </div>

              {/* Destination */}
              <div>
                <label className="block text-[12px] font-medium text-gray-500 mb-1.5">Destination *</label>
                <input
                  type="text"
                  value={form.destination}
                  onChange={(e) => updateForm({ destination: e.target.value })}
                  placeholder="e.g. Manali, Himachal Pradesh"
                  className={inputCls}
                  required
                />
              </div>

              {/* Nights / Days */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-medium text-gray-500 mb-1.5">Nights *</label>
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={form.nights}
                    onChange={(e) => handleNightsChange(e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-gray-500 mb-1.5">Days (auto)</label>
                  <input
                    type="number"
                    value={form.days}
                    readOnly
                    className={`${inputCls} bg-gray-50 cursor-not-allowed text-gray-500`}
                  />
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-[12px] font-medium text-gray-500 mb-1.5">Status</label>
                <div className="flex gap-3">
                  {["draft", "published"].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => updateForm({ status: s })}
                      className={`flex-1 py-2.5 rounded-xl border text-[13px] font-medium capitalize transition-all ${
                        form.status === s
                          ? "bg-indigo-50 border-indigo-400 text-indigo-700"
                          : "bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Highlights */}
              <div>
                <label className="block text-[12px] font-medium text-gray-500 mb-2">Package Highlights</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {form.highlights.map((h, i) => (
                    <span key={i} className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 border border-indigo-200 rounded-full text-[12px] text-indigo-700 font-medium">
                      {h}
                      <button type="button" onClick={() => removeHighlight(i)} className="text-indigo-400 hover:text-indigo-700">
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
                    placeholder="e.g. Snow activities, Temple visits…"
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-[13px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
                  />
                  <button
                    type="button"
                    onClick={addHighlight}
                    className="px-3 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Section: Itinerary ── */}
        {currentSection === "itinerary" && (
          <div className="space-y-6">
            <SectionHeader
              title={`Day-by-Day Itinerary`}
              description={`Plan the activities for each of the ${form.days} days.`}
            />
            <ItineraryBuilder
              days={form.days}
              value={form.itinerary}
              onChange={(itinerary) => updateForm({ itinerary })}
              packageId={null}
            />
          </div>
        )}

        {/* ── Section: Accommodation ── */}
        {currentSection === "accommodation" && (
          <div className="space-y-6">
            <SectionHeader
              title="Accommodation"
              description={`Hotel details for each of the ${form.nights} nights.`}
            />
            <AccommodationPanel
              nights={form.nights}
              value={form.accommodations}
              onChange={(accommodations) => updateForm({ accommodations })}
            />
          </div>
        )}

        {/* ── Section: Vehicle ── */}
        {currentSection === "vehicle" && (
          <div className="space-y-6">
            <SectionHeader title="Vehicle" description="Transport details for the package." />
            <VehiclePanel
              value={form.vehicle}
              onChange={(vehicle) => updateForm({ vehicle })}
            />
          </div>
        )}

        {/* ── Section: Pricing ── */}
        {currentSection === "pricing" && (
          <div className="space-y-6">
            <SectionHeader title="Pricing" description="Set the cost and inclusion/exclusion list." />
            <PricingPanel
              value={form.pricing}
              onChange={(pricing) => updateForm({ pricing })}
            />
          </div>
        )}

        {/* ── Section: Review ── */}
        {currentSection === "review" && (
          <div className="space-y-6">
            <SectionHeader title="Review & Save" description="Check your package before saving." />
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
              <ReviewRow label="Title" value={form.title || "—"} />
              <ReviewRow label="Destination" value={form.destination || "—"} />
              <ReviewRow label="Duration" value={`${form.nights} Night${form.nights > 1 ? "s" : ""} / ${form.days} Day${form.days > 1 ? "s" : ""}`} />
              <ReviewRow label="Status" value={form.status} />
              <ReviewRow label="Itinerary Days" value={`${form.itinerary.filter((d) => d.title).length} of ${form.days} filled`} />
              <ReviewRow label="Accommodation" value={`${form.accommodations.filter((a) => a.hotelName).length} of ${form.nights} nights filled`} />
              <ReviewRow label="Vehicle" value={form.vehicle?.vehicleType || "Not set"} />
              <ReviewRow label="Price / Person" value={`${form.pricing?.currency} ${(form.pricing?.pricePerPerson || 0).toLocaleString()}`} />
              <ReviewRow label="Highlights" value={form.highlights.length > 0 ? form.highlights.join(", ") : "None"} />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => handleSubmit("draft")}
                disabled={saving}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-[14px] font-semibold text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save as Draft"}
              </button>
              <button
                type="button"
                onClick={() => handleSubmit("published")}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600 text-white text-[14px] font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                Publish Package
              </button>
            </div>
          </div>
        )}

        {/* ── Navigation Buttons ── */}
        <div className="flex items-center justify-between mt-8">
          <button
            type="button"
            onClick={prevSection}
            disabled={currentSection === SECTIONS[0]}
            className="px-5 py-2.5 rounded-xl border border-gray-200 text-[13px] font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            ← Previous
          </button>
          {currentSection !== "review" && (
            <button
              type="button"
              onClick={nextSection}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-[13px] font-semibold hover:bg-indigo-700 transition-colors"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ title, description }) {
  return (
    <div>
      <h2 className="text-[20px] font-bold text-gray-900">{title}</h2>
      {description && <p className="text-[14px] text-gray-500 mt-1">{description}</p>}
    </div>
  );
}

function ReviewRow({ label, value }) {
  return (
    <div className="flex items-start justify-between py-2 border-b border-gray-50 last:border-0">
      <span className="text-[13px] text-gray-500 w-36 flex-shrink-0">{label}</span>
      <span className="text-[13px] font-medium text-gray-900 text-right">{value}</span>
    </div>
  );
}
