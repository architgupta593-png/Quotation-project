import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import QuickQuotation from "@/models/QuickQuotation";

// ── GET /api/quick-quotations/code/[code] — Fetch public quick quote by code ───
export async function GET(req, { params }) {
  try {
    const { code } = await params;
    if (!code) {
      return NextResponse.json({ error: "Quick quotation code is required" }, { status: 400 });
    }

    await connectDB();

    const quickQuotation = await QuickQuotation.findOne({
      quickQuoteCode: code.toUpperCase().trim(),
    }).lean();

    if (!quickQuotation) {
      return NextResponse.json({ error: "Proposal not found or has been removed" }, { status: 404 });
    }

    // Increment view count if first time viewing
    await QuickQuotation.updateOne(
      { _id: quickQuotation._id },
      {
        $inc: { viewsCount: 1 },
        $set: {
          lastViewedAt: new Date(),
          ...(quickQuotation.status === "sent" ? { status: "viewed" } : {}),
        },
      }
    );

    return NextResponse.json({ quickQuotation });
  } catch (err) {
    console.error("[GET /api/quick-quotations/code/:code]", err);
    return NextResponse.json({ error: err.message || "Failed to load proposal" }, { status: 500 });
  }
}

// ── POST /api/quick-quotations/code/[code] — Client Action (Accept / Request Booking) ─
export async function POST(req, { params }) {
  try {
    const { code } = await params;
    const body = await req.json();
    const { action, notes } = body;

    await connectDB();

    const quickQuotation = await QuickQuotation.findOne({
      quickQuoteCode: code.toUpperCase().trim(),
    });

    if (!quickQuotation) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    }

    if (action === "accept") {
      quickQuotation.status = "accepted";
      if (notes) {
        quickQuotation.client.notes = notes;
      }
      await quickQuotation.save();

      return NextResponse.json({
        message: "Thank you! Your proposal has been accepted. Our operations team will contact you shortly.",
        quickQuotation,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    console.error("[POST /api/quick-quotations/code/:code]", err);
    return NextResponse.json({ error: err.message || "Failed to process request" }, { status: 500 });
  }
}
