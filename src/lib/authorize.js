import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import User from "@/models/User";

/**
 * Centralised authorisation helpers for API route handlers.
 *
 * Usage:
 *   const auth = await requireRole(["superuser", "admin"]);
 *   if (!auth.ok) return auth.response;
 *   // auth.session is guaranteed and user is active in DB
 */

// ── Helpers ───────────────────────────────────────────────────────────────────

function forbidden(message = "Forbidden") {
  return Response.json({ error: message }, { status: 403 });
}

function unauthorized(message = "Unauthorized") {
  return Response.json({ error: message }, { status: 401 });
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Require any authenticated user, verifying active status against MongoDB.
 * @param {object} options
 * @param {boolean} options.verifyActive - whether to verify user.isActive in DB (default: true)
 * @returns {{ ok: boolean, session: object|null, response?: Response }}
 */
export async function requireAuth(options = { verifyActive: true }) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
    return { ok: false, session: null, response: unauthorized() };
  }

  if (options.verifyActive) {
    try {
      await connectDB();
      const user = await User.findById(session.user.id).select("isActive role").lean();
      if (!user || !user.isActive) {
        return {
          ok: false,
          session: null,
          response: forbidden("Account is deactivated or suspended. Please contact administrator."),
        };
      }
      // Sync latest role in case it was modified
      session.user.role = user.role;
    } catch (err) {
      console.error("[requireAuth] DB check failed:", err);
    }
  }

  return { ok: true, session };
}

/**
 * Require one of the given roles.
 * @param {string[]} roles - e.g. ["superuser", "admin"]
 * @param {object} options
 * @returns {{ ok: boolean, session: object|null, response?: Response }}
 */
export async function requireRole(roles, options = { verifyActive: true }) {
  const auth = await requireAuth(options);
  if (!auth.ok) return auth;

  if (!roles.includes(auth.session.user.role)) {
    return { ok: false, session: auth.session, response: forbidden() };
  }
  return { ok: true, session: auth.session };
}

/**
 * Shorthand: require superuser role.
 */
export async function requireSuperuser() {
  return requireRole(["superuser"]);
}

/**
 * Boolean check — is the session user a superuser or admin?
 * @param {object} session
 * @returns {boolean}
 */
export function isSuperuserOrAdmin(session) {
  return ["superuser", "admin"].includes(session?.user?.role);
}

