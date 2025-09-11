import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"
import { UserRole } from "@prisma/client"

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl
    const token = req.nextauth.token

    // Admin routes
    if (pathname.startsWith("/admin")) {
      if (token?.role !== UserRole.ADMIN) {
        return NextResponse.redirect(new URL("/unauthorized", req.url))
      }
    }

    // Finance routes
    if (pathname.startsWith("/finance")) {
      if (token?.role !== UserRole.FINANCE && token?.role !== UserRole.ADMIN) {
        return NextResponse.redirect(new URL("/unauthorized", req.url))
      }
    }

    // Supplier routes
    if (pathname.startsWith("/supplier")) {
      if (token?.role !== UserRole.SUPPLIER && token?.role !== UserRole.ADMIN) {
        return NextResponse.redirect(new URL("/unauthorized", req.url))
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl

        // Public routes
        if (pathname.startsWith("/auth") || pathname === "/" || pathname.startsWith("/api/auth")) {
          return true
        }

        // Protected routes require authentication
        return !!token
      },
    },
  },
)

export const config = {
  matcher: [
    "/admin/:path*",
    "/finance/:path*",
    "/supplier/:path*",
    "/buyer/:path*",
    "/dashboard/:path*",
    "/cart/:path*",
    "/orders/:path*",
    "/profile/:path*",
  ],
}
