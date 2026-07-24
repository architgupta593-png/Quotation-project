#!/usr/bin/env node

/**
 * Seed Superuser Script
 * ─────────────────────
 * Creates the first superuser account directly in MongoDB.
 * Run this once to bootstrap the system.
 *
 * Usage:
 *   node scripts/seed-superuser.mjs
 *
 * Environment variables (reads from .env.local automatically):
 *   MONGODB_URI        — MongoDB connection string
 *   SUPERUSER_NAME     — (optional) defaults to prompt / "Super Admin"
 *   SUPERUSER_EMAIL    — (optional) defaults to prompt / "admin@mandeholidays.com"
 *   SUPERUSER_PASSWORD — (optional) defaults to prompt / "Admin@123"
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

// ── Load .env.local manually (no dotenv dependency) ───────────────────────────
function loadEnv() {
  try {
    const envPath = resolve(process.cwd(), ".env.local");
    const content = readFileSync(envPath, "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIndex = trimmed.indexOf("=");
      if (eqIndex === -1) continue;
      const key = trimmed.slice(0, eqIndex).trim();
      const value = trimmed.slice(eqIndex + 1).trim();
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  } catch {
    // .env.local might not exist; that's fine if env vars are set externally
  }
}

loadEnv();

// ── Configuration ─────────────────────────────────────────────────────────────
const MONGODB_URI = process.env.MONGODB_URI;
const MAX_SUPERUSERS = 2;

const name = process.env.SUPERUSER_NAME || "Super Admin";
const email = process.env.SUPERUSER_EMAIL || "admin@mandeholidays.com";
const password = process.env.SUPERUSER_PASSWORD || "Admin@123";

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI is not set. Check your .env.local file.");
  process.exit(1);
}

// ── Inline User Schema (avoids Next.js module resolution issues) ──────────────
const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ["superuser", "admin", "member"], default: "member" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

async function main() {
  console.log("\n🔑 Superuser Seeder");
  console.log("───────────────────\n");

  try {
    await mongoose.connect(MONGODB_URI, { bufferCommands: false });
    console.log("✅ Connected to MongoDB\n");

    const User = mongoose.models.User || mongoose.model("User", UserSchema);

    // Check superuser limit
    const existingCount = await User.countDocuments({ role: "superuser" });
    if (existingCount >= MAX_SUPERUSERS) {
      console.log(`⚠️  Already ${existingCount} superuser(s) exist (max: ${MAX_SUPERUSERS}).`);
      console.log("   Cannot create another. Delete or demote an existing superuser first.\n");
      process.exit(0);
    }

    // Check for duplicate email
    const existing = await User.findOne({ email });
    if (existing) {
      if (existing.role === "superuser") {
        console.log(`ℹ️  Superuser already exists with email: ${email}`);
        process.exit(0);
      }
      // Upgrade existing user to superuser
      existing.role = "superuser";
      existing.isActive = true;
      await existing.save();
      console.log(`✅ Upgraded existing user "${existing.name}" (${email}) to superuser.`);
      process.exit(0);
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create superuser
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "superuser",
      isActive: true,
    });

    console.log("✅ Superuser created successfully!\n");
    console.log(`   Name:     ${user.name}`);
    console.log(`   Email:    ${user.email}`);
    console.log(`   Role:     ${user.role}`);
    console.log(`   ID:       ${user._id}\n`);
    console.log(`   ⚠️  Default password: ${password}`);
    console.log("   Please change this immediately after first login.\n");
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB\n");
  }
}

main();
