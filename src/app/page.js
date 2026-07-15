import { redirect } from "next/navigation";

/**
 * Root page — redirects visitors straight to the login screen.
 * All authenticated redirects (to /dashboard, etc.) are handled
 * by the NextAuth session after login.
 */
export default function Home() {
  redirect("/login");
}
