/**
 * Auth route-group layout.
 * Wraps /login and /signup in a clean full-screen shell
 * without the default app navigation.
 */
export default function AuthLayout({ children }) {
  return <>{children}</>;
}
