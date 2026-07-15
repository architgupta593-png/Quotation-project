import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import City from "@/models/City";

// ── GET /api/accommodation/cities/[cityId] ────────────────────────────────────
export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const { cityId } = await params;
    const city = await City.findById(cityId).lean();
    if (!city) {
      return NextResponse.json({ error: "City not found" }, { status: 404 });
    }

    return NextResponse.json({ city });
  } catch (err) {
    console.error("[GET /api/accommodation/cities/[cityId]]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// ── PUT /api/accommodation/cities/[cityId] ────────────────────────────────────
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
    const { cityId } = await params;
    const body = await request.json();

    const city = await City.findByIdAndUpdate(
      cityId,
      { $set: body },
      { new: true, runValidators: true }
    ).lean();

    if (!city) {
      return NextResponse.json({ error: "City not found" }, { status: 404 });
    }

    return NextResponse.json({ city });
  } catch (err) {
    console.error("[PUT /api/accommodation/cities/[cityId]]", err);
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

// ── DELETE /api/accommodation/cities/[cityId] ─────────────────────────────────
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
    const { cityId } = await params;

    const city = await City.findByIdAndDelete(cityId).lean();
    if (!city) {
      return NextResponse.json({ error: "City not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "City deleted" });
  } catch (err) {
    console.error("[DELETE /api/accommodation/cities/[cityId]]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
