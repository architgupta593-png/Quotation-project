import mongoose from "mongoose";
import bcrypt from "bcryptjs";

/** Maximum number of superuser accounts allowed in the system. */
const MAX_SUPERUSERS = 2;

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [50, "Name cannot exceed 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false, // Never return password in queries unless explicitly requested
    },
    role: {
      type: String,
      enum: ["superuser", "admin", "member"],
      default: "member",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt
  }
);

// ── Enforce max superuser limit ───────────────────────────────────────────────
UserSchema.pre("validate", async function () {
  if (this.role !== "superuser") return;

  // When updating an existing user, skip if the role didn't change
  if (!this.isNew && !this.isModified("role")) return;

  const User = mongoose.model("User");
  const query = { role: "superuser" };

  // Exclude self from count when updating an existing document
  if (!this.isNew) {
    query._id = { $ne: this._id };
  }

  const count = await User.countDocuments(query);
  if (count >= MAX_SUPERUSERS) {
    throw new Error(
      `Cannot create more than ${MAX_SUPERUSERS} superuser accounts.`
    );
  }
});

// ── Hash password before saving ───────────────────────────────────────────────
UserSchema.pre("save", async function () {
  // Only hash if the password field was actually modified
  if (!this.isModified("password")) return;
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

// ── Instance method: compare plain-text password with stored hash ──────────────
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Prevent model re-registration during Next.js hot reloads
export default mongoose.models.User || mongoose.model("User", UserSchema);
