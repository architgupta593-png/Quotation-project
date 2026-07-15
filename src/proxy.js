import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

/**
 * Proxy (formerly Middleware) — Next.js 16 file convention.
 * Runs at the network edge before a request reaches the route handler or page.
 *
 * Authentication strategy:
 *  - Reads the NextAuth JWT via next-auth/jwt (no withAuth wrapper needed).
 *  - Unauthenticated requests to protected paths → redirect to /login.
 *  - Authenticated requests → pass through.
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/proxy
 */
export async function proxy(request) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const { pathname } = request.nextUrl;

  // Allow the request if the user is authenticated
  if (token) {
    return NextResponse.next();
  }

  // Redirect unauthenticated users to /login, preserving the intended URL
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("callbackUrl", pathname);
  return NextResponse.redirect(loginUrl);
}

/**
 * Matcher: only run this proxy on private routes.
 * Public routes (/, /login, /register, /api/auth/*, static files) are never matched.
 * Add more paths here as the application grows.
 */
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/profile/:path*",
    "/settings/:path*",
    "/admin/:path*",
  ],
};
