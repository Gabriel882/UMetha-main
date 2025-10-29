import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

// ✅ Helper: Which routes are protected
function isProtectedRoute(path: string): boolean {
  const protectedPaths = [
    "/dashboard",
    "/orders",
    "/profile",
    "/api/dashboard",
    "/api/orders",
  ];

  // dev-access pages always allowed
  if (path === "/dev-access" || path.startsWith("/dev-access/")) return false;

  return protectedPaths.some((prefix) => path.startsWith(prefix));
}

// ✅ Helper: Role-based dashboard redirect
function getDashboardPathForRole(role: string): string {
  const normalizedRole = (role || "").toUpperCase();
  switch (normalizedRole) {
    case "ADMIN":
      return "/dashboard/admin";
    case "INFLUENCER":
      return "/dashboard/influencer";
    case "SELLER":
      return "/dashboard/seller";
    case "USER":
      return "/";
    default:
      return "/dashboard-signin";
  }
}

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  console.log(`[Middleware] Processing request for path: ${path}`);

  // ✅ Always allow dev-access page
  if (path === "/dev-access" || path.startsWith("/dev-access/")) {
    console.log("[Middleware] Dev access page detected - bypassing all checks");
    return NextResponse.next();
  }

  // ✅ Allow checkout route (public)
  if (path.startsWith("/checkout")) return NextResponse.next();

  // ✅ OPTION 1: Dev bypass cookie (simple local testing)
  const devBypass = req.cookies.get("dashboard-dev-bypass")?.value;
  if (devBypass === "true" && path.startsWith("/dashboard")) {
    console.log("[Middleware] Dev bypass cookie detected - allowing dashboard access");
    return NextResponse.next();
  }

  // ✅ Temporarily disable authentication checks for now
  console.log("[Middleware] Authentication checks disabled for now.");
  return NextResponse.next(); // Skipping auth checks, allowing all routes
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/orders/:path*",
    "/profile/:path*",
    "/api/dashboard/:path*",
    "/api/orders/:path*",
    "/checkout/:path*",
    "/signin",
    "/signin/",
    "/dashboard-signin",
    "/dashboard-signin/",
  ],
};
