import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import QuickQuotation from "@/models/QuickQuotation";

// ── GET /api/quick-quotations/[id] — Retrieve single quick quotation ───────────
export async function GET(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();

    const quickQuotation = await QuickQuotation.findById(id).lean();
    if (!quickQuotation) {
      return NextResponse.json({ error: "Quick quotation not found" }, { status: 404 });
    }

    return NextResponse.json({ quickQuotation });
  } catch (err) {
    console.error("[GET /api/quick-quotations/:id]", err);
    return NextResponse.json({ error: err.message || "Failed to retrieve quick quotation" }, { status: 500 });
  }
}

// ── PUT /api/quick-quotations/[id] — Update quick quotation ───────────────────
export async function PUT(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();

    const body = await req.json();

    const quickQuotation = await QuickQuotation.findById(id);
    if (!quickQuotation) {
      return NextResponse.json({ error: "Quick quotation not found" }, { status: 404 });
    }

    // Assign modified fields
    Object.assign(quickQuotation, body);

    await quickQuotation.save();

    return NextResponse.json({
      message: "Quick quotation updated successfully",
      quickQuotation,
    });
  } catch (err) {
    console.error("[PUT /api/quick-quotations/:id]", err);
    return NextResponse.json({ error: err.message || "Failed to update quick quotation" }, { status: 500 });
  }
}

// ── DELETE /api/quick-quotations/[id] — Remove quick quotation ─────────────────
export async function DELETE(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();

    const quickQuotation = await QuickQuotation.findByIdAndDelete(id);
    if (!quickQuotation) {
      return NextResponse.json({ error: "Quick quotation not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Quick quotation deleted successfully" });
  } catch (err) {
    console.error("[DELETE /api/quick-quotations/:id]", err);
    return NextResponse.json({ error: err.message || "Failed to delete quick quotation" }, { status: 500 });
  }
}
