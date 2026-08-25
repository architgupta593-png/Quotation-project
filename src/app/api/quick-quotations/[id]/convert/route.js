import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import QuickQuotation from "@/models/QuickQuotation";
import Quotation from "@/models/Quotation";

async function generateUniqueQuotationCode() {
  const year = new Date().getFullYear();
  let code = "";
  let isUnique = false;
  let attempts = 0;
  while (!isUnique && attempts < 10) {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    code = `QT-${year}-${randomNum}`;
    const existing = await Quotation.findOne({ quotationCode: code }).lean();
    if (!existing) {
      isUnique = true;
    }
    attempts++;
  }
  return code || `QT-${year}-${Date.now().toString().slice(-4)}`;
}

// ── POST /api/quick-quotations/[id]/convert — Convert to Full Quotation ─────────
export async function POST(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();

    const qq = await QuickQuotation.findById(id);
    if (!qq) {
      return NextResponse.json({ error: "Quick quotation not found" }, { status: 404 });
    }

    // Generate new unique full Quotation Code
    const quotationCode = await generateUniqueQuotationCode();

    // Synthesize destinations from hotelStays or tripDetails
    const destinations = [];
    const stays = qq.hotelStays || [];
    if (stays.length > 0) {
      stays.forEach((st) => {
        const stayNights = Math.max(1, parseInt(st.nights, 10) || 1);
        const last = destinations[destinations.length - 1];
        if (last && last.cityName === st.cityName) {
          last.nights += stayNights;
        } else {
          destinations.push({
            cityName: st.cityName || qq.tripDetails.destination,
            state: "",
            nights: stayNights,
          });
        }
      });
    } else {
      destinations.push({
        cityName: qq.tripDetails.destination,
        state: "",
        nights: qq.tripDetails.nights || 4,
      });
    }

    // Build day-by-day itinerary (use quickQuote.itinerary if available, else synthesize)
    let itinerary = [];
    if (qq.itinerary && qq.itinerary.length > 0) {
      itinerary = qq.itinerary.map((it, idx) => ({
        day: it.day || idx + 1,
        title: it.title || `Day ${idx + 1} Sightseeing`,
        description: it.description || "",
        activities: it.activities || [],
        meals: it.meals || { breakfast: true, lunch: false, dinner: false },
        images: [],
      }));
    } else {
      const totalDays = qq.tripDetails.days || (qq.tripDetails.nights + 1);
      for (let d = 1; d <= totalDays; d++) {
        itinerary.push({
          day: d,
          title: d === 1
            ? `Arrival in ${destinations[0]?.cityName || qq.tripDetails.destination} & Leisure`
            : d === totalDays
            ? `Departure from ${destinations[destinations.length - 1]?.cityName || qq.tripDetails.destination}`
            : `Explore ${destinations[Math.min(d - 1, destinations.length - 1)]?.cityName || qq.tripDetails.destination}`,
          description: `Full day itinerary for Day ${d}. Sightseeing, relaxation and curated experiences.`,
          activities: [],
          meals: {
            breakfast: true,
            lunch: false,
            dinner: d === 1,
          },
          images: [],
        });
      }
    }

    // Build nightsArr from hotelStays (expanding multi-night destination stays into individual night slots for Full Quotation schema)
    const nightsArr = [];
    let currentNight = 1;
    (qq.hotelStays || []).forEach((s) => {
      const stayNights = Math.max(1, parseInt(s.nights, 10) || 1);
      for (let k = 0; k < stayNights; k++) {
        nightsArr.push({
          night: currentNight++,
          cityName: s.cityName || qq.tripDetails.destination,
          hotelName: s.hotelName || "Quality Certified Hotel",
          starRating: s.starRating || 3,
          roomType: s.roomType || "Deluxe AC Room",
          mealPlan: s.mealPlan || "CP",
          pricePerNight: s.pricePerNight || 0,
          notes: s.notes || "",
        });
      }
    });

    const accommodationOptions = [
      {
        label: "Option 1 (Standard)",
        nights: nightsArr,
        totalPrice: qq.pricing.baseCost || 0,
        marginType: qq.pricing.marginType || "absolute",
        margin: qq.pricing.margin || 0,
      },
      {
        label: "Option 2 (Deluxe Premium)",
        nights: nightsArr.map((n) => ({ ...n, roomType: "Premium Suite", starRating: 4 })),
        totalPrice: Math.round((qq.pricing.baseCost || 0) * 1.25),
        marginType: qq.pricing.marginType || "absolute",
        margin: qq.pricing.margin || 0,
      },
      {
        label: "Option 3 (Luxury 5-Star)",
        nights: nightsArr.map((n) => ({ ...n, roomType: "Luxury Villa", starRating: 5 })),
        totalPrice: Math.round((qq.pricing.baseCost || 0) * 1.6),
        marginType: qq.pricing.marginType || "absolute",
        margin: qq.pricing.margin || 0,
      },
    ];

    // Create Full Quotation Record
    const fullQuotation = new Quotation({
      quotationCode,
      client: {
        name: qq.client.name,
        phone: qq.client.phone,
        email: qq.client.email,
        company: qq.client.company,
        clientType: qq.client.clientType,
        leadSource: qq.client.leadSource,
        notes: qq.client.notes,
      },
      tripDetails: {
        title: qq.tripDetails.title,
        destination: qq.tripDetails.destination,
        startDate: qq.tripDetails.startDate,
        endDate: qq.tripDetails.endDate,
        nights: qq.tripDetails.nights,
        days: qq.tripDetails.days,
        destinations,
      },
      passengers: qq.passengers,
      itinerary,
      accommodationOptions,
      selectedOptionIndex: 0,
      vehicle: {
        vehicleType: qq.vehicle.vehicleType,
        model: qq.vehicle.model,
        seats: qq.vehicle.seats,
        acType: qq.vehicle.acType,
        vehiclePrice: qq.vehicle.vehiclePrice,
        notes: qq.vehicle.notes,
      },
      pricing: {
        baseCost: qq.pricing.baseCost,
        marginType: qq.pricing.marginType,
        margin: qq.pricing.margin,
        discountAmount: qq.pricing.discountAmount,
        discountReason: qq.pricing.discountReason,
        includeGst: qq.pricing.includeGst,
        gstPercentage: qq.pricing.gstPercentage,
        finalPrice: qq.pricing.finalPrice,
        perCouplePrice: qq.pricing.perCouplePrice,
        perPersonPrice: qq.pricing.perPersonPrice,
        rateBasis: "per_couple",
        includes: qq.inclusions || [],
        excludes: qq.exclusions || [],
      },
      inclusions: qq.inclusions || [],
      exclusions: qq.exclusions || [],
      status: "draft",
      createdBy: session.user.id,
    });

    await fullQuotation.save();

    // Update Quick Quote status to converted
    qq.status = "converted";
    qq.convertedQuotationId = fullQuotation._id;
    await qq.save();

    return NextResponse.json({
      message: "Quick quotation converted to full quotation successfully",
      quotationId: fullQuotation._id,
      quotationCode: fullQuotation.quotationCode,
    }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/quick-quotations/:id/convert]", err);
    return NextResponse.json({ error: err.message || "Failed to convert quotation" }, { status: 500 });
  }
}
