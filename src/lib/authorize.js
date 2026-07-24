import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * Centralised authorisation helpers for API route handlers.
 *
 * Usage:
 *   const auth = await requireRole(["superuser", "admin"]);
 *   if (!auth.ok) return auth.response;
 *   // auth.session is guaranteed
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
 * Require any authenticated user.
 * @returns {{ ok: boolean, session: object|null, response?: Response }}
 */
export async function requireAuth() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return { ok: false, session: null, response: unauthorized() };
  }
  return { ok: true, session };
}

/**
 * Require one of the given roles.
 * @param {string[]} roles - e.g. ["superuser", "admin"]
 * @returns {{ ok: boolean, session: object|null, response?: Response }}
 */
export async function requireRole(roles) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return { ok: false, session: null, response: unauthorized() };
  }
  if (!roles.includes(session.user.role)) {
    return { ok: false, session, response: forbidden() };
  }
  return { ok: true, session };
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
