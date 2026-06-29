import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/auth/login",
    },
  }
);

// Áp dụng middleware cho tất cả route TRỪ auth pages và static files
export const config = {
  matcher: [
    "/((?!auth|_next/static|_next/image|favicon.ico|api/auth).*)",
  ],
};
