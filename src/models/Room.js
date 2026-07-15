import mongoose from "mongoose";

// ── Sub-schemas ───────────────────────────────────────────────────────────────

const ImageSchema = new mongoose.Schema(
  {
    url:      { type: String, required: true },
    publicId: { type: String, required: true },
    caption:  { type: String, default: "" },
  },
  { _id: false }
);

/**
 * Meal option embedded inside a seasonal price.
 * Price here = the ADDITIONAL per-person charge for that meal plan in this season.
 */
const MealOptionSchema = new mongoose.Schema(
  {
    plan:  { type: String, enum: ["EP", "CP", "MAP", "AP"], required: true },
    price: { type: Number, min: 0, default: 0 },
  },
  { _id: false }
);

/**
 * One date window within a season.
 * e.g. { startDate: 2026-05-12, endDate: 2026-08-15 }
 */
const DateRangeSchema = new mongoose.Schema(
  {
    startDate: { type: Date, required: true },
    endDate:   { type: Date, required: true },
  },
  { _id: false }
);

/**
 * One season = label + one or MORE date windows + available meal plans (with prices).
 * NOTE: pricePerNight has been REMOVED — room price is determined per meal plan.
 *
 * Example — Peak Season:
 *   {
 *     label: "Peak",
 *     dateRanges: [
 *       { startDate: 2026-05-12, endDate: 2026-08-15 },
 *       { startDate: 2026-10-12, endDate: 2027-01-15 },
 *     ],
 *     meals: [
 *       { plan: "EP",  price: 3000 },   // Room only
 *       { plan: "CP",  price: 3500 },   // Bed & Breakfast
 *       { plan: "MAP", price: 4200 },   // Breakfast + Dinner
 *       { plan: "AP",  price: 5000 },   // All Meals
 *     ]
 *   }
 */
const SeasonalPriceSchema = new mongoose.Schema(
  {
    label:      { type: String, trim: true, default: "" },
    dateRanges: { type: [DateRangeSchema], default: [] },
    meals:      { type: [MealOptionSchema], default: [] },
  },
  { _id: false }
);

// ── Main Room Schema ──────────────────────────────────────────────────────────

const RoomSchema = new mongoose.Schema(
  {
    hotel: {
      type: mongoose.Schema.Types.ObjectId,
      ref:  "Hotel",
      required: [true, "Hotel reference is required"],
    },
    roomType: {
      type:      String,
      required:  [true, "Room type is required"],
      trim:      true,
      maxlength: [100, "Room type cannot exceed 100 characters"],
    },
    maxOccupancy:    { type: Number, min: [1, "Minimum 1"], default: 2 },
    features:        { type: [String],              default: [] },
    seasonalPricing: { type: [SeasonalPriceSchema], default: [] },
    images:          { type: [ImageSchema],         default: [] },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref:  "User",
      required: true,
    },
  },
  { timestamps: true }
);

RoomSchema.index({ hotel: 1 });

// Force schema refresh so dev-server hot-reload picks up changes immediately
if (mongoose.models.Room) delete mongoose.models.Room;
export default mongoose.model("Room", RoomSchema);
