import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { signupSchema } from "@/lib/validations";

/**
 * POST /api/auth/signup
 * Creates a new "member" account.
 * Only superusers can create admin/superuser accounts (via /api/users).
 */
export async function POST(request) {
  try {
    const body = await request.json();

    // 1. Validate all fields with the shared Zod schema (no role field)
    const parsed = signupSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        {
          error: "Validation failed.",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { name, email, password } = parsed.data;

    // 2. Connect to MongoDB
    await connectDB();

    // 3. Guard against duplicate email
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return Response.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    // 4. Create the user as "member" — password is hashed by the Mongoose pre-save hook
    const user = await User.create({ name, email, password, role: "member" });

    return Response.json(
      {
        message: "Account created successfully. You can now sign in.",
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[POST /api/auth/signup]", error);
    return Response.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}

