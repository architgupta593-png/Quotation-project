import { redirect } from "next/navigation";

/**
 * Signup is disabled — redirect to login.
 * Only superusers can create new users from the User Management panel.
 */
export default function SignupPage() {
  redirect("/login");
}
