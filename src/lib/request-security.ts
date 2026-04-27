import { NextResponse } from "next/server";

function forwardedOrigin(request: Request): string {
  const protoHeader = request.headers.get("x-forwarded-proto");
  const hostHeader = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (protoHeader && hostHeader) {
    const proto = protoHeader.split(",")[0]?.trim();
    const host = hostHeader.split(",")[0]?.trim();
    if (proto && host) return `${proto}://${host}`;
  }
  return new URL(request.url).origin;
}

function originFromHeader(value: string | null): string | null {
  if (!value) return null;
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

/**
 * Best-effort CSRF hardening for browser-initiated mutations.
 * Requests without Origin/Referer are allowed so local CLI and scripted calls keep working.
 */
export function blockCrossSiteMutation(request: Request): NextResponse | null {
  const sourceOrigin =
    originFromHeader(request.headers.get("origin")) ??
    originFromHeader(request.headers.get("referer"));

  if (!sourceOrigin) return null;

  const requestOrigin = forwardedOrigin(request);
  if (sourceOrigin === requestOrigin) return null;

  return NextResponse.json({ error: "Cross-site request blocked." }, { status: 403 });
}
