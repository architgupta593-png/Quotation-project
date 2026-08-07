import mongoose from "mongoose";

// ── Sub-schemas ───────────────────────────────────────────────────────────────

const ImageSchema = new mongoose.Schema(
  {
    url:       { type: String, required: true },
    publicId:  { type: String, required: true },
    caption:   { type: String, default: "" },
  },
  { _id: false }
);

// ── Main Activity Schema ──────────────────────────────────────────────────────

const ActivitySchema = new mongoose.Schema(
  {
    name: {
      type:      String,
      required:  [true, "Activity name is required"],
      trim:      true,
      maxlength: [150, "Activity name cannot exceed 150 characters"],
    },
    description: {
      type:  String,
      trim:  true,
      default: "",
    },
    category: {
      type:    String,
      enum:    ["sightseeing", "adventure", "cultural", "leisure"],
      default: "sightseeing",
    },
    duration: {
      type:    String,
      trim:    true,
      default: "",   // e.g. "2-3 hours", "Half Day", "Full Day"
    },
    price: {
      type:    Number,
      min:     0,
      default: 0,
    },
    // City this activity belongs to (required)
    city: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "City",
      required: [true, "City is required"],
    },
    // Optional hotel association (e.g. hotel-specific experience)
    hotel: {
      type:    mongoose.Schema.Types.ObjectId,
      ref:     "Hotel",
      default: null,
    },
    // Mark as a highlight to surface in package highlights
    isHighlight: {
      type:    Boolean,
      default: false,
    },
    images: {
      type:    [ImageSchema],
      default: [],
    },
    // ── 🛒 Standalone Sale Configuration ──
    isStandaloneSaleable: {
      type:    Boolean,
      default: true,
    },
    pricingTiers: {
      adultPrice: { type: Number, min: 0, default: 0 },
      childPrice: { type: Number, min: 0, default: 0 },
    },
    availableSlots: [
      {
        time:     { type: String, trim: true }, // e.g. "09:00 AM", "02:00 PM"
        capacity: { type: Number, default: 20 },
      },
    ],
    inclusions:   [{ type: String, trim: true }],
    instructions: [{ type: String, trim: true }],
    status: {
      type:    String,
      enum:    ["active", "inactive"],
      default: "active",
    },
    createdBy: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "User",
      required: true,
    },
  },
  { timestamps: true }
);

if (process.env.NODE_ENV !== "production") {
  delete mongoose.models.Activity;
}

// ── Indexes ───────────────────────────────────────────────────────────────────
ActivitySchema.index({ city: 1, name: 1 });
ActivitySchema.index({ category: 1 });

export default mongoose.models.Activity ||
  mongoose.model("Activity", ActivitySchema);
