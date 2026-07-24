import { connectDB } from "@/lib/db";
import User from "@/models/User";

/**
 * GET /api/setup?secret=YOUR_SETUP_SECRET
 *
 * One-time superuser setup endpoint for hosting environments
 * without terminal access (e.g. Hostinger).
 *
 * How it works:
 *  1. You set SETUP_SECRET in your .env.local (or Hostinger env vars)
 *  2. Visit: https://yourdomain.com/api/setup?secret=YOUR_SETUP_SECRET
 *  3. The first superuser is created automatically
 *  4. The endpoint stops working once a superuser exists
 *
 * Security:
 *  - Protected by a secret key (only you know it)
 *  - Auto-disables after the first superuser is created
 *  - Never creates more than the 2-superuser limit
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get("secret");

    // ── Check setup secret ──────────────────────────────────────────────
    const SETUP_SECRET = process.env.SETUP_SECRET;

    if (!SETUP_SECRET) {
      return Response.json(
        {
          error: "SETUP_SECRET is not configured.",
          help: "Add SETUP_SECRET=your-secret-key to your environment variables.",
        },
        { status: 500 }
      );
    }

    if (!secret || secret !== SETUP_SECRET) {
      return Response.json({ error: "Invalid or missing secret." }, { status: 403 });
    }

    // ── Connect to DB ───────────────────────────────────────────────────
    await connectDB();

    // ── Check if superuser already exists ────────────────────────────────
    const existingCount = await User.countDocuments({ role: "superuser" });
    if (existingCount >= 2) {
      return Response.json(
        {
          message: "Setup already complete. Maximum superusers already exist.",
          superuserCount: existingCount,
        },
        { status: 200 }
      );
    }

    // ── Read credentials from env or use defaults ───────────────────────
    const name = process.env.SUPERUSER_NAME || "Super Admin";
    const email = process.env.SUPERUSER_EMAIL || "admin@mandeholidays.com";
    const password = process.env.SUPERUSER_PASSWORD || "Admin@123";

    // Check if this email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      if (existingUser.role === "superuser") {
        return Response.json(
          {
            message: `Superuser already exists with email: ${email}`,
            superuserCount: existingCount,
          },
          { status: 200 }
        );
      }
      // Upgrade existing user to superuser
      existingUser.role = "superuser";
      existingUser.isActive = true;
      await existingUser.save();
      return Response.json(
        {
          message: `Upgraded existing user "${existingUser.name}" to superuser.`,
          email: existingUser.email,
          superuserCount: existingCount + 1,
        },
        { status: 200 }
      );
    }

    // ── Create the superuser ────────────────────────────────────────────
    const user = await User.create({
      name,
      email,
      password, // will be hashed by pre-save hook
      role: "superuser",
      isActive: true,
    });

    return Response.json(
      {
        message: "✅ Superuser created successfully!",
        user: {
          name: user.name,
          email: user.email,
          role: user.role,
        },
        superuserCount: existingCount + 1,
        warning: "Change the default password immediately after first login!",
        defaultPassword: password,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[GET /api/setup]", err);
    return Response.json(
      { error: "Setup failed: " + err.message },
      { status: 500 }
    );
  }
}
