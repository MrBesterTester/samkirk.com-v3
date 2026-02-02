import "server-only";

import { auth } from "@/lib/auth";
import { isEmailAllowed } from "@/lib/admin-allowlist";
import { NextResponse } from "next/server";

/**
 * Result of admin auth check.
 */
export type AdminAuthResult =
  | { authenticated: true; email: string }
  | { authenticated: false; error: NextResponse };

/**
 * Check if the current request is from an authenticated admin.
 *
 * Use this in API routes that need admin access:
 *
 * ```ts
 * export async function POST(request: NextRequest) {
 *   const authResult = await requireAdminAuth();
 *   if (!authResult.authenticated) {
 *     return authResult.error;
 *   }
 *   // authResult.email is the authenticated admin's email
 *   // ... handle the request
 * }
 * ```
 */
export async function requireAdminAuth(): Promise<AdminAuthResult> {
  const session = await auth();

  if (!session?.user) {
    return {
      authenticated: false,
      error: NextResponse.json(
        { error: "Unauthorized", message: "Authentication required" },
        { status: 401 }
      ),
    };
  }

  const email = session.user.email;

  if (!email || !isEmailAllowed(email)) {
    return {
      authenticated: false,
      error: NextResponse.json(
        { error: "Forbidden", message: "Admin access required" },
        { status: 403 }
      ),
    };
  }

  return {
    authenticated: true,
    email,
  };
}

/**
 * Get the current admin session if authenticated.
 * Returns null if not authenticated as admin.
 */
export async function getAdminSession(): Promise<{
  email: string;
} | null> {
  const session = await auth();

  if (!session?.user?.email) {
    return null;
  }

  if (!isEmailAllowed(session.user.email)) {
    return null;
  }

  return {
    email: session.user.email,
  };
}
