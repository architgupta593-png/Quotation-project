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

// ── Destination (one per city in the package) ─────────────────────────────────
const DestinationSchema = new mongoose.Schema(
  {
    cityId: { type: mongoose.Schema.Types.ObjectId, ref: "City", default: null },
    cityName: { type: String, trim: true, default: "" },
    state: { type: String, trim: true, default: "" },
    nights: { type: Number, min: 1, default: 1 },
  },
  { _id: false }
);

// ── Single night entry inside an accommodation option ─────────────────────────
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

// ── One accommodation option (e.g. Premium, Standard, Budget) ─────────────────
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

const PricingSchema = new mongoose.Schema(
  {
    selectedOptionIndex: { type: Number, default: 0 },
    accommodationTotal: { type: Number, min: 0, default: 0 },
    vehicleTotal: { type: Number, min: 0, default: 0 },
    activitiesTotal: { type: Number, min: 0, default: 0 },
    subtotal: { type: Number, min: 0, default: 0 },
    marginType: { type: String, enum: ["absolute", "percentage"], default: "absolute" },
    margin: { type: Number, default: 0 },
    includeGst: { type: Boolean, default: false },
    gstPercentage: { type: Number, default: 5 },
    rateBasis: { type: String, enum: ["per_couple", "per_person"], default: "per_couple" },
    finalPrice: { type: Number, min: 0, default: 0 },
    perPersonPrice: { type: Number, min: 0, default: 0 },
    perCouplePrice: { type: Number, min: 0, default: 0 },
    numberOfPersons: { type: Number, min: 1, default: 2 },
    maxPersonsPerRoom: { type: Number, min: 1, max: 6, default: 2 },
    currency: { type: String, default: "INR", maxlength: 5 },
    includes: [{ type: String, trim: true }],
    excludes: [{ type: String, trim: true }],
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

// ── Activity selected for the package (per city) ─────────────────────────────
const PackageActivitySchema = new mongoose.Schema(
  {
    cityId:     { type: mongoose.Schema.Types.ObjectId, ref: "City",     default: null },
    cityName:   { type: String, trim: true, default: "" },
    activityId: { type: mongoose.Schema.Types.ObjectId, ref: "Activity", default: null },
    name:       { type: String, trim: true, default: "" },
    price:      { type: Number, min: 0,     default: 0  },
    category:   {
      type:    String,
      enum:    ["sightseeing", "adventure", "cultural", "leisure", ""],
      default: "",
    },
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
    // Multi-destination support
    destinations: {
      type: [DestinationSchema],
      default: [],
    },
    // Legacy single destination (kept for backward compat)
    destination: { type: String, trim: true, default: "" },
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
    // Multi-option accommodation (Premium, Standard, Budget etc.)
    accommodationOptions: {
      type: [AccommodationOptionSchema],
      default: [],
    },
    vehicle: {
      type: VehicleSchema,
      default: () => ({}),
    },
    pricing: {
      type: PricingSchema,
      default: () => ({}),
    },
    instructions: {
      type: [InstructionBlockSchema],
      default: [],
    },
    // Activities selected for this package (per city)
    activities: {
      type:    [PackageActivitySchema],
      default: [],
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
PackageSchema.pre("save", function () {
  if (!this.days && this.nights) {
    this.days = this.nights;
  }
  // Auto-compute destination string from destinations array
  if (this.isModified("destinations") && this.destinations.length > 0) {
    this.destination = this.destinations.map((d) => d.cityName).filter(Boolean).join(" → ");
  }
});

if (process.env.NODE_ENV !== "production") {
  delete mongoose.models.Package;
}

export default mongoose.models.Package ||
  mongoose.model("Package", PackageSchema);
