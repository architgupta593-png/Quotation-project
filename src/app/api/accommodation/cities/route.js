import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import City from "@/models/City";
import Hotel from "@/models/Hotel";

// ── GET /api/accommodation/cities — list all cities (with hotel count) ────────
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");

    const filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { state: { $regex: search, $options: "i" } },
      ];
    }

    const cities = await City.find(filter).sort({ name: 1 }).lean();

    // Attach hotel counts in one batch query
    const cityIds = cities.map((c) => c._id);
    const hotelCounts = await Hotel.aggregate([
      { $match: { city: { $in: cityIds } } },
      { $group: { _id: "$city", count: { $sum: 1 } } },
    ]);
    const countMap = Object.fromEntries(
      hotelCounts.map((h) => [h._id.toString(), h.count])
    );

    const result = cities.map((c) => ({
      ...c,
      hotelCount: countMap[c._id.toString()] || 0,
    }));

    return NextResponse.json({ cities: result });
  } catch (err) {
    console.error("[GET /api/accommodation/cities]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// ── POST /api/accommodation/cities — create a city ───────────────────────────
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
    const city = await City.create({ ...body, createdBy: session.user.id });

    return NextResponse.json({ city }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/accommodation/cities]", err);
    if (err.code === 11000) {
      return NextResponse.json(
        { error: "A city with this name already exists in the same state." },
        { status: 422 }
      );
    }
    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map((e) => e.message);
      return NextResponse.json({ error: messages.join(", ") }, { status: 422 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
