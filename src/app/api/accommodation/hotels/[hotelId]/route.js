import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Hotel from "@/models/Hotel";
import Room  from "@/models/Room";

// ── GET /api/accommodation/hotels/[hotelId] ───────────────────────────────────
export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const { hotelId } = await params;
    const hotel = await Hotel.findById(hotelId)
      .populate("city", "name state country")
      .lean();

    if (!hotel) {
      return NextResponse.json({ error: "Hotel not found" }, { status: 404 });
    }

    return NextResponse.json({ hotel });
  } catch (err) {
    console.error("[GET /api/accommodation/hotels/[hotelId]]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// ── PUT /api/accommodation/hotels/[hotelId] ───────────────────────────────────
export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await connectDB();
    const { hotelId } = await params;
    const body = await request.json();

    const hotel = await Hotel.findByIdAndUpdate(
      hotelId,
      { $set: body },
      { new: true, runValidators: true }
    )
      .populate("city", "name state country")
      .lean();

    if (!hotel) {
      return NextResponse.json({ error: "Hotel not found" }, { status: 404 });
    }

    return NextResponse.json({ hotel });
  } catch (err) {
    console.error("[PUT /api/accommodation/hotels/[hotelId]]", err);
    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map((e) => e.message);
      return NextResponse.json({ error: messages.join(", ") }, { status: 422 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// ── DELETE /api/accommodation/hotels/[hotelId] ────────────────────────────────
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await connectDB();
    const { hotelId } = await params;

    const hotel = await Hotel.findByIdAndDelete(hotelId).lean();
    if (!hotel) {
      return NextResponse.json({ error: "Hotel not found" }, { status: 404 });
    }

    // ── Cascade: delete all rooms that belong to this hotel ──────────────────
    const { deletedCount } = await Room.deleteMany({ hotel: hotelId });
    console.log(`[DELETE hotel ${hotelId}] Cascade-deleted ${deletedCount} room(s).`);

    return NextResponse.json({ message: "Hotel and its rooms deleted", roomsDeleted: deletedCount });
  } catch (err) {
    console.error("[DELETE /api/accommodation/hotels/[hotelId]]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
