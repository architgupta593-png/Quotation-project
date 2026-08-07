import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Activity from "@/models/Activity";
import City from "@/models/City";

// ── GET /api/activities — list activities (optionally filtered by city/category) ──
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const city     = searchParams.get("city");
    const category = searchParams.get("category");
    const search   = searchParams.get("search");

    const filter = {};
    if (city)     filter.city     = city;
    if (category) filter.category = category;
    if (search) {
      filter.$or = [
        { name:        { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const activities = await Activity.find(filter)
      .sort({ name: 1 })
      .populate("city", "name state")
      .lean();

    return NextResponse.json({ activities });
  } catch (err) {
    console.error("[GET /api/activities]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// ── POST /api/activities — create a new activity (admin/superuser only) ────────
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
    const activity = await Activity.create({
      ...body,
      createdBy: session.user.id,
    });

    const populated = await Activity.findById(activity._id)
      .populate("city", "name state")
      .lean();

    return NextResponse.json({ activity: populated }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/activities]", err);
    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map((e) => e.message);
      return NextResponse.json({ error: messages.join(", ") }, { status: 422 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
