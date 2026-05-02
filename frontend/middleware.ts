export { auth as middleware } from "@/auth";

export const config = {
  /*
   * Protect every route except:
   *  - /login (the sign-in page)
   *  - /auth-error (the error page)
   *  - /api/auth (NextAuth API routes)
   *  - /_next, /favicon.ico, and static assets
   */
  matcher: [
    "/((?!login|auth-error|api/auth|_next/static|_next/image|favicon\\.ico|.*\\.svg$).*)",
  ],
};
