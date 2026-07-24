/**
 * POST /api/auth/signup
 * Public signup is disabled.
 * Only superusers can create users via POST /api/users.
 */
export async function POST() {
  return Response.json(
    {
      error:
        "Public signup is disabled. Contact your system administrator to create an account.",
    },
    { status: 403 }
  );
}
