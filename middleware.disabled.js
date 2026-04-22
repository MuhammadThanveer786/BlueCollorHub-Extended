import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { token } = req.nextauth;
    const isAuth = !!token;
    const isAuthPage = req.nextUrl.pathname.startsWith("/login") || req.nextUrl.pathname.startsWith("/register");

    // 1. Protect Admin Routes (The Invisible Shield)
    if (req.nextUrl.pathname.startsWith("/admin")) {
      if (!isAuth || token?.role !== "admin") {
        // Rewrite to a 404 page so non-admins don't even know the route exists
        return NextResponse.rewrite(new URL("/404", req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      // This ensures the middleware function above is always called, 
      // even if the user doesn't have a token yet.
      authorized: () => true, 
    },
  }
);

// Apply this middleware ONLY to the admin routes to keep your app fast
export const config = { 
  matcher: ["/admin/:path*"] 
};