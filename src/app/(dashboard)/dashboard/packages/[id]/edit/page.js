"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2, AlertCircle, ChevronRight } from "lucide-react";
import Link from "next/link";
import ItineraryBuilder from "@/components/packages/ItineraryBuilder";
import AccommodationPanel from "@/components/packages/AccommodationPanel";
import VehiclePanel from "@/components/packages/VehiclePanel";
import PricingPanel from "@/components/packages/PricingPanel";
import ImageUploader from "@/components/packages/ImageUploader";
import { Plus } from "lucide-react";

const SECTIONS = ["basics", "itinerary", "accommodation", "vehicle", "pricing"];
const SECTION_LABELS = {
  basics: "Basics",
  itinerary: "Itinerary",
  accommodation: "Accommodation",
  vehicle: "Vehicle",
  pricing: "Pricing",
};

export default function EditPackagePage() {
  const { id } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState(null);
  const [currentSection, setCurrentSection] = useState("basics");
  const [newHighlight, setNewHighlight] = useState("");

  useEffect(() => {
    fetch(`/api/packages/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.package) setForm(data.package);
        else setError("Package not found");
      })
      .catch(() => setError("Failed to load package"))
      .finally(() => setLoading(false));
  }, [id]);

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
    updateForm({ highlights: [...(form.highlights || []), trimmed] });
    setNewHighlight("");
  }

  function removeHighlight(idx) {
    updateForm({ highlights: form.highlights.filter((_, i) => i !== idx) });
  }

  function goTo(section) {
    setCurrentSection(section);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSave() {
    setError("");
    setSaving(true);
    try {
      const res = await fetch(`/api/packages/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      router.push(`/dashboard/packages/${id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const inputCls =
    "w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-[14px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all bg-white";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (!form) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">{error || "Package not found"}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Bar */}
      <header className="sticky top-0 z-20 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/dashboard/packages/${id}`} className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Editing</p>
            <h1 className="text-[16px] font-bold text-gray-900 leading-tight truncate max-w-xs">
              {form.title || "Untitled"}
            </h1>
          </div>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-[13px] font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50"
        >
          {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          {saving ? "Saving…" : "Save Changes"}
        </button>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Step Nav */}
        <div className="flex items-center gap-1 mb-8 overflow-x-auto pb-2">
          {SECTIONS.map((sec, i) => (
            <button
              key={sec}
              type="button"
              onClick={() => goTo(sec)}
              className={`px-3 py-1.5 rounded-full text-[12px] font-medium whitespace-nowrap transition-all ${
                sec === currentSection
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              {SECTION_LABELS[sec]}
            </button>
          ))}
        </div>

        {/* Error Banner */}
        {error && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-[13px] mb-6">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Basics */}
        {currentSection === "basics" && (
          <div className="space-y-6">
            <SectionHeader title="Package Basics" />
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-5">

              {/* Cover Image */}
              <div>
                <label className="block text-[12px] font-medium text-gray-500 mb-1.5">Cover Image</label>
                <ImageUploader
                  packageId={id}
                  dayIndex={-1}
                  existingImages={form.coverImage ? [form.coverImage] : []}
                  onUploaded={(img) => updateForm({ coverImage: img })}
                  onDeleted={() => updateForm({ coverImage: null })}
                  maxImages={1}
                  label=""
                />
              </div>

              <div>
                <label className="block text-[12px] font-medium text-gray-500 mb-1.5">Package Title *</label>
                <input type="text" value={form.title} onChange={(e) => updateForm({ title: e.target.value })} className={inputCls} />
              </div>

              <div>
                <label className="block text-[12px] font-medium text-gray-500 mb-1.5">Destination *</label>
                <input type="text" value={form.destination} onChange={(e) => updateForm({ destination: e.target.value })} className={inputCls} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-medium text-gray-500 mb-1.5">Nights</label>
                  <input type="number" min={1} max={60} value={form.nights} onChange={(e) => handleNightsChange(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-gray-500 mb-1.5">Days (auto)</label>
                  <input type="number" value={form.days} readOnly className={`${inputCls} bg-gray-50 cursor-not-allowed text-gray-500`} />
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-medium text-gray-500 mb-1.5">Status</label>
                <div className="flex gap-3">
                  {["draft", "published"].map((s) => (
                    <button key={s} type="button" onClick={() => updateForm({ status: s })}
                      className={`flex-1 py-2.5 rounded-xl border text-[13px] font-medium capitalize transition-all ${form.status === s ? "bg-indigo-50 border-indigo-400 text-indigo-700" : "bg-gray-50 border-gray-200 text-gray-500"}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-medium text-gray-500 mb-2">Highlights</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {(form.highlights || []).map((h, i) => (
                    <span key={i} className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 border border-indigo-200 rounded-full text-[12px] text-indigo-700 font-medium">
                      {h}
                      <button type="button" onClick={() => removeHighlight(i)} className="text-indigo-400 hover:text-indigo-700">×</button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input type="text" value={newHighlight} onChange={(e) => setNewHighlight(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addHighlight())}
                    placeholder="Add a highlight…" className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-[13px] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all" />
                  <button type="button" onClick={addHighlight} className="px-3 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"><Plus className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Itinerary */}
        {currentSection === "itinerary" && (
          <div className="space-y-6">
            <SectionHeader title="Day-by-Day Itinerary" />
            <ItineraryBuilder
              days={form.days}
              value={form.itinerary || []}
              onChange={(itinerary) => updateForm({ itinerary })}
              packageId={id}
            />
          </div>
        )}

        {/* Accommodation */}
        {currentSection === "accommodation" && (
          <div className="space-y-6">
            <SectionHeader title="Accommodation" />
            <AccommodationPanel
              nights={form.nights}
              value={form.accommodations || []}
              onChange={(accommodations) => updateForm({ accommodations })}
            />
          </div>
        )}

        {/* Vehicle */}
        {currentSection === "vehicle" && (
          <div className="space-y-6">
            <SectionHeader title="Vehicle" />
            <VehiclePanel
              value={form.vehicle || {}}
              onChange={(vehicle) => updateForm({ vehicle })}
            />
          </div>
        )}

        {/* Pricing */}
        {currentSection === "pricing" && (
          <div className="space-y-6">
            <SectionHeader title="Pricing" />
            <PricingPanel
              value={form.pricing || {}}
              onChange={(pricing) => updateForm({ pricing })}
            />
          </div>
        )}

        {/* Nav Buttons */}
        <div className="flex items-center justify-between mt-8">
          <button
            type="button"
            onClick={() => { const i = SECTIONS.indexOf(currentSection); if (i > 0) goTo(SECTIONS[i - 1]); }}
            disabled={currentSection === SECTIONS[0]}
            className="px-5 py-2.5 rounded-xl border border-gray-200 text-[13px] font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            ← Previous
          </button>
          {currentSection !== SECTIONS[SECTIONS.length - 1] ? (
            <button
              type="button"
              onClick={() => { const i = SECTIONS.indexOf(currentSection); if (i < SECTIONS.length - 1) goTo(SECTIONS[i + 1]); }}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-[13px] font-semibold hover:bg-indigo-700 transition-colors"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-[13px] font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Save Changes
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ title }) {
  return <h2 className="text-[20px] font-bold text-gray-900">{title}</h2>;
}
