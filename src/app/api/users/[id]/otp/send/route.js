import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { requireAuth } from "@/lib/authorize";
import { checkRateLimit } from "@/lib/rate-limit";

/**
 * Dispatch SMS via Fast2SMS API if FAST2SMS_API_KEY is configured
 */
async function sendFast2Sms(phone, otp) {
  const apiKey = process.env.FAST2SMS_API_KEY;
  if (!apiKey) return false;

  try {
    const cleanNumbers = phone.replace(/[^0-9]/g, "").slice(-10);
    const res = await fetch("https://www.fast2sms.com/dev/bulkV2", {
      method: "POST",
      headers: {
        authorization: apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        variables_values: otp,
        route: "otp",
        numbers: cleanNumbers,
      }),
    });
    const result = await res.json();
    console.log("[Fast2SMS Response]:", result);
    return result.return === true;
  } catch (err) {
    console.error("[Fast2SMS Error]:", err.message);
    return false;
  }
}

/**
 * Dispatch SMS via Twilio API if TWILIO_* credentials are configured
 */
async function sendTwilioSms(phone, otp) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) return false;

  try {
    const cleanPhone = phone.startsWith("+") ? phone : `+91${phone.replace(/[^0-9]/g, "").slice(-10)}`;
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const params = new URLSearchParams({
      To: cleanPhone,
      From: fromNumber,
      Body: `Your TourCraft verification code is: ${otp}. Valid for 5 minutes.`,
    });

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: "Basic " + Buffer.from(`${accountSid}:${authToken}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    const result = await res.json();
    console.log("[Twilio Response]:", result.status || result.message);
    return !!result.sid;
  } catch (err) {
    console.error("[Twilio Error]:", err.message);
    return false;
  }
}

/**
 * POST /api/users/[id]/otp/send — Generate and send OTP to user's phone.
 * Supports updating phone number in the same call for existing accounts.
 * Accessible by: Superuser or the account owner.
 */
export async function POST(request, { params }) {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;

    const { id } = await params;
    const session = auth.session;

    // Only superuser or the user themselves can trigger OTP verification
    if (session.user.role !== "superuser" && session.user.id !== id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Rate limit: max 10 OTP requests per 10 minutes (forgiving for testing)
    const isDev = process.env.NODE_ENV !== "production";
    const rateKey = `otp_send:${id}`;
    const rate = checkRateLimit(rateKey, { limit: isDev ? 50 : 10, windowMs: 10 * 60 * 1000 });
    if (!rate.success) {
      return NextResponse.json(
        { error: "Too many OTP requests. Please wait a few minutes before trying again." },
        { status: 429 }
      );
    }

    // Optional: read new phone number from request body if user is adding/changing phone
    const body = await request.json().catch(() => ({}));
    const rawIncomingPhone = body?.phone ? String(body.phone).trim() : "";

    await connectDB();
    const user = await User.findById(id).select("+phoneOtp +phoneOtpExpiry +phoneOtpAttempts");
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Determine the phone to use
    const activePhone = rawIncomingPhone || user.phone || "";
    const cleanDigits = activePhone.replace(/[^0-9]/g, "");

    if (!cleanDigits || cleanDigits.length < 7) {
      return NextResponse.json(
        { error: "Please enter a valid mobile number (min 10 digits)." },
        { status: 400 }
      );
    }

    // Update user.phone if changed or newly provided
    if (rawIncomingPhone && rawIncomingPhone.length >= 7) {
      if (user.phone !== rawIncomingPhone) {
        user.phone = rawIncomingPhone;
        user.isPhoneVerified = false;
      }
    }

    // Generate secure 6-digit numeric OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes TTL

    user.phoneOtp = otp;
    user.phoneOtpExpiry = expiry;
    user.phoneOtpAttempts = 0;
    await user.save();

    // 1. Attempt live SMS delivery via Fast2SMS or Twilio if configured
    let smsSent = false;
    let smsGatewayUsed = "none";
    if (process.env.FAST2SMS_API_KEY) {
      smsSent = await sendFast2Sms(user.phone, otp);
      smsGatewayUsed = smsSent ? "Fast2SMS" : "Fast2SMS (Failed)";
    } else if (process.env.TWILIO_ACCOUNT_SID) {
      smsSent = await sendTwilioSms(user.phone, otp);
      smsGatewayUsed = smsSent ? "Twilio" : "Twilio (Failed)";
    }

    // 2. Build direct 1-click WhatsApp verification message URL
    const whatsappDigits = user.phone ? user.phone.replace(/[^0-9]/g, "") : cleanDigits;
    const whatsappMsg = encodeURIComponent(`*TourCraft Verification Code:* ${otp}\n\nValid for 5 minutes. Do not share this code with anyone.`);
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${whatsappDigits}&text=${whatsappMsg}`;

    // 3. Log OTP to terminal console for instant visibility
    console.log(`\n========================================`);
    console.log(`🔑 [OTP DISPATCH] Destination: ${user.phone}`);
    console.log(`🔢 OTP Code: ${otp}`);
    console.log(`💬 SMS Gateway: ${smsGatewayUsed}`);
    console.log(`📱 WhatsApp Link: ${whatsappUrl}`);
    console.log(`⏰ Expires In: 5 Minutes`);
    console.log(`========================================\n`);

    // Mask phone for display (e.g., +91 98*** **210)
    const phoneStr = user.phone.trim();
    const maskedPhone = phoneStr.length > 5 
      ? phoneStr.slice(0, 4) + "*".repeat(Math.max(2, phoneStr.length - 7)) + phoneStr.slice(-3)
      : phoneStr;

    return NextResponse.json({
      success: true,
      message: smsSent 
        ? `OTP sent to ${maskedPhone} via SMS`
        : `OTP generated for ${maskedPhone}`,
      phone: user.phone,
      otp: otp,
      previewOtp: otp,
      whatsappUrl,
      smsSent,
      hasSmsGateway: !!(process.env.FAST2SMS_API_KEY || process.env.TWILIO_ACCOUNT_SID),
      expiresAt: expiry,
    });
  } catch (err) {
    console.error("[POST /api/users/[id]/otp/send]", err);
    return NextResponse.json({ error: "Failed to send OTP" }, { status: 500 });
  }
}

