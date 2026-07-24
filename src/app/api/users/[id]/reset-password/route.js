import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import User from "@/models/User";

/**
 * PUT /api/users/[id]/reset-password
 * Resets a user's password. Accessible by: superuser only.
 *
 * Body: { newPassword: string }
 */
export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "superuser") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { newPassword } = await request.json();

    if (!newPassword || newPassword.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long." },
        { status: 400 }
      );
    }

    // Validate password strength
    if (!/[a-zA-Z]/.test(newPassword)) {
      return NextResponse.json(
        { error: "Password must contain at least one letter." },
        { status: 400 }
      );
    }
    if (!/[0-9]/.test(newPassword)) {
      return NextResponse.json(
        { error: "Password must contain at least one number." },
        { status: 400 }
      );
    }
    if (!/[^a-zA-Z0-9]/.test(newPassword)) {
      return NextResponse.json(
        { error: "Password must contain at least one special character." },
        { status: 400 }
      );
    }

    await connectDB();
    const { id } = await params;

    // Use findById + save so the pre-save hook hashes the password
    const user = await User.findById(id).select("+password");
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    user.password = newPassword; // will be hashed by pre-save hook
    await user.save();

    return NextResponse.json({
      message: `Password for "${user.name}" has been reset successfully.`,
    });
  } catch (err) {
    console.error("[PUT /api/users/[id]/reset-password]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
