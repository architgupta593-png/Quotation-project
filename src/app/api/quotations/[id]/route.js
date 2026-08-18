import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Quotation from "@/models/Quotation";

// ── GET /api/quotations/[id] — Retrieve single quotation ─────────────────────
export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();

    const quotation = await Quotation.findById(id)
      .populate("createdBy", "name email role")
      .lean();

    if (!quotation) {
      return NextResponse.json({ error: "Quotation not found" }, { status: 404 });
    }

    // Role check: members only see their own
    if (session.user.role === "member" && quotation.createdBy?._id?.toString() !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ quotation });
  } catch (err) {
    console.error("[GET /api/quotations/:id]", err);
    return NextResponse.json({ error: err.message || "Failed to fetch quotation" }, { status: 500 });
  }
}

// ── PUT /api/quotations/[id] — Update quotation ──────────────────────────────
export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();

    const existing = await Quotation.findById(id);
    if (!existing) {
      return NextResponse.json({ error: "Quotation not found" }, { status: 404 });
    }

    if (session.user.role === "member" && existing.createdBy.toString() !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();

    // Update fields
    if (body.client) existing.client = { ...existing.client.toObject(), ...body.client };
    if (body.tripDetails) existing.tripDetails = { ...existing.tripDetails.toObject(), ...body.tripDetails };
    if (body.passengers) existing.passengers = { ...existing.passengers.toObject(), ...body.passengers };
    if (body.itinerary !== undefined) existing.itinerary = body.itinerary;
    if (body.accommodationOptions !== undefined) existing.accommodationOptions = body.accommodationOptions;
    if (body.selectedOptionIndex !== undefined) existing.selectedOptionIndex = body.selectedOptionIndex;
    if (body.vehicle) existing.vehicle = body.vehicle;
    if (body.pricing) existing.pricing = body.pricing;
    if (body.inclusions !== undefined) {
      existing.inclusions = body.inclusions;
    } else if (body.pricing?.includes) {
      existing.inclusions = body.pricing.includes;
    }
    if (body.exclusions !== undefined) {
      existing.exclusions = body.exclusions;
    } else if (body.pricing?.excludes) {
      existing.exclusions = body.pricing.excludes;
    }
    if (body.paymentTerms) existing.paymentTerms = body.paymentTerms;
    if (body.instructions !== undefined) existing.instructions = body.instructions;
    if (body.coverImage !== undefined) existing.coverImage = body.coverImage;
    if (body.highlights !== undefined) existing.highlights = body.highlights;
    if (body.status !== undefined) existing.status = body.status;
    if (body.validUntil) existing.validUntil = new Date(body.validUntil);

    await existing.save();

    const updated = await Quotation.findById(id)
      .populate("createdBy", "name email role")
      .lean();

    return NextResponse.json({ quotation: updated });
  } catch (err) {
    console.error("[PUT /api/quotations/:id]", err);
    return NextResponse.json({ error: err.message || "Failed to update quotation" }, { status: 500 });
  }
}

// ── DELETE /api/quotations/[id] — Remove quotation ───────────────────────────
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();

    const existing = await Quotation.findById(id);
    if (!existing) {
      return NextResponse.json({ error: "Quotation not found" }, { status: 404 });
    }

    if (session.user.role === "member" && existing.createdBy.toString() !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await Quotation.findByIdAndDelete(id);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/quotations/:id]", err);
    return NextResponse.json({ error: err.message || "Failed to delete quotation" }, { status: 500 });
  }
}
