import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Activity from "@/models/Activity";
import City from "@/models/City";

// ── GET /api/store/activities/[id] — get activity details for public booking ─
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    await connectDB();

    const activity = await Activity.findById(id)
      .populate("city", "name state country description")
      .populate("hotel", "name type address")
      .lean();

    if (!activity) {
      return NextResponse.json({ error: "Activity not found" }, { status: 404 });
    }

    return NextResponse.json({ activity });
  } catch (err) {
    console.error("[GET /api/store/activities/:id]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
