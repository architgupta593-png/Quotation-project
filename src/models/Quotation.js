import mongoose from "mongoose";

const QuotationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [120, "Title cannot exceed 120 characters"],
    },
    clientName: {
      type: String,
      required: [true, "Client name is required"],
      trim: true,
      maxlength: [80, "Client name cannot exceed 80 characters"],
    },
    clientEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },
    clientPhone: {
      type: String,
      trim: true,
      default: "",
    },
    destination: {
      type: String,
      required: [true, "Destination is required"],
      trim: true,
    },
    startDate: {
      type: Date,
      required: [true, "Start date is required"],
    },
    endDate: {
      type: Date,
      required: [true, "End date is required"],
    },
    numberOfPeople: {
      type: Number,
      min: [1, "Must have at least 1 person"],
      default: 1,
    },
    totalBudget: {
      type: Number,
      min: [0, "Budget cannot be negative"],
      default: 0,
    },
    status: {
      type: String,
      enum: ["draft", "confirmed", "cancelled"],
      default: "draft",
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Quotation ||
  mongoose.model("Quotation", QuotationSchema);
