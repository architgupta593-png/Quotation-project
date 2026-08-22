import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import QuickQuotation from "@/models/QuickQuotation";

// ── GET /api/quick-quotations — List quick quotes with filters ─────────────────
export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50", 10)));
    const skip = (page - 1) * limit;

    const query = {};

    if (status && status !== "all") {
      query.status = status;
    }

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), "i");
      query.$or = [
        { quickQuoteCode: regex },
        { "client.name": regex },
        { "client.phone": regex },
        { "client.email": regex },
        { "tripDetails.title": regex },
        { "tripDetails.destination": regex },
      ];
    }

    const [quickQuotations, totalCount] = await Promise.all([
      QuickQuotation.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      QuickQuotation.countDocuments(query),
    ]);

    // Pipeline metrics across all items
    const allQuotes = await QuickQuotation.find({}).select("status pricing.finalPrice").lean();
    const stats = {
      total: allQuotes.length,
      totalValue: allQuotes.reduce((s, q) => s + (q.pricing?.finalPrice || 0), 0),
      draft: allQuotes.filter((q) => q.status === "draft").length,
      sent: allQuotes.filter((q) => q.status === "sent").length,
      accepted: allQuotes.filter((q) => q.status === "accepted").length,
      acceptedValue: allQuotes
        .filter((q) => q.status === "accepted")
        .reduce((s, q) => s + (q.pricing?.finalPrice || 0), 0),
      converted: allQuotes.filter((q) => q.status === "converted").length,
    };

    return NextResponse.json({
      quickQuotations,
      stats,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (err) {
    console.error("[GET /api/quick-quotations]", err);
    return NextResponse.json({ error: err.message || "Failed to fetch quick quotations" }, { status: 500 });
  }
}

// ── POST /api/quick-quotations — Create a new quick quote ──────────────────────
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const body = await req.json();

    // Generate unique code if not provided
    if (!body.quickQuoteCode) {
      body.quickQuoteCode = await QuickQuotation.generateQuickQuoteCode();
    }

    // Default expiry to 7 days from now
    if (!body.expiresAt) {
      const exp = new Date();
      exp.setDate(exp.getDate() + 7);
      body.expiresAt = exp;
    }

    body.createdBy = session.user.id;

    const quickQuotation = new QuickQuotation(body);
    await quickQuotation.save();

    return NextResponse.json({
      message: "Quick quotation created successfully",
      quickQuotation,
    }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/quick-quotations]", err);
    return NextResponse.json({ error: err.message || "Failed to create quick quotation" }, { status: 500 });
  }
}
