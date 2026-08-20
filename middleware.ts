import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED = ["/app", "/g", "/profile", "/onboarding"];

/**
 * Coarse gate: is there a session cookie at all? Per-group authorization is
 * enforced separately by requireMember/requireOwner in lib/auth-guard.ts —
 * this only keeps signed-out visitors off the app shell.
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (!PROTECTED.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return NextResponse.next();
  }

  const hasSession =
    req.cookies.has("authjs.session-token") ||
    req.cookies.has("__Secure-authjs.session-token");

  if (!hasSession) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/app/:path*", "/g/:path*", "/profile/:path*", "/onboarding"],
};
