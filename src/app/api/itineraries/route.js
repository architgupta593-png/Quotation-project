import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Itinerary from "@/models/Itinerary";

// GET /api/itineraries?search=&city=&status=&sort=
export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);

    const search = searchParams.get("search") || "";
    const city   = searchParams.get("city")   || "";
    const status = searchParams.get("status") || "";
    const sort   = searchParams.get("sort")   || "newest"; // newest | oldest | price_asc | price_desc | az | za | days_asc | days_desc

    // ── Build filter ─────────────────────────────────────────────────────────
    const filter = {};
    if (city)   filter.city   = { $regex: city, $options: "i" };
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { code:  { $regex: search, $options: "i" } },
        { city:  { $regex: search, $options: "i" } },
      ];
    }

    // ── Build sort ───────────────────────────────────────────────────────────
    const sortMap = {
      newest:     { createdAt: -1 },
      oldest:     { createdAt:  1 },
      price_asc:  { grandTotal:  1 },
      price_desc: { grandTotal: -1 },
      az:         { title:  1 },
      za:         { title: -1 },
      days_asc:   { days:  1 },
      days_desc:  { days: -1 },
    };
    const sortObj = sortMap[sort] || sortMap.newest;

    const itineraries = await Itinerary.find(filter)
      .sort(sortObj)
      .select("-dayByDay") // exclude heavy nested data from list view
      .lean();

    return NextResponse.json({ itineraries });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/itineraries
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["superuser", "admin"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const body = await request.json();

    const itin = await Itinerary.create({ ...body, createdBy: session.user.id });
    return NextResponse.json({ itinerary: itin }, { status: 201 });
  } catch (err) {
    const msg = err.code === 11000 ? "Itinerary code already exists" : err.message;
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
