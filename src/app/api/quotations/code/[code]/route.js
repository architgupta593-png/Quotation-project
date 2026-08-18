import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Quotation from "@/models/Quotation";

// ── GET /api/quotations/code/[code] — Fetch public quotation by code ─────────
export async function GET(request, { params }) {
  try {
    const { code } = await params;
    await connectDB();

    const quotation = await Quotation.findOne({
      quotationCode: code.toUpperCase(),
    })
      .populate("createdBy", "name email phone")
      .lean();

    if (!quotation) {
      return NextResponse.json({ error: "Quotation not found or expired" }, { status: 404 });
    }

    // Auto-mark status as "viewed" if it was "sent"
    if (quotation.status === "sent") {
      await Quotation.updateOne({ quotationCode: code.toUpperCase() }, { status: "viewed" });
      quotation.status = "viewed";
    }

    return NextResponse.json({ quotation });
  } catch (err) {
    console.error("[GET /api/quotations/code/:code]", err);
    return NextResponse.json({ error: err.message || "Failed to fetch quotation" }, { status: 500 });
  }
}

// ── POST /api/quotations/code/[code] — Client Action (Accept / Request Booking) ─
export async function POST(request, { params }) {
  try {
    const { code } = await params;
    const body = await request.json();
    const { action, selectedTierIndex, clientNotes } = body;

    await connectDB();

    const quotation = await Quotation.findOne({
      quotationCode: code.toUpperCase(),
    });

    if (!quotation) {
      return NextResponse.json({ error: "Quotation not found" }, { status: 404 });
    }

    if (action === "accept") {
      quotation.status = "confirmed";
      if (selectedTierIndex !== undefined) {
        quotation.selectedOptionIndex = parseInt(selectedTierIndex, 10);
      }
      if (clientNotes) {
        quotation.client.notes = `${quotation.client.notes ? quotation.client.notes + "\n" : ""}Client Acceptance Note: ${clientNotes}`;
      }
      await quotation.save();

      return NextResponse.json({
        success: true,
        message: "Quotation accepted successfully! Our travel team has been notified.",
        quotation,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    console.error("[POST /api/quotations/code/:code]", err);
    return NextResponse.json({ error: err.message || "Action failed" }, { status: 500 });
  }
}
