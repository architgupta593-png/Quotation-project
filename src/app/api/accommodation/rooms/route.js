import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Room from "@/models/Room";

// ── GET /api/accommodation/rooms — list rooms for a hotel ─────────────────────
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const hotelId = searchParams.get("hotelId");

    const filter = {};
    if (hotelId) filter.hotel = hotelId;

    const rooms = await Room.find(filter).sort({ roomType: 1 }).lean();

    return NextResponse.json({ rooms });
  } catch (err) {
    console.error("[GET /api/accommodation/rooms]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// ── POST /api/accommodation/rooms — create a room ─────────────────────────────
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await connectDB();

    const body = await request.json();
    const room = await Room.create({ ...body, createdBy: session.user.id });

    return NextResponse.json({ room }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/accommodation/rooms]", err);
    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map((e) => e.message);
      return NextResponse.json({ error: messages.join(", ") }, { status: 422 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
