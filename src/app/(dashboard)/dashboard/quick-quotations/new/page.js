"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Zap, ArrowLeft, Loader2, Sparkles, Plus, Trash2, IndianRupee,
  MapPin, Calendar, Users, Hotel, Car, Check, AlertCircle, Eye,
  Tag, ShieldCheck, Heart, Mountain, Compass, Waves, Trees,
  Baby, CheckCircle2, ChevronRight, FileText, Info, HelpCircle,
  Star, Clock, Building, Compass as CompassIcon, Shield, CheckCheck, Edit3,
  Package as PackageIcon, Percent, X,
} from "lucide-react";
import { getVehicleImage } from "@/components/packages/VehiclePanel";
import InstructionsEditorModal from "@/components/quick-quotations/InstructionsEditorModal";
import QuickPackageFetchModal from "@/components/quick-quotations/QuickPackageFetchModal";
import QuickItinerarySection, { syncItineraryWithHotelStays } from "@/components/quick-quotations/QuickItinerarySection";
import QuickAccommodationSection from "@/components/quick-quotations/QuickAccommodationSection";
import CustomDatePicker from "@/components/quick-quotations/CustomDatePicker";

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
  const searchParams = useSearchParams();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showAgentGuide, setShowAgentGuide] = useState(true);
  const [instructionsModalOpen, setInstructionsModalOpen] = useState(false);
  const [packageModalOpen, setPackageModalOpen] = useState(false);

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
      endDate: "",
      nights: 1,
      days: 2,
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
        category: "None",
        starRating: 3,
        roomType: "",
        mealPlan: "CP",
        notes: "",
        pricePerNight: 0,
      },
    ],
    accommodationOptions: [
      {
        label: "Option 1",
        category: "None",
        hotelStays: [
          {
            nightNumber: 1,
            cityName: "",
            hotelName: "",
            category: "None",
            starRating: 3,
            roomType: "",
            mealPlan: "CP",
            notes: "",
            pricePerNight: 0,
          },
        ],
        totalPrice: 0,
      },
    ],
    showItinerary: false,
    itinerary: [],
    vehicle: {
      vehicleType: "Sedan",
      model: "",
      seats: 4,
      acType: "AC",
      notes: "",
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
      markupType: "absolute",
      markupPercentage: 0,
      markupAmount: 0,
      discountAmount: 0,
      discountReason: "",
      includeGst: false,
      gstPercentage: 5,
      gstAmount: 0,
      advanceType: "absolute",
      advanceAmount: 0,
      advancePercentage: 25,
    },
    internalNotes: "",
  });

  const [importedPkg, setImportedPkg] = useState(null);

  // Fetch package handler to auto-populate all quotation parameters
  const handleSelectPackage = useCallback((pkg) => {
    if (!pkg) return;
    setImportedPkg(pkg);

    // Accurately resolve exact nights & days from package
    const nights = Math.max(
      1,
      parseInt(
        pkg.nights ||
        pkg.duration?.nights ||
        (pkg.accommodationOptions && pkg.accommodationOptions[0]?.nights?.length) ||
        (pkg.accommodation && pkg.accommodation[0]?.nights?.length) ||
        (pkg.destinations && pkg.destinations.reduce((acc, d) => acc + (parseInt(d.nights, 10) || 1), 0)) ||
        (pkg.itinerary && pkg.itinerary.length > 1 ? pkg.itinerary.length - 1 : 0) ||
        4,
        10
      )
    );

    const days = Math.max(
      nights + 1,
      parseInt(
        pkg.days ||
        pkg.duration?.days ||
        (pkg.itinerary && pkg.itinerary.length > 0 ? pkg.itinerary.length : 0) ||
        nights + 1,
        10
      )
    );

    // Calculate return date based on current departure date and package nights
    const s = getTomorrowDate();
    const d = new Date(s);
    d.setDate(d.getDate() + nights);
    const end = d.toISOString().split("T")[0];

    const primaryDest =
      pkg.destination ||
      (pkg.destinations && pkg.destinations.map((d) => d.cityName).filter(Boolean).join(", ")) ||
      "Destination";

    // Extract hotel stays from package grouped by destination / city
    let stays = [];
    const sourceStays =
      (pkg.accommodationOptions && pkg.accommodationOptions[0]?.nights) ||
      (pkg.accommodation && pkg.accommodation[0]?.nights) ||
      [];

    if (sourceStays.length > 0) {
      // Group continuous nights in the same city & hotel
      sourceStays.forEach((st) => {
        const city = st.cityName || primaryDest;
        const hotel = st.hotelName || "";
        const last = stays[stays.length - 1];
        if (last && last.cityName.toLowerCase() === city.toLowerCase() && (last.hotelName === hotel || !last.hotelName || !hotel)) {
          last.nights += 1;
          if (!last.hotelName && hotel) last.hotelName = hotel;
          if (!last.hotelId && st.hotelId) last.hotelId = st.hotelId;
          if ((!last.category || last.category === "None") && st.category) last.category = st.category;
        } else {
          stays.push({
            cityName: city,
            nights: 1,
            hotelId: st.hotelId || null,
            hotelName: hotel,
            roomId: st.roomId || null,
            category: st.category || "None",
            starRating: Math.max(1, Math.min(5, parseInt(st.starRating, 10) || 3)),
            roomType: st.roomType || "Deluxe AC Room",
            mealPlan: (st.mealPlan && ["EP", "CP", "MAP", "AP"].includes(String(st.mealPlan).toUpperCase())) ? String(st.mealPlan).toUpperCase() : "CP",
            availableMealPlans: st.availableMealPlans || (st.mealPlan === "EP" ? ["EP", "CP", "MAP", "AP"] : ["CP", "MAP", "AP"]),
            pricePerNight: st.pricePerNight || 0,
            mealPrices: st.mealPrices || null,
            notes: st.notes || "",
          });
        }
      });
    } else if (pkg.destinations && pkg.destinations.length > 0) {
      pkg.destinations.forEach((dest) => {
        stays.push({
          cityName: dest.cityName || primaryDest,
          nights: Math.max(1, parseInt(dest.nights, 10) || 1),
          hotelId: null,
          hotelName: "",
          roomId: null,
          category: "None",
          starRating: 3,
          roomType: "Deluxe AC Room",
          mealPlan: "CP",
          pricePerNight: 0,
          notes: "",
        });
      });
    }

    if (stays.length === 0) {
      stays.push({
        cityName: primaryDest,
        nights: nights,
        hotelId: null,
        hotelName: "",
        roomId: null,
        category: "None",
        starRating: 3,
        roomType: "Deluxe AC Room",
        mealPlan: "CP",
        pricePerNight: 0,
        notes: "",
      });
    }

    // Calculate pure Net Base Cost: Hotels Base Cost (with room multiplier) + Cab Fleet Cost + Activities
    const roomMult = Math.max(1, parseInt(pkg.pricing?.numberOfRooms, 10) || Math.ceil((parseInt(pkg.pricing?.numberOfPersons || form.passengers?.adults, 10) || 2) / 2) || 1);
    
    // Extract multi-tier accommodation options from package if available
    let allAccommodationOptions = [];
    const pkgMarginType = pkg.pricing?.marginType || "absolute";
    const pkgMargin = Number(pkg.pricing?.margin) || 0;

    if (pkg.accommodationOptions && Array.isArray(pkg.accommodationOptions) && pkg.accommodationOptions.length > 0) {
      allAccommodationOptions = pkg.accommodationOptions.map((opt, oIdx) => {
        let optStays = [];
        const sourceNights = opt.nights || [];
        if (sourceNights.length > 0) {
          sourceNights.forEach((st) => {
            const city = st.cityName || primaryDest;
            const hotel = st.hotelName || "";
            const last = optStays[optStays.length - 1];
            if (last && last.cityName.toLowerCase() === city.toLowerCase() && (last.hotelName === hotel || !last.hotelName || !hotel)) {
              last.nights += 1;
              if (!last.hotelName && hotel) last.hotelName = hotel;
              if (!last.hotelId && st.hotelId) last.hotelId = st.hotelId;
              if ((!last.category || last.category === "None") && (st.category || opt.category)) {
                last.category = st.category || opt.category;
              }
            } else {
              optStays.push({
                cityName: city,
                nights: 1,
                hotelId: st.hotelId || null,
                hotelName: hotel,
                roomId: st.roomId || null,
                category: st.category || opt.category || "None",
                starRating: Math.max(1, Math.min(5, parseInt(st.starRating, 10) || 3)),
                roomType: st.roomType || "Deluxe AC Room",
                mealPlan: (st.mealPlan && ["EP", "CP", "MAP", "AP"].includes(String(st.mealPlan).toUpperCase())) ? String(st.mealPlan).toUpperCase() : "CP",
                availableMealPlans: st.availableMealPlans || (st.mealPlan === "EP" ? ["EP", "CP", "MAP", "AP"] : ["CP", "MAP", "AP"]),
                pricePerNight: st.pricePerNight || 0,
                mealPrices: st.mealPrices || null,
                notes: st.notes || "",
              });
            }
          });
        }
        const optBaseCost = optStays.reduce((sum, s) => sum + ((Number(s.pricePerNight) || 0) * (s.nights || 1) * roomMult), 0);
        const optMarginVal = Number(opt.margin) > 0 ? Number(opt.margin) : pkgMargin;
        const optMarginType = (Number(opt.margin) > 0 && opt.marginType) ? opt.marginType : pkgMarginType;
        const optMarginAmt = optMarginType === "percentage" ? (optBaseCost * optMarginVal) / 100 : optMarginVal;
        const optSellingPrice = optBaseCost + optMarginAmt;

        return {
          label: opt.label || `Option ${oIdx + 1}`,
          category: opt.category || "None",
          hotelStays: optStays.length > 0 ? optStays : stays,
          totalPrice: optSellingPrice,
          marginType: optMarginType,
          margin: optMarginVal,
        };
      });
    }

    if (allAccommodationOptions.length === 0) {
      const standardCost = stays.reduce((sum, s) => sum + ((Number(s.pricePerNight) || 0) * (s.nights || 1) * roomMult), 0);
      const standardMarginAmt = pkgMarginType === "percentage" ? (standardCost * pkgMargin) / 100 : pkgMargin;
      allAccommodationOptions.push({
        label: "Option 1",
        category: "None",
        hotelStays: stays.map((s) => ({ ...s, category: s.category || "None", starRating: s.starRating || 3 })),
        totalPrice: standardCost + standardMarginAmt,
        marginType: pkgMarginType,
        margin: pkgMargin,
      });
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

    // Dynamically resolve matching vehicle period from package based on departure date
    let matchedPeriod = null;
    if (Array.isArray(pkg.vehiclePeriods) && pkg.vehiclePeriods.length > 0) {
      if (s) {
        matchedPeriod = pkg.vehiclePeriods.find((p) => {
          if (!p.startDate && !p.endDate) return false;
          if (p.startDate && p.endDate) return s >= p.startDate && s <= p.endDate;
          if (p.startDate) return s >= p.startDate;
          if (p.endDate) return s <= p.endDate;
          return false;
        });
      }
      if (!matchedPeriod) matchedPeriod = pkg.vehiclePeriods[0];
    }

    const periodVehicles = (matchedPeriod?.vehicles && matchedPeriod.vehicles.length > 0)
      ? matchedPeriod.vehicles
      : (Array.isArray(pkg.vehicles) && pkg.vehicles.length > 0 ? pkg.vehicles : (pkg.vehicle?.vehicleType ? [pkg.vehicle] : []));

    const primaryVeh = periodVehicles[0] || {};
    const periodVehTotal = periodVehicles.reduce(
      (sum, v) => sum + ((Number(v.vehiclePrice ?? v.price) || 0) * (parseInt(v.quantity, 10) || 1)),
      0
    );

    const primaryOptionStays = (allAccommodationOptions[0]?.hotelStays && allAccommodationOptions[0].hotelStays.length > 0)
      ? allAccommodationOptions[0].hotelStays
      : stays;
    const hotelBaseCost = primaryOptionStays.reduce(
      (sum, s) => sum + ((Number(s.pricePerNight) || 0) * (s.nights || 1) * roomMult),
      0
    );

    let actTot = Number(pkg.pricing?.activitiesTotal) || 0;
    if (!actTot && Array.isArray(pkg.itinerary)) {
      pkg.itinerary.forEach((day) => {
        (day.activities || []).forEach((act) => {
          if (typeof act === "object" && act !== null) {
            actTot += Number(act.price) || 0;
          }
        });
      });
    }

    let netBaseCost = hotelBaseCost + periodVehTotal + actTot;
    if (netBaseCost <= 0 && pkg.pricing?.subtotal) {
      netBaseCost = Number(pkg.pricing.subtotal) || 0;
    }
    if (netBaseCost <= 0 && pkg.pricing?.totalPrice) {
      netBaseCost = Number(pkg.pricing.totalPrice) || 0;
    }

    // Automatically calculate package margin into base selling price
    const selectedOptIdx = pkg.pricing?.selectedOptionIndex || 0;
    const selectedOpt = pkg.accommodationOptions?.[selectedOptIdx] || pkg.accommodationOptions?.[0];
    const resolvedMargin = Number(selectedOpt?.margin) > 0 ? Number(selectedOpt.margin) : pkgMargin;
    const resolvedMarginType = (Number(selectedOpt?.margin) > 0 && selectedOpt?.marginType) ? selectedOpt.marginType : pkgMarginType;
    const pkgMarginAmount = resolvedMarginType === "percentage" ? (netBaseCost * resolvedMargin) / 100 : resolvedMargin;

    // Automatic calculation: Package Selling Price = Net Base Cost + Internal Package Margin
    const packageSellingPrice = netBaseCost + pkgMarginAmount;

    setForm((prev) => {
      const clientPart = prev.client?.name?.trim() ? ` for ${prev.client.name.trim()}` : "";
      const newTitle = pkg.title ? `${pkg.title}${clientPart}` : `${nights}N/${days}D ${primaryDest} Holiday${clientPart}`;
      const pkgInclusions = (pkg.inclusions && pkg.inclusions.length > 0)
        ? pkg.inclusions
        : (pkg.pricing?.includes && pkg.pricing.includes.length > 0)
        ? pkg.pricing.includes
        : prev.inclusions;

      const pkgExclusions = (pkg.exclusions && pkg.exclusions.length > 0)
        ? pkg.exclusions
        : (pkg.pricing?.excludes && pkg.pricing.excludes.length > 0)
        ? pkg.pricing.excludes
        : prev.exclusions;

      const currentStart = prev.tripDetails?.startDate || s;
      const curD = new Date(currentStart);
      curD.setDate(curD.getDate() + nights);
      const currentEnd = curD.toISOString().split("T")[0];

      return {
        ...prev,
        tripDetails: {
          ...prev.tripDetails,
          title: newTitle,
          destination: primaryDest,
          theme: pkg.theme || pkg.category || prev.tripDetails.theme || "honeymoon",
          startDate: currentStart,
          endDate: currentEnd,
          nights: nights,
          days: days,
        },
        hotelStays: primaryOptionStays,
        accommodationOptions: allAccommodationOptions,
        itinerary: syncItineraryWithHotelStays(itineraryDays, primaryOptionStays, days),
        vehicle: {
          vehicleType: primaryVeh.vehicleType || prev.vehicle.vehicleType || "Sedan",
          model: primaryVeh.model || prev.vehicle.model || "Dzire / Etios",
          seats: primaryVeh.seats || prev.vehicle.seats || 4,
          acType: primaryVeh.acType || prev.vehicle.acType || "AC",
          vehiclePrice: periodVehTotal,
          notes: primaryVeh.notes || "Includes fuel, toll taxes, parking & driver allowance",
        },
        inclusions: pkgInclusions,
        exclusions: pkgExclusions,
        pricing: {
          ...prev.pricing,
          totalPrice: packageSellingPrice,
          packageMargin: resolvedMargin,
          packageMarginType: resolvedMarginType,
          markupType: "absolute",
          markupAmount: 0,
          markupPercentage: 0,
          discountAmount: Number(pkg.pricing?.discountAmount) || 0,
          discountReason: pkg.pricing?.discountReason || "",
          includeGst: Boolean(pkg.pricing?.includeGst),
          gstPercentage: Number(pkg.pricing?.gstPercentage) || 5,
        },
      };
    });
  }, []);

  // Auto-fetch package from URL query param if present
  const packageIdParam = searchParams?.get("packageId");

  useEffect(() => {
    if (!packageIdParam) return;
    fetch(`/api/packages/${packageIdParam}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.package) {
          handleSelectPackage(data.package);
        }
      })
      .catch((err) => console.error("Failed to auto-fetch package from URL", err));
  }, [packageIdParam, handleSelectPackage]);

  function handleDestinationChange(newDest) {
    setForm((prev) => {
      const isStay1Empty = !prev.hotelStays?.[0]?.cityName || prev.hotelStays?.[0]?.cityName === prev.tripDetails?.destination;
      const updatedStays = isStay1Empty
        ? (prev.hotelStays || []).map((s, i) => (i === 0 ? { ...s, cityName: newDest } : s))
        : (prev.hotelStays || []);

      return {
        ...prev,
        tripDetails: {
          ...prev.tripDetails,
          destination: newDest,
        },
        hotelStays: updatedStays.length > 0 ? updatedStays : [{ cityName: newDest, nights: prev.tripDetails.nights || 4, category: "Deluxe", mealPlan: "CP", pricePerNight: 0 }],
      };
    });
  }

  // When user changes Departure Date (startDate), automatically shift Return Date (endDate) while preserving existing nights duration
  function handleStartDateChange(newStartDate) {
    if (!newStartDate) return;
    const currentNights = Math.max(1, form.tripDetails.nights || 4);
    const s = new Date(newStartDate);
    s.setDate(s.getDate() + currentNights);
    const newEndDate = s.toISOString().split("T")[0];

    setForm((prev) => ({
      ...prev,
      tripDetails: {
        ...prev.tripDetails,
        startDate: newStartDate,
        endDate: newEndDate,
      },
    }));
  }

  // When user manually adjusts Return Date (endDate), recalculate nights & days duration
  function handleEndDateChange(newEndDate) {
    if (!newEndDate) return;
    const startDate = form.tripDetails.startDate || getTomorrowDate();
    const s = new Date(startDate);
    const e = new Date(newEndDate);
    let diffDays = Math.round((e - s) / (1000 * 60 * 60 * 24));
    if (isNaN(diffDays) || diffDays < 1) diffDays = 1;

    setForm((prev) => {
      const stays = prev.hotelStays || [];
      const updatedStays = stays.length === 1
        ? [{ ...stays[0], nights: diffDays }]
        : stays;

      return {
        ...prev,
        tripDetails: {
          ...prev.tripDetails,
          startDate: startDate,
          endDate: newEndDate,
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

    setForm((prev) => {
      const stays = prev.hotelStays || [];
      const updatedStays = stays.length === 1
        ? [{ ...stays[0], nights }]
        : stays;

      return {
        ...prev,
        tripDetails: {
          ...prev.tripDetails,
          startDate: s,
          endDate: end,
          nights: nights,
          days: nights + 1,
        },
        hotelStays: updatedStays,
      };
    });
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
      const currentWithBed = Math.min(validCount, prev.passengers.childrenWithBed || 0);
      const currentWithoutBed = Math.max(0, validCount - currentWithBed);
      return {
        ...prev,
        passengers: {
          ...prev.passengers,
          childrenCount: validCount,
          childrenAges: updatedAges,
          childrenWithBed: currentWithBed,
          childrenWithoutBed: currentWithoutBed,
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

  function handleApplyPackageVehicle(pv) {
    const oldVehPrice = Number(form.vehicle?.vehiclePrice) || 0;
    const newVehPrice = ((Number(pv.vehiclePrice ?? pv.price) || 0) * (parseInt(pv.quantity, 10) || 1));
    const delta = newVehPrice - oldVehPrice;

    setForm((prev) => ({
      ...prev,
      vehicle: {
        ...prev.vehicle,
        vehicleType: pv.vehicleType || prev.vehicle.vehicleType || "Sedan",
        model: pv.model || prev.vehicle.model || "",
        seats: pv.seats || prev.vehicle.seats || 4,
        acType: pv.acType || prev.vehicle.acType || "AC",
        vehiclePrice: newVehPrice,
        notes: pv.notes || prev.vehicle.notes || "Includes fuel, toll taxes, parking & driver allowance",
      },
      pricing: {
        ...prev.pricing,
        totalPrice: Math.max(0, (Number(prev.pricing.totalPrice) || 0) + delta),
      },
    }));
  }

  function handleVehiclePriceChange(newVal) {
    const num = Number(newVal) || 0;
    const oldVehPrice = Number(form.vehicle?.vehiclePrice) || 0;
    const delta = num - oldVehPrice;
    setForm((prev) => ({
      ...prev,
      vehicle: {
        ...prev.vehicle,
        vehiclePrice: num,
      },
      pricing: {
        ...prev.pricing,
        totalPrice: Math.max(0, (Number(prev.pricing.totalPrice) || 0) + delta),
      },
    }));
  }

  // Available fleet options from imported package
  const currentVehiclePeriods = importedPkg?.vehiclePeriods || [];
  const sDate = form.tripDetails.startDate;
  let activePeriodFromPkg = null;
  if (currentVehiclePeriods.length > 0) {
    if (sDate) {
      activePeriodFromPkg = currentVehiclePeriods.find((p) => {
        if (!p.startDate && !p.endDate) return false;
        if (p.startDate && p.endDate) return sDate >= p.startDate && sDate <= p.endDate;
        if (p.startDate) return sDate >= p.startDate;
        if (p.endDate) return sDate <= p.endDate;
        return false;
      });
    }
    if (!activePeriodFromPkg) activePeriodFromPkg = currentVehiclePeriods[0];
  }

  const availablePackageVehicles = (activePeriodFromPkg?.vehicles && activePeriodFromPkg.vehicles.length > 0)
    ? activePeriodFromPkg.vehicles
    : (Array.isArray(importedPkg?.vehicles) && importedPkg.vehicles.length > 0 ? importedPkg.vehicles : []);

  // Pricing calculations
  const basePrice = Number(form.pricing.totalPrice) || 0;
  const markupType = form.pricing.markupType || "absolute";
  const markupPercentage = Math.max(0, Number(form.pricing.markupPercentage) || 0);
  const markupAmount = markupType === "percentage"
    ? Math.round((basePrice * markupPercentage) / 100)
    : Math.max(0, Number(form.pricing.markupAmount) || 0);
  const discountAmount = Math.max(0, Number(form.pricing.discountAmount) || 0);
  const preTaxPrice = Math.max(0, basePrice + markupAmount - discountAmount);

  const includeGst = Boolean(form.pricing.includeGst);
  const gstPercentage = Number(form.pricing.gstPercentage) || 5;
  const gstAmount = includeGst ? Math.round((preTaxPrice * gstPercentage) / 100) : 0;

  const finalPrice = preTaxPrice + gstAmount;
  const numPax = Math.max(1, form.passengers.adults || 2);
  const perPersonPrice = Math.round(finalPrice / numPax);
  const perCouplePrice = Math.round(perPersonPrice * 2);

  // Advance Payment calculations (by default Absolute)
  const advanceType = form.pricing.advanceType || "absolute";
  const advancePercentage = Math.max(0, Math.min(100, Number(form.pricing.advancePercentage) || 25));
  let advancePayment = 0;
  if (advanceType === "percentage") {
    advancePayment = Math.round((finalPrice * advancePercentage) / 100);
  } else {
    advancePayment = form.pricing.advanceAmount !== undefined && form.pricing.advanceAmount !== null && form.pricing.advanceAmount !== ""
      ? Math.max(0, Number(form.pricing.advanceAmount) || 0)
      : (finalPrice > 0 ? Math.round(finalPrice * 0.25) : 0);
  }
  advancePayment = Math.min(finalPrice, Math.max(0, advancePayment));
  const balancePayment = Math.max(0, finalPrice - advancePayment);
  const effectiveAdvancePct = finalPrice > 0 ? Math.round((advancePayment / finalPrice) * 100) : 0;

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
    if (basePrice <= 0) {
      setError("Please enter the Total Package Price");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setSaving(true);
    try {
      const normalizedStays = (form.hotelStays || []).map((s, i) => ({
        ...s,
        nightNumber: s.nightNumber || i + 1,
      }));

      const normalizedOptions = (form.accommodationOptions || []).map((opt) => ({
        ...opt,
        hotelStays: (opt.hotelStays || []).map((s, i) => ({
          ...s,
          nightNumber: s.nightNumber || i + 1,
        })),
      }));

      const payload = {
        ...form,
        hotelStays: normalizedStays,
        accommodationOptions: normalizedOptions.length > 0 ? normalizedOptions : undefined,
        pricing: {
          ...form.pricing,
          baseCost: basePrice,
          totalPrice: basePrice,
          markupType,
          markupPercentage,
          markupAmount,
          discountAmount,
          discountReason: form.pricing?.discountReason || "",
          includeGst,
          gstPercentage,
          gstAmount,
          finalPrice,
          perPersonPrice,
          perCouplePrice,
          advanceType,
          advanceAmount: advanceType === "absolute" ? advancePayment : (form.pricing?.advanceAmount || 0),
          advancePercentage,
          advancePayment,
          balancePayment,
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
            onClick={() => setPackageModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 text-[13px] font-black transition-all shadow-2xs hover:scale-105 active:scale-95"
          >
            <PackageIcon className="w-4 h-4 text-indigo-600" />
            <span>Fetch Travel Package</span>
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
                <p className="text-slate-300">Pick departure date and duration. If children traveling, enter their exact ages.</p>
              </div>

              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                <span className="font-mono text-[10px] font-black text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded">STEP 3</span>
                <p className="font-bold text-white">Hotel Stays &amp; Rooms</p>
                <p className="text-slate-300">Select city, hotel name, star rating &amp; room category options.</p>
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

              {/* Direct Travel Dates & Duration */}
              <div className="p-5 rounded-3xl bg-gradient-to-br from-amber-50/50 via-white to-slate-50 border border-amber-200/90 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold text-[11px] shadow-xs">
                      <Calendar className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-[12px] font-black text-slate-900 tracking-wide">
                      Travel Duration &amp; Departure Date
                    </span>
                  </div>
                  {form.tripDetails.startDate && (
                    <span className="text-[11px] font-bold text-amber-900 bg-amber-100/70 px-2.5 py-0.5 rounded-full border border-amber-200">
                      🏁 Return: {(() => {
                        try {
                          const parts = (form.tripDetails.startDate || "").split("-");
                          if (parts.length !== 3) return "";
                          const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
                          d.setDate(d.getDate() + (parseInt(form.tripDetails.nights, 10) || 1));
                          return d.toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
                        } catch {
                          return "";
                        }
                      })()}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Custom Interactive Departure Date Picker */}
                  <CustomDatePicker
                    value={form.tripDetails.startDate}
                    onChange={(newDate) => handleStartDateChange(newDate)}
                  />

                  {/* Trip Duration Controls with Stepper */}
                  <div className="bg-white p-3 rounded-2xl border border-slate-200/90 shadow-xs space-y-1.5 focus-within:border-amber-500 transition-all">
                    <div className="flex items-center justify-between">
                      <label className="block text-[11px] font-extrabold text-slate-600">
                        Trip Duration
                      </label>
                      <span className="text-[11px] font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                        {form.tripDetails.days} Days Total
                      </span>
                    </div>

                    <div className="flex items-center gap-2 pt-0.5">
                      <button
                        type="button"
                        onClick={() => {
                          const val = Math.max(1, (parseInt(form.tripDetails.nights, 10) || 1) - 1);
                          applyDurationPreset(val);
                        }}
                        className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-[16px] flex items-center justify-center transition-all active:scale-95 border border-slate-200"
                        title="Decrease 1 Night"
                      >
                        -
                      </button>

                      <div className="flex-1 flex items-center justify-center gap-1.5 bg-slate-50/80 px-3 py-1.5 rounded-xl border border-slate-200">
                        <input
                          type="number"
                          min="1"
                          max="60"
                          value={form.tripDetails.nights}
                          onChange={(e) => {
                            const val = Math.max(1, parseInt(e.target.value, 10) || 1);
                            applyDurationPreset(val);
                          }}
                          className="w-12 font-mono font-black text-[16px] text-slate-900 text-center bg-transparent focus:outline-none"
                        />
                        <span className="text-[13px] font-black text-slate-700">Nights</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          const val = Math.min(60, (parseInt(form.tripDetails.nights, 10) || 1) + 1);
                          applyDurationPreset(val);
                        }}
                        className="w-9 h-9 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 font-black text-[16px] flex items-center justify-center transition-all active:scale-95 border border-amber-300"
                        title="Increase 1 Night"
                      >
                        +
                      </button>
                    </div>

                    <div className="text-[10.5px] text-slate-400 font-semibold text-center pt-0.5">
                      Calculates exact itinerary &amp; destination stay nights
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

            {/* ── 3. Day-by-Day Tour Itinerary ── */}
            <QuickItinerarySection
              itinerary={form.itinerary || []}
              onChange={(updated) => setForm((p) => ({ ...p, itinerary: updated }))}
              showItinerary={form.showItinerary !== false}
              onToggleShowItinerary={() => setForm((p) => ({ ...p, showItinerary: !p.showItinerary }))}
              daysCount={form.tripDetails.days}
              destination={form.tripDetails.destination}
              theme={form.tripDetails.theme}
              hotelStays={form.accommodationOptions?.[0]?.hotelStays || form.hotelStays || []}
            />

            {/* ── 4. Hotel Accommodation Portfolio ── */}
            <QuickAccommodationSection
              accommodationOptions={form.accommodationOptions || []}
              onOptionsChange={(opts) => setForm((p) => ({ ...p, accommodationOptions: opts }))}
              hotelStays={form.hotelStays || []}
              onChange={(updated) => {
                setForm((p) => {
                  const updatedItinerary = syncItineraryWithHotelStays(p.itinerary || [], updated, p.tripDetails?.days);
                  return {
                    ...p,
                    hotelStays: updated,
                    itinerary: updatedItinerary,
                  };
                });
              }}
              totalNights={form.tripDetails.nights}
              primaryDestination={form.tripDetails.destination}
              startDate={form.tripDetails.startDate}
              totalRooms={form.passengers.totalRooms || 1}
              adults={form.passengers?.adults || 2}
              passengers={form.passengers}
              onPriceAdjustment={(newAccomCost, optIdx = 0) => {
                setForm((p) => {
                  const vehCost = Number(p.vehicle?.vehiclePrice) || 0;
                  const actCost = (p.itinerary || []).reduce((sum, d) => sum + (d.activities || []).reduce((asum, a) => asum + (Number(a.price) || 0), 0), 0);
                  const netCost = newAccomCost + vehCost + actCost;
                  
                  const activeOpt = (p.accommodationOptions && p.accommodationOptions[optIdx]) || p.accommodationOptions?.[0];
                  const mVal = Number(activeOpt?.margin !== undefined && activeOpt?.margin > 0 ? activeOpt.margin : (p.pricing?.packageMargin || 0));
                  const mType = (activeOpt?.margin !== undefined && activeOpt?.margin > 0 && activeOpt?.marginType) ? activeOpt.marginType : (p.pricing?.packageMarginType || "absolute");
                  const marginAmt = mType === "percentage" ? (netCost * mVal) / 100 : mVal;
                  const calculated = netCost + marginAmt;
                  
                  return {
                    ...p,
                    pricing: {
                      ...p.pricing,
                      accommodationTotal: newAccomCost,
                      totalPrice: calculated,
                    },
                  };
                });
              }}
            />

            {/* ── 5. Dedicated Transport & Vehicle ── */}
            <div className="bg-white rounded-3xl border-2 border-slate-200/90 hover:border-amber-400/60 p-5 sm:p-7 shadow-xs transition-all space-y-6 overflow-hidden min-w-0">
              <div className="flex items-center justify-between gap-3 pb-4 border-b border-slate-100 min-w-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 text-slate-950 flex items-center justify-center font-black shadow-md shadow-amber-500/20 flex-shrink-0">
                    <Car className="w-5 h-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-[17px] font-black text-slate-900 truncate">Dedicated Transport &amp; Vehicle</h3>
                      <span className="text-[10px] font-black text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 flex-shrink-0">
                        {form.vehicle.vehicleType || "Sedan"} • {form.vehicle.acType || "AC"}
                      </span>
                    </div>
                    <p className="text-[12px] text-slate-400 font-medium truncate">Chauffeur-driven private vehicle for pickup, drop &amp; all sightseeing</p>
                  </div>
                </div>
              </div>

              {/* Vehicle Seating Capacity Alert */}
              {(() => {
                const totalGuests = (Number(form.passengers?.adults) || 0) + (Number(form.passengers?.childrenCount) || 0);
                const vehicleSeats = Number(form.vehicle?.seats) || 4;
                if (totalGuests <= vehicleSeats) return null;

                const suitableVehicles = VEHICLE_OPTIONS.filter((v) => v.seats >= totalGuests);

                return (
                  <div className="rounded-2xl border-2 border-rose-300 bg-gradient-to-br from-rose-50 via-rose-50/80 to-amber-50/40 p-4 sm:p-5 text-rose-950 shadow-xs space-y-3 animate-in fade-in">
                    <div className="flex items-start sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-rose-500 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                          <AlertCircle className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-[13.5px] font-black text-rose-950">
                            Vehicle Overcapacity Alert ({totalGuests} Guests vs {vehicleSeats} Seats)
                          </h4>
                          <p className="text-[12px] text-rose-800 font-medium">
                            Your party has {form.passengers?.adults || 0} Adults{form.passengers?.childrenCount > 0 ? ` + ${form.passengers.childrenCount} Children` : ""}, exceeding the capacity of this {form.vehicle?.vehicleType || "Cab"} ({vehicleSeats} seats).
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-rose-200/80 text-rose-900 border border-rose-300 flex-shrink-0">
                        RTO Seating Warning
                      </span>
                    </div>

                    {suitableVehicles.length > 0 && (
                      <div className="pt-2 border-t border-rose-200/60">
                        <p className="text-[11px] font-bold text-rose-900 mb-2">1-Click Upgrade to Accommodate All {totalGuests} Guests:</p>
                        <div className="flex flex-wrap items-center gap-2">
                          {suitableVehicles.slice(0, 3).map((v) => (
                            <button
                              key={v.type}
                              type="button"
                              onClick={() => setForm((p) => ({ ...p, vehicle: { ...p.vehicle, vehicleType: v.type, model: v.model, seats: v.seats } }))}
                              className="px-3 py-1.5 rounded-xl bg-white hover:bg-rose-100/80 border-2 border-rose-200 hover:border-rose-400 text-rose-950 text-[11.5px] font-bold shadow-2xs transition-all flex items-center gap-1.5 active:scale-95"
                            >
                              <Car className="w-3.5 h-3.5 text-rose-600" />
                              <span>Upgrade to {v.type} ({v.seats} Seats)</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Fetched Package Vehicles (Only show when package has vehicles) */}
              {availablePackageVehicles.length > 0 && (
                <div className="space-y-3 min-w-0">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="text-[12px] font-black text-amber-950 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600 animate-pulse flex-shrink-0" />
                      Available Package Vehicles ({availablePackageVehicles.length} Options):
                    </span>
                    <span className="text-[10.5px] font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 whitespace-nowrap">
                      Click to Select Car
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0">
                    {availablePackageVehicles.map((pv, pvi) => {
                      const pPrice = Number(pv.vehiclePrice ?? pv.price) || 0;
                      const pQty = Math.max(1, parseInt(pv.quantity, 10) || 1);
                      const pTotal = pPrice * pQty;
                      const isCurrent = form.vehicle?.vehicleType === pv.vehicleType && Number(form.vehicle?.vehiclePrice) === pTotal;
                      const currentVehTotal = Number(form.vehicle?.vehiclePrice) || 0;
                      const diff = pTotal - currentVehTotal;
                      const imgPath = getVehicleImage(pv.vehicleType);

                      return (
                        <button
                          key={pvi}
                          type="button"
                          onClick={() => handleApplyPackageVehicle(pv)}
                          className={`p-3 sm:p-3.5 rounded-2xl border-2 text-left transition-all flex items-center justify-between gap-3 group relative w-full min-w-0 overflow-hidden ${
                            isCurrent
                              ? "border-amber-500 bg-gradient-to-br from-amber-50/90 via-orange-50/50 to-amber-50/80 shadow-xs ring-2 ring-amber-500/20 scale-[1.01]"
                              : "border-slate-200/90 hover:border-amber-300 bg-white hover:bg-slate-50/60"
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="w-12 h-10 sm:w-14 sm:h-12 flex-shrink-0 flex items-center justify-center bg-slate-50 rounded-xl p-1 border border-slate-100">
                              <img
                                src={imgPath}
                                alt={pv.vehicleType}
                                className="max-h-9 sm:max-h-10 max-w-full object-contain filter drop-shadow-2xs group-hover:scale-105 transition-transform"
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <span className={`text-[13px] font-black truncate block ${isCurrent ? "text-amber-950" : "text-slate-900"}`}>
                                {pQty > 1 ? `${pQty}x ` : ""}{pv.vehicleType || "Sedan"}
                              </span>
                              <span className={`text-[11px] font-semibold truncate block ${isCurrent ? "text-amber-800" : "text-slate-500"}`}>
                                {pv.model || "Private Cab"} • {pv.seats || 4} Seats
                              </span>
                              <span className="text-[10px] font-bold text-slate-400 truncate block">
                                {pv.acType || "AC"}
                              </span>
                            </div>
                          </div>

                          <div className="text-right flex-shrink-0 ml-1 whitespace-nowrap">
                            {isCurrent ? (
                              <span className="text-[11px] font-black text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200 inline-block shadow-2xs">
                                Selected
                              </span>
                            ) : diff > 0 ? (
                              <span className="text-[12px] font-black text-amber-900 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200 inline-block shadow-2xs">
                                +₹{diff.toLocaleString("en-IN")}
                              </span>
                            ) : diff < 0 ? (
                              <span className="text-[12px] font-black text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200 inline-block shadow-2xs">
                                -₹{Math.abs(diff).toLocaleString("en-IN")}
                              </span>
                            ) : (
                              <span className="text-[11px] font-black text-slate-600 bg-slate-100 px-2.5 py-1 rounded-xl border border-slate-200 inline-block">
                                ±₹0
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Detailed Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-1 min-w-0">
                <div className="min-w-0">
                  <label className="block text-[12px] font-bold text-slate-600 mb-1.5 truncate">Vehicle Model / Description</label>
                  <input
                    type="text"
                    value={form.vehicle.model || ""}
                    onChange={(e) => setForm((p) => ({ ...p, vehicle: { ...p.vehicle, model: e.target.value } }))}
                    placeholder="e.g. Swift Dzire / Toyota Etios"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-[13px] font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 bg-slate-50/50 focus:bg-white transition-all min-w-0"
                  />
                </div>

                <div className="min-w-0">
                  <label className="block text-[12px] font-bold text-slate-600 mb-1.5 truncate">Air Conditioning</label>
                  <div className="grid grid-cols-2 gap-2 min-w-0">
                    {["AC", "Non-AC"].map((ac) => (
                      <button
                        key={ac}
                        type="button"
                        onClick={() => setForm((p) => ({ ...p, vehicle: { ...p.vehicle, acType: ac } }))}
                        className={`py-2 px-1 text-center truncate rounded-xl text-[12px] font-bold border transition-all ${
                          form.vehicle.acType === ac
                            ? "bg-slate-900 text-white border-slate-900 shadow-2xs"
                            : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        {ac === "AC" ? "❄️ AC" : "Non-AC"}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="min-w-0 sm:col-span-2 lg:col-span-1">
                  <label className="block text-[12px] font-bold text-slate-600 mb-1.5 truncate">Guest Capacity (Seats)</label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={form.vehicle.seats || 4}
                    onChange={(e) => setForm((p) => ({ ...p, vehicle: { ...p.vehicle, seats: parseInt(e.target.value, 10) || 4 } }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-[13px] font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 bg-slate-50/50 focus:bg-white transition-all min-w-0"
                  />
                </div>
              </div>

              {/* Chauffeur Guidelines / Notes */}
              <div className="min-w-0">
                <label className="block text-[12px] font-bold text-slate-600 mb-1.5 truncate">Transport &amp; Chauffeur Inclusions Note</label>
                <input
                  type="text"
                  value={form.vehicle.notes || ""}
                  onChange={(e) => setForm((p) => ({ ...p, vehicle: { ...p.vehicle, notes: e.target.value } }))}
                  placeholder="e.g. Includes fuel, driver allowance, toll charges, interstate taxes and parking"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-[12.5px] font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 bg-slate-50/50 focus:bg-white transition-all min-w-0"
                />
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

              {/* Destination / City Wise Accommodation Timeline Review */}
              <div className="pt-2 border-t border-white/10 space-y-2 relative z-10">
                <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Accommodation Portfolio ({form.hotelStays.length} Destination {form.hotelStays.length === 1 ? "Stay" : "Stays"}):</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {form.hotelStays.map((s, i) => (
                    <div key={i} className="flex items-center justify-between bg-white/5 px-3.5 py-2 rounded-xl border border-white/5 text-[12px]">
                      <div className="flex items-center gap-2 truncate">
                        <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-mono font-black text-[10.5px] flex items-center justify-center flex-shrink-0">
                          {s.nights || 1}N
                        </span>
                        <span className="text-slate-300 font-bold truncate">
                          {s.cityName || form.tripDetails.destination}: <span className="text-white font-black">{s.hotelName || "Quality Hotel"}</span>
                        </span>
                      </div>
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-white/10 text-amber-300 border border-white/10 flex-shrink-0">
                        {s.mealPlan || "CP"}
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
                      {markupAmount > 0 && <span className="text-emerald-300 text-[12px] font-bold ml-2">(₹{basePrice.toLocaleString("en-IN")} Target + ₹{markupAmount.toLocaleString("en-IN")} Buffer)</span>}
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

              {/* 1. Base Target Package Price Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <label className="block text-[12px] font-black text-slate-800">
                    Target / Base Package Price (₹) *
                  </label>
                    <button
                      type="button"
                      onClick={() => {
                        const roomMult = Math.max(1, parseInt(form.passengers?.totalRooms, 10) || Math.ceil((parseInt(form.passengers?.adults, 10) || 2) / 2) || 1);
                        const activeStays = (form.accommodationOptions && form.accommodationOptions.length > 0)
                          ? (form.accommodationOptions.find((o) => o.isDefault)?.hotelStays || form.accommodationOptions[0].hotelStays || form.hotelStays || [])
                          : (form.hotelStays || []);
                        const accomCost = activeStays.reduce(
                          (sum, s) => sum + ((Number(s.pricePerNight) || 0) * (s.nights || 1) * roomMult),
                          0
                        );
                        const vehCost = Number(form.vehicle?.vehiclePrice) || 0;
                        const actCost = (form.itinerary || []).reduce((sum, d) => sum + (d.activities || []).reduce((asum, a) => asum + (Number(a.price) || 0), 0), 0);
                        const netCost = accomCost + vehCost + actCost;
                        
                        const mVal = Number(form.pricing?.packageMargin !== undefined ? form.pricing.packageMargin : (importedPkg?.pricing?.margin || 0));
                        const mType = form.pricing?.packageMarginType || importedPkg?.pricing?.marginType || "absolute";
                        const marginAmt = mType === "percentage" ? (netCost * mVal) / 100 : mVal;
                        const calculated = netCost + marginAmt;

                        setForm((p) => ({
                          ...p,
                          pricing: {
                            ...p.pricing,
                            accommodationTotal: accomCost,
                            totalPrice: calculated,
                          },
                        }));
                      }}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-lg transition-colors cursor-pointer"
                      title="Auto-calculate: Accommodation Total + Vehicle Price + Package Margin"
                    >
                    <Sparkles className="w-3 h-3 text-amber-600" />
                    <span>⚡ Auto-Calculate</span>
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-[14px]">₹</span>
                  <input
                    type="number"
                    min="0"
                    value={form.pricing.totalPrice || ""}
                    onChange={(e) => setForm((p) => ({ ...p, pricing: { ...p.pricing, totalPrice: parseFloat(e.target.value) || 0 } }))}
                    placeholder="e.g. 25000"
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-300 font-black text-[16px] text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-right font-mono"
                  />
                </div>
              </div>

              {/* 2. 🎯 Negotiation Price Buffer / Markup (% Percent or ₹ Fixed) */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-50/80 via-white to-amber-50/60 border-2 border-emerald-200/90 shadow-2xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[14px]">🎯</span>
                    <span className="text-[12px] font-black text-emerald-950">
                      Negotiation Buffer
                    </span>
                  </div>

                  {/* Markup Type Toggle: Fixed ₹ vs % Percent */}
                  <div className="flex items-center bg-white p-0.5 rounded-xl border border-emerald-300 text-[10.5px] font-black shadow-2xs">
                    <button
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, pricing: { ...p.pricing, markupType: "absolute" } }))}
                      className={`px-2 py-0.5 rounded-lg transition-all ${
                        markupType === "absolute"
                          ? "bg-emerald-600 text-white shadow-2xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      ₹ Fixed
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, pricing: { ...p.pricing, markupType: "percentage" } }))}
                      className={`px-2 py-0.5 rounded-lg transition-all ${
                        markupType === "percentage"
                          ? "bg-emerald-600 text-white shadow-2xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      % Percent
                    </button>
                  </div>
                </div>

                <p className="text-[10.5px] text-slate-500 font-medium leading-tight">
                  {markupType === "percentage"
                    ? `Adds a percentage buffer on top of base ₹${basePrice.toLocaleString("en-IN")}.`
                    : `Add fixed buffer to quote higher so when the client bargains down, you still hit your ₹${basePrice > 0 ? basePrice.toLocaleString("en-IN") : "25,000"} target.`}
                </p>

                {markupType === "percentage" ? (
                  <div className="space-y-2">
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={form.pricing.markupPercentage !== undefined ? form.pricing.markupPercentage : ""}
                        onChange={(e) => setForm((p) => ({ ...p, pricing: { ...p.pricing, markupPercentage: parseFloat(e.target.value) || 0 } }))}
                        placeholder="e.g. 10"
                        className="w-full pl-3 pr-8 py-2 rounded-xl border border-emerald-300 bg-white text-[14.5px] font-black text-right text-emerald-950 font-mono focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-700 font-bold text-[13px]">%</span>
                    </div>
                    {/* Fast % Presets */}
                    <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                      {[5, 10, 15, 20].map((pct) => (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => setForm((p) => ({ ...p, pricing: { ...p.pricing, markupPercentage: pct } }))}
                          className={`px-2 py-0.5 rounded-lg text-[10.5px] font-bold border transition-all ${
                            markupPercentage === pct
                              ? "bg-emerald-600 text-white border-emerald-700 font-black shadow-2xs"
                              : "bg-white hover:bg-emerald-50 text-emerald-900 border-emerald-200"
                          }`}
                        >
                          +{pct}%
                        </button>
                      ))}
                      {markupPercentage > 0 && (
                        <button
                          type="button"
                          onClick={() => setForm((p) => ({ ...p, pricing: { ...p.pricing, markupPercentage: 0 } }))}
                          className="px-2 py-0.5 rounded-lg text-[10.5px] font-bold bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-700 border border-slate-200"
                        >
                          Clear
                        </button>
                      )}
                      <span className="ml-auto text-[11px] font-black text-emerald-700 font-mono">
                        +₹{markupAmount.toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-600 font-black text-[13px]">+₹</span>
                      <input
                        type="number"
                        min="0"
                        value={form.pricing.markupAmount || ""}
                        onChange={(e) => setForm((p) => ({ ...p, pricing: { ...p.pricing, markupAmount: parseFloat(e.target.value) || 0 } }))}
                        placeholder="0"
                        className="w-full pl-8 pr-3 py-2 rounded-xl border border-emerald-300 bg-white text-[14.5px] font-black text-right text-emerald-950 font-mono focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                    </div>
                    {/* Fast ₹ Presets */}
                    <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                      {[1000, 2000, 3000, 5000].map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setForm((p) => ({ ...p, pricing: { ...p.pricing, markupAmount: amt } }))}
                          className={`px-2 py-0.5 rounded-lg text-[10.5px] font-bold border transition-all ${
                            markupAmount === amt
                              ? "bg-emerald-600 text-white border-emerald-700 font-black shadow-2xs"
                              : "bg-white hover:bg-emerald-50 text-emerald-900 border-emerald-200"
                          }`}
                        >
                          +₹{amt.toLocaleString("en-IN")}
                        </button>
                      ))}
                      {markupAmount > 0 && (
                        <button
                          type="button"
                          onClick={() => setForm((p) => ({ ...p, pricing: { ...p.pricing, markupAmount: 0 } }))}
                          className="px-2 py-0.5 rounded-lg text-[10.5px] font-bold bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-700 border border-slate-200"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* 3. 🏷️ Promotional Discount (-₹) (Optional) */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-rose-500" />
                    <span className="text-[12px] font-bold text-slate-700">Special Discount (-₹)</span>
                  </div>
                  {discountAmount > 0 && (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200 font-mono">
                      -₹{discountAmount.toLocaleString("en-IN")}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-5 gap-2">
                  <div className="relative col-span-3">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-rose-500 font-bold text-[12px]">-₹</span>
                    <input
                      type="number"
                      min="0"
                      value={form.pricing.discountAmount || ""}
                      onChange={(e) => setForm((p) => ({ ...p, pricing: { ...p.pricing, discountAmount: parseFloat(e.target.value) || 0 } }))}
                      placeholder="0"
                      className="w-full pl-7 pr-2 py-1.5 rounded-xl border border-slate-300 bg-white text-[13px] font-bold text-slate-900 text-right font-mono focus:ring-1 focus:ring-rose-500"
                    />
                  </div>
                  <input
                    type="text"
                    value={form.pricing.discountReason || ""}
                    onChange={(e) => setForm((p) => ({ ...p, pricing: { ...p.pricing, discountReason: e.target.value } }))}
                    placeholder="Reason (e.g. Festival Deal)"
                    className="col-span-2 px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white text-[11px] text-slate-700 focus:ring-1 focus:ring-rose-500 truncate"
                  />
                </div>
              </div>

              {/* 4. 🏛️ Taxes & GST (5%) Toggle */}
              <div className={`p-3.5 rounded-2xl border transition-all ${
                includeGst ? "bg-indigo-50/70 border-indigo-200" : "bg-slate-50 border-slate-200"
              }`}>
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeGst}
                    onChange={(e) => setForm((p) => ({ ...p, pricing: { ...p.pricing, includeGst: e.target.checked } }))}
                    className="mt-0.5 w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] font-bold text-slate-900">
                        Include 5% GST in Quotation
                      </span>
                      {includeGst && (
                        <span className="text-[11.5px] font-black text-indigo-900 font-mono">
                          +₹{gstAmount.toLocaleString("en-IN")}
                        </span>
                      )}
                    </div>
                    <p className="text-[10.5px] text-slate-500 leading-tight mt-0.5">
                      {includeGst
                        ? "5% Goods & Services Tax is added to the client payable total."
                        : "Quotation will be marked as exclusive of 5% GST."}
                    </p>
                  </div>
                </label>
              </div>

              {/* 5. Final Quoted Proposal Price Sent to Client */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white space-y-1.5 shadow-md border border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-[10.5px] font-black uppercase tracking-widest text-amber-400">
                    Quoted Proposal Price
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 text-slate-300">
                    Sent to Client
                  </span>
                </div>
                <div className="text-[26px] font-black text-white font-mono leading-none pt-1">
                  ₹{finalPrice.toLocaleString("en-IN")}
                </div>

                <div className="pt-2 border-t border-white/10 text-[11px] space-y-1 text-slate-300 font-mono">
                  <div className="flex items-center justify-between">
                    <span>Base Target:</span>
                    <span>₹{basePrice.toLocaleString("en-IN")}</span>
                  </div>
                  {markupAmount > 0 && (
                    <div className="flex items-center justify-between text-emerald-400">
                      <span>Buffer ({markupType === "percentage" ? `${markupPercentage}%` : "Fixed"}):</span>
                      <span>+₹{markupAmount.toLocaleString("en-IN")}</span>
                    </div>
                  )}
                  {discountAmount > 0 && (
                    <div className="flex items-center justify-between text-rose-400">
                      <span>Discount ({form.pricing.discountReason || "Promo"}):</span>
                      <span>-₹{discountAmount.toLocaleString("en-IN")}</span>
                    </div>
                  )}
                  {includeGst && (
                    <div className="flex items-center justify-between text-indigo-300">
                      <span>GST ({gstPercentage}%):</span>
                      <span>+₹{gstAmount.toLocaleString("en-IN")}</span>
                    </div>
                  )}
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
                        value={form.pricing.advanceAmount !== undefined && form.pricing.advanceAmount !== null ? form.pricing.advanceAmount : advancePayment}
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
                        value={form.pricing.advancePercentage !== undefined ? form.pricing.advancePercentage : 25}
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
                  {markupAmount > 0 && (
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[11.5px] text-slate-300 font-mono">
                        Target: ₹{basePrice.toLocaleString("en-IN")}
                      </span>
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        +₹{markupAmount.toLocaleString("en-IN")} Buffer
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
                    <p className="text-slate-400 font-bold text-[10px]">Per Couple (2 Adults)</p>
                    <p className="font-black text-[13px] text-white">₹{perCouplePrice.toLocaleString("en-IN")}</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-2">
                    <p className="text-slate-400 font-bold text-[10px]">Per Adult ({numPax} {numPax === 1 ? "Pax" : "Pax"})</p>
                    <p className="font-black text-[13px] text-white">₹{perPersonPrice.toLocaleString("en-IN")}</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-amber-200">
                  <span>Advance Token:</span>
                  <span className="font-black">₹{advancePayment.toLocaleString("en-IN")}</span>
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

      {/* Travel Package Auto-Fetch & Import Modal */}
      <QuickPackageFetchModal
        isOpen={packageModalOpen}
        onClose={() => setPackageModalOpen(false)}
        onSelectPackage={handleSelectPackage}
      />
    </div>
  );
}
