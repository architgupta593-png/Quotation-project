import mongoose from "mongoose";

const BookingSchema = new mongoose.Schema(
  {
    bookingType: {
      type:     String,
      enum:     ["activity", "package"],
      default:  "activity",
      required: true,
    },

    // References
    activity: {
      type:    mongoose.Schema.Types.ObjectId,
      ref:     "Activity",
      default: null,
    },
    package: {
      type:    mongoose.Schema.Types.ObjectId,
      ref:     "Package",
      default: null,
    },
    city: {
      type:    mongoose.Schema.Types.ObjectId,
      ref:     "City",
      default: null,
    },

    // Customer details
    customer: {
      name:  { type: String, required: true, trim: true },
      email: { type: String, required: true, trim: true, lowercase: true },
      phone: { type: String, required: true, trim: true },
      notes: { type: String, trim: true, default: "" },
    },

    // Activity booking specific details
    activityDetails: {
      activityName: { type: String, trim: true, default: "" },
      travelDate:   { type: Date, required: true },
      timeSlot:     { type: String, trim: true, default: "Full Day" },
      adults:       { type: Number, min: 1, default: 1 },
      children:     { type: Number, min: 0, default: 0 },
      adultPrice:   { type: Number, min: 0, default: 0 },
      childPrice:   { type: Number, min: 0, default: 0 },
    },

    // Pricing summary
    pricing: {
      subtotal:   { type: Number, min: 0, default: 0 },
      tax:        { type: Number, min: 0, default: 0 },
      grandTotal: { type: Number, min: 0, required: true },
      currency:   { type: String, default: "INR" },
    },

    // Unique voucher code / pass (e.g. ACT-849201)
    voucherCode: {
      type:      String,
      unique:    true,
      required:  true,
      uppercase: true,
      trim:      true,
    },

    paymentStatus: {
      type:    String,
      enum:    ["pending", "paid", "cancelled", "refunded"],
      default: "paid", // auto-confirm for demonstration
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref:  "User",
      default: null,
    },
  },
  { timestamps: true }
);

BookingSchema.index({ voucherCode: 1 });
BookingSchema.index({ "customer.email": 1 });
BookingSchema.index({ activity: 1, "activityDetails.travelDate": 1 });

if (process.env.NODE_ENV !== "production") {
  delete mongoose.models.Booking;
}

export default mongoose.models.Booking ||
  mongoose.model("Booking", BookingSchema);
