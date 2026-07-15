import mongoose from "mongoose";

// ── Sub-schemas ───────────────────────────────────────────────────────────────

const DaySchema = new mongoose.Schema(
  {
    day:         { type: Number, required: true, min: 1 },
    title:       { type: String, required: true, trim: true, maxlength: 150 },
    description: { type: String, trim: true, default: "" },
    activities:  [{ type: String, trim: true }],
    meals: {
      breakfast: { type: Boolean, default: false },
      lunch:     { type: Boolean, default: false },
      dinner:    { type: Boolean, default: false },
    },
  },
  { _id: false }
);

/**
 * Vehicle for this itinerary.
 * One itinerary can have multiple vehicle options (each is a row in the pricing table).
 */
const VehicleSchema = new mongoose.Schema(
  {
    vehicleType: {
      type: String,
      enum: ["Sedan", "SUV", "MUV", "Tempo Traveller", "Mini Bus", "Bus", "Other"],
      default: "SUV",
    },
    model:        { type: String, trim: true, default: "" },
    acType:       { type: String, enum: ["AC", "Non-AC"], default: "AC" },
    /** Number of passenger seats for this vehicle option */
    seats:        { type: Number, min: 1, default: 4 },
    /** Price for this vehicle for the full itinerary duration */
    vehiclePrice: { type: Number, min: 0, default: 0 },
    notes:        { type: String, trim: true, default: "" },
  },
  { _id: false }
);

// ── Main Itinerary Schema ─────────────────────────────────────────────────────

const ItinerarySchema = new mongoose.Schema(
  {
    /** Human-readable short code, e.g. "GOA-5D-001" */
    code: {
      type:      String,
      required:  [true, "Itinerary code is required"],
      trim:      true,
      uppercase: true,
      maxlength: [30, "Code cannot exceed 30 characters"],
    },
    title: {
      type:      String,
      required:  [true, "Title is required"],
      trim:      true,
      maxlength: [150, "Title cannot exceed 150 characters"],
    },
    city: {
      type:     String,
      required: [true, "City/destination is required"],
      trim:     true,
      maxlength: [100, "City cannot exceed 100 characters"],
    },
    region: { type: String, trim: true, default: "" },
    days:   {
      type: Number,
      required: [true, "Number of days is required"],
      min: [1, "Minimum 1 day"],
      max: [61, "Maximum 61 days"],
    },
    nights: { type: Number, default: 0, min: 0 },

    highlights: [{ type: String, trim: true }],
    includes:   [{ type: String, trim: true }],
    excludes:   [{ type: String, trim: true }],

    dayByDay:  { type: [DaySchema],   default: [] },
    vehicles:  { type: [VehicleSchema], default: [] },

    // ── Pricing ────────────────────────────────────────────────────────────
    /** Number of persons this pricing is calculated for */
    noOfPersons:       { type: Number, min: 1, default: 1 },
    /** Itinerary cost per person (land package, excl. vehicle) */
    itineraryPerPerson: { type: Number, min: 0, default: 0 },
    /** Total itinerary cost = itineraryPerPerson × noOfPersons */
    itineraryTotal:    { type: Number, min: 0, default: 0 },
    /** Selected/total vehicle price */
    vehicleTotal:      { type: Number, min: 0, default: 0 },
    /** Grand total = itineraryTotal + vehicleTotal */
    grandTotal:        { type: Number, min: 0, default: 0 },
    currency:          { type: String, default: "INR", maxlength: 5 },

    status: {
      type:    String,
      enum:    ["draft", "active", "archived"],
      default: "draft",
    },
    createdBy: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "User",
      required: true,
    },
  },
  { timestamps: true }
);

ItinerarySchema.pre("save", function (next) {
  if (this.isModified("days") && this.nights === 0) {
    this.nights = Math.max(0, this.days - 1);
  }
  next();
});

ItinerarySchema.index({ city: 1 });
ItinerarySchema.index({ code: 1 }, { unique: true });
ItinerarySchema.index({ itineraryPerPerson: 1 });
ItinerarySchema.index({ createdAt: -1 });

if (mongoose.models.Itinerary) delete mongoose.models.Itinerary;
export default mongoose.model("Itinerary", ItinerarySchema);
