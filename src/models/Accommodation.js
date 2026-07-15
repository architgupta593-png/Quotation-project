import mongoose from "mongoose";

const AccommodationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Accommodation name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    location: {
      type: String,
      required: [true, "Location is required"],
      trim: true,
    },
    type: {
      type: String,
      enum: ["hotel", "resort", "hostel", "guesthouse", "villa", "apartment"],
      required: [true, "Type is required"],
    },
    pricePerNight: {
      type: Number,
      required: [true, "Price per night is required"],
      min: [0, "Price cannot be negative"],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },
    amenities: {
      type: [String],
      default: [],
    },
    checkIn: {
      type: Date,
      default: null,
    },
    checkOut: {
      type: Date,
      default: null,
    },
    numberOfRooms: {
      type: Number,
      min: [1, "Must book at least 1 room"],
      default: 1,
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
    quotation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quotation",
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Accommodation ||
  mongoose.model("Accommodation", AccommodationSchema);
