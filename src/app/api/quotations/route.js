import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Quotation from "@/models/Quotation";

function generateQuotationCode() {
  const year = new Date().getFullYear();
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `QT-${year}-${randomNum}`;
}

// ── GET /api/quotations — List quotations with filters ─────────────────────────
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "30", 10);

    const query = {};

    // Role-based visibility
    if (session.user.role === "member") {
      query.createdBy = session.user.id;
    }

    if (status && status !== "all") {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { quotationCode: { $regex: search, $options: "i" } },
        { "client.name": { $regex: search, $options: "i" } },
        { "client.phone": { $regex: search, $options: "i" } },
        { "tripDetails.title": { $regex: search, $options: "i" } },
        { "tripDetails.destination": { $regex: search, $options: "i" } },
      ];
    }

    const total = await Quotation.countDocuments(query);
    const quotations = await Quotation.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("createdBy", "name email role")
      .lean();

    return NextResponse.json({
      quotations,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("[GET /api/quotations]", err);
    return NextResponse.json({ error: err.message || "Failed to fetch quotations" }, { status: 500 });
  }
}

// ── POST /api/quotations — Create a new quotation ──────────────────────────────
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const body = await request.json();

    const {
      client,
      tripDetails,
      passengers,
      itinerary,
      accommodationOptions,
      selectedOptionIndex,
      vehicle,
      pricing,
      inclusions,
      exclusions,
      paymentTerms,
      instructions,
      coverImage,
      highlights,
      status,
      validUntil,
      sourcePackage,
    } = body;

    if (!client?.name || !client?.phone) {
      return NextResponse.json({ error: "Client name and phone number are required" }, { status: 400 });
    }

    if (!tripDetails?.title || !tripDetails?.startDate || !tripDetails?.endDate) {
      return NextResponse.json({ error: "Title, start date, and end date are required" }, { status: 400 });
    }

    // Auto-generate code if not provided
    let quotationCode = body.quotationCode;
    if (!quotationCode) {
      let isUnique = false;
      while (!isUnique) {
        quotationCode = generateQuotationCode();
        const existing = await Quotation.findOne({ quotationCode });
        if (!existing) isUnique = true;
      }
    }

    const nights = parseInt(tripDetails.nights, 10) || 1;
    const days = parseInt(tripDetails.days, 10) || nights + 1;

    // Calculate validUntil default (7 days from now) if not set
    let quoteValidUntil = validUntil;
    if (!quoteValidUntil) {
      const d = new Date();
      d.setDate(d.getDate() + 7);
      quoteValidUntil = d;
    }

    const quotation = await Quotation.create({
      quotationCode,
      sourcePackage: sourcePackage || null,
      client: {
        name: (client.name || "").trim(),
        phone: (client.phone || "").trim(),
        email: (client.email || "").trim(),
        company: (client.company || "").trim(),
        clientType: client.clientType || "b2c",
        leadSource: client.leadSource || "Direct",
        notes: (client.notes || "").trim(),
      },
      tripDetails: {
        title: (tripDetails.title || "").trim(),
        startDate: new Date(tripDetails.startDate),
        endDate: new Date(tripDetails.endDate),
        nights,
        days,
        destinations: Array.isArray(tripDetails.destinations) ? tripDetails.destinations : [],
        destination: (tripDetails.destination || "").trim(),
      },
      passengers: {
        adults: parseInt(passengers?.adults, 10) || 2,
        childrenWithBed: parseInt(passengers?.childrenWithBed, 10) || 0,
        childrenNoBed: parseInt(passengers?.childrenNoBed, 10) || 0,
        infants: parseInt(passengers?.infants, 10) || 0,
        totalRooms: parseInt(passengers?.totalRooms, 10) || 1,
      },
      coverImage: coverImage || null,
      highlights: Array.isArray(highlights) ? highlights.filter(Boolean) : [],
      itinerary: Array.isArray(itinerary) ? itinerary : [],
      accommodationOptions: Array.isArray(accommodationOptions) ? accommodationOptions : [],
      selectedOptionIndex: parseInt(selectedOptionIndex, 10) || 0,
      vehicle: vehicle || {},
      pricing: pricing || {},
      inclusions: Array.isArray(inclusions) && inclusions.length > 0
        ? inclusions.filter(Boolean)
        : (Array.isArray(pricing?.includes) ? pricing.includes.filter(Boolean) : []),
      exclusions: Array.isArray(exclusions) && exclusions.length > 0
        ? exclusions.filter(Boolean)
        : (Array.isArray(pricing?.excludes) ? pricing.excludes.filter(Boolean) : []),
      paymentTerms: paymentTerms || {},
      instructions: Array.isArray(instructions) ? instructions : [],
      status: status || "draft",
      validUntil: new Date(quoteValidUntil),
      createdBy: session.user.id,
    });

    return NextResponse.json({ quotation }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/quotations]", err);
    return NextResponse.json({ error: err.message || "Failed to create quotation" }, { status: 500 });
  }
}
