import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { requireAuth } from "@/lib/authorize";

/**
 * POST /api/users/[id]/otp/verify — Verify OTP code for user phone.
 * Accessible by: Superuser or the account owner.
 */
export async function POST(request, { params }) {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;

    const { id } = await params;
    const session = auth.session;
    const isSuperuser = session.user.role === "superuser";

    // Only superuser or the user themselves can verify OTP
    if (!isSuperuser && session.user.id !== id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const { otp, directVerify, phone } = body;
    const rawIncomingPhone = phone ? String(phone).trim() : "";

    await connectDB();
    const user = await User.findById(id).select("+phoneOtp +phoneOtpExpiry +phoneOtpAttempts");
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Determine active phone
    const activePhone = rawIncomingPhone || user.phone || "";
    const cleanDigits = activePhone.replace(/[^0-9]/g, "");

    if (!cleanDigits || cleanDigits.length < 7) {
      return NextResponse.json(
        { error: "Please enter a valid mobile number (min 10 digits)." },
        { status: 400 }
      );
    }

    // Save phone if provided
    if (rawIncomingPhone && rawIncomingPhone.length >= 7) {
      user.phone = rawIncomingPhone;
    }

    // Direct Verification Bypass (Allowed for Superusers)
    if (isSuperuser && directVerify === true) {
      user.isPhoneVerified = true;
      user.phoneOtp = undefined;
      user.phoneOtpExpiry = undefined;
      user.phoneOtpAttempts = 0;
      await user.save();

      return NextResponse.json({
        success: true,
        message: `Contact number (${user.phone}) verified successfully! ✅`,
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          phone: user.phone,
          isPhoneVerified: user.isPhoneVerified,
        },
      });
    }

    // Standard 6-digit OTP Verification
    if (!otp || typeof otp !== "string" || otp.trim().length !== 6) {
      return NextResponse.json(
        { error: "Please enter a valid 6-digit OTP code." },
        { status: 400 }
      );
    }

    if (!user.phoneOtp || !user.phoneOtpExpiry) {
      return NextResponse.json(
        { error: "No pending OTP request found. Please click 'Send OTP' first." },
        { status: 400 }
      );
    }

    // Check max failed attempts (max 5)
    if (user.phoneOtpAttempts >= 5) {
      user.phoneOtp = undefined;
      user.phoneOtpExpiry = undefined;
      await user.save();
      return NextResponse.json(
        { error: "Too many incorrect attempts. Please request a new OTP code." },
        { status: 400 }
      );
    }

    // Check expiry
    if (new Date() > new Date(user.phoneOtpExpiry)) {
      return NextResponse.json(
        { error: "OTP code has expired. Please request a new code." },
        { status: 400 }
      );
    }

    // Compare OTP
    if (user.phoneOtp.trim() !== otp.trim()) {
      user.phoneOtpAttempts = (user.phoneOtpAttempts || 0) + 1;
      await user.save();
      const remainingAttempts = 5 - user.phoneOtpAttempts;
      return NextResponse.json(
        {
          error: `Incorrect OTP code. ${remainingAttempts} attempt${remainingAttempts === 1 ? "" : "s"} remaining.`,
        },
        { status: 400 }
      );
    }

    // OTP Verified Successfully!
    user.isPhoneVerified = true;
    user.phoneOtp = undefined;
    user.phoneOtpExpiry = undefined;
    user.phoneOtpAttempts = 0;
    await user.save();

    return NextResponse.json({
      success: true,
      message: "Contact number verified successfully! ✅",
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone,
        isPhoneVerified: user.isPhoneVerified,
      },
    });
  } catch (err) {
    console.error("[POST /api/users/[id]/otp/verify]", err);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}

