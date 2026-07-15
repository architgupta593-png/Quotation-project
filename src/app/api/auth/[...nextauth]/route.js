import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * Next.js App Router Route Handler for NextAuth v4.
 * Explicitly wraps GET and POST to be compatible with Next.js 16.
 */
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
