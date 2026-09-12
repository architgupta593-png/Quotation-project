import mongoose from "mongoose";

// ── Sub-schemas ───────────────────────────────────────────────────────────────

const QuickItineraryDaySchema = new mongoose.Schema(
  {
    day: { type: Number, required: true, min: 1 },
    title: { type: String, default: "", trim: true },
    description: { type: String, trim: true, default: "" },
    activities: { type: [String], default: [] },
    meals: {
      breakfast: { type: Boolean, default: true },
      lunch: { type: Boolean, default: false },
      dinner: { type: Boolean, default: false },
    },
  },
  { _id: false }
);

const HotelStaySchema = new mongoose.Schema(
  {
    nightNumber: { type: Number, default: 1 },
    nights: { type: Number, min: 1, default: 1 },
    cityName: { type: String, trim: true, default: "" },
    hotelId: { type: mongoose.Schema.Types.ObjectId, ref: "Hotel", default: null },
    hotelName: { type: String, trim: true, default: "" },
    category: { type: String, trim: true, default: "Deluxe" },
    starRating: {
      type: Number,
      min: 1,
      max: 5,
      default: 3,
      set: (v) => Math.max(1, Math.min(5, parseInt(v, 10) || 3)),
    },
    roomType: { type: String, trim: true, default: "Deluxe AC Room" },
    mealPlan: {
      type: String,
      default: "CP",
      set: (v) => {
        if (!v) return "CP";
        const u = String(v).toUpperCase().trim();
        if (["EP", "CP", "MAP", "AP"].includes(u)) return u;
        if (u.includes("MAP") || (u.includes("BREAKFAST") && u.includes("DINNER"))) return "MAP";
        if (u.includes("AP") || u.includes("ALL")) return "AP";
        if (u.includes("EP") || u.includes("ROOM")) return "EP";
        return "CP";
      },
    },
    availableMealPlans: { type: [String], default: undefined },
    mealPrices: { type: mongoose.Schema.Types.Mixed, default: undefined },
    pricePerNight: { type: Number, min: 0, default: 0 },
    notes: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

// ── Multi-Tier Accommodation Option (e.g. Option 1: Standard, Option 2: Deluxe, Option 3: Luxury) ──
const AccommodationOptionSchema = new mongoose.Schema(
  {
    label: { type: String, trim: true, default: "Option 1 (Standard)" },
    hotelStays: { type: [HotelStaySchema], default: [] },
    totalPrice: { type: Number, min: 0, default: 0 },
  },
  { _id: false }
);

const VehicleSchema = new mongoose.Schema(
  {
    vehicleType: {
      type: String,
      default: "Sedan",
    },
    model: { type: String, trim: true, default: "" },
    seats: { type: Number, min: 1, default: 4 },
    acType: { type: String, default: "AC" },
    vehiclePrice: { type: Number, min: 0, default: 0 },
    notes: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

// ── Main Quick Quotation Schema ───────────────────────────────────────────────

const QuickQuotationSchema = new mongoose.Schema(
  {
    // Unique Quick Quote Code (e.g. QQ-2026-8492)
    quickQuoteCode: {
      type: String,
      unique: true,
      required: true,
      uppercase: true,
      trim: true,
    },

    // ── Client & Lead Information ──
    client: {
      name: { type: String, required: [true, "Client name is required"], trim: true },
      phone: { type: String, required: [true, "Phone number is required"], trim: true },
      email: { type: String, trim: true, lowercase: true, default: "" },
      company: { type: String, trim: true, default: "" },
      clientType: {
        type: String,
        enum: ["b2c", "b2b", "corporate"],
        default: "b2c",
      },
      leadSource: { type: String, trim: true, default: "WhatsApp / Direct Call" },
      notes: { type: String, trim: true, default: "" },
    },

    // ── Trip Details ──
    tripDetails: {
      title: { type: String, required: [true, "Quotation title is required"], trim: true },
      destination: { type: String, required: [true, "Destination is required"], trim: true },
      theme: {
        type: String,
        default: "honeymoon",
        set: (v) => {
          if (!v) return "honeymoon";
          const l = String(v).toLowerCase().trim();
          const valid = ["honeymoon", "mountain", "beach", "heritage", "safari", "adventure", "general"];
          if (valid.includes(l)) return l;
          if (l.includes("honey") || l.includes("romantic")) return "honeymoon";
          if (l.includes("mount") || l.includes("hill")) return "mountain";
          if (l.includes("beach") || l.includes("coast") || l.includes("island")) return "beach";
          if (l.includes("heritage") || l.includes("cultur") || l.includes("temple")) return "heritage";
          if (l.includes("safari") || l.includes("wild") || l.includes("jungle")) return "safari";
          if (l.includes("advent") || l.includes("trek")) return "adventure";
          return "general";
        },
      },
      startDate: { type: Date, required: [true, "Start date is required"] },
      endDate: { type: Date, required: [true, "End date is required"] },
      nights: { type: Number, required: true, min: 1, default: 4 },
      days: { type: Number, required: true, min: 1, default: 5 },
    },

    // ── Passenger Details ──
    passengers: {
      adults: { type: Number, required: true, min: 1, default: 2 },
      childrenCount: { type: Number, min: 0, default: 0 },
      childrenAges: { type: [Number], default: [] },
      childrenWithBed: { type: Number, min: 0, default: 0 },
      childrenWithoutBed: { type: Number, min: 0, default: 0 },
      infants: { type: Number, min: 0, default: 0 },
      totalRooms: { type: Number, min: 1, default: 1 },
    },

    // ── Hotel Stays & Accommodation ──
    hotelStays: {
      type: [HotelStaySchema],
      default: [],
    },
    // ── Multi-Option Accommodation Tiers (e.g. Standard, Deluxe, Luxury) ──
    accommodationOptions: {
      type: [AccommodationOptionSchema],
      default: [],
    },

    // ── Day-by-Day Tour Itinerary ──
    showItinerary: {
      type: Boolean,
      default: true,
    },
    itinerary: {
      type: [QuickItineraryDaySchema],
      default: [],
    },

    // ── Dedicated Transport / Vehicle ──
    vehicle: {
      type: VehicleSchema,
      default: () => ({
        vehicleType: "Sedan",
        model: "Dzire / Etios",
        seats: 4,
        acType: "AC",
        vehiclePrice: 0,
        notes: "Includes fuel, toll taxes, parking & driver allowance",
      }),
    },

    // ── Key Inclusions & Exclusions ──
    inclusions: {
      type: [String],
      default: [
        "Accommodation on CP (Daily Breakfast) basis",
        "Private AC vehicle for all transfers and sightseeing",
        "All fuel charges, toll taxes, parking fees & driver allowances",
        "Assistance upon arrival and departure",
        "24x7 On-trip operations support",
      ],
    },
    exclusions: {
      type: [String],
      default: [
        "Airfare / Train tickets",
        "Entry fees to monuments, parks and activity tickets",
        "Personal expenses like laundry, minibar, phone calls",
        "Optional water sports / adventure activities",
        "GST 5% (unless explicitly specified)",
      ],
    },

    // ── Special Instructions & Travel Policies ──
    specialInstructions: {
      type: [String],
      default: [
        "Hotel check-in is typically at 12:00 PM and check-out is at 10:00 AM.",
        "Valid Government Photo ID is mandatory for all adult guests at hotel check-in.",
        "Driver contact details and vehicle number will be shared on WhatsApp 24 hours prior to travel.",
        "AC in vehicles will be switched off while driving in hilly terrains or when stationary.",
      ],
    },

    // ── Pricing & Commercial Matrix ──
    pricing: {
      totalPrice: { type: Number, min: 0, default: 0 },
      baseCost: { type: Number, min: 0, default: 0 },
      markupAmount: { type: Number, min: 0, default: 0 },
      markupReason: { type: String, trim: true, default: "" },
      discountAmount: { type: Number, min: 0, default: 0 },
      discountReason: { type: String, trim: true, default: "" },
      finalPrice: { type: Number, min: 0, default: 0 },
      perPersonPrice: { type: Number, min: 0, default: 0 },
      perCouplePrice: { type: Number, min: 0, default: 0 },
      advanceType: {
        type: String,
        enum: ["absolute", "percentage"],
        default: "absolute",
      },
      advanceAmount: { type: Number, min: 0, default: 0 },
      advancePercentage: { type: Number, min: 0, max: 100, default: 25 },
      advancePayment: { type: Number, min: 0, default: 0 },
      balancePayment: { type: Number, min: 0, default: 0 },
    },

    // ── Pipeline Lifecycle Status ──
    status: {
      type: String,
      enum: ["draft", "sent", "viewed", "accepted", "converted", "expired", "cancelled"],
      default: "draft",
    },

    // Reference to full quotation if converted
    convertedQuotationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quotation",
      default: null,
    },

    // View & Engagement Analytics
    viewCount: { type: Number, default: 0 },
    lastViewedAt: { type: Date, default: null },

    // Expiry Date (default 7 days)
    expiresAt: { type: Date, default: null },

    // Agent Ownership
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// ── Static Method: Generate QQ-YYYY-XXXX code ────────────────────────────────
QuickQuotationSchema.statics.generateQuickQuoteCode = async function () {
  const year = new Date().getFullYear();
  let code = "";
  let isUnique = false;
  let attempts = 0;

  while (!isUnique && attempts < 15) {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    code = `QQ-${year}-${randomNum}`;
    const existing = await this.findOne({ quickQuoteCode: code }).lean();
    if (!existing) {
      isUnique = true;
    }
    attempts++;
  }

  return code || `QQ-${year}-${Date.now().toString().slice(-4)}`;
};

if (mongoose.models && mongoose.models.QuickQuotation) {
  delete mongoose.models.QuickQuotation;
}

const QuickQuotation =
  mongoose.models.QuickQuotation ||
  mongoose.model("QuickQuotation", QuickQuotationSchema);

export default QuickQuotation;
