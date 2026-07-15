import AuthSessionProvider from "@/components/providers/AuthSessionProvider";

/**
 * Dashboard route-group layout.
 * Wraps all /dashboard pages with the NextAuth SessionProvider
 * so client components can call useSession().
 */
export default function DashboardLayout({ children }) {
  return <AuthSessionProvider>{children}</AuthSessionProvider>;
}
