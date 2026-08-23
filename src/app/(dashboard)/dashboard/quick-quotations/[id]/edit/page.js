"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Zap, ArrowLeft, Loader2, Sparkles, Plus, Trash2, IndianRupee,
  MapPin, Calendar, Users, Hotel, Car, Check, AlertCircle, Eye,
  Tag, ShieldCheck, Heart, Mountain, Compass, Waves, Trees,
  Baby, CheckCircle2, Layers, FileText, Info, Building, Star,
  CheckCheck, Edit3, Package as PackageIcon,
} from "lucide-react";
import { getVehicleImage } from "@/components/packages/VehiclePanel";
import InstructionsEditorModal from "@/components/quick-quotations/InstructionsEditorModal";
import QuickPackageFetchModal from "@/components/quick-quotations/QuickPackageFetchModal";
import QuickItinerarySection from "@/components/quick-quotations/QuickItinerarySection";
import QuickAccommodationSection from "@/components/quick-quotations/QuickAccommodationSection";

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

export default function EditQuickQuotationPage({ params }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const id = resolvedParams.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [converting, setConverting] = useState(false);
  const [instructionsModalOpen, setInstructionsModalOpen] = useState(false);
  const [packageModalOpen, setPackageModalOpen] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState(null);

  // Fetch package handler to auto-populate all quotation parameters
  function handleSelectPackage(pkg) {
    if (!pkg || !form) return;

    const nights = pkg.duration?.nights || pkg.nights || (pkg.destinations && pkg.destinations.reduce((acc, d) => acc + (d.nights || 1), 0)) || form.tripDetails?.nights || 4;
    const days = pkg.duration?.days || pkg.days || nights + 1;

    // Calculate return date based on current departure date and package nights
    const s = form.tripDetails?.startDate || new Date().toISOString().split("T")[0];
    const d = new Date(s);
    d.setDate(d.getDate() + nights);
    const end = d.toISOString().split("T")[0];

    const primaryDest =
      pkg.destination ||
      (pkg.destinations && pkg.destinations.map((d) => d.cityName).filter(Boolean).join(", ")) ||
      form.tripDetails?.destination || "Destination";

    // Extract hotel stays from package
    let stays = [];
    const sourceStays =
      (pkg.accommodationOptions && pkg.accommodationOptions[0]?.nights) ||
      (pkg.accommodation && pkg.accommodation[0]?.nights) ||
      [];

    if (sourceStays.length > 0) {
      stays = sourceStays.map((st, i) => ({
        nightNumber: st.night || i + 1,
        cityName: st.cityName || primaryDest,
        hotelName: st.hotelName || "",
        starRating: Math.max(1, Math.min(5, parseInt(st.starRating, 10) || 3)),
        roomType: st.roomType || "Deluxe AC Room",
        mealPlan: (st.mealPlan && ["EP", "CP", "MAP", "AP"].includes(String(st.mealPlan).toUpperCase())) ? String(st.mealPlan).toUpperCase() : "CP",
        pricePerNight: st.pricePerNight || 0,
        notes: st.notes || "",
      }));
    } else if (pkg.destinations && pkg.destinations.length > 0) {
      let nightCounter = 1;
      pkg.destinations.forEach((dest) => {
        const destNights = dest.nights || 1;
        for (let k = 0; k < destNights; k++) {
          stays.push({
            nightNumber: nightCounter++,
            cityName: dest.cityName || primaryDest,
            hotelName: "",
            starRating: 3,
            roomType: "Deluxe AC Room",
            mealPlan: "CP",
            pricePerNight: 0,
            notes: "",
          });
        }
      });
    }

    if (stays.length === 0) {
      for (let i = 0; i < nights; i++) {
        stays.push({
          nightNumber: i + 1,
          cityName: primaryDest,
          hotelName: "",
          starRating: 3,
          roomType: "Deluxe AC Room",
          mealPlan: "CP",
          pricePerNight: 0,
          notes: "",
        });
      }
    }

    // Extract day-by-day itinerary from package
    let itineraryDays = [];
    if (pkg.itinerary && Array.isArray(pkg.itinerary) && pkg.itinerary.length > 0) {
      itineraryDays = pkg.itinerary.map((d, i) => ({
        day: d.day || i + 1,
        title: d.title || `Day ${i + 1}: Sightseeing in ${primaryDest}`,
        description: d.description || "",
        activities: Array.isArray(d.activities)
          ? d.activities.map((a) => (typeof a === "string" ? a : a.name || a.title || a.activityName || "")).filter(Boolean)
          : [],
        meals: {
          breakfast: d.meals?.breakfast !== undefined ? Boolean(d.meals?.breakfast) : true,
          lunch: Boolean(d.meals?.lunch),
          dinner: Boolean(d.meals?.dinner),
        },
      }));
    } else {
      for (let i = 1; i <= days; i++) {
        itineraryDays.push({
          day: i,
          title: i === 1
            ? `Arrival in ${primaryDest} & Hotel Check-in`
            : i === days
            ? `Departure from ${primaryDest} with Cherished Memories`
            : `Day ${i}: ${primaryDest} Highlights & Exploration`,
          description: i === 1
            ? `Arrive and transfer to hotel. Enjoy evening at leisure.`
            : i === days
            ? `Breakfast at hotel, check-out and transfer for departure journey.`
            : `Full day sightseeing and exploring scenic attractions.`,
          activities: i === 1 ? ["Arrival Transfer", "Hotel Check-in"] : i === days ? ["Departure Transfer"] : ["Sightseeing Tour"],
          meals: { breakfast: true, lunch: false, dinner: i === 1 },
        });
      }
    }

    const pkgPrice =
      pkg.pricing?.finalPrice ||
      pkg.pricing?.totalSellingPrice ||
      pkg.pricing?.grandTotal ||
      pkg.pricing?.subtotal ||
      pkg.pricing?.totalPrice ||
      pkg.price ||
      form.pricing?.totalPrice ||
      0;

    const pkgInclusions = (pkg.inclusions && pkg.inclusions.length > 0)
      ? pkg.inclusions
      : (pkg.pricing?.includes && pkg.pricing.includes.length > 0)
      ? pkg.pricing.includes
      : form.inclusions;

    const pkgExclusions = (pkg.exclusions && pkg.exclusions.length > 0)
      ? pkg.exclusions
      : (pkg.pricing?.excludes && pkg.pricing.excludes.length > 0)
      ? pkg.pricing.excludes
      : form.exclusions;

    const clientPart = form.client?.name?.trim() ? ` for ${form.client.name.trim()}` : "";
    const newTitle = pkg.title ? `${pkg.title}${clientPart}` : `${nights}N/${days}D ${primaryDest} Holiday${clientPart}`;

    setForm((prev) => ({
      ...prev,
      tripDetails: {
        ...prev.tripDetails,
        title: newTitle,
        destination: primaryDest,
        theme: pkg.theme || pkg.category || prev.tripDetails?.theme || "honeymoon",
        startDate: s,
        endDate: end,
        nights: nights,
        days: days,
      },
      hotelStays: stays,
      itinerary: itineraryDays,
      vehicle: {
        vehicleType: pkg.vehicle?.vehicleType || prev.vehicle?.vehicleType || "Sedan",
        model: pkg.vehicle?.model || prev.vehicle?.model || "Dzire / Etios",
        seats: pkg.vehicle?.seats || prev.vehicle?.seats || 4,
        acType: pkg.vehicle?.acType || prev.vehicle?.acType || "AC",
        vehiclePrice: pkg.vehicle?.vehiclePrice || prev.vehicle?.vehiclePrice || 0,
        notes: pkg.vehicle?.notes || prev.vehicle?.notes || "Includes fuel, toll taxes, parking & driver allowance",
      },
      inclusions: pkgInclusions,
      exclusions: pkgExclusions,
      pricing: {
        ...prev.pricing,
        totalPrice: pkgPrice,
        discountAmount: 0,
      },
    }));
  }

  useEffect(() => {
    fetch(`/api/quick-quotations/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        const qq = data.quickQuotation;
        const sDate = qq.tripDetails?.startDate ? new Date(qq.tripDetails.startDate).toISOString().split("T")[0] : "";
        const eDate = qq.tripDetails?.endDate ? new Date(qq.tripDetails.endDate).toISOString().split("T")[0] : "";

        setForm({
          ...qq,
          tripDetails: {
            ...qq.tripDetails,
            startDate: sDate,
            endDate: eDate,
          },
          passengers: {
            ...qq.passengers,
            childrenCount: qq.passengers?.childrenCount || qq.passengers?.childrenAges?.length || 0,
            childrenAges: qq.passengers?.childrenAges || [],
          },
          specialInstructions: qq.specialInstructions?.length > 0 ? qq.specialInstructions : [
            "Hotel check-in is typically at 12:00 PM and check-out is at 10:00 AM.",
            "Valid Government Photo ID is mandatory for all adult guests at hotel check-in.",
            "Driver contact details will be shared on WhatsApp 24 hours prior to travel.",
            "AC in vehicles will be switched off while driving in hilly terrains or when stationary.",
          ],
          pricing: {
            ...qq.pricing,
            totalPrice: qq.pricing?.totalPrice || qq.pricing?.baseCost || qq.pricing?.finalPrice || 0,
            discountAmount: qq.pricing?.discountAmount || 0,
            advanceType: qq.pricing?.advanceType || "absolute",
            advanceAmount: qq.pricing?.advanceAmount !== undefined ? qq.pricing?.advanceAmount : (qq.pricing?.advancePayment || 0),
            advancePercentage: qq.pricing?.advancePercentage || 25,
          },
        });
      })
      .catch((err) => setError(err.message || "Failed to load quotation"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
      </div>
    );
  }

  if (!form) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8fafc] gap-3">
        <p className="text-rose-600 font-bold">{error || "Quick quotation not found"}</p>
        <Link href="/dashboard/quick-quotations" className="text-slate-600 font-bold underline">
          Back to Quick Quotes
        </Link>
      </div>
    );
  }

  // Date calculation helper
  function handleDateChange(start, end) {
    const s = new Date(start);
    const e = new Date(end);
    let diffDays = Math.round((e - s) / (1000 * 60 * 60 * 24));
    if (isNaN(diffDays) || diffDays < 1) diffDays = 1;

    setForm((prev) => {
      let updatedStays = [...(prev.hotelStays || [])];
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
    const s = form.tripDetails.startDate || new Date().toISOString().split("T")[0];
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
  const totalPrice = Number(form.pricing?.totalPrice) || 0;
  const discountAmt = Math.max(0, Number(form.pricing?.discountAmount) || 0);
  const finalPrice = Math.max(0, totalPrice - discountAmt);
  const numPax = Math.max(1, form.passengers?.adults || 2);
  const perPersonPrice = Math.round(finalPrice / numPax);
  const perCouplePrice = finalPrice;

  // Advance Payment calculations (by default Absolute)
  const advanceType = form.pricing?.advanceType || "absolute";
  const advancePercentage = Math.max(0, Math.min(100, Number(form.pricing?.advancePercentage) || 25));
  let advancePayment = 0;
  if (advanceType === "percentage") {
    advancePayment = Math.round((finalPrice * advancePercentage) / 100);
  } else {
    advancePayment = form.pricing?.advanceAmount !== undefined && form.pricing?.advanceAmount !== null && form.pricing?.advanceAmount !== ""
      ? Math.max(0, Number(form.pricing.advanceAmount) || 0)
      : (finalPrice > 0 ? Math.round(finalPrice * 0.25) : 0);
  }
  advancePayment = Math.min(finalPrice, Math.max(0, advancePayment));
  const balancePayment = Math.max(0, finalPrice - advancePayment);
  const effectiveAdvancePct = finalPrice > 0 ? Math.round((advancePayment / finalPrice) * 100) : 0;

  function addStay() {
    setForm((prev) => {
      const nextNight = (prev.hotelStays || []).length + 1;
      const lastCity = prev.hotelStays[prev.hotelStays.length - 1]?.cityName || prev.tripDetails.destination;
      return {
        ...prev,
        hotelStays: [
          ...(prev.hotelStays || []),
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

  async function handleUpdate(targetStatus) {
    setError("");
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
          advanceType,
          advanceAmount: advanceType === "absolute" ? advancePayment : (form.pricing?.advanceAmount || 0),
          advancePercentage,
          advancePayment,
          balancePayment,
        },
        status: targetStatus || form.status,
      };

      const res = await fetch(`/api/quick-quotations/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update quotation");

      router.push("/dashboard/quick-quotations");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleConvert() {
    if (!confirm("Convert this Quick Quote into a Full Detailed Quotation?")) return;
    setConverting(true);
    try {
      const res = await fetch(`/api/quick-quotations/${id}/convert`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Conversion failed");
      router.push(`/dashboard/quotations/${data.quotationId}/edit`);
    } catch (err) {
      alert(`Conversion error: ${err.message}`);
      setConverting(false);
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
              <Zap className="w-3 h-3 text-amber-500" /> Edit Quick Quote • {form.quickQuoteCode}
            </span>
            <h1 className="text-[15px] font-black text-slate-900 leading-snug mt-0.5 truncate max-w-sm">
              {form.tripDetails.title}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setPackageModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 text-[12.5px] font-black transition-all shadow-2xs hover:scale-105 active:scale-95"
          >
            <PackageIcon className="w-4 h-4 text-indigo-600" />
            <span>Fetch Package</span>
          </button>

          {form.status !== "converted" && (
            <button
              type="button"
              onClick={handleConvert}
              disabled={converting}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 font-extrabold text-[12.5px] transition-all disabled:opacity-50"
            >
              {converting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Layers className="w-3.5 h-3.5 text-purple-600" />}
              <span>Upgrade to Full Quote</span>
            </button>
          )}

          <a
            href={`/quick-quote/${form.quickQuoteCode}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold text-[12.5px] transition-all"
          >
            <Eye className="w-3.5 h-3.5" /> View Proposal
          </a>

          <button
            type="button"
            onClick={() => handleUpdate(form.status)}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-white text-[13px] font-black shadow-md shadow-amber-500/25 transition-all disabled:opacity-50"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Save &amp; Update
          </button>
        </div>
      </header>

      {/* ── Main Form Container ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6">
        {error && (
          <div className="flex items-center gap-2.5 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-[13.5px] mb-6">
            <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Form (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* 1. Client Details */}
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
                    value={form.client?.name || ""}
                    onChange={(e) => setForm((p) => ({ ...p, client: { ...p.client, name: e.target.value } }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-[13.5px] font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-bold text-slate-600 mb-1.5">WhatsApp / Phone Number *</label>
                  <input
                    type="text"
                    value={form.client?.phone || ""}
                    onChange={(e) => setForm((p) => ({ ...p, client: { ...p.client, phone: e.target.value } }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-[13.5px] font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-bold text-slate-600 mb-1.5">Email Address</label>
                  <input
                    type="email"
                    value={form.client?.email || ""}
                    onChange={(e) => setForm((p) => ({ ...p, client: { ...p.client, email: e.target.value } }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-[13.5px] font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-bold text-slate-600 mb-1.5">Client Type</label>
                  <select
                    value={form.client?.clientType || "b2c"}
                    onChange={(e) => setForm((p) => ({ ...p, client: { ...p.client, clientType: e.target.value } }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-[13.5px] font-semibold"
                  >
                    <option value="b2c">B2C (Direct Traveler)</option>
                    <option value="b2b">B2B (Travel Agent)</option>
                    <option value="corporate">Corporate / Group</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 2. Destination & Dates */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs space-y-5">
              <div className="flex items-center justify-between gap-3 pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-black text-[12px]">
                    2
                  </div>
                  <h3 className="text-[16px] font-black text-slate-900">Destination &amp; Travel Dates</h3>
                </div>

                <button
                  type="button"
                  onClick={() => setPackageModalOpen(true)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 text-[12px] font-black transition-all shadow-2xs hover:scale-105 active:scale-95"
                >
                  <PackageIcon className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Fetch from Travel Packages</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-bold text-slate-600 mb-1.5">Primary Destination *</label>
                  <input
                    type="text"
                    value={form.tripDetails?.destination || ""}
                    onChange={(e) => setForm((p) => ({ ...p, tripDetails: { ...p.tripDetails, destination: e.target.value } }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-[13.5px] font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-bold text-slate-600 mb-1.5">Quotation Title</label>
                  <input
                    type="text"
                    value={form.tripDetails?.title || ""}
                    onChange={(e) => setForm((p) => ({ ...p, tripDetails: { ...p.tripDetails, title: e.target.value } }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-[13.5px] font-semibold"
                  />
                </div>
              </div>

              {/* Theme selector */}
              <div>
                <label className="block text-[12px] font-bold text-slate-600 mb-1.5">Travel Theme / Style</label>
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {THEMES.map((th) => {
                    const Icon = th.icon;
                    const isSel = form.tripDetails?.theme === th.id;
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
                          form.tripDetails?.nights === ps.n
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
                      value={form.tripDetails?.startDate || ""}
                      onChange={(e) => handleDateChange(e.target.value, form.tripDetails?.endDate)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-bold text-[13px] text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Return Date</label>
                    <input
                      type="date"
                      value={form.tripDetails?.endDate || ""}
                      min={form.tripDetails?.startDate}
                      onChange={(e) => handleDateChange(form.tripDetails?.startDate, e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-bold text-[13px] text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Calculated Duration</label>
                    <div className="w-full px-3 py-2 rounded-xl border border-amber-200 bg-amber-50/70 font-black text-[13px] text-amber-900 text-center flex items-center justify-center gap-1">
                      <span>{form.tripDetails?.nights || 4} Nights</span>
                      <span>/</span>
                      <span>{form.tripDetails?.days || 5} Days</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Passenger Configuration */}
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
                      value={form.passengers?.adults || 2}
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
                      value={form.passengers?.childrenCount || 0}
                      onChange={(e) => handleChildrenCountChange(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-center font-bold text-[13px]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Infants (0-2 yrs)</label>
                    <input
                      type="number"
                      min="0"
                      value={form.passengers?.infants || 0}
                      onChange={(e) => setForm((p) => ({ ...p, passengers: { ...p.passengers, infants: parseInt(e.target.value, 10) || 0 } }))}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-center font-bold text-[13px]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Total Rooms</label>
                    <input
                      type="number"
                      min="1"
                      value={form.passengers?.totalRooms || 1}
                      onChange={(e) => setForm((p) => ({ ...p, passengers: { ...p.passengers, totalRooms: parseInt(e.target.value, 10) || 1 } }))}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-center font-bold text-[13px]"
                    />
                  </div>
                </div>

                {/* Dynamic Individual Child Ages */}
                {form.passengers?.childrenCount > 0 && (
                  <div className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-200 space-y-2">
                    <div className="flex items-center gap-1.5 text-indigo-900 font-bold text-[11.5px]">
                      <Baby className="w-4 h-4 text-indigo-600" />
                      <span>Specify Individual Child Ages ({form.passengers.childrenCount} {form.passengers.childrenCount === 1 ? "Child" : "Children"}):</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {(form.passengers.childrenAges || []).map((age, idx) => (
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

            {/* ── 3. Day-by-Day Tour Itinerary ── */}
            <QuickItinerarySection
              itinerary={form.itinerary || []}
              onChange={(updated) => setForm((p) => ({ ...p, itinerary: updated }))}
              showItinerary={form.showItinerary !== false}
              onToggleShowItinerary={() => setForm((p) => ({ ...p, showItinerary: !p.showItinerary }))}
              daysCount={form.tripDetails?.days || 5}
              destination={form.tripDetails?.destination || ""}
              theme={form.tripDetails?.theme || "general"}
              hotelStays={form.hotelStays || []}
            />

            {/* ── 4. Hotel Accommodation Portfolio ── */}
            <QuickAccommodationSection
              hotelStays={form.hotelStays || []}
              onChange={(updated) => setForm((p) => ({ ...p, hotelStays: updated }))}
              totalNights={form.tripDetails?.nights || 4}
              primaryDestination={form.tripDetails?.destination || ""}
            />

            {/* 4. Dedicated Transport */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-black text-[12px]">
                  4
                </div>
                <div>
                  <h3 className="text-[16px] font-black text-slate-900">Dedicated Transport &amp; Vehicle</h3>
                  <p className="text-[11.5px] text-slate-400 font-medium">Select vehicle type for transfers and sightseeing</p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {VEHICLE_OPTIONS.map((v) => {
                  const isSel = form.vehicle?.vehicleType === v.type;
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
                    value={form.vehicle?.model || ""}
                    onChange={(e) => setForm((p) => ({ ...p, vehicle: { ...p.vehicle, model: e.target.value } }))}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-[13px] font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-bold text-slate-600 mb-1">AC Type</label>
                  <select
                    value={form.vehicle?.acType || "AC"}
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

            {/* 6. Redesigned Review of Package Summary Card */}
            <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 border border-slate-800 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

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
                    {form.tripDetails?.nights || 4}N / {form.tripDetails?.days || 5}D Tour
                  </span>
                </div>
              </div>

              {/* 4-Box Key Highlights Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 relative z-10 text-[12.5px]">
                <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">Client / Party</span>
                  <p className="font-black text-white text-[14px] truncate">{form.client?.name || "Client Name"}</p>
                  <p className="text-slate-300 font-mono text-[11px]">{form.client?.phone || "No Phone"}</p>
                </div>

                <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-sky-400">Destination</span>
                  <p className="font-black text-white text-[14px] truncate">{form.tripDetails?.destination || "Destination"}</p>
                  <p className="text-slate-300 text-[11px]">{form.tripDetails?.startDate} to {form.tripDetails?.endDate}</p>
                </div>

                <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Travelers</span>
                  <p className="font-black text-white text-[14px]">
                    {form.passengers?.adults || 2} Adults
                    {form.passengers?.childrenCount > 0 ? `, ${form.passengers.childrenCount} Child` : ""}
                  </p>
                  <p className="text-slate-300 text-[11px]">
                    {form.passengers?.childrenCount > 0
                      ? `Ages: ${form.passengers.childrenAges?.join(", ")} yrs • ${form.passengers.totalRooms || 1} Room`
                      : `${form.passengers?.totalRooms || 1} Room(s)`}
                  </p>
                </div>

                <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-purple-400">Private Cab</span>
                  <p className="font-black text-white text-[14px] truncate">{form.vehicle?.vehicleType}</p>
                  <p className="text-slate-300 text-[11px] truncate">{form.vehicle?.model || "Dzire / Etios"}</p>
                </div>
              </div>

              {/* Night-by-Night Accommodation Timeline Review */}
              <div className="pt-2 border-t border-white/10 space-y-2 relative z-10">
                <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Accommodation Itinerary ({(form.hotelStays || []).length} Stays):</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(form.hotelStays || []).map((s, i) => (
                    <div key={i} className="flex items-center justify-between bg-white/5 px-3.5 py-2 rounded-xl border border-white/5 text-[12px]">
                      <div className="flex items-center gap-2 truncate">
                        <span className="w-5 h-5 rounded-md bg-amber-500/20 text-amber-300 font-mono font-black text-[10px] flex items-center justify-center flex-shrink-0">
                          N{s.nightNumber}
                        </span>
                        <span className="text-slate-300 font-bold truncate">
                          {s.cityName || form.tripDetails?.destination}: <span className="text-white font-black">{s.hotelName || "Quality Hotel"}</span>
                        </span>
                      </div>
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-white/10 text-amber-300 border border-white/10 flex-shrink-0">
                        {s.mealPlan}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Commercial Pill Banner with Advance Payment */}
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

                <div className="flex items-center gap-3 text-[12px]">
                  <div className="text-right">
                    <p className="text-slate-300 text-[10.5px]">Advance Token ({effectiveAdvancePct}%):</p>
                    <p className="font-black text-amber-300 font-mono text-[14px]">₹{advancePayment.toLocaleString("en-IN")}</p>
                  </div>
                  <div className="text-right pl-3 border-l border-white/15">
                    <p className="text-slate-400 text-[10.5px]">On-Trip Balance:</p>
                    <p className="font-black text-white font-mono text-[14px]">₹{balancePayment.toLocaleString("en-IN")}</p>
                  </div>
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
                    value={form.pricing?.totalPrice || ""}
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
                    value={form.pricing?.discountAmount || ""}
                    onChange={(e) => setForm((p) => ({ ...p, pricing: { ...p.pricing, discountAmount: parseFloat(e.target.value) || 0 } }))}
                    placeholder="0"
                    className="w-full pl-7 pr-3 py-2 rounded-xl border border-rose-200 bg-white text-[14px] font-bold text-right text-rose-900"
                  />
                </div>
              </div>

              {/* 🌟 Advance Payment Option (Absolute by default OR Percentage) */}
              <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[12px] font-black text-amber-950 flex items-center gap-1">
                    <IndianRupee className="w-3.5 h-3.5 text-amber-600" />
                    <span>Advance Payment</span>
                  </label>

                  {/* Mode Switcher: Absolute (Default) vs Percentage */}
                  <div className="flex items-center bg-white p-0.5 rounded-xl border border-amber-300 text-[11px] font-black shadow-2xs">
                    <button
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, pricing: { ...p.pricing, advanceType: "absolute" } }))}
                      className={`px-2.5 py-0.5 rounded-lg transition-all ${
                        advanceType === "absolute"
                          ? "bg-amber-500 text-white shadow-2xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      ₹ Fixed (Default)
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, pricing: { ...p.pricing, advanceType: "percentage" } }))}
                      className={`px-2.5 py-0.5 rounded-lg transition-all ${
                        advanceType === "percentage"
                          ? "bg-amber-500 text-white shadow-2xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      % Percent
                    </button>
                  </div>
                </div>

                {advanceType === "absolute" ? (
                  /* Absolute Amount Input Mode (Default) */
                  <div className="space-y-2">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-700 font-bold text-[13px]">₹</span>
                      <input
                        type="number"
                        min="0"
                        max={finalPrice}
                        value={form.pricing?.advanceAmount !== undefined && form.pricing?.advanceAmount !== null ? form.pricing.advanceAmount : advancePayment}
                        onChange={(e) => {
                          const val = e.target.value === "" ? "" : parseFloat(e.target.value);
                          setForm((p) => ({ ...p, pricing: { ...p.pricing, advanceAmount: val } }));
                        }}
                        placeholder="e.g. 10000"
                        className="w-full pl-7 pr-3 py-2 rounded-xl border border-amber-300 bg-white font-black text-[14px] text-amber-950 focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-right font-mono"
                      />
                    </div>

                    {/* Quick Preset Buttons for Absolute Amount */}
                    <div className="flex items-center gap-1 overflow-x-auto pt-0.5">
                      {[5000, 10000, 15000, 20000, 25000].map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setForm((p) => ({ ...p, pricing: { ...p.pricing, advanceAmount: amt } }))}
                          className="px-2 py-0.5 rounded-md bg-white hover:bg-amber-100 text-amber-900 border border-amber-200 text-[10.5px] font-bold whitespace-nowrap transition-colors"
                        >
                          ₹{(amt / 1000)}k
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  /* Percentage Input Mode */
                  <div className="space-y-2">
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={form.pricing?.advancePercentage !== undefined ? form.pricing.advancePercentage : 25}
                        onChange={(e) => setForm((p) => ({ ...p, pricing: { ...p.pricing, advancePercentage: parseFloat(e.target.value) || 0 } }))}
                        placeholder="25"
                        className="w-full pl-3 pr-7 py-2 rounded-xl border border-amber-300 bg-white font-black text-[14px] text-amber-950 focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-right font-mono"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-700 font-bold text-[13px]">%</span>
                    </div>

                    {/* Quick Preset Buttons for Percentage */}
                    <div className="flex items-center gap-1 overflow-x-auto pt-0.5">
                      {[20, 25, 30, 40, 50].map((pct) => (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => setForm((p) => ({ ...p, pricing: { ...p.pricing, advancePercentage: pct } }))}
                          className="px-2 py-0.5 rounded-md bg-white hover:bg-amber-100 text-amber-900 border border-amber-200 text-[10.5px] font-bold whitespace-nowrap transition-colors"
                        >
                          {pct}%
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Advance vs Balance Live Breakdown */}
                <div className="pt-2 border-t border-amber-200/80 flex items-center justify-between text-[11.5px]">
                  <div>
                    <span className="text-amber-800 font-medium">To Collect:</span>{" "}
                    <span className="font-black text-amber-950">₹{advancePayment.toLocaleString("en-IN")}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium">Balance:</span>{" "}
                    <span className="font-bold text-slate-700">₹{balancePayment.toLocaleString("en-IN")}</span>
                  </div>
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
                  <span>Advance Token ({effectiveAdvancePct}%):</span>
                  <span className="font-black">₹{advancePayment.toLocaleString("en-IN")}</span>
                </div>
              </div>

              {/* Save Button */}
              <button
                type="button"
                onClick={() => handleUpdate(form.status)}
                disabled={saving}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-white font-black text-[13.5px] shadow-md shadow-amber-500/25 transition-all flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                <Zap className="w-4 h-4" />
                <span>Save &amp; Update Proposal</span>
              </button>
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

      {/* Travel Package Auto-Fetch & Import Modal */}
      <QuickPackageFetchModal
        isOpen={packageModalOpen}
        onClose={() => setPackageModalOpen(false)}
        onSelectPackage={handleSelectPackage}
      />
    </div>
  );
}
