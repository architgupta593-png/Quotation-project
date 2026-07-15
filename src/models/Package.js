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
      required: true,
      trim: true,
      maxlength: 120,
    },
    description: { type: String, trim: true, default: "" },
    activities: [{ type: String, trim: true }],
    meals: {
      breakfast: { type: Boolean, default: false },
      lunch: { type: Boolean, default: false },
      dinner: { type: Boolean, default: false },
    },
    images: [ImageSchema],
  },
  { _id: false }
);

const AccommodationSchema = new mongoose.Schema(
  {
    night: { type: Number, required: true, min: 1 },
    hotelName: { type: String, trim: true, default: "" },
    location: { type: String, trim: true, default: "" },
    roomType: { type: String, trim: true, default: "" },
    mealPlan: {
      type: String,
      enum: ["EP", "CP", "MAP", "AP", ""],
      default: "",
    },
    starRating: { type: Number, min: 1, max: 5, default: null },
    notes: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

const VehicleSchema = new mongoose.Schema(
  {
    vehicleType: {
      type: String,
      enum: ["Sedan", "SUV", "MUV", "Tempo Traveller", "Mini Bus", "Bus", "Other"],
      default: "SUV",
    },
    model: { type: String, trim: true, default: "" },
    seats: { type: Number, min: 1, default: 4 },
    acType: { type: String, enum: ["AC", "Non-AC"], default: "AC" },
    notes: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

const PricingSchema = new mongoose.Schema(
  {
    pricePerPerson: { type: Number, min: 0, default: 0 },
    totalPrice: { type: Number, min: 0, default: 0 },
    currency: { type: String, default: "INR", maxlength: 5 },
    includes: [{ type: String, trim: true }],
    excludes: [{ type: String, trim: true }],
  },
  { _id: false }
);

// ── Main Package Schema ───────────────────────────────────────────────────────

const PackageSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Package title is required"],
      trim: true,
      maxlength: [150, "Title cannot exceed 150 characters"],
    },
    destination: {
      type: String,
      required: [true, "Destination is required"],
      trim: true,
      maxlength: [100, "Destination cannot exceed 100 characters"],
    },
    nights: {
      type: Number,
      required: [true, "Number of nights is required"],
      min: [1, "Minimum 1 night"],
      max: [60, "Maximum 60 nights"],
    },
    days: {
      type: Number,
      required: [true, "Number of days is required"],
      min: [1, "Minimum 1 day"],
      max: [61, "Maximum 61 days"],
    },
    coverImage: {
      type: ImageSchema,
      default: null,
    },
    highlights: [{ type: String, trim: true }],
    itinerary: [ItineraryDaySchema],
    accommodations: [AccommodationSchema],
    vehicle: {
      type: VehicleSchema,
      default: () => ({}),
    },
    pricing: {
      type: PricingSchema,
      default: () => ({}),
    },
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// ── Auto-derive days from nights ──────────────────────────────────────────────
PackageSchema.pre("save", function (next) {
  if (this.isModified("nights")) {
    this.days = this.nights + 1;
  }
  next();
});

export default mongoose.models.Package ||
  mongoose.model("Package", PackageSchema);
