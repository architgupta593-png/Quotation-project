import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Itinerary from "@/models/Itinerary";

// GET /api/itineraries/[id]  — includes full dayByDay
export async function GET(request, { params }) {
  try {
    await connectDB();
    const itin = await Itinerary.findById(params.id).lean();
    if (!itin) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ itinerary: itin });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PUT /api/itineraries/[id]
export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["superuser", "admin"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const body = await request.json();
    delete body.createdBy; // never overwrite owner

    const itin = await Itinerary.findByIdAndUpdate(
      params.id,
      { $set: body },
      { new: true, runValidators: true }
    );
    if (!itin) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ itinerary: itin });
  } catch (err) {
    const msg = err.code === 11000 ? "Itinerary code already exists" : err.message;
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

// DELETE /api/itineraries/[id]
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["superuser", "admin"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    await Itinerary.findByIdAndDelete(params.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
