import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * Next.js App Router Route Handler for NextAuth v4.
 * Explicitly wraps GET and POST to be compatible with Next.js 16.
 */
const handler = NextAuth(authOptions);

export async function GET(req, context) {
  return handler(req, context);
}

export async function POST(req, context) {
  return handler(req, context);
}
