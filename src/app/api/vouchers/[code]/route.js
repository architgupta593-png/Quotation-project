import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Booking from "@/models/Booking";
import Activity from "@/models/Activity";
import City from "@/models/City";

// ── GET /api/vouchers/[code] — Verify ticket voucher pass ─────────────────────
export async function GET(request, { params }) {
  try {
    const { code } = await params;
    await connectDB();

    const booking = await Booking.findOne({
      voucherCode: code.toUpperCase(),
    })
      .populate("activity", "name category duration images inclusions instructions")
      .populate("city", "name state country")
      .lean();

    if (!booking) {
      return NextResponse.json({ error: "Invalid voucher code" }, { status: 404 });
    }

    return NextResponse.json({ booking });
  } catch (err) {
    console.error("[GET /api/vouchers/:code]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
