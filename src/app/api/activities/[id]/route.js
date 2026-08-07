import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Activity from "@/models/Activity";

// ── GET /api/activities/[id] ──────────────────────────────────────────────────
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const activity = await Activity.findById(id)
      .populate("city", "name state country")
      .populate("hotel", "name type")
      .lean();

    if (!activity) {
      return NextResponse.json({ error: "Activity not found" }, { status: 404 });
    }

    return NextResponse.json({ activity });
  } catch (err) {
    console.error("[GET /api/activities/:id]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// ── PUT /api/activities/[id] — update (admin/superuser only) ──────────────────
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!["superuser", "admin"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await connectDB();

    const body = await request.json();
    const activity = await Activity.findByIdAndUpdate(
      id,
      { $set: body },
      { returnDocument: "after", runValidators: true }
    )
      .populate("city", "name state")
      .lean();

    if (!activity) {
      return NextResponse.json({ error: "Activity not found" }, { status: 404 });
    }

    return NextResponse.json({ activity });
  } catch (err) {
    console.error("[PUT /api/activities/:id]", err);
    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map((e) => e.message);
      return NextResponse.json({ error: messages.join(", ") }, { status: 422 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// ── DELETE /api/activities/[id] (admin/superuser only) ────────────────────────
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!["superuser", "admin"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await connectDB();

    const deleted = await Activity.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ error: "Activity not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/activities/:id]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
