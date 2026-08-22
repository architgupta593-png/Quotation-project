import mongoose from "mongoose";

// ── Sub-schemas ───────────────────────────────────────────────────────────────

const HotelStaySchema = new mongoose.Schema(
  {
    nightNumber: { type: Number, required: true, min: 1 },
    cityName: { type: String, trim: true, default: "" },
    hotelName: { type: String, trim: true, default: "" },
    starRating: { type: Number, min: 1, max: 5, default: 3 },
    roomType: { type: String, trim: true, default: "Deluxe AC Room" },
    mealPlan: {
      type: String,
      enum: ["EP", "CP", "MAP", "AP", ""],
      default: "CP",
    },
    pricePerNight: { type: Number, min: 0, default: 0 },
    notes: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

const VehicleSchema = new mongoose.Schema(
  {
    vehicleType: {
      type: String,
      enum: ["Sedan", "SUV", "MUV", "Tempo Traveller", "Mini Bus", "Bus", "Other"],
      default: "Sedan",
    },
    model: { type: String, trim: true, default: "" },
    seats: { type: Number, min: 1, default: 4 },
    acType: { type: String, enum: ["AC", "Non-AC"], default: "AC" },
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
        enum: ["honeymoon", "mountain", "beach", "heritage", "safari", "adventure", "general"],
        default: "general",
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
      discountAmount: { type: Number, min: 0, default: 0 },
      discountReason: { type: String, trim: true, default: "" },
      finalPrice: { type: Number, min: 0, default: 0 },
      perPersonPrice: { type: Number, min: 0, default: 0 },
      perCouplePrice: { type: Number, min: 0, default: 0 },
      advancePercentage: { type: Number, default: 25 },
    },

    // ── Status & Workflow ──
    status: {
      type: String,
      enum: ["draft", "sent", "viewed", "accepted", "converted", "cancelled"],
      default: "draft",
    },

    // Reference to full Quotation if converted
    convertedQuotationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quotation",
      default: null,
    },

    // Quick Agent Remarks / Internal Notes
    internalNotes: { type: String, trim: true, default: "" },

    // Tracking & Analytics
    viewsCount: { type: Number, default: 0 },
    lastViewedAt: { type: Date, default: null },
    expiresAt: { type: Date, default: null },

    // Creator
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// ── Indexes ───────────────────────────────────────────────────────────────────
QuickQuotationSchema.index({ quickQuoteCode: 1 }, { unique: true });
QuickQuotationSchema.index({ "client.phone": 1 });
QuickQuotationSchema.index({ "client.email": 1 });
QuickQuotationSchema.index({ status: 1, createdAt: -1 });

// ── Helper method to auto-generate code ───────────────────────────────────────
QuickQuotationSchema.statics.generateQuickQuoteCode = async function () {
  const year = new Date().getFullYear();
  let code = "";
  let exists = true;
  while (exists) {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    code = `QQ-${year}-${randomNum}`;
    const found = await this.findOne({ quickQuoteCode: code });
    if (!found) exists = false;
  }
  return code;
};

// ── Pre-save Calculations ─────────────────────────────────────────────────────
QuickQuotationSchema.pre("save", function () {
  const p = this.pricing || {};
  const total = Number(p.totalPrice || p.baseCost || p.finalPrice) || 0;
  const discount = Number(p.discountAmount) || 0;
  const final = Math.max(0, total - discount);

  const adults = Math.max(1, this.passengers?.adults || 2);
  p.totalPrice = total;
  p.finalPrice = final;
  p.perCouplePrice = final;
  p.perPersonPrice = Math.round(final / adults);
});

export default mongoose.models.QuickQuotation ||
  mongoose.model("QuickQuotation", QuickQuotationSchema);
