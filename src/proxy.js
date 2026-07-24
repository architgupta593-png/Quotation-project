import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

/**
 * Proxy (formerly Middleware) — Next.js 16 file convention.
 * Runs at the network edge before a request reaches the route handler or page.
 *
 * Authentication & authorisation strategy:
 *  - Reads the NextAuth JWT via next-auth/jwt (no withAuth wrapper needed).
 *  - Unauthenticated requests to protected paths → redirect to /login.
 *  - Role-based checks:
 *    • /dashboard/users/* → superuser & admin only
 *    • /dashboard/accommodation/*, /dashboard/packages/new → superuser & admin only
 *    • /dashboard/* → any authenticated user
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
  if (!token) {
    // Redirect unauthenticated users to /login, preserving the intended URL
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const role = token.role;

  // ── Role-based route protection ─────────────────────────────────────────
  // /dashboard/users → superuser & admin can view, but write is API-level
  if (pathname.startsWith("/dashboard/users")) {
    if (!["superuser", "admin"].includes(role)) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // /dashboard/accommodation → superuser & admin only
  if (pathname.startsWith("/dashboard/accommodation")) {
    if (!["superuser", "admin"].includes(role)) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // /dashboard/packages/new → superuser & admin only (creating new packages)
  if (pathname.startsWith("/dashboard/packages/new")) {
    if (!["superuser", "admin"].includes(role)) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // /admin/* → superuser only
  if (pathname.startsWith("/admin")) {
    if (role !== "superuser") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
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
