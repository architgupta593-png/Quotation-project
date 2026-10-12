import AuthSessionProvider from "@/components/providers/AuthSessionProvider";

/**
 * Auth route-group layout.
 * Wraps /login, /signup, etc. with AuthSessionProvider so client components
 * can safely access NextAuth session context.
 */
export default function AuthLayout({ children }) {
  return <AuthSessionProvider>{children}</AuthSessionProvider>;
}
