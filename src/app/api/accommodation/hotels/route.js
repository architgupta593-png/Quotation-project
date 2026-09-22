import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Hotel from "@/models/Hotel";
import City from "@/models/City";

// ── GET /api/accommodation/hotels — list hotels (filter by cityId, search) ────
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const cityId = searchParams.get("cityId") || searchParams.get("city");
    const search = searchParams.get("search");

    const filter = {};
    if (cityId) filter.city = cityId;
    if (search) {
      const matchingCities = await City.find({
        name: { $regex: search, $options: "i" },
      }).select("_id");
      const matchingCityIds = matchingCities.map((c) => c._id);

      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { address: { $regex: search, $options: "i" } },
        ...(matchingCityIds.length > 0 ? [{ city: { $in: matchingCityIds } }] : []),
      ];
    }

    const hotels = await Hotel.find(filter)
      .populate("city", "name state")
      .sort({ name: 1 })
      .lean();

    console.log(`[API /api/accommodation/hotels] Query: search="${search || ""}", cityId="${cityId || ""}" -> Found ${hotels.length} hotels`);

    return NextResponse.json({ hotels });
  } catch (err) {
    console.error("[GET /api/accommodation/hotels]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// ── POST /api/accommodation/hotels — create a hotel ──────────────────────────
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!["superuser", "admin"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await connectDB();

    const body = await request.json();
    const hotel = await Hotel.create({ ...body, createdBy: session.user.id });

    return NextResponse.json({ hotel }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/accommodation/hotels]", err);
    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map((e) => e.message);
      return NextResponse.json({ error: messages.join(", ") }, { status: 422 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
