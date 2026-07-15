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

/**
 * Hotel-level activities (e.g. Room Decoration, Candlelight Dinner).
 * Moved from Room → Hotel so they apply across all room types.
 */
const ActivitySchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, required: true },
    price: { type: Number, min: 0, default: 0 },
  },
  { _id: false }
);

// ── Main Hotel Schema ─────────────────────────────────────────────────────────

const HotelSchema = new mongoose.Schema(
  {
    city: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "City",
      required: [true, "City is required"],
    },
    name: {
      type: String,
      required: [true, "Hotel name is required"],
      trim: true,
      maxlength: [150, "Hotel name cannot exceed 150 characters"],
    },
    type: {
      type: String,
      enum: ["hotel", "resort", "hostel", "guesthouse", "villa", "apartment", "other"],
      default: "hotel",
    },
    starRating: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },
    // Contact — contactNo is now REQUIRED
    contactNo: {
      type: String,
      trim: true,
      required: [true, "Contact number is required"],
    },
    email: {
      type: String,
      trim: true,
      default: "",
      match: [/^$|^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid email address"],
    },
    address: {
      type: String,
      trim: true,
      default: "",
    },
    // Hotel-wide features
    features: {
      type: [String],
      default: [],
    },
    // Hotel-wide activities (e.g. Room Decoration, Candlelight Dinner)
    activities: {
      type: [ActivitySchema],
      default: [],
    },
    // Images (optional)
    images: {
      type: [ImageSchema],
      default: [],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

HotelSchema.index({ city: 1, name: 1 });

export default mongoose.models.Hotel || mongoose.model("Hotel", HotelSchema);
