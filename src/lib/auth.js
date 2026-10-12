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
import { checkRateLimit, resetRateLimit } from "@/lib/rate-limit";

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
       *
       * Includes rate limiting against brute force password guessing.
       * Wrapped in a timeout to prevent hanging on shared hosting (Hostinger).
       */
      async authorize(credentials) {
        try {
          // 1. Validate incoming shape with Zod
          const parsed = loginSchema.safeParse(credentials);
          if (!parsed.success) return null;

          const { email, password } = parsed.data;
          const rateKey = `login:${email.toLowerCase()}`;

          // Check brute-force limit (max 5 attempts per 15 minutes)
          const rate = checkRateLimit(rateKey, { limit: 5, windowMs: 15 * 60 * 1000 });
          if (!rate.success) {
            console.warn(`[NextAuth authorize] Rate limit exceeded for ${email}`);
            throw new Error("Too many failed login attempts. Please try again after 15 minutes.");
          }

          // 2. Connect to DB (with timeout protection)
          const connectPromise = connectDB();
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("DB connection timeout")), 10000)
          );
          await Promise.race([connectPromise, timeoutPromise]);

          // 3. Find user — explicitly select password (hidden by default via select: false)
          const user = await User.findOne({ email }).select("+password");
          if (!user || !user.isActive) return null;

          // 4. Compare password using bcrypt instance method
          const isValid = await user.comparePassword(password);
          if (!isValid) return null;

          // Success: reset failed rate limit attempts
          resetRateLimit(rateKey);

          // 5. Return a plain serialisable object (not a Mongoose document)
          return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
          };
        } catch (err) {
          console.error("[NextAuth authorize]", err.message);
          return null;
        }
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

  // Trust the host header — required for Hostinger and reverse-proxy deployments
  // Without this, NextAuth may reject requests because it can't verify the host.
  trustHost: true,

  debug: process.env.NODE_ENV === "development",
};
