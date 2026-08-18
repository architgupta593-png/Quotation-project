import mongoose from "mongoose";

// ── Sub-schemas ───────────────────────────────────────────────────────────────

const ImageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    caption: { type: String, default: "" },
  },
  { _id: false }
);

const ItineraryDaySchema = new mongoose.Schema(
  {
    day: { type: Number, required: true, min: 1 },
    title: {
      type: String,
      default: "",
      trim: true,
      maxlength: 150,
    },
    description: { type: String, trim: true, default: "" },
    activities: [mongoose.Schema.Types.Mixed],
    meals: {
      breakfast: { type: Boolean, default: false },
      lunch: { type: Boolean, default: false },
      dinner: { type: Boolean, default: false },
    },
    images: [ImageSchema],
  },
  { _id: false }
);

const DestinationSchema = new mongoose.Schema(
  {
    cityId: { type: mongoose.Schema.Types.ObjectId, ref: "City", default: null },
    cityName: { type: String, trim: true, default: "" },
    state: { type: String, trim: true, default: "" },
    nights: { type: Number, min: 1, default: 1 },
  },
  { _id: false }
);

const AccommodationNightSchema = new mongoose.Schema(
  {
    night: { type: Number, required: true, min: 1 },
    cityId: { type: mongoose.Schema.Types.ObjectId, ref: "City", default: null },
    cityName: { type: String, trim: true, default: "" },
    hotelId: { type: mongoose.Schema.Types.ObjectId, ref: "Hotel", default: null },
    hotelName: { type: String, trim: true, default: "" },
    roomId: { type: mongoose.Schema.Types.ObjectId, ref: "Room", default: null },
    roomType: { type: String, trim: true, default: "" },
    mealPlan: {
      type: String,
      enum: ["EP", "CP", "MAP", "AP", ""],
      default: "CP",
    },
    starRating: { type: Number, min: 1, max: 5, default: null },
    pricePerNight: { type: Number, min: 0, default: 0 },
    notes: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

const AccommodationOptionSchema = new mongoose.Schema(
  {
    label: { type: String, trim: true, default: "Option 1" },
    nights: { type: [AccommodationNightSchema], default: [] },
    totalPrice: { type: Number, min: 0, default: 0 },
    marginType: { type: String, enum: ["absolute", "percentage"], default: "absolute" },
    margin: { type: Number, default: 0 },
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

const InstructionBlockSchema = new mongoose.Schema(
  {
    heading: { type: String, trim: true, default: "" },
    title: { type: String, trim: true, default: "" },
    format: {
      type: String,
      enum: ["bullet", "numbered", "alphabetic", "paragraph"],
      default: "bullet",
    },
    items: [{ type: String, trim: true }],
    content: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

// ── Main Quotation Schema ─────────────────────────────────────────────────────

const QuotationSchema = new mongoose.Schema(
  {
    // Unique Quotation Code (e.g. QT-2026-8492)
    quotationCode: {
      type: String,
      unique: true,
      required: true,
      uppercase: true,
      trim: true,
    },

    // Source template package ID if cloned
    sourcePackage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Package",
      default: null,
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
      leadSource: { type: String, trim: true, default: "Direct" },
      notes: { type: String, trim: true, default: "" },
    },

    // ── Trip Details ──
    tripDetails: {
      title: { type: String, required: [true, "Quotation title is required"], trim: true },
      startDate: { type: Date, required: [true, "Start date is required"] },
      endDate: { type: Date, required: [true, "End date is required"] },
      nights: { type: Number, required: true, min: 1 },
      days: { type: Number, required: true, min: 1 },
      destinations: { type: [DestinationSchema], default: [] },
      destination: { type: String, trim: true, default: "" },
    },

    // ── Passenger Details ──
    passengers: {
      adults: { type: Number, min: 1, default: 2 },
      childrenWithBed: { type: Number, min: 0, default: 0 },
      childrenNoBed: { type: Number, min: 0, default: 0 },
      infants: { type: Number, min: 0, default: 0 },
      totalRooms: { type: Number, min: 1, default: 1 },
    },

    coverImage: {
      type: ImageSchema,
      default: null,
    },
    highlights: [{ type: String, trim: true }],

    // Day-by-Day Itinerary with rich HTML descriptions
    itinerary: [ItineraryDaySchema],

    // Multi-tier accommodation options (Standard, Deluxe, Luxury)
    accommodationOptions: {
      type: [AccommodationOptionSchema],
      default: [],
    },
    selectedOptionIndex: { type: Number, default: 0 },

    // Transport & Vehicle
    vehicle: {
      type: VehicleSchema,
      default: () => ({}),
    },

    // ── Financial Calculation Engine ──
    pricing: {
      accommodationTotal: { type: Number, min: 0, default: 0 },
      vehicleTotal: { type: Number, min: 0, default: 0 },
      activitiesTotal: { type: Number, min: 0, default: 0 },
      subtotal: { type: Number, min: 0, default: 0 },
      marginType: { type: String, enum: ["absolute", "percentage"], default: "absolute" },
      margin: { type: Number, default: 0 },
      discountAmount: { type: Number, min: 0, default: 0 },
      includeGst: { type: Boolean, default: false },
      gstPercentage: { type: Number, default: 5 },
      finalPrice: { type: Number, min: 0, default: 0 },
      perPersonPrice: { type: Number, min: 0, default: 0 },
      perCouplePrice: { type: Number, min: 0, default: 0 },
      numberOfPersons: { type: Number, min: 1, default: 2 },
      currency: { type: String, default: "INR", maxlength: 5 },
    },

    inclusions: [{ type: String, trim: true }],
    exclusions: [{ type: String, trim: true }],

    // Payment Terms & Milestones
    paymentTerms: {
      advancePercentage: { type: Number, default: 25 },
      advanceAmount: { type: Number, default: 0 },
      balanceDueDate: { type: Date, default: null },
      termsText: {
        type: String,
        default: "25% advance to confirm booking, balance payable 15 days before travel.",
      },
    },

    instructions: {
      type: [InstructionBlockSchema],
      default: [],
    },

    // Status tracking
    status: {
      type: String,
      enum: ["draft", "sent", "viewed", "confirmed", "expired", "cancelled"],
      default: "draft",
    },
    validUntil: { type: Date, default: null },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// Indexes
QuotationSchema.index({ quotationCode: 1 }, { unique: true });
QuotationSchema.index({ "client.phone": 1 });
QuotationSchema.index({ "client.email": 1 });
QuotationSchema.index({ status: 1, createdAt: -1 });

// Auto-derive days & destination string
QuotationSchema.pre("save", function () {
  if (this.tripDetails?.nights && !this.tripDetails?.days) {
    this.tripDetails.days = this.tripDetails.nights + 1;
  }
  if (this.tripDetails?.destinations?.length > 0) {
    this.tripDetails.destination = this.tripDetails.destinations
      .map((d) => d.cityName)
      .filter(Boolean)
      .join(" → ");
  }
});

if (process.env.NODE_ENV !== "production") {
  delete mongoose.models.Quotation;
}

export default mongoose.models.Quotation ||
  mongoose.model("Quotation", QuotationSchema);
