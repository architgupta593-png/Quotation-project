import CredentialsProvider from "next-auth/providers/credentials";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { loginSchema } from "@/lib/validations";

/**
 * Centralised NextAuth configuration object.
 * Import this wherever you need getServerSession(authOptions).
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const authOptions = {
  // ── Providers ──────────────────────────────────────────────────────────────
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },

      /**
       * Verify user credentials against the MongoDB User collection.
       * Return a user object on success, or null on failure.
       */
      async authorize(credentials) {
        // 1. Validate incoming shape with Zod
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        // 2. Connect to DB
        await connectDB();

        // 3. Find user — explicitly select password (hidden by default via select: false)
        const user = await User.findOne({ email }).select("+password");
        if (!user || !user.isActive) return null;

        // 4. Compare password using bcrypt instance method
        const isValid = await user.comparePassword(password);
        if (!isValid) return null;

        // 5. Return a plain serialisable object (not a Mongoose document)
        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],

  // ── Session ────────────────────────────────────────────────────────────────
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },

  // ── Callbacks ──────────────────────────────────────────────────────────────
  callbacks: {
    /**
     * Persist id and role on the JWT so they are available on every request.
     */
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },

    /**
     * Expose id and role in the client-side session object.
     */
    async session({ session, token }) {
      if (token?.id) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
  },

  // ── Pages ──────────────────────────────────────────────────────────────────
  pages: {
    signIn: "/login",
    error: "/login", // Auth errors redirect back to login with ?error=...
  },

  // ── Security ───────────────────────────────────────────────────────────────
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};
