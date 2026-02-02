/**
 * Admin email allowlist utilities.
 *
 * This module is separated from auth.ts to allow unit testing without
 * triggering NextAuth initialization.
 */

/**
 * Check if an email is in the admin allowlist.
 * Currently only allows a single email from ADMIN_ALLOWED_EMAIL env var.
 *
 * @param email - The email to check
 * @param allowedEmail - The allowed email (defaults to process.env.ADMIN_ALLOWED_EMAIL)
 * @returns true if the email is allowed, false otherwise
 */
export function isEmailAllowed(
  email: string | null | undefined,
  allowedEmail: string | undefined = process.env.ADMIN_ALLOWED_EMAIL
): boolean {
  if (!email) {
    return false;
  }

  if (!allowedEmail) {
    console.warn("ADMIN_ALLOWED_EMAIL env var is not set");
    return false;
  }

  return email.toLowerCase() === allowedEmail.toLowerCase();
}
