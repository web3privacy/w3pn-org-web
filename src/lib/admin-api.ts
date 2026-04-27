/**
 * Admin session check for Route Handlers (reads Cookie header).
 */

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { ensureEnvLoaded } from "@/lib/ensure-env";
import {
  ADMIN_SESSION_COOKIE,
  getAdminAuthConfigError,
  getAdminAuthConfigErrorMessage,
  getAdminSessionSecret,
  readAdminSessionPayload,
  verifyAdminSessionToken,
} from "@/lib/admin-session";

export function extractSessionCookie(cookieHeader: string | null): string {
  if (!cookieHeader) return "";
  const parts = cookieHeader.split(";");
  for (const part of parts) {
    const [name, ...rest] = part.trim().split("=");
    if (name === ADMIN_SESSION_COOKIE && rest.length > 0) {
      return decodeURIComponent(rest.join("=").trim());
    }
  }
  return "";
}

/**
 * Set `Secure` on cookies only when the incoming request is HTTPS (or behind a TLS terminator
 * that sets `x-forwarded-proto: https`). Using `Secure` on plain HTTP would make browsers
 * reject the cookie — login would "succeed" but the session would never stick.
 */
export function shouldUseSecureCookie(request: Request): boolean {
  try {
    const url = new URL(request.url);
    if (url.protocol === "https:") return true;
  } catch {
    /* ignore */
  }
  const xf = request.headers.get("x-forwarded-proto");
  if (xf) {
    const first = xf.split(",")[0]?.trim().toLowerCase();
    if (first === "https") return true;
  }
  return false;
}

export async function readAdminSessionFromRequest(request: Request) {
  ensureEnvLoaded();
  const configError = getAdminAuthConfigError();
  if (configError) return null;
  const secret = getAdminSessionSecret();
  if (!secret) return null;
  const token = extractSessionCookie(request.headers.get("cookie"));
  return readAdminSessionPayload(token, secret);
}

/** Same rules as `shouldUseSecureCookie` for Server Actions (no Request URL). */
export async function shouldUseSecureCookieFromRequestHeaders(): Promise<boolean> {
  const h = await headers();
  const xf = h.get("x-forwarded-proto");
  if (xf) {
    const first = xf.split(",")[0]?.trim().toLowerCase();
    if (first === "https") return true;
  }
  return false;
}

/** Returns 401 JSON response if auth is required and session is invalid; otherwise null. */
export async function adminUnauthorizedResponse(request: Request): Promise<NextResponse | null> {
  ensureEnvLoaded();
  const configError = getAdminAuthConfigError();
  if (configError) {
    return NextResponse.json(
      { error: getAdminAuthConfigErrorMessage(configError) },
      { status: 503 }
    );
  }
  const secret = getAdminSessionSecret();
  if (!secret) {
    return NextResponse.json(
      { error: "Admin auth is misconfigured because ADMIN_SESSION_SECRET is not set." },
      { status: 503 }
    );
  }

  const token = extractSessionCookie(request.headers.get("cookie"));
  const ok = await verifyAdminSessionToken(token, secret);
  if (ok) return null;
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export function adminSessionCookieHeader(token: string, maxAgeSec: number, secure: boolean): string {
  const parts = [
    `${ADMIN_SESSION_COOKIE}=${encodeURIComponent(token)}`,
    "Path=/",
    `Max-Age=${maxAgeSec}`,
    "HttpOnly",
    "SameSite=Lax",
  ];
  if (secure) parts.push("Secure");
  return parts.join("; ");
}

export function clearAdminSessionCookieHeader(secure: boolean): string {
  const parts = [
    `${ADMIN_SESSION_COOKIE}=`,
    "Path=/",
    "Max-Age=0",
    "HttpOnly",
    "SameSite=Lax",
  ];
  if (secure) parts.push("Secure");
  return parts.join("; ");
}
