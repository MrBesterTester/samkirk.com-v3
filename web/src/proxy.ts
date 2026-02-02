import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

/**
 * Proxy to protect admin routes.
 * (Renamed from middleware.ts for Next.js 16 compatibility)
 *
 * - /admin/login is always accessible (login page)
 * - /admin/** requires authenticated session with allowed email
 * - /api/auth/** is always accessible (auth handlers)
 * - /api/admin/** requires authenticated session with allowed email
 */
export const proxy = auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth?.user;

  // Always allow login page and auth API routes
  if (pathname === "/admin/login" || pathname.startsWith("/api/auth/")) {
    return NextResponse.next();
  }

  // Protect admin pages (except login)
  if (pathname.startsWith("/admin")) {
    if (!isLoggedIn) {
      const loginUrl = new URL("/admin/login", req.nextUrl.origin);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    // User is authenticated and email was validated in signIn callback
    return NextResponse.next();
  }

  // Protect admin API routes
  if (pathname.startsWith("/api/admin")) {
    if (!isLoggedIn) {
      return NextResponse.json(
        { error: "Unauthorized", message: "Authentication required" },
        { status: 401 }
      );
    }
    // User is authenticated and email was validated in signIn callback
    return NextResponse.next();
  }

  return NextResponse.next();
});

export const config = {
  // Run proxy on admin routes and admin API routes
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
