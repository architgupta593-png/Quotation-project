"use client";

import { SessionProvider } from "next-auth/react";

/**
 * Client-side session provider wrapper.
 * Import this in server layouts that need client components using useSession().
 */
export default function AuthSessionProvider({ children }) {
  return <SessionProvider>{children}</SessionProvider>;
}
