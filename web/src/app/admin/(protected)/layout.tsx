import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { isEmailAllowed } from "@/lib/admin-allowlist";

/**
 * Admin protected layout.
 * Redirects to login if not authenticated or not an allowed admin.
 */
export default async function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // If not authenticated, redirect to login
  if (!session?.user) {
    redirect("/admin/login");
  }

  // If authenticated but not an allowed admin, show access denied
  if (!isEmailAllowed(session.user.email)) {
    redirect("/admin/login?error=AccessDenied");
  }

  return <>{children}</>;
}
