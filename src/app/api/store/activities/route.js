import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Activity from "@/models/Activity";
import City from "@/models/City";

// ── GET /api/store/activities — list public standalone saleable activities ──────
export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const cityId   = searchParams.get("cityId");
    const category = searchParams.get("category");
    const search   = searchParams.get("search");

    const filter = {
      status: "active",
      isStandaloneSaleable: true,
    };

    if (cityId)   filter.city = cityId;
    if (category) filter.category = category;
    if (search) {
      filter.$or = [
        { name:        { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const activities = await Activity.find(filter)
      .sort({ isHighlight: -1, name: 1 })
      .populate("city", "name state country")
      .lean();

    return NextResponse.json({ activities });
  } catch (err) {
    console.error("[GET /api/store/activities]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
