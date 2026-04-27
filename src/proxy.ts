import { NextResponse, type NextRequest } from "next/server";

/**
 * Inject pathname/search for server layouts (admin-auth-server). Do not gate HTML or API
 * auth here: Edge cannot reliably read ADMIN_PASSWORD from .env; Node route handlers and
 * layouts use ensureEnvLoaded() + session verification instead.
 */
export function proxy(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-middleware-pathname", request.nextUrl.pathname);
  requestHeaders.set("x-middleware-search", request.nextUrl.search);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    "/admin",
    "/admin/:path*",
    "/about/admin",
    "/about/admin/:path*",
    "/events/admin",
    "/events/admin/:path*",
  ],
};
