import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { createUserSchema } from "@/lib/validations";
import { requireRole, requireSuperuser } from "@/lib/authorize";

/**
 * GET /api/users — List all users.
 * Accessible by: superuser (full), admin (read-only view).
 */
export async function GET(request) {
  try {
    const auth = await requireRole(["superuser", "admin"]);
    if (!auth.ok) return auth.response;

    await connectDB();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const role = searchParams.get("role") || "";

    const filter = {};
    if (role) filter.role = role;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    const users = await User.find(filter)
      .select("-password")
      .sort({ createdAt: -1 })
      .lean();

    // Include superuser count for UI display
    const superuserCount = await User.countDocuments({ role: "superuser" });

    return NextResponse.json({ users, superuserCount });
  } catch (err) {
    console.error("[GET /api/users]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/**
 * POST /api/users — Create a new user with any role.
 * Accessible by: superuser only.
 */
export async function POST(request) {
  try {
    const auth = await requireSuperuser();
    if (!auth.ok) return auth.response;

    const body = await request.json();

    // Validate with the createUserSchema (includes role and optional phone)
    const parsed = createUserSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed.",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { name, email, password, role, phone } = parsed.data;

    await connectDB();

    // Check for duplicate email
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    // Create user — the pre-validate hook will enforce the superuser limit
    const user = await User.create({
      name,
      email,
      password,
      role,
      phone: phone || "",
      isPhoneVerified: false,
    });

    return NextResponse.json(
      {
        message: "User created successfully.",
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          phone: user.phone,
          isPhoneVerified: user.isPhoneVerified,
          role: user.role,
          isActive: user.isActive,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[POST /api/users]", err);
    // Surface the max-superuser error message
    if (err.message?.includes("superuser")) {
      return NextResponse.json({ error: err.message }, { status: 422 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
