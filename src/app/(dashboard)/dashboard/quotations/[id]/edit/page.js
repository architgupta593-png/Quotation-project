"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
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

const SECTIONS = [
  { id: "client", label: "Client & Dates", icon: Users, desc: "Lead & Travel Info" },
  { id: "itinerary", label: "Itinerary", icon: Sun, desc: "Day by Day" },
  { id: "accommodation", label: "Accommodation", icon: Layers, desc: "Hotel Tiers" },
  { id: "vehicle", label: "Vehicle", icon: Car, desc: "Transport" },
  { id: "pricing", label: "Pricing & Margin", icon: IndianRupee, desc: "Markup & Terms" },
  { id: "instructions", label: "Policies", icon: FileText, desc: "Terms & Rules" },
  { id: "review", label: "Review & Update", icon: ShieldCheck, desc: "Save Changes" },
];

export default function EditQuotationPage() {
  const { id } = useParams();
  const router = useRouter();
  const [currentSection, setCurrentSection] = useState("client");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [cities, setCities] = useState([]);
  const [form, setForm] = useState(null);

  useEffect(() => {
    Promise.all([
      fetch(`/api/quotations/${id}`).then((r) => r.json()),
      fetch("/api/accommodation/cities").then((r) => r.json()),
    ])
      .then(([quoteData, cityData]) => {
        if (quoteData.error) throw new Error(quoteData.error);
        const q = quoteData.quotation;
        setForm({
          ...q,
          tripDetails: {
            ...q.tripDetails,
            startDate: q.tripDetails?.startDate ? new Date(q.tripDetails.startDate).toISOString().split("T")[0] : "",
            endDate: q.tripDetails?.endDate ? new Date(q.tripDetails.endDate).toISOString().split("T")[0] : "",
          },
        });
        setCities(cityData.cities || []);
      })
      .catch((err) => setError(err.message || "Failed to load quotation"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (!form) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8fafc] p-6 text-center">
        <AlertCircle className="w-12 h-12 text-rose-500 mb-2" />
        <h2 className="text-[18px] font-black text-slate-900">{error || "Quotation Not Found"}</h2>
        <Link href="/dashboard/quotations" className="text-[13px] font-bold text-indigo-600 hover:underline mt-2">
          ← Back to Quotations
        </Link>
      </div>
    );
  }

  // Financial calculations
  const selectedOptIdx = form.selectedOptionIndex || 0;
  const currentOpt = form.accommodationOptions?.[selectedOptIdx] || form.accommodationOptions?.[0];
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

  async function handleUpdate(targetStatus) {
    setSaving(true);
    setError("");
    try {
      const payload = {
        ...form,
        pricing: {
          ...form.pricing,
          accommodationTotal,
          vehicleTotal,
          activitiesTotal,
          subtotal,
          finalPrice,
          perPersonPrice,
          perCouplePrice,
          numberOfPersons: pax,
        },
        status: targetStatus || form.status,
      };

      const res = await fetch(`/api/quotations/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update quotation");

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
              Edit Quotation Studio • {form.quotationCode}
            </span>
            <h1 className="text-[15px] font-black text-slate-900 leading-snug mt-0.5 truncate max-w-sm">
              {form.tripDetails.title}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <a
            href={`/quote/${form.quotationCode}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold text-[12.5px] transition-all"
          >
            <Eye className="w-3.5 h-3.5" /> View Live Proposal
          </a>

          <button
            type="button"
            onClick={() => handleUpdate(form.status)}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-extrabold text-[13px] shadow-md shadow-indigo-500/25 transition-all disabled:opacity-50"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Save &amp; Update Proposal
          </button>
        </div>
      </header>

      {/* ── Step Navigation Bar ── */}
      <div className="bg-white border-b border-slate-200/80 px-6 py-3 overflow-x-auto">
        <div className="max-w-6xl mx-auto flex items-center gap-2">
          {SECTIONS.map((sec, idx) => {
            const Icon = sec.icon;
            const isActive = currentSection === sec.id;
            return (
              <button
                key={sec.id}
                type="button"
                onClick={() => setCurrentSection(sec.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-[12.5px] font-bold whitespace-nowrap transition-all ${
                  isActive
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-500 hover:bg-slate-100"
                }`}
              >
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
          {/* Main Form (8 cols) */}
          <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200/90 p-7 shadow-xs space-y-6">
            {/* 1. Client Step */}
            {currentSection === "client" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-[18px] font-black text-slate-900">Client &amp; Travel Dates</h2>
                  <p className="text-[13px] text-slate-500 mt-0.5">Edit traveler details and tour dates</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[12px] font-bold text-slate-600 mb-1.5">Client Full Name *</label>
                    <input
                      type="text"
                      value={form.client?.name || ""}
                      onChange={(e) => setForm((p) => ({ ...p, client: { ...p.client, name: e.target.value } }))}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-[13.5px] font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] font-bold text-slate-600 mb-1.5">Phone Number *</label>
                    <input
                      type="text"
                      value={form.client?.phone || ""}
                      onChange={(e) => setForm((p) => ({ ...p, client: { ...p.client, phone: e.target.value } }))}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-[13.5px] font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[12px] font-bold text-slate-600 mb-1.5">Title</label>
                  <input
                    type="text"
                    value={form.tripDetails?.title || ""}
                    onChange={(e) => setForm((p) => ({ ...p, tripDetails: { ...p.tripDetails, title: e.target.value } }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-[13.5px] font-semibold"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[12px] font-bold text-slate-600 mb-1.5">Start Date</label>
                    <input
                      type="date"
                      value={form.tripDetails?.startDate || ""}
                      onChange={(e) => setForm((p) => ({ ...p, tripDetails: { ...p.tripDetails, startDate: e.target.value } }))}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-[13.5px] font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] font-bold text-slate-600 mb-1.5">End Date</label>
                    <input
                      type="date"
                      value={form.tripDetails?.endDate || ""}
                      onChange={(e) => setForm((p) => ({ ...p, tripDetails: { ...p.tripDetails, endDate: e.target.value } }))}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-[13.5px] font-semibold"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 2. Itinerary Step */}
            {currentSection === "itinerary" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-[18px] font-black text-slate-900">Day-by-Day Itinerary</h2>
                  <p className="text-[13px] text-slate-500 mt-0.5">Customize daily schedule with formatted sub-bullets and activities</p>
                </div>

                <ItineraryBuilder
                  days={form.tripDetails?.days || 1}
                  value={form.itinerary || []}
                  onChange={(itinerary) => setForm((p) => ({ ...p, itinerary }))}
                  destinations={form.tripDetails?.destinations || []}
                />
              </div>
            )}

            {/* 3. Accommodation Step */}
            {currentSection === "accommodation" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-[18px] font-black text-slate-900">Hotel Accommodation Tiers</h2>
                  <p className="text-[13px] text-slate-500 mt-0.5">Swap hotels, rooms, and meal plans per stay</p>
                </div>

                <AccommodationPanel
                  destinations={form.tripDetails?.destinations || []}
                  options={form.accommodationOptions || []}
                  onChange={(accommodationOptions) => setForm((p) => ({ ...p, accommodationOptions }))}
                />
              </div>
            )}

            {/* 4. Vehicle Step */}
            {currentSection === "vehicle" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-[18px] font-black text-slate-900">Transport Fleet</h2>
                  <p className="text-[13px] text-slate-500 mt-0.5">Assign vehicle type, AC status, and driver terms</p>
                </div>

                <VehiclePanel
                  value={form.vehicle || {}}
                  onChange={(vehicle) => setForm((p) => ({ ...p, vehicle }))}
                  days={form.tripDetails?.days || 1}
                />
              </div>
            )}

            {/* 5. Pricing Step */}
            {currentSection === "pricing" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-[18px] font-black text-slate-900">Pricing &amp; Margins</h2>
                  <p className="text-[13px] text-slate-500 mt-0.5">Adjust agency markup, discounts, and payment terms</p>
                </div>

                {/* Discount */}
                <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 flex items-center justify-between">
                  <div>
                    <h4 className="text-[13.5px] font-black text-amber-950">Special Discount (₹)</h4>
                    <p className="text-[11.5px] text-amber-800">Deduct custom discount</p>
                  </div>
                  <input
                    type="number"
                    min="0"
                    value={form.pricing?.discountAmount || 0}
                    onChange={(e) => setForm((p) => ({ ...p, pricing: { ...p.pricing, discountAmount: parseFloat(e.target.value) || 0 } }))}
                    className="w-28 px-3 py-1.5 rounded-xl border border-amber-300 font-black text-[14px] bg-white text-right"
                  />
                </div>

                <PricingPanel
                  value={form.pricing || {}}
                  onChange={(pricing) => setForm((p) => ({ ...p, pricing }))}
                  onAccommodationOptionsChange={(accommodationOptions) => setForm((p) => ({ ...p, accommodationOptions }))}
                  accommodationOptions={form.accommodationOptions || []}
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
                  <p className="text-[13px] text-slate-500 mt-0.5">Cancellation terms and trip guidelines</p>
                </div>

                <InstructionPanel
                  value={form.instructions || []}
                  onChange={(instructions) => setForm((p) => ({ ...p, instructions }))}
                />
              </div>
            )}

            {/* 7. Review Step */}
            {currentSection === "review" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-[18px] font-black text-slate-900">Update Quotation</h2>
                  <p className="text-[13px] text-slate-500 mt-0.5">Save revisions to update client web link &amp; PDF</p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3 text-[13px]">
                  <div className="flex justify-between py-1 border-b border-slate-200/60">
                    <span className="text-slate-500 font-semibold">Client Name</span>
                    <span className="font-extrabold text-slate-900">{form.client?.name} ({form.client?.phone})</span>
                  </div>
                  <div className="flex justify-between py-1.5 font-bold text-[14px]">
                    <span>Updated Total Quotation Amount</span>
                    <span className="text-emerald-700 font-black">₹{finalPrice.toLocaleString("en-IN")}</span>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => handleUpdate(form.status)}
                    disabled={saving}
                    className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white font-black text-[14px] transition-all shadow-md disabled:opacity-50"
                  >
                    {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                    Save &amp; Update Live Proposal
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

          {/* Sidebar */}
          <div className="lg:col-span-4 sticky top-24 space-y-4">
            <div className="bg-slate-900 text-white rounded-3xl p-6 border border-slate-800 shadow-xl space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Live Quote Summary</span>
                <span className="font-mono text-[11px] font-black px-2 py-0.5 rounded-md bg-indigo-600 text-white">
                  {form.quotationCode}
                </span>
              </div>

              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Client</p>
                <p className="text-[15px] font-black text-white">{form.client?.name}</p>
                {form.client?.phone && <p className="text-[12px] text-slate-400 mt-0.5">{form.client.phone}</p>}
              </div>

              <div className="space-y-2.5 pt-3 border-t border-slate-800 text-[12.5px]">
                <div className="flex justify-between text-slate-300">
                  <span>Accommodation</span>
                  <span className="font-bold text-white">₹{accommodationTotal.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Vehicle ({form.vehicle?.vehicleType || "Sedan"})</span>
                  <span className="font-bold text-white">₹{vehicleTotal.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between text-slate-300 font-bold pt-2 border-t border-slate-800">
                  <span>Net Base Cost</span>
                  <span className="text-indigo-300">₹{subtotal.toLocaleString("en-IN")}</span>
                </div>
              </div>

              {/* Price card */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950 to-purple-950 border border-indigo-500/30 space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-300">Grand Total Value</p>
                <p className="text-[24px] font-black text-emerald-400 leading-tight">
                  ₹{finalPrice.toLocaleString("en-IN")}
                </p>
                <div className="pt-2 border-t border-white/10 grid grid-cols-2 gap-2 text-[11px]">
                  <div className="bg-white/5 rounded-xl p-2">
                    <p className="text-indigo-200 text-[10px] font-bold">Per Couple</p>
                    <p className="font-black text-[13px] text-white">₹{perCouplePrice.toLocaleString("en-IN")}</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-2">
                    <p className="text-indigo-200 text-[10px] font-bold">Per Person</p>
                    <p className="font-black text-[13px] text-white">₹{perPersonPrice.toLocaleString("en-IN")}</p>
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
