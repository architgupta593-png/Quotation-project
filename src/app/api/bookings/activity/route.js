import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Activity from "@/models/Activity";
import Booking from "@/models/Booking";

function generateVoucherCode() {
  const randomNum = Math.floor(100000 + Math.random() * 900000);
  return `PASS-${randomNum}`;
}

// ── POST /api/bookings/activity — Book standalone activity ticket ─────────────
export async function POST(request) {
  try {
    await connectDB();

    const body = await request.json();
    const {
      activityId,
      customerName,
      customerEmail,
      customerPhone,
      travelDate,
      timeSlot,
      adults = 1,
      children = 0,
      notes = "",
    } = body;

    if (!activityId || !customerName || !customerEmail || !customerPhone || !travelDate) {
      return NextResponse.json(
        { error: "Missing required booking details." },
        { status: 400 }
      );
    }

    const activity = await Activity.findById(activityId).lean();
    if (!activity) {
      return NextResponse.json({ error: "Activity not found" }, { status: 404 });
    }

    const adultRate = activity.pricingTiers?.adultPrice || activity.price || 0;
    const childRate = activity.pricingTiers?.childPrice || 0;

    const adultTotal = (parseInt(adults, 10) || 1) * adultRate;
    const childTotal = (parseInt(children, 10) || 0) * childRate;
    const grandTotal = adultTotal + childTotal;

    const voucherCode = generateVoucherCode();

    const booking = await Booking.create({
      bookingType: "activity",
      activity:    activity._id,
      city:        activity.city,
      customer: {
        name:  customerName,
        email: customerEmail,
        phone: customerPhone,
        notes,
      },
      activityDetails: {
        activityName: activity.name,
        travelDate:   new Date(travelDate),
        timeSlot:     timeSlot || "Full Day",
        adults:       parseInt(adults, 10) || 1,
        children:     parseInt(children, 10) || 0,
        adultPrice:   adultRate,
        childPrice:   childRate,
      },
      pricing: {
        subtotal:   grandTotal,
        tax:        0,
        grandTotal,
        currency:   "INR",
      },
      voucherCode,
      paymentStatus: "paid",
    });

    const populated = await Booking.findById(booking._id)
      .populate("activity", "name duration category images inclusions instructions")
      .populate("city", "name state country")
      .lean();

    return NextResponse.json({ booking: populated }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/bookings/activity]", err);
    return NextResponse.json({ error: err.message || "Booking failed" }, { status: 500 });
  }
}
